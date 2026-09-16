import { HttpStatus, Injectable } from '@nestjs/common';
import type { UserAddress } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { pickDefined } from '../../common/utils/pick-defined.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  private readonly MAX_ADDRESSES = 20;

  constructor(private readonly prisma: PrismaService) {}

  async list(userId: number): Promise<UserAddress[]> {
    return this.prisma.userAddress.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });
  }

  async create(userId: number, dto: CreateAddressDto): Promise<UserAddress> {
    const count = await this.prisma.userAddress.count({ where: { userId, deletedAt: null } });
    if (count >= this.MAX_ADDRESSES) {
      throw new AppException(ErrorCode.BUSINESS_ERROR, '地址数量已达上限（20条）', HttpStatus.BAD_REQUEST);
    }

    const isDefault = dto.isDefault ?? false;
    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.userAddress.updateMany({
          where: { userId, deletedAt: null },
          data: { isDefault: false },
        });
      }
      return tx.userAddress.create({
        data: {
          userId,
          receiver: dto.receiver,
          phone: dto.phone,
          province: dto.province,
          city: dto.city,
          district: dto.district,
          detail: dto.detail,
          isDefault,
          tag: dto.tag,
        },
      });
    });
  }

  async update(userId: number, id: number, dto: UpdateAddressDto): Promise<UserAddress> {
    await this.ensureOwned(userId, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.userAddress.updateMany({
          where: { userId, deletedAt: null, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return tx.userAddress.update({ where: { id }, data: pickDefined(dto) });
    });
  }

  async remove(userId: number, id: number): Promise<void> {
    await this.ensureOwned(userId, id);
    await this.prisma.userAddress.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async setDefault(userId: number, id: number): Promise<UserAddress> {
    await this.ensureOwned(userId, id);
    return this.prisma.$transaction(async (tx) => {
      await tx.userAddress.updateMany({
        where: { userId, deletedAt: null, id: { not: id } },
        data: { isDefault: false },
      });
      return tx.userAddress.update({ where: { id }, data: { isDefault: true } });
    });
  }

  private async ensureOwned(userId: number, id: number): Promise<void> {
    const existing = await this.prisma.userAddress.findFirst({ where: { id, userId, deletedAt: null } });
    if (!existing) {
      throw new AppException(ErrorCode.NOT_FOUND, '地址不存在', HttpStatus.NOT_FOUND);
    }
  }
}
