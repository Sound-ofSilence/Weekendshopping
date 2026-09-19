import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { CreatePromotionDto, PromotionRuleDto } from './dto/create-promotion.dto';

const DEFAULT_SHOP_ID = 1;

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePromotionDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (startAt >= endAt) {
      throw new AppException(ErrorCode.BAD_REQUEST, '开始时间必须早于结束时间');
    }
    const created = await this.prisma.promotion.create({
      data: {
        shopId: DEFAULT_SHOP_ID,
        name: dto.name,
        rulesJson: dto.rules as unknown as Prisma.InputJsonValue,
        startAt,
        endAt,
        status: 1,
      },
    });
    return this.toResponse(created);
  }

  async list(query: { page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where: Prisma.PromotionWhereInput = { shopId: DEFAULT_SHOP_ID };
    const [list, total] = await this.prisma.$transaction([
      this.prisma.promotion.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.promotion.count({ where }),
    ]);
    return { list: list.map((p) => this.toResponse(p)), total, page, pageSize };
  }

  async update(id: number, dto: Partial<CreatePromotionDto>) {
    const promotion = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promotion || promotion.shopId !== DEFAULT_SHOP_ID) {
      throw new AppException(ErrorCode.NOT_FOUND, '满减活动不存在');
    }
    const data: Prisma.PromotionUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.rules !== undefined) data.rulesJson = dto.rules as unknown as Prisma.InputJsonValue;
    if (dto.startAt !== undefined) data.startAt = new Date(dto.startAt);
    if (dto.endAt !== undefined) data.endAt = new Date(dto.endAt);
    const updated = await this.prisma.promotion.update({ where: { id }, data });
    return this.toResponse(updated);
  }

  async remove(id: number) {
    const promotion = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promotion || promotion.shopId !== DEFAULT_SHOP_ID) {
      throw new AppException(ErrorCode.NOT_FOUND, '满减活动不存在');
    }
    await this.prisma.promotion.delete({ where: { id } });
    return { id };
  }

  /**
   * 计算最优满减：从所有满足 min 的规则里取 reduce 最大的那一档
   */
  computeBestReduction(rules: PromotionRuleDto[], amount: string): string {
    const amt = new Prisma.Decimal(amount);
    let best = new Prisma.Decimal(0);
    for (const rule of rules) {
      const min = new Prisma.Decimal(rule.min);
      const reduce = new Prisma.Decimal(rule.reduce);
      if (amt.gte(min) && reduce.gt(best)) {
        best = reduce;
      }
    }
    return best.toFixed(2);
  }

  /**
   * 获取某商家当前生效的满减（时间范围内 + status=1）
   */
  async getActiveByShop(shopId: number) {
    const now = new Date();
    const promotion = await this.prisma.promotion.findFirst({
      where: {
        shopId,
        status: 1,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      orderBy: { id: 'desc' },
    });
    if (!promotion) return null;
    return this.toResponse(promotion);
  }

  private toResponse(p: {
    id: number;
    shopId: number;
    name: string;
    rulesJson: unknown;
    startAt: Date;
    endAt: Date;
    status: number;
  }) {
    return {
      id: p.id,
      shopId: p.shopId,
      name: p.name,
      rules: p.rulesJson,
      startAt: p.startAt.toISOString(),
      endAt: p.endAt.toISOString(),
      status: p.status,
    };
  }
}