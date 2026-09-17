import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductStatus } from '../products/constants/product-status.enum';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

/** SKU 上架状态值（Sku.status 默认 1 表示上架可用）。 */
const SKU_STATUS_ON_SALE = 1;

type SkuWithSpu = Prisma.SkuGetPayload<{ include: { spu: true } }>;

export interface CartItemResponse {
  id: number;
  skuId: number;
  spuId: number;
  title: string;
  specJson: unknown;
  image: string | null;
  price: string;
  quantity: number;
  selected: boolean;
  stock: number;
  isInvalid: boolean;
}

export interface CartShopGroupResponse {
  shopId: number;
  items: CartItemResponse[];
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: number): Promise<CartShopGroupResponse[]> {
    const rows = await this.prisma.cart.findMany({ where: { userId }, orderBy: { id: 'desc' } });

    const skuIds = rows.map((row) => row.skuId);
    const skus = skuIds.length
      ? await this.prisma.sku.findMany({ where: { id: { in: skuIds } }, include: { spu: true } })
      : [];
    const skuMap = new Map(skus.map((sku) => [sku.id, sku]));

    const groups = new Map<number, CartItemResponse[]>();
    for (const row of rows) {
      const sku = skuMap.get(row.skuId);
      const item: CartItemResponse = {
        id: row.id,
        skuId: row.skuId,
        spuId: sku?.spuId ?? 0,
        title: sku?.spu.title ?? '',
        specJson: sku?.specJson ?? null,
        image: sku?.image ?? null,
        price: sku ? sku.price.toFixed(2) : '0.00',
        quantity: row.quantity,
        selected: row.selected,
        stock: sku?.stock ?? 0,
        isInvalid: !sku || this.isSkuInvalid(sku),
      };
      const list = groups.get(row.shopId) ?? [];
      list.push(item);
      groups.set(row.shopId, list);
    }

    return Array.from(groups.entries()).map(([shopId, items]) => ({ shopId, items }));
  }

  async addItem(userId: number, dto: AddCartItemDto): Promise<void> {
    const quantity = dto.quantity ?? 1;

    await this.prisma.$transaction(async (tx) => {
      const sku = await tx.sku.findUnique({ where: { id: dto.skuId }, include: { spu: true } });
      if (!sku) {
        throw new AppException(ErrorCode.NOT_FOUND, 'SKU 不存在', HttpStatus.NOT_FOUND);
      }
      if (sku.status !== SKU_STATUS_ON_SALE) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, 'SKU 已下架', HttpStatus.BAD_REQUEST);
      }
      if (sku.spu.deletedAt || sku.spu.status !== ProductStatus.ON_SALE) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, '商品已下架', HttpStatus.BAD_REQUEST);
      }

      const existing = await tx.cart.findUnique({
        where: { userId_skuId: { userId, skuId: dto.skuId } },
      });
      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      if (nextQuantity > sku.stock) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, '库存不足', HttpStatus.BAD_REQUEST);
      }

      if (existing) {
        await tx.cart.update({ where: { id: existing.id }, data: { quantity: nextQuantity } });
      } else {
        await tx.cart.create({
          data: { userId, shopId: sku.spu.shopId, skuId: dto.skuId, quantity },
        });
      }
    });
  }

  async updateItem(userId: number, id: number, dto: UpdateCartItemDto): Promise<void> {
    if (dto.quantity === undefined && dto.selected === undefined) {
      throw new AppException(ErrorCode.BAD_REQUEST, '请提供 quantity 或 selected', HttpStatus.BAD_REQUEST);
    }

    const row = await this.prisma.cart.findFirst({ where: { id, userId } });
    if (!row) {
      throw new AppException(ErrorCode.NOT_FOUND, '购物车项不存在', HttpStatus.NOT_FOUND);
    }

    const data: Prisma.CartUpdateInput = {};
    if (dto.selected !== undefined) {
      data.selected = dto.selected;
    }
    if (dto.quantity !== undefined) {
      const sku = await this.prisma.sku.findUnique({ where: { id: row.skuId } });
      if (!sku || sku.status !== SKU_STATUS_ON_SALE) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, 'SKU 已下架', HttpStatus.BAD_REQUEST);
      }
      if (dto.quantity > sku.stock) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, '库存不足', HttpStatus.BAD_REQUEST);
      }
      data.quantity = dto.quantity;
    }

    await this.prisma.cart.update({ where: { id }, data });
  }

  async removeItem(userId: number, id: number): Promise<void> {
    const { count } = await this.prisma.cart.deleteMany({ where: { id, userId } });
    if (count === 0) {
      throw new AppException(ErrorCode.NOT_FOUND, '购物车项不存在', HttpStatus.NOT_FOUND);
    }
  }

  async removeInvalid(userId: number): Promise<void> {
    const rows = await this.prisma.cart.findMany({ where: { userId } });
    if (rows.length === 0) {
      return;
    }

    const skuIds = rows.map((row) => row.skuId);
    const skus = await this.prisma.sku.findMany({ where: { id: { in: skuIds } }, include: { spu: true } });
    const skuMap = new Map(skus.map((sku) => [sku.id, sku]));

    const invalidIds = rows
      .filter((row) => {
        const sku = skuMap.get(row.skuId);
        return !sku || this.isSkuInvalid(sku);
      })
      .map((row) => row.id);

    if (invalidIds.length > 0) {
      await this.prisma.cart.deleteMany({ where: { id: { in: invalidIds }, userId } });
    }
  }

  private isSkuInvalid(sku: SkuWithSpu): boolean {
    return (
      sku.status !== SKU_STATUS_ON_SALE ||
      sku.stock <= 0 ||
      sku.spu.deletedAt !== null ||
      sku.spu.status !== ProductStatus.ON_SALE
    );
  }
}
