import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  /** 购物车项 id（与 skuId 二选一） */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  cartId?: number;

  /** SKU id（与 cartId 二选一） */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  skuId?: number;

  /** 数量（走 skuId 直购时必填） */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CreateOrderDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  addressId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  buyerRemark?: string;
}
