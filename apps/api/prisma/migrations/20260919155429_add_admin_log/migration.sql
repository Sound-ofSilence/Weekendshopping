-- CreateTable
CREATE TABLE "admin_logs" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_id" INTEGER,
    "detail_json" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_logs_admin_id_created_at_idx" ON "admin_logs"("admin_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_logs_module_idx" ON "admin_logs"("module");
