'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Input, PriceText } from '@/components/ui';
import { searchProducts, type ProductListItem } from '@/lib/product-api';

type SortType = 'default' | 'sales' | 'price_asc' | 'price_desc';

const sorts: { value: SortType; label: string }[] = [
  { value: 'default', label: '综合' },
  { value: 'sales', label: '销量' },
  { value: 'price_asc', label: '价格 ↑' },
  { value: 'price_desc', label: '价格 ↓' },
];

export default function SearchPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-text-secondary">加载中...</p>
        </div>
      }
    >
      <SearchPage />
    </Suspense>
  );
}

function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get('keyword') || '';
  const initialCategoryId = searchParams.get('categoryId')
    ? Number(searchParams.get('categoryId'))
    : undefined;

  const [keyword, setKeyword] = useState(initialKeyword);
  const [sort, setSort] = useState<SortType>('default');
  const [showFilter, setShowFilter] = useState(false);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await searchProducts({
        keyword: initialKeyword || undefined,
        categoryId: initialCategoryId,
        sort: sort === 'default' ? undefined : sort,
        page: 1,
        pageSize: 40,
      });
      setProducts(list);
    } catch (err) {
      console.error('搜索失败:', err);
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [initialKeyword, initialCategoryId, sort]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = () => {
    if (keyword.trim()) {
      router.push(`/search?keyword=${encodeURIComponent(keyword.trim())}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <div className="min-h-screen bg-bg-page">
      {/* 搜索头 */}
      <div className="sticky top-14 z-40 border-b border-border bg-bg-card px-4 py-2">
        <div className="mx-auto flex max-w-screen-xl items-center gap-2">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="返回"
          >
            ←
          </button>
          <div className="flex-1">
            <Input
              placeholder="搜索商品、品牌、店铺"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button size="md" onClick={handleSearch}>
            搜索
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="sticky top-[104px] z-30 border-b border-border bg-bg-card px-4 py-2">
        <div className="mx-auto flex max-w-screen-xl items-center gap-1">
          {sorts.map((s) => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm transition ${
                sort === s.value
                  ? 'bg-primary-light font-medium text-primary'
                  : 'text-text-secondary hover:bg-bg-page'
              }`}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={() => setShowFilter(true)}
            className="ml-auto flex cursor-pointer items-center gap-1 rounded-md px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-page"
          >
            ⚙ 筛选
          </button>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="mx-auto max-w-screen-xl px-4 py-4">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="flex gap-3 p-3">
                <div className="h-24 w-24 flex-shrink-0 animate-pulse rounded-md bg-gray-200" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="mt-auto h-6 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="text-6xl">😢</div>
            <p className="text-text-secondary">{error}</p>
            <Button onClick={loadProducts}>重新加载</Button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="text-6xl">🔍</div>
            <p className="text-text-secondary">
             {initialKeyword
                ? `没有找到「${initialKeyword}」相关商品`
                 : initialCategoryId
                  ? '该分类暂无商品'
                : '暂无商品'}
            </p>
            <Button onClick={() => router.push('/search')}>查看全部商品</Button>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <p className="mb-3 text-xs text-text-secondary">
              {initialKeyword ? (
                <>
                  搜索「{initialKeyword}」找到{' '}
                  <span className="font-medium text-text-primary">{products.length}</span> 件商品
                </>
              ) : (
                <>
                  共{' '}
                  <span className="font-medium text-text-primary">{products.length}</span> 件商品
                </>
              )}
            </p>

            <div className="space-y-3">
              {products.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`}>
                  <Card className="flex gap-3 p-3 transition hover:shadow-md">
                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-md bg-bg-page text-5xl">
                      {p.emoji}
                    </div>
                    <div className="flex flex-1 flex-col justify-between overflow-hidden">
                      <div>
                        <h3 className="line-clamp-2 text-sm text-text-primary">{p.title}</h3>
                        <p className="mt-1 text-xs text-text-secondary">{p.shopName}</p>
                      </div>
                      <div className="flex items-end justify-between">
                        <PriceText price={p.price} size="md" />
                        <span className="text-xs text-text-disabled">已售 {p.sales}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 筛选抽屉（占位） */}
      {showFilter && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setShowFilter(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-80 max-w-[80vw] overflow-y-auto bg-bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">筛选</h3>
              <button
                onClick={() => setShowFilter(false)}
                className="cursor-pointer text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-text-secondary">筛选功能将在 P8 完善</p>
            <Button className="mt-6 w-full" onClick={() => setShowFilter(false)}>
              关闭
            </Button>
          </div>
        </>
      )}
    </div>
  );
}