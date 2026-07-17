# PDI Development Recommendation Authorization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development and superpowers:verification-before-completion task by task.

**Goal:** Protect PDI and feedback recommendation generation from anonymous, cross-store, self-service, duplicate execution, source-existence disclosure, and recommendations for competencies already at target, while preserving the current frontend contracts.

**Architecture:** Keep the existing RPC signatures and return types. Make each `SECURITY DEFINER` function enforce identity and source scope internally, authorize inside the source lookup, validate the seller/store relationship, derive the audit actor from the authenticated caller, serialize generation per source, use database uniqueness for durable idempotency, and select only positive development gaps. Revoke anonymous execution from the two generators and from the sensitive PDI print bundle. Preserve `authenticated` and `service_role` entry points, with explicit service-role handling inside the functions.

**Tech Stack:** PostgreSQL 17, Supabase Auth helpers, PL/pgSQL, Bun tests, GitHub Actions.

## Functional constraints

- Follow the Módulo Gerencial specification: manager acts only within their unit/team; seller views and executes their own development actions; Owner/Admin audits; PDI data is private and scoped.
- Preserve signatures and return types:
  - `gerar_recomendacoes_desenvolvimento_feedback(uuid) returns integer`;
  - `gerar_recomendacoes_desenvolvimento_pdi(uuid) returns integer`;
  - `get_pdi_print_bundle(uuid) returns jsonb`.
- Do not reveal whether a feedback or PDI source exists outside the caller's authorized scope.
- Generate PDI recommendations only when `alvo > nota_atribuida`.
- Do not change recommendation status vocabulary or frontend query shape.
- Do not delete historical recommendations.
- Do not create test recommendations in production outside rollback-safe probes.
- Do not trigger a manual Vercel deployment.

## Task 1: Define the failing contract

Create `src/lib/pdi-development-recommendation-authorization.test.ts` against the planned migrations:

- `20260717292000_harden_pdi_development_recommendations.sql`;
- `20260717293000_fix_pdi_source_existence_disclosure.sql`;
- `20260717294000_fix_pdi_positive_gap_recommendations.sql`.

The contract must require:

- authenticated identity or explicit `service_role` handling in both generators and the print bundle;
- feedback generation restricted to source manager, store management, Owner/Admin MX, or service role;
- PDI generation restricted to assigned manager, store management, Owner/Admin MX, or service role;
- every authorization predicate remains between the source filter and `FOR SHARE`;
- nonexistent and out-of-scope sources return the same SQLSTATE `42501` and generic message;
- source seller has an active seller relationship in the source store;
- PDI recommendations are limited to positive gaps before ordering and `LIMIT 5`;
- recommendation `created_by` is derived from the authenticated actor, with source-manager fallback only for service role;
- transaction advisory lock per source before duplicate checks;
- a unique partial index for one feedback recommendation per feedback source;
- a unique partial index preventing exact duplicate PDI recommendations per source and reason;
- conflict-safe insert/update behavior;
- audit logging for generation attempts and inserted/updated counts;
- `PUBLIC` and `anon` execute privileges revoked from all three RPCs;
- `authenticated` and `service_role` grants preserved;
- transaction boundaries and rollback documentation.

Run the focused test and confirm RED before each missing migration is implemented.

## Task 2: Implement the base migration

Create `supabase/migrations/20260717292000_harden_pdi_development_recommendations.sql`.

### Feedback generator

1. Resolve `auth.uid()` and `auth.role()`.
2. Reject unauthenticated non-service calls with SQLSTATE `42501`.
3. Lock and load the feedback source.
4. Authorize service role, internal MX, source manager, manager or owner of the source store.
5. Require the source seller to be an active seller in the same store.
6. Acquire a transaction advisory lock keyed by `feedback/source_id`.
7. Generate the deterministic theme/training/reason.
8. Insert one recommendation per feedback source. On conflict, update only a recommendation still in `recommended` status; never reset progressed recommendations.
9. Use the authenticated actor as `created_by`; service role falls back to the source manager.
10. Log the attempt and affected count in `logs_auditoria`.

### PDI generator

1. Resolve identity and service role.
2. Lock and load the PDI session.
3. Authorize service role, internal MX, assigned manager, manager or owner of the source store.
4. Require active seller/store relationship.
5. Acquire a transaction advisory lock keyed by `pdi/source_id`.
6. Generate up to five gap recommendations.
7. Prevent exact duplicates for the same PDI source and deterministic reason with a unique partial index and `ON CONFLICT` handling.
8. Preserve recommendations that have already progressed beyond `recommended`.
9. Log source, actor, store, seller, and affected count.

### Print bundle

- require authenticated identity unless service role;
- keep collaborator, assigned manager, store manager, owner and internal MX access;
- allow service role explicitly;
- reject all other callers with SQLSTATE `42501`;
- preserve the JSON response shape.

### ACLs

For all three signatures:

```sql
REVOKE ALL ... FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ... TO authenticated, service_role;
```

Wrap in `BEGIN`/`COMMIT`, set `search_path = public`, and document `-- DOWN`.

## Task 3: Hide source existence across scopes

Because the base migration reached production before the manual review identified the existence oracle, add `supabase/migrations/20260717293000_fix_pdi_source_existence_disclosure.sql` instead of rewriting applied history.

For both recommendation generators:

1. include all authorization predicates inside the source `SELECT`;
2. return SQLSTATE `42501` with `nao encontrado ou sem acesso` when no authorized row is selected;
3. preserve all idempotency, audit, ACL, return-type, and service-role behavior from the base migration.

## Task 4: Restrict recommendations to positive gaps

The review found that the previous query could include competencies already at or above the target when fewer than five positive gaps existed. Because the prior definitions were already applied, add `supabase/migrations/20260717294000_fix_pdi_positive_gap_recommendations.sql`.

The replacement PDI generator must:

1. preserve scoped source lookup and generic `42501` behavior;
2. filter with `av.alvo > av.nota_atribuida` before ordering;
3. apply `LIMIT 5` only after the positive-gap filter;
4. preserve idempotency, audit, ACLs, signatures, and return type.

## Task 5: Verify and release

1. Run the focused test, typecheck, full unit suite, build, migration reversibility and pgTAP RLS matrix.
2. Apply each migration to Supabase production only after permanent CI passes.
3. Verify active definitions and ACLs.
4. Run rollback-safe behavioral probes:
   - anon cannot generate or print;
   - unrelated seller cannot generate another user's recommendation;
   - nonexistent and out-of-scope source IDs produce the same SQLSTATE and generic message;
   - manager can generate for own store;
   - same source called twice returns no duplicate rows;
   - active PDI definition contains the positive-gap filter;
   - service-role path remains available;
   - print bundle is readable only by authorized roles.
5. Confirm recommendation and audit counts are unchanged after aborted probes.
6. Re-run security advisors.
7. Resolve review findings, merge only with fresh green gates, and inspect automatic Vercel status without a manual deploy.
