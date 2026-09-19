import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_SHOP_ID = 1;

// 订单状态：0待付款 1已付款 2已发货 3已收货 4已完成 5已关闭 6已取消
const ORDER_PAID = 1;

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day7Ago = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const day30Ago = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);

    const shopId = DEFAULT_SHOP_ID;

    const [todayStats, week7Stats, month30Stats, pendingShip, pendingAfterSale] =
      await Promise.all([
        this.aggregateOrders(shopId, todayStart),
        this.aggregateOrders(shopId, day7Ago),
        this.aggregateOrders(shopId, day30Ago),
        this.prisma.order.count({
          where: { shopId, status: ORDER_PAID },
        }),
        this.prisma.afterSale.count({
          where: { shopId, status: 0 },
        }),
      ]);

    return {
      today: todayStats,
      week7: week7Stats,
      month30: month30Stats,
      pendingShip,
      pendingAfterSale,
    };
  }

  private async aggregateOrders(shopId: number, from: Date) {
    const where: Prisma.OrderWhereInput = {
      shopId,
      createdAt: { gte: from },
      status: { gte: ORDER_PAID },
    };
    const [count, sum] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where,
        _sum: { payAmount: true },
      }),
    ]);
    return {
      orderCount: count,
      salesAmount: (sum._sum.payAmount ?? new Prisma.Decimal(0)).toFixed(2),
    };
  }

  async getSalesTrend() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day7Ago = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const orders = await this.prisma.order.findMany({
      where: {
        shopId: DEFAULT_SHOP_ID,
        createdAt: { gte: day7Ago },
        status: { gte: ORDER_PAID },
      },
      select: { createdAt: true, payAmount: true },
    });

    const trend = new Map<string, { orderCount: number; salesAmount: Prisma.Decimal }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(day7Ago.getTime() + i * 24 * 60 * 60 * 1000);
      const key = this.formatDate(d);
      trend.set(key, { orderCount: 0, salesAmount: new Prisma.Decimal(0) });
    }

    for (const order of orders) {
      const key = this.formatDate(order.createdAt);
      const item = trend.get(key);
      if (item) {
        item.orderCount += 1;
        item.salesAmount = item.salesAmount.add(order.payAmount);
      }
    }

    return Array.from(trend.entries()).map(([date, v]) => ({
      date,
      orderCount: v.orderCount,
      salesAmount: v.salesAmount.toFixed(2),
    }));
  }

  async getTopProducts() {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          shopId: DEFAULT_SHOP_ID,
          status: { gte: ORDER_PAID },
        },
      },
      select: {
        spuId: true,
        spuTitle: true,
        skuImage: true,
        quantity: true,
        total: true,
      },
    });

    const map = new Map<
      number,
      { spuId: number; spuTitle: string; skuImage: string | null; salesCount: number; salesAmount: Prisma.Decimal }
    >();

    for (const item of items) {
      let entry = map.get(item.spuId);
      if (!entry) {
        entry = {
          spuId: item.spuId,
          spuTitle: item.spuTitle,
          skuImage: item.skuImage,
          salesCount: 0,
          salesAmount: new Prisma.Decimal(0),
        };
        map.set(item.spuId, entry);
      }
      entry.salesCount += item.quantity;
      entry.salesAmount = entry.salesAmount.add(item.total);
    }

    return Array.from(map.values())
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 10)
      .map((e) => ({
        spuId: e.spuId,
        spuTitle: e.spuTitle,
        skuImage: e.skuImage,
        salesCount: e.salesCount,
        salesAmount: e.salesAmount.toFixed(2),
      }));
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}