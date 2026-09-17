import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class BrandQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '小米', description: '品牌名模糊筛选' })
  @IsOptional()
  @MaxLength(50, { message: '品牌名最长50个字符' })
  name?: string;
}