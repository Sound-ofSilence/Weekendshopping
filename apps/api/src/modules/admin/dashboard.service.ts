import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ORDER_PAID = 1;

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [orderCount, gmv, userCount, shopCount, productCount] = await Promise.all([
      this.prisma.order.count({ where: { status: { gte: ORDER_PAID } } }),
      this.prisma.order.aggregate({
        where: { status: { gte: ORDER_PAID } },
        _sum: { payAmount: true },
      }),
      this.prisma.user.count(),
      this.prisma.order.groupBy({ by: ['shopId'] }).then((r) => r.length),
      this.prisma.spu.count(),
    ]);

    return {
      orderCount,
      gmv: (gmv._sum.payAmount ?? new Prisma.Decimal(0)).toFixed(2),
      userCount,
      shopCount,
      productCount,
    };
  }

  async getTrend() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day7Ago = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: day7Ago }, status: { gte: ORDER_PAID } },
      select: { createdAt: true, payAmount: true },
    });

    const map = new Map<string, { orderCount: number; gmv: Prisma.Decimal }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(day7Ago.getTime() + i * 24 * 60 * 60 * 1000);
      map.set(this.formatDate(d), { orderCount: 0, gmv: new Prisma.Decimal(0) });
    }
    for (const o of orders) {
      const item = map.get(this.formatDate(o.createdAt));
      if (item) {
        item.orderCount += 1;
        item.gmv = item.gmv.add(o.payAmount);
      }
    }
    return Array.from(map.entries()).map(([date, v]) => ({
      date,
      orderCount: v.orderCount,
      gmv: v.gmv.toFixed(2),
    }));
  }

  async getTopShops() {
    const orders = await this.prisma.order.findMany({
      where: { status: { gte: ORDER_PAID } },
      select: { shopId: true, payAmount: true },
    });
    const map = new Map<number, { shopId: number; orderCount: number; gmv: Prisma.Decimal }>();
    for (const o of orders) {
      let entry = map.get(o.shopId);
      if (!entry) {
        entry = { shopId: o.shopId, orderCount: 0, gmv: new Prisma.Decimal(0) };
        map.set(o.shopId, entry);
      }
      entry.orderCount += 1;
      entry.gmv = entry.gmv.add(o.payAmount);
    }
    return Array.from(map.values())
      .sort((a, b) => b.gmv.cmp(a.gmv))
      .slice(0, 10)
      .map((e) => ({
        shopId: e.shopId,
        orderCount: e.orderCount,
        gmv: e.gmv.toFixed(2),
      }));
  }

  async getTopCategories() {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { status: { gte: ORDER_PAID } } },
      select: { spuId: true, quantity: true, total: true },
    });

    const spuIds = [...new Set(items.map((i) => i.spuId))];
    const spus = await this.prisma.spu.findMany({
      where: { id: { in: spuIds } },
      select: { id: true, categoryId: true },
    });
    const spuCat = new Map(spus.map((s) => [s.id, s.categoryId]));

    const map = new Map<number, { categoryId: number; itemCount: number; gmv: Prisma.Decimal }>();
    for (const it of items) {
      const catId = spuCat.get(it.spuId);
      if (!catId) continue;
      let entry = map.get(catId);
      if (!entry) {
        entry = { categoryId: catId, itemCount: 0, gmv: new Prisma.Decimal(0) };
        map.set(catId, entry);
      }
      entry.itemCount += it.quantity;
      entry.gmv = entry.gmv.add(it.total);
    }

    const cats = await this.prisma.category.findMany({
      where: { id: { in: Array.from(map.keys()) } },
      select: { id: true, name: true },
    });
    const catName = new Map(cats.map((c) => [c.id, c.name]));

    return Array.from(map.values())
      .sort((a, b) => b.gmv.cmp(a.gmv))
      .slice(0, 10)
      .map((e) => ({
        categoryId: e.categoryId,
        categoryName: catName.get(e.categoryId) ?? '未知',
        itemCount: e.itemCount,
        gmv: e.gmv.toFixed(2),
      }));
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}