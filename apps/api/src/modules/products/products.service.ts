import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ProductDetailResponseDto,
  SkuResponseDto,
  SpuWithRelations,
  toProductDetailResponse,
  toSkuResponse,
} from './dto/product-response.dto';

const SPU_INCLUDE = {
  skus: { orderBy: { id: 'asc' } },
  specs: { orderBy: [{ sort: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.SpuInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async detail(spuId: number): Promise<ProductDetailResponseDto> {
    const spu = await this.findPublicSpu(spuId);
    return toProductDetailResponse(spu);
  }

  async skus(spuId: number): Promise<SkuResponseDto[]> {
    const spu = await this.findPublicSpu(spuId);
    return spu.skus.map(toSkuResponse);
  }

  private async findPublicSpu(spuId: number): Promise<SpuWithRelations> {
    const spu = await this.prisma.spu.findFirst({
      where: { id: spuId, deletedAt: null },
      include: SPU_INCLUDE,
    });
    if (!spu) {
      throw new AppException(ErrorCode.NOT_FOUND, '商品不存在', HttpStatus.NOT_FOUND);
    }
    return spu;
  }
}