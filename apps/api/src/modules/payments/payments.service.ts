import { Inject, Injectable } from '@nestjs/common';
import type { Payment } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import type { CreatePaymentDto } from './dto/create-payment.dto';
import type { PaymentResponseDto } from './dto/payment-response.dto';
import { PAY_SERVICE, PaymentStatus } from './pay.service';
import type { PayService } from './pay.service';

// 订单状态（P4 spec 定义）：0待付款 1已付款 2已发货 3已收货 4已完成 5已关闭 6已取消
const ORDER_STATUS_PENDING_PAY = 0;
const ORDER_STATUS_PAID = 1;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(PAY_SERVICE) private readonly payService: PayService,
  ) {}

  async create(userId: string, dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const uid = Number(userId);
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { orderNo: dto.orderNo, userId: uid } });
      if (!order) {
        throw new AppException(ErrorCode.NOT_FOUND, '订单不存在');
      }
      if (order.status !== ORDER_STATUS_PENDING_PAY) {
        throw new AppException(ErrorCode.CONFLICT, '订单状态不允许支付');
      }

      const payment = await tx.payment.create({
        data: {
          paymentNo: this.genPaymentNo(),
          orderId: order.id,
          orderNo: order.orderNo,
          userId: uid,
          amount: order.payAmount,
          status: PaymentStatus.PENDING,
          channel: 0,
        },
      });
      return this.serializePayment(payment);
    });
  }

  async detail(userId: string, paymentNo: string): Promise<PaymentResponseDto> {
    const uid = Number(userId);
    const payment = await this.prisma.payment.findFirst({ where: { paymentNo, userId: uid } });
    if (!payment) {
      throw new AppException(ErrorCode.NOT_FOUND, '支付单不存在');
    }
    return this.serializePayment(payment);
  }

  async mockPay(userId: string, paymentNo: string): Promise<PaymentResponseDto> {
    const uid = Number(userId);
    const payment = await this.prisma.payment.findFirst({ where: { paymentNo, userId: uid } });
    if (!payment) {
      throw new AppException(ErrorCode.NOT_FOUND, '支付单不存在');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new AppException(ErrorCode.CONFLICT, '支付单状态不允许支付');
    }

    const transactionNo = await this.payService.createPayment(
      payment.orderNo,
      payment.amount.toFixed(2),
    );
    return this.markPaid(paymentNo, transactionNo);
  }

  async handleNotify(paymentNo: string, transactionNo?: string): Promise<PaymentResponseDto> {
    if (!paymentNo) {
      throw new AppException(ErrorCode.BAD_REQUEST, 'paymentNo 不能为空');
    }

    const payment = await this.prisma.payment.findUnique({ where: { paymentNo } });
    if (!payment) {
      throw new AppException(ErrorCode.NOT_FOUND, '支付单不存在');
    }
    if (payment.status === PaymentStatus.SUCCESS) {
      return this.serializePayment(payment);
    }

    const txNo =
      transactionNo ??
      (await this.payService.createPayment(payment.orderNo, payment.amount.toFixed(2)));
    return this.markPaid(paymentNo, txNo);
  }

  private async markPaid(paymentNo: string, transactionNo: string): Promise<PaymentResponseDto> {
    const idemKey = `payment:notify:${paymentNo}`;
    const cached = await this.redis.get(idemKey);
    if (cached) {
      return JSON.parse(cached) as PaymentResponseDto;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { paymentNo } });
      if (!payment) {
        throw new AppException(ErrorCode.NOT_FOUND, '支付单不存在');
      }
      if (payment.status === PaymentStatus.SUCCESS) {
        return this.serializePayment(payment);
      }
      if (payment.status !== PaymentStatus.PENDING) {
        throw new AppException(ErrorCode.CONFLICT, '支付单状态不允许支付');
      }

      // 原子抢占：仅 PENDING → SUCCESS 的那一次继续，保证并发下幂等
      const updated = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.SUCCESS, transactionNo, paidAt: new Date() },
      });
      if (updated.count === 0) {
        const existing = await tx.payment.findUnique({ where: { paymentNo } });
        return this.serializePayment(existing!);
      }

      const order = await tx.order.findUnique({ where: { id: payment.orderId } });
      if (!order) {
        throw new AppException(ErrorCode.NOT_FOUND, '订单不存在');
      }
      if (order.status !== ORDER_STATUS_PENDING_PAY) {
        throw new AppException(ErrorCode.CONFLICT, '订单状态不允许支付');
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: ORDER_STATUS_PAID, payStatus: 1, paidAt: new Date() },
      });

      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        const r = await tx.$executeRaw`UPDATE skus SET stock = stock - ${item.quantity}, locked_stock = locked_stock - ${item.quantity} WHERE id = ${item.skuId} AND locked_stock >= ${item.quantity}`;
        if (r === 0) {
          throw new AppException(ErrorCode.CONFLICT, '库存不足');
        }
      }

      const paidPayment = await tx.payment.findUnique({ where: { paymentNo } });
      return this.serializePayment(paidPayment!);
    });

    await this.redis.set(idemKey, JSON.stringify(result), 300);
    return result;
  }

  private genPaymentNo(): string {
    const now = new Date();
    const p = (n: number, w = 2): string => String(n).padStart(w, '0');
    const rand = p(Math.floor(Math.random() * 1_000_000), 6);
    return (
      `P${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}` +
      `${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}${rand}`
    );
  }

  private serializePayment(p: Payment): PaymentResponseDto {
    return {
      id: p.id,
      paymentNo: p.paymentNo,
      orderId: p.orderId,
      orderNo: p.orderNo,
      userId: p.userId,
      amount: p.amount.toFixed(2),
      status: p.status,
      channel: p.channel,
      transactionNo: p.transactionNo,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }
}
