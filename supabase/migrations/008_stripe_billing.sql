ALTER TABLE advisors
  ADD COLUMN stripe_customer_id TEXT UNIQUE,
  ADD COLUMN stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN stripe_price_id TEXT,
  ADD COLUMN subscription_status TEXT DEFAULT 'inactive',
  ADD COLUMN current_period_end TIMESTAMPTZ;

CREATE INDEX idx_advisors_subscription_status ON advisors(subscription_status);
