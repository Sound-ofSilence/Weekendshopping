import { Test } from '@nestjs/testing';
import { BrandsService } from '../../src/modules/brands/brands.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('BrandsService (unit)', () => {
  const brandRecord = {
    id: 1,
    name: '小米',
    logo: null,
    status: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const prismaMock = {
    brand: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
  };

  let service: BrandsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [BrandsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(BrandsService);
  });

  it('返回分页品牌列表', async () => {
    prismaMock.brand.count.mockResolvedValue(1);
    prismaMock.brand.findMany.mockResolvedValue([brandRecord]);

    const result = await service.list({ page: 1, pageSize: 10 });

    expect(result.total).toBe(1);
    expect(result.list).toHaveLength(1);
    expect(result.list[0].name).toBe('小米');
    expect(prismaMock.brand.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
  });

  it('未传分页参数时使用默认值', async () => {
    prismaMock.brand.count.mockResolvedValue(0);
    prismaMock.brand.findMany.mockResolvedValue([]);

    await service.list({});

    expect(prismaMock.brand.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
  });
});