import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AdminLogService } from './admin-log.service';

@Injectable()
export class AdminUsersService {
  constructor(
    private prisma: PrismaService,
    private logService: AdminLogService,
  ) {}

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.UserWhereInput = { deletedAt: null };

    const [list, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          phone: true,
          nickname: true,
          avatar: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      list: list.map((u) => ({
        id: u.id,
        phone: u.phone ? u.phone.slice(0, 3) + '****' + u.phone.slice(-4) : null,
        nickname: u.nickname,
        avatar: u.avatar,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async ban(adminId: number, userId: number) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new AppException(ErrorCode.NOT_FOUND, '用户不存在');
    await this.prisma.user.update({ where: { id: userId }, data: { status: 0 } });
    await this.logService.log({ adminId, module: 'user', action: 'ban', targetId: userId });
    return { userId, status: 0 };
  }

  async unban(adminId: number, userId: number) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new AppException(ErrorCode.NOT_FOUND, '用户不存在');
    await this.prisma.user.update({ where: { id: userId }, data: { status: 1 } });
    await this.logService.log({ adminId, module: 'user', action: 'unban', targetId: userId });
    return { userId, status: 1 };
  }
}