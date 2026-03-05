ALTER TABLE advisors
  ADD COLUMN IF NOT EXISTS gamification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS gamification_updated_at TIMESTAMPTZ;

UPDATE advisors
SET gamification_updated_at = COALESCE(gamification_updated_at, updated_at, created_at, NOW())
WHERE gamification_updated_at IS NULL;
