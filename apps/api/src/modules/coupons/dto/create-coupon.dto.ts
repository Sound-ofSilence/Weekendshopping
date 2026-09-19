import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export class CreateCouponDto {
  @ApiProperty({ description: '券名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: '券类型：1满减 2折扣', enum: [1, 2] })
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2])
  type!: number;

  @ApiProperty({ description: '满减金额 或 折扣（如 8.5 表示 85 折）', example: '10.00' })
  @IsString()
  @Matches(AMOUNT_PATTERN, { message: 'value 金额最多两位小数' })
  value!: string;

  @ApiProperty({ description: '使用门槛', example: '100.00' })
  @IsString()
  @Matches(AMOUNT_PATTERN, { message: 'minAmount 金额最多两位小数' })
  minAmount!: string;

  @ApiProperty({ description: '发行总量' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalCount!: number;

  @ApiPropertyOptional({ description: '每人限领', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @ApiProperty({ description: '生效时间' })
  @IsDateString()
  startAt!: string;

  @ApiProperty({ description: '失效时间' })
  @IsDateString()
  endAt!: string;

  @ApiPropertyOptional({ description: '状态：1启用 0禁用', default: 1, enum: [0, 1] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  status?: number;
}
