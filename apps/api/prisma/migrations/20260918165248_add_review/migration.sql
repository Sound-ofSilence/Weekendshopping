-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "order_item_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "spu_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "images_json" JSONB NOT NULL,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "seller_reply" TEXT,
    "seller_reply_at" TIMESTAMP(3),
    "status" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_order_item_id_key" ON "reviews"("order_item_id");

-- CreateIndex
CREATE INDEX "reviews_spu_id_status_idx" ON "reviews"("spu_id", "status");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "reviews_shop_id_idx" ON "reviews"("shop_id");
