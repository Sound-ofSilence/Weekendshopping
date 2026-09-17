import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export type SearchSort = 'default' | 'sales' | 'price_asc' | 'price_desc' | 'newest';

export class SearchQueryDto {
  @ApiPropertyOptional({ example: '小米', description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ example: 3, description: '分类 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId 需为整数' })
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ example: 1, description: '品牌 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'brandId 需为整数' })
  @Min(1)
  brandId?: number;

  @ApiPropertyOptional({ example: 100, description: '最低价（最低 SKU 价）' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 5000, description: '最高价（最低 SKU 价）' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['default', 'sales', 'price_asc', 'price_desc', 'newest'], default: 'default' })
  @IsOptional()
  @IsIn(['default', 'sales', 'price_asc', 'price_desc', 'newest'], { message: 'sort 非法' })
  sort?: SearchSort;

  @ApiProperty({ example: 1, description: '页码（从 1 开始）' })
  @Type(() => Number)
  @IsInt({ message: 'page 需为整数' })
  @Min(1)
  page!: number;

  @ApiProperty({ example: 20, description: '每页数量' })
  @Type(() => Number)
  @IsInt({ message: 'pageSize 需为整数' })
  @Min(1)
  @Max(100)
  pageSize!: number;
}
