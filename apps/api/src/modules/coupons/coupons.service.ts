import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Coupon, UserCoupon } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';
import {
  PaginatedResponseDto,
  toPaginated,
} from '../../common/dto/paginated-response.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { CouponQueryDto } from './dto/coupon-query.dto';
import type { CreateCouponDto } from './dto/create-coupon.dto';
import type {
  CouponResponseDto,
  UserCouponResponseDto,
} from './dto/coupon-response.dto';

/** 一期固定店铺 id（P9 商家模块接入真实店铺后再改为从 AuthUser/Shop 查） */
const DEFAULT_SHOP_ID = 1;

export interface AvailableCouponsResult {
  platformCoupons: UserCouponResponseDto[];
  shopCoupons: UserCouponResponseDto[];
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 商家创建券（固定给自己的店铺） */
  async create(dto: CreateCouponDto): Promise<CouponResponseDto> {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new AppException(ErrorCode.BAD_REQUEST, '时间格式不正确');
    }
    if (endAt.getTime() <= startAt.getTime()) {
      throw new AppException(ErrorCode.BAD_REQUEST, '结束时间需晚于开始时间');
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        shopId: DEFAULT_SHOP_ID,
        name: dto.name,
        type: dto.type,
        value: new Prisma.Decimal(dto.value),
        minAmount: new Prisma.Decimal(dto.minAmount),
        totalCount: dto.totalCount,
        perUserLimit: dto.perUserLimit ?? 1,
        startAt,
        endAt,
        status: dto.status ?? 1,
      },
    });

    return this.serializeCoupon(coupon);
  }

  /** 领券中心（公开）：status=1 且在有效期内 */
  async listPublic(
    query: CouponQueryDto,
  ): Promise<PaginatedResponseDto<CouponResponseDto>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const now = new Date();

    const where: Prisma.CouponWhereInput = {
      status: 1,
      startAt: { lte: now },
      endAt: { gte: now },
    };
    if (query.type !== undefined) {
      where.type = query.type;
    }
    if (query.shopId !== undefined) {
      where.shopId = query.shopId;
    }

    const [list, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return toPaginated(
      list.map((c) => this.serializeCoupon(c)),
      total,
      page,
      pageSize,
    );
  }

  /** 商家券列表（只查自己的店铺） */
  async listSeller(
    query: CouponQueryDto,
  ): Promise<PaginatedResponseDto<CouponResponseDto>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.CouponWhereInput = { shopId: DEFAULT_SHOP_ID };
    if (query.status !== undefined) {
      where.status = query.status;
    }
    if (query.type !== undefined) {
      where.type = query.type;
    }

    const [list, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return toPaginated(
      list.map((c) => this.serializeCoupon(c)),
      total,
      page,
      pageSize,
    );
  }

  /** 买家领券：事务内校验 + 乐观锁扣库存 + 插入用户券 */
  async receive(userId: string, couponId: number): Promise<UserCouponResponseDto> {
    const uid = Number(userId);
    const now = new Date();

    const userCoupon = await this.prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!coupon) {
        throw new AppException(ErrorCode.NOT_FOUND, '优惠券不存在');
      }
      if (coupon.status !== 1) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, '优惠券未启用');
      }
      if (coupon.startAt > now || coupon.endAt < now) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, '不在领券有效期内');
      }

      const received = await tx.userCoupon.count({
        where: { userId: uid, couponId },
      });
      if (received >= coupon.perUserLimit) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, '已达领取上限');
      }

      const updated = await tx.coupon.updateMany({
        where: { id: coupon.id, receivedCount: { lt: coupon.totalCount } },
        data: { receivedCount: { increment: 1 } },
      });
      if (updated.count === 0) {
        throw new AppException(ErrorCode.CONFLICT, '优惠券已领完');
      }

      return tx.userCoupon.create({
        data: {
          userId: uid,
          couponId: coupon.id,
          status: 0,
          receivedAt: now,
          expiredAt: coupon.endAt,
        },
      });
    });

    return this.serializeUserCoupon(userCoupon);
  }

  /** 我的券（可选 status 筛选） */
  async my(userId: string, status?: string): Promise<UserCouponResponseDto[]> {
    const uid = Number(userId);

    const where: Prisma.UserCouponWhereInput = { userId: uid };
    if (status !== undefined && status !== '') {
      const s = Number(status);
      if (Number.isInteger(s)) {
        where.status = s;
      }
    }

    const list = await this.prisma.userCoupon.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
    });

    const couponMap = await this.loadCouponMap(list.map((u) => u.couponId));
    return list.map((u) => this.serializeUserCoupon(u, couponMap.get(u.couponId)));
  }

  /** 下单时可用券：按 shopId + amount 过滤，返回平台券 + 店铺券 */
  async available(
    userId: string,
    shopId: number,
    amount: string,
  ): Promise<AvailableCouponsResult> {
    const uid = Number(userId);
    const now = new Date();
    const amt = new Prisma.Decimal(amount);

    const eligibleCoupons = await this.prisma.coupon.findMany({
      where: {
        status: 1,
        startAt: { lte: now },
        endAt: { gte: now },
        minAmount: { lte: amt },
        OR: [{ shopId: null }, { shopId }],
      },
    });

    const couponMap = new Map(eligibleCoupons.map((c) => [c.id, c]));
    const list = await this.prisma.userCoupon.findMany({
      where: {
        userId: uid,
        status: 0,
        expiredAt: { gt: now },
        couponId: { in: [...couponMap.keys()] },
      },
      orderBy: { receivedAt: 'desc' },
    });

    const platformCoupons: UserCouponResponseDto[] = [];
    const shopCoupons: UserCouponResponseDto[] = [];
    for (const u of list) {
      const coupon = couponMap.get(u.couponId);
      if (!coupon) {
        continue;
      }
      const dto = this.serializeUserCoupon(u, coupon);
      if (coupon.shopId === null) {
        platformCoupons.push(dto);
      } else {
        shopCoupons.push(dto);
      }
    }

    return { platformCoupons, shopCoupons };
  }

  private async loadCouponMap(couponIds: number[]): Promise<Map<number, Coupon>> {
    const ids = [...new Set(couponIds)];
    if (ids.length === 0) {
      return new Map();
    }
    const coupons = await this.prisma.coupon.findMany({
      where: { id: { in: ids } },
    });
    return new Map(coupons.map((c) => [c.id, c]));
  }

  private serializeCoupon(c: Coupon): CouponResponseDto {
    return {
      id: c.id,
      shopId: c.shopId,
      name: c.name,
      type: c.type,
      value: c.value.toFixed(2),
      minAmount: c.minAmount.toFixed(2),
      totalCount: c.totalCount,
      receivedCount: c.receivedCount,
      usedCount: c.usedCount,
      perUserLimit: c.perUserLimit,
      startAt: c.startAt,
      endAt: c.endAt,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  private serializeUserCoupon(
    u: UserCoupon,
    coupon?: Coupon,
  ): UserCouponResponseDto {
    return {
      id: u.id,
      userId: u.userId,
      couponId: u.couponId,
      orderId: u.orderId,
      status: u.status,
      receivedAt: u.receivedAt,
      usedAt: u.usedAt,
      expiredAt: u.expiredAt,
      coupon: coupon ? this.serializeCoupon(coupon) : undefined,
    };
  }
}
