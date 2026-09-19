import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsString, Matches, MaxLength, Min, ValidateNested } from 'class-validator';

export class SeckillProductItemDto {
  @Type(() => Number)
  @IsInt()
  skuId!: number;

  @Matches(/^\d+(\.\d{1,2})?$/)
  seckillPrice!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  stock!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limitPerUser!: number;
}

export class CreateSeckillActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsString()
  startAt!: string;

  @IsString()
  endAt!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeckillProductItemDto)
  products!: SeckillProductItemDto[];
}