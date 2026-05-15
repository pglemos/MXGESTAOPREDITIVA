# Data/RLS Predeploy Review - EPIC-MX-CONS-DEV-20260515

**Agent:** @data-engineer / Dara  
**Date:** 2026-05-15  
**Decision:** PASS  

## Migrations Reviewed

- `supabase/migrations/20260515120000_pmr_followup_visit_8.sql`
- `supabase/migrations/20260515121000_consulting_visit_analysis_period.sql`
- `supabase/migrations/20260515123000_pmr_mvp_indicators.sql`
- `supabase/migrations/20260515162000_harden_consulting_visits_role_scope.sql`
- `supabase/migrations/20260515190000_development_full_completion.sql`
- `supabase/migrations/20260515200000_store_institutional_training_write.sql`
- `supabase/migrations/20260515201000_harden_store_training_select_scope.sql`

## Static Review

| Area | Result | Notes |
|---|---|---|
| Idempotency | PASS | Uses `ON CONFLICT`, `IF NOT EXISTS` and constraint replacement where needed. |
| Destructive operations | PASS | No table/column drops. PMR 9 is deactivated intentionally by product decision. |
| Visit period constraints | PASS | Date range and preset constraints prevent invalid period state. |
| Catalog seed safety | PASS | Metric inserts use `ON CONFLICT`; existing sort order updates are targeted. |
| Development persistence | PASS | Ratings, suggestions, tracks, step progress and recommendations are additive and RLS-scoped. |
| Store institutional content | PASS | `treinamentos` policies are scoped so store content is visible only to the linked store and internal MX. |
| RLS policy changes | PASS | `visitas_consultoria` now has explicit internal/assigned-consultant select and internal write policies. |
| Rollback readiness | PASS | Compensating rollback path documented below. |
| Live smoke | PASS | Role-scoped probe visit smoke passed after remote migration application. |
| Development smoke | PASS | Authenticated seller/manager smoke passed for rating, suggestion, recommendation, store institutional isolation, assignment and step completion. |

## DBA Checklist Snapshot

- [x] All migrations have been tested in connected remote environment: applied via `npx supabase db push`.
- [x] Migrations are idempotent: statically verified.
- [x] Rollback path documented: reapply previous select/write policy shape if needed.
- [x] Migration order dependencies are documented: reviewed against renamed Portuguese tables.
- [x] No destructive operations without explicit safeguards: PMR 9 deactivation is intentional and documented.
- [x] No breaking changes to existing tables/APIs: additive columns and catalog seeds only.
- [x] NOT NULL constraints are appropriate: new columns are nullable.
- [x] RLS policies have been tested with positive and negative cases.
- [x] No hardcoded credentials or secrets in migrations.

## RLS Smoke Evidence

- `admin_mx`: can read probe visit.
- `dono`: receives 0 rows for probe visit.
- `gerente`: receives 0 rows for probe visit.
- `vendedor`: receives 0 rows for probe visit.
- Metric catalog remains readable for all authenticated roles as intended.
- Development tables allow seller self-service where expected and manager/admin scoped operations by store.

## Rollback Path

If the hardened visit policy blocks a legitimate internal consultant flow, create a compensating migration that restores `visitas_consultoria_select` to `public.can_access_consulting_client(client_id)` while preserving `ENABLE ROW LEVEL SECURITY`. If a development RLS policy blocks a legitimate manager/admin flow, add a compensating policy for the specific role/store path instead of disabling RLS.

## Decision

`PASS`. Database/RLS release concern closed for this package.
