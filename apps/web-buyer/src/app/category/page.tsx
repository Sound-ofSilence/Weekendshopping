'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { getCategoryTree, type Category } from '@/lib/product-api';

// 品牌墙（一期静态）
const BRANDS = ['Uniqlo', 'Nike', 'Adidas', 'Zara', 'H&M', 'Gucci'];

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const tree = await getCategoryTree();
        if (!cancelled) {
          setCategories(tree);
          if (tree.length > 0) setActiveId(tree[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('加载类目失败:', err);
          setError('加载失败，请重试');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeId) ?? categories[0],
    [categories, activeId],
  );

  // 加载中
  if (loading) {
    return (
      <div className="flex min-h-screen">
        <aside className="w-20 flex-shrink-0 border-r border-border bg-bg-card md:w-24">
          <div className="space-y-1 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-gray-100" />
            ))}
          </div>
        </aside>
        <section className="flex-1 p-4">
          <div className="h-32 animate-pulse rounded-lg bg-gray-200" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-md bg-gray-100" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  // 错误
  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">😢</div>
        <p className="text-text-secondary">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* 左侧一级类目 */}
      <aside className="w-20 flex-shrink-0 border-r border-border bg-bg-card md:w-24">
        <div className="sticky top-14">
          {categories.map((cat) => {
            const active = cat.id === activeId;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveId(cat.id)}
                className={`relative flex h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 transition ${
                  active
                    ? 'bg-bg-page font-medium text-primary'
                    : 'text-text-secondary hover:bg-bg-page'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-primary" />
                )}
                <span className="text-lg">{cat.icon}</span>
                <span className="text-xs">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* 右侧内容 */}
      <section className="flex-1 overflow-y-auto p-4">
        {activeCategory && (
          <div className="space-y-4">
            {/* 当前类目 Banner */}
            <div className="flex h-32 flex-col justify-center rounded-lg bg-gradient-to-r from-orange-400 to-red-500 px-6 text-white">
              <h2 className="text-2xl font-bold">{activeCategory.name}</h2>
              <p className="mt-1 text-sm opacity-90">精选好物，品质保障</p>
            </div>

            {/* 二级类目网格 */}
            {activeCategory.children.length > 0 && (
              <Card>
                <h3 className="mb-3 text-sm font-bold text-text-primary">热门分类</h3>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                  {activeCategory.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/search?categoryId=${child.id}`}
                      className="flex flex-col items-center gap-2 rounded-md p-3 transition hover:bg-bg-page"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-2xl">
                        {child.icon}
                      </div>
                      <span className="text-xs text-text-secondary">{child.name}</span>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* 品牌墙 */}
            <Card>
              <h3 className="mb-3 text-sm font-bold text-text-primary">热门品牌</h3>
              <div className="flex flex-wrap gap-2">
                {BRANDS.map((brand) => (
                  <Link
                    key={brand}
                    href={`/search?keyword=${brand}`}
                    className="rounded-full border border-border bg-bg-card px-4 py-1.5 text-xs text-text-secondary transition hover:border-primary hover:text-primary"
                  >
                    {brand}
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}