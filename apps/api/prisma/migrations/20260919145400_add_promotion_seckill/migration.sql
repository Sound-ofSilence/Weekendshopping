-- CreateTable
CREATE TABLE "promotions" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "rules_json" JSONB NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seckill_activities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seckill_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seckill_products" (
    "id" SERIAL NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "seckill_price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "limit_per_user" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seckill_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promotions_shop_id_status_idx" ON "promotions"("shop_id", "status");

-- CreateIndex
CREATE INDEX "seckill_products_sku_id_idx" ON "seckill_products"("sku_id");

-- CreateIndex
CREATE UNIQUE INDEX "seckill_products_activity_id_sku_id_key" ON "seckill_products"("activity_id", "sku_id");
