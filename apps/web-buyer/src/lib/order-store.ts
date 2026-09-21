/**
 * 本地订单中心
 * 用 localStorage 存储订单，让"结算→支付→订单详情"数据一致
 * 后期接真实 API 时，只需替换这 3 个函数的内部实现
 */

export interface LocalOrderItem {
  id: number;
  spuId: number;
  skuId: number;
  title: string;
  spec: string;
  price: string;
  quantity: number;
  emoji: string;
}

export interface LocalOrderShopGroup {
  shopId: number;
  shopName: string;
  items: LocalOrderItem[];
}

export type LocalOrderStatus =
  | 'PENDING_PAY'
  | 'PAID'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'FINISHED'
  | 'CLOSED'
  | 'CANCELLED';

export interface LocalOrder {
  orderNo: string;
  status: LocalOrderStatus;
  createdAt: string;
  paidAt?: string;
  address: {
    receiver: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detail: string;
  };
  shopGroups: LocalOrderShopGroup[];
  totalAmount: string;
  freightAmount: string;
  discountAmount: string;
  payAmount: string;
  remark?: string;
}

const STORAGE_PREFIX = 'ws_order:';

export function saveOrder(order: LocalOrder): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_PREFIX}${order.orderNo}`, JSON.stringify(order));
}

export function getOrder(orderNo: string): LocalOrder | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${orderNo}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalOrder;
  } catch {
    return null;
  }
}

export function updateOrder(orderNo: string, patch: Partial<LocalOrder>): LocalOrder | null {
  const existing = getOrder(orderNo);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  saveOrder(updated);
  return updated;
}

export function genOrderNo(): string {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `${ts}${rand}`;
}