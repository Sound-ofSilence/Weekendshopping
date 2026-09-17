import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AuditStatus, ProductStatus } from '../constants/product-status.enum';

export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProductStatus, description: '商品状态' })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(ProductStatus, { message: 'status 非法' })
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: AuditStatus, description: '审核状态' })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(AuditStatus, { message: 'auditStatus 非法' })
  auditStatus?: AuditStatus;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId 需为整数' })
  categoryId?: number;

  @ApiPropertyOptional({ example: '小米', description: '标题关键词' })
  @IsOptional()
  @MaxLength(60, { message: '关键词最长60个字符' })
  keyword?: string;
}