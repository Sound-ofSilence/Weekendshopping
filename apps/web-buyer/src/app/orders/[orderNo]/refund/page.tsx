'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, PriceText } from '@/components/ui';
import { getOrder, updateOrder, type LocalOrder } from '@/lib/order-store';

type RefundType = 'REFUND_ONLY' | 'RETURN_REFUND';

const refundReasons = [
  { value: '不想要了', label: '不想要了' },
  { value: '拍错了', label: '拍错了' },
  { value: '质量问题', label: '质量问题' },
  { value: '卖家发错货', label: '卖家发错货' },
  { value: '收到商品破损', label: '收到商品破损' },
  { value: '其他', label: '其他' },
];

export default function RefundPage() {
  const router = useRouter();
  const params = useParams();
  const orderNo = params.orderNo as string;

  const [order, setOrder] = useState<LocalOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [refundType, setRefundType] = useState<RefundType>('REFUND_ONLY');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const o = getOrder(orderNo);
    if (!o) {
      setNotFound(true);
      setMounted(true);
      return;
    }
    setOrder(o);
    const allIds = o.shopGroups.flatMap((g) => g.items.map((i) => i.id));
    setSelectedItems(allIds);
    setMounted(true);
  }, [orderNo]);

  const allItems = order?.shopGroups.flatMap((g) => g.items) ?? [];
  const refundAmount = allItems
    .filter((i) => selectedItems.includes(i.id))
    .reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);

  const toggleItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (selectedItems.length === 0) {
      alert('请选择要退款的商品');
      return;
    }
    if (!reason) {
      alert('请选择退款原因');
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      updateOrder(orderNo, {
        status: 'CANCELLED',
        remark: `申请退款：${reason}`,
      });
      alert('退款申请已提交，商家将在 48 小时内处理');
      router.push(`/orders/${orderNo}`);
    } catch (err) {
      console.error('退款申请失败:', err);
      alert('提交失败，请重试');
      setSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-bg-page pb-24">
      <div className="sticky top-14 z-40 flex items-center gap-2 border-b border-border bg-bg-card px-4 py-3">
        <button onClick={() => router.back()} className="cursor-pointer text-lg">
          ←
        </button>
        <h1 className="text-base font-bold">申请售后</h1>
      </div>

      <div className="mx-auto max-w-screen-xl space-y-3 p-4">
        <Card className="rounded-none p-4">
          <h3 className="mb-3 text-sm font-bold">售后类型</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setRefundType('REFUND_ONLY')}
              className={`flex-1 cursor-pointer rounded-md border p-3 text-center transition ${
                refundType === 'REFUND_ONLY'
                  ? 'border-primary bg-primary-light'
                  : 'border-border hover:border-primary'
              }`}
            >
              <p className="text-sm font-medium">仅退款</p>
              <p className="mt-1 text-xs text-text-secondary">未收到货</p>
            </button>
            <button
              onClick={() => setRefundType('RETURN_REFUND')}
              className={`flex-1 cursor-pointer rounded-md border p-3 text-center transition ${
                refundType === 'RETURN_REFUND'
                  ? 'border-primary bg-primary-light'
                  : 'border-border hover:border-primary'
              }`}
            >
              <p className="text-sm font-medium">退货退款</p>
              <p className="mt-1 text-xs text-text-secondary">已收到货</p>
            </button>
          </div>
        </Card>

        <Card className="rounded-none p-4">
          <h3 className="mb-3 text-sm font-bold">选择退款商品</h3>
          <div className="space-y-3">
            {allItems.map((item) => {
              const selected = selectedItems.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className="flex w-full cursor-pointer items-center gap-3 text-left"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleItem(item.id)}
                    className="h-4 w-4 flex-shrink-0 cursor-pointer accent-primary"
                  />
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-bg-page text-2xl">
                    {item.emoji}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="line-clamp-1 text-sm">{item.title}</h4>
                    <p className="mt-0.5 text-xs text-text-secondary">{item.spec}</p>
                  </div>
                  <div className="text-right">
                    <PriceText price={item.price} size="sm" />
                    <p className="mt-0.5 text-xs text-text-secondary">×{item.quantity}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-none p-4">
          <h3 className="mb-3 text-sm font-bold">退款原因</h3>
          <div className="flex flex-wrap gap-2">
            {refundReasons.map((r) => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm transition ${
                  reason === r.value
                    ? 'border-primary bg-primary-light text-primary'
                    : 'border-border text-text-secondary hover:border-primary'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="rounded-none p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">退款金额</span>
            <PriceText price={refundAmount.toFixed(2)} size="md" />
          </div>
          <p className="mt-2 text-xs text-text-disabled">
            最多可退 ¥{refundAmount.toFixed(2)}
          </p>
        </Card>

        <Card className="rounded-none p-4">
          <h3 className="mb-3 text-sm font-bold">补充说明</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="请填写详细描述，有助于商家更快处理..."
            className="h-24 w-full resize-none rounded-md border border-border bg-bg-page px-3 py-2 text-sm outline-none transition focus:border-primary"
          />
          <p className="mt-1 text-right text-xs text-text-disabled">
            {description.length}/500
          </p>

          <p className="mt-3 mb-2 text-sm font-medium">
            上传凭证 <span className="text-xs text-text-disabled">（最多 9 张）</span>
          </p>
          <div className="flex gap-2">
            {evidence.map((img, i) => (
              <div
                key={i}
                className="flex h-20 w-20 items-center justify-center rounded-md bg-bg-page text-3xl"
              >
                {img}
              </div>
            ))}
            {evidence.length < 9 && (
              <button
                onClick={() => setEvidence([...evidence, '📷'])}
                className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border text-3xl text-text-disabled transition hover:border-primary hover:text-primary"
              >
                +
              </button>
            )}
          </div>
        </Card>
      </div>

      <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-border bg-bg-card md:bottom-0">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm">
            退款金额 <PriceText price={refundAmount.toFixed(2)} size="md" />
          </div>
          <Button size="lg" onClick={handleSubmit} loading={submitting}>
            提交申请
          </Button>
        </div>
      </div>
    </div>
  );
}