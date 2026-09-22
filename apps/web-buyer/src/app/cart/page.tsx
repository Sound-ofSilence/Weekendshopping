'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, PriceText } from '@/components/ui';
import {
  getCartItems,
  updateCartItem,
  updateItemsSelected,
  removeCartItem,
  removeCartItems,
  clearInvalidItems,
  onCartUpdated,
  type CartItem,
} from '@/lib/cart-store';

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [editing, setEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 初次加载 + 订阅跨页面更新
  useEffect(() => {
    setItems(getCartItems());
    setMounted(true);
    const unsubscribe = onCartUpdated(() => {
      setItems(getCartItems());
    });
    return unsubscribe;
  }, []);

  // 每次 items 变化后从 store 重新读（保证一致）
  const refresh = () => setItems(getCartItems());

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
        groups[item.shopId] = {
          shopId: item.shopId,
          shopName: item.shopName,
          items: [],
        };
      }
      groups[item.shopId].items.push(item);
      return groups;
    },
    {} as Record<number, { shopId: number; shopName: string; items: CartItem[] }>,
  );

  // ==================== 操作 ====================

  const toggleSelect = (id: number) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    updateCartItem(id, { selected: !target.selected });
    refresh();
  };

  const toggleShop = (shopId: number) => {
    const shopItems = items.filter((i) => i.shopId === shopId && !i.invalid);
    const allShopSelected = shopItems.every((i) => i.selected);
    updateItemsSelected(shopItems.map((i) => i.id), !allShopSelected);
    refresh();
  };

  const toggleAll = () => {
    updateItemsSelected(validItems.map((i) => i.id), !allSelected);
    refresh();
  };

  const updateQuantity = (id: number, delta: number) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    updateCartItem(id, { quantity: target.quantity + delta });
    refresh();
  };

  const handleRemoveItem = (id: number) => {
    if (confirm('确定删除这件商品吗？')) {
      removeCartItem(id);
      refresh();
    }
  };

  const handleClearInvalid = () => {
    if (confirm('确定清空所有失效商品吗？')) {
      clearInvalidItems();
      refresh();
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
      alert('请先选择要删除的商品');
      return;
    }
    if (confirm(`确定删除选中的 ${selectedItems.length} 件商品吗？`)) {
      removeCartItems(selectedItems.map((i) => i.id));
      refresh();
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('请先选择要结算的商品');
      return;
    }
    const params = new URLSearchParams();
    selectedItems.forEach((item) => {
      params.append('item', `${item.id}:${item.quantity}`);
    });
    router.push(`/checkout?${params.toString()}`);
  };

  // ==================== 渲染 ====================

  // 首次渲染（避免 hydration 不一致）
  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">加载中...</p>
      </div>
    );
  }

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
          购物车{' '}
          <span className="text-sm font-normal text-text-secondary">
            ({items.length})
          </span>
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
                  disabled={shopValidItems.length === 0}
                  onChange={() => toggleShop(group.shopId)}
                  className="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
                />
                <span className="text-sm font-medium">🏪 {group.shopName}</span>
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
                          onClick={() => handleRemoveItem(item.id)}
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
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
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
              onClick={handleClearInvalid}
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
              <Button variant="danger" onClick={handleDeleteSelected}>
                删除
              </Button>
            ) : (
              <Button
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
              >
                去结算({selectedItems.length})
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}