'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, PriceText } from '@/components/ui';

const mockProduct = {
  id: 1,
  title: '2026 新款连衣裙 显瘦气质 春秋必备',
  subtitle: '精选面料 显瘦气质',
  price: '99.00',
  originalPrice: '199.00',
  sales: '1.2万',
  rating: '4.9',
  emoji: '👗',
  images: ['👗', '👚', '👘', '🧥'],
  specs: [
    { name: '颜色', values: ['黑色', '白色', '灰色'] },
    { name: '尺码', values: ['S', 'M', 'L', 'XL'] },
  ],
  shop: { id: 1, name: 'XX旗舰店', rating: '4.8', followers: '12万' },
  reviews: [
    { id: 1, user: '用户***', rating: 5, content: '质量很好，物流也快，值得回购！' },
    { id: 2, user: '匿名用户', rating: 5, content: '尺码标准，显瘦效果很好。' },
  ],
};

export default function ProductDetailPage() {
  const router = useRouter();
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [showSkuSheet, setShowSkuSheet] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const allSelected = mockProduct.specs.every((s) => selectedSpecs[s.name]);

  const handleAddCart = () => {
    if (!allSelected) {
      setShowSkuSheet(true);
      return;
    }
    alert('已加入购物车');
  };

  const handleBuyNow = () => {
    if (!allSelected) {
      setShowSkuSheet(true);
      return;
    }
    router.push(`/checkout?skuId=1&qty=${quantity}`);
  };

  return (
    <div className="min-h-screen bg-bg-page pb-32">
      {/* 主图 */}
      <div className="relative flex h-96 items-center justify-center bg-bg-card text-[8rem] md:h-[500px] md:text-[12rem]">
        {mockProduct.images[0]}
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/30 text-white backdrop-blur"
        >
          ←
        </button>
        <div className="absolute bottom-4 right-4 rounded-full bg-black/30 px-3 py-1 text-xs text-white backdrop-blur">
          1 / {mockProduct.images.length}
        </div>
      </div>

      {/* 价格区 */}
      <div className="bg-bg-card px-4 py-3">
        <div className="flex items-baseline gap-2">
          <PriceText price={mockProduct.price} size="lg" />
          <span className="text-sm text-text-disabled line-through">
            ¥{mockProduct.originalPrice}
          </span>
          <span className="rounded bg-error px-2 py-0.5 text-xs text-white">
            限时立减
          </span>
        </div>
        <h1 className="mt-2 text-base font-medium text-text-primary">
          {mockProduct.title}
        </h1>
        <p className="mt-1 text-xs text-text-secondary">{mockProduct.subtitle}</p>
        <p className="mt-2 text-xs text-text-secondary">
          已售 {mockProduct.sales} · 评分 {mockProduct.rating}
        </p>
      </div>

      {/* 优惠券条 */}
      <div className="mt-2 flex items-center gap-2 bg-bg-card px-4 py-3">
        <span className="text-sm text-text-secondary">🎫 优惠券</span>
        <span className="rounded border border-primary px-2 py-0.5 text-xs text-primary">
          满 200 减 30
        </span>
        <span className="ml-auto text-xs text-text-secondary">&gt;</span>
      </div>

      {/* SKU 选择入口 */}
      <button
        onClick={() => setShowSkuSheet(true)}
        className="mt-2 flex w-full cursor-pointer items-center gap-3 bg-bg-card px-4 py-3 text-left"
      >
        <span className="text-sm text-text-secondary">选择</span>
        <span className="text-sm text-text-primary">
          {allSelected
            ? Object.values(selectedSpecs).join(' · ')
            : mockProduct.specs.map((s) => s.name).join(' · ')}
        </span>
        <span className="ml-auto text-xs text-text-secondary">&gt;</span>
      </button>

      {/* 服务 */}
      <div className="mt-2 flex items-center gap-2 bg-bg-card px-4 py-3 text-xs text-text-secondary">
        <span className="text-sm">服务</span>
        <span>包邮</span>
        <span>·</span>
        <span>7 天无理由</span>
        <span>·</span>
        <span>正品保障</span>
      </div>

      {/* 店铺卡 */}
      <Card className="mt-2 rounded-none">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-2xl">
            🏪
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">{mockProduct.shop.name}</h3>
            <p className="mt-0.5 text-xs text-text-secondary">
              评分 {mockProduct.shop.rating} · 粉丝 {mockProduct.shop.followers}
            </p>
          </div>
          <Button variant="outline" size="sm">
            进店
          </Button>
        </div>
      </Card>

      {/* 评价 */}
      <Card className="mt-2 rounded-none">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">评价 ({mockProduct.sales})</h3>
          <span className="text-xs text-text-secondary">好评率 98% &gt;</span>
        </div>
        <div className="mt-3 space-y-3">
          {mockProduct.reviews.map((r) => (
            <div key={r.id} className="border-t border-border-light pt-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs">
                  👤
                </div>
                <span className="text-xs text-text-secondary">{r.user}</span>
                <span className="ml-auto text-xs text-warning">
                  {'★'.repeat(r.rating)}
                </span>
              </div>
              <p className="mt-2 text-sm text-text-primary">{r.content}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 底部固定操作栏（移动端抬 56px 给 TabBar 让位） */}
      <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-border bg-bg-card md:bottom-0">
        <div className="mx-auto flex max-w-screen-xl items-center gap-2 px-4 py-2">
          <button
            onClick={() => alert('客服功能开发中')}
            className="flex cursor-pointer flex-col items-center gap-0.5 px-2"
          >
            <span className="text-lg">💬</span>
            <span className="text-xs text-text-secondary">客服</span>
          </button>
          <button
            onClick={() => setFavorited(!favorited)}
            className="flex cursor-pointer flex-col items-center gap-0.5 px-2"
          >
            <span className="text-lg">{favorited ? '❤️' : '🤍'}</span>
            <span className="text-xs text-text-secondary">收藏</span>
          </button>
          <Button
            variant="outline"
            className="ml-2 flex-1 !border-primary !text-primary"
            onClick={handleAddCart}
          >
            加入购物车
          </Button>
          <Button className="flex-1" onClick={handleBuyNow}>
            立即购买
          </Button>
        </div>
      </div>

      {/* SKU 选择弹层 */}
      {showSkuSheet && (
        <SkuSheet
          specs={mockProduct.specs}
          selected={selectedSpecs}
          onSelect={setSelectedSpecs}
          quantity={quantity}
          onQuantityChange={setQuantity}
          price={mockProduct.price}
          emoji={mockProduct.emoji}
          onClose={() => setShowSkuSheet(false)}
          onConfirm={() => {
            setShowSkuSheet(false);
          }}
        />
      )}
    </div>
  );
}

function SkuSheet({
  specs,
  selected,
  onSelect,
  quantity,
  onQuantityChange,
  price,
  emoji,
  onClose,
  onConfirm,
}: {
  specs: { name: string; values: string[] }[];
  selected: Record<string, string>;
  onSelect: (s: Record<string, string>) => void;
  quantity: number;
  onQuantityChange: (n: number) => void;
  price: string;
  emoji: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-bg-card md:left-1/2 md:right-auto md:w-[500px] md:-translate-x-1/2">
        <div className="sticky top-0 flex items-start gap-3 border-b border-border bg-bg-card p-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-bg-page text-4xl">
            {emoji}
          </div>
          <div className="flex-1">
            <PriceText price={price} size="md" />
            <p className="mt-1 text-xs text-text-secondary">
              已选：{Object.values(selected).join(' · ') || '请选择'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-4">
          {specs.map((spec) => (
            <div key={spec.name}>
              <h4 className="mb-2 text-sm font-medium">{spec.name}</h4>
              <div className="flex flex-wrap gap-2">
                {spec.values.map((val) => {
                  const active = selected[spec.name] === val;
                  return (
                    <button
                      key={val}
                      onClick={() => onSelect({ ...selected, [spec.name]: val })}
                      className={`cursor-pointer rounded-md border px-4 py-1.5 text-sm transition ${
                        active
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-border text-text-primary hover:border-primary'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <h4 className="mb-2 text-sm font-medium">数量</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-border"
              >
                −
              </button>
              <span className="w-12 text-center text-sm">{quantity}</span>
              <button
                onClick={() => onQuantityChange(quantity + 1)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-border"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-border bg-bg-card p-4">
          <Button className="w-full" onClick={onConfirm}>
            确定
          </Button>
        </div>
      </div>
    </>
  );
}