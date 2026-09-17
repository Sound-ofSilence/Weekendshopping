import { ApiProperty } from '@nestjs/swagger';
import type { Category } from '@prisma/client';

export class CategoryNodeDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 0, nullable: true, description: '0 或 null 表示一级' })
  parentId!: number | null;

  @ApiProperty({ example: '手机数码' })
  name!: string;

  @ApiProperty({ example: 1, description: '层级 1/2/3' })
  level!: number;

  @ApiProperty({ example: 0 })
  sort!: number;

  @ApiProperty({ example: 'icon.png', nullable: true })
  icon!: string | null;

  @ApiProperty({ example: false })
  isLeaf!: boolean;

  @ApiProperty({ example: 1, description: '1启用/0禁用' })
  status!: number;

  @ApiProperty({ type: CategoryNodeDto, isArray: true })
  children!: CategoryNodeDto[];
}

export function toCategoryNode(category: Category, children: CategoryNodeDto[] = []): CategoryNodeDto {
  return {
    id: category.id,
    parentId: category.parentId,
    name: category.name,
    level: category.level,
    sort: category.sort,
    icon: category.icon,
    isLeaf: category.isLeaf,
    status: category.status,
    children,
  };
}