import { Test } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ReviewsService } from '../../src/modules/reviews/reviews.service';
import { ErrorCode } from '../../src/common/constants/error-codes';

describe('ReviewsService (unit)', () => {
  let service: ReviewsService;
  let prisma: any;
  const userId = '1';

  beforeEach(async () => {
    prisma = {
      orderItem: { findUnique: jest.fn() },
      review: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
      },
      spu: { update: jest.fn() },
      $transaction: jest.fn((cb: any) => (typeof cb === 'function' ? cb(prisma) : Promise.all(cb))),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [ReviewsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ReviewsService);
  });

  describe('create', () => {
    it('订单项不存在时抛 NOT_FOUND', async () => {
      prisma.orderItem.findUnique.mockResolvedValue(null);
      await expect(
        service.create(userId, { orderItemId: 1, rating: 5, content: '好' } as any),
      ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
    });

    it('订单不是当前用户的时抛 FORBIDDEN', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        id: 1, spuId: 1, skuId: 1, order: { userId: 999, shopId: 1, status: 4, finishedAt: new Date() },
      });
      await expect(
        service.create(userId, { orderItemId: 1, rating: 5, content: '好' } as any),
      ).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });
    });

    it('订单状态不支持时抛 BAD_REQUEST', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        id: 1, spuId: 1, skuId: 1, order: { userId: 1, shopId: 1, status: 1, finishedAt: null },
      });
      await expect(
        service.create(userId, { orderItemId: 1, rating: 5, content: '好' } as any),
      ).rejects.toBeDefined();
    });

    it('敏感词命中时 status=2', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        id: 1, spuId: 1, skuId: 1, order: { userId: 1, shopId: 1, status: 4, finishedAt: new Date() },
      });
      prisma.review.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 1, ...data }));
      await service.create(userId, { orderItemId: 1, rating: 5, content: '包含政治敏感词' } as any);
      expect(prisma.review.create).toHaveBeenCalled();
      const arg = prisma.review.create.mock.calls[0][0];
      expect(arg.data.status).toBe(2);
    });

    it('正常评价 status=1 并更新 ratingAvg', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        id: 1, spuId: 1, skuId: 1, order: { userId: 1, shopId: 1, status: 4, finishedAt: new Date() },
      });
      prisma.review.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 1, ...data }));
      prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 } });
      await service.create(userId, { orderItemId: 1, rating: 5, content: '很好' } as any);
      const arg = prisma.review.create.mock.calls[0][0];
      expect(arg.data.status).toBe(1);
      expect(prisma.spu.update).toHaveBeenCalled();
    });
  });

  describe('listByProduct', () => {
    it('返回分页结果', async () => {
      prisma.review.findMany.mockResolvedValue([{ id: 1, rating: 5, content: '好' }]);
      prisma.review.count.mockResolvedValue(1);
      const r = await service.listByProduct('1' as any, { page: 1, pageSize: 10 } as any);
      expect(r.total).toBe(1);
      expect(r.list).toHaveLength(1);
    });
  });

  describe('sellerReply', () => {
    it('评价不存在抛 NOT_FOUND', async () => {
      prisma.review.findUnique.mockResolvedValue(null);
      await expect(service.sellerReply('1' as any, '1' as any, '谢谢')).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
    });

    it('正常回复更新成功', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: 1, shopId: 1, status: 1 });
      prisma.review.update.mockResolvedValue({ id: 1, sellerReply: '谢谢', status: 1 });
      const r = await service.sellerReply('1' as any, '1' as any, '谢谢');
      expect(r).toBeDefined();
      expect(prisma.review.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('不属于自己的评价抛 FORBIDDEN', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: 1, userId: 999, status: 1 });
      await expect(service.remove(userId, '1' as any)).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });
    });

    it('正常删除成功', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: 1, userId: 1, status: 1, spuId: 1 });
      prisma.review.delete.mockResolvedValue({});
      prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 5 } });
      await service.remove(userId, '1' as any);
      expect(prisma.review.delete).toHaveBeenCalled();
    });
  });
});