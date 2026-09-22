'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Input, PriceText } from '@/components/ui';
import { MOCK_PRODUCTS, type MockProduct } from '@/lib/mock-products';

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

  const [keyword, setKeyword] = useState(initialKeyword);
  const [sort, setSort] = useState<SortType>('default');
  const [showFilter, setShowFilter] = useState(false);

  const handleSearch = () => {
    if (keyword.trim()) {
      router.push(`/search?keyword=${encodeURIComponent(keyword)}`);
    } else {
      router.push('/search');
    }
  };

  // 根据关键词过滤 + 排序
  const sortedProducts = useMemo(() => {
    let list: MockProduct[] = [...MOCK_PRODUCTS];

    // 关键词过滤（标题包含）
    if (initialKeyword) {
      const kw = initialKeyword.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(kw));
    }

    // 排序
    switch (sort) {
      case 'sales':
        return list.sort((a, b) => parseSales(b.sales) - parseSales(a.sales));
      case 'price_asc':
        return list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case 'price_desc':
        return list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      default:
        return list;
    }
  }, [initialKeyword, sort]);

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
        <p className="mb-3 text-xs text-text-secondary">
          {initialKeyword ? (
            <>
              搜索「{initialKeyword}」找到{' '}
              <span className="font-medium text-text-primary">
                {sortedProducts.length}
              </span>{' '}
              件商品
            </>
          ) : (
            <>
              找到{' '}
              <span className="font-medium text-text-primary">
                {sortedProducts.length}
              </span>{' '}
              件商品
            </>
          )}
        </p>

        {sortedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="text-6xl">🔍</div>
            <p className="text-text-secondary">没有找到相关商品</p>
            <Button onClick={() => router.push('/search')}>查看全部商品</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedProducts.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`}>
                <Card className="flex gap-3 p-3 transition hover:shadow-md">
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-md bg-bg-page text-5xl">
                    {p.emoji}
                  </div>
                  <div className="flex flex-1 flex-col justify-between overflow-hidden">
                    <div>
                      <h3 className="line-clamp-2 text-sm text-text-primary">
                        {p.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded border border-primary/30 px-1.5 py-0.5 text-xs text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <PriceText price={p.price} originalPrice={p.originalPrice} size="md" />
                      <span className="text-xs text-text-disabled">已售 {p.sales}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 筛选抽屉 */}
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

            <div className="space-y-6">
              <section>
                <h4 className="mb-3 text-sm font-bold text-text-primary">价格区间</h4>
                <div className="flex gap-2">
                  <Input placeholder="最低价" />
                  <Input placeholder="最高价" />
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-sm font-bold text-text-primary">发货地</h4>
                <div className="flex flex-wrap gap-2">
                  {['不限', '广东', '浙江', '江苏', '北京', '上海'].map((loc) => (
                    <button
                      key={loc}
                      className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition hover:border-primary hover:text-primary"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-sm font-bold text-text-primary">服务</h4>
                <div className="flex flex-wrap gap-2">
                  {['包邮', '7 天无理由', '运费险', '闪电发货'].map((svc) => (
                    <button
                      key={svc}
                      className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition hover:border-primary hover:text-primary"
                    >
                      {svc}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-8 flex gap-2">
              <Button variant="outline" className="flex-1">
                重置
              </Button>
              <Button className="flex-1" onClick={() => setShowFilter(false)}>
                确定
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function parseSales(s: string): number {
  if (s.includes('万')) {
    return parseFloat(s.replace('万', '')) * 10000;
  }
  return parseFloat(s);
}