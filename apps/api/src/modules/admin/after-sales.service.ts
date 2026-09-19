import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AdminLogService } from './admin-log.service';

const AS_PLATFORM_INTERVENE = 8;

@Injectable()
export class AdminAfterSalesService {
  constructor(
    private prisma: PrismaService,
    private logService: AdminLogService,
  ) {}

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.AfterSaleWhereInput = {};

    const [list, total] = await this.prisma.$transaction([
      this.prisma.afterSale.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.afterSale.count({ where }),
    ]);

    return {
      list: list.map((a) => ({
        id: a.id,
        afterSaleNo: a.afterSaleNo,
        orderNo: a.orderNo,
        userId: a.userId,
        shopId: a.shopId,
        type: a.type,
        amount: a.amount.toFixed(2),
        status: a.status,
        reason: a.reason,
        createdAt: a.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async intervene(adminId: number, afterSaleNo: string) {
    const a = await this.prisma.afterSale.findUnique({ where: { afterSaleNo } });
    if (!a) throw new AppException(ErrorCode.NOT_FOUND, '售后单不存在');
    if (a.status !== 2) {
      throw new AppException(ErrorCode.CONFLICT, '仅商家拒绝状态才能平台介入');
    }
    await this.prisma.afterSale.update({
      where: { id: a.id },
      data: { status: AS_PLATFORM_INTERVENE },
    });
    await this.logService.log({
      adminId,
      module: 'after_sale',
      action: 'intervene',
      targetId: a.id,
    });
    return { afterSaleNo, status: AS_PLATFORM_INTERVENE };
  }
}