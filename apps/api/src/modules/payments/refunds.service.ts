import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Refund } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateRefundDto } from './dto/create-refund.dto';
import type { RefundResponseDto } from './dto/refund-response.dto';
import { PAY_SERVICE } from './pay.service';
import type { PayService } from './pay.service';

// 退款单状态：0待处理 2已拒绝 3已退款
const REFUND_STATUS_PENDING = 0;
const REFUND_STATUS_REJECTED = 2;
const REFUND_STATUS_SUCCESS = 3;

// 允许退款的订单状态：1已付款 2已发货 3已收货 4已完成
const REFUNDABLE_ORDER_STATUSES = [1, 2, 3, 4];

@Injectable()
export class RefundsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAY_SERVICE) private readonly payService: PayService,
  ) {}

  async create(userId: string, dto: CreateRefundDto): Promise<RefundResponseDto> {
    const uid = Number(userId);
    const orderId = Number(dto.orderId);
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id: orderId, userId: uid } });
      if (!order) {
        throw new AppException(ErrorCode.NOT_FOUND, '订单不存在');
      }
      if (!REFUNDABLE_ORDER_STATUSES.includes(order.status)) {
        throw new AppException(ErrorCode.CONFLICT, '订单状态不允许退款');
      }
      const amount = new Prisma.Decimal(dto.amount);
      if (amount.gt(order.payAmount)) {
        throw new AppException(ErrorCode.BAD_REQUEST, '退款金额不能超过支付金额');
      }

      const refund = await tx.refund.create({
        data: {
          refundNo: this.genRefundNo(),
          orderId: order.id,
          orderNo: order.orderNo,
          userId: uid,
          amount,
          reason: dto.reason,
          status: REFUND_STATUS_PENDING,
        },
      });
      return this.serializeRefund(refund);
    });
  }

  async approve(userId: string, refundNo: string): Promise<RefundResponseDto> {
    const uid = Number(userId);
    const refund = await this.prisma.refund.findFirst({ where: { refundNo, userId: uid } });
    if (!refund) {
      throw new AppException(ErrorCode.NOT_FOUND, '退款单不存在');
    }
    if (refund.status !== REFUND_STATUS_PENDING) {
      throw new AppException(ErrorCode.CONFLICT, '退款单状态不允许操作');
    }

    return this.prisma.$transaction(async (tx) => {
      const { thirdPartyNo } = await this.payService.refund(
        refund.refundNo,
        refund.amount.toFixed(2),
      );

      // 原子抢占：仅 PENDING → SUCCESS 的那一次继续，保证并发下幂等
      const updated = await tx.refund.updateMany({
        where: { id: refund.id, status: REFUND_STATUS_PENDING },
        data: { status: REFUND_STATUS_SUCCESS, thirdPartyNo },
      });
      if (updated.count === 0) {
        const existing = await tx.refund.findUnique({ where: { refundNo } });
        return this.serializeRefund(existing!);
      }

      await tx.order.update({
        where: { id: refund.orderId },
        data: { payStatus: 0 },
      });

      const result = await tx.refund.findUnique({ where: { refundNo } });
      return this.serializeRefund(result!);
    });
  }

  async reject(userId: string, refundNo: string): Promise<RefundResponseDto> {
    const uid = Number(userId);
    return this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.findFirst({ where: { refundNo, userId: uid } });
      if (!refund) {
        throw new AppException(ErrorCode.NOT_FOUND, '退款单不存在');
      }
      if (refund.status !== REFUND_STATUS_PENDING) {
        throw new AppException(ErrorCode.CONFLICT, '退款单状态不允许操作');
      }
      const updated = await tx.refund.update({
        where: { id: refund.id },
        data: { status: REFUND_STATUS_REJECTED },
      });
      return this.serializeRefund(updated);
    });
  }

  async detail(userId: string, refundNo: string): Promise<RefundResponseDto> {
    const uid = Number(userId);
    const refund = await this.prisma.refund.findFirst({ where: { refundNo, userId: uid } });
    if (!refund) {
      throw new AppException(ErrorCode.NOT_FOUND, '退款单不存在');
    }
    return this.serializeRefund(refund);
  }

  private genRefundNo(): string {
    const now = new Date();
    const p = (n: number, w = 2): string => String(n).padStart(w, '0');
    const rand = p(Math.floor(Math.random() * 1_000_000), 6);
    return (
      `R${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}` +
      `${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}${rand}`
    );
  }

  private serializeRefund(r: Refund): RefundResponseDto {
    return {
      id: r.id,
      refundNo: r.refundNo,
      orderId: r.orderId,
      orderNo: r.orderNo,
      userId: r.userId,
      amount: r.amount.toFixed(2),
      reason: r.reason,
      status: r.status,
      thirdPartyNo: r.thirdPartyNo,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
