import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

export class CreateFreightTemplateDto {
  @ApiProperty({ description: '模板名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ description: '计费类型（一期固定 1 按件）', default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsIn([1])
  chargeType?: number;

  @ApiProperty({ description: '首件数' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  firstCount!: number;

  @ApiProperty({ description: '首件运费' })
  @IsString()
  @Matches(MONEY_PATTERN, { message: '金额格式不正确' })
  firstFee!: string;

  @ApiProperty({ description: '续件数' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  extraCount!: number;

  @ApiProperty({ description: '续件运费' })
  @IsString()
  @Matches(MONEY_PATTERN, { message: '金额格式不正确' })
  extraFee!: string;

  @ApiPropertyOptional({ description: '包邮地区', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  freeRegions?: string[];

  @ApiPropertyOptional({ description: '不发货地区', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedRegions?: string[];

  @ApiPropertyOptional({ description: '状态 1启用 0禁用', default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  status?: number;
}

export class UpdateFreightTemplateDto extends PartialType(CreateFreightTemplateDto) {}
