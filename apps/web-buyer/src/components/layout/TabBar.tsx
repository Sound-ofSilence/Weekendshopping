'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/category', label: '分类', icon: '📋' },
  { href: '/cart', label: '购物车', icon: '🛒' },
  { href: '/me', label: '我的', icon: '👤' },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-card md:hidden">
      <div className="flex h-14">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition ${
                active ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}