'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, PriceText, StatusTag } from '@/components/ui';
import { getOrder, updateOrder, type LocalOrder } from '@/lib/order-store';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderNo = params.orderNo as string;

  const [order, setOrder] = useState<LocalOrder | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const o = getOrder(orderNo);
    if (!o) {
      setNotFound(true);
      return;
    }
    setOrder(o);
  }, [orderNo]);

  const handleCancel = () => {
    if (!order) return;
    if (confirm('确定取消这笔订单吗？')) {
      updateOrder(orderNo, { status: 'CANCELLED' });
      setOrder({ ...order, status: 'CANCELLED' });
    }
  };

  const handleConfirm = () => {
    if (!order) return;
    if (confirm('确认已收到商品？')) {
      updateOrder(orderNo, { status: 'RECEIVED' });
      setOrder({ ...order, status: 'RECEIVED' });
    }
  };

  if (notFound) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">📭</div>
        <p className="text-text-secondary">订单不存在</p>
        <Link href="/">
          <Button>返回首页</Button>
        </Link>
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

  const status = order.status;

  return (
    <div className="min-h-screen bg-bg-page pb-32">
      <div className="sticky top-14 z-40 flex items-center gap-2 border-b border-border bg-bg-card px-4 py-3">
        <button onClick={() => router.back()} className="cursor-pointer text-lg">
          ←
        </button>
        <h1 className="text-base font-bold">订单详情</h1>
      </div>

      <div className="mx-auto max-w-screen-xl space-y-2 p-4">
        <Card className="rounded-none">
          <div className="flex items-center justify-between">
            <StatusTag status={status} />
            <span className="text-xs text-text-secondary">
              {status === 'PENDING_PAY' && '请在 30 分钟内完成支付'}
              {status === 'PAID' && '商家将在 48 小时内发货'}
              {status === 'SHIPPED' && '商品正在配送中'}
              {status === 'RECEIVED' && '交易已完成，欢迎评价'}
              {status === 'CANCELLED' && '订单已取消'}
            </span>
          </div>
        </Card>

        <Card className="rounded-none">
          <div className="flex items-start gap-3">
            <span className="text-xl">📍</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{order.address.receiver}</span>
                <span className="text-xs text-text-secondary">
                  {order.address.phone}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                {order.address.province}
                {order.address.city}
                {order.address.district}
                {order.address.detail}
              </p>
            </div>
          </div>
        </Card>

        {order.shopGroups.map((group) => (
          <Card key={group.shopId} className="rounded-none">
            <h3 className="mb-3 text-sm font-medium">🏪 {group.shopName}</h3>
            <div className="space-y-3">
              {group.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-bg-page text-3xl">
                    {item.emoji}
                  </div>
                  <div className="flex flex-1 flex-col justify-between overflow-hidden">
                    <h4 className="line-clamp-1 text-sm">{item.title}</h4>
                    <p className="text-xs text-text-secondary">{item.spec}</p>
                    <div className="flex items-center justify-between">
                      <PriceText price={item.price} size="sm" />
                      <span className="text-xs text-text-secondary">
                        ×{item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Card className="rounded-none">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">商品金额</span>
              <span>¥{order.totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">运费</span>
              <span>¥{order.freightAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">优惠</span>
              <span className="text-primary">-¥{order.discountAmount}</span>
            </div>
            <div className="flex justify-between border-t border-border-light pt-2">
              <span className="font-medium">实付款</span>
              <PriceText price={order.payAmount} size="md" />
            </div>
          </div>
        </Card>

        <Card className="rounded-none">
          <h3 className="mb-3 text-sm font-bold">订单信息</h3>
          <div className="space-y-2 text-xs text-text-secondary">
            <div className="flex justify-between">
              <span>订单号</span>
              <span className="font-mono">{order.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span>创建时间</span>
              <span>{order.createdAt}</span>
            </div>
            {order.paidAt && (
              <div className="flex justify-between">
                <span>支付时间</span>
                <span>{order.paidAt}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>支付方式</span>
              <span>支付宝（Mock）</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-border bg-bg-card md:bottom-0">
        <div className="mx-auto flex max-w-screen-xl items-center justify-end gap-2 px-4 py-3">
          {status === 'PENDING_PAY' && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                取消订单
              </Button>
              <Button onClick={() => router.push(`/pay/${order.orderNo}`)}>
                立即付款
              </Button>
            </>
          )}
          {status === 'PAID' && (
            <Button variant="outline" onClick={() => alert('退款申请（Mock）')}>
              申请退款
            </Button>
          )}
          {status === 'SHIPPED' && (
            <>
              <Button variant="outline" onClick={() => alert('查看物流（Mock）')}>
                查看物流
              </Button>
              <Button onClick={handleConfirm}>确认收货</Button>
            </>
          )}
          {status === 'RECEIVED' && (
            <Button onClick={() => alert('去评价（Mock）')}>去评价</Button>
          )}
          {status === 'CANCELLED' && (
            <Link href="/">
              <Button variant="outline">再逛逛</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}