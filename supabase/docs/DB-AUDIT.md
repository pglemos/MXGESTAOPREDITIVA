# Database Security & Quality Audit (DB-AUDIT)

**Status:** ACTIVE
**Version:** 1.0
**Criticality:** 🔥 HIGH
**Responsible:** @data-engineer (Dara)

## 1. Security Compliance (RLS)
- [x] **daily_checkins:** Protected via `role_matrix_daily_checkins_select`. Prevents cross-store data leaks.
- [x] **users:** Protected. Sellers cannot list emails of other units.
- [x] **checkin_audit_logs:** Immutable. Only accessible by `Admin/Dono/Gerente`.
- [!] **GAP:** Some helper functions used in RLS are `STABLE` instead of `IMMUTABLE`, which may slightly impact performance under high load.

## 2. Identified Technical Debts (Data Level)
- **[CRITICAL] Enum Fragmentation:** `source_mode` and `individual_goal_mode` in `store_meta_rules` are still enforced via `CHECK` constraints on `TEXT` columns instead of native PG Enums.
- **[HIGH] Missing Indexes:** Need indexes on `created_at` for high-volume logs (`checkin_audit_logs`, `reprocess_logs`) to optimize long-term history queries.
- **[MEDIUM] Orphan Data:** The `memberships` table needs a cleanup script to ensure no user is orphaned from a deleted store.
- **[MEDIUM] RPC Complexity:** `process_import_data` is performing heavy logic inside a loop. Consider sharding into smaller batches for very large CSVs (>10k rows).

## 3. Maintenance Readiness
- **Migrations:** Consistent and timestamped.
- **Seed Data:** Sandbox seed exists (`scripts/seed_live_sandbox.ts`).
- **Backup:** Handled by Supabase Standard PITR.

---
**Audit Date:** April 11, 2026
**Approval:** Orion (Master Orchestrator)
