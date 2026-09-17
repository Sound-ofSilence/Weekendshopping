import { Injectable } from '@nestjs/common';
import { PaginatedResponseDto, toPaginated } from '../../common/dto/paginated-response.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { BrandQueryDto } from './dto/brand-query.dto';
import { BrandResponseDto, toBrandResponse } from './dto/brand-response.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: BrandQueryDto): Promise<PaginatedResponseDto<BrandResponseDto>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const keyword = query.name?.trim();

    const where = {
      status: 1,
      deletedAt: null,
      ...(keyword ? { name: { contains: keyword } } : {}),
    };

    const [total, brands] = await this.prisma.$transaction([
      this.prisma.brand.count({ where }),
      this.prisma.brand.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return toPaginated(brands.map(toBrandResponse), total, page, pageSize);
  }
}