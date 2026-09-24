/**
 * 店铺 ID → 店铺名 映射
 * 一期后端 Spu 只返回 shopId，没有 shopName
 * 等 P9 商家模块完成后，改成从 API 拿
 */

export const SHOP_NAME_MAP: Record<number, string> = {
  1: 'XX旗舰店',
  2: 'YY专营店',
  3: 'ZZ旗舰店',
};

export function getShopName(shopId: number): string {
  return SHOP_NAME_MAP[shopId] ?? `店铺${shopId}`;
}