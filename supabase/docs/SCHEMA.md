# Database Schema - MX Performance

**Status:** ACTIVE
**Version:** 1.1
**Engine:** PostgreSQL (Supabase)
**Responsible:** @data-engineer (Dara)

## 1. Core Tables

### `users`
- **Purpose:** Canonical user registry with hierarchical roles.
- **Columns:** `id (UUID)`, `name`, `email`, `role (ENUM)`, `is_venda_loja (BOOL)`, `phone`, `active`, `created_at`, `updated_at`.

### `stores`
- **Purpose:** Business units (unidades).
- **Columns:** `id (UUID)`, `name`, `active`, `source_mode (ENUM)`, `created_at`, `updated_at`.

### `daily_checkins`
- **Purpose:** The primary transactional table for operational metrics.
- **Columns:** `id (UUID)`, `seller_user_id`, `store_id`, `reference_date`, `metric_scope (ENUM)`, `leads_prev_day`, `visit_prev_day`, `vnd_porta_prev_day`, `vnd_cart_prev_day`, `vnd_net_prev_day`, `agd_cart_today`, `agd_net_today`, `zero_reason`, `submitted_at`.
- **Constraint:** Unique index on `(seller_user_id, store_id, reference_date)`.

### `store_meta_rules`
- **Purpose:** Governance configuration per unit.
- **Columns:** `store_id`, `monthly_goal`, `projection_mode (ENUM)`, `individual_goal_mode`, `include_venda_loja_in_store_total`, `include_venda_loja_in_individual_goal`, `bench_lead_agd`, `bench_agd_visita`, `bench_visita_vnd`.

## 2. Security (RLS) Matrix
- **Admin:** Bypass RLS (Full access via `is_admin()`).
- **Owner:** Full visibility within their assigned `store_id`.
- **Manager:** Full visibility within their `store_id`, can update meta rules and PDI.
- **Seller:** Visibility of their own data + shared unit ranking.

## 3. Operations & Automation
- **`process_import_data` (RPC):** Atomic ingestion of CSV mass data.
- **`sync_daily_checkins_canonical` (Trigger):** Ensures backward compatibility with legacy column names.
- **`store_meta_rules_history`:** Immutable log of changes to unit goals.

---
**Audit Date:** April 11, 2026
**Approval:** Quinn (QA)
