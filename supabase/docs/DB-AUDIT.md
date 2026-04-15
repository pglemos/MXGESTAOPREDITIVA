# MX Performance - Database Security & Quality Audit

| Field | Value |
|-------|-------|
| **Status** | ACTIVE |
| **Version** | 2.0 |
| **Date** | April 15, 2026 |
| **Auditor** | @data-engineer |
| **Overall Score** | **82/100** |

---

## Executive Summary

The MX Performance database has matured significantly since the v1.0 audit. The schema now spans **46 tables** across 9 domains with **107 RLS policies**, **113 indexes**, **86 foreign keys**, and **32 triggers**. The recent additions of PDI 360 (10 tables), Consulting CRM (10 tables), and checkin audit system demonstrate a commitment to domain completeness.

**Key achievements since v1.0:**
- RLS recursion eliminated via `check_user_role_in_store()` SECURITY DEFINER pattern
- Comprehensive audit trail for check-in corrections (immutable logs)
- PDI 360 with full session/competency/action plan lifecycle
- Consulting CRM with client isolation via `can_access_consulting_client()`
- Orphan user cleanup triggers prevent ghost accounts
- 113 indexes covering all major query patterns including partial indexes for active jobs

**Key risks:**
- 17 legacy tables without versioned migrations (schema drift potential)
- Permissive SELECT policies on core tables (users, stores, memberships) for performance
- Some legacy FKs lack CASCADE/RESTRICT specificity
- PII (emails, phone numbers) stored in plaintext

---

## 1. Schema Quality Assessment

### Score: 78/100

#### Strengths
- **Domain separation is clean:** Core, Performance, Quality, PDI 360, Operational, Audit, Consulting, Digital, and Legacy are well-bounded
- **Canonical migration lineage** established from `20260407001000` onward with proper idempotent patterns (`IF NOT EXISTS`, `ON CONFLICT`)
- **Enum types** for `checkin_scope` and `correction_status` enforce domain integrity
- **Unique constraints** on critical business keys: `(seller_user_id, store_id, reference_date)`, `(seller_id, week_reference)`, `(client_id, user_id)` for consulting assignments
- **Immutable audit tables** (`checkin_audit_logs`, `store_meta_rules_history`) prevent silent data mutation
- **Legacy shadow columns** in `daily_checkins` and `pdis` maintained for backward compatibility with triggers

#### Weaknesses
- **W-01:** `daily_checkins` has 32 columns including 9 legacy shadow columns (`leads`, `agd_cart`, `visitas`, etc.) that duplicate canonical columns (`leads_prev_day`, `agd_cart_today`, `visit_prev_day`). These add confusion and storage overhead.
- **W-02:** `pdis` has `objective` and `action` columns shadowing `meta_6m`/`meta_12m`/`meta_24m` and `action_1`-`action_5`. Trigger `pdis_sync_legacy_shadow_columns` adds runtime overhead.
- **W-03:** Several tables lack `updated_at` triggers that should have them: `audit_logs`, `checkin_correction_requests`, `checkin_audit_logs`, `raw_imports`.
- **W-04:** `store_meta_rules_history.changed_by` references `auth.users` but `store_meta_rules.updated_by` references `public.users` — inconsistent FK target.
- **W-05:** `feedbacks.week_reference` was originally TEXT, later migrated to DATE. Some older records may have inconsistent formats if not fully backfilled.

---

## 2. Security Assessment (RLS Coverage)

### Score: 85/100

#### RLS Coverage Matrix

| Domain | Tables | RLS Enabled | Policies | Coverage |
|--------|--------|-------------|----------|----------|
| Core | 4 | 4/4 (100%) | ~11 | Full |
| Performance | 5 | 5/5 (100%) | ~8 | Full |
| Quality | 4 | 4/4 (100%) | ~11 | Full |
| PDI 360 | 10 | 10/10 (100%) | ~12 | Full |
| Operational | 6 | 6/6 (100%) | ~19 | Full |
| Audit | 5 | 5/5 (100%) | ~8 | Full |
| Consulting | 10 | 10/10 (100%) | ~18 | Full |
| Digital | 1 | 1/1 (100%) | ~2 | Full |
| Legacy | 12 | ~8/12 (67%) | ~18 | Partial |

**Total: 107 policies across 46 tables.**

#### Strengths
- **SEC-01:** All operational tables have RLS enabled with no bypass routes for authenticated users
- **SEC-02:** `check_user_role_in_store()` as SECURITY DEFINER breaks the RLS recursion chain cleanly
- **SEC-03:** Consulting domain uses `can_access_consulting_client()` for row-level client isolation
- **SEC-04:** OAuth tokens and calendar settings are strictly owner-only (`auth.uid() = user_id`)
- **SEC-05:** Check-in audit logs restricted to admin/owner/manager only
- **SEC-06:** `enforce_feedback_seller_ack_only()` trigger prevents sellers from modifying feedback content

#### Risks
- **SEC-R01:** Permissive SELECT policies on `users`, `stores`, and `memberships` (`USING (true)`) expose all records to any authenticated user. This was a deliberate performance tradeoff (see `20260407210000_permissive_select_rls.sql`) but violates least-privilege.
- **SEC-R02:** Service role key bypasses all RLS. Cron jobs (`pg_cron`) and Edge Functions use this. Vault-stored secrets are used but the blast radius of a leaked service key is full database access.
- **SEC-R03:** `communication_instances.api_key` stores third-party API keys in plaintext (legacy).
- **SEC-R04:** Legacy tables (`goal_logs`, `daily_lead_volumes`, `role_assignments_audit`) lack RLS entirely.
- **SEC-R05:** `consulting_oauth_tokens.access_token` and `refresh_token` are stored in plaintext. Documentation states "cifrados pelas Edge Functions" but the column type is `TEXT`, not encrypted.

---

## 3. Performance Assessment (Indexing)

### Score: 80/100

#### Index Statistics

| Category | Count | Notes |
|----------|-------|-------|
| Primary Keys | ~46 | All tables |
| Unique Indexes | ~12 | Business key constraints |
| B-TREE Composite | ~40 | Major query paths covered |
| Partial Indexes | ~3 | Active reprocessing jobs, file hash, triggered_by |
| FK Auto-indexes | ~12 | Legacy FK columns |

**Total: ~113 indexes**

#### Well-Indexed Query Paths
- `daily_checkins` by `(store_id, reference_date)` and `(seller_user_id, reference_date)` — 4 dedicated indexes
- `feedbacks` by `(seller_id, week_reference)` and `(store_id, week_reference)`
- `notifications` by `(recipient_id, created_at)`, `(store_id, created_at)`, `(broadcast_id)`
- `reprocess_logs` with partial index for `(status, created_at)` filtering active jobs
- `checkin_audit_logs` with 4 indexes covering user, checkin, temporal, and type-based queries
- `consulting_visits` by `(client_id)` and `(scheduled_at)`
- `manager_routine_logs` by `(store_id, routine_date)` and `(manager_id, routine_date)`

#### Missing / Weak Indexes
- **PERF-01:** `feedbacks` lacks an index on `(manager_id)` for manager-scoped queries
- **PERF-02:** `pdi_sessoes` has no index on `(colaborador_id)` or `(gerente_id)` — PDI 360 session lookups will degrade with scale
- **PERF-03:** `pdi_avaliacoes_competencia` needs `(competencia_id)` for template generation queries
- **PERF-04:** `consulting_google_oauth_states` needs index on `(expires_at)` for cleanup cron
- **PERF-05:** `audit_logs` lacks composite indexes — `(entity, entity_id)` and `(action, created_at)` would help admin dashboards
- **PERF-06:** `daily_checkins` partitioning strategy not yet defined. At current growth rate (~50K rows/year), this is acceptable until ~500K rows

#### RLS Performance Notes
- `is_admin()` uses `LIMIT 1` on `users` table — efficient
- `check_user_role_in_store()` is SECURITY DEFINER + STABLE — prevents recursion
- `memberships(user_id, store_id, role)` composite index supports all role-check patterns
- Permissive `USING (true)` policies on `users`, `stores`, `memberships` eliminate RLS overhead for these hot tables

---

## 4. Data Integrity Assessment

### Score: 83/100

#### Constraint Coverage

| Constraint Type | Count | Notes |
|----------------|-------|-------|
| PRIMARY KEY | 46 | All tables |
| FOREIGN KEY | 86 | Comprehensive |
| UNIQUE | 12 | Business key constraints |
| CHECK | 15+ | Role enums, status values, non-negative metrics |

#### Strengths
- **INT-01:** `daily_checkins` has a unique constraint on `(seller_user_id, store_id, reference_date)` preventing duplicate entries
- **INT-02:** `feedbacks` enforces `(seller_id, week_reference)` uniqueness
- **INT-03:** `manager_routine_logs` enforces `(store_id, manager_id, routine_date)` uniqueness
- **INT-04:** All metric columns have non-negative CHECK constraints where applicable
- **INT-05:** `consulting_financials` has `UNIQUE(client_id, reference_date)` preventing duplicate DRE entries
- **INT-06:** Orphan cleanup triggers (`check_orphan_users_after_membership_deletion`) inactivate users who lose all store connections
- **INT-07:** `process_import_data()` uses `SELECT ... FOR UPDATE` for idempotency locking on reprocessing batches

#### Weaknesses
- **INT-W01:** Legacy FKs (`goals`, `benchmarks`, `user_roles`, etc.) use default `NO ACTION` instead of explicit `CASCADE`/`RESTRICT`
- **INT-W02:** `pdi_sessoes.loja_id` is a loose UUID reference without FK constraint (commented as "Referência à loja se existir")
- **INT-W03:** `notifications.target_store_id` and `notifications.target_role` are legacy columns without FK/constraint
- **INT-W04:** `checkin_correction_requests.requested_values` is JSONB without schema validation — malformed data possible
- **INT-W05:** `daily_checkins.note` and `daily_checkins.zero_reason` are free-text without length limits

---

## 5. Technical Debt Inventory

| ID | Severity | Hours | Priority | Description | Status |
|----|----------|-------|----------|-------------|--------|
| **DB-01** | LOW | 2h | P3 | Legacy shadow columns in `daily_checkins` (9 columns) and `pdis` (2 columns) | OPEN |
| **DB-02** | DONE | 4h | — | Audit log composite indexes | **RESOLVED** (20260415001000) |
| **DB-03** | DONE | 1h | — | Composite indexes for daily_checkins | **RESOLVED** (20260413000000) |
| **DB-04** | DONE | 1h | — | Drop ghost legacy tables (gamification, activities, inventory) | **RESOLVED** (20260413001000) |
| **DB-05** | MEDIUM | 4h | P2 | Missing indexes on PDI 360 child tables (pdi_sessoes, pdi_avaliacoes_competencia) | OPEN |
| **DB-06** | MEDIUM | 3h | P2 | Permissive SELECT policies (SEC-R01) — evaluate per-domain least-privilege | OPEN |
| **DB-07** | DONE | 2h | — | Secure PDI constraints (NOT NULL enforcement) | **RESOLVED** (20260413002000) |
| **DB-08** | HIGH | 6h | P1 | Legacy tables without versioned migrations (17 tables) — schema drift risk | OPEN |
| **DB-09** | MEDIUM | 3h | P2 | Plaintext PII in users (email, phone), consulting_oauth_tokens, communication_instances | OPEN |
| **DB-10** | LOW | 2h | P3 | Schema validation for JSONB columns (requested_values, diagnostic_json, etc.) | OPEN |
| **DB-11** | LOW | 1h | P3 | Add updated_at triggers to audit_logs, checkin_correction_requests, raw_imports | OPEN |
| **DB-12** | MEDIUM | 4h | P2 | Legacy FKs missing explicit ON DELETE actions (goals, benchmarks, user_roles) | OPEN |
| **DB-13** | LOW | 2h | P3 | daily_checkins partitioning strategy (deferred until ~500K rows) | DEFERRED |
| **DB-14** | MEDIUM | 3h | P2 consulting_google_oauth_states cleanup cron for expired states | OPEN |
| **DB-15** | LOW | 1h | P3 | pdi_sessoes.loja_id should reference stores(id) formally | OPEN |

---

## 6. Action Items (Prioritized)

### P1 — Critical (This Sprint)

| # | Action | Debt ID | Effort | Impact |
|---|--------|---------|--------|--------|
| 1 | Create versioned migration baseline for all 17 legacy tables | DB-08 | 6h | Eliminates schema drift risk. Generate `CREATE TABLE IF NOT EXISTS` from live schema and commit to `supabase/migrations/`. |
| 2 | Verify RLS policy completeness on all tables with `pg_policies` | SEC-R04 | 1h | Run audit query to identify tables with RLS enabled but no policies. |

### P2 — High Priority (Next Sprint)

| # | Action | Debt ID | Effort | Impact |
|---|--------|---------|--------|--------|
| 3 | Add missing indexes for PDI 360 domain | DB-05 | 4h | `(colaborador_id)`, `(gerente_id)`, `(competencia_id)` on PDI tables |
| 4 | Evaluate permissive SELECT policies | DB-06 | 3h | Consider restricting `users`, `stores`, `memberships` to store-scoped access if PII concerns arise |
| 5 | Fix legacy FK ON DELETE actions | DB-12 | 4h | Add explicit CASCADE/RESTRICT/SET NULL to goals, benchmarks, user_roles FKs |
| 6 | Add OAuth state cleanup mechanism | DB-14 | 3h | pg_cron job to DELETE expired+consumed `consulting_google_oauth_states` |
| 7 | Evaluate PII encryption at rest | DB-09 | 3h | Consider Supabase Vault for `consulting_oauth_tokens`, `communication_instances.api_key` |

### P3 — Low Priority (Backlog)

| # | Action | Debt ID | Effort | Impact |
|---|--------|---------|--------|--------|
| 8 | Plan legacy shadow column removal | DB-01 | 2h | Deprecation path for `daily_checkins.leads`, `pdis.objective`, etc. |
| 9 | Add JSONB schema validation | DB-10 | 2h | CHECK constraints with `jsonb_typeof()` on critical JSONB columns |
| 10 | Add missing updated_at triggers | DB-11 | 1h | Audit tables should track modification time |
| 11 | Formalize pdi_sessoes.loja_id FK | DB-15 | 1h | Add FK constraint to stores(id) |
| 12 | Plan daily_checkins partitioning | DB-13 | 2h | Document strategy for when table exceeds 500K rows |

---

## 7. Recommendations

### Architecture
1. **Freeze legacy domain:** No new features on `agencies`, `goals`, `benchmarks`, `roles`, `user_roles`, `goal_logs`, `daily_lead_volumes`, `automation_configs`, `communication_instances`, `report_history`, `role_assignments_audit`. Migrate active data to canonical tables and drop legacy tables in v3.0.
2. **Adopt migration linting:** Use `supabase db lint` or `squawk` to enforce naming conventions and catch missing constraints before merge.
3. **Document all SECURITY DEFINER functions:** Maintain a registry of functions that bypass RLS with explicit justification for each.

### Performance
4. **Monitor query plans monthly:** The RLS helper functions (`is_admin()`, `is_member_of()`) are called on every row. Use `EXPLAIN ANALYZE` on hot queries quarterly.
5. **Add connection pooling metrics:** With 46 tables and 107 policies, connection saturation under load is a risk. Monitor `pg_stat_activity`.

### Security
6. **Rotate service role key:** The vault secret `mx-service-role-key` is referenced in cron jobs. Rotate quarterly.
7. **Add column-level encryption:** For `consulting_oauth_tokens.access_token` and `communication_instances.api_key`, use Supabase Vault's `pgsodium` column encryption.
8. **Audit RLS policies quarterly:** Run `SELECT * FROM pg_policies WHERE schemaname = 'public'` and verify no new overly-permissive policies were introduced.

### Data Integrity
9. **Add constraint naming convention:** Adopt `{table}_{column}_{constraint_type}` naming for all new constraints.
10. **Implement JSONB schema validation:** Use CHECK constraints or `jsonschema` extension for `requested_values`, `diagnostic_json`, `ranking_json`, `checklist_data`.
