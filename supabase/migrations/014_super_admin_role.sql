-- Super admin foundation:
-- 1) advisor role column
-- 2) bootstrap super admin account
-- 3) read-only global visibility for super admin

ALTER TABLE advisors
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'advisor';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advisors_role_check'
  ) THEN
    ALTER TABLE advisors
      ADD CONSTRAINT advisors_role_check CHECK (role IN ('advisor', 'super_admin'));
  END IF;
END $$;

UPDATE advisors
SET role = 'super_admin'
WHERE lower(email) = 'bankquest.pro@gmail.com';

DROP POLICY IF EXISTS advisors_select_super_admin ON advisors;
CREATE POLICY advisors_select_super_admin
  ON advisors
  FOR SELECT
  TO authenticated
  USING (lower(COALESCE(auth.jwt() ->> 'email', '')) = 'bankquest.pro@gmail.com');

DROP POLICY IF EXISTS clients_select_super_admin ON clients;
CREATE POLICY clients_select_super_admin
  ON clients
  FOR SELECT
  TO authenticated
  USING (lower(COALESCE(auth.jwt() ->> 'email', '')) = 'bankquest.pro@gmail.com');
