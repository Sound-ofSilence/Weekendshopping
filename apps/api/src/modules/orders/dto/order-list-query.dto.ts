import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class OrderListQueryDto extends PaginationQueryDto {
  /** 订单状态筛选（0-6，见 OrderStatus） */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  status?: number;
}
