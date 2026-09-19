import { Test } from '@nestjs/testing';
import type { Shipment } from '@prisma/client';
import { ErrorCode } from '../../src/common/constants/error-codes';
import type {
  ShipOrderDto,
  ShipOrderItemDto,
} from '../../src/modules/logistics/dto/ship-order.dto';
import { ShipmentService } from '../../src/modules/logistics/shipment.service';
import { NotificationService } from '../../src/modules/notifications/notification.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('ShipmentService (unit)', () => {
  const makeShipment = (overrides: Partial<Shipment> = {}): Shipment => ({
    id: 1,
    orderId: 1,
    orderNo: 'ORDER-1',
    shopId: 1,
    expressCompany: '顺丰速运',
    expressCode: 'SF',
    trackingNo: 'SF1234567890',
    status: 1,
    shippedAt: new Date(),
    receivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const makeOrder = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    orderNo: 'ORDER-1',
    shopId: 1,
    userId: 10,
    status: 1,
    ...overrides,
  });

  const txMock = {
    order: { findFirst: jest.fn(), update: jest.fn() },
    shipment: { create: jest.fn() },
    logisticsTrace: { createMany: jest.fn() },
  };

  const prismaMock = {
    shipment: { findFirst: jest.fn() },
    order: { findUnique: jest.fn() },
    $transaction: jest.fn(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg as Promise<unknown>[]);
      }
      return (arg as (tx: typeof txMock) => unknown)(txMock);
    }),
  };

  let service: ShipmentService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ShipmentService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: NotificationService,
          useValue: { create: jest.fn().mockResolvedValue({ id: 1 }) },
        },
      ],
    }).compile();
    service = moduleRef.get(ShipmentService);
  });

  describe('ship 发货', () => {
    it('订单状态为 PAID(1) 时成功发货，创建 Shipment 并更新 Order', async () => {
      txMock.order.findFirst.mockResolvedValue(makeOrder());
      txMock.shipment.create.mockResolvedValue(makeShipment());
      txMock.logisticsTrace.createMany.mockResolvedValue({ count: 2 });
      txMock.order.update.mockResolvedValue(makeOrder({ status: 2, shipStatus: 1 }));

      const dto = {
        expressCode: 'SF',
        expressCompany: '顺丰速运',
        trackingNo: 'SF1234567890',
      } as ShipOrderDto;

      const result = await service.ship('1', 'ORDER-1', dto);

      expect(result).toMatchObject({
        orderNo: 'ORDER-1',
        status: 1,
        trackingNo: 'SF1234567890',
      });
      expect(txMock.shipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orderId: 1, orderNo: 'ORDER-1', status: 1 }),
        }),
      );
      expect(txMock.logisticsTrace.createMany).toHaveBeenCalledTimes(1);
      expect(txMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ status: 2, shipStatus: 1 }),
        }),
      );
    });

    it('订单状态不为 PAID 时抛异常', async () => {
      txMock.order.findFirst.mockResolvedValue(makeOrder({ status: 2 }));

      await expect(
        service.ship('1', 'ORDER-1', {
          expressCode: 'SF',
          expressCompany: '顺丰速运',
          trackingNo: 'T1',
        } as ShipOrderDto),
      ).rejects.toMatchObject({
        code: ErrorCode.CONFLICT,
        message: '仅已付款订单可发货',
      });
    });

    it('订单不属于当前商家时抛异常', async () => {
      txMock.order.findFirst.mockResolvedValue(null);

      await expect(
        service.ship('1', 'ORDER-1', {
          expressCode: 'SF',
          expressCompany: '顺丰速运',
          trackingNo: 'T1',
        } as ShipOrderDto),
      ).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
        message: '订单不存在',
      });
    });
  });

  describe('batchShip 批量发货', () => {
    it('部分成功部分失败，返回 { success, failed }', async () => {
      txMock.order.findFirst.mockImplementation((args: { where: { orderNo: string } }) => {
        if (args.where.orderNo === 'ORDER-2') {
          return Promise.resolve(null);
        }
        return Promise.resolve(makeOrder({ orderNo: args.where.orderNo }));
      });
      txMock.shipment.create.mockResolvedValue(makeShipment());
      txMock.logisticsTrace.createMany.mockResolvedValue({ count: 2 });
      txMock.order.update.mockResolvedValue(makeOrder({ status: 2 }));

      const items = [
        { orderNo: 'ORDER-1', expressCode: 'SF', expressCompany: '顺丰速运', trackingNo: 'T1' },
        { orderNo: 'ORDER-2', expressCode: 'SF', expressCompany: '顺丰速运', trackingNo: 'T2' },
      ] as ShipOrderItemDto[];

      const result = await service.batchShip('1', items);

      expect(result.success).toBe(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toMatchObject({ orderNo: 'ORDER-2', reason: '订单不存在' });
    });

    it('全部成功返回 success=N、failed=[]', async () => {
      txMock.order.findFirst.mockImplementation((args: { where: { orderNo: string } }) =>
        Promise.resolve(makeOrder({ orderNo: args.where.orderNo })),
      );
      txMock.shipment.create.mockResolvedValue(makeShipment());
      txMock.logisticsTrace.createMany.mockResolvedValue({ count: 2 });
      txMock.order.update.mockResolvedValue(makeOrder({ status: 2 }));

      const items = [
        { orderNo: 'ORDER-1', expressCode: 'SF', expressCompany: '顺丰速运', trackingNo: 'T1' },
        { orderNo: 'ORDER-3', expressCode: 'SF', expressCompany: '顺丰速运', trackingNo: 'T3' },
      ] as ShipOrderItemDto[];

      const result = await service.batchShip('1', items);

      expect(result.success).toBe(2);
      expect(result.failed).toEqual([]);
    });
  });

  describe('query 查询物流', () => {
    it('返回 Shipment + 2 条轨迹', async () => {
      const traces = [
        {
          id: 1,
          shipmentId: 1,
          traceTime: new Date('2024-01-01T00:00:00Z'),
          description: '快递已揽收',
          status: 0,
          createdAt: new Date(),
        },
        {
          id: 2,
          shipmentId: 1,
          traceTime: new Date('2024-01-02T00:00:00Z'),
          description: '快件运输中',
          status: 1,
          createdAt: new Date(),
        },
      ];
      prismaMock.shipment.findFirst.mockResolvedValue({ ...makeShipment(), traces });
      prismaMock.order.findUnique.mockResolvedValue(makeOrder());

      const result = await service.query('10', 'ORDER-1');

      expect(result).toMatchObject({ orderNo: 'ORDER-1', status: 1 });
      const resultTraces = result.traces as Array<Record<string, unknown>>;
      expect(resultTraces).toHaveLength(2);
      expect(resultTraces[0]).toMatchObject({ description: '快递已揽收', status: 0 });
      expect(resultTraces[1]).toMatchObject({ description: '快件运输中', status: 1 });
    });

    it('非订单所属用户或商家查询抛异常', async () => {
      prismaMock.shipment.findFirst.mockResolvedValue({ ...makeShipment(), traces: [] });
      prismaMock.order.findUnique.mockResolvedValue(makeOrder());

      await expect(service.query('999', 'ORDER-1')).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
        message: '订单不存在',
      });
    });
  });
});
