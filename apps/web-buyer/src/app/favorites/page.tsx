'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, PriceText } from '@/components/ui';
import { MOCK_PRODUCTS } from '@/lib/mock-products';

export default function FavoritesPage() {
  const router = useRouter();
  // 默认收藏前 3 个商品
  const [favorites, setFavorites] = useState(
    MOCK_PRODUCTS.slice(0, 3).map((p) => p.id),
  );

  const products = MOCK_PRODUCTS.filter((p) => favorites.includes(p.id));

  const removeFavorite = (id: number) => {
    if (confirm('确定取消收藏这个商品吗？')) {
      setFavorites(favorites.filter((f) => f !== id));
    }
  };

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="sticky top-14 z-40 flex items-center gap-2 border-b border-border bg-bg-card px-4 py-3">
        <button onClick={() => router.back()} className="cursor-pointer text-lg">
          ←
        </button>
        <h1 className="text-base font-bold">我的收藏</h1>
        <span className="ml-auto text-xs text-text-secondary">
          共 {products.length} 件
        </span>
      </div>

      <div className="mx-auto max-w-screen-xl p-4">
        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="text-6xl">❤️</div>
            <p className="text-text-secondary">还没有收藏任何商品</p>
            <Link
              href="/"
              className="rounded-md bg-primary px-4 py-2 text-sm text-white"
            >
              去逛逛
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((p) => (
            <div key={p.id} className="relative">
              <Link href={`/product/${p.id}`}>
                <Card className="overflow-hidden p-0 transition hover:shadow-md">
                  <div className="flex h-40 items-center justify-center bg-bg-page text-6xl">
                    {p.emoji}
                  </div>
                  <div className="p-2">
                    <p className="line-clamp-2 h-10 text-xs text-text-primary">
                      {p.title}
                    </p>
                    <div className="mt-1">
                      <PriceText price={p.price} originalPrice={p.originalPrice} size="sm" />
                    </div>
                    <p className="mt-1 text-xs text-text-disabled">
                      已售 {p.sales}
                    </p>
                  </div>
                </Card>
              </Link>
              <button
                onClick={() => removeFavorite(p.id)}
                className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/80 backdrop-blur transition hover:bg-white"
                aria-label="取消收藏"
              >
                ❤️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}