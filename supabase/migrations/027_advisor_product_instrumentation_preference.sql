ALTER TABLE advisors
  ADD COLUMN IF NOT EXISTS product_instrumentation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS product_instrumentation_updated_at TIMESTAMPTZ;

UPDATE advisors
SET
  product_instrumentation_enabled = COALESCE(product_instrumentation_enabled, TRUE),
  product_instrumentation_updated_at = COALESCE(product_instrumentation_updated_at, created_at)
WHERE product_instrumentation_updated_at IS NULL;
