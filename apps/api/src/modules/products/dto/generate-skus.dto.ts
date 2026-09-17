import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { SpecInputDto } from './product-input.dto';

export class GenerateSkusDto {
  @ApiProperty({ type: [SpecInputDto], required: false, description: '规格组；为空时返回一个无规格 SKU' })
  @IsOptional()
  @IsArray({ message: 'specs 需为数组' })
  @ValidateNested({ each: true })
  @Type(() => SpecInputDto)
  specs?: SpecInputDto[];
}