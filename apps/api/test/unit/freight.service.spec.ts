import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import type { FreightTemplate } from '@prisma/client';
import { ErrorCode } from '../../src/common/constants/error-codes';
import type {
  CreateFreightTemplateDto,
  UpdateFreightTemplateDto,
} from '../../src/modules/logistics/dto/freight-template.dto';
import { FreightService } from '../../src/modules/logistics/freight.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('FreightService (unit)', () => {
  const makeTemplate = (overrides: Partial<FreightTemplate> = {}): FreightTemplate => ({
    id: 1,
    shopId: 1,
    name: '标准模板',
    chargeType: 1,
    firstCount: 1,
    firstFee: new Prisma.Decimal('10.00'),
    extraCount: 2,
    extraFee: new Prisma.Decimal('5.00'),
    freeRegions: [] as Prisma.JsonValue,
    excludedRegions: [] as Prisma.JsonValue,
    status: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const prismaMock = {
    freightTemplate: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  let service: FreightService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [FreightService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(FreightService);
  });

  describe('calcFreight 运费计算', () => {
    it('首件 1 件 10 元，买 1 件 = 10 元', () => {
      expect(service.calcFreight(makeTemplate(), 1).toFixed(2)).toBe('10.00');
    });

    it('买 3 件 = 10 + ceil((3-1)/2)*5 = 15 元', () => {
      expect(service.calcFreight(makeTemplate(), 3).toFixed(2)).toBe('15.00');
    });

    it('买 5 件 = 10 + ceil((5-1)/2)*5 = 20 元', () => {
      expect(service.calcFreight(makeTemplate(), 5).toFixed(2)).toBe('20.00');
    });

    it('包邮地区运费为 0', () => {
      const template = makeTemplate({ freeRegions: ['广东省'] as Prisma.JsonValue });
      expect(service.calcFreight(template, 3, '广东省').toFixed(2)).toBe('0.00');
    });

    it('不发货地区抛异常', () => {
      const template = makeTemplate({ excludedRegions: ['新疆'] as Prisma.JsonValue });
      expect(() => service.calcFreight(template, 1, '新疆')).toThrow('该地区暂不支持配送');
    });
  });

  describe('运费模板 CRUD', () => {
    it('创建模板', async () => {
      prismaMock.freightTemplate.create.mockResolvedValue(makeTemplate());

      const dto = {
        name: '标准模板',
        firstCount: 1,
        firstFee: '10.00',
        extraCount: 2,
        extraFee: '5.00',
      } as CreateFreightTemplateDto;

      const result = await service.create('1', dto);

      expect(prismaMock.freightTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ shopId: 1, name: '标准模板', firstCount: 1 }),
        }),
      );
      expect(result).toMatchObject({
        id: 1,
        name: '标准模板',
        firstFee: '10.00',
        extraFee: '5.00',
      });
    });

    it('查询列表', async () => {
      prismaMock.freightTemplate.findMany.mockResolvedValue([
        makeTemplate(),
        makeTemplate({ id: 2, name: '模板2' }),
      ]);

      const result = await service.list('1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 1, firstFee: '10.00' });
      expect(prismaMock.freightTemplate.findMany).toHaveBeenCalledWith({
        where: { shopId: 1 },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('更新模板', async () => {
      prismaMock.freightTemplate.findFirst.mockResolvedValue(makeTemplate());
      prismaMock.freightTemplate.update.mockResolvedValue(makeTemplate({ name: '更新模板' }));

      const dto = { name: '更新模板' } as UpdateFreightTemplateDto;
      const result = await service.update('1', 1, dto);

      expect(result).toMatchObject({ id: 1, name: '更新模板' });
      expect(prismaMock.freightTemplate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ name: '更新模板' }),
        }),
      );
    });

    it('更新不存在的模板抛异常', async () => {
      prismaMock.freightTemplate.findFirst.mockResolvedValue(null);

      await expect(
        service.update('1', 999, { name: 'x' } as UpdateFreightTemplateDto),
      ).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
        message: '运费模板不存在',
      });
    });

    it('删除模板', async () => {
      prismaMock.freightTemplate.findFirst.mockResolvedValue(makeTemplate());
      prismaMock.freightTemplate.delete.mockResolvedValue(makeTemplate());

      await expect(service.remove('1', 1)).resolves.toBeNull();
      expect(prismaMock.freightTemplate.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
