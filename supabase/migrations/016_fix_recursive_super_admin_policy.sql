-- Fix RLS infinite recursion on advisors:
-- do NOT query advisors directly inside its own policy.
-- Use a SECURITY DEFINER helper instead.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := lower(COALESCE(auth.jwt() ->> 'email', ''));

  IF v_email = '' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.advisors a
    WHERE lower(a.email) = v_email
      AND a.role = 'super_admin'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

DROP POLICY IF EXISTS advisors_select_super_admin ON advisors;
CREATE POLICY advisors_select_super_admin
  ON advisors
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS clients_select_super_admin ON clients;
CREATE POLICY clients_select_super_admin
  ON clients
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());
