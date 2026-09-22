'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, PriceText, StatusTag } from '@/components/ui';
import { listAllOrders, type LocalOrder, type LocalOrderStatus } from '@/lib/order-store';

type TabKey = 'all' | 'PENDING_PAY' | 'PAID' | 'SHIPPED' | 'RECEIVED';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'PENDING_PAY', label: '待付款' },
  { key: 'PAID', label: '待发货' },
  { key: 'SHIPPED', label: '待收货' },
  { key: 'RECEIVED', label: '已完成' },
];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrders(listAllOrders());
    setLoading(false);
  }, []);

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter((o) => o.status === activeTab);

  const totalItems = (o: LocalOrder) =>
    o.shopGroups.reduce((sum, g) => sum + g.items.reduce((s, i) => s + i.quantity, 0), 0);

  return (
    <div className="min-h-screen bg-bg-page pb-32">
      <div className="sticky top-14 z-40 border-b border-border bg-bg-card">
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={() => router.back()} className="cursor-pointer text-lg">
            ←
          </button>
          <h1 className="text-base font-bold">我的订单</h1>
        </div>

        {/* Tab 栏 */}
        <div className="flex overflow-x-auto px-4">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            const count = tab.key === 'all'
              ? orders.length
              : orders.filter((o) => o.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-shrink-0 cursor-pointer px-4 py-2 text-sm transition ${
                  active ? 'font-medium text-primary' : 'text-text-secondary'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1 text-xs text-text-disabled">({count})</span>
                )}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl space-y-3 p-4">
        {loading && (
          <div className="py-20 text-center text-sm text-text-secondary">加载中...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="text-6xl">📦</div>
            <p className="text-text-secondary">暂无订单</p>
            <Link href="/">
              <Button>去逛逛</Button>
            </Link>
          </div>
        )}

        {!loading && filtered.map((order) => (
          <Card key={order.orderNo} className="rounded-none p-0">
            {/* 店铺头 + 状态 */}
            <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
              <span className="text-sm font-medium">🏪 {order.shopGroups[0]?.shopName || '店铺'}</span>
              <StatusTag status={order.status as Exclude<LocalOrderStatus, never>} />
            </div>

            {/* 商品列表（最多显示 3 件） */}
            <Link href={`/orders/${order.orderNo}`} className="block">
              {order.shopGroups[0]?.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex gap-3 border-b border-border-light px-4 py-3 last:border-0">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-bg-page text-3xl">
                    {item.emoji}
                  </div>
                  <div className="flex flex-1 flex-col justify-between overflow-hidden">
                    <h3 className="line-clamp-1 text-sm">{item.title}</h3>
                    <p className="text-xs text-text-secondary">{item.spec}</p>
                    <div className="flex items-center justify-between">
                      <PriceText price={item.price} size="sm" />
                      <span className="text-xs text-text-secondary">×{item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
              {order.shopGroups.reduce((s, g) => s + g.items.length, 0) > 3 && (
                <div className="px-4 pb-2 text-center text-xs text-text-secondary">
                  还有 {order.shopGroups.reduce((s, g) => s + g.items.length, 0) - 3} 件商品...
                </div>
              )}
            </Link>

            {/* 合计 */}
            <div className="border-t border-border-light px-4 py-2 text-right text-xs text-text-secondary">
              共 {totalItems(order)} 件 · 实付 <span className="font-bold text-primary">¥{order.payAmount}</span>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-2 border-t border-border-light px-4 py-3">
              {order.status === 'PENDING_PAY' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/orders/${order.orderNo}`)}
                  >
                    取消订单
                  </Button>
                  <Button size="sm" onClick={() => router.push(`/pay/${order.orderNo}`)}>
                    立即付款
                  </Button>
                </>
              )}
              {order.status === 'PAID' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/orders/${order.orderNo}`)}
                >
                  申请退款
                </Button>
              )}
              {order.status === 'SHIPPED' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/orders/${order.orderNo}/logistics`)}
                  >
                    查看物流
                  </Button>
                  <Button size="sm" onClick={() => router.push(`/orders/${order.orderNo}`)}>
                    确认收货
                  </Button>
                </>
              )}
              {order.status === 'RECEIVED' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/orders/${order.orderNo}/review`)}
                  >
                    去评价
                  </Button>
                  <Button size="sm" onClick={() => router.push(`/product/1`)}>
                    再次购买
                  </Button>
                </>
              )}
              {(order.status === 'CANCELLED' || order.status === 'CLOSED') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/product/1`)}
                >
                  再次购买
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}