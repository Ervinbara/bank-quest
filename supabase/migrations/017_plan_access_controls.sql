-- Plan-based client limits
-- none: 5 clients max
-- solo: 50 clients max
-- pro: 200 clients max
-- cabinet/test: unlimited

DROP POLICY IF EXISTS clients_rw_own_advisor ON clients;
DROP POLICY IF EXISTS clients_select_own_advisor ON clients;
DROP POLICY IF EXISTS clients_update_own_advisor ON clients;
DROP POLICY IF EXISTS clients_delete_own_advisor ON clients;
DROP POLICY IF EXISTS clients_insert_with_plan_limits ON clients;

CREATE POLICY clients_select_own_advisor
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = clients.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

CREATE POLICY clients_update_own_advisor
  ON clients
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = clients.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = clients.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

CREATE POLICY clients_delete_own_advisor
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = clients.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

CREATE POLICY clients_insert_with_plan_limits
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = clients.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
        AND (
          COALESCE(a.plan, 'none') IN ('cabinet', 'test')
          OR (
            COALESCE(a.plan, 'none') = 'pro'
            AND (
              SELECT COUNT(*)
              FROM clients c
              WHERE c.advisor_id = a.id
            ) < 200
          )
          OR (
            COALESCE(a.plan, 'none') = 'solo'
            AND (
              SELECT COUNT(*)
              FROM clients c
              WHERE c.advisor_id = a.id
            ) < 50
          )
          OR (
            COALESCE(a.plan, 'none') = 'none'
            AND (
              SELECT COUNT(*)
              FROM clients c
              WHERE c.advisor_id = a.id
            ) < 5
          )
        )
    )
  );

