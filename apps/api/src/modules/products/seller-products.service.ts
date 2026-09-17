import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Spu } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';
import { PaginatedResponseDto, toPaginated } from '../../common/dto/paginated-response.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditStatus, DEFAULT_SHOP_ID, ProductStatus } from './constants/product-status.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { SkuInputDto, SpecInputDto } from './dto/product-input.dto';
import {
  ProductDetailResponseDto,
  ProductListItemResponseDto,
  toProductDetailResponse,
  toProductListItem,
} from './dto/product-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const SPU_INCLUDE = {
  skus: { orderBy: { id: 'asc' } },
  specs: { orderBy: [{ sort: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.SpuInclude;

@Injectable()
export class SellerProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProductQueryDto): Promise<PaginatedResponseDto<ProductListItemResponseDto>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const keyword = query.keyword?.trim();

    const where: Prisma.SpuWhereInput = {
      shopId: DEFAULT_SHOP_ID,
      deletedAt: null,
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.auditStatus !== undefined ? { auditStatus: query.auditStatus } : {}),
      ...(query.categoryId !== undefined ? { categoryId: query.categoryId } : {}),
      ...(keyword ? { title: { contains: keyword } } : {}),
    };

    const [total, spus] = await this.prisma.$transaction([
      this.prisma.spu.count({ where }),
      this.prisma.spu.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return toPaginated(spus.map(toProductListItem), total, page, pageSize);
  }

  async create(dto: CreateProductDto): Promise<ProductDetailResponseDto> {
    await this.ensureLeafCategory(dto.categoryId);
    this.validateSkuPrices(dto.skus);

    const spu = await this.prisma.$transaction(async (tx) => {
      const created = await tx.spu.create({
        data: {
          shopId: DEFAULT_SHOP_ID,
          categoryId: dto.categoryId,
          brandId: dto.brandId ?? null,
          title: dto.title,
          subtitle: dto.subtitle ?? null,
          mainImg: dto.mainImg,
          imagesJson: dto.images,
          detailHtml: dto.detailHtml,
          status: ProductStatus.DRAFT,
          auditStatus: AuditStatus.PENDING,
        },
      });

      const specs = dto.specs ?? [];
      for (const [index, spec] of specs.entries()) {
        await tx.spuSpec.create({
          data: { spuId: created.id, name: spec.name, valuesJson: spec.values, sort: index },
        });
      }

      for (const sku of dto.skus) {
        await tx.sku.create({ data: this.buildSkuData(created.id, sku) });
      }

      return tx.spu.findUniqueOrThrow({ where: { id: created.id }, include: SPU_INCLUDE });
    });

    return toProductDetailResponse(spu);
  }

  async update(id: number, dto: UpdateProductDto): Promise<ProductDetailResponseDto> {
    const existing = await this.ensureOwned(id);
    this.ensureEditable(existing.status);
    if (dto.categoryId !== undefined) {
      await this.ensureLeafCategory(dto.categoryId);
    }
    if (dto.skus) {
      this.validateSkuPrices(dto.skus);
    }

    const spu = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.SpuUncheckedUpdateInput = {};
      if (dto.title !== undefined) data.title = dto.title;
      if (dto.subtitle !== undefined) data.subtitle = dto.subtitle;
      if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
      if (dto.brandId !== undefined) data.brandId = dto.brandId;
      if (dto.mainImg !== undefined) data.mainImg = dto.mainImg;
      if (dto.images !== undefined) data.imagesJson = dto.images;
      if (dto.detailHtml !== undefined) data.detailHtml = dto.detailHtml;

      await tx.spu.update({ where: { id }, data });

      if (dto.specs !== undefined) {
        await tx.spuSpec.deleteMany({ where: { spuId: id } });
        for (const [index, spec] of dto.specs.entries()) {
          await tx.spuSpec.create({
            data: { spuId: id, name: spec.name, valuesJson: spec.values, sort: index },
          });
        }
      }

      if (dto.skus !== undefined) {
        await tx.sku.deleteMany({ where: { spuId: id } });
        for (const sku of dto.skus) {
          await tx.sku.create({ data: this.buildSkuData(id, sku) });
        }
      }

      return tx.spu.findUniqueOrThrow({ where: { id }, include: SPU_INCLUDE });
    });

    return toProductDetailResponse(spu);
  }

  async submit(id: number): Promise<void> {
    const spu = await this.ensureOwned(id);
    if (spu.status !== ProductStatus.DRAFT && spu.status !== ProductStatus.REJECTED) {
      throw new AppException(ErrorCode.BUSINESS_ERROR, '仅草稿或已驳回状态可提交审核', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.spu.update({
      where: { id },
      data: {
        status: ProductStatus.PENDING_AUDIT,
        // 一期无管理员审核，提交后直接置为「通过」
        auditStatus: AuditStatus.APPROVED,
        auditReason: null,
      },
    });
  }

  async onSale(id: number): Promise<void> {
    const spu = await this.ensureOwned(id);
    if (spu.status !== ProductStatus.PENDING_AUDIT) {
      throw new AppException(ErrorCode.BUSINESS_ERROR, '仅待审核状态可上架', HttpStatus.BAD_REQUEST);
    }
    if (spu.auditStatus !== AuditStatus.APPROVED) {
      throw new AppException(ErrorCode.BUSINESS_ERROR, '商品尚未通过审核', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.spu.update({ where: { id }, data: { status: ProductStatus.ON_SALE } });
  }

  async offSale(id: number): Promise<void> {
    const spu = await this.ensureOwned(id);
    if (spu.status !== ProductStatus.ON_SALE) {
      throw new AppException(ErrorCode.BUSINESS_ERROR, '仅上架状态可下架', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.spu.update({ where: { id }, data: { status: ProductStatus.OFF_SALE } });
  }

  async remove(id: number): Promise<void> {
    await this.ensureOwned(id);
    await this.prisma.spu.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async batchOnSale(ids: number[]): Promise<void> {
    await this.prisma.spu.updateMany({
      where: {
        id: { in: ids },
        shopId: DEFAULT_SHOP_ID,
        deletedAt: null,
        status: ProductStatus.PENDING_AUDIT,
        auditStatus: AuditStatus.APPROVED,
      },
      data: { status: ProductStatus.ON_SALE },
    });
  }

  async batchOffSale(ids: number[]): Promise<void> {
    await this.prisma.spu.updateMany({
      where: { id: { in: ids }, shopId: DEFAULT_SHOP_ID, deletedAt: null, status: ProductStatus.ON_SALE },
      data: { status: ProductStatus.OFF_SALE },
    });
  }

  /** 根据规格组生成笛卡尔积 SKU 的 spec 映射列表。 */
  generateSkus(specs: SpecInputDto[]): Record<string, string>[] {
    if (!specs || specs.length === 0) {
      return [{}];
    }
    const names = specs.map((spec) => spec.name);
    const valueLists = specs.map((spec) => spec.values);
    return this.cartesian(valueLists).map((combo) => {
      const spec: Record<string, string> = {};
      names.forEach((name, index) => {
        spec[name] = combo[index];
      });
      return spec;
    });
  }

  private cartesian<T>(lists: T[][]): T[][] {
    return lists.reduce<T[][]>(
      (acc, list) => acc.flatMap((prefix) => list.map((value) => [...prefix, value])),
      [[]],
    );
  }

  private buildSkuData(spuId: number, sku: SkuInputDto): Prisma.SkuUncheckedCreateInput {
    return {
      spuId,
      specJson: sku.spec,
      skuCode: sku.skuCode ?? null,
      price: new Prisma.Decimal(sku.price),
      marketPrice: sku.marketPrice !== undefined ? new Prisma.Decimal(sku.marketPrice) : null,
      costPrice: sku.costPrice !== undefined ? new Prisma.Decimal(sku.costPrice) : null,
      stock: sku.stock,
      image: sku.image ?? null,
      weight: sku.weight !== undefined ? new Prisma.Decimal(sku.weight) : null,
      volume: sku.volume !== undefined ? new Prisma.Decimal(sku.volume) : null,
    };
  }

  private async ensureLeafCategory(categoryId: number): Promise<void> {
    const category = await this.prisma.category.findFirst({ where: { id: categoryId, deletedAt: null } });
    if (!category) {
      throw new AppException(ErrorCode.NOT_FOUND, '类目不存在', HttpStatus.NOT_FOUND);
    }
    if (category.status !== 1) {
      throw new AppException(ErrorCode.BUSINESS_ERROR, '类目已禁用', HttpStatus.BAD_REQUEST);
    }
    if (!category.isLeaf) {
      throw new AppException(ErrorCode.BUSINESS_ERROR, '必须选择叶子类目', HttpStatus.BAD_REQUEST);
    }
  }

  private validateSkuPrices(skus: SkuInputDto[]): void {
    for (const sku of skus) {
      const price = Number(sku.price);
      if (!Number.isFinite(price) || price <= 0) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, 'SKU 价格必须大于 0', HttpStatus.BAD_REQUEST);
      }
    }
  }

  private ensureEditable(status: number): void {
    if (status !== ProductStatus.DRAFT && status !== ProductStatus.REJECTED) {
      throw new AppException(ErrorCode.BUSINESS_ERROR, '仅草稿或已驳回状态可编辑', HttpStatus.BAD_REQUEST);
    }
  }

  private async ensureOwned(id: number): Promise<Spu> {
    const spu = await this.prisma.spu.findFirst({
      where: { id, shopId: DEFAULT_SHOP_ID, deletedAt: null },
    });
    if (!spu) {
      throw new AppException(ErrorCode.NOT_FOUND, '商品不存在', HttpStatus.NOT_FOUND);
    }
    return spu;
  }
}