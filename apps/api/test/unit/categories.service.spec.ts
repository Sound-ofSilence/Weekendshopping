import { Test } from '@nestjs/testing';
import { CategoriesService } from '../../src/modules/categories/categories.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('CategoriesService (unit)', () => {
  const category = (id: number, parentId: number | null, name: string, isLeaf = false) => ({
    id,
    parentId,
    name,
    level: parentId === null || parentId === 0 ? 1 : 2,
    sort: 0,
    icon: null,
    isLeaf,
    status: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

  const prismaMock = {
    category: {
      findMany: jest.fn(),
    },
  };

  let service: CategoriesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [CategoriesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(CategoriesService);
  });

  describe('tree', () => {
    it('返回嵌套类目树', async () => {
      const parent = category(1, null, '手机数码');
      const child = category(2, 1, '手机');
      prismaMock.category.findMany.mockResolvedValue([parent, child]);

      const result = await service.tree();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('手机数码');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].name).toBe('手机');
    });

    it('parentId 为 0 视为一级', async () => {
      const root = category(1, 0, '服装');
      const child = category(2, 1, '男装');
      prismaMock.category.findMany.mockResolvedValue([root, child]);

      const result = await service.tree();

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
    });
  });

  describe('children', () => {
    it('返回直接子类目', async () => {
      const child = category(2, 1, '手机');
      prismaMock.category.findMany.mockResolvedValue([child]);

      const result = await service.children(1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
      expect(prismaMock.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { parentId: 1, status: 1, deletedAt: null } }),
      );
    });
  });
});