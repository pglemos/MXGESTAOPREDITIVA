# Wave 1 - Data Preflight

Status: completed by AIOX orchestration preflight  
Agent: aiox-data-engineer  
Date: 2026-05-15

## Objective

Prepare the database direction for:

- monthly follow-up Visit 8;
- visit analysis period;
- executive report generation context.

## Recommended Migration

Create a new migration after the current legacy completion migration.

Suggested name:

```txt
supabase/migrations/20260515120000_pmr_followup_visit_and_analysis_period.sql
```

## Visit 8 Data Model

Recommended approach:

- Keep `program_key = 'pmr_7'`.
- Insert or update an active `etapas_modelo_visita_consultoria` row for `visit_number = 8`.
- Name it `Acompanhamento Mensal`.
- Treat it as follow-up, not PMR main-cycle completion.
- Do not reactivate `pmr_9`.
- Do not change legacy completion RPCs.

Expected template fields:

- objective: monthly follow-up and decision alignment.
- target audience: owner, manager, and consultant.
- core topics:
  - period result;
  - action plan status;
  - positive points;
  - points to improve;
  - next steps;
  - next follow-up date.

## Analysis Period Columns

Add nullable columns to `visitas_consultoria`:

```sql
alter table public.visitas_consultoria
  add column if not exists analysis_period_start date,
  add column if not exists analysis_period_end date,
  add column if not exists analysis_period_preset text;
```

Recommended constraint:

```sql
alter table public.visitas_consultoria
  add constraint visitas_consultoria_analysis_period_valid
  check (
    analysis_period_start is null
    or analysis_period_end is null
    or analysis_period_end >= analysis_period_start
  );
```

Recommended presets:

- `current_month`
- `previous_month`
- `current_quarter`
- `previous_quarter`
- `custom`

## RLS Impact

No new table is required for Wave 1. Because the period fields live on `visitas_consultoria`, existing visit-level access policies should continue to apply.

Before implementation, confirm:

- consultant/admin can update visit period;
- manager/owner can read finalized report fields according to existing visibility;
- seller cannot mutate visit execution/report data unless already allowed by existing policy.

## Legacy Compatibility

Keep these behaviors unchanged:

- `concluir_visitas_legadas_consultoria` continues to accept only 1 to 7.
- legacy backfill remains a one-time PMR cycle operation.
- historical reports/anexos stay attached to the original visit numbers.

## Test Data Requirements

Minimum data fixtures:

- one client with completed visits 1 to 7;
- one scheduled Visit 8;
- one Visit 8 with analysis period set to previous month;
- one Visit 8 with custom period;
- one invalid period where end date is before start date, expected to fail.

## Open Product Decision

W1-D02 should confirm whether `analysis_period_preset` is enough for reporting or whether a richer JSON context is needed.

Data recommendation: start with explicit start/end/preset columns. Add JSON only when report context requires structured period metadata that cannot be derived from dates.
