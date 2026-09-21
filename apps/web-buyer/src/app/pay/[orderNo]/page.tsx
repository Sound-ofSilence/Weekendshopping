'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, PriceText } from '@/components/ui';
import { getOrder, updateOrder, type LocalOrder } from '@/lib/order-store';

type PaymentChannel = 'alipay' | 'wechat';

export default function PayPage() {
  const router = useRouter();
  const params = useParams();
  const orderNo = params.orderNo as string;

  const [order, setOrder] = useState<LocalOrder | null>(null);
  const [channel, setChannel] = useState<PaymentChannel>('alipay');
  const [paying, setPaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const o = getOrder(orderNo);
    if (!o) {
      setNotFound(true);
      return;
    }
    setOrder(o);
  }, [orderNo]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handlePay = async () => {
    if (paying || !order) return;
    setPaying(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      updateOrder(orderNo, {
        status: 'PAID',
        paidAt: new Date().toLocaleString('zh-CN'),
      });
      window.location.href = `/pay/result?orderNo=${orderNo}&status=success`;
    } catch (err) {
      console.error('支付失败:', err);
      alert('支付失败，请重试');
      setPaying(false);
    }
  };

  if (notFound) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">📭</div>
        <p className="text-text-secondary">订单不存在或已过期</p>
        <Button onClick={() => router.push('/')}>返回首页</Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="sticky top-14 z-40 flex items-center gap-2 border-b border-border bg-bg-card px-4 py-3">
        <button onClick={() => router.back()} className="cursor-pointer text-lg">
          ←
        </button>
        <h1 className="text-base font-bold">收银台</h1>
      </div>

      <div className="mx-auto max-w-screen-xl space-y-4 p-4">
        <Card className="flex flex-col items-center py-8">
          <p className="text-sm text-text-secondary">支付金额</p>
          <div className="mt-2">
            <PriceText price={order.payAmount} size="lg" />
          </div>
          <p className="mt-3 text-xs text-text-secondary">
            支付剩余时间
            <span className="ml-1 font-medium text-error">
              {formatTime(timeLeft)}
            </span>
          </p>
          <p className="mt-2 text-xs text-text-disabled">订单号：{order.orderNo}</p>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-bold">选择支付方式</h3>
          <div className="space-y-2">
            <button
              onClick={() => setChannel('alipay')}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-md border p-3 transition ${
                channel === 'alipay'
                  ? 'border-primary bg-primary-light'
                  : 'border-border hover:border-primary'
              }`}
            >
              <span className="text-2xl">💙</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">支付宝</p>
                <p className="text-xs text-text-secondary">
                  推荐有支付宝账号的用户使用
                </p>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  channel === 'alipay' ? 'border-primary' : 'border-border'
                }`}
              >
                {channel === 'alipay' && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </div>
            </button>

            <button
              onClick={() => setChannel('wechat')}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-md border p-3 transition ${
                channel === 'wechat'
                  ? 'border-primary bg-primary-light'
                  : 'border-border hover:border-primary'
              }`}
            >
              <span className="text-2xl">💚</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">微信支付</p>
                <p className="text-xs text-text-secondary">
                  推荐已开通微信支付的用户使用
                </p>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  channel === 'wechat' ? 'border-primary' : 'border-border'
                }`}
              >
                {channel === 'wechat' && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </div>
            </button>
          </div>
        </Card>

        <Button size="lg" className="w-full" onClick={handlePay} loading={paying}>
          确认支付 ¥{order.payAmount}
        </Button>

        <p className="text-center text-xs text-text-disabled">
          ⚠️ 当前为 Mock 支付，点击后会跳转模拟结果页
        </p>
      </div>
    </div>
  );
}