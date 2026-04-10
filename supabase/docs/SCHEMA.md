# MX Performance Database Schema (Supabase)

## Introduction

This document provides a comprehensive mapping of the **MX Performance** database schema, as of April 2026. It reflects the canonical domain alignment and the integration of the **PDI MX 360** module.

---

## 🏛️ Core Domain Entities

### 1. Identity & Access
- **`public.users`**: Core user profiles.
  - `id` (uuid, primary key)
  - `role` (text): `admin`, `dono`, `gerente`, `vendedor`.
  - `is_venda_loja` (boolean): Flag for special seller type.
  - `active` (boolean): Soft-delete status.
- **`public.memberships`**: Relationship between users and stores.
  - `user_id` (uuid) -> `public.users(id)`
  - `store_id` (uuid) -> `public.stores(id)`
  - `role` (text): Specific role within the store.

### 2. Organization
- **`public.stores`**: Business units (Lojas).
  - `id` (uuid, primary key)
  - `name` (text)
  - `source_mode` (text): `legacy_forms`, `native_app`, `hybrid`.
- **`public.store_sellers`**: Active seller assignments to stores with tenure tracking.
  - `store_id` (uuid), `seller_user_id` (uuid), `started_at` (date).

### 3. Operational Metrics
- **`public.daily_checkins`**: The "Heart" of the system. Stores daily performance data.
  - `seller_user_id` (uuid)
  - `store_id` (uuid)
  - `reference_date` (date)
  - Metrics: `leads_prev_day`, `agd_cart_today`, `agd_net_today`, `vnd_porta_prev_day`, `vnd_cart_prev_day`, `vnd_net_prev_day`, `visit_prev_day`.
- **`public.store_meta_rules`**: Goals and benchmarking rules per store.
  - `monthly_goal` (numeric)
  - `individual_goal_mode` (text): `even`, `custom`, `proportional`.
  - `bench_*` (integer): Thresholds for conversion funnels.

---

## 📈 PDI MX 360 Module

### 1. Catalog Tables (Fixed Data)
- **`public.pdi_niveis_cargo`**: Career levels (1-5).
- **`public.pdi_competencias`**: Skills (Technical/Behavioral).
- **`public.pdi_acoes_sugeridas`**: Suggested development actions per competency.
- **`public.pdi_descritores_escala`**: Descriptive scale for evaluation.

### 2. Transactional Tables (Session Data)
- **`public.pdi_sessoes`**: Main PDI session record.
  - `colaborador_id`, `gerente_id`, `loja_id`, `status` (`draft`, `concluido`).
- **`public.pdi_avaliacoes_competencia`**: Individual scores within a session.
- **`public.pdi_plano_acao`**: Action items derived from the session.
- **`public.pdi_metas`**: Personal and professional goals.

---

## 🛠️ Utilities & Logs
- **`public.reprocess_logs`**: History of data imports and reprocessing tasks.
- **`public.raw_imports`**: Buffer for unprocessed data from external sources.
- **`public.store_meta_rules_history`**: Audit trail for goal changes.

---

## 🔗 Key Relationships & Constraints
- **UUIDs**: All primary and foreign keys use UUID v4.
- **Cascades**: Most child records use `ON DELETE CASCADE` linked to their parents (`store_id`, `user_id`, `sessao_id`).
- **Timestamps**: All tables include `created_at` and `updated_at` (managed by triggers).

---

## 🛡️ Security Pattern (RLS)
The database uses a **Role Matrix** security model implemented via SQL functions:
- `is_admin()`: Global access for admins.
- `is_owner_of(store_id)`: Access to store-wide data.
- `is_manager_of(store_id)`: Access to operational data for their store.
- `is_member_of(store_id)`: Basic access for sellers to their own data.

*See `DB-AUDIT.md` for current RLS coverage and security status.*
