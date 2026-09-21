'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, PriceText } from '@/components/ui';

interface CartItem {
  id: number;
  shopId: number;
  shopName: string;
  title: string;
  spec: string;
  price: string;
  quantity: number;
  emoji: string;
  selected: boolean;
  invalid?: boolean;
}

const initialItems: CartItem[] = [
  {
    id: 1,
    shopId: 1,
    shopName: 'XX旗舰店',
    title: '2026 新款连衣裙 显瘦气质',
    spec: '黑色 · M',
    price: '99.00',
    quantity: 1,
    emoji: '👗',
    selected: true,
  },
  {
    id: 2,
    shopId: 1,
    shopName: 'XX旗舰店',
    title: '真皮男士商务休闲鞋',
    spec: '棕色 · 42',
    price: '288.00',
    quantity: 1,
    emoji: '👞',
    selected: true,
  },
  {
    id: 3,
    shopId: 2,
    shopName: 'YY专营店',
    title: '无线蓝牙耳机 主动降噪',
    spec: '白色',
    price: '399.00',
    quantity: 2,
    emoji: '🎧',
    selected: false,
  },
  {
    id: 4,
    shopId: 2,
    shopName: 'YY专营店',
    title: '简约北欧风台灯（已下架）',
    spec: '白色',
    price: '129.00',
    quantity: 1,
    emoji: '💡',
    selected: false,
    invalid: true,
  },
];

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [editing, setEditing] = useState(false);

  const validItems = items.filter((i) => !i.invalid);
  const selectedItems = validItems.filter((i) => i.selected);
  const allSelected = validItems.length > 0 && selectedItems.length === validItems.length;

  const totalAmount = selectedItems
    .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
    .toFixed(2);

  // 按店铺分组
  const shopGroups = items.reduce(
    (groups, item) => {
      if (!groups[item.shopId]) {
        groups[item.shopId] = { shopId: item.shopId, shopName: item.shopName, items: [] };
      }
      groups[item.shopId].items.push(item);
      return groups;
    },
    {} as Record<number, { shopId: number; shopName: string; items: CartItem[] }>,
  );

  const toggleSelect = (id: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i)),
    );
  };

  const toggleShop = (shopId: number) => {
    const shopItems = items.filter((i) => i.shopId === shopId && !i.invalid);
    const allShopSelected = shopItems.every((i) => i.selected);
    setItems((prev) =>
      prev.map((i) =>
        i.shopId === shopId && !i.invalid ? { ...i, selected: !allShopSelected } : i,
      ),
    );
  };

  const toggleAll = () => {
    setItems((prev) =>
      prev.map((i) => (i.invalid ? i : { ...i, selected: !allSelected })),
    );
  };

  const updateQuantity = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i,
      ),
    );
  };

  const removeItem = (id: number) => {
    if (confirm('确定删除这件商品吗？')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const clearInvalid = () => {
    setItems((prev) => prev.filter((i) => !i.invalid));
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('请先选择要结算的商品');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">🛒</div>
        <p className="text-text-secondary">购物车还是空的</p>
        <Link href="/">
          <Button>去逛逛</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page pb-32">
      <div className="sticky top-14 z-40 flex items-center justify-between border-b border-border bg-bg-card px-4 py-3">
        <h1 className="text-base font-bold">
          购物车 <span className="text-sm font-normal text-text-secondary">({items.length})</span>
        </h1>
        <button
          onClick={() => setEditing(!editing)}
          className="cursor-pointer text-sm text-text-secondary hover:text-primary"
        >
          {editing ? '完成' : '管理'}
        </button>
      </div>

      <div className="mx-auto max-w-screen-xl space-y-3 p-4">
        {Object.values(shopGroups).map((group) => {
          const shopValidItems = group.items.filter((i) => !i.invalid);
          const shopAllSelected =
            shopValidItems.length > 0 && shopValidItems.every((i) => i.selected);
          return (
            <Card key={group.shopId} className="p-0">
              <div className="flex items-center gap-2 border-b border-border-light p-3">
                <input
                  type="checkbox"
                  checked={shopAllSelected}
                  onChange={() => toggleShop(group.shopId)}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <span className="text-sm font-medium">{group.shopName}</span>
              </div>

              {group.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-3 border-b border-border-light p-3 last:border-0 ${
                    item.invalid ? 'opacity-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.selected}
                    disabled={item.invalid}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-6 h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
                  />
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md bg-bg-page text-4xl">
                    {item.emoji}
                  </div>
                  <div className="flex flex-1 flex-col justify-between overflow-hidden">
                    <div>
                      <h3 className="line-clamp-2 text-sm text-text-primary">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-text-secondary">{item.spec}</p>
                      {item.invalid && (
                        <span className="mt-1 inline-block rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
                          已失效
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <PriceText price={item.price} size="sm" />
                      {item.invalid ? (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="cursor-pointer text-xs text-text-secondary hover:text-error"
                        >
                          删除
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-border text-sm"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-border text-sm"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          );
        })}

        {/* 失效商品清理 */}
        {items.some((i) => i.invalid) && (
          <div className="flex items-center justify-between px-2 text-xs text-text-secondary">
            <span>失效商品 {items.filter((i) => i.invalid).length} 件</span>
            <button
              onClick={clearInvalid}
              className="cursor-pointer hover:text-error"
            >
              清空失效
            </button>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-border bg-bg-card md:bottom-0">
        <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 cursor-pointer accent-primary"
            />
            <span className="text-sm">全选</span>
          </label>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-text-secondary">
                合计：
                <PriceText price={totalAmount} size="md" />
              </p>
              <p className="text-xs text-text-disabled">
                已选 {selectedItems.length} 件
              </p>
            </div>

            {editing ? (
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm(`确定删除选中的 ${selectedItems.length} 件商品吗？`)) {
                    setItems((prev) =>
                      prev.filter((i) => !i.selected || i.invalid),
                    );
                  }
                }}
              >
                删除
              </Button>
            ) : (
              <Button onClick={handleCheckout} disabled={selectedItems.length === 0}>
                去结算({selectedItems.length})
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}