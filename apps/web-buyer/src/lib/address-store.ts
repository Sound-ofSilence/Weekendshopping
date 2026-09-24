/**
 * 本地地址中心
 * 后期接真实 API 时，只改这 4 个函数内部实现
 */

export interface Address {
  id: number;
  receiver: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
  tag?: string; // 家/公司/学校
}

const STORAGE_KEY = 'ws_addresses';

// ==================== 读写 ====================

export function getAddresses(): Address[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // 首次返回默认地址
    const defaults: Address[] = [
      {
        id: 1,
        receiver: '张三',
        phone: '138****8888',
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        detail: '科技园xxx路 88 号',
        isDefault: true,
        tag: '公司',
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
        tag: '家',
      },
    ];
    saveAddresses(defaults);
    return defaults;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAddresses(list: Address[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ==================== 增删改 ====================

export function genAddressId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

export function addAddress(addr: Omit<Address, 'id'>): Address {
  const list = getAddresses();

  // 如果设为默认，取消其他默认
  if (addr.isDefault) {
    list.forEach((a) => (a.isDefault = false));
  }
  // 如果列表为空，强制为默认
  if (list.length === 0) {
    addr.isDefault = true;
  }

  const newAddr: Address = { ...addr, id: genAddressId() };
  list.push(newAddr);
  saveAddresses(list);
  return newAddr;
}

export function updateAddress(id: number, patch: Partial<Address>): void {
  const list = getAddresses();

  // 如果设为默认，取消其他
  if (patch.isDefault === true) {
    list.forEach((a) => (a.isDefault = false));
  }

  const target = list.find((a) => a.id === id);
  if (!target) return;
  Object.assign(target, patch);

  // 防止所有地址都非默认（至少保留一个默认）
  if (!list.some((a) => a.isDefault) && list.length > 0) {
    list[0].isDefault = true;
  }

  saveAddresses(list);
}

export function removeAddress(id: number): void {
  let list = getAddresses().filter((a) => a.id !== id);
  // 如果删除的是默认地址，自动把第一个设为默认
  if (list.length > 0 && !list.some((a) => a.isDefault)) {
    list[0].isDefault = true;
  }
  saveAddresses(list);
}

export function setDefaultAddress(id: number): void {
  const list = getAddresses();
  list.forEach((a) => (a.isDefault = a.id === id));
  saveAddresses(list);
}