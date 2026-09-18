/**
 * 订单状态枚举（与 spec 一致，取值 0-6）
 */
export enum OrderStatus {
  /** 待付款 */
  PENDING_PAY = 0,
  /** 已付款 */
  PAID = 1,
  /** 已发货 */
  SHIPPED = 2,
  /** 已收货 */
  RECEIVED = 3,
  /** 已完成 */
  FINISHED = 4,
  /** 已关闭 */
  CLOSED = 5,
  /** 已取消 */
  CANCELLED = 6,
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAY]: '待付款',
  [OrderStatus.PAID]: '已付款',
  [OrderStatus.SHIPPED]: '已发货',
  [OrderStatus.RECEIVED]: '已收货',
  [OrderStatus.FINISHED]: '已完成',
  [OrderStatus.CLOSED]: '已关闭',
  [OrderStatus.CANCELLED]: '已取消',
};
