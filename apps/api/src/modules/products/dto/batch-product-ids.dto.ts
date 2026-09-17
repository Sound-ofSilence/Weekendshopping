import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsInt } from 'class-validator';

export class BatchProductIdsDto {
  @ApiProperty({ example: [1, 2, 3], type: [Number] })
  @IsArray({ message: 'ids 需为数组' })
  @ArrayMinSize(1, { message: 'ids 至少1个' })
  @ArrayUnique({ message: 'ids 不能重复' })
  @Type(() => Number)
  @IsInt({ each: true, message: 'ids 需为整数数组' })
  ids!: number[];
}