-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "is_leaf" BOOLEAN NOT NULL DEFAULT false,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spus" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "brand_id" INTEGER,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "main_img" TEXT NOT NULL,
    "images_json" JSONB NOT NULL,
    "detail_html" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "audit_status" INTEGER NOT NULL DEFAULT 0,
    "audit_reason" TEXT,
    "sales_count" INTEGER NOT NULL DEFAULT 0,
    "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 5.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "spus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skus" (
    "id" SERIAL NOT NULL,
    "spu_id" INTEGER NOT NULL,
    "spec_json" JSONB NOT NULL,
    "sku_code" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "market_price" DECIMAL(10,2),
    "cost_price" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "locked_stock" INTEGER NOT NULL DEFAULT 0,
    "warn_stock" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "weight" DECIMAL(10,2),
    "volume" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spu_specs" (
    "id" SERIAL NOT NULL,
    "spu_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "values_json" JSONB NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "spu_specs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_parent_id_status_idx" ON "categories"("parent_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE INDEX "spus_shop_id_status_idx" ON "spus"("shop_id", "status");

-- CreateIndex
CREATE INDEX "spus_category_id_status_idx" ON "spus"("category_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "skus_sku_code_key" ON "skus"("sku_code");

-- CreateIndex
CREATE INDEX "skus_spu_id_idx" ON "skus"("spu_id");

-- CreateIndex
CREATE INDEX "spu_specs_spu_id_idx" ON "spu_specs"("spu_id");

-- AddForeignKey
ALTER TABLE "spus" ADD CONSTRAINT "spus_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spus" ADD CONSTRAINT "spus_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skus" ADD CONSTRAINT "skus_spu_id_fkey" FOREIGN KEY ("spu_id") REFERENCES "spus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spu_specs" ADD CONSTRAINT "spu_specs_spu_id_fkey" FOREIGN KEY ("spu_id") REFERENCES "spus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
