import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AdminLogService } from './admin-log.service';

const SPU_OFF_SALE = 3;
const AUDIT_APPROVED = 1;
const AUDIT_REJECTED = 2;

@Injectable()
export class AdminProductsService {
  constructor(
    private prisma: PrismaService,
    private logService: AdminLogService,
  ) {}

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.SpuWhereInput = { deletedAt: null };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.spu.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.spu.count({ where }),
    ]);

    return {
      list: list.map((s) => ({
        id: s.id,
        shopId: s.shopId,
        title: s.title,
        mainImg: s.mainImg,
        status: s.status,
        auditStatus: s.auditStatus,
        salesCount: s.salesCount,
        createdAt: s.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async offSale(adminId: number, spuId: number) {
    const spu = await this.prisma.spu.findUnique({ where: { id: spuId } });
    if (!spu) throw new AppException(ErrorCode.NOT_FOUND, '商品不存在');
    await this.prisma.spu.update({ where: { id: spuId }, data: { status: SPU_OFF_SALE } });
    await this.logService.log({ adminId, module: 'product', action: 'off_sale', targetId: spuId });
    return { spuId, status: SPU_OFF_SALE };
  }

  async approve(adminId: number, spuId: number) {
    const spu = await this.prisma.spu.findUnique({ where: { id: spuId } });
    if (!spu) throw new AppException(ErrorCode.NOT_FOUND, '商品不存在');
    await this.prisma.spu.update({
      where: { id: spuId },
      data: { auditStatus: AUDIT_APPROVED },
    });
    await this.logService.log({ adminId, module: 'product', action: 'approve', targetId: spuId });
    return { spuId, auditStatus: AUDIT_APPROVED };
  }

  async reject(adminId: number, spuId: number, reason: string) {
    const spu = await this.prisma.spu.findUnique({ where: { id: spuId } });
    if (!spu) throw new AppException(ErrorCode.NOT_FOUND, '商品不存在');
    await this.prisma.spu.update({
      where: { id: spuId },
      data: { auditStatus: AUDIT_REJECTED, auditReason: reason },
    });
    await this.logService.log({
      adminId,
      module: 'product',
      action: 'reject',
      targetId: spuId,
      detail: { reason },
    });
    return { spuId, auditStatus: AUDIT_REJECTED, reason };
  }
}