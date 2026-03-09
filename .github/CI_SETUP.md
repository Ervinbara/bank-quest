# CI Setup

## Workflows ajoutes

- `.github/workflows/frontend-ci.yml`
  - `lint` sur push/PR.
- `.github/workflows/security-and-critical-flows.yml`
  - audit RLS (quotidien + manuel),
  - smoke tests flux critiques (manuel + quotidien).

## Secrets GitHub requis

Dans `Settings > Secrets and variables > Actions`:

- `SUPABASE_DB_URL`
  - URL Postgres directe Supabase (avec `sslmode=require`).
  - utilisee pour executer `supabase/sql/rls_audit_ci.sql` et `supabase/sql/rls_audit_report.sql`.
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `TEST_ADVISOR_EMAIL`
- `TEST_ADVISOR_PASSWORD`

Optionnels:

- `TEST_SECONDARY_ADVISOR_EMAIL`
- `TEST_SECONDARY_ADVISOR_PASSWORD`

## Recuperer SUPABASE_DB_URL

Supabase Dashboard:
- `Project Settings > Database > Connection string > URI`
- prendre le format:
  - `postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require`

## Lancer manuellement

Dans GitHub:
- `Actions > Security and Critical Flows > Run workflow`.

Le workflow:
- echoue si RLS bloque (table sans RLS ou sans policy),
- publie un artifact `rls-audit-report`,
- execute les smoke tests critiques si les secrets de test sont presents.
