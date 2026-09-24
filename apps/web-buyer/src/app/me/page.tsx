'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { listAllOrders } from '@/lib/order-store';
import { getCartCount, onCartUpdated } from '@/lib/cart-store';

interface OrderCounts {
  pendingPay: number;
  pendingShip: number;
  pendingReceive: number;
  pendingReview: number;
}

export default function MePage() {
  const router = useRouter();
  const [counts, setCounts] = useState<OrderCounts>({
    pendingPay: 0,
    pendingShip: 0,
    pendingReceive: 0,
    pendingReview: 0,
  });
  const [cartCount, setCartCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const orders = listAllOrders();
      setCounts({
        pendingPay: orders.filter((o) => o.status === 'PENDING_PAY').length,
        pendingShip: orders.filter((o) => o.status === 'PAID').length,
        pendingReceive: orders.filter((o) => o.status === 'SHIPPED').length,
        pendingReview: orders.filter((o) => o.status === 'RECEIVED').length,
      });
      setCartCount(getCartCount());
    };

    refresh();
    setMounted(true);
    const unsubscribe = onCartUpdated(refresh);
    return unsubscribe;
  }, []);

  const quickOrders = [
    { key: 'PENDING_PAY', label: '待付款', icon: '💰', count: counts.pendingPay },
    { key: 'PAID', label: '待发货', icon: '📦', count: counts.pendingShip },
    { key: 'SHIPPED', label: '待收货', icon: '🚚', count: counts.pendingReceive },
    { key: 'RECEIVED', label: '待评价', icon: '✍️', count: counts.pendingReview },
  ];

  const toolItems = [
    { href: '/favorites', label: '我的收藏', icon: '❤️', tip: '' },
    { href: '/coupons', label: '优惠券', icon: '🎫', tip: '' },
    { href: '/address', label: '收货地址', icon: '📍', tip: '' },
    { href: '/orders', label: '我的评价', icon: '⭐', tip: '' },
    { href: '/orders', label: '浏览足迹', icon: '👣', tip: '' },
    { href: '/coupons', label: '我的积分', icon: '💎', tip: '1200' },
  ];

  const serviceItems = [
    { href: '/im', label: '客服中心', icon: '💬' },
    { href: '/feedback', label: '意见反馈', icon: '📝' },
    { href: '/settings', label: '设置', icon: '⚙️' },
  ];

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page pb-24">
      <div className="mx-auto max-w-screen-xl space-y-3 p-4">
        {/* 用户卡片 */}
        <Card className="rounded-none bg-gradient-to-r from-orange-400 to-red-500 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-4xl backdrop-blur">
              👤
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">未登录用户</h2>
              <p className="mt-1 text-xs opacity-90">点击右侧登录/注册</p>
            </div>
            <button
              onClick={() => alert('登录功能开发中（F5）')}
              className="cursor-pointer rounded-full bg-white/20 px-4 py-1.5 text-sm backdrop-blur transition hover:bg-white/30"
            >
              登录
            </button>
          </div>
        </Card>

        {/* 我的订单 */}
        <Card className="rounded-none">
          <div className="mb-3 flex items-center justify-between border-b border-border-light pb-3">
            <h3 className="text-sm font-bold">我的订单</h3>
            <Link href="/orders" className="text-xs text-text-secondary hover:text-primary">
              全部订单 &gt;
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {quickOrders.map((item) => (
              <Link
                key={item.key}
                href={`/orders?status=${item.key}`}
                className="flex flex-col items-center gap-1 transition hover:opacity-80"
              >
                <div className="relative">
                  <span className="text-2xl">{item.icon}</span>
                  {item.count > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-xs text-white">
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-secondary">{item.label}</span>
              </Link>
            ))}
          </div>
        </Card>

        {/* 我的工具 */}
        <Card className="rounded-none">
          <h3 className="mb-3 text-sm font-bold">我的工具</h3>
          <div className="grid grid-cols-3 gap-3">
            {toolItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="flex flex-col items-center gap-2 rounded-md p-2 transition hover:bg-bg-page"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs text-text-secondary">{item.label}</span>
                {item.tip && (
                  <span className="text-xs font-medium text-primary">{item.tip}</span>
                )}
              </Link>
            ))}
          </div>
        </Card>

        {/* 我的服务 */}
        <Card className="rounded-none">
          <h3 className="mb-3 text-sm font-bold">我的服务</h3>
          <div className="space-y-1">
            {serviceItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-2 py-3 transition hover:bg-bg-page"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="flex-1 text-sm">{item.label}</span>
                <span className="text-text-disabled">&gt;</span>
              </Link>
            ))}
          </div>
        </Card>

        <p className="py-4 text-center text-xs text-text-disabled">
          Weekend Shopping v0.1.0
        </p>
      </div>
    </div>
  );
}