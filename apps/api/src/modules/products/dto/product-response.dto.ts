import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma, Sku, Spu, SpuSpec } from '@prisma/client';

/** 金额/数值 Decimal 统一保留 2 位小数（toFixed 避免 toString 丢失末尾 0）。 */
function formatDecimal(value: Prisma.Decimal): string;
function formatDecimal(value: Prisma.Decimal | null | undefined): string | null;
function formatDecimal(value: Prisma.Decimal | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  return value.toFixed(2);
}

export class SpecResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '颜色' })
  name!: string;

  @ApiProperty({ example: ['黑色', '白色'], type: [String] })
  values!: string[];

  @ApiProperty({ example: 0 })
  sort!: number;
}

export class SkuResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: { 颜色: '黑色', 尺码: 'M' } })
  spec!: Record<string, string>;

  @ApiPropertyOptional({ example: 'SKU-0001', nullable: true })
  skuCode!: string | null;

  @ApiProperty({ example: '199.00' })
  price!: string;

  @ApiPropertyOptional({ example: '299.00', nullable: true })
  marketPrice!: string | null;

  @ApiPropertyOptional({ example: '99.00', nullable: true })
  costPrice!: string | null;

  @ApiProperty({ example: 100 })
  stock!: number;

  @ApiProperty({ example: 0 })
  lockedStock!: number;

  @ApiProperty({ example: 10 })
  warnStock!: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/sku.png', nullable: true })
  image!: string | null;

  @ApiProperty({ example: 1, description: '1启用/0禁用' })
  status!: number;

  @ApiPropertyOptional({ example: '500.00', nullable: true, description: '克' })
  weight!: string | null;

  @ApiPropertyOptional({ example: '1000.00', nullable: true, description: '立方厘米' })
  volume!: string | null;
}

export class ProductDetailResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  shopId!: number;

  @ApiProperty({ example: 3 })
  categoryId!: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  brandId!: number | null;

  @ApiProperty({ example: '小米14 Pro 骁龙8Gen3 16GB+512GB' })
  title!: string;

  @ApiPropertyOptional({ example: '旗舰性能', nullable: true })
  subtitle!: string | null;

  @ApiProperty({ example: 'https://cdn.example.com/main.png' })
  mainImg!: string;

  @ApiProperty({ example: ['https://cdn.example.com/1.png'], type: [String] })
  images!: string[];

  @ApiProperty({ example: '<p>详情</p>' })
  detailHtml!: string;

  @ApiProperty({ enum: [0, 1, 2, 3, 4] })
  status!: number;

  @ApiProperty({ enum: [0, 1, 2] })
  auditStatus!: number;

  @ApiPropertyOptional({ example: null, nullable: true })
  auditReason!: string | null;

  @ApiProperty({ example: 0 })
  salesCount!: number;

  @ApiProperty({ example: '5.00' })
  ratingAvg!: string;

  @ApiProperty({ type: [SpecResponseDto] })
  specs!: SpecResponseDto[];

  @ApiProperty({ type: [SkuResponseDto] })
  skus!: SkuResponseDto[];
}

export class ProductListItemResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  shopId!: number;

  @ApiProperty({ example: 3 })
  categoryId!: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  brandId!: number | null;

  @ApiProperty({ example: '小米14 Pro 骁龙8Gen3 16GB+512GB' })
  title!: string;

  @ApiProperty({ example: 'https://cdn.example.com/main.png' })
  mainImg!: string;

  @ApiProperty({ enum: [0, 1, 2, 3, 4] })
  status!: number;

  @ApiProperty({ enum: [0, 1, 2] })
  auditStatus!: number;

  @ApiProperty({ example: 0 })
  salesCount!: number;

  @ApiProperty({ example: '5.00' })
  ratingAvg!: string;

  @ApiProperty({ example: '2026-09-17T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-17T00:00:00.000Z' })
  updatedAt!: Date;
}

export function toSpecResponse(spec: SpuSpec): SpecResponseDto {
  return {
    id: spec.id,
    name: spec.name,
    values: spec.valuesJson as string[],
    sort: spec.sort,
  };
}

export function toSkuResponse(sku: Sku): SkuResponseDto {
  return {
    id: sku.id,
    spec: sku.specJson as Record<string, string>,
    skuCode: sku.skuCode,
    price: formatDecimal(sku.price),
    marketPrice: formatDecimal(sku.marketPrice),
    costPrice: formatDecimal(sku.costPrice),
    stock: sku.stock,
    lockedStock: sku.lockedStock,
    warnStock: sku.warnStock,
    image: sku.image,
    status: sku.status,
    weight: formatDecimal(sku.weight),
    volume: formatDecimal(sku.volume),
  };
}

export type SpuWithRelations = Spu & { specs: SpuSpec[]; skus: Sku[] };

export function toProductDetailResponse(spu: SpuWithRelations): ProductDetailResponseDto {
  return {
    id: spu.id,
    shopId: spu.shopId,
    categoryId: spu.categoryId,
    brandId: spu.brandId,
    title: spu.title,
    subtitle: spu.subtitle,
    mainImg: spu.mainImg,
    images: spu.imagesJson as string[],
    detailHtml: spu.detailHtml,
    status: spu.status,
    auditStatus: spu.auditStatus,
    auditReason: spu.auditReason,
    salesCount: spu.salesCount,
    ratingAvg: formatDecimal(spu.ratingAvg),
    specs: spu.specs.map(toSpecResponse),
    skus: spu.skus.map(toSkuResponse),
  };
}

export function toProductListItem(spu: Spu): ProductListItemResponseDto {
  return {
    id: spu.id,
    shopId: spu.shopId,
    categoryId: spu.categoryId,
    brandId: spu.brandId,
    title: spu.title,
    mainImg: spu.mainImg,
    status: spu.status,
    auditStatus: spu.auditStatus,
    salesCount: spu.salesCount,
    ratingAvg: formatDecimal(spu.ratingAvg),
    createdAt: spu.createdAt,
    updatedAt: spu.updatedAt,
  };
}