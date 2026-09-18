-- CreateTable
CREATE TABLE "after_sales" (
    "id" SERIAL NOT NULL,
    "after_sale_no" TEXT NOT NULL,
    "order_id" INTEGER NOT NULL,
    "order_no" TEXT NOT NULL,
    "order_item_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "type" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "evidence_json" JSONB,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "return_tracking_no" TEXT,
    "return_express_code" TEXT,
    "seller_reply" TEXT,
    "seller_reply_at" TIMESTAMP(3),
    "refund_no" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "after_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "after_sales_after_sale_no_key" ON "after_sales"("after_sale_no");

-- CreateIndex
CREATE INDEX "after_sales_order_id_idx" ON "after_sales"("order_id");

-- CreateIndex
CREATE INDEX "after_sales_user_id_idx" ON "after_sales"("user_id");

-- CreateIndex
CREATE INDEX "after_sales_shop_id_status_idx" ON "after_sales"("shop_id", "status");
