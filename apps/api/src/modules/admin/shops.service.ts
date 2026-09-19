import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AdminLogService } from './admin-log.service';

@Injectable()
export class AdminShopsService {
  constructor(
    private prisma: PrismaService,
    private logService: AdminLogService,
  ) {}

  /**
   * 一期 Shop 表未建，从 Order 表聚合出店铺列表
   */
  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const grouped = await this.prisma.order.groupBy({
      by: ['shopId'],
      _count: { id: true },
      _sum: { payAmount: true },
    });

    const total = grouped.length;
    const list = grouped
      .sort((a, b) => b._count.id - a._count.id)
      .slice((page - 1) * pageSize, page * pageSize)
      .map((g) => ({
        shopId: g.shopId,
        name: `店铺 ${g.shopId}`,
        orderCount: g._count.id,
        gmv: (g._sum.payAmount ?? new Prisma.Decimal(0)).toFixed(2),
        status: 1,
      }));

    return { list, total, page, pageSize };
  }

  async freeze(adminId: number, shopId: number) {
    await this.logService.log({
      adminId,
      module: 'shop',
      action: 'freeze',
      targetId: shopId,
    });
    return { shopId, status: 0, message: '店铺已冻结（一期仅记录日志）' };
  }

  async unfreeze(adminId: number, shopId: number) {
    await this.logService.log({
      adminId,
      module: 'shop',
      action: 'unfreeze',
      targetId: shopId,
    });
    return { shopId, status: 1, message: '店铺已解冻' };
  }
}