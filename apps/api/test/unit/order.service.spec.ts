import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../src/common/constants/error-codes';
import type { CreateOrderDto } from '../../src/modules/orders/dto/create-order.dto';
import { OrderStatus } from '../../src/modules/orders/order-status.constant';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';

describe('OrdersService (unit)', () => {
  const address = {
    id: 1,
    userId: 1,
    receiver: '张三',
    phone: '13800138000',
    province: '广东省',
    city: '深圳市',
    district: '南山区',
    detail: '科技园',
  };

  const makeSku = (id: number, spuId: number, price: string) => ({
    id,
    spuId,
    status: 1,
    stock: 100,
    lockedStock: 0,
    price: new Prisma.Decimal(price),
    specJson: {} as Prisma.JsonValue,
    image: null,
  });

  const makeSpu = (id: number, shopId: number) => ({
    id,
    shopId,
    status: 1,
    title: `商品${id}`,
  });

  const makeOrder = (id: number, shopId: number, totalAmount: string) => ({
    id,
    orderNo: `20240101120000${String(id).padStart(6, '0')}`,
    shopId,
    totalAmount: new Prisma.Decimal(totalAmount),
    payAmount: new Prisma.Decimal(totalAmount),
    freightAmount: new Prisma.Decimal('0.00'),
    discountAmount: new Prisma.Decimal('0.00'),
    status: OrderStatus.PENDING_PAY,
    payStatus: 0,
    shipStatus: 0,
    receiverJson: {} as Prisma.JsonValue,
    buyerRemark: null,
    channel: 0,
    createdAt: new Date(),
  });

  const txMock = {
    userAddress: { findFirst: jest.fn() },
    cart: { findFirst: jest.fn(), deleteMany: jest.fn() },
    sku: { findUnique: jest.fn() },
    spu: { findUnique: jest.fn() },
    order: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    orderItem: { createMany: jest.fn(), findMany: jest.fn() },
    $executeRaw: jest.fn(),
  };

  const prismaMock = {
    userAddress: { findFirst: jest.fn() },
    sku: { findUnique: jest.fn() },
    spu: { findUnique: jest.fn() },
    order: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg as Promise<unknown>[]);
      }
      return (arg as (tx: typeof txMock) => unknown)(txMock);
    }),
  };

  const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  let service: OrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();
    service = moduleRef.get(OrdersService);
  });

  describe('preview 价格计算', () => {
    it('计算总价并按店铺分组，金额保留两位小数', async () => {
      const skus = [makeSku(1, 1, '100.00'), makeSku(2, 2, '50.00')];
      const spus = [makeSpu(1, 10), makeSpu(2, 20)];

      prismaMock.userAddress.findFirst.mockResolvedValue(address);
      prismaMock.sku.findUnique.mockImplementation((args: { where: { id: number } }) =>
        skus.find((s) => s.id === args.where.id),
      );
      prismaMock.spu.findUnique.mockImplementation((args: { where: { id: number } }) =>
        spus.find((s) => s.id === args.where.id),
      );

      const dto: CreateOrderDto = {
        addressId: 1,
        items: [
          { skuId: 1, quantity: 2 },
          { skuId: 2, quantity: 3 },
        ],
      };

      const result: any = await service.preview('1', dto);

      expect(result.totalAmount).toBe('350.00');
      expect(result.freightAmount).toBe('0.00');
      expect(result.discountAmount).toBe('0.00');
      expect(result.payAmount).toBe('350.00');
      expect(result.shopGroups).toHaveLength(2);
      expect(result.shopGroups[0]).toMatchObject({ shopId: 10, amount: '200.00' });
      expect(result.shopGroups[1]).toMatchObject({ shopId: 20, amount: '150.00' });
    });
  });

  describe('createOrder 拆单', () => {
    it('多店铺拆成多订单', async () => {
      const skus = [makeSku(1, 1, '100.00'), makeSku(2, 2, '50.00')];
      const spus = [makeSpu(1, 10), makeSpu(2, 20)];
      const orders = [makeOrder(1, 10, '200.00'), makeOrder(2, 20, '150.00')];

      txMock.userAddress.findFirst.mockResolvedValue(address);
      txMock.sku.findUnique.mockImplementation((args: { where: { id: number } }) =>
        skus.find((s) => s.id === args.where.id),
      );
      txMock.spu.findUnique.mockImplementation((args: { where: { id: number } }) =>
        spus.find((s) => s.id === args.where.id),
      );

      let seq = 0;
      txMock.order.create.mockImplementation(() => Promise.resolve(orders[seq++]));
      txMock.orderItem.createMany.mockResolvedValue({ count: 1 });
      txMock.$executeRaw.mockResolvedValue(1);
      txMock.cart.deleteMany.mockResolvedValue({ count: 0 });
      redisMock.set.mockResolvedValue('OK');

      const dto: CreateOrderDto = {
        addressId: 1,
        items: [
          { skuId: 1, quantity: 2 },
          { skuId: 2, quantity: 3 },
        ],
      };

      const result = await service.createOrder('1', dto, 'req-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ shopId: 10, totalAmount: '200.00' });
      expect(result[1]).toMatchObject({ shopId: 20, totalAmount: '150.00' });
      expect(txMock.order.create).toHaveBeenCalledTimes(2);
      expect(redisMock.set).toHaveBeenCalledWith(
        'order:idempotent:1:req-123',
        expect.any(String),
        300,
      );
    });
  });

  describe('createOrder 库存不足', () => {
    it('乐观锁影响行数为 0 时抛库存不足', async () => {
      txMock.userAddress.findFirst.mockResolvedValue(address);
      txMock.sku.findUnique.mockResolvedValue(makeSku(1, 1, '100.00'));
      txMock.spu.findUnique.mockResolvedValue(makeSpu(1, 10));
      txMock.order.create.mockResolvedValue(makeOrder(1, 10, '200.00'));
      txMock.orderItem.createMany.mockResolvedValue({ count: 1 });
      txMock.$executeRaw.mockResolvedValue(0);
      txMock.cart.deleteMany.mockResolvedValue({ count: 0 });

      const dto: CreateOrderDto = {
        addressId: 1,
        items: [{ skuId: 1, quantity: 2 }],
      };

      await expect(service.createOrder('1', dto, 'req-1')).rejects.toMatchObject({
        code: ErrorCode.CONFLICT,
        message: '库存不足',
      });
    });
  });

  describe('createOrder 幂等', () => {
    it('同 requestId 命中缓存直接返回', async () => {
      const cached = [{ orderNo: 'cached-order', shopId: 10, totalAmount: '200.00' }];
      redisMock.get.mockResolvedValue(JSON.stringify(cached));

      const dto: CreateOrderDto = {
        addressId: 1,
        items: [{ skuId: 1, quantity: 2 }],
      };

      const result = await service.createOrder('1', dto, 'req-same');

      expect(result).toEqual(cached);
      expect(redisMock.get).toHaveBeenCalledWith('order:idempotent:1:req-same');
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('cancel 释放库存', () => {
    it('取消待付款订单并释放锁定库存', async () => {
      const order = makeOrder(1, 10, '200.00');
      prismaMock.order.findFirst.mockResolvedValue(order);
      txMock.order.findFirst.mockResolvedValue(order);
      txMock.order.update.mockResolvedValue({ ...order, status: OrderStatus.CANCELLED });
      txMock.orderItem.findMany.mockResolvedValue([{ skuId: 1, quantity: 2 }]);
      txMock.$executeRaw.mockResolvedValue(1);

      await expect(service.cancel('1', order.orderNo)).resolves.toBeNull();

      expect(txMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: OrderStatus.CANCELLED }),
        }),
      );
      expect(txMock.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });
});
