import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { CreateSeckillActivityDto } from './dto/create-seckill.dto';
import { SeckillQueryDto } from './dto/seckill-query.dto';

const ORDER_STATUS_PENDING_PAY = 0;

@Injectable()
export class SeckillService {
  constructor(private prisma: PrismaService) {}

  async createActivity(dto: CreateSeckillActivityDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (startAt >= endAt) {
      throw new AppException(ErrorCode.BAD_REQUEST, '开始时间必须早于结束时间');
    }

    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.seckillActivity.create({
        data: { name: dto.name, startAt, endAt, status: 1 },
      });
      for (const item of dto.products) {
        await tx.seckillProduct.create({
          data: {
            activityId: activity.id,
            skuId: item.skuId,
            seckillPrice: new Prisma.Decimal(item.seckillPrice),
            stock: item.stock,
            limitPerUser: item.limitPerUser,
          },
        });
      }
      return this.toActivityResponse(activity);
    });
  }

  async listActivities(query: SeckillQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where: Prisma.SeckillActivityWhereInput = {};
    if (query.status !== undefined) where.status = query.status;

    const [list, total] = await this.prisma.$transaction([
      this.prisma.seckillActivity.findMany({
        where,
        orderBy: { startAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.seckillActivity.count({ where }),
    ]);

    return { list: list.map((a) => this.toActivityResponse(a)), total, page, pageSize };
  }

  async listActivityProducts(activityId: number) {
    const activity = await this.prisma.seckillActivity.findUnique({ where: { id: activityId } });
    if (!activity) throw new AppException(ErrorCode.NOT_FOUND, '秒杀场次不存在');

    const products = await this.prisma.seckillProduct.findMany({
      where: { activityId },
      orderBy: { id: 'asc' },
    });

    const skuIds = products.map((p) => p.skuId);
    const skus = await this.prisma.sku.findMany({
      where: { id: { in: skuIds } },
      include: { spu: true },
    });
    const skuMap = new Map(skus.map((s) => [s.id, s]));

    return products.map((p) => {
      const sku = skuMap.get(p.skuId);
      return {
        id: p.id,
        skuId: p.skuId,
        seckillPrice: p.seckillPrice.toFixed(2),
        stock: p.stock,
        soldCount: p.soldCount,
        limitPerUser: p.limitPerUser,
        sku: sku
          ? {
              id: sku.id,
              price: sku.price.toFixed(2),
              image: sku.image,
              spuTitle: sku.spu.title,
              mainImg: sku.spu.mainImg,
            }
          : null,
      };
    });
  }

  /**
   * 秒杀下单：独立库存扣减 + 创建 PENDING_PAY 订单
   */
  async buy(userId: number, seckillProductId: number, quantity: number, addressId: number) {
    return this.prisma.$transaction(async (tx) => {
      const sp = await tx.seckillProduct.findUnique({
        where: { id: seckillProductId },
      });
      if (!sp) throw new AppException(ErrorCode.NOT_FOUND, '秒杀商品不存在');

      const activity = await tx.seckillActivity.findUnique({ where: { id: sp.activityId } });
      if (!activity) throw new AppException(ErrorCode.NOT_FOUND, '秒杀场次不存在');

      const now = new Date();
      if (activity.status !== 1 || now < activity.startAt || now > activity.endAt) {
        throw new AppException(ErrorCode.BAD_REQUEST, '秒杀活动不在进行中');
      }

      if (quantity > sp.limitPerUser) {
        throw new AppException(ErrorCode.BAD_REQUEST, `每人限购 ${sp.limitPerUser} 件`);
      }

      // 乐观锁扣秒杀库存
      const r = await tx.$executeRaw`
        UPDATE seckill_products
        SET sold_count = sold_count + ${quantity}
        WHERE id = ${seckillProductId} AND stock - sold_count >= ${quantity}
      `;
      if (r === 0) throw new AppException(ErrorCode.CONFLICT, '秒杀库存不足');

      const sku = await tx.sku.findUnique({
        where: { id: sp.skuId },
        include: { spu: true },
      });
      if (!sku) throw new AppException(ErrorCode.NOT_FOUND, 'SKU 不存在');

      const address = await tx.userAddress.findUnique({ where: { id: addressId } });
      if (!address || address.userId !== userId) {
        throw new AppException(ErrorCode.NOT_FOUND, '收货地址不存在');
      }

      // 锁主库存（复用 P4 逻辑）
      const lockR = await tx.$executeRaw`
        UPDATE skus
        SET locked_stock = locked_stock + ${quantity}
        WHERE id = ${sp.skuId} AND stock - locked_stock >= ${quantity}
      `;
      if (lockR === 0) throw new AppException(ErrorCode.CONFLICT, '主库存不足');

      const orderNo = this.genOrderNo();
      const amount = new Prisma.Decimal(sp.seckillPrice).mul(quantity);

      const order = await tx.order.create({
        data: {
          orderNo,
          userId,
          shopId: sku.spu.shopId,
          totalAmount: amount,
          payAmount: amount,
          freightAmount: new Prisma.Decimal(0),
          discountAmount: new Prisma.Decimal(0),
          status: ORDER_STATUS_PENDING_PAY,
          payStatus: 0,
          shipStatus: 0,
          receiverJson: {
            receiver: address.receiver,
            phone: address.phone,
            province: address.province,
            city: address.city,
            district: address.district,
            detail: address.detail,
            tag: address.tag,
          },
          buyerRemark: `秒杀活动：${activity.name}`,
          channel: 1,
        },
      });

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          spuId: sku.spuId,
          skuId: sp.skuId,
          spuTitle: sku.spu.title,
          skuSpec: sku.specJson as Prisma.InputJsonValue,
          skuImage: sku.image,
          price: sp.seckillPrice,
          quantity,
          total: amount,
          refundStatus: 0,
        },
      });

      return {
        orderNo: order.orderNo,
        payAmount: order.payAmount.toFixed(2),
        seckillPrice: sp.seckillPrice.toFixed(2),
      };
    });
  }

  private genOrderNo(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${ts}${rand}`;
  }

  private toActivityResponse(a: {
    id: number;
    name: string;
    startAt: Date;
    endAt: Date;
    status: number;
  }) {
    return {
      id: a.id,
      name: a.name,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      status: a.status,
    };
  }
}