import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true, description: '当前页数据' })
  list!: T[];

  @ApiProperty({ example: 100, description: '总数' })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  pageSize!: number;
}

export function toPaginated<T>(list: T[], total: number, page: number, pageSize: number): PaginatedResponseDto<T> {
  return { list, total, page, pageSize };
}