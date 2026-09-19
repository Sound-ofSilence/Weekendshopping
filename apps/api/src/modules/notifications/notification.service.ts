import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { NotificationQueryDto } from './dto/notification-query.dto';

export interface CreateNotificationInput {
  userId: number;
  type: string;
  title: string;
  content: string;
  link?: string;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateNotificationInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        link: input.link ?? null,
      },
    });
  }

  async list(userId: number, query: NotificationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.NotificationWhereInput = { userId };
    if (query.type) where.type = query.type;
    if (query.isRead !== undefined) where.isRead = query.isRead === 'true';

    const [list, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      list: list.map((n) => this.toResponse(n)),
      total,
      page,
      pageSize,
    };
  }

  async unreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(userId: number, id: number) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== userId) {
      throw new AppException(ErrorCode.NOT_FOUND, '通知不存在');
    }
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { id, isRead: true };
  }

  async markAllRead(userId: number) {
    const r = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: r.count };
  }

  async remove(userId: number, id: number) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== userId) {
      throw new AppException(ErrorCode.NOT_FOUND, '通知不存在');
    }
    await this.prisma.notification.delete({ where: { id } });
    return { id };
  }

  private toResponse(n: {
    id: number;
    type: string;
    title: string;
    content: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
  }) {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    };
  }
}