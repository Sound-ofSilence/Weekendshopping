import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt({ message: 'orderItemId 需为整数' })
  @IsPositive({ message: 'orderItemId 需为正整数' })
  orderItemId!: number;

  @Type(() => Number)
  @IsInt({ message: 'rating 需为整数' })
  @Min(1, { message: 'rating 最小为 1' })
  @Max(5, { message: 'rating 最大为 5' })
  rating!: number;

  @IsString({ message: 'content 需为字符串' })
  @MinLength(1, { message: 'content 不能为空' })
  @MaxLength(500, { message: 'content 最多 500 字' })
  content!: string;

  @IsOptional()
  @IsArray({ message: 'imagesJson 需为数组' })
  @ArrayMaxSize(9, { message: 'imagesJson 最多 9 张' })
  @IsString({ each: true, message: '图片地址需为字符串' })
  imagesJson?: string[];

  @IsOptional()
  @IsBoolean({ message: 'isAnonymous 需为布尔值' })
  isAnonymous?: boolean;
}
