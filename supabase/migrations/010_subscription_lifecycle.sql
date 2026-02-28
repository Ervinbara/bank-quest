ALTER TABLE advisors
  ALTER COLUMN plan SET DEFAULT 'none';

ALTER TABLE advisors
  DROP CONSTRAINT IF EXISTS advisors_plan_check;

ALTER TABLE advisors
  ADD CONSTRAINT advisors_plan_check CHECK (plan IN ('none', 'solo', 'pro', 'cabinet'));

ALTER TABLE advisors
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancel_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE advisors
SET
  plan = 'none',
  subscription_status = COALESCE(subscription_status, 'inactive')
WHERE COALESCE(subscription_status, 'inactive') = 'inactive'
  AND COALESCE(plan, 'solo') = 'solo';
