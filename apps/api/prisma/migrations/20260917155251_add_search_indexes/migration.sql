CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_spu_title_trgm ON spus USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_spu_sales_count ON spus (sales_count);
CREATE INDEX IF NOT EXISTS idx_spu_rating_avg ON spus (rating_avg);