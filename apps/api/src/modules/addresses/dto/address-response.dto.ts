import { ApiProperty } from '@nestjs/swagger';
import type { UserAddress } from '@prisma/client';

export class AddressResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '张三' })
  receiver!: string;

  @ApiProperty({ example: '13800138000' })
  phone!: string;

  @ApiProperty({ example: '浙江省' })
  province!: string;

  @ApiProperty({ example: '杭州市' })
  city!: string;

  @ApiProperty({ example: '西湖区' })
  district!: string;

  @ApiProperty({ example: '文一西路 100 号' })
  detail!: string;

  @ApiProperty({ example: false })
  isDefault!: boolean;

  @ApiProperty({ example: '家', nullable: true })
  tag!: string | null;

  @ApiProperty({ example: '2026-09-17T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-17T00:00:00.000Z' })
  updatedAt!: Date;
}

export function toAddressResponse(address: UserAddress): AddressResponseDto {
  return {
    id: address.id,
    receiver: address.receiver,
    phone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    detail: address.detail,
    isDefault: address.isDefault,
    tag: address.tag,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}
