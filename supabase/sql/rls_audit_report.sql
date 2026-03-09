-- RLS audit report (table-by-table)
-- Run in Supabase SQL editor.

WITH public_tables AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
),
policy_counts AS (
  SELECT
    schemaname AS schema_name,
    tablename AS table_name,
    COUNT(*) AS policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY schemaname, tablename
)
SELECT
  t.schema_name,
  t.table_name,
  t.rls_enabled,
  t.rls_forced,
  COALESCE(p.policy_count, 0) AS policy_count,
  CASE
    WHEN NOT t.rls_enabled THEN 'CRITICAL: RLS disabled'
    WHEN COALESCE(p.policy_count, 0) = 0 THEN 'HIGH: no policy defined'
    WHEN NOT t.rls_forced THEN 'WARN: RLS not forced'
    ELSE 'OK'
  END AS audit_status
FROM public_tables t
LEFT JOIN policy_counts p
  ON p.schema_name = t.schema_name
 AND p.table_name = t.table_name
ORDER BY
  CASE
    WHEN NOT t.rls_enabled THEN 0
    WHEN COALESCE(p.policy_count, 0) = 0 THEN 1
    WHEN NOT t.rls_forced THEN 2
    ELSE 3
  END,
  t.table_name;

-- Detailed policy inventory
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
