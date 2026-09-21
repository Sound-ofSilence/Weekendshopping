'use client';

import Link from 'next/link';

export function TopBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-card">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="text-xl font-bold text-primary">Weekend</span>
          <span className="ml-1 text-xl font-bold text-text-primary">
            Shopping
          </span>
        </Link>

        {/* 搜索框 */}
        <div className="flex-1">
          <Link
            href="/search"
            className="flex h-9 w-full max-w-2xl items-center rounded-full border border-border bg-bg-page px-4 text-sm text-text-disabled transition hover:border-primary"
          >
            <span className="mr-2">🔍</span>
            <span>搜索商品、品牌、店铺</span>
          </Link>
        </div>

        {/* 右侧图标 */}
        <nav className="flex flex-shrink-0 items-center gap-3">
          <Link
            href="/notifications"
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-gray-100"
            aria-label="消息"
          >
            <span className="text-lg">🔔</span>
          </Link>
          <Link
            href="/me"
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-gray-100"
            aria-label="我的"
          >
            <span className="text-lg">👤</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}