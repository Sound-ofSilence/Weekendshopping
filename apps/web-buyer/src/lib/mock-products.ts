/**
 * 模拟商品数据库
 * 所有页面（首页、搜索、分类、详情）都从这里读
 * 后期接真实 API 时，替换成 api.get('/products') 即可
 */

export interface MockProduct {
  id: number;
  spuId: number;
  skuId: number;
  shopId: number;
  shopName: string;
  title: string;
  subtitle: string;
  price: string;
  originalPrice: string;
  sales: string;
  rating: string;
  emoji: string;
  images: string[];
  tags: string[];
  specs: { name: string; values: string[] }[];
  reviews: { id: number; user: string; rating: number; content: string }[];
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 1,
    spuId: 1,
    skuId: 101,
    shopId: 1,
    shopName: 'XX旗舰店',
    title: '2026 新款连衣裙 显瘦气质 春秋必备',
    subtitle: '精选面料 显瘦气质',
    price: '99.00',
    originalPrice: '199.00',
    sales: '1.2万',
    rating: '4.9',
    emoji: '👗',
    images: ['👗', '👚', '👘', '🧥'],
    tags: ['包邮', '7天退'],
    specs: [
      { name: '颜色', values: ['黑色', '白色', '灰色'] },
      { name: '尺码', values: ['S', 'M', 'L', 'XL'] },
    ],
    reviews: [
      { id: 1, user: '用户***', rating: 5, content: '质量很好，物流也快，值得回购！' },
      { id: 2, user: '匿名用户', rating: 5, content: '尺码标准，显瘦效果很好。' },
    ],
  },
  {
    id: 2,
    spuId: 2,
    skuId: 102,
    shopId: 1,
    shopName: 'XX旗舰店',
    title: '真皮男士商务休闲鞋 头层牛皮',
    subtitle: '舒适透气 商务百搭',
    price: '288.00',
    originalPrice: '599.00',
    sales: '8560',
    rating: '4.8',
    emoji: '👞',
    images: ['👞', '👟', '🥾'],
    tags: ['包邮'],
    specs: [
      { name: '颜色', values: ['黑色', '棕色'] },
      { name: '尺码', values: ['39', '40', '41', '42', '43'] },
    ],
    reviews: [
      { id: 1, user: '用户***', rating: 5, content: '皮质很软，穿起来很舒服。' },
      { id: 2, user: '匿名用户', rating: 4, content: '做工不错，码数偏大半码。' },
    ],
  },
  {
    id: 3,
    spuId: 3,
    skuId: 103,
    shopId: 2,
    shopName: 'YY专营店',
    title: '无线蓝牙耳机 主动降噪 长续航',
    subtitle: 'HiFi 音质 40 小时续航',
    price: '399.00',
    originalPrice: '699.00',
    sales: '3.5万',
    rating: '4.9',
    emoji: '🎧',
    images: ['🎧', '🎵', '🔊'],
    tags: ['包邮', '运费险'],
    specs: [
      { name: '颜色', values: ['白色', '黑色'] },
    ],
    reviews: [
      { id: 1, user: '用户***', rating: 5, content: '降噪效果非常好，音质也很棒！' },
      { id: 2, user: '匿名用户', rating: 5, content: '续航真的能用 40 小时。' },
    ],
  },
  {
    id: 4,
    spuId: 4,
    skuId: 104,
    shopId: 2,
    shopName: 'YY专营店',
    title: '简约北欧风台灯 护眼卧室床头灯',
    subtitle: '三档调光 触控开关',
    price: '129.00',
    originalPrice: '259.00',
    sales: '1243',
    rating: '4.7',
    emoji: '💡',
    images: ['💡', '🕯️'],
    tags: ['7天退'],
    specs: [
      { name: '颜色', values: ['白色', '木色'] },
    ],
    reviews: [
      { id: 1, user: '用户***', rating: 5, content: '灯光很柔和，看书不刺眼。' },
    ],
  },
  {
    id: 5,
    spuId: 5,
    skuId: 105,
    shopId: 3,
    shopName: 'ZZ旗舰店',
    title: '冬季加厚羽绒服 90% 白鸭绒',
    subtitle: '防风保暖 时尚百搭',
    price: '599.00',
    originalPrice: '1299.00',
    sales: '5678',
    rating: '4.8',
    emoji: '🧥',
    images: ['🧥', '🧣'],
    tags: ['包邮', '7天退'],
    specs: [
      { name: '颜色', values: ['黑色', '藏青', '酒红'] },
      { name: '尺码', values: ['S', 'M', 'L', 'XL', 'XXL'] },
    ],
    reviews: [
      { id: 1, user: '用户***', rating: 5, content: '很厚实，零下十度也不冷。' },
    ],
  },
  {
    id: 6,
    spuId: 6,
    skuId: 106,
    shopId: 3,
    shopName: 'ZZ旗舰店',
    title: '智能手表运动款 心率监测 GPS',
    subtitle: '5ATM 防水 14 天续航',
    price: '899.00',
    originalPrice: '1599.00',
    sales: '2.1万',
    rating: '4.9',
    emoji: '⌚',
    images: ['⌚', '📱'],
    tags: ['包邮'],
    specs: [
      { name: '颜色', values: ['黑色', '银色'] },
      { name: '表带', values: ['硅胶', '金属'] },
    ],
    reviews: [
      { id: 1, user: '用户***', rating: 5, content: '功能很全，运动数据很准。' },
      { id: 2, user: '匿名用户', rating: 5, content: '续航真的能用两周。' },
    ],
  },
];

// ==================== 查询函数 ====================

export function getProductById(id: number): MockProduct | null {
  return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
}

export function getProductsByShop(shopId: number): MockProduct[] {
  return MOCK_PRODUCTS.filter((p) => p.shopId === shopId);
}