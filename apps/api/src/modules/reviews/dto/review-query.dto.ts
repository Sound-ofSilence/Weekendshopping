import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ReviewQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '状态筛选 0待审核 1已发布 2已屏蔽' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'status 需为整数' })
  @Min(0, { message: 'status 最小为 0' })
  @Max(2, { message: 'status 最大为 2' })
  status?: number;

  @ApiPropertyOptional({ description: '评分筛选 1-5' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'rating 需为整数' })
  @Min(1, { message: 'rating 最小为 1' })
  @Max(5, { message: 'rating 最大为 5' })
  rating?: number;
}
