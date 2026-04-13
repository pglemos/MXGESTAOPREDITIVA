# Supabase Database Schema

**Project:** MX Performance
**Auditor:** @data-engineer (Dara)
**Status:** Validated

## 1. Schema Overview

The database is built on PostgreSQL (Supabase) and relies heavily on Row Level Security (RLS) for multi-tenant data isolation. The schema is normalized for the operational needs of the MX Gestão Preditiva methodology.

### 1.1 Core Entities

#### `users`
- **Purpose:** Core authentication and identity.
- **Fields:** `id` (PK, UUID), `name`, `email`, `role` (admin | dono | gerente | vendedor), `avatar_url`, `is_venda_loja`, `active`, `phone`, `store_id`.
- **Relationships:** Links to `stores` via `store_id`.

#### `stores`
- **Purpose:** Represents a dealership unit.
- **Fields:** `id` (PK, UUID), `name`, `manager_email`, `active`, `source_mode`, `created_at`, `updated_at`.

#### `store_sellers` (Membership)
- **Purpose:** Associates users with multiple stores (multi-tenant mapping).
- **Fields:** `id` (PK), `store_id` (FK), `seller_id` (FK), `is_active`.

#### `store_meta_rules`
- **Purpose:** Rules and benchmarks for store performance projection.
- **Fields:** `store_id` (PK/FK), `monthly_goal`, `individual_goal_mode`, `include_venda_loja_in_store_total`, `include_venda_loja_in_individual_goal`, `bench_lead_agd`, `bench_agd_visita`, `bench_visita_vnd`, `projection_mode`.

### 1.2 Transactional Entities

#### `daily_checkins`
- **Purpose:** Daily production tracking for sellers.
- **Fields:** `id` (PK), `seller_user_id` (FK), `store_id` (FK), `reference_date`, `metric_scope`, `submission_status`. Contains counters for leads, agendamentos, visits, and vendas (D-0 and D-1 logic).

#### `checkin_correction_requests`
- **Purpose:** Workflow for retroactively correcting check-ins.
- **Fields:** `id` (PK), `checkin_id` (FK), `reason`, `status`, `auditor_id`, `requested_values`.

#### `checkin_audit_logs`
- **Purpose:** Immutable audit trail for check-in modifications.
- **Fields:** `id` (PK), `checkin_id` (FK), `old_values`, `new_values`, `change_type`.

### 1.3 Management Entities

#### `feedbacks`
- **Purpose:** Weekly structured feedback from managers to sellers.
- **Fields:** `id` (PK), `store_id` (FK), `manager_id` (FK), `seller_id` (FK), `week_reference`, conversion rates, commitments.

#### `pdis` (Plano de Desenvolvimento Individual)
- **Purpose:** Long-term development plans for sellers.
- **Fields:** `id` (PK), `store_id` (FK), `manager_id` (FK), `seller_id` (FK), competences scoring, long-term goals, action plans.

## 2. Migrations Snapshot

The project utilizes Supabase migrations. Recent operational upgrades include:
- `20260407170000_fix_auth_rls.sql`: RLS hardening for multi-tenant access.
- `20260407200000_kill_rls_recursion.sql`: Performance fix for RLS infinite loops.
- `20260408_migration_data_full.sql`: Master data load/consolidation.
- `20260409135401_pdi_mx_360_foundation.sql`: PDI structural base.
- `20260411001000_checkin_audit_system.sql`: Audit table triggers for retroactive correction.

## 3. Architectural Strengths
- **Immutability:** Check-in audit logs and correction requests implement strict immutability.
- **Referential Integrity:** Strong foreign keys and typed enums constraint data drift.
- **RLS Driven:** All multi-tenant routing is physically separated at the database level via Postgres RLS.