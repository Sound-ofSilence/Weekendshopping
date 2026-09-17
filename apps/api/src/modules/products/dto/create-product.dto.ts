import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SkuInputDto, SpecInputDto } from './product-input.dto';

export class CreateProductDto {
  @ApiProperty({ example: '小米14 Pro 骁龙8Gen3 16GB+512GB' })
  @IsString({ message: '标题需为字符串' })
  @Length(5, 60, { message: '标题需为5-60字' })
  title!: string;

  @ApiPropertyOptional({ example: '旗舰性能' })
  @IsOptional()
  @IsString({ message: '副标题需为字符串' })
  @MaxLength(120, { message: '副标题最长120个字符' })
  subtitle?: string;

  @ApiProperty({ example: 3, description: '叶子类目ID' })
  @Type(() => Number)
  @IsInt({ message: 'categoryId 需为整数' })
  categoryId!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'brandId 需为整数' })
  brandId?: number;

  @ApiProperty({ example: 'https://cdn.example.com/main.png' })
  @IsString({ message: '主图需为字符串' })
  @IsNotEmpty({ message: '主图不能为空' })
  mainImg!: string;

  @ApiProperty({ example: ['https://cdn.example.com/1.png'], type: [String] })
  @IsArray({ message: 'images 需为数组' })
  @IsString({ each: true, message: '图片地址需为字符串' })
  images!: string[];

  @ApiProperty({ example: '<p>详情</p>' })
  @IsString({ message: '商品详情需为字符串' })
  detailHtml!: string;

  @ApiProperty({ type: [SpecInputDto], required: false })
  @IsOptional()
  @IsArray({ message: 'specs 需为数组' })
  @ValidateNested({ each: true })
  @Type(() => SpecInputDto)
  specs?: SpecInputDto[];

  @ApiProperty({ type: [SkuInputDto] })
  @IsArray({ message: 'skus 需为数组' })
  @ArrayMinSize(1, { message: '至少需要1个SKU' })
  @ValidateNested({ each: true })
  @Type(() => SkuInputDto)
  skus!: SkuInputDto[];
}