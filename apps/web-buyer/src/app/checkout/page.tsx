'use client';
import { saveOrder, genOrderNo, type LocalOrder } from '@/lib/order-store';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, PriceText } from '@/components/ui';
import { MOCK_CART_ITEMS } from '@/lib/mock-cart';

const mockAddresses = [
  {
    id: 1,
    receiver: '张三',
    phone: '138****8888',
    province: '广东省',
    city: '深圳市',
    district: '南山区',
    detail: '科技园xxx路 88 号',
    isDefault: true,
  },
  {
    id: 2,
    receiver: '李四',
    phone: '139****9999',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    detail: 'xxx街道xxx号',
    isDefault: false,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedAddressId, setSelectedAddressId] = useState(1);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showCouponSheet, setShowCouponSheet] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(1);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 从 URL 读取购物车选择的商品（格式：item=1:2&item=3:1）
  const checkoutItems = useMemo(() => {
    const itemParams = searchParams.getAll('item');

    // 如果没有传参（比如直接访问 /checkout），默认取全部有效商品
    if (itemParams.length === 0) {
      return MOCK_CART_ITEMS.filter((i) => !i.invalid).map((i) => ({
        id: i.id,
        shopId: i.shopId,
        shopName: i.shopName,
        title: i.title,
        spec: i.spec,
        price: i.price,
        quantity: i.quantity,
        emoji: i.emoji,
      }));
    }

    // 解析 URL 参数
    const result: {
      id: number;
      shopId: number;
      shopName: string;
      title: string;
      spec: string;
      price: string;
      quantity: number;
      emoji: string;
    }[] = [];

    for (const param of itemParams) {
      const [idStr, qtyStr] = param.split(':');
      const id = Number(idStr);
      const qty = Number(qtyStr) || 1;
      const found = MOCK_CART_ITEMS.find((i) => i.id === id);
      if (found) {
        result.push({
          id: found.id,
          shopId: found.shopId,
          shopName: found.shopName,
          title: found.title,
          spec: found.spec,
          price: found.price,
          quantity: qty,
          emoji: found.emoji,
        });
      }
    }
    return result;
  }, [searchParams]);

  // 按店铺分组
  const shopGroups = useMemo(() => {
    const groups: Record<
      number,
      {
        shopId: number;
        shopName: string;
        items: typeof checkoutItems;
      }
    > = {};
    for (const item of checkoutItems) {
      if (!groups[item.shopId]) {
        groups[item.shopId] = {
          shopId: item.shopId,
          shopName: item.shopName,
          items: [],
        };
      }
      groups[item.shopId].items.push(item);
    }
    return Object.values(groups);
  }, [checkoutItems]);

  const selectedAddress = mockAddresses.find((a) => a.id === selectedAddressId)!;

  const totalAmount = checkoutItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0,
  );

  const freightAmount = 0;
  const discountAmount = selectedCouponId ? 30 : 0;
  const payAmount = (totalAmount + freightAmount - discountAmount).toFixed(2);

  const handleSubmit = async () => {
    if (submitting) return;
    if (checkoutItems.length === 0) {
      alert('没有可结算的商品');
      return;
    }
    setSubmitting(true);

    try {
      // 生成订单对象
      const orderNo = genOrderNo();
      const order: LocalOrder = {
        orderNo,
        status: 'PENDING_PAY',
        createdAt: new Date().toLocaleString('zh-CN'),
        address: {
          receiver: selectedAddress.receiver,
          phone: selectedAddress.phone,
          province: selectedAddress.province,
          city: selectedAddress.city,
          district: selectedAddress.district,
          detail: selectedAddress.detail,
        },
        shopGroups: shopGroups.map((g) => ({
          shopId: g.shopId,
          shopName: g.shopName,
          items: g.items.map((item) => ({
            id: item.id,
            spuId: item.id,
            skuId: item.id,
            title: item.title,
            spec: item.spec,
            price: item.price,
            quantity: item.quantity,
            emoji: item.emoji,
          })),
        })),
        totalAmount: totalAmount.toFixed(2),
        freightAmount: freightAmount.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        payAmount,
        remark,
      };
      saveOrder(order);

      // 跳转
      await new Promise((r) => setTimeout(r, 300));
      window.location.href = `/pay/${orderNo}`;
    } catch (err) {
      console.error('提交订单失败:', err);
      alert('提交订单失败，请重试');
      setSubmitting(false);
    }
  };

  // 空状态
  if (checkoutItems.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">📦</div>
        <p className="text-text-secondary">没有可结算的商品</p>
        <Link href="/cart">
          <Button>返回购物车</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page pb-32">
      <div className="sticky top-14 z-40 flex items-center gap-2 border-b border-border bg-bg-card px-4 py-3">
        <button onClick={() => router.back()} className="cursor-pointer text-lg">
          ←
        </button>
        <h1 className="text-base font-bold">确认订单</h1>
      </div>

      <div className="mx-auto max-w-screen-xl space-y-2 p-4">
        {/* 收货地址 */}
        <button
          onClick={() => setShowAddressSheet(true)}
          className="w-full cursor-pointer text-left"
        >
          <Card className="rounded-none p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedAddress.receiver}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {selectedAddress.phone}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  {selectedAddress.province}
                  {selectedAddress.city}
                  {selectedAddress.district}
                  {selectedAddress.detail}
                </p>
              </div>
              <span className="text-text-secondary">&gt;</span>
            </div>
          </Card>
        </button>

        {/* 商品清单（按店铺分组） */}
        {shopGroups.map((group) => (
          <Card key={group.shopId} className="rounded-none p-4">
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

            <div className="mt-3 space-y-2 border-t border-border-light pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">配送方式</span>
                <span>快递 免运费</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">买家留言</span>
                <input
                  type="text"
                  placeholder="选填，请先和商家协商一致"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="flex-1 rounded border border-border bg-bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={() => setShowCouponSheet(true)}
                className="flex w-full cursor-pointer items-center justify-between text-xs"
              >
                <span className="text-text-secondary">优惠券</span>
                <span className={selectedCouponId ? 'text-primary' : 'text-text-secondary'}>
                  {selectedCouponId ? '-¥30.00' : '暂无可用'} &gt;
                </span>
              </button>
            </div>
          </Card>
        ))}

        {/* 价格明细 */}
        <Card className="rounded-none p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">商品金额</span>
              <span>¥{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">运费</span>
              <span>¥{freightAmount.toFixed(2)}</span>
            </div>
            {selectedCouponId && (
              <div className="flex justify-between">
                <span className="text-text-secondary">优惠券</span>
                <span className="text-primary">-¥{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border-light pt-2">
              <span className="font-medium">实付款</span>
              <PriceText price={payAmount} size="md" />
            </div>
          </div>
        </Card>
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-border bg-bg-card md:bottom-0">
        <div className="mx-auto flex max-w-screen-xl items-center justify-end gap-3 px-4 py-3">
          <div className="text-right">
            <p className="text-xs text-text-secondary">
              合计：
              <PriceText price={payAmount} size="md" />
            </p>
          </div>
          <Button size="lg" onClick={handleSubmit} loading={submitting}>
            提交订单
          </Button>
        </div>
      </div>

      {/* 地址选择抽屉 */}
      {showAddressSheet && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setShowAddressSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-bg-card p-4">
            <h3 className="mb-3 text-base font-bold">选择收货地址</h3>
            <div className="space-y-2">
              {mockAddresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => {
                    setSelectedAddressId(addr.id);
                    setShowAddressSheet(false);
                  }}
                  className={`w-full cursor-pointer rounded-md border p-3 text-left transition ${
                    selectedAddressId === addr.id
                      ? 'border-primary bg-primary-light'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{addr.receiver}</span>
                    <span className="text-xs text-text-secondary">{addr.phone}</span>
                    {addr.isDefault && (
                      <span className="rounded bg-primary px-1.5 py-0.5 text-xs text-white">
                        默认
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    {addr.province}
                    {addr.city}
                    {addr.district}
                    {addr.detail}
                  </p>
                </button>
              ))}
            </div>
            <Link href="/address">
              <Button variant="outline" className="mt-4 w-full">
                + 添加新地址
              </Button>
            </Link>
          </div>
        </>
      )}

      {/* 优惠券选择抽屉 */}
      {showCouponSheet && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setShowCouponSheet(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-bg-card p-4">
            <h3 className="mb-3 text-base font-bold">选择优惠券</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedCouponId(null);
                  setShowCouponSheet(false);
                }}
                className={`w-full cursor-pointer rounded-md border p-3 text-left text-sm transition ${
                  selectedCouponId === null
                    ? 'border-primary bg-primary-light'
                    : 'border-border hover:border-primary'
                }`}
              >
                不使用优惠券
              </button>
              <button
                onClick={() => {
                  setSelectedCouponId(1);
                  setShowCouponSheet(false);
                }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-md border p-3 text-left transition ${
                  selectedCouponId === 1
                    ? 'border-primary bg-primary-light'
                    : 'border-border hover:border-primary'
                }`}
              >
                <div className="flex flex-col items-center rounded bg-primary px-3 py-1 text-white">
                  <span className="text-lg font-bold">30</span>
                  <span className="text-xs">元</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">满 200 减 30</p>
                  <p className="text-xs text-text-secondary">全场通用</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}