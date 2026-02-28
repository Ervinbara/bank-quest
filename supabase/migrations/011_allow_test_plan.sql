ALTER TABLE advisors
  DROP CONSTRAINT IF EXISTS advisors_plan_check;

ALTER TABLE advisors
  ADD CONSTRAINT advisors_plan_check CHECK (plan IN ('none', 'solo', 'pro', 'cabinet', 'test'));
