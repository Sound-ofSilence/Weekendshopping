-- CreateTable
CREATE TABLE "settlements" (
    "id" SERIAL NOT NULL,
    "settlement_no" TEXT NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "order_amount" DECIMAL(12,2) NOT NULL,
    "commission" DECIMAL(12,2) NOT NULL,
    "refund_amount" DECIMAL(12,2) NOT NULL,
    "payable" DECIMAL(12,2) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" SERIAL NOT NULL,
    "withdrawal_no" TEXT NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_account" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "remark" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_wallets" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "frozen_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_income" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_withdrawn" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settlements_settlement_no_key" ON "settlements"("settlement_no");

-- CreateIndex
CREATE INDEX "settlements_shop_id_status_idx" ON "settlements"("shop_id", "status");

-- CreateIndex
CREATE INDEX "settlements_period_start_period_end_idx" ON "settlements"("period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_withdrawal_no_key" ON "withdrawals"("withdrawal_no");

-- CreateIndex
CREATE INDEX "withdrawals_shop_id_status_idx" ON "withdrawals"("shop_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "shop_wallets_shop_id_key" ON "shop_wallets"("shop_id");
