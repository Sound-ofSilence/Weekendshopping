import type { AfterSale } from '@prisma/client';

export class AfterSaleResponseDto {
  id!: number;
  afterSaleNo!: string;
  orderId!: number;
  orderNo!: string;
  orderItemId!: number;
  userId!: number;
  shopId!: number;
  type!: number;
  reason!: string;
  description!: string | null;
  evidenceJson!: unknown | null;
  amount!: string;
  status!: number;
  returnTrackingNo!: string | null;
  returnExpressCode!: string | null;
  sellerReply!: string | null;
  sellerReplyAt!: Date | null;
  refundNo!: string | null;
  closedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export function toAfterSaleResponse(afterSale: AfterSale): AfterSaleResponseDto {
  return {
    id: afterSale.id,
    afterSaleNo: afterSale.afterSaleNo,
    orderId: afterSale.orderId,
    orderNo: afterSale.orderNo,
    orderItemId: afterSale.orderItemId,
    userId: afterSale.userId,
    shopId: afterSale.shopId,
    type: afterSale.type,
    reason: afterSale.reason,
    description: afterSale.description ?? null,
    evidenceJson: afterSale.evidenceJson ?? null,
    amount: afterSale.amount.toFixed(2),
    status: afterSale.status,
    returnTrackingNo: afterSale.returnTrackingNo ?? null,
    returnExpressCode: afterSale.returnExpressCode ?? null,
    sellerReply: afterSale.sellerReply ?? null,
    sellerReplyAt: afterSale.sellerReplyAt ?? null,
    refundNo: afterSale.refundNo ?? null,
    closedAt: afterSale.closedAt ?? null,
    createdAt: afterSale.createdAt,
    updatedAt: afterSale.updatedAt,
  };
}
