-- CreateTable
CREATE TABLE "coupons" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER,
    "name" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "min_amount" DECIMAL(10,2) NOT NULL,
    "total_count" INTEGER NOT NULL,
    "received_count" INTEGER NOT NULL DEFAULT 0,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "per_user_limit" INTEGER NOT NULL DEFAULT 1,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_coupons" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "coupon_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "status" INTEGER NOT NULL DEFAULT 0,
    "received_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coupons_shop_id_status_idx" ON "coupons"("shop_id", "status");

-- CreateIndex
CREATE INDEX "coupons_start_at_end_at_idx" ON "coupons"("start_at", "end_at");

-- CreateIndex
CREATE INDEX "user_coupons_user_id_status_idx" ON "user_coupons"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_coupons_user_id_coupon_id_received_at_key" ON "user_coupons"("user_id", "coupon_id", "received_at");
