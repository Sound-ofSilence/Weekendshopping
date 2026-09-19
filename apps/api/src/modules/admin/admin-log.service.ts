import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export interface AdminLogInput {
  adminId: number;
  module: string;
  action: string;
  targetId?: number;
  detail?: unknown;
  ip?: string;
}

@Injectable()
export class AdminLogService {
  constructor(private prisma: PrismaService) {}

  async log(input: AdminLogInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.adminLog.create({
      data: {
        adminId: input.adminId,
        module: input.module,
        action: input.action,
        targetId: input.targetId ?? null,
        detailJson: input.detail
          ? (input.detail as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ip: input.ip ?? null,
      },
    });
  }

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [list, total] = await this.prisma.$transaction([
      this.prisma.adminLog.findMany({
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.adminLog.count(),
    ]);
    return {
      list: list.map((l) => ({
        id: l.id,
        adminId: l.adminId,
        module: l.module,
        action: l.action,
        targetId: l.targetId,
        detailJson: l.detailJson,
        ip: l.ip,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }
}