ALTER TABLE advisors
  ADD COLUMN IF NOT EXISTS smart_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS smart_alerts_delay_days INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS smart_alerts_updated_at TIMESTAMPTZ;

UPDATE advisors
SET
  smart_alerts_delay_days = CASE
    WHEN smart_alerts_delay_days IS NULL OR smart_alerts_delay_days < 1 THEN 7
    ELSE smart_alerts_delay_days
  END,
  smart_alerts_updated_at = COALESCE(smart_alerts_updated_at, updated_at, created_at, NOW());
