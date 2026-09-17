import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ProductStatus } from '../../src/modules/products/constants/product-status.enum';
import { PostgresSearchService } from '../../src/modules/search/search.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';

describe('PostgresSearchService (unit)', () => {
  const makeSpu = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    shopId: 1,
    categoryId: 3,
    brandId: null,
    title: '小米14 Pro',
    mainImg: 'main.png',
    status: ProductStatus.ON_SALE,
    salesCount: 100,
    ratingAvg: new Prisma.Decimal('4.80'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    skus: [
      { price: new Prisma.Decimal('199.00') },
      { price: new Prisma.Decimal('299.00') },
    ],
    ...overrides,
  });

  const prismaMock = {
    spu: {
      findMany: jest.fn(),
    },
  };

  const redisMock = {
    zIncrBy: jest.fn(),
    zRevRange: jest.fn(),
  };

  let service: PostgresSearchService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PostgresSearchService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();
    service = moduleRef.get(PostgresSearchService);
  });

  describe('searchProducts', () => {
    it('只返回在售商品，价格取最低 SKU 价并转字符串', async () => {
      prismaMock.spu.findMany.mockResolvedValue([makeSpu()]);

      const result = await service.searchProducts({ page: 1, pageSize: 20 });

      expect(prismaMock.spu.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            status: ProductStatus.ON_SALE,
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].price).toBe('199.00');
      expect(result[0].ratingAvg).toBe('4.80');
      expect(result[0].salesCount).toBe(100);
      expect(result[0].shopId).toBe(1);
    });

    it('keyword 触发标题模糊匹配并累加热词', async () => {
      prismaMock.spu.findMany.mockResolvedValue([makeSpu()]);
      redisMock.zIncrBy.mockResolvedValue('1');

      await service.searchProducts({ keyword: '小米', page: 1, pageSize: 20 });

      expect(prismaMock.spu.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: { contains: '小米', mode: 'insensitive' },
          }),
        }),
      );
      expect(redisMock.zIncrBy).toHaveBeenCalledWith('search:hotwords', 1, '小米');
    });

    it('default 排序按综合分数降序', async () => {
      const low = makeSpu({ id: 2, salesCount: 10 });
      const high = makeSpu({ id: 1, salesCount: 100 });
      prismaMock.spu.findMany.mockResolvedValue([low, high]);

      const result = await service.searchProducts({ page: 1, pageSize: 20 });

      expect(result.map((r) => r.id)).toEqual([1, 2]);
    });

    it('minPrice/maxPrice 过滤 SKU 价格区间', async () => {
      prismaMock.spu.findMany.mockResolvedValue([makeSpu()]);

      await service.searchProducts({ minPrice: 100, maxPrice: 500, page: 1, pageSize: 20 });

      expect(prismaMock.spu.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            skus: { some: { price: { gte: 100, lte: 500 } } },
          }),
        }),
      );
    });
  });

  describe('suggest', () => {
    it('按前缀返回联想词', async () => {
      redisMock.zRevRange.mockResolvedValue(['手机', '10', '手机壳', '5', '电脑', '3']);

      const result = await service.suggest('手机');

      expect(redisMock.zRevRange).toHaveBeenCalledWith('search:hotwords', 0, -1, true);
      expect(result).toEqual(['手机', '手机壳']);
    });

    it('空前缀返回空数组', async () => {
      const result = await service.suggest('  ');
      expect(result).toEqual([]);
      expect(redisMock.zRevRange).not.toHaveBeenCalled();
    });
  });

  describe('getHotKeywords', () => {
    it('返回带分数热词', async () => {
      redisMock.zRevRange.mockResolvedValue(['手机', '10', '手机壳', '5']);

      const result = await service.getHotKeywords(2);

      expect(redisMock.zRevRange).toHaveBeenCalledWith('search:hotwords', 0, 1, true);
      expect(result).toEqual([
        { keyword: '手机', score: 10 },
        { keyword: '手机壳', score: 5 },
      ]);
    });
  });
});
