# Broadcast Notification RPC Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent anonymous or out-of-scope users from sending broadcast notifications while preserving legitimate store-scoped manager/owner calls and service-role automation.

**Architecture:** Keep `public.send_broadcast_notification(...)` as the stable API contract, but make the database the authorization boundary. The RPC will derive the effective sender from `auth.uid()` for signed-in users, permit global fan-out only to `service_role` or internal MX users, permit store fan-out only to `service_role`, internal MX users, the store manager, or the store owner, and explicitly revoke execution from `PUBLIC` and `anon`.

**Tech Stack:** PostgreSQL 17, Supabase Auth helpers, PL/pgSQL, Bun tests, GitHub Actions.

## Global Constraints

- Apply least privilege and store/team scoping from the Módulo Gerencial functional specification.
- Keep the existing RPC signature and return type to avoid frontend and Edge Function breakage.
- Do not trust caller-provided `p_sender_id` for authenticated users.
- Preserve `service_role` support for scheduled and backend fan-out.
- Do not manually deploy Vercel for this database-only change.
- Use TDD: failing contract first, minimal migration second, full verification before merge.

---

### Task 1: Add the failing authorization contract

**Files:**
- Create: `src/lib/broadcast-notification-authorization.test.ts`
- Test: `src/lib/broadcast-notification-authorization.test.ts`

**Interfaces:**
- Consumes: migration path `supabase/migrations/20260717260000_harden_broadcast_notification_authorization.sql`.
- Produces: a static contract requiring identity, scope authorization, sender derivation, explicit grants, and rollback documentation.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20260717260000_harden_broadcast_notification_authorization.sql', import.meta.url),
  'utf8',
)
const compactSql = sql.replace(/\s+/g, ' ').trim()

describe('broadcast notification authorization migration', () => {
  test('keeps the canonical RPC signature and fixed search_path', () => {
    expect(compactSql).toContain('send_broadcast_notification(p_title text, p_message text, p_type text')
    expect(compactSql).toContain("SECURITY DEFINER SET search_path TO 'public'")
  })

  test('denies anonymous execution and preserves authenticated and service roles', () => {
    expect(compactSql).toContain('REVOKE ALL ON FUNCTION public.send_broadcast_notification')
    expect(compactSql).toContain('FROM PUBLIC, anon, authenticated, service_role')
    expect(compactSql).toContain('GRANT EXECUTE ON FUNCTION public.send_broadcast_notification')
    expect(compactSql).toContain('TO authenticated, service_role')
  })

  test('allows global fan-out only for service role or internal MX users', () => {
    expect(compactSql).toContain("auth.role() = 'service_role'")
    expect(compactSql).toContain('public.eh_area_interna_mx(v_caller)')
    expect(compactSql).toContain('Broadcast global restrito')
  })

  test('allows store fan-out only for authorized store management', () => {
    expect(compactSql).toContain('public.is_manager_of(p_store_id)')
    expect(compactSql).toContain('public.is_owner_of(p_store_id)')
    expect(compactSql).toContain('Broadcast da loja restrito')
  })

  test('does not trust p_sender_id for authenticated callers', () => {
    expect(compactSql).toContain("CASE WHEN auth.role() = 'service_role' THEN p_sender_id ELSE v_caller END")
  })

  test('is transactional and documents rollback', () => {
    expect(compactSql.startsWith('BEGIN;')).toBe(true)
    expect(compactSql).toContain('-- DOWN')
    expect(compactSql).toContain('COMMIT;')
  })
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
bun test --isolate src/lib/broadcast-notification-authorization.test.ts
```

Expected: failure because `20260717260000_harden_broadcast_notification_authorization.sql` does not exist.

- [ ] **Step 3: Commit the red contract**

```bash
git add src/lib/broadcast-notification-authorization.test.ts
git commit -m "test(db): define broadcast notification authorization contract"
```

---

### Task 2: Implement the minimal database hardening

**Files:**
- Create: `supabase/migrations/20260717260000_harden_broadcast_notification_authorization.sql`
- Test: `src/lib/broadcast-notification-authorization.test.ts`

**Interfaces:**
- Consumes: `auth.uid()`, `auth.role()`, `public.eh_area_interna_mx(uuid)`, `public.is_manager_of(uuid)`, and `public.is_owner_of(uuid)`.
- Produces: the unchanged RPC signature returning a broadcast UUID.

- [ ] **Step 1: Implement the migration**

The function must:

```sql
BEGIN;

CREATE OR REPLACE FUNCTION public.send_broadcast_notification(
  p_title text,
  p_message text,
  p_type text DEFAULT 'system'::text,
  p_priority text DEFAULT 'medium'::text,
  p_store_id uuid DEFAULT NULL::uuid,
  p_target_role text DEFAULT 'todos'::text,
  p_link text DEFAULT NULL::text,
  p_sender_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_effective_sender uuid;
  v_user_record record;
  v_broadcast_id uuid := gen_random_uuid();
BEGIN
  IF auth.role() <> 'service_role' AND v_caller IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.' USING ERRCODE = '42501';
  END IF;

  IF p_store_id IS NULL THEN
    IF auth.role() <> 'service_role' AND NOT public.eh_area_interna_mx(v_caller) THEN
      RAISE EXCEPTION 'Broadcast global restrito a equipe interna MX.' USING ERRCODE = '42501';
    END IF;
  ELSIF auth.role() <> 'service_role'
    AND NOT public.eh_area_interna_mx(v_caller)
    AND NOT public.is_manager_of(p_store_id)
    AND NOT public.is_owner_of(p_store_id)
  THEN
    RAISE EXCEPTION 'Broadcast da loja restrito a gestao autorizada.' USING ERRCODE = '42501';
  END IF;

  v_effective_sender := CASE
    WHEN auth.role() = 'service_role' THEN p_sender_id
    ELSE v_caller
  END;

  -- Preserve the existing fan-out loop and insert columns, replacing only sender_id with v_effective_sender.
  RETURN v_broadcast_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.send_broadcast_notification(text,text,text,text,uuid,text,text,uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_broadcast_notification(text,text,text,text,uuid,text,text,uuid)
  TO authenticated, service_role;

-- DOWN
-- Restore the previous function definition and grants if rollback is required.

COMMIT;
```

- [ ] **Step 2: Run the focused test and verify GREEN**

```bash
bun test --isolate src/lib/broadcast-notification-authorization.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Run migration reversibility validation**

```bash
node scripts/check_migration_reversibility.mjs --changed-only
```

Expected: exit code 0.

- [ ] **Step 4: Commit the migration**

```bash
git add supabase/migrations/20260717260000_harden_broadcast_notification_authorization.sql
git commit -m "fix(db): harden broadcast notification authorization"
```

---

### Task 3: Verify locally, in CI, and in Supabase production

**Files:**
- Modify only if verification finds a defect: the migration or focused test above.

**Interfaces:**
- Produces: verified ACL and behavior evidence for the pull request.

- [ ] **Step 1: Run repository gates**

```bash
npm run typecheck
bun test --isolate src/lib/broadcast-notification-authorization.test.ts
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Open a draft PR and wait for permanent repository checks**

Expected checks include typecheck, unit tests, build/bundle budget, RLS matrix, migration reversibility, Gitleaks, accessibility, Atomic Design, and CodeRabbit.

- [ ] **Step 3: Apply the migration through Supabase only after CI passes**

Apply `20260717260000_harden_broadcast_notification_authorization.sql` to project `fbhcmzzgwjdgkctlfvbo`.

- [ ] **Step 4: Verify production privileges and definitions**

Verify:

```sql
SELECT
  has_function_privilege('anon', 'public.send_broadcast_notification(text,text,text,text,uuid,text,text,uuid)', 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', 'public.send_broadcast_notification(text,text,text,text,uuid,text,text,uuid)', 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', 'public.send_broadcast_notification(text,text,text,text,uuid,text,text,uuid)', 'EXECUTE') AS service_execute;
```

Expected: `false`, `true`, `true`.

- [ ] **Step 5: Verify behavior transactionally**

Use role/JWT claim simulation in a transaction to prove:
- anonymous caller receives SQLSTATE `42501`;
- seller cannot broadcast to a store;
- manager of the store passes authorization;
- internal MX user can send global broadcast;
- test transaction rolls back so no notifications persist.

- [ ] **Step 6: Re-run Supabase security advisors**

Expected: `send_broadcast_notification` disappears from the anonymous execution warning list.

- [ ] **Step 7: Remove any temporary CI workflow, rerun permanent checks, and merge with squash**

Do not trigger a manual Vercel deployment. Record the automatic Vercel status separately from the database verification.