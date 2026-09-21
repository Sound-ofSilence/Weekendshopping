'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';

const categories = [
  {
    id: 1,
    name: '推荐',
    icon: '🎯',
    children: [
      { id: 11, name: '女装', icon: '👗' },
      { id: 12, name: '男装', icon: '👔' },
      { id: 13, name: '数码', icon: '📱' },
      { id: 14, name: '家居', icon: '🏠' },
      { id: 15, name: '美妆', icon: '💄' },
      { id: 16, name: '母婴', icon: '🍼' },
    ],
  },
  {
    id: 2,
    name: '女装',
    icon: '👗',
    children: [
      { id: 21, name: '连衣裙', icon: '👗' },
      { id: 22, name: 'T 恤', icon: '👕' },
      { id: 23, name: '外套', icon: '🧥' },
      { id: 24, name: '半身裙', icon: '👚' },
      { id: 25, name: '牛仔裤', icon: '👖' },
      { id: 26, name: '针织衫', icon: '🧶' },
    ],
  },
  {
    id: 3,
    name: '男装',
    icon: '👔',
    children: [
      { id: 31, name: '衬衫', icon: '👔' },
      { id: 32, name: 'T 恤', icon: '👕' },
      { id: 33, name: '西装', icon: '🤵' },
      { id: 34, name: '夹克', icon: '🧥' },
      { id: 35, name: '休闲裤', icon: '👖' },
    ],
  },
  { id: 4, name: '数码', icon: '📱', children: [] },
  { id: 5, name: '家居', icon: '🏠', children: [] },
  { id: 6, name: '美妆', icon: '💄', children: [] },
  { id: 7, name: '母婴', icon: '🍼', children: [] },
  { id: 8, name: '图书', icon: '📚', children: [] },
  { id: 9, name: '运动', icon: '⚽', children: [] },
  { id: 10, name: '汽车', icon: '🚗', children: [] },
];

export default function CategoryPage() {
  const [activeId, setActiveId] = useState(1);
  const active = categories.find((c) => c.id === activeId) || categories[0];

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
        <div className="space-y-4">
          {/* 当前类目 Banner */}
          <div className="flex h-32 flex-col justify-center rounded-lg bg-gradient-to-r from-orange-400 to-red-500 px-6 text-white">
            <h2 className="text-2xl font-bold">{active.name}</h2>
            <p className="mt-1 text-sm opacity-90">精选好物，品质保障</p>
          </div>

          {/* 二级类目网格 */}
          {active.children.length > 0 && (
            <Card>
              <h3 className="mb-3 text-sm font-bold text-text-primary">
                热门分类
              </h3>
              <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                {active.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/search?categoryId=${child.id}`}
                    className="flex flex-col items-center gap-2 rounded-md p-3 transition hover:bg-bg-page"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-2xl">
                      {child.icon}
                    </div>
                    <span className="text-xs text-text-secondary">
                      {child.name}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* 品牌墙 */}
          <Card>
            <h3 className="mb-3 text-sm font-bold text-text-primary">热门品牌</h3>
            <div className="flex flex-wrap gap-2">
              {['Uniqlo', 'Nike', 'Adidas', 'Zara', 'H&M', 'Gucci'].map((brand) => (
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
      </section>
    </div>
  );
}