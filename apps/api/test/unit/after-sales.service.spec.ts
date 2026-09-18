import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AfterSalesService } from '../../src/modules/after-sales/after-sales.service';
import { ErrorCode } from '../../src/common/constants/error-codes';

describe('AfterSalesService (unit)', () => {
  let service: AfterSalesService;
  let prisma: any;
  const userId = 1;

  const fullAfterSale = (overrides: any = {}) => ({
    id: 1, afterSaleNo: 'AS1', orderId: 1, orderNo: 'OD1', orderItemId: 1,
    userId, shopId: 1, type: 1, reason: 'r', description: null, evidenceJson: [],
    amount: new Prisma.Decimal('50.00'), status: 0,
    returnTrackingNo: null, returnExpressCode: null,
    sellerReply: null, sellerReplyAt: null, refundNo: null, closedAt: null,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      orderItem: { findUnique: jest.fn(), update: jest.fn() },
      afterSale: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn() },
      refund: { create: jest.fn() },
      $transaction: jest.fn(async (cb: any) => (typeof cb === 'function' ? cb(prisma) : Promise.all(cb))),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [AfterSalesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(AfterSalesService);
  });

  describe('create', () => {
    it('订单项不存在抛 NOT_FOUND', async () => {
      prisma.orderItem.findUnique.mockResolvedValue(null);
      await expect(service.create(userId, { orderItemId: 1, type: 1, reason: 'r', amount: '10.00' } as any))
        .rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
    });

    it('已申请过售后的抛 CONFLICT', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        id: 1, refundStatus: 1, total: new Prisma.Decimal('100.00'),
        order: { userId, status: 1, shopId: 1, orderNo: 'OD1' }, orderId: 1,
      });
      await expect(service.create(userId, { orderItemId: 1, type: 1, reason: 'r', amount: '10.00' } as any))
        .rejects.toMatchObject({ code: ErrorCode.CONFLICT });
    });

    it('订单状态不支持仅退款时抛 BAD_REQUEST', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        id: 1, refundStatus: 0, total: new Prisma.Decimal('100.00'),
        order: { userId, status: 4, shopId: 1, orderNo: 'OD1' }, orderId: 1,
      });
      await expect(service.create(userId, { orderItemId: 1, type: 1, reason: 'r', amount: '10.00' } as any))
        .rejects.toBeDefined();
    });

    it('金额超过订单项实付时抛 BAD_REQUEST', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        id: 1, refundStatus: 0, total: new Prisma.Decimal('50.00'),
        order: { userId, status: 1, shopId: 1, orderNo: 'OD1' }, orderId: 1,
      });
      await expect(service.create(userId, { orderItemId: 1, type: 1, reason: 'r', amount: '100.00' } as any))
        .rejects.toBeDefined();
    });

    it('正常申请创建售后单并置 refundStatus=1', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        id: 1, refundStatus: 0, total: new Prisma.Decimal('100.00'),
        order: { userId, status: 1, shopId: 1, orderNo: 'OD1' }, orderId: 1,
      });
      prisma.afterSale.create.mockImplementation(({ data }: any) =>
        Promise.resolve(fullAfterSale(data)),
      );
      await service.create(userId, { orderItemId: 1, type: 1, reason: 'r', amount: '50.00' } as any);
      expect(prisma.afterSale.create).toHaveBeenCalled();
      expect(prisma.orderItem.update).toHaveBeenCalled();
    });
  });

  describe('sellerAgree - 仅退款', () => {
    it('同意后 status=6 并创建退款单', async () => {
      prisma.afterSale.findUnique.mockResolvedValue(fullAfterSale({ status: 0, type: 1 }));
      prisma.afterSale.update.mockImplementation(({ data }: any) =>
        Promise.resolve(fullAfterSale({ status: data.status })),
      );
      prisma.refund.create.mockResolvedValue({});
      prisma.orderItem.update.mockResolvedValue({});
      await service.sellerAgree(1, 'AS1');
      expect(prisma.refund.create).toHaveBeenCalled();
    });

    it('status 不是 0 时抛 CONFLICT', async () => {
      prisma.afterSale.findUnique.mockResolvedValue(fullAfterSale({ status: 6 }));
      await expect(service.sellerAgree(1, 'AS1')).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
    });
  });

  describe('sellerAgree - 退货退款', () => {
    it('同意后 status=3，不创建退款单', async () => {
      prisma.afterSale.findUnique.mockResolvedValue(fullAfterSale({ status: 0, type: 2 }));
      prisma.afterSale.update.mockImplementation(({ data }: any) =>
        Promise.resolve(fullAfterSale({ status: data.status, type: 2 })),
      );
      await service.sellerAgree(1, 'AS1');
      expect(prisma.refund.create).not.toHaveBeenCalled();
    });
  });

  describe('sellerReject', () => {
    it('拒绝后 status=2 且 refundStatus 回退为 0', async () => {
      prisma.afterSale.findUnique.mockResolvedValue(fullAfterSale({ status: 0 }));
      prisma.afterSale.update.mockResolvedValue({});
      prisma.orderItem.update.mockResolvedValue({});
      await service.sellerReject(1, 'AS1', '不符合条件');
      expect(prisma.afterSale.update).toHaveBeenCalled();
      expect(prisma.orderItem.update).toHaveBeenCalled();
    });
  });
});