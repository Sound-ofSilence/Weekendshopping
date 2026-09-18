import { Injectable } from '@nestjs/common';
import type { LogisticsTrace, Shipment } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { ShipOrderDto, ShipOrderItemDto } from './dto/ship-order.dto';

/** 订单状态：1=PAID 2=SHIPPED（与 orders 模块 OrderStatus 一致） */
const ORDER_STATUS_PAID = 1;
const ORDER_STATUS_SHIPPED = 2;

/** 发货单状态：0待揽收 1运输中 2派送中 3已签收 4异常 */
const SHIPMENT_STATUS_TRANSIT = 1;

type ShipmentWithTraces = Shipment & { traces: LogisticsTrace[] };

@Injectable()
export class ShipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async ship(
    userId: string,
    orderNo: string,
    dto: ShipOrderDto,
  ): Promise<Record<string, unknown>> {
    const uid = Number(userId);
    const shipment = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { orderNo, shopId: uid } });
      if (!order) {
        throw new AppException(ErrorCode.NOT_FOUND, '订单不存在');
      }
      if (order.status !== ORDER_STATUS_PAID) {
        throw new AppException(ErrorCode.CONFLICT, '仅已付款订单可发货');
      }

      const created = await tx.shipment.create({
        data: {
          orderId: order.id,
          orderNo: order.orderNo,
          shopId: order.shopId,
          expressCompany: dto.expressCompany,
          expressCode: dto.expressCode,
          trackingNo: dto.trackingNo,
          status: SHIPMENT_STATUS_TRANSIT,
          shippedAt: new Date(),
        },
      });

      const now = new Date();
      await tx.logisticsTrace.createMany({
        data: [
          { shipmentId: created.id, traceTime: now, description: '快递已揽收', status: 0 },
          { shipmentId: created.id, traceTime: now, description: '快件运输中', status: 1 },
        ],
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: ORDER_STATUS_SHIPPED,
          shipStatus: 1,
          shippedAt: new Date(),
        },
      });

      return created;
    });

    return this.serializeShipment(shipment);
  }

  async batchShip(
    userId: string,
    items: ShipOrderItemDto[],
  ): Promise<{ success: number; failed: Array<{ orderNo: string; reason: string }> }> {
    let success = 0;
    const failed: Array<{ orderNo: string; reason: string }> = [];

    for (const item of items) {
      try {
        await this.ship(userId, item.orderNo, {
          expressCode: item.expressCode,
          expressCompany: item.expressCompany,
          trackingNo: item.trackingNo,
        });
        success += 1;
      } catch (e) {
        failed.push({ orderNo: item.orderNo, reason: this.reasonOf(e) });
      }
    }

    return { success, failed };
  }

  async query(userId: string, orderNo: string): Promise<Record<string, unknown>> {
    const uid = Number(userId);
    const shipment = await this.prisma.shipment.findFirst({
      where: { orderNo },
      include: { traces: { orderBy: { traceTime: 'asc' } } },
    });
    if (!shipment) {
      throw new AppException(ErrorCode.NOT_FOUND, '物流信息不存在');
    }

    const order = await this.prisma.order.findUnique({ where: { orderNo } });
    if (!order) {
      throw new AppException(ErrorCode.NOT_FOUND, '订单不存在');
    }
    const allowed = order.userId === uid || order.shopId === uid;
    if (!allowed) {
      throw new AppException(ErrorCode.NOT_FOUND, '订单不存在');
    }

    return this.serializeShipmentWithTraces(shipment);
  }

  private reasonOf(e: unknown): string {
    if (e instanceof AppException) {
      const message = (e as unknown as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
    }
    return '发货失败';
  }

  private serializeShipment(s: Shipment): Record<string, unknown> {
    return {
      id: s.id,
      orderId: s.orderId,
      orderNo: s.orderNo,
      shopId: s.shopId,
      expressCompany: s.expressCompany,
      expressCode: s.expressCode,
      trackingNo: s.trackingNo,
      status: s.status,
      shippedAt: s.shippedAt,
      receivedAt: s.receivedAt,
    };
  }

  private serializeShipmentWithTraces(s: ShipmentWithTraces): Record<string, unknown> {
    return {
      ...this.serializeShipment(s),
      traces: s.traces.map((t) => ({
        id: t.id,
        traceTime: t.traceTime,
        description: t.description,
        status: t.status,
      })),
    };
  }
}
