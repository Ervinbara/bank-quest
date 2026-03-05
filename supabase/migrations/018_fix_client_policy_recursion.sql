-- Fix recursion in clients INSERT policy by moving quota checks
-- into a SECURITY DEFINER helper function.

CREATE OR REPLACE FUNCTION public.can_insert_client_for_advisor(p_advisor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_count BIGINT;
BEGIN
  IF p_advisor_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT COALESCE(plan, 'none')
  INTO v_plan
  FROM public.advisors
  WHERE id = p_advisor_id;

  IF v_plan IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_plan IN ('cabinet', 'test') THEN
    RETURN TRUE;
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM public.clients
  WHERE advisor_id = p_advisor_id;

  IF v_plan = 'pro' THEN
    RETURN v_count < 200;
  ELSIF v_plan = 'solo' THEN
    RETURN v_count < 50;
  ELSE
    RETURN v_count < 5;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.can_insert_client_for_advisor(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_insert_client_for_advisor(UUID) TO authenticated;

DROP POLICY IF EXISTS clients_insert_with_plan_limits ON clients;

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
    )
    AND public.can_insert_client_for_advisor(clients.advisor_id)
  );

