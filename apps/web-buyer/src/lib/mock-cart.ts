export interface CartItem {
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

export const MOCK_CART_ITEMS: CartItem[] = [
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