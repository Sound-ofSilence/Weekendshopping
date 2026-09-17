import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiPropertyOptional({ example: 3, description: '新数量' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'quantity 需为整数' })
  @Min(1, { message: '数量至少为 1' })
  quantity?: number;

  @ApiPropertyOptional({ example: true, description: '是否勾选' })
  @IsOptional()
  @IsBoolean({ message: 'selected 需为布尔值' })
  selected?: boolean;
}
