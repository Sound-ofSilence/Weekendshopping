export enum ProductStatus {
  DRAFT = 0,
  PENDING_AUDIT = 1,
  ON_SALE = 2,
  OFF_SALE = 3,
  REJECTED = 4,
}

export enum AuditStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

/** 一期商家模块未接入，商品统一归属该占位店铺。 */
export const DEFAULT_SHOP_ID = 1;