/**
 * 商品 API
 * 对接后端 /products/* 和 /categories/*
 */

import { api } from './api';
import { getShopName } from './shop-map';

// ==================== 后端原始类型 ====================

interface BackendSpec {
  id: number;
  name: string;
  values: string[];
  sort: number;
}

interface BackendSku {
  id: number;
  spec: Record<string, string>; // 如 {颜色:"黑色", 尺码:"M"}
  price: string;
  marketPrice: string | null;
  stock: number;
  image: string | null;
  status: number;
}

interface BackendProductDetail {
  id: number;
  shopId: number;
  categoryId: number;
  brandId: number | null;
  title: string;
  subtitle: string | null;
  mainImg: string;
  images: string[];
  detailHtml: string;
  status: number;
  salesCount: number;
  ratingAvg: string;
  specs: BackendSpec[];
  skus: BackendSku[];
}

interface BackendProductListItem {
  id: number;
  title: string;
  mainImg: string;
  price: string;
  salesCount: number;
  ratingAvg: string;
  shopId: number;
}

interface BackendCategory {
  id: number;
  parentId: number | null;
  name: string;
  level: number;
  sort: number;
  icon: string | null;
  isLeaf: boolean;
  status: number;
  children?: BackendCategory[];
}

// ==================== 前端友好类型 ====================

export interface ProductListItem {
  id: number;
  title: string;
  emoji: string;
  price: string;
  originalPrice: string; // 从 SKU 的 marketPrice 拿
  sales: string;
  rating: string;
  shopId: number;
  shopName: string;
}

export interface ProductSku {
  id: number;
  spec: Record<string, string>;
  price: string;
  marketPrice: string;
  stock: number;
  image: string;
}

export interface ProductSpec {
  name: string;
  values: string[];
}

export interface ProductDetail {
  id: number;
  shopId: number;
  shopName: string;
  title: string;
  subtitle: string;
  emoji: string;
  images: string[];
  price: string;
  originalPrice: string;
  salesCount: number;
  sales: string;
  rating: string;
  detailHtml: string;
  specs: ProductSpec[];
  skus: ProductSku[];
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  isLeaf: boolean;
  children: Category[];
}

// ==================== 工具函数 ====================

function formatSales(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return String(n);
}

function pickMinPrice(skus: BackendSku[]): { price: string; marketPrice: string } {
  if (skus.length === 0) return { price: '0.00', marketPrice: '0.00' };
  const min = skus.reduce((acc, s) => (parseFloat(s.price) < parseFloat(acc.price) ? s : acc));
  return {
    price: min.price,
    marketPrice: min.marketPrice || min.price,
  };
}

// ==================== 查询函数 ====================

/**
 * 商品搜索/列表
 */
export async function searchProducts(params: {
  keyword?: string;
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<ProductListItem[]> {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.categoryId) search.set('categoryId', String(params.categoryId));
  if (params.brandId) search.set('brandId', String(params.brandId));
  if (params.minPrice !== undefined) search.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) search.set('maxPrice', String(params.maxPrice));
  if (params.sort) search.set('sort', params.sort);
  search.set('page', String(params.page || 1));
  search.set('pageSize', String(params.pageSize || 20));

  const list = await api.get<BackendProductListItem[]>(`/products/search?${search.toString()}`);

  return list.map((p) => ({
    id: p.id,
    title: p.title,
    emoji: p.mainImg,
    price: p.price,
    originalPrice: '', // 搜索接口不返回 marketPrice
    sales: formatSales(p.salesCount),
    rating: p.ratingAvg,
    shopId: p.shopId,
    shopName: getShopName(p.shopId),
  }));
}

/**
 * 商品详情
 */
export async function getProductDetail(spuId: number): Promise<ProductDetail> {
  const data = await api.get<BackendProductDetail>(`/products/${spuId}`);
  const { price, marketPrice } = pickMinPrice(data.skus);

  return {
    id: data.id,
    shopId: data.shopId,
    shopName: getShopName(data.shopId),
    title: data.title,
    subtitle: data.subtitle || '',
    emoji: data.mainImg,
    images: data.images.length > 0 ? data.images : [data.mainImg],
    price,
    originalPrice: marketPrice,
    salesCount: data.salesCount,
    sales: formatSales(data.salesCount),
    rating: data.ratingAvg,
    detailHtml: data.detailHtml,
    specs: data.specs.map((s) => ({ name: s.name, values: s.values })),
    skus: data.skus.map((s) => ({
      id: s.id,
      spec: s.spec,
      price: s.price,
      marketPrice: s.marketPrice || s.price,
      stock: s.stock,
      image: s.image || data.mainImg,
    })),
  };
}

/**
 * 类目树
 */
export async function getCategoryTree(): Promise<Category[]> {
  const data = await api.get<BackendCategory[]>('/categories/tree');
  return data.map(mapCategory);
}

function mapCategory(c: BackendCategory): Category {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon || '📁',
    isLeaf: c.isLeaf,
    children: (c.children || []).map(mapCategory),
  };
}