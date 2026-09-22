'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { getOrder, type LocalOrder } from '@/lib/order-store';

// 模拟物流轨迹（按时间倒序）
const mockTraces = [
  {
    id: 1,
    time: '2026-09-22 14:30',
    status: '已签收',
    description: '您的快递已签收，感谢使用顺丰速运，期待再次为您服务',
    isLatest: true,
  },
  {
    id: 2,
    time: '2026-09-22 09:20',
    status: '派送中',
    description: '快件已到达【深圳南山网点】，快递员正在派送中，联系电话 138****8888',
  },
  {
    id: 3,
    time: '2026-09-21 22:15',
    status: '运输中',
    description: '快件已离开【广州转运中心】，发往【深圳南山网点】',
  },
  {
    id: 4,
    time: '2026-09-21 15:40',
    status: '运输中',
    description: '快件已到达【广州转运中心】',
  },
  {
    id: 5,
    time: '2026-09-21 10:00',
    status: '已揽收',
    description: '顺丰速运已揽收，快递单号 SF1234567890123',
  },
];

export default function LogisticsPage() {
  const router = useRouter();
  const params = useParams();
  const orderNo = params.orderNo as string;

  const [order, setOrder] = useState<LocalOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const o = getOrder(orderNo);
    if (!o) {
      setNotFound(true);
      setMounted(true);
      return;
    }
    setOrder(o);
    setMounted(true);
  }, [orderNo]);

  const copyTrackingNo = () => {
    navigator.clipboard.writeText('SF1234567890123');
    alert('快递单号已复制');
  };

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">加载中...</p>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">📭</div>
        <p className="text-text-secondary">订单不存在</p>
        <Link href="/orders">
          <Button>返回订单列表</Button>
        </Link>
      </div>
    );
  }

  const allItems = order.shopGroups.flatMap((g) => g.items);

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="sticky top-14 z-40 flex items-center gap-2 border-b border-border bg-bg-card px-4 py-3">
        <button onClick={() => router.back()} className="cursor-pointer text-lg">
          ←
        </button>
        <h1 className="text-base font-bold">物流详情</h1>
      </div>

      <div className="mx-auto max-w-screen-xl space-y-2 p-4">
        {/* 快递信息 */}
        <Card className="rounded-none p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚚</span>
            <div className="flex-1">
              <p className="text-sm font-medium">顺丰速运</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                SF1234567890123
                <button
                  onClick={copyTrackingNo}
                  className="cursor-pointer text-primary hover:underline"
                >
                  复制
                </button>
              </p>
            </div>
            <button
              onClick={() => alert('拨打客服电话：95338')}
              className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-primary hover:text-primary"
            >
              📞 联系快递
            </button>
          </div>
        </Card>

        {/* 物流轨迹时间轴 */}
        <Card className="rounded-none p-4">
          <h3 className="mb-4 text-sm font-bold">物流轨迹</h3>
          <div className="relative">
            {mockTraces.map((trace, idx) => (
              <div key={trace.id} className="relative flex gap-3 pb-5 last:pb-0">
                {/* 时间轴竖线 */}
                {idx < mockTraces.length - 1 && (
                  <div className="absolute left-[7px] top-5 h-full w-px bg-border" />
                )}

                {/* 时间轴圆点 */}
                <div
                  className={`relative z-10 mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 ${
                    trace.isLatest
                      ? 'border-primary bg-primary'
                      : 'border-border bg-bg-card'
                  }`}
                />

                {/* 内容 */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-sm font-medium ${
                        trace.isLatest ? 'text-primary' : 'text-text-primary'
                      }`}
                    >
                      {trace.status}
                    </span>
                    <span className="text-xs text-text-disabled">{trace.time}</span>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    {trace.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 收货地址 */}
        <Card className="rounded-none p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">📍</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{order.address.receiver}</span>
                <span className="text-xs text-text-secondary">{order.address.phone}</span>
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

        {/* 商品 */}
        <Card className="rounded-none p-4">
          <h3 className="mb-3 text-sm font-bold">商品信息</h3>
          <div className="space-y-3">
            {allItems.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-bg-page text-3xl">
                  {item.emoji}
                </div>
                <div className="flex flex-1 flex-col justify-between overflow-hidden">
                  <h4 className="line-clamp-1 text-sm">{item.title}</h4>
                  <p className="text-xs text-text-secondary">{item.spec}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">¥{item.price}</span>
                    <span className="text-xs text-text-secondary">×{item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}