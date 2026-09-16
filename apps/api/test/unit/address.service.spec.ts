import { Test } from '@nestjs/testing';
import { ErrorCode } from '../../src/common/constants/error-codes';
import { AddressesService } from '../../src/modules/addresses/addresses.service';
import { CreateAddressDto } from '../../src/modules/addresses/dto/create-address.dto';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AddressesService (unit)', () => {
  const userId = 1;

  const addressRecord = {
    id: 1,
    userId,
    receiver: '张三',
    phone: '13800138000',
    province: '浙江省',
    city: '杭州市',
    district: '西湖区',
    detail: '文一西路 100 号',
    isDefault: false,
    tag: '家',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const txMock = {
    userAddress: {
      updateMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const prismaMock = {
    userAddress: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: typeof txMock) => unknown) => fn(txMock)),
  };

  let service: AddressesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [AddressesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = moduleRef.get(AddressesService);
  });

  describe('list', () => {
    it('返回当前用户地址列表', async () => {
      prismaMock.userAddress.findMany.mockResolvedValue([addressRecord]);

      const result = await service.list(userId);

      expect(result).toHaveLength(1);
      expect(prismaMock.userAddress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId, deletedAt: null } }),
      );
    });
  });

  describe('create', () => {
    const dto: CreateAddressDto = {
      receiver: '张三',
      phone: '13800138000',
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      detail: '文一西路 100 号',
    };

    it('超过20条时抛错', async () => {
      prismaMock.userAddress.count.mockResolvedValue(20);

      await expect(service.create(userId, dto)).rejects.toMatchObject({
        code: ErrorCode.BUSINESS_ERROR,
        message: '地址数量已达上限（20条）',
      });
    });

    it('创建普通地址不取消其他默认', async () => {
      prismaMock.userAddress.count.mockResolvedValue(0);
      txMock.userAddress.create.mockResolvedValue({ ...addressRecord });

      const result = await service.create(userId, dto);

      expect(result.id).toBe(1);
      expect(txMock.userAddress.updateMany).not.toHaveBeenCalled();
    });

    it('创建默认地址时取消其他默认', async () => {
      prismaMock.userAddress.count.mockResolvedValue(0);
      txMock.userAddress.create.mockResolvedValue({ ...addressRecord, isDefault: true });

      await service.create(userId, { ...dto, isDefault: true });

      expect(txMock.userAddress.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId, deletedAt: null }, data: { isDefault: false } }),
      );
    });
  });

  describe('update', () => {
    it('地址不存在抛错', async () => {
      prismaMock.userAddress.findFirst.mockResolvedValue(null);

      await expect(service.update(userId, 999, { receiver: '李四' })).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
      });
    });

    it('更新为默认时取消其他默认', async () => {
      prismaMock.userAddress.findFirst.mockResolvedValue(addressRecord);
      txMock.userAddress.update.mockResolvedValue({ ...addressRecord, isDefault: true });

      await service.update(userId, 1, { isDefault: true });

      expect(txMock.userAddress.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId, deletedAt: null, id: { not: 1 } }, data: { isDefault: false } }),
      );
    });
  });

  describe('remove', () => {
    it('软删除地址', async () => {
      prismaMock.userAddress.findFirst.mockResolvedValue(addressRecord);
      prismaMock.userAddress.update.mockResolvedValue({ ...addressRecord, deletedAt: new Date() });

      await service.remove(userId, 1);

      expect(prismaMock.userAddress.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { deletedAt: expect.any(Date) } }),
      );
    });
  });

  describe('setDefault', () => {
    it('设为默认并取消其他', async () => {
      prismaMock.userAddress.findFirst.mockResolvedValue(addressRecord);
      txMock.userAddress.update.mockResolvedValue({ ...addressRecord, isDefault: true });

      await service.setDefault(userId, 1);

      expect(txMock.userAddress.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId, deletedAt: null, id: { not: 1 } }, data: { isDefault: false } }),
      );
      expect(txMock.userAddress.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { isDefault: true } }),
      );
    });
  });
});
