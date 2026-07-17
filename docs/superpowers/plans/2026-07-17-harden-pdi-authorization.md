# PDI Authorization Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task by task.

**Goal:** Enforce store/team authorization when creating PDI sessions and validating PDI action evidence, while restoring the missing store scope of legacy sessions.

**Architecture:** Keep the existing RPC signatures. `create_pdi_session_bundle(jsonb)` resolves a missing store from the unique active store shared by collaborator and manager, validates that the collaborator is an active seller in that store, and permits creation only to the store manager/owner or the internal MX team. `approve_pdi_action_evidence(uuid,jsonb)` loads the action and session first, denies self-approval, allows the assigned manager, store owner, or internal MX team, and records an audit event. Both RPCs lose anonymous execution.

**Tech Stack:** PostgreSQL 17, Supabase Auth/RLS helpers, PL/pgSQL, Bun tests, GitHub Actions.

## Constraints

- Follow the Módulo Gerencial rules: manager acts only on their team; seller records evidence; manager validates; owner/admin audits.
- Preserve current RPC signatures and result types.
- Preserve current PDI status vocabulary (`draft`, `concluido`, `pendente`).
- Do not allow a collaborator to approve their own action.
- Do not silently choose among multiple possible stores.
- Backfill only legacy sessions with exactly one active store shared by collaborator and manager.
- Fix `search_path` on both SECURITY DEFINER functions.
- Use explicit ACLs: no `PUBLIC`/`anon`; preserve `authenticated` and `service_role` compatibility.
- Do not trigger a manual Vercel deployment.
- Use TDD and fresh verification before merge.

## Task 1: Define the failing contract

**Create:** `src/lib/pdi-authorization-hardening.test.ts`

The contract must require:

- migration `supabase/migrations/20260717270000_harden_pdi_authorization.sql`;
- unique shared-store backfill for legacy sessions;
- session creation identity and self-target guards;
- seller membership validation with `tem_papel_loja`;
- caller authorization with internal MX, manager, or owner checks;
- approval loading the action joined to its session before mutation;
- explicit self-approval denial;
- approval limited to assigned manager, owner, or internal MX;
- audit insertion into `logs_auditoria`;
- fixed search path and explicit grants;
- transaction and documented rollback.

Run:

```bash
bun test --isolate src/lib/pdi-authorization-hardening.test.ts
```

Expected RED: migration file does not exist.

## Task 2: Implement the minimal migration

**Create:** `supabase/migrations/20260717270000_harden_pdi_authorization.sql`

### Legacy backfill

Populate `pdi_sessoes.loja_id` only when a session with null store has exactly one active common store between:

- collaborator active vínculo; and
- assigned manager active vínculo with role `gerente` or `dono`.

### `create_pdi_session_bundle`

- Require `auth.uid()`.
- Parse collaborator/store/cargo IDs.
- Deny `collaborator_id = auth.uid()`.
- If store omitted, resolve exactly one authorized active store:
  - internal MX: collaborator active seller store;
  - otherwise: common store where caller is manager/owner and collaborator is seller.
- Require collaborator active seller vínculo in resolved store.
- Require caller to be internal MX, manager, or owner of resolved store.
- Preserve bundle inserts and initial status `draft`.
- Set `gerente_id = auth.uid()` and fixed `search_path`.

### `approve_pdi_action_evidence`

- Require `auth.uid()`.
- Load action plus session with `FOR UPDATE` before authorization.
- Deny nonexistent action.
- Deny collaborator self-approval.
- Allow assigned `gerente_id`, store owner, or internal MX.
- Preserve status update to `concluido`, `aprovado_por`, and `data_aprovacao`.
- Insert `logs_auditoria` with old/new status, session/store/collaborator IDs, and approval payload.

### ACL

For both functions:

```sql
REVOKE ALL ... FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ... TO authenticated, service_role;
```

Document `-- DOWN` and wrap in `BEGIN`/`COMMIT`.

## Task 3: Verify and release

1. Run focused test, full unit suite, typecheck, build, migration reversibility, and RLS matrix.
2. Open a draft PR and wait for all permanent checks.
3. Apply migration to Supabase production only after CI passes.
4. Verify ACLs: `anon=false`, `authenticated=true`, `service_role=true` for both RPCs.
5. Verify behavior without persistence using PL/pgSQL subtransactions:
   - seller cannot create PDI session;
   - manager can create for active seller in own store;
   - collaborator cannot approve own action;
   - assigned manager can approve action;
   - successful test mutations roll back inside exception blocks.
6. Verify four legacy sessions receive their unique store and no ambiguous/null session is modified blindly.
7. Re-run security advisors.
8. Confirm no review threads, mark ready, squash merge, and inspect post-merge Vercel status without manual deployment.