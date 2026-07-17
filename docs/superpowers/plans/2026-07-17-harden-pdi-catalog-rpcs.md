# PDI Catalog RPC Hardening Plan

> **For agentic workers:** Use superpowers:test-driven-development and superpowers:verification-before-completion.

**Goal:** Remove anonymous access from PDI catalog RPCs and make development helper functions internal-only without breaking authenticated frontend flows.

**Architecture:** Preserve the two frontend RPC signatures and response shapes. Require an authenticated identity or `service_role`, use a fixed `search_path`, and grant execution only to `authenticated` and `service_role`. Revoke direct public execution from helper functions that are only called by protected `SECURITY DEFINER` generators.

## Constraints

- Preserve:
  - `get_pdi_form_template(uuid) returns jsonb`;
  - `get_suggested_actions(uuid) returns jsonb`.
- Keep frontend calls in `usePDI_MX.ts` working for authenticated users.
- Do not expose PDI catalogs to anonymous sessions.
- Do not expose internal recommendation helpers as public RPCs.
- Do not change catalog contents, ordering, formulas or response keys.
- Do not trigger a manual Vercel deployment.

## Task 1: Red contract

Create `src/lib/pdi-catalog-rpc-authorization.test.ts` requiring migration `20260717295000_harden_pdi_catalog_rpcs.sql`.

The contract must require:

- both catalog RPCs derive `auth.uid()` and `auth.role()`;
- non-service calls without identity raise SQLSTATE `42501`;
- both use `SECURITY DEFINER SET search_path TO 'public'`;
- existing return structures and ordering remain present;
- `PUBLIC` and `anon` lose execute on both catalog RPCs;
- `authenticated` and `service_role` retain execute;
- helper functions lose execution for `PUBLIC`, `anon` and `authenticated`;
- only `service_role` retains direct helper execution;
- migration is transactional and documents rollback.

Confirm RED because the migration does not exist.

## Task 2: Migration

Create `supabase/migrations/20260717295000_harden_pdi_catalog_rpcs.sql`.

### Catalog RPCs

- require authenticated identity unless `service_role`;
- preserve current catalog queries and JSON shapes;
- preserve cargo-not-found behavior;
- add fixed `search_path` to `get_suggested_actions`;
- reset ACLs explicitly before grants.

### Internal helpers

For:

- `mx_development_theme_from_text(text)`;
- `mx_first_active_training_for_theme(text,uuid)`;

revoke direct execution from `PUBLIC`, `anon` and `authenticated`; grant only `service_role`. Protected owner-executed functions continue to call them internally.

## Task 3: Verify and release

1. Run focused test, typecheck, full unit suite, build, reversibility and pgTAP RLS matrix.
2. Apply migration to Supabase production after green gates.
3. Verify active definitions and ACLs.
4. Run rollback-safe probes:
   - anonymous role cannot execute catalog RPCs or helpers;
   - authenticated user can load both catalog RPCs;
   - helper calls still work through the protected recommendation generators;
   - direct authenticated helper execution is denied;
   - response structures remain unchanged.
5. Re-run security advisors.
6. Review, merge with fresh green gates and inspect automatic Vercel status without manual deployment.
