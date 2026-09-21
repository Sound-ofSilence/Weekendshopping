import type { Metadata } from 'next';
import './globals.css';
import { TopBar } from '@/components/layout/TopBar';
import { TabBar } from '@/components/layout/TabBar';

export const metadata: Metadata = {
  title: 'Weekend Shopping - 多商家电商平台',
  description: '精选好物，周末购物新体验',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-bg-page">
        <TopBar />
        <main className="mx-auto max-w-screen-xl pb-16 md:pb-4">{children}</main>
        <TabBar />
      </body>
    </html>
  );
}