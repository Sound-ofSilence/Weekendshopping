import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { CreateAfterSaleDto } from './dto/create-after-sale.dto';
import { AfterSaleQueryDto } from './dto/after-sale-query.dto';
import { toAfterSaleResponse } from './dto/after-sale-response.dto';

// 订单状态：0待付款 1已付款 2已发货 3已收货 4已完成
const ORDER_PAID = 1;
const ORDER_SHIPPED = 2;
const ORDER_RECEIVED = 3;
const ORDER_FINISHED = 4;

@Injectable()
export class AfterSalesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateAfterSaleDto) {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: dto.orderItemId },
      include: { order: true },
    });
    if (!orderItem) throw new AppException(ErrorCode.NOT_FOUND, '订单项不存在');
    if (orderItem.order.userId !== userId) throw new AppException(ErrorCode.FORBIDDEN, '无权操作');
    if (orderItem.refundStatus !== 0) throw new AppException(ErrorCode.CONFLICT, '该订单项已申请过售后');

    const os = orderItem.order.status;
    if (dto.type === 1) {
      if (os !== ORDER_PAID && os !== ORDER_SHIPPED) {
        throw new AppException(ErrorCode.BAD_REQUEST, '当前订单状态不支持仅退款');
      }
    } else if (dto.type === 2) {
      if (os !== ORDER_RECEIVED && os !== ORDER_FINISHED) {
        throw new AppException(ErrorCode.BAD_REQUEST, '当前订单状态不支持退货退款');
      }
    } else {
      throw new AppException(ErrorCode.BAD_REQUEST, '售后类型无效');
    }

    const amount = new Prisma.Decimal(dto.amount);
    if (amount.gt(orderItem.total)) throw new AppException(ErrorCode.BAD_REQUEST, '退款金额超过订单项实付');

    const afterSaleNo = this.genNo('AS');

    const created = await this.prisma.$transaction(async (tx) => {
      const a = await tx.afterSale.create({
        data: {
          afterSaleNo,
          orderId: orderItem.orderId,
          orderNo: orderItem.order.orderNo,
          orderItemId: orderItem.id,
          userId,
          shopId: orderItem.order.shopId,
          type: dto.type,
          reason: dto.reason,
          description: dto.description ?? null,
          evidenceJson: dto.evidenceJson ?? [],
          amount,
          status: 0,
        },
      });
      await tx.orderItem.update({
        where: { id: orderItem.id },
        data: { refundStatus: 1 },
      });
      return a;
    });

    return toAfterSaleResponse(created);
  }

  async listByUser(userId: number, query: AfterSaleQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where: Prisma.AfterSaleWhereInput = { userId };
    if (query.status !== undefined) where.status = query.status;

    const [list, total] = await this.prisma.$transaction([
      this.prisma.afterSale.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.afterSale.count({ where }),
    ]);

    return { list: list.map(toAfterSaleResponse), total, page, pageSize };
  }

  async detail(userId: number, afterSaleNo: string) {
    const a = await this.prisma.afterSale.findUnique({ where: { afterSaleNo } });
    if (!a || a.userId !== userId) throw new AppException(ErrorCode.NOT_FOUND, '售后单不存在');
    return toAfterSaleResponse(a);
  }

  async cancel(userId: number, afterSaleNo: string) {
    const a = await this.prisma.afterSale.findUnique({ where: { afterSaleNo } });
    if (!a || a.userId !== userId) throw new AppException(ErrorCode.NOT_FOUND, '售后单不存在');
    if (a.status !== 0) throw new AppException(ErrorCode.CONFLICT, '当前状态不允许取消');

    await this.prisma.$transaction(async (tx) => {
      await tx.afterSale.update({ where: { id: a.id }, data: { status: 7, closedAt: new Date() } });
      await tx.orderItem.update({ where: { id: a.orderItemId }, data: { refundStatus: 0 } });
    });
    return { afterSaleNo, status: 7 };
  }

  async shipBack(userId: number, afterSaleNo: string, dto: { returnTrackingNo: string; returnExpressCode?: string }) {
    const a = await this.prisma.afterSale.findUnique({ where: { afterSaleNo } });
    if (!a || a.userId !== userId) throw new AppException(ErrorCode.NOT_FOUND, '售后单不存在');
    if (a.status !== 3) throw new AppException(ErrorCode.CONFLICT, '当前状态不允许寄回');

    const updated = await this.prisma.afterSale.update({
      where: { id: a.id },
      data: { status: 4, returnTrackingNo: dto.returnTrackingNo, returnExpressCode: dto.returnExpressCode ?? null },
    });
    return toAfterSaleResponse(updated);
  }

  async sellerAgree(sellerUserId: number, afterSaleNo: string) {
    return this.prisma.$transaction(async (tx) => {
      const a = await tx.afterSale.findUnique({ where: { afterSaleNo } });
      if (!a) throw new AppException(ErrorCode.NOT_FOUND, '售后单不存在');
      if (a.status !== 0) throw new AppException(ErrorCode.CONFLICT, '当前状态不允许同意');
      return this.doAgree(tx, a);
    });
  }

  async sellerReject(sellerUserId: number, afterSaleNo: string, reason: string) {
    const a = await this.prisma.afterSale.findUnique({ where: { afterSaleNo } });
    if (!a) throw new AppException(ErrorCode.NOT_FOUND, '售后单不存在');
    if (a.status !== 0) throw new AppException(ErrorCode.CONFLICT, '当前状态不允许拒绝');

    await this.prisma.$transaction(async (tx) => {
      await tx.afterSale.update({
        where: { id: a.id },
        data: { status: 2, sellerReply: reason, sellerReplyAt: new Date() },
      });
      await tx.orderItem.update({ where: { id: a.orderItemId }, data: { refundStatus: 0 } });
    });
    return { afterSaleNo, status: 2 };
  }

  async sellerReceive(sellerUserId: number, afterSaleNo: string) {
    return this.prisma.$transaction(async (tx) => {
      const a = await tx.afterSale.findUnique({ where: { afterSaleNo } });
      if (!a) throw new AppException(ErrorCode.NOT_FOUND, '售后单不存在');
      if (a.status !== 4) throw new AppException(ErrorCode.CONFLICT, '当前状态不允许确认收货');

      const refundNo = await this.createRefund(tx, a);
      const updated = await tx.afterSale.update({
        where: { id: a.id },
        data: { status: 6, refundNo },
      });
      await tx.orderItem.update({ where: { id: a.orderItemId }, data: { refundStatus: 2 } });
      return toAfterSaleResponse(updated);
    });
  }

  async intervene(userId: number, afterSaleNo: string) {
    const a = await this.prisma.afterSale.findUnique({ where: { afterSaleNo } });
    if (!a || a.userId !== userId) throw new AppException(ErrorCode.NOT_FOUND, '售后单不存在');
    if (a.status !== 2) throw new AppException(ErrorCode.CONFLICT, '当前状态不允许申请平台介入');

    const updated = await this.prisma.afterSale.update({
      where: { id: a.id },
      data: { status: 8 },
    });
    return toAfterSaleResponse(updated);
  }

  private async doAgree(tx: any, a: any) {
    if (a.type === 1) {
      const refundNo = await this.createRefund(tx, a);
      const updated = await tx.afterSale.update({
        where: { id: a.id },
        data: { status: 6, refundNo, sellerReplyAt: new Date() },
      });
      await tx.orderItem.update({ where: { id: a.orderItemId }, data: { refundStatus: 2 } });
      return toAfterSaleResponse(updated);
    }
    const updated = await tx.afterSale.update({
      where: { id: a.id },
      data: { status: 3, sellerReplyAt: new Date() },
    });
    return toAfterSaleResponse(updated);
  }

  private async createRefund(tx: any, a: any): Promise<string> {
    const refundNo = this.genNo('R');
    await tx.refund.create({
      data: {
        refundNo,
        paymentId: 0,
        orderId: a.orderId,
        userId: a.userId,
        amount: a.amount,
        reason: a.reason,
        status: 3,
        thirdPartyNo: `MOCKR${Date.now()}`,
      },
    });
    return refundNo;
  }

  private genNo(prefix: string): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}${ts}${rand}`;
  }
}