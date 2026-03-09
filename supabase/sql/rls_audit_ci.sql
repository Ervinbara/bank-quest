WITH public_tables AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled
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
SELECT COUNT(*)::int AS blocking_issues
FROM public_tables t
LEFT JOIN policy_counts p
  ON p.schema_name = t.schema_name
 AND p.table_name = t.table_name
WHERE t.rls_enabled IS NOT TRUE
   OR COALESCE(p.policy_count, 0) = 0;
