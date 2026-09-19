import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export class CouponQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '券类型：1满减 2折扣', enum: [1, 2] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2])
  type?: number;

  @ApiPropertyOptional({ description: '状态：1启用 0禁用', enum: [0, 1] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number;

  @ApiPropertyOptional({ description: '店铺 id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shopId?: number;
}

export class AvailableCouponQueryDto {
  @ApiProperty({ description: '下单店铺 id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shopId!: number;

  @ApiProperty({ description: '订单金额', example: '200.00' })
  @Matches(AMOUNT_PATTERN, { message: 'amount 金额最多两位小数' })
  amount!: string;
}
