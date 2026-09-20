import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-codes';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { SellerOrderQueryDto } from './dto/seller-order-query.dto';
import { maskPhone } from '../../common/utils/mask.util';

const DEFAULT_SHOP_ID = 1;

@Controller('seller/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
export class SellerOrdersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Query() query: SellerOrderQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where: Prisma.OrderWhereInput = { shopId: DEFAULT_SHOP_ID };
    if (query.status !== undefined) where.status = query.status;
    if (query.orderNo) where.orderNo = { contains: query.orderNo };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { items: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      list: orders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        userId: o.userId,
        shopId: o.shopId,
        status: o.status,
        payStatus: o.payStatus,
        shipStatus: o.shipStatus,
        payAmount: o.payAmount.toFixed(2),
        totalAmount: o.totalAmount.toFixed(2),
        createdAt: o.createdAt.toISOString(),
        paidAt: o.paidAt ? o.paidAt.toISOString() : null,
        shippedAt: o.shippedAt ? o.shippedAt.toISOString() : null,
        items: o.items.map((it) => ({
          id: it.id,
          spuId: it.spuId,
          skuId: it.skuId,
          spuTitle: it.spuTitle,
          skuImage: it.skuImage,
          price: it.price.toFixed(2),
          quantity: it.quantity,
          total: it.total.toFixed(2),
        })),
      })),
      total,
      page,
      pageSize,
    };
  }

  @Get(':orderNo')
  async detail(@Param('orderNo') orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNo },
      include: { items: true },
    });
    if (!order || order.shopId !== DEFAULT_SHOP_ID) {
      throw new AppException(ErrorCode.NOT_FOUND, '订单不存在');
    }
    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      shopId: order.shopId,
      status: order.status,
      payStatus: order.payStatus,
      shipStatus: order.shipStatus,
      payAmount: order.payAmount.toFixed(2),
      totalAmount: order.totalAmount.toFixed(2),
      freightAmount: order.freightAmount.toFixed(2),
      discountAmount: order.discountAmount.toFixed(2),
      receiverJson: order.receiverJson
        ? {
            ...(order.receiverJson as Record<string, unknown>),
            phone: maskPhone((order.receiverJson as Record<string, unknown>).phone as string),
          }
        : null,
      buyerRemark: order.buyerRemark,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
      finishedAt: order.finishedAt ? order.finishedAt.toISOString() : null,
      items: order.items.map((it) => ({
        id: it.id,
        spuId: it.spuId,
        skuId: it.skuId,
        spuTitle: it.spuTitle,
        skuImage: it.skuImage,
        price: it.price.toFixed(2),
        quantity: it.quantity,
        total: it.total.toFixed(2),
        refundStatus: it.refundStatus,
      })),
    };
  }
}