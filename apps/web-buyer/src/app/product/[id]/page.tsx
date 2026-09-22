'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, PriceText } from '@/components/ui';
import { addToCart } from '@/lib/cart-store';
import { getProductById, type MockProduct } from '@/lib/mock-products';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);

  const [product, setProduct] = useState<MockProduct | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [showSkuSheet, setShowSkuSheet] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [pendingAction, setPendingAction] = useState<'add' | 'buy' | null>(null);

  useEffect(() => {
    if (!productId || isNaN(productId)) {
      setNotFound(true);
      setMounted(true);
      return;
    }
    const p = getProductById(productId);
    if (!p) {
      setNotFound(true);
      setMounted(true);
      return;
    }
    setProduct(p);
    setMounted(true);
  }, [productId]);

  const allSelected = product
    ? product.specs.every((s) => selectedSpecs[s.name])
    : false;

  const specString = Object.values(selectedSpecs).join(' · ');

  const handleAddCart = () => {
    if (!allSelected) {
      setPendingAction('add');
      setShowSkuSheet(true);
      return;
    }
    doAddToCart();
  };

  const doAddToCart = () => {
    if (!product) return;
    addToCart({
      spuId: product.spuId,
      skuId: product.skuId,
      shopId: product.shopId,
      shopName: product.shopName,
      title: product.title,
      spec: specString || '默认规格',
      price: product.price,
      quantity,
      emoji: product.emoji,
    });

    if (confirm('已加入购物车，是否立即前往购物车？')) {
      router.push('/cart');
    }
  };

  const handleBuyNow = () => {
    if (!allSelected) {
      setPendingAction('buy');
      setShowSkuSheet(true);
      return;
    }
    doBuyNow();
  };

  const doBuyNow = () => {
    if (!product) return;
    const item = addToCart({
      spuId: product.spuId,
      skuId: product.skuId,
      shopId: product.shopId,
      shopName: product.shopName,
      title: product.title,
      spec: specString || '默认规格',
      price: product.price,
      quantity,
      emoji: product.emoji,
    });
    router.push(`/checkout?item=${item.id}:${item.quantity}`);
  };

  const handleSkuConfirm = () => {
    if (!allSelected) {
      alert('请选择完整规格');
      return;
    }
    setShowSkuSheet(false);
    if (pendingAction === 'add') {
      doAddToCart();
    } else if (pendingAction === 'buy') {
      doBuyNow();
    }
    setPendingAction(null);
  };

  // ==================== 渲染 ====================

  // 首次渲染
  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">加载中...</p>
      </div>
    );
  }

  // 商品不存在
  if (notFound || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">📦</div>
        <p className="text-text-secondary">商品不存在或已下架</p>
        <Link href="/">
          <Button>返回首页</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page pb-32">
      {/* 主图 */}
      <div className="relative flex h-96 items-center justify-center bg-bg-card text-[8rem] md:h-[500px] md:text-[12rem]">
        {product.images[0]}
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/30 text-white backdrop-blur"
        >
          ←
        </button>
        <div className="absolute bottom-4 right-4 rounded-full bg-black/30 px-3 py-1 text-xs text-white backdrop-blur">
          1 / {product.images.length}
        </div>
      </div>

      {/* 价格区 */}
      <div className="bg-bg-card px-4 py-3">
        <div className="flex items-baseline gap-2">
          <PriceText price={product.price} size="lg" />
          <span className="text-sm text-text-disabled line-through">
            ¥{product.originalPrice}
          </span>
          <span className="rounded bg-error px-2 py-0.5 text-xs text-white">
            限时立减
          </span>
        </div>
        <h1 className="mt-2 text-base font-medium text-text-primary">
          {product.title}
        </h1>
        <p className="mt-1 text-xs text-text-secondary">{product.subtitle}</p>
        <p className="mt-2 text-xs text-text-secondary">
          已售 {product.sales} · 评分 {product.rating}
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
        onClick={() => {
          setPendingAction(null);
          setShowSkuSheet(true);
        }}
        className="mt-2 flex w-full cursor-pointer items-center gap-3 bg-bg-card px-4 py-3 text-left"
      >
        <span className="text-sm text-text-secondary">选择</span>
        <span className="text-sm text-text-primary">
          {allSelected
            ? specString
            : product.specs.map((s) => s.name).join(' · ')}
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
            <h3 className="text-sm font-medium">{product.shopName}</h3>
            <p className="mt-0.5 text-xs text-text-secondary">
              评分 4.8 · 粉丝 12万
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
          <h3 className="text-sm font-bold">评价 ({product.sales})</h3>
          <span className="text-xs text-text-secondary">好评率 98% &gt;</span>
        </div>
        <div className="mt-3 space-y-3">
          {product.reviews.map((r) => (
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

      {/* 底部固定操作栏 */}
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
          specs={product.specs}
          selected={selectedSpecs}
          onSelect={setSelectedSpecs}
          quantity={quantity}
          onQuantityChange={setQuantity}
          price={product.price}
          emoji={product.emoji}
          onClose={() => {
            setShowSkuSheet(false);
            setPendingAction(null);
          }}
          onConfirm={handleSkuConfirm}
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