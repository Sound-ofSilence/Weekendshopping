'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';

export default function SettingsPage() {
  const router = useRouter();
  const [notifyOrder, setNotifyOrder] = useState(true);
  const [notifyPromo, setNotifyPromo] = useState(true);
  const [notifySystem, setNotifySystem] = useState(true);

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      alert('已退出登录（Mock）');
      router.push('/');
    }
  };

  const handleClearCache = () => {
    if (confirm('确定清除本地缓存吗？这会删除购物车和订单草稿。')) {
      localStorage.removeItem('ws_cart');
      alert('缓存已清除');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-bg-page pb-24">
      <div className="sticky top-14 z-40 flex items-center gap-2 border-b border-border bg-bg-card px-4 py-3">
        <button onClick={() => router.back()} className="cursor-pointer text-lg">
          ←
        </button>
        <h1 className="text-base font-bold">设置</h1>
      </div>

      <div className="mx-auto max-w-screen-xl space-y-3 p-4">
        {/* 账号 */}
        <Card className="rounded-none">
          <h3 className="mb-2 text-sm font-bold">账号</h3>
          <div className="space-y-1">
            <button
              onClick={() => alert('修改资料（Mock）')}
              className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-3 text-sm transition hover:bg-bg-page"
            >
              <span>修改资料</span>
              <span className="text-text-disabled">&gt;</span>
            </button>
            <button
              onClick={() => alert('修改密码（Mock）')}
              className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-3 text-sm transition hover:bg-bg-page"
            >
              <span>修改密码</span>
              <span className="text-text-disabled">&gt;</span>
            </button>
            <button
              onClick={() => alert('手机绑定（Mock）')}
              className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-3 text-sm transition hover:bg-bg-page"
            >
              <span>手机绑定</span>
              <span className="text-xs text-text-disabled">138****8888</span>
            </button>
          </div>
        </Card>

        {/* 通知 */}
        <Card className="rounded-none">
          <h3 className="mb-2 text-sm font-bold">通知设置</h3>
          <div className="space-y-1">
            <label className="flex cursor-pointer items-center justify-between rounded-md px-2 py-3 transition hover:bg-bg-page">
              <span className="text-sm">订单通知</span>
              <input
                type="checkbox"
                checked={notifyOrder}
                onChange={(e) => setNotifyOrder(e.target.checked)}
                className="h-5 w-10 cursor-pointer appearance-none rounded-full bg-gray-300 transition checked:bg-primary"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-md px-2 py-3 transition hover:bg-bg-page">
              <span className="text-sm">促销通知</span>
              <input
                type="checkbox"
                checked={notifyPromo}
                onChange={(e) => setNotifyPromo(e.target.checked)}
                className="h-5 w-10 cursor-pointer appearance-none rounded-full bg-gray-300 transition checked:bg-primary"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-md px-2 py-3 transition hover:bg-bg-page">
              <span className="text-sm">系统通知</span>
              <input
                type="checkbox"
                checked={notifySystem}
                onChange={(e) => setNotifySystem(e.target.checked)}
                className="h-5 w-10 cursor-pointer appearance-none rounded-full bg-gray-300 transition checked:bg-primary"
              />
            </label>
          </div>
        </Card>

        {/* 通用 */}
        <Card className="rounded-none">
          <h3 className="mb-2 text-sm font-bold">通用</h3>
          <div className="space-y-1">
            <button
              onClick={() => alert('清除缓存（Mock）')}
              className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-3 text-sm transition hover:bg-bg-page"
            >
              <span>清除缓存</span>
              <span className="text-text-disabled">&gt;</span>
            </button>
            <button
              onClick={() => alert('关于我们（Mock）')}
              className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-3 text-sm transition hover:bg-bg-page"
            >
              <span>关于我们</span>
              <span className="text-xs text-text-disabled">v0.1.0</span>
            </button>
            <button
              onClick={() => alert('用户协议（Mock）')}
              className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-3 text-sm transition hover:bg-bg-page"
            >
              <span>用户协议</span>
              <span className="text-text-disabled">&gt;</span>
            </button>
            <button
              onClick={() => alert('隐私政策（Mock）')}
              className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-3 text-sm transition hover:bg-bg-page"
            >
              <span>隐私政策</span>
              <span className="text-text-disabled">&gt;</span>
            </button>
          </div>
        </Card>

        {/* 退出 */}
        <Button variant="danger" size="lg" className="w-full" onClick={handleLogout}>
          退出登录
        </Button>
      </div>
    </div>
  );
}