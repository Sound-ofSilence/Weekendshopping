import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const DEFAULT_SHOP_ID = 1;

@Injectable()
export class SettlementService {
  constructor(private prisma: PrismaService) {}

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where: Prisma.SettlementWhereInput = { shopId: DEFAULT_SHOP_ID };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.settlement.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      list: list.map((s) => this.toResponse(s)),
      total,
      page,
      pageSize,
    };
  }

  async detail(settlementNo: string) {
    const s = await this.prisma.settlement.findUnique({ where: { settlementNo } });
    if (!s || s.shopId !== DEFAULT_SHOP_ID) return null;
    return this.toResponse(s);
  }

  private toResponse(s: {
    id: number;
    settlementNo: string;
    shopId: number;
    periodStart: Date;
    periodEnd: Date;
    orderAmount: Prisma.Decimal;
    commission: Prisma.Decimal;
    refundAmount: Prisma.Decimal;
    payable: Prisma.Decimal;
    status: number;
    settledAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: s.id,
      settlementNo: s.settlementNo,
      shopId: s.shopId,
      periodStart: s.periodStart.toISOString(),
      periodEnd: s.periodEnd.toISOString(),
      orderAmount: s.orderAmount.toFixed(2),
      commission: s.commission.toFixed(2),
      refundAmount: s.refundAmount.toFixed(2),
      payable: s.payable.toFixed(2),
      status: s.status,
      settledAt: s.settledAt ? s.settledAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
    };
  }
}