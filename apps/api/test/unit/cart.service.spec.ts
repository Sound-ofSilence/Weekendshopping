import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../src/common/constants/error-codes';
import { CartService } from '../../src/modules/cart/cart.service';
import { ProductStatus } from '../../src/modules/products/constants/product-status.enum';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('CartService (unit)', () => {
  const spuBase = {
    id: 1,
    shopId: 1,
    title: '测试商品',
    status: ProductStatus.ON_SALE,
    deletedAt: null,
  };

  const skuBase = {
    id: 12,
    spuId: 1,
    specJson: { 颜色: '黑色' },
    skuCode: 'SKU-001',
    price: new Prisma.Decimal('199.00'),
    marketPrice: null,
    costPrice: null,
    stock: 10,
    lockedStock: 0,
    warnStock: 0,
    image: 'sku.png',
    status: 1,
    weight: null,
    volume: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    spu: spuBase,
  };

  const cartBase = {
    id: 99,
    userId: 1,
    shopId: 1,
    skuId: 12,
    quantity: 2,
    selected: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const txMock = {
    sku: { findUnique: jest.fn() },
    cart: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
  };

  const prismaMock = {
    cart: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    sku: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg as Promise<unknown>[]);
      }
      return (arg as (tx: typeof txMock) => unknown)(txMock);
    }),
  };

  let service: CartService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [CartService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(CartService);
  });

  describe('addItem', () => {
    it('同 SKU 累加数量', async () => {
      txMock.sku.findUnique.mockResolvedValue(skuBase);
      txMock.cart.findUnique.mockResolvedValue(cartBase);

      await service.addItem(1, { skuId: 12, quantity: 3 });

      expect(txMock.cart.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 99 }, data: { quantity: 5 } }),
      );
    });

    it('新 SKU 创建购物车项', async () => {
      txMock.sku.findUnique.mockResolvedValue(skuBase);
      txMock.cart.findUnique.mockResolvedValue(null);

      await service.addItem(1, { skuId: 12, quantity: 2 });

      expect(txMock.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { userId: 1, shopId: 1, skuId: 12, quantity: 2 } }),
      );
    });

    it('累加后超过库存抛错', async () => {
      txMock.sku.findUnique.mockResolvedValue({ ...skuBase, stock: 2 });
      txMock.cart.findUnique.mockResolvedValue(cartBase);

      await expect(service.addItem(1, { skuId: 12, quantity: 1 })).rejects.toMatchObject({
        code: ErrorCode.BUSINESS_ERROR,
        message: '库存不足',
      });
    });

    it('SKU 下架抛错', async () => {
      txMock.sku.findUnique.mockResolvedValue({ ...skuBase, status: 0 });

      await expect(service.addItem(1, { skuId: 12 })).rejects.toMatchObject({
        code: ErrorCode.BUSINESS_ERROR,
        message: 'SKU 已下架',
      });
    });

    it('SKU 不存在抛错', async () => {
      txMock.sku.findUnique.mockResolvedValue(null);

      await expect(service.addItem(1, { skuId: 999 })).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
        message: 'SKU 不存在',
      });
    });
  });

  describe('updateItem', () => {
    it('改数量', async () => {
      prismaMock.cart.findFirst.mockResolvedValue(cartBase);
      prismaMock.sku.findUnique.mockResolvedValue(skuBase);

      await service.updateItem(1, 99, { quantity: 5 });

      expect(prismaMock.cart.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 99 }, data: { quantity: 5 } }),
      );
    });

    it('勾选', async () => {
      prismaMock.cart.findFirst.mockResolvedValue(cartBase);

      await service.updateItem(1, 99, { selected: false });

      expect(prismaMock.cart.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 99 }, data: { selected: false } }),
      );
    });

    it('改数量超过库存抛错', async () => {
      prismaMock.cart.findFirst.mockResolvedValue(cartBase);
      prismaMock.sku.findUnique.mockResolvedValue({ ...skuBase, stock: 3 });

      await expect(service.updateItem(1, 99, { quantity: 5 })).rejects.toMatchObject({
        code: ErrorCode.BUSINESS_ERROR,
        message: '库存不足',
      });
    });

    it('购物车项不存在抛错', async () => {
      prismaMock.cart.findFirst.mockResolvedValue(null);

      await expect(service.updateItem(1, 99, { quantity: 1 })).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
      });
    });

    it('未提供任何字段抛错', async () => {
      await expect(service.updateItem(1, 99, {})).rejects.toMatchObject({
        code: ErrorCode.BAD_REQUEST,
      });
    });
  });

  describe('removeItem', () => {
    it('删除单项', async () => {
      prismaMock.cart.deleteMany.mockResolvedValue({ count: 1 });

      await service.removeItem(1, 99);

      expect(prismaMock.cart.deleteMany).toHaveBeenCalledWith({ where: { id: 99, userId: 1 } });
    });

    it('不存在抛错', async () => {
      prismaMock.cart.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.removeItem(1, 99)).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
      });
    });
  });

  describe('removeInvalid', () => {
    it('清空失效项', async () => {
      prismaMock.cart.findMany.mockResolvedValue([
        { ...cartBase, id: 1, skuId: 12 },
        { ...cartBase, id: 2, skuId: 13 },
      ]);
      prismaMock.sku.findMany.mockResolvedValue([skuBase, { ...skuBase, id: 13, stock: 0 }]);
      prismaMock.cart.deleteMany.mockResolvedValue({ count: 1 });

      await service.removeInvalid(1);

      expect(prismaMock.cart.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: { in: [2] }, userId: 1 } }),
      );
    });

    it('无失效项时不删除', async () => {
      prismaMock.cart.findMany.mockResolvedValue([cartBase]);
      prismaMock.sku.findMany.mockResolvedValue([skuBase]);

      await service.removeInvalid(1);

      expect(prismaMock.cart.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('按店铺分组并标记失效项', async () => {
      prismaMock.cart.findMany.mockResolvedValue([
        { ...cartBase, id: 1, skuId: 12 },
        { ...cartBase, id: 2, skuId: 13 },
      ]);
      prismaMock.sku.findMany.mockResolvedValue([skuBase, { ...skuBase, id: 13, stock: 0 }]);

      const result = await service.list(1);

      expect(result).toHaveLength(1);
      expect(result[0].shopId).toBe(1);
      expect(result[0].items).toHaveLength(2);
      expect(result[0].items[0].price).toBe('199.00');
      expect(result[0].items.find((item) => item.skuId === 13)?.isInvalid).toBe(true);
    });
  });
});
