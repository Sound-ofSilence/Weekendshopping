/**
 * 本地购物车中心
 * 用 localStorage 存储购物车，让"加购→购物车→结算"数据一致
 * 后期接真实 API 时，只需替换函数内部实现
 */

export interface CartItem {
  id: number;          // 购物车项唯一 ID（时间戳+随机数）
  spuId: number;
  skuId: number;
  shopId: number;
  shopName: string;
  title: string;
  spec: string;        // 规格描述，如 "黑色 · M"
  price: string;
  quantity: number;
  emoji: string;
  selected: boolean;
  invalid?: boolean;
}

const STORAGE_KEY = 'ws_cart';
const EVENT_NAME = 'ws_cart_updated';

// ==================== 读写 ====================

export function getCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCartItems(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  // 通知所有页面刷新
  window.dispatchEvent(new Event(EVENT_NAME));
}

// ==================== 增删改 ====================

export function genCartItemId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

/**
 * 添加商品到购物车
 * 同 SKU 累加数量，不同 SKU 新增一条
 */
export function addToCart(item: Omit<CartItem, 'id' | 'selected'>): CartItem {
  const items = getCartItems();
  // 按 skuId 判断是否已存在
  const existing = items.find((i) => i.skuId === item.skuId);

  if (existing) {
    existing.quantity += item.quantity;
    saveCartItems(items);
    return existing;
  }

  const newItem: CartItem = {
    ...item,
    id: genCartItemId(),
    selected: true,
  };
  items.push(newItem);
  saveCartItems(items);
  return newItem;
}

/**
 * 更新购物车项（数量 / 选中状态）
 */
export function updateCartItem(
  id: number,
  patch: Partial<Pick<CartItem, 'quantity' | 'selected'>>,
): void {
  const items = getCartItems();
  const target = items.find((i) => i.id === id);
  if (!target) return;
  if (patch.quantity !== undefined) target.quantity = Math.max(1, patch.quantity);
  if (patch.selected !== undefined) target.selected = patch.selected;
  saveCartItems(items);
}

/**
 * 批量更新选中状态
 */
export function updateItemsSelected(
  ids: number[],
  selected: boolean,
): void {
  const items = getCartItems();
  for (const item of items) {
    if (ids.includes(item.id)) {
      item.selected = selected;
    }
  }
  saveCartItems(items);
}

/**
 * 删除单条
 */
export function removeCartItem(id: number): void {
  const items = getCartItems().filter((i) => i.id !== id);
  saveCartItems(items);
}

/**
 * 删除多条
 */
export function removeCartItems(ids: number[]): void {
  const items = getCartItems().filter((i) => !ids.includes(i.id));
  saveCartItems(items);
}

/**
 * 清空所有失效商品
 */
export function clearInvalidItems(): void {
  const items = getCartItems().filter((i) => !i.invalid);
  saveCartItems(items);
}

/**
 * 清空指定购物车项（下单成功后调用）
 */
export function removeItemsByIds(ids: number[]): void {
  removeCartItems(ids);
}

// ==================== 事件订阅（跨页面同步） ====================

export function onCartUpdated(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

// ==================== 统计 ====================

export function getCartCount(): number {
  return getCartItems().reduce((sum, item) => sum + item.quantity, 0);
}

export function getSelectedItems(): CartItem[] {
  return getCartItems().filter((i) => i.selected && !i.invalid);
}