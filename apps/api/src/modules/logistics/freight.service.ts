import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { FreightTemplate } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateFreightTemplateDto,
  UpdateFreightTemplateDto,
} from './dto/freight-template.dto';

@Injectable()
export class FreightService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<Record<string, unknown>[]> {
    const uid = Number(userId);
    const templates = await this.prisma.freightTemplate.findMany({
      where: { shopId: uid },
      orderBy: { createdAt: 'desc' },
    });
    return templates.map((t) => this.serialize(t));
  }

  async create(
    userId: string,
    dto: CreateFreightTemplateDto,
  ): Promise<Record<string, unknown>> {
    const uid = Number(userId);
    const template = await this.prisma.freightTemplate.create({
      data: {
        shopId: uid,
        name: dto.name,
        chargeType: dto.chargeType ?? 1,
        firstCount: dto.firstCount,
        firstFee: new Prisma.Decimal(dto.firstFee),
        extraCount: dto.extraCount,
        extraFee: new Prisma.Decimal(dto.extraFee),
        freeRegions: (dto.freeRegions ?? []) as Prisma.InputJsonValue,
        excludedRegions: (dto.excludedRegions ?? []) as Prisma.InputJsonValue,
        status: dto.status ?? 1,
      },
    });
    return this.serialize(template);
  }

  async update(
    userId: string,
    id: number,
    dto: UpdateFreightTemplateDto,
  ): Promise<Record<string, unknown>> {
    const uid = Number(userId);
    const existing = await this.prisma.freightTemplate.findFirst({
      where: { id, shopId: uid },
    });
    if (!existing) {
      throw new AppException(ErrorCode.NOT_FOUND, '运费模板不存在');
    }

    const data: Prisma.FreightTemplateUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.chargeType !== undefined) data.chargeType = dto.chargeType;
    if (dto.firstCount !== undefined) data.firstCount = dto.firstCount;
    if (dto.firstFee !== undefined) data.firstFee = new Prisma.Decimal(dto.firstFee);
    if (dto.extraCount !== undefined) data.extraCount = dto.extraCount;
    if (dto.extraFee !== undefined) data.extraFee = new Prisma.Decimal(dto.extraFee);
    if (dto.freeRegions !== undefined) {
      data.freeRegions = dto.freeRegions as Prisma.InputJsonValue;
    }
    if (dto.excludedRegions !== undefined) {
      data.excludedRegions = dto.excludedRegions as Prisma.InputJsonValue;
    }
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.prisma.freightTemplate.update({
      where: { id: existing.id },
      data,
    });
    return this.serialize(updated);
  }

  async remove(userId: string, id: number): Promise<null> {
    const uid = Number(userId);
    const existing = await this.prisma.freightTemplate.findFirst({
      where: { id, shopId: uid },
    });
    if (!existing) {
      throw new AppException(ErrorCode.NOT_FOUND, '运费模板不存在');
    }
    await this.prisma.freightTemplate.delete({ where: { id: existing.id } });
    return null;
  }

  /** 运费计算：首件 firstFee + ceil((count - firstCount) / extraCount) * extraFee */
  calcFreight(template: FreightTemplate, count: number, region?: string): Prisma.Decimal {
    const free = this.stringArray(template.freeRegions);
    const excluded = this.stringArray(template.excludedRegions);

    if (region && excluded.includes(region)) {
      throw new AppException(ErrorCode.BUSINESS_ERROR, '该地区暂不支持配送');
    }
    if (region && free.includes(region)) {
      return new Prisma.Decimal(0);
    }
    if (count <= template.firstCount) {
      return template.firstFee;
    }
    const extraUnits = Math.ceil((count - template.firstCount) / template.extraCount);
    return template.firstFee.add(template.extraFee.mul(extraUnits));
  }

  private stringArray(value: Prisma.JsonValue): string[] {
    return Array.isArray(value) ? (value as string[]) : [];
  }

  private serialize(t: FreightTemplate): Record<string, unknown> {
    return {
      id: t.id,
      shopId: t.shopId,
      name: t.name,
      chargeType: t.chargeType,
      firstCount: t.firstCount,
      firstFee: t.firstFee.toFixed(2),
      extraCount: t.extraCount,
      extraFee: t.extraFee.toFixed(2),
      freeRegions: t.freeRegions,
      excludedRegions: t.excludedRegions,
      status: t.status,
      createdAt: t.createdAt,
    };
  }
}
