-- Harden super-admin policies:
-- rely on advisor.role='super_admin' instead of a hardcoded email fallback.

DROP POLICY IF EXISTS advisors_select_super_admin ON advisors;
CREATE POLICY advisors_select_super_admin
  ON advisors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors sa
      WHERE lower(sa.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
        AND sa.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS clients_select_super_admin ON clients;
CREATE POLICY clients_select_super_admin
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors sa
      WHERE lower(sa.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
        AND sa.role = 'super_admin'
    )
  );
