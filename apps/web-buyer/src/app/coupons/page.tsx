'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';

type CouponStatus = 'available' | 'used' | 'expired';

const mockCoupons = [
  {
    id: 1,
    name: '满 200 减 30',
    type: 1 as const,
    value: '30',
    minAmount: '200',
    shopName: '全场通用',
    startAt: '2026-09-01',
    endAt: '2026-12-31',
    status: 'available' as CouponStatus,
  },
  {
    id: 2,
    name: '满 100 减 10',
    type: 1 as const,
    value: '10',
    minAmount: '100',
    shopName: 'XX旗舰店',
    startAt: '2026-09-15',
    endAt: '2026-10-15',
    status: 'available' as CouponStatus,
  },
  {
    id: 3,
    name: '9 折优惠券',
    type: 2 as const,
    value: '9',
    minAmount: '0',
    shopName: 'YY专营店',
    startAt: '2026-08-01',
    endAt: '2026-08-31',
    status: 'expired' as CouponStatus,
  },
  {
    id: 4,
    name: '满 500 减 100',
    type: 1 as const,
    value: '100',
    minAmount: '500',
    shopName: '全场通用',
    startAt: '2026-07-01',
    endAt: '2026-08-31',
    status: 'used' as CouponStatus,
  },
];

export default function CouponsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<CouponStatus>('available');

  const tabs: { key: CouponStatus; label: string }[] = [
    { key: 'available', label: '可使用' },
    { key: 'used', label: '已使用' },
    { key: 'expired', label: '已过期' },
  ];

  const filtered = mockCoupons.filter((c) => c.status === tab);

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="sticky top-14 z-40 border-b border-border bg-bg-card">
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={() => router.back()} className="cursor-pointer text-lg">
            ←
          </button>
          <h1 className="text-base font-bold">我的优惠券</h1>
        </div>
        <div className="flex px-4">
          {tabs.map((t) => {
            const active = tab === t.key;
            const count = mockCoupons.filter((c) => c.status === t.key).length;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex-shrink-0 cursor-pointer px-4 py-2 text-sm transition ${
                  active ? 'font-medium text-primary' : 'text-text-secondary'
                }`}
              >
                {t.label}
                <span className="ml-1 text-xs text-text-disabled">({count})</span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl space-y-3 p-4">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="text-6xl">🎫</div>
            <p className="text-text-secondary">暂无优惠券</p>
            <Link
              href="/"
              className="rounded-md bg-primary px-4 py-2 text-sm text-white"
            >
              去领券
            </Link>
          </div>
        )}

        {filtered.map((c) => (
          <Card
            key={c.id}
            className={`flex items-stretch overflow-hidden p-0 ${
              c.status !== 'available' ? 'opacity-60' : ''
            }`}
          >
            {/* 左侧金额 */}
            <div className="flex w-24 flex-shrink-0 flex-col items-center justify-center bg-primary text-white">
              <span className="text-3xl font-bold">
                {c.type === 1 ? `¥${c.value}` : `${c.value}折`}
              </span>
              <span className="mt-1 text-xs opacity-90">
                {c.type === 1 ? `满${c.minAmount}可用` : '无门槛'}
              </span>
            </div>

            {/* 右侧信息 */}
            <div className="flex-1 p-3">
              <h3 className="text-sm font-medium">{c.name}</h3>
              <p className="mt-1 text-xs text-text-secondary">{c.shopName}</p>
              <p className="mt-2 text-xs text-text-disabled">
                {c.startAt} 至 {c.endAt}
              </p>
            </div>

            {/* 右侧按钮 */}
            {c.status === 'available' && (
              <div className="flex flex-shrink-0 items-center pr-3">
                <Link
                  href="/"
                  className="rounded-full bg-primary px-4 py-1.5 text-xs text-white"
                >
                  去使用
                </Link>
              </div>
            )}
            {c.status === 'used' && (
              <div className="flex flex-shrink-0 items-center pr-3">
                <span className="text-xs text-text-disabled">已使用</span>
              </div>
            )}
            {c.status === 'expired' && (
              <div className="flex flex-shrink-0 items-center pr-3">
                <span className="text-xs text-text-disabled">已过期</span>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}