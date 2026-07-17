# Closing Regularization and Charge Authorization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task by task.

**Goal:** Close anonymous and cross-store authorization gaps in daily-closing regularization and manager charge RPCs.

**Architecture:** Preserve the six public RPC signatures used by the frontend. Make the underlying database functions the authorization boundary: require an authenticated identity, reconcile correction request scope with the linked daily closing before mutation, permit cancellation only to the seller/requester, permit approval/rejection only to store management or MX administration, and require the charge recipient to be an active seller in the same store. Explicitly revoke anonymous execution from all entry points and keep authenticated/service-role grants for API compatibility.

**Tech Stack:** PostgreSQL 17, Supabase Auth helpers, PL/pgSQL, Bun tests, GitHub Actions.

## Constraints

- Follow the Módulo Gerencial rule that the manager may charge, regularize, approve, or reject only within their unit/team and may not invent or mutate unrelated commercial records.
- Preserve signatures and result types of:
  - `aplicar_regularizacao_fechamento(uuid)`;
  - `approve_correction_request(uuid)`;
  - `cancelar_regularizacao_fechamento(uuid)`;
  - `rejeitar_regularizacao_fechamento(uuid,text)`;
  - `reject_correction_request(uuid)`;
  - `enviar_cobranca_diaria(uuid,uuid,text,text,text,text,text)`.
- Do not rewrite business formulas or status vocabulary.
- Do not leave test notifications or mutate real correction requests during verification.
- Do not trigger a manual Vercel deployment.
- Use TDD and fresh permanent checks before merge.

## Task 1: Define the failing contract

Create `src/lib/closing-regularization-authorization.test.ts` requiring migration `supabase/migrations/20260717280000_harden_closing_regularization_authorization.sql`.

The contract must assert:

- all three mutating implementations require `auth.uid()` before reading/mutating;
- cancellation uses explicit positive ownership (`seller_id = caller OR requested_by = caller`), avoiding nullable negative comparisons;
- approval reconciles `lancamentos_diarios.id`, `store_id`, and `seller_user_id` against the request before mutation;
- approval/rejection use management scope guards;
- daily charge validates recipient with `tem_papel_loja(store, ['vendedor'], recipient)`;
- all six functions revoke `PUBLIC`/`anon` and grant `authenticated`/`service_role`;
- fixed search paths, transaction, and rollback documentation.

Run focused test and verify RED because the migration is absent.

## Task 2: Implement the minimal migration

Create `supabase/migrations/20260717280000_harden_closing_regularization_authorization.sql`.

### Apply regularization

- set `v_caller := auth.uid()`;
- return `Não autenticado.` before loading a request when null;
- keep the current request status and store-management checks;
- load the linked daily closing only when:
  - `ld.id = request.checkin_id`;
  - `ld.store_id = request.store_id`;
  - `ld.seller_user_id = request.seller_id`;
- return a scope-consistency error if not found;
- use `v_caller` for audit, reviewer, and notification sender fields;
- preserve current original-value concurrency protection and update payload.

### Cancel regularization

- require `v_caller`;
- authorize only when `request.seller_id = v_caller OR request.requested_by = v_caller`;
- preserve pending-only cancellation.

### Reject regularization

- require `v_caller`;
- preserve pending-only and management authorization;
- use `v_caller` for reviewer/sender fields.

### Daily charge

- require `v_caller`;
- preserve type validation and sender store-management check;
- require `tem_papel_loja(p_store_id, ARRAY['vendedor'], p_recipient_id)`;
- keep daily idempotency and current response shape.

### Entry-point ACLs

For all six signatures:

```sql
REVOKE ALL ... FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ... TO authenticated, service_role;
```

Wrap in `BEGIN`/`COMMIT`, use `search_path = public`, and document `-- DOWN`.

## Task 3: Verify and release

1. Run focused test, typecheck, full unit suite, build, reversibility, and pgTAP RLS matrix.
2. Open a draft PR and wait for all permanent checks.
3. Apply the exact migration to Supabase production only after CI passes.
4. Verify ACLs for all six RPCs.
5. Prove behavior with rollback-safe probes:
   - anonymous cancellation receives an authentication failure and request stays pending;
   - unrelated seller cannot cancel another request;
   - requester can cancel in a rolled-back subtransaction;
   - manager can approve/reject only own-store request;
   - manager cannot charge recipient from another store;
   - manager can charge own-store seller in a rolled-back subtransaction.
6. Confirm request statuses, notification counts, and audit counts are unchanged by probes.
7. Re-run security advisors.
8. Remove temporary CI, rerun permanent checks, verify no review threads, squash merge, and inspect automatic Vercel status without manual deployment.