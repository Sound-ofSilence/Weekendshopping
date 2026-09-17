import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: 12, description: 'SKU ID' })
  @Type(() => Number)
  @IsInt({ message: 'skuId 需为整数' })
  skuId!: number;

  @ApiPropertyOptional({ example: 2, description: '加购数量，默认 1' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'quantity 需为整数' })
  @Min(1, { message: '数量至少为 1' })
  quantity?: number;
}
