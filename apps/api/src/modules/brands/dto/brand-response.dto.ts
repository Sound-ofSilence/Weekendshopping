import { ApiProperty } from '@nestjs/swagger';
import type { Brand } from '@prisma/client';

export class BrandResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '小米' })
  name!: string;

  @ApiProperty({ example: 'https://cdn.example.com/logo.png', nullable: true })
  logo!: string | null;

  @ApiProperty({ example: 1, description: '1启用/0禁用' })
  status!: number;

  @ApiProperty({ example: '2026-09-17T00:00:00.000Z' })
  createdAt!: Date;
}

export function toBrandResponse(brand: Brand): BrandResponseDto {
  return {
    id: brand.id,
    name: brand.name,
    logo: brand.logo,
    status: brand.status,
    createdAt: brand.createdAt,
  };
}