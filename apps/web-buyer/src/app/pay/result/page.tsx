'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card } from '@/components/ui';

export default function PayResultPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-text-secondary">加载中...</p>
        </div>
      }
    >
      <PayResultPage />
    </Suspense>
  );
}

function PayResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('orderNo') || '';
  const status = searchParams.get('status') || 'success';

  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (status !== 'success') return;
    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === 'success' && countdown === 0) {
      router.push(`/orders/${orderNo}`);
    }
  }, [countdown, status, orderNo, router]);

  const isSuccess = status === 'success';
  const isFailed = status === 'failed';

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="text-6xl">
          {isSuccess ? '✅' : isFailed ? '❌' : '⏳'}
        </div>
        <h1 className="mt-4 text-xl font-bold">
          {isSuccess ? '支付成功' : isFailed ? '支付失败' : '支付处理中'}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {isSuccess
            ? `${countdown} 秒后自动跳转到订单详情`
            : isFailed
              ? '请重试或联系客服'
              : '请稍后刷新查看'}
        </p>

        {orderNo && (
          <p className="mt-3 text-xs text-text-disabled">订单号：{orderNo}</p>
        )}

        <div className="mt-6 flex gap-2">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              继续逛逛
            </Button>
          </Link>
          <Link href={`/orders/${orderNo}`} className="flex-1">
            <Button className="w-full">查看订单</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}