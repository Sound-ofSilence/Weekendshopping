import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../src/common/constants/error-codes';
import { AuditStatus, ProductStatus } from '../../src/modules/products/constants/product-status.enum';
import { CreateProductDto } from '../../src/modules/products/dto/create-product.dto';
import { SellerProductsService } from '../../src/modules/products/seller-products.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('SellerProductsService (unit)', () => {
  const spuBase = {
    id: 1,
    shopId: 1,
    categoryId: 3,
    brandId: null,
    title: '小米14 Pro 骁龙8Gen3',
    subtitle: null,
    mainImg: 'main.png',
    imagesJson: ['main.png'],
    detailHtml: '<p>详情</p>',
    status: ProductStatus.DRAFT,
    auditStatus: AuditStatus.PENDING,
    auditReason: null,
    salesCount: 0,
    ratingAvg: new Prisma.Decimal('5.00'),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const leafCategory = {
    id: 3,
    parentId: 1,
    name: '手机',
    level: 3,
    sort: 0,
    icon: null,
    isLeaf: true,
    status: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const txMock = {
    spu: {
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    spuSpec: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    sku: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const prismaMock = {
    category: { findFirst: jest.fn() },
    spu: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg as Promise<unknown>[]);
      }
      return (arg as (tx: typeof txMock) => unknown)(txMock);
    }),
  };

  let service: SellerProductsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [SellerProductsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(SellerProductsService);
  });

  const createDto: CreateProductDto = {
    title: '小米14 Pro 骁龙8Gen3',
    categoryId: 3,
    mainImg: 'main.png',
    images: ['main.png'],
    detailHtml: '<p>详情</p>',
    specs: [{ name: '颜色', values: ['黑色'] }],
    skus: [{ spec: { 颜色: '黑色' }, price: '199.00', stock: 10 }],
  };

  describe('create', () => {
    it('非叶子类目抛错', async () => {
      prismaMock.category.findFirst.mockResolvedValue({ ...leafCategory, isLeaf: false });

      await expect(service.create(createDto)).rejects.toMatchObject({
        code: ErrorCode.BUSINESS_ERROR,
        message: '必须选择叶子类目',
      });
    });

    it('SKU 价格必须大于 0', async () => {
      prismaMock.category.findFirst.mockResolvedValue(leafCategory);
      const dto: CreateProductDto = { ...createDto, skus: [{ spec: {}, price: '0', stock: 10 }] };

      await expect(service.create(dto)).rejects.toMatchObject({
        code: ErrorCode.BUSINESS_ERROR,
        message: 'SKU 价格必须大于 0',
      });
    });

    it('发布草稿商品并写入 spec/sku', async () => {
      prismaMock.category.findFirst.mockResolvedValue(leafCategory);
      txMock.spu.create.mockResolvedValue({ ...spuBase, id: 1 });
      txMock.spuSpec.create.mockResolvedValue({});
      txMock.sku.create.mockResolvedValue({});
      txMock.spu.findUniqueOrThrow.mockResolvedValue({ ...spuBase, skus: [], specs: [] });

      const result = await service.create(createDto);

      expect(txMock.spu.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ProductStatus.DRAFT, auditStatus: AuditStatus.PENDING }),
        }),
      );
      expect(txMock.spuSpec.create).toHaveBeenCalledTimes(1);
      expect(txMock.sku.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('非草稿/驳回状态不可编辑', async () => {
      prismaMock.spu.findFirst.mockResolvedValue({ ...spuBase, status: ProductStatus.ON_SALE });

      await expect(service.update(1, { title: '新标题新标题' })).rejects.toMatchObject({
        code: ErrorCode.BUSINESS_ERROR,
      });
    });

    it('更新标题', async () => {
      prismaMock.spu.findFirst.mockResolvedValue(spuBase);
      txMock.spu.update.mockResolvedValue({});
      txMock.spu.findUniqueOrThrow.mockResolvedValue({ ...spuBase, skus: [], specs: [] });

      await service.update(1, { title: '新标题新标题' });

      expect(txMock.spu.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { title: '新标题新标题' } }),
      );
    });
  });

  describe('submit', () => {
    it('提交后置为待审核并直接通过', async () => {
      prismaMock.spu.findFirst.mockResolvedValue(spuBase);

      await service.submit(1);

      expect(prismaMock.spu.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: ProductStatus.PENDING_AUDIT, auditStatus: AuditStatus.APPROVED, auditReason: null },
        }),
      );
    });

    it('上架状态不可提交', async () => {
      prismaMock.spu.findFirst.mockResolvedValue({ ...spuBase, status: ProductStatus.ON_SALE });

      await expect(service.submit(1)).rejects.toMatchObject({ code: ErrorCode.BUSINESS_ERROR });
    });
  });

  describe('onSale / offSale', () => {
    it('待审核+已通过 → 上架', async () => {
      prismaMock.spu.findFirst.mockResolvedValue({
        ...spuBase,
        status: ProductStatus.PENDING_AUDIT,
        auditStatus: AuditStatus.APPROVED,
      });

      await service.onSale(1);

      expect(prismaMock.spu.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: ProductStatus.ON_SALE } }),
      );
    });

    it('未通过审核不可上架', async () => {
      prismaMock.spu.findFirst.mockResolvedValue({
        ...spuBase,
        status: ProductStatus.PENDING_AUDIT,
        auditStatus: AuditStatus.PENDING,
      });

      await expect(service.onSale(1)).rejects.toMatchObject({
        code: ErrorCode.BUSINESS_ERROR,
        message: '商品尚未通过审核',
      });
    });

    it('上架 → 下架', async () => {
      prismaMock.spu.findFirst.mockResolvedValue({ ...spuBase, status: ProductStatus.ON_SALE });

      await service.offSale(1);

      expect(prismaMock.spu.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: ProductStatus.OFF_SALE } }),
      );
    });
  });

  describe('remove', () => {
    it('软删除', async () => {
      prismaMock.spu.findFirst.mockResolvedValue(spuBase);

      await service.remove(1);

      expect(prismaMock.spu.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { deletedAt: expect.any(Date) } }),
      );
    });
  });

  describe('batch', () => {
    it('批量上架', async () => {
      await service.batchOnSale([1, 2]);

      expect(prismaMock.spu.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: { in: [1, 2] } }) }),
      );
    });

    it('批量下架', async () => {
      await service.batchOffSale([1, 2]);

      expect(prismaMock.spu.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: ProductStatus.ON_SALE }) }),
      );
    });
  });

  describe('generateSkus', () => {
    it('生成笛卡尔积', () => {
      const result = service.generateSkus([
        { name: '颜色', values: ['黑', '白'] },
        { name: '尺码', values: ['M', 'L'] },
      ]);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ 颜色: '黑', 尺码: 'M' });
      expect(result[3]).toEqual({ 颜色: '白', 尺码: 'L' });
    });

    it('空规格返回单个空 spec', () => {
      expect(service.generateSkus([])).toEqual([{}]);
    });
  });

  describe('list', () => {
    it('返回分页列表', async () => {
      prismaMock.spu.count.mockResolvedValue(1);
      prismaMock.spu.findMany.mockResolvedValue([spuBase]);

      const result = await service.list({ page: 1, pageSize: 10 });

      expect(result.total).toBe(1);
      expect(result.list).toHaveLength(1);
      expect(result.list[0].id).toBe(1);
    });
  });
});