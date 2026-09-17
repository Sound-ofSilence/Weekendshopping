import { Injectable } from '@nestjs/common';
import type { Category } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryNodeDto, toCategoryNode } from './dto/category-response.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async tree(): Promise<CategoryNodeDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { status: 1, deletedAt: null },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    return this.buildTree(categories);
  }

  async children(id: number): Promise<CategoryNodeDto[]> {
    const children = await this.prisma.category.findMany({
      where: { parentId: id, status: 1, deletedAt: null },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    return children.map((category) => toCategoryNode(category));
  }

  /** 将扁平类目列表组装成树；parentId 为 null 或 0 视为一级类目。 */
  private buildTree(categories: Category[]): CategoryNodeDto[] {
    const nodeMap = new Map<number, CategoryNodeDto>();
    for (const category of categories) {
      nodeMap.set(category.id, toCategoryNode(category));
    }

    const roots: CategoryNodeDto[] = [];
    for (const category of categories) {
      const node = nodeMap.get(category.id) as CategoryNodeDto;
      const parentId = category.parentId ?? 0;
      const parent = parentId === 0 ? undefined : nodeMap.get(parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }
}