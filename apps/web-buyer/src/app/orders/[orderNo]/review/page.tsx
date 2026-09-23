'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { getOrder, updateOrder, type LocalOrder } from '@/lib/order-store';

interface ReviewItem {
  orderItemId: number;
  title: string;
  spec: string;
  emoji: string;
  rating: number;
  content: string;
  images: string[];
}

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const orderNo = params.orderNo as string;

  const [order, setOrder] = useState<LocalOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const o = getOrder(orderNo);
    if (!o) {
      setNotFound(true);
      setMounted(true);
      return;
    }
    setOrder(o);

    // 初始化每个订单项的评价
    const items = o.shopGroups.flatMap((g) =>
      g.items.map((item) => ({
        orderItemId: item.id,
        title: item.title,
        spec: item.spec,
        emoji: item.emoji,
        rating: 5,
        content: '',
        images: [],
      })),
    );
    setReviews(items);
    setMounted(true);
  }, [orderNo]);

  const updateReview = (orderItemId: number, patch: Partial<ReviewItem>) => {
    setReviews((prev) =>
      prev.map((r) => (r.orderItemId === orderItemId ? { ...r, ...patch } : r)),
    );
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // 校验：所有商品必须填内容
    const emptyContent = reviews.find((r) => !r.content.trim());
    if (emptyContent) {
      alert(`「${emptyContent.title}」请填写评价内容`);
      return;
    }

    setSubmitting(true);
    try {
      // 模拟提交
      await new Promise((r) => setTimeout(r, 800));

      // 更新订单状态为已完成
      if (order) {
        updateOrder(orderNo, { status: 'FINISHED' });
      }

      alert('评价提交成功，感谢您的反馈！');
      router.push(`/orders/${orderNo}`);
    } catch (err) {
      console.error('评价提交失败:', err);
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
        <h1 className="text-base font-bold">发表评价</h1>
      </div>

      <div className="mx-auto max-w-screen-xl space-y-3 p-4">
        {reviews.map((review) => (
          <Card key={review.orderItemId} className="rounded-none p-4">
            {/* 商品信息 */}
            <div className="flex gap-3 border-b border-border-light pb-3">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-bg-page text-3xl">
                {review.emoji}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="line-clamp-1 text-sm">{review.title}</h3>
                <p className="mt-1 text-xs text-text-secondary">{review.spec}</p>
              </div>
            </div>

            {/* 评分 */}
            <div className="mt-3">
              <p className="mb-2 text-sm font-medium">商品评分</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => updateReview(review.orderItemId, { rating: star })}
                    className="cursor-pointer text-3xl transition hover:scale-110"
                    aria-label={`${star} 星`}
                  >
                    {star <= review.rating ? '⭐' : '☆'}
                  </button>
                ))}
                <span className="ml-2 text-sm text-text-secondary">
                  {review.rating} 分
                </span>
              </div>
            </div>

            {/* 评价内容 */}
            <div className="mt-3">
              <p className="mb-2 text-sm font-medium">评价内容</p>
              <textarea
                value={review.content}
                onChange={(e) =>
                  updateReview(review.orderItemId, {
                    content: e.target.value.slice(0, 500),
                  })
                }
                placeholder="说说使用感受吧，分享给其他小伙伴～"
                className="h-24 w-full resize-none rounded-md border border-border bg-bg-page px-3 py-2 text-sm outline-none transition focus:border-primary"
              />
              <p className="mt-1 text-right text-xs text-text-disabled">
                {review.content.length}/500
              </p>
            </div>

            {/* 上传图片（模拟） */}
            <div className="mt-3">
              <p className="mb-2 text-sm font-medium">
                上传图片 <span className="text-xs text-text-disabled">（最多 9 张）</span>
              </p>
              <div className="flex gap-2">
                {review.images.map((img, i) => (
                  <div
                    key={i}
                    className="flex h-20 w-20 items-center justify-center rounded-md bg-bg-page text-3xl"
                  >
                    {img}
                  </div>
                ))}
                {review.images.length < 9 && (
                  <button
                    onClick={() =>
                      updateReview(review.orderItemId, {
                        images: [...review.images, '📷'].slice(0, 9),
                      })
                    }
                    className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border text-3xl text-text-disabled transition hover:border-primary hover:text-primary"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 底部固定操作栏 */}
      <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-border bg-bg-card md:bottom-0">
        <div className="mx-auto flex max-w-screen-xl items-center justify-end gap-3 px-4 py-3">
          <Button size="lg" onClick={handleSubmit} loading={submitting}>
            提交评价
          </Button>
        </div>
      </div>
    </div>
  );
}