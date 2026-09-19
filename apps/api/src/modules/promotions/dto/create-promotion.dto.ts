import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class PromotionRuleDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reduce!: number;
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionRuleDto)
  rules!: PromotionRuleDto[];

  @IsString()
  startAt!: string;

  @IsString()
  endAt!: string;
}