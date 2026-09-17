import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const MONEY_REGEX = /^\d+(\.\d{1,2})?$/;

export class SpecInputDto {
  @ApiProperty({ example: '颜色', description: '规格名' })
  @IsString({ message: '规格名需为字符串' })
  @IsNotEmpty({ message: '规格名不能为空' })
  @MaxLength(20, { message: '规格名最长20个字符' })
  name!: string;

  @ApiProperty({ example: ['黑色', '白色'], type: [String], description: '规格值列表' })
  @IsArray({ message: '规格值需为数组' })
  @ArrayMinSize(1, { message: '规格值至少1个' })
  @IsString({ each: true, message: '规格值需为字符串' })
  values!: string[];
}

export class SkuInputDto {
  @ApiProperty({ example: { 颜色: '黑色', 尺码: 'M' }, description: '规格值映射' })
  @IsObject({ message: 'spec 需为对象' })
  spec!: Record<string, string>;

  @ApiPropertyOptional({ example: 'SKU-0001' })
  @IsOptional()
  @IsString({ message: 'skuCode 需为字符串' })
  @MaxLength(64, { message: 'skuCode 最长64个字符' })
  skuCode?: string;

  @ApiProperty({ example: '199.00', description: '售价（元，数字字符串）' })
  @Matches(MONEY_REGEX, { message: 'price 需为最多2位小数的非负数字字符串' })
  price!: string;

  @ApiPropertyOptional({ example: '299.00' })
  @IsOptional()
  @Matches(MONEY_REGEX, { message: 'marketPrice 需为最多2位小数的非负数字字符串' })
  marketPrice?: string;

  @ApiPropertyOptional({ example: '99.00' })
  @IsOptional()
  @Matches(MONEY_REGEX, { message: 'costPrice 需为最多2位小数的非负数字字符串' })
  costPrice?: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsInt({ message: 'stock 需为整数' })
  @Min(0, { message: 'stock 不能为负' })
  stock!: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/sku.png' })
  @IsOptional()
  @IsString({ message: 'image 需为字符串' })
  image?: string;

  @ApiPropertyOptional({ example: '500.00', description: '重量（克）' })
  @IsOptional()
  @Matches(MONEY_REGEX, { message: 'weight 需为最多2位小数的非负数字字符串' })
  weight?: string;

  @ApiPropertyOptional({ example: '1000.00', description: '体积（立方厘米）' })
  @IsOptional()
  @Matches(MONEY_REGEX, { message: 'volume 需为最多2位小数的非负数字字符串' })
  volume?: string;
}