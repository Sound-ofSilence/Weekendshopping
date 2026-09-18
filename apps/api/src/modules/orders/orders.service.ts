import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Order, OrderItem } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponseDto, toPaginated } from '../../common/dto/paginated-response.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import type { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { OrderStatus } from './order-status.constant';

/** 拆单后的单条明细（已完成 SKU/SPU 校验） */
interface ResolvedItem {
  skuId: number;
  spuId: number;
  shopId: number;
  title: string;
  specJson: Prisma.JsonValue;
  image: string | null;
  price: Prisma.Decimal;
  quantity: number;
  cartId?: number;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async preview(userId: string, dto: CreateOrderDto): Promise<Record<string, unknown>> {
    const uid = Number(userId);
    await this.assertAddress(uid, dto.addressId);
    const resolved = await this.resolveItems(this.prisma, uid, dto.items);

    const totalAmount = this.sumAmount(resolved);
    const freightAmount = new Prisma.Decimal(0);
    const discountAmount = new Prisma.Decimal(0);
    const payAmount = totalAmount.add(freightAmount).sub(discountAmount);

    const shopGroups = this.groupByShop(resolved).map((g) => ({
      shopId: g.shopId,
      amount: this.sumAmount(g.items).toFixed(2),
      items: g.items.map((i) => this.serializeResolvedItem(i)),
    }));

    return {
      totalAmount: totalAmount.toFixed(2),
      freightAmount: freightAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      payAmount: payAmount.toFixed(2),
      items: resolved.map((i) => this.serializeResolvedItem(i)),
      shopGroups,
    };
  }

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
    requestId: string,
    channel?: string,
  ): Promise<Record<string, unknown>[]> {
    const uid = Number(userId);
    const channelCode = this.parseChannel(channel);

    const idempotentKey = requestId ? `order:idempotent:${uid}:${requestId}` : '';
    if (idempotentKey) {
      const cached = await this.redis.get(idempotentKey);
      if (cached) {
        return JSON.parse(cached) as Record<string, unknown>[];
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const receiverJson = await this.buildReceiverJson(tx, uid, dto.addressId);
      const resolved = await this.resolveItems(tx, uid, dto.items);

      const orders: Array<{ order: Order; items: ResolvedItem[] }> = [];
      for (const group of this.groupByShop(resolved)) {
        const totalAmount = this.sumAmount(group.items);
        const freightAmount = new Prisma.Decimal(0);
        const discountAmount = new Prisma.Decimal(0);
        const payAmount = totalAmount.add(freightAmount).sub(discountAmount);
        const orderNo = this.genOrderNo();

        const order = await tx.order.create({
          data: {
            orderNo,
            userId: uid,
            shopId: group.shopId,
            totalAmount,
            payAmount,
            freightAmount,
            discountAmount,
            status: OrderStatus.PENDING_PAY,
            payStatus: 0,
            shipStatus: 0,
            receiverJson,
            buyerRemark: dto.buyerRemark,
            channel: channelCode,
          },
        });

        await tx.orderItem.createMany({
          data: group.items.map((i) => ({
            orderId: order.id,
            spuId: i.spuId,
            skuId: i.skuId,
            spuTitle: i.title,
            skuSpec: i.specJson as Prisma.InputJsonValue,
            skuImage: i.image,
            price: i.price,
            quantity: i.quantity,
            total: i.price.mul(i.quantity),
          })),
        });

        for (const i of group.items) {
          const r = await tx.$executeRaw`UPDATE skus SET locked_stock = locked_stock + ${i.quantity} WHERE id = ${i.skuId} AND stock - locked_stock >= ${i.quantity}`;
          if (r === 0) {
            throw new AppException(ErrorCode.CONFLICT, '库存不足');
          }
        }

        orders.push({ order, items: group.items });
      }

      const cartIds = resolved
        .filter((i) => i.cartId !== undefined)
        .map((i) => i.cartId as number);
      if (cartIds.length > 0) {
        await tx.cart.deleteMany({ where: { id: { in: cartIds }, userId: uid } });
      }

      return orders;
    });

    const payload = result.map(({ order, items }) =>
      this.serializeOrderWithItems(order, items),
    );

    if (idempotentKey) {
      await this.redis.set(idempotentKey, JSON.stringify(payload), 300);
    }

    return payload;
  }

  async list(
    userId: string,
    query: PaginationQueryDto,
    status?: string,
  ): Promise<PaginatedResponseDto<Record<string, unknown>>> {
    const uid = Number(userId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.OrderWhereInput = { userId: uid };
    if (status !== undefined && status !== '') {
      const s = Number(status);
      if (Number.isInteger(s)) {
        where.status = s;
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return toPaginated(
      orders.map((o) => this.serializeOrder(o)),
      total,
      page,
      pageSize,
    );
  }

  async detail(userId: string, orderNo: string): Promise<Record<string, unknown>> {
    const uid = Number(userId);
    const order = await this.prisma.order.findFirst({
      where: { orderNo, userId: uid },
      include: { items: true },
    });
    if (!order) {
      throw new AppException(ErrorCode.NOT_FOUND, '订单不存在');
    }
    return {
      ...this.serializeOrder(order),
      items: order.items.map((i) => this.serializeOrderItem(i)),
    };
  }

  async cancel(userId: string, orderNo: string): Promise<null> {
    const uid = Number(userId);
    const order = await this.prisma.order.findFirst({ where: { orderNo, userId: uid } });
    if (!order) {
      throw new AppException(ErrorCode.NOT_FOUND, '订单不存在');
    }
    if (order.status !== OrderStatus.PENDING_PAY) {
      throw new AppException(ErrorCode.CONFLICT, '仅待付款订单可取消');
    }

    await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findFirst({ where: { id: order.id } });
      if (!current || current.status !== OrderStatus.PENDING_PAY) {
        throw new AppException(ErrorCode.CONFLICT, '仅待付款订单可取消');
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED, closedAt: new Date() },
      });

      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        await tx.$executeRaw`UPDATE skus SET locked_stock = locked_stock - ${item.quantity} WHERE id = ${item.skuId} AND locked_stock >= ${item.quantity}`;
      }
    });

    return null;
  }

  private async assertAddress(userId: number, addressId: number): Promise<void> {
    const address = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new AppException(ErrorCode.NOT_FOUND, '收货地址不存在');
    }
  }

  private async buildReceiverJson(
    db: Prisma.TransactionClient,
    userId: number,
    addressId: number,
  ): Promise<Prisma.InputJsonValue> {
    const address = await db.userAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new AppException(ErrorCode.NOT_FOUND, '收货地址不存在');
    }
    return {
      receiver: address.receiver,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      detail: address.detail,
    };
  }

  private async resolveItems(
    db: Prisma.TransactionClient,
    userId: number,
    items: CreateOrderItemDto[],
  ): Promise<ResolvedItem[]> {
    const resolved: ResolvedItem[] = [];
    for (const item of items) {
      let skuId: number;
      let quantity: number;
      let cartId: number | undefined;

      if (item.cartId) {
        const cart = await db.cart.findFirst({ where: { id: item.cartId, userId } });
        if (!cart) {
          throw new AppException(ErrorCode.NOT_FOUND, '购物车项不存在');
        }
        skuId = cart.skuId;
        quantity = cart.quantity;
        cartId = cart.id;
      } else if (item.skuId && item.quantity) {
        skuId = item.skuId;
        quantity = item.quantity;
      } else {
        throw new AppException(ErrorCode.BAD_REQUEST, '需提供 cartId 或 skuId + quantity');
      }

      const sku = await db.sku.findUnique({ where: { id: skuId } });
      if (!sku) {
        throw new AppException(ErrorCode.NOT_FOUND, 'SKU 不存在');
      }
      if (sku.status !== 1) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, 'SKU 已下架');
      }

      const spu = await db.spu.findUnique({ where: { id: sku.spuId } });
      if (!spu) {
        throw new AppException(ErrorCode.NOT_FOUND, '商品不存在');
      }
      if (spu.status !== 1) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, '商品已下架');
      }

      if (sku.stock - sku.lockedStock < quantity) {
        throw new AppException(ErrorCode.CONFLICT, '库存不足');
      }

      resolved.push({
        skuId: sku.id,
        spuId: spu.id,
        shopId: spu.shopId,
        title: spu.title,
        specJson: sku.specJson,
        image: sku.image,
        price: sku.price,
        quantity,
        cartId,
      });
    }
    return resolved;
  }

  private groupByShop(items: ResolvedItem[]): Array<{ shopId: number; items: ResolvedItem[] }> {
    const map = new Map<number, ResolvedItem[]>();
    for (const i of items) {
      const list = map.get(i.shopId) ?? [];
      list.push(i);
      map.set(i.shopId, list);
    }
    return Array.from(map.entries()).map(([shopId, groupItems]) => ({
      shopId,
      items: groupItems,
    }));
  }

  private sumAmount(items: ResolvedItem[]): Prisma.Decimal {
    return items.reduce(
      (sum, i) => sum.add(i.price.mul(i.quantity)),
      new Prisma.Decimal(0),
    );
  }

  private genOrderNo(): string {
    const now = new Date();
    const p = (n: number, w = 2): string => String(n).padStart(w, '0');
    const rand = p(Math.floor(Math.random() * 1_000_000), 6);
    return (
      `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}` +
      `${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}${rand}`
    );
  }

  private parseChannel(channel?: string): number {
    if (!channel) {
      return 0;
    }
    const n = Number(channel);
    if (!Number.isNaN(n)) {
      return n;
    }
    const map: Record<string, number> = { web: 0, h5: 1, app: 2, miniapp: 3 };
    return map[channel.toLowerCase()] ?? 0;
  }

  private serializeResolvedItem(i: ResolvedItem): Record<string, unknown> {
    return {
      skuId: i.skuId,
      spuId: i.spuId,
      spuTitle: i.title,
      skuSpec: i.specJson,
      skuImage: i.image,
      price: i.price.toFixed(2),
      quantity: i.quantity,
      total: i.price.mul(i.quantity).toFixed(2),
    };
  }

  private serializeOrder(order: Order): Record<string, unknown> {
    return {
      id: order.id,
      orderNo: order.orderNo,
      shopId: order.shopId,
      totalAmount: order.totalAmount.toFixed(2),
      payAmount: order.payAmount.toFixed(2),
      freightAmount: order.freightAmount.toFixed(2),
      discountAmount: order.discountAmount.toFixed(2),
      status: order.status,
      payStatus: order.payStatus,
      shipStatus: order.shipStatus,
      receiverJson: order.receiverJson,
      buyerRemark: order.buyerRemark,
      channel: order.channel,
      createdAt: order.createdAt,
    };
  }

  private serializeOrderWithItems(
    order: Order,
    items: ResolvedItem[],
  ): Record<string, unknown> {
    return {
      ...this.serializeOrder(order),
      items: items.map((i) => this.serializeResolvedItem(i)),
    };
  }

  private serializeOrderItem(item: OrderItem): Record<string, unknown> {
    return {
      id: item.id,
      spuId: item.spuId,
      skuId: item.skuId,
      spuTitle: item.spuTitle,
      skuSpec: item.skuSpec,
      skuImage: item.skuImage,
      price: item.price.toFixed(2),
      quantity: item.quantity,
      total: item.total.toFixed(2),
      refundStatus: item.refundStatus,
    };
  }
}
