import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from './order-status.constant';

/**
 * 订单超时关单定时任务
 * 每 5 分钟扫描一次：status=PENDING_PAY 且 createdAt < now-30min 的订单
 * 事务内批量改 CLOSED + 释放 lockedStock
 */
@Injectable()
export class OrdersScheduleService {
  private readonly logger = new Logger(OrdersScheduleService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/5 * * * *')
  async closeExpiredOrders(): Promise<void> {
    const threshold = new Date(Date.now() - 30 * 60 * 1000);

    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_PAY,
        createdAt: { lt: threshold },
      },
      include: { items: true },
    });

    if (expiredOrders.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: {
          id: { in: expiredOrders.map((o) => o.id) },
          status: OrderStatus.PENDING_PAY,
        },
        data: { status: OrderStatus.CLOSED, closedAt: new Date() },
      });

      for (const order of expiredOrders) {
        for (const item of order.items) {
          await tx.$executeRaw`UPDATE skus SET locked_stock = locked_stock - ${item.quantity} WHERE id = ${item.skuId} AND locked_stock >= ${item.quantity}`;
        }
      }
    });

    this.logger.log(`已关闭 ${expiredOrders.length} 个超时订单`);
  }
}
