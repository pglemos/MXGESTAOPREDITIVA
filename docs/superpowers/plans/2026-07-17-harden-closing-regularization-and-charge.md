# Closing Regularization and Charge Authorization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task by task.

**Goal:** Close anonymous, nullable-ownership, cross-store, status-disclosure, concurrency, and invalid-notification-target gaps in daily-closing regularization and manager charge RPCs.

**Architecture:** Preserve the six public RPC signatures used by the frontend. Make the database functions the authorization boundary: require an authenticated identity, authorize before revealing request state, reconcile correction-request scope with the linked daily closing before mutation, permit cancellation only to the seller/requester with a null-safe positive predicate, permit approval/rejection only to store management or MX administration, require the charge recipient to be an active seller in the same store, serialize the daily idempotency key, and persist direct notifications using the schema-supported `target_type='all'` plus `recipient_id`. Explicitly revoke anonymous execution from all entry points and keep authenticated/service-role grants for API compatibility.

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

Create `src/lib/closing-regularization-authorization.test.ts` requiring the consolidated migration and all reviewed follow-ups.

The contract must assert against each final function body independently:

- all four mutating implementations require `auth.uid()`;
- approval and rejection authorize the caller before returning status-specific information;
- cancellation uses `(seller_id = caller OR requested_by = caller) IS NOT TRUE`, so a nullable `requested_by` cannot bypass the block;
- approval reconciles `lancamentos_diarios.id`, `store_id`, and `seller_user_id` against the request before mutation;
- approval/rejection use management-scope guards;
- daily charge validates the recipient with `tem_papel_loja(store, ['vendedor'], recipient)`;
- daily charge acquires a transaction advisory lock before the existence lookup;
- daily charge writes `target_type='all'` for the direct `recipient_id`, never the invalid `target_type='user'`;
- all six functions revoke `PUBLIC`/`anon` and grant `authenticated`/`service_role`;
- fixed search paths, transactions, and rollback documentation are present.

Run the focused test and verify RED for each missing protection before implementation.

## Task 2: Implement the base migration

Create `supabase/migrations/20260717280000_harden_closing_regularization_authorization.sql`.

### Apply regularization

- set `v_caller := auth.uid()`;
- return `Não autenticado.` before loading a request when null;
- load and lock the request;
- authorize store management before status-specific responses;
- load the linked daily closing only when:
  - `ld.id = request.checkin_id`;
  - `ld.store_id = request.store_id`;
  - `ld.seller_user_id = request.seller_id`;
- return a scope-consistency error if not found;
- use `v_caller` for audit, reviewer, and notification sender fields;
- preserve current original-value concurrency protection and update payload.

### Cancel regularization

- require `v_caller`;
- authorize only when `(request.seller_id = v_caller OR request.requested_by = v_caller) IS TRUE`;
- implement the denial branch as `... IS NOT TRUE` to block both `FALSE` and `NULL`;
- preserve pending-only cancellation.

### Reject regularization

- require `v_caller`;
- authorize store management before status-specific responses;
- preserve pending-only behavior;
- use `v_caller` for reviewer/sender fields.

### Daily charge

- require `v_caller`;
- preserve type validation and sender store-management check;
- require `tem_papel_loja(p_store_id, ARRAY['vendedor'], p_recipient_id)`;
- derive the business day in `America/Sao_Paulo`;
- acquire `pg_advisory_xact_lock` on sender, recipient, store, type, and business day before checking for an existing notification;
- preserve the response shape `ok`, `duplicate`, and `id`.

### Entry-point ACLs

For all six signatures:

```sql
REVOKE ALL ... FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ... TO authenticated, service_role;
```

Wrap in `BEGIN`/`COMMIT`, use `search_path = public`, and document `-- DOWN`.

## Task 3: Apply reviewed authorization follow-up

Because the base definitions reached production before review completed, add `supabase/migrations/20260717290000_fix_closing_review_findings.sql` rather than rewriting deployed history.

The follow-up must:

1. move approval/rejection authorization before status responses;
2. make cancellation ownership null-safe;
3. serialize charge idempotency with a transaction-scoped advisory lock;
4. use the official São Paulo business day for the duplicate window;
5. preserve ACLs and signatures.

## Task 4: Fix the direct notification target

The production probe exposed that `target_type='user'` violates the active `notificacoes_target_type_check`. Add `supabase/migrations/20260717291000_fix_daily_charge_notification_target.sql` rather than rewriting applied history.

The follow-up must:

- preserve all authorization and idempotency protections;
- keep `recipient_id` as the direct-consumption key used by `useNotifications`;
- write `target_type='all'`, which is the schema-supported representation already used by direct frontend inserts;
- preserve ACLs, transaction boundaries, and rollback documentation.

## Task 5: Verify and release

1. Run focused test, typecheck, full unit suite, build, reversibility, and pgTAP RLS matrix.
2. Apply each reviewed follow-up migration to Supabase production only after CI passes.
3. Verify ACLs and active definitions for all affected RPCs.
4. Prove behavior with rollback-safe probes:
   - anonymous cancellation receives an authentication failure and request stays pending;
   - unrelated seller with `requested_by IS NULL` cannot cancel another request;
   - requester can cancel in a rolled-back subtransaction;
   - unauthorized cross-store caller cannot learn processed/pending state;
   - manager can approve/reject only an own-store request;
   - manager cannot charge a recipient from another store;
   - repeated same-day charge attempts produce one notification id;
   - valid direct charge inserts satisfy notification constraints.
5. Confirm request statuses, notification counts, and audit counts are unchanged by probes.
6. Re-run security advisors.
7. Rerun permanent checks, resolve review threads, squash merge, and inspect automatic Vercel status without manual deployment.
