import type { Prisma } from '@prisma/client';

export class SearchResultDto {
  id!: number;
  title!: string;
  mainImg!: string;
  price!: string;
  salesCount!: number;
  ratingAvg!: string;
  shopId!: number;
}

export class HotKeywordDto {
  keyword!: string;
  score!: number;
}

export type SearchSpuRow = Prisma.SpuGetPayload<{
  include: { skus: { select: { price: true } } };
}>;

export function toSearchResult(spu: SearchSpuRow, minPrice: number): SearchResultDto {
  return {
    id: spu.id,
    title: spu.title,
    mainImg: spu.mainImg,
    price: minPrice.toFixed(2),
    salesCount: spu.salesCount,
    ratingAvg: spu.ratingAvg.toFixed(2),
    shopId: spu.shopId,
  };
}
