-- CreateTable
CREATE TABLE "freight_templates" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "chargeType" INTEGER NOT NULL DEFAULT 1,
    "first_count" INTEGER NOT NULL,
    "first_fee" DECIMAL(10,2) NOT NULL,
    "extra_count" INTEGER NOT NULL,
    "extra_fee" DECIMAL(10,2) NOT NULL,
    "free_regions" JSONB NOT NULL,
    "excluded_regions" JSONB NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freight_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "order_no" TEXT NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "express_company" TEXT NOT NULL,
    "express_code" TEXT NOT NULL,
    "tracking_no" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "shipped_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistics_traces" (
    "id" SERIAL NOT NULL,
    "shipment_id" INTEGER NOT NULL,
    "trace_time" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logistics_traces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "freight_templates_shop_id_status_idx" ON "freight_templates"("shop_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_order_id_key" ON "shipments"("order_id");

-- CreateIndex
CREATE INDEX "shipments_tracking_no_idx" ON "shipments"("tracking_no");

-- CreateIndex
CREATE INDEX "logistics_traces_shipment_id_trace_time_idx" ON "logistics_traces"("shipment_id", "trace_time");

-- AddForeignKey
ALTER TABLE "logistics_traces" ADD CONSTRAINT "logistics_traces_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
