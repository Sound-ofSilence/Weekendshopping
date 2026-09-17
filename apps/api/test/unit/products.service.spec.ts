import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../src/common/constants/error-codes';
import { ProductsService } from '../../src/modules/products/products.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('ProductsService (unit)', () => {
  const sku = {
    id: 1,
    spuId: 1,
    specJson: { 颜色: '黑色' },
    skuCode: 'SKU-1',
    price: new Prisma.Decimal('199.00'),
    marketPrice: null,
    costPrice: null,
    stock: 10,
    lockedStock: 0,
    warnStock: 1,
    image: null,
    status: 1,
    weight: null,
    volume: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const spec = {
    id: 1,
    spuId: 1,
    name: '颜色',
    valuesJson: ['黑色'],
    sort: 0,
  };
  const spuRecord = {
    id: 1,
    shopId: 1,
    categoryId: 3,
    brandId: null,
    title: '小米14 Pro',
    subtitle: null,
    mainImg: 'main.png',
    imagesJson: ['main.png'],
    detailHtml: '<p>详情</p>',
    status: 2,
    auditStatus: 1,
    auditReason: null,
    salesCount: 0,
    ratingAvg: new Prisma.Decimal('5.00'),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    skus: [sku],
    specs: [spec],
  };

  const prismaMock = {
    spu: {
      findFirst: jest.fn(),
    },
  };

  let service: ProductsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  describe('detail', () => {
    it('返回商品详情（金额转字符串）', async () => {
      prismaMock.spu.findFirst.mockResolvedValue(spuRecord);

      const result = await service.detail(1);

      expect(result.id).toBe(1);
      expect(result.skus).toHaveLength(1);
      expect(result.skus[0].price).toBe('199.00');
      expect(result.specs).toHaveLength(1);
      expect(result.ratingAvg).toBe('5.00');
    });

    it('商品不存在抛 404', async () => {
      prismaMock.spu.findFirst.mockResolvedValue(null);

      await expect(service.detail(999)).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
    });
  });

  describe('skus', () => {
    it('返回 SKU 列表', async () => {
      prismaMock.spu.findFirst.mockResolvedValue(spuRecord);

      const result = await service.skus(1);

      expect(result).toHaveLength(1);
      expect(result[0].skuCode).toBe('SKU-1');
    });
  });
});