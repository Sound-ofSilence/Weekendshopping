import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

const DEFAULT_SHOP_ID = 1;

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async ensureWallet(tx: Prisma.TransactionClient | PrismaService = this.prisma) {
    const existing = await tx.shopWallet.findUnique({ where: { shopId: DEFAULT_SHOP_ID } });
    if (existing) return existing;
    return tx.shopWallet.create({ data: { shopId: DEFAULT_SHOP_ID } });
  }

  async getWallet() {
    const wallet = await this.ensureWallet();
    return this.toResponse(wallet);
  }

  async createWithdrawal(dto: CreateWithdrawalDto) {
    const amount = new Prisma.Decimal(dto.amount);
    if (amount.lte(0)) throw new AppException(ErrorCode.BAD_REQUEST, '提现金额必须大于 0');

    return this.prisma.$transaction(async (tx) => {
      const wallet = await this.ensureWallet(tx);
      if (wallet.balance.lt(amount)) {
        throw new AppException(ErrorCode.BAD_REQUEST, '余额不足');
      }

      const r = await tx.shopWallet.updateMany({
        where: { shopId: DEFAULT_SHOP_ID, balance: { gte: amount } },
        data: {
          balance: { decrement: amount },
          frozenBalance: { increment: amount },
        },
      });
      if (r.count === 0) throw new AppException(ErrorCode.CONFLICT, '余额不足');

      const withdrawalNo = this.genNo('W');
      const created = await tx.withdrawal.create({
        data: {
          withdrawalNo,
          shopId: DEFAULT_SHOP_ID,
          amount,
          bankName: dto.bankName,
          bankAccount: dto.bankAccount,
          accountHolder: dto.accountHolder,
          status: 0,
        },
      });
      return this.toWithdrawalResponse(created);
    });
  }

  async listWithdrawals(query: { page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where: Prisma.WithdrawalWhereInput = { shopId: DEFAULT_SHOP_ID };

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
      list: list.map((w) => this.toWithdrawalResponse(w)),
      total,
      page,
      pageSize,
    };
  }

  private toResponse(w: { balance: Prisma.Decimal; frozenBalance: Prisma.Decimal; totalIncome: Prisma.Decimal; totalWithdrawn: Prisma.Decimal }) {
    return {
      balance: w.balance.toFixed(2),
      frozenBalance: w.frozenBalance.toFixed(2),
      totalIncome: w.totalIncome.toFixed(2),
      totalWithdrawn: w.totalWithdrawn.toFixed(2),
    };
  }

  private toWithdrawalResponse(w: {
    id: number;
    withdrawalNo: string;
    amount: Prisma.Decimal;
    bankName: string;
    bankAccount: string;
    accountHolder: string;
    status: number;
    remark: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: w.id,
      withdrawalNo: w.withdrawalNo,
      amount: w.amount.toFixed(2),
      bankName: w.bankName,
      bankAccount: w.bankAccount,
      accountHolder: w.accountHolder,
      status: w.status,
      remark: w.remark,
      reviewedAt: w.reviewedAt ? w.reviewedAt.toISOString() : null,
      createdAt: w.createdAt.toISOString(),
    };
  }

  private genNo(prefix: string): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}${ts}${rand}`;
  }
}