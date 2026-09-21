'use client';

import { Card, PriceText } from '@/components/ui';
import Link from 'next/link';

// ============ 静态数据（后续接 API） ============

const quickEntries = [
  { id: 1, name: '女装', icon: '👗' },
  { id: 2, name: '男装', icon: '👔' },
  { id: 3, name: '数码', icon: '📱' },
  { id: 4, name: '家居', icon: '🏠' },
  { id: 5, name: '美妆', icon: '💄' },
  { id: 6, name: '母婴', icon: '🍼' },
  { id: 7, name: '图书', icon: '📚' },
  { id: 8, name: '运动', icon: '⚽' },
  { id: 9, name: '汽车', icon: '🚗' },
  { id: 10, name: '更多', icon: '🎁' },
];

const banners = [
  { id: 1, title: '周末大促', desc: '全场满 200 减 30', bg: 'from-orange-400 to-red-500' },
  { id: 2, title: '新品首发', desc: '限时 8 折', bg: 'from-blue-400 to-purple-500' },
  { id: 3, title: '超级秒杀', desc: '每天 10 点开抢', bg: 'from-pink-400 to-orange-500' },
];

const products = [
  { id: 1, title: '2026 新款连衣裙 显瘦气质', price: '99.00', originalPrice: '199.00', sales: '1.2万', emoji: '👗' },
  { id: 2, title: '真皮男士商务休闲鞋', price: '288.00', originalPrice: '599.00', sales: '8560', emoji: '👞' },
  { id: 3, title: '无线蓝牙耳机 主动降噪', price: '399.00', originalPrice: '699.00', sales: '3.5万', emoji: '🎧' },
  { id: 4, title: '简约北欧风台灯', price: '129.00', originalPrice: '259.00', sales: '1243', emoji: '💡' },
  { id: 5, title: '冬季加厚羽绒服', price: '599.00', originalPrice: '1299.00', sales: '5678', emoji: '🧥' },
  { id: 6, title: '智能手表运动款', price: '899.00', originalPrice: '1599.00', sales: '2.1万', emoji: '⌚' },
];

// ============ 页面 ============

export default function Home() {
  return (
    <div className="space-y-4 px-4 py-4">
      {/* Banner 轮播位 */}
      <div className="grid gap-3 md:grid-cols-3">
        {banners.map((b) => (
          <div
            key={b.id}
            className={`flex h-32 flex-col justify-center rounded-lg bg-gradient-to-r ${b.bg} px-6 text-white md:h-40`}
          >
            <h3 className="text-xl font-bold">{b.title}</h3>
            <p className="mt-1 text-sm opacity-90">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* 金刚区 */}
      <Card className="py-6">
        <div className="grid grid-cols-5 gap-y-4">
          {quickEntries.map((entry) => (
            <Link
              key={entry.id}
              href={`/category?cid=${entry.id}`}
              className="flex flex-col items-center gap-2 transition hover:opacity-80"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-2xl">
                {entry.icon}
              </div>
              <span className="text-xs text-text-secondary">{entry.name}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* 秒杀区 */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">⚡ 限时秒杀</span>
            <span className="rounded bg-error px-2 py-0.5 text-xs text-white">
              02:35:12
            </span>
          </div>
          <Link href="/seckill" className="text-xs text-text-secondary hover:text-primary">
            全部 &gt;
          </Link>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {products.slice(0, 4).map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="flex-shrink-0"
            >
              <div className="w-24 overflow-hidden rounded-md bg-bg-page">
                <div className="flex h-24 w-24 items-center justify-center text-4xl">
                  {p.emoji}
                </div>
              </div>
              <p className="mt-1 w-24 truncate text-xs text-text-secondary">
                {p.title}
              </p>
              <PriceText price={p.price} size="sm" />
            </Link>
          ))}
        </div>
      </Card>

      {/* 猜你喜欢 */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-text-primary">猜你喜欢</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((p) => (
            <Link key={p.id} href={`/product/${p.id}`}>
              <Card className="overflow-hidden p-0 transition hover:shadow-md">
                <div className="flex h-40 items-center justify-center bg-bg-page text-6xl">
                  {p.emoji}
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 h-10 text-xs text-text-primary">
                    {p.title}
                  </p>
                  <div className="mt-1 flex items-baseline justify-between">
                    <PriceText price={p.price} originalPrice={p.originalPrice} size="sm" />
                  </div>
                  <p className="mt-1 text-xs text-text-disabled">
                    已售 {p.sales}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}