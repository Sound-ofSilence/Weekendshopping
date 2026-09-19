import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AdminLogService } from './admin-log.service';

const WITHDRAWAL_PENDING = 0;
const WITHDRAWAL_REJECTED = 2;
const WITHDRAWAL_PAID = 3;

@Injectable()
export class AdminWithdrawalsService {
  constructor(
    private prisma: PrismaService,
    private logService: AdminLogService,
  ) {}

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.WithdrawalWhereInput = { status: WITHDRAWAL_PENDING };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.withdrawal.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return {
      list: list.map((w) => ({
        id: w.id,
        withdrawalNo: w.withdrawalNo,
        shopId: w.shopId,
        amount: w.amount.toFixed(2),
        bankName: w.bankName,
        bankAccount: w.bankAccount,
        accountHolder: w.accountHolder,
        status: w.status,
        createdAt: w.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async approve(adminId: number, withdrawalNo: string) {
    return this.prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.findUnique({ where: { withdrawalNo } });
      if (!w) throw new AppException(ErrorCode.NOT_FOUND, '提现申请不存在');
      if (w.status !== WITHDRAWAL_PENDING) {
        throw new AppException(ErrorCode.CONFLICT, '当前状态不可审批');
      }

      await tx.withdrawal.update({
        where: { id: w.id },
        data: { status: WITHDRAWAL_PAID, reviewedAt: new Date() },
      });
      await tx.shopWallet.update({
        where: { shopId: w.shopId },
        data: {
          frozenBalance: { decrement: w.amount },
          totalWithdrawn: { increment: w.amount },
        },
      });
      await this.logService.log(
        {
          adminId,
          module: 'withdrawal',
          action: 'approve',
          targetId: w.id,
        },
        tx,
      );
      return { withdrawalNo, status: WITHDRAWAL_PAID };
    });
  }

  async reject(adminId: number, withdrawalNo: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.findUnique({ where: { withdrawalNo } });
      if (!w) throw new AppException(ErrorCode.NOT_FOUND, '提现申请不存在');
      if (w.status !== WITHDRAWAL_PENDING) {
        throw new AppException(ErrorCode.CONFLICT, '当前状态不可审批');
      }

      await tx.withdrawal.update({
        where: { id: w.id },
        data: { status: WITHDRAWAL_REJECTED, reviewedAt: new Date(), remark: reason },
      });
      await tx.shopWallet.update({
        where: { shopId: w.shopId },
        data: {
          frozenBalance: { decrement: w.amount },
          balance: { increment: w.amount },
        },
      });
      await this.logService.log(
        {
          adminId,
          module: 'withdrawal',
          action: 'reject',
          targetId: w.id,
          detail: { reason },
        },
        tx,
      );
      return { withdrawalNo, status: WITHDRAWAL_REJECTED };
    });
  }
}