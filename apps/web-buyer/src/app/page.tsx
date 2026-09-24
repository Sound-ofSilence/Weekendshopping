'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, PriceText } from '@/components/ui';
import { searchProducts, type ProductListItem } from '@/lib/product-api';

// 金刚区（静态）
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

export default function Home() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await searchProducts({ page: 1, pageSize: 20 });
        if (!cancelled) setProducts(list);
      } catch (err) {
        if (!cancelled) {
          console.error('加载商品失败:', err);
          setError('加载失败，请检查网络后重试');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const seckillProducts = products.slice(0, 4);

  return (
    <div className="space-y-4 px-4 py-4">
      {/* Banner */}
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
              href={`/search?categoryId=${entry.id}`}
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
      {seckillProducts.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-text-primary">⚡ 限时秒杀</span>
              <span className="rounded bg-error px-2 py-0.5 text-xs text-white">
                02:35:12
              </span>
            </div>
            <Link
              href="/seckill"
              className="text-xs text-text-secondary hover:text-primary"
            >
              全部 &gt;
            </Link>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {seckillProducts.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="flex-shrink-0">
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
      )}

      {/* 猜你喜欢 */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-text-primary">猜你喜欢</h2>

        {loading && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="overflow-hidden p-0">
                <div className="h-40 animate-pulse bg-gray-200" />
                <div className="p-2">
                  <div className="h-4 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="text-6xl">😢</div>
            <p className="text-text-secondary">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-4 py-2 text-sm text-white"
            >
              重新加载
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="text-6xl">📦</div>
            <p className="text-text-secondary">暂无商品</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
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
                      <PriceText price={p.price} size="sm" />
                    </div>
                    <p className="mt-1 text-xs text-text-disabled">
                      已售 {p.sales} · {p.shopName}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}