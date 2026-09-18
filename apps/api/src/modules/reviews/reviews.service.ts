import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Review } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';
import { PaginatedResponseDto, toPaginated } from '../../common/dto/paginated-response.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { SENSITIVE_WORDS } from './simple-sensitive-words';

/** 可评价的订单状态：3 已收货 / 4 已完成 */
const REVIEWABLE_ORDER_STATUS: number[] = [3, 4];
/** 评价状态 */
const PUBLISHED = 1;
const BLOCKED = 2;
/** 收货后 15 天内可评价 */
const REVIEW_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto): Promise<ReviewResponseDto> {
    const uid = Number(userId);

    const review = await this.prisma.$transaction(async (tx) => {
      const orderItem = await tx.orderItem.findUnique({
        where: { id: dto.orderItemId },
        include: { order: true },
      });
      if (!orderItem) {
        throw new AppException(ErrorCode.NOT_FOUND, '订单项不存在');
      }
      if (orderItem.order.userId !== uid) {
        throw new AppException(ErrorCode.FORBIDDEN, '无权评价该订单');
      }
      if (!REVIEWABLE_ORDER_STATUS.includes(orderItem.order.status)) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, '订单未收货，暂不能评价');
      }

      const finishedAt = orderItem.order.finishedAt;
      if (!finishedAt) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, '订单尚未完成，暂不能评价');
      }
      if (Date.now() - finishedAt.getTime() > REVIEW_WINDOW_MS) {
        throw new AppException(ErrorCode.BUSINESS_ERROR, '已超过 15 天评价期限');
      }

      const existing = await tx.review.findUnique({
        where: { orderItemId: dto.orderItemId },
      });
      if (existing) {
        throw new AppException(ErrorCode.CONFLICT, '该订单项已评价');
      }

      const blocked = this.containsSensitiveWord(dto.content);
      const status = blocked ? BLOCKED : PUBLISHED;

      const created = await tx.review.create({
        data: {
          orderItemId: dto.orderItemId,
          userId: uid,
          spuId: orderItem.spuId,
          skuId: orderItem.skuId,
          shopId: orderItem.order.shopId,
          rating: dto.rating,
          content: dto.content,
          imagesJson: dto.imagesJson ?? [],
          isAnonymous: dto.isAnonymous ?? false,
          status,
        },
      });

      if (status === PUBLISHED) {
        await this.updateRatingAvg(tx, created.spuId);
      }

      return created;
    });

    return this.serializeReview(review);
  }

  async listByProduct(
    spuId: string,
    query: ReviewQueryDto,
  ): Promise<PaginatedResponseDto<ReviewResponseDto>> {
    const sid = Number(spuId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.ReviewWhereInput = { spuId: sid, status: PUBLISHED };
    if (query.rating !== undefined) {
      where.rating = query.rating;
    }

    const [list, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ]);

    return toPaginated(
      list.map((r) => this.serializeReview(r)),
      total,
      page,
      pageSize,
    );
  }

  async listByUser(
    userId: string,
    query: ReviewQueryDto,
  ): Promise<PaginatedResponseDto<ReviewResponseDto>> {
    const uid = Number(userId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const where: Prisma.ReviewWhereInput = { userId: uid };
    if (query.status !== undefined) {
      where.status = query.status;
    }
    if (query.rating !== undefined) {
      where.rating = query.rating;
    }

    const [list, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ]);

    return toPaginated(
      list.map((r) => this.serializeReview(r)),
      total,
      page,
      pageSize,
    );
  }

  async sellerReply(
    sellerUserId: string,
    reviewId: string,
    content: string,
  ): Promise<ReviewResponseDto> {
    const sid = Number(sellerUserId);
    const rid = Number(reviewId);
    const reply = (content ?? '').trim();
    if (!reply) {
      throw new AppException(ErrorCode.BAD_REQUEST, '回复内容不能为空');
    }
    if (reply.length > 500) {
      throw new AppException(ErrorCode.BAD_REQUEST, '回复内容最多 500 字');
    }

    const review = await this.prisma.review.findUnique({ where: { id: rid } });
    if (!review) {
      throw new AppException(ErrorCode.NOT_FOUND, '评价不存在');
    }
    if (review.shopId !== sid) {
      throw new AppException(ErrorCode.FORBIDDEN, '无权回复该评价');
    }
    if (review.status !== PUBLISHED) {
      throw new AppException(ErrorCode.BUSINESS_ERROR, '仅可回复已发布的评价');
    }

    const updated = await this.prisma.review.update({
      where: { id: rid },
      data: { sellerReply: reply, sellerReplyAt: new Date() },
    });
    return this.serializeReview(updated);
  }

  async remove(userId: string, reviewId: string): Promise<null> {
    const uid = Number(userId);
    const rid = Number(reviewId);

    await this.prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({ where: { id: rid } });
      if (!review) {
        throw new AppException(ErrorCode.NOT_FOUND, '评价不存在');
      }
      if (review.userId !== uid) {
        throw new AppException(ErrorCode.FORBIDDEN, '无权删除该评价');
      }
      await tx.review.delete({ where: { id: rid } });
      if (review.status === PUBLISHED) {
        await this.updateRatingAvg(tx, review.spuId);
      }
    });

    return null;
  }

  private containsSensitiveWord(content: string): boolean {
    return SENSITIVE_WORDS.some((word) => content.includes(word));
  }

  private async updateRatingAvg(tx: Prisma.TransactionClient, spuId: number): Promise<void> {
    const agg = await tx.review.aggregate({
      where: { spuId, status: PUBLISHED },
      _avg: { rating: true },
    });
    const avg = agg._avg.rating ?? 5;
    await tx.spu.update({
      where: { id: spuId },
      data: { ratingAvg: new Prisma.Decimal(avg.toFixed(2)) },
    });
  }

  private serializeReview(review: Review): ReviewResponseDto {
    return {
      id: review.id,
      orderItemId: review.orderItemId,
      userId: review.userId,
      spuId: review.spuId,
      skuId: review.skuId,
      shopId: review.shopId,
      rating: review.rating,
      content: review.content,
      imagesJson: review.imagesJson as string[],
      isAnonymous: review.isAnonymous,
      sellerReply: review.sellerReply,
      sellerReplyAt: review.sellerReplyAt,
      status: review.status,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
