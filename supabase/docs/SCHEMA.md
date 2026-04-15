# MX Performance - Database Schema Reference

| Field | Value |
|-------|-------|
| **Status** | ACTIVE |
| **Version** | 2.0 |
| **Date** | April 15, 2026 |
| **Auditor** | @data-engineer |
| **Engine** | PostgreSQL 17 (Supabase) |
| **Extensions** | uuid-ossp, pgcrypto, pg_cron, pg_net |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Tables | 46 |
| Views | 4 |
| Enums | 2 |
| Foreign Keys | 86 |
| Indexes | 113 |
| RLS Policies | 107 |
| Functions | 34 |
| Triggers | 32 |

---

## Enums

### `public.checkin_scope`
| Value | Description |
|-------|-------------|
| `daily` | Regular daily check-in |
| `adjustment` | Corrected after approval |
| `historical` | Imported from legacy data |

### `public.correction_status`
| Value | Description |
|-------|-------------|
| `pending` | Awaiting manager review |
| `approved` | Correction accepted |
| `rejected` | Correction denied |

---

## Tables

### 1. Core Domain

#### `users` (10 columns)
Identity and authentication profile for all MX platform users.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | — (PK, FK → auth.users) |
| `name` | TEXT | NO | — |
| `email` | TEXT | NO | — (UNIQUE) |
| `role` | TEXT | NO | `'vendedor'` (CHECK: admin, dono, gerente, vendedor) |
| `avatar_url` | TEXT | YES | NULL |
| `is_venda_loja` | BOOLEAN | NO | `FALSE` |
| `active` | BOOLEAN | NO | `TRUE` |
| `phone` | TEXT | YES | NULL |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `stores` (7 columns)
Dealership units in the MX network.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `name` | TEXT | NO | — |
| `active` | BOOLEAN | NO | `TRUE` |
| `source_mode` | TEXT | NO | `'native_app'` (CHECK: legacy_forms, native_app, hybrid) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `memberships` (5 columns)
Multi-tenant binding of users to stores with role context.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `user_id` | UUID | NO | — (FK → users.id) |
| `store_id` | UUID | NO | — (FK → stores.id) |
| `role` | TEXT | NO | `'vendedor'` (CHECK: dono, gerente, vendedor) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `daily_checkins` (32 columns)
Daily production metrics per seller per store. The heart of MX data capture.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `store_id` | UUID | NO | — (FK → stores.id) |
| `seller_user_id` | UUID | NO | — (FK → users.id) |
| `submitted_at` | TIMESTAMPTZ | NO | `NOW()` |
| `reference_date` | DATE | NO | `CURRENT_DATE` |
| `submitted_late` | BOOLEAN | NO | `FALSE` |
| `submission_status` | TEXT | NO | `'on_time'` (CHECK: on_time, late) |
| `edit_locked_at` | TIMESTAMPTZ | YES | NULL |
| `metric_scope` | CHECKIN_SCOPE | NO | `'daily'` |
| `leads_prev_day` | INTEGER | NO | `0` |
| `agd_cart_prev_day` | INTEGER | NO | `0` |
| `agd_net_prev_day` | INTEGER | NO | `0` |
| `agd_cart_today` | INTEGER | NO | `0` |
| `agd_net_today` | INTEGER | NO | `0` |
| `vnd_porta_prev_day` | INTEGER | NO | `0` |
| `vnd_cart_prev_day` | INTEGER | NO | `0` |
| `vnd_net_prev_day` | INTEGER | NO | `0` |
| `visit_prev_day` | INTEGER | NO | `0` |
| `zero_reason` | TEXT | YES | NULL |
| `note` | TEXT | YES | NULL |
| `created_by` | UUID | YES | NULL (FK → users.id) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |
| `user_id` | UUID | YES | NULL (FK → users.id, legacy compat) |
| `date` | DATE | YES | NULL (legacy compat shadow) |
| `leads` | INTEGER | YES | NULL (legacy compat shadow) |
| `agd_cart` | INTEGER | YES | NULL (legacy compat shadow) |
| `agd_net` | INTEGER | YES | NULL (legacy compat shadow) |
| `vnd_porta` | INTEGER | YES | NULL (legacy compat shadow) |
| `vnd_cart` | INTEGER | YES | NULL (legacy compat shadow) |
| `vnd_net` | INTEGER | YES | NULL (legacy compat shadow) |
| `visitas` | INTEGER | YES | NULL (legacy compat shadow) |

**Unique Constraint:** `(seller_user_id, store_id, reference_date)`

---

### 2. Performance Domain

#### `store_meta_rules` (10 columns)
Meta configuration, goal mode, benchmarks, and projection settings per store.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `store_id` | UUID | NO | — (PK, FK → stores.id) |
| `monthly_goal` | NUMERIC(12,2) | NO | `0` |
| `individual_goal_mode` | TEXT | NO | `'even'` (CHECK: even, custom, proportional) |
| `include_venda_loja_in_store_total` | BOOLEAN | NO | `TRUE` |
| `include_venda_loja_in_individual_goal` | BOOLEAN | NO | `FALSE` |
| `bench_lead_agd` | INTEGER | NO | `20` |
| `bench_agd_visita` | INTEGER | NO | `60` |
| `bench_visita_vnd` | INTEGER | NO | `33` |
| `updated_by` | UUID | YES | NULL (FK → users.id) |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |
| `projection_mode` | PROJECTION_MODE | NO | `'calendar'` |

#### `store_meta_rules_history` (6 columns)
Immutable audit trail for configuration changes.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `store_id` | UUID | YES | NULL (FK → stores.id) |
| `changed_by` | UUID | YES | NULL (FK → users.id) |
| `old_values` | JSONB | YES | NULL |
| `new_values` | JSONB | YES | NULL |
| `changed_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `store_benchmarks` (6 columns)
Conversion rate benchmarks per store (20/60/33 default).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `store_id` | UUID | NO | — (PK, FK → stores.id) |
| `lead_to_agend` | NUMERIC(5,2) | NO | `20.00` |
| `agend_to_visit` | NUMERIC(5,2) | NO | `60.00` |
| `visit_to_sale` | NUMERIC(5,2) | NO | `33.00` |
| `updated_by` | UUID | YES | NULL (FK → users.id) |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `store_delivery_rules` (9 columns)
Notification delivery configuration per store.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `store_id` | UUID | NO | — (PK, FK → stores.id) |
| `matinal_recipients` | TEXT[] | NO | `'{}'` |
| `weekly_recipients` | TEXT[] | NO | `'{}'` |
| `monthly_recipients` | TEXT[] | NO | `'{}'` |
| `whatsapp_group_ref` | TEXT | YES | NULL |
| `timezone` | TEXT | NO | `'America/Sao_Paulo'` |
| `active` | BOOLEAN | NO | `TRUE` |
| `updated_by` | UUID | YES | NULL (FK → users.id) |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `store_sellers` (9 columns)
Seller tenure tracking with start/end dates per store.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `store_id` | UUID | NO | — (FK → stores.id) |
| `seller_user_id` | UUID | NO | — (FK → users.id) |
| `started_at` | DATE | NO | `CURRENT_DATE` |
| `ended_at` | DATE | YES | NULL |
| `is_active` | BOOLEAN | NO | `TRUE` |
| `closing_month_grace` | BOOLEAN | NO | `FALSE` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

**Unique Index:** `(store_id, seller_user_id, started_at)`

---

### 3. Quality Domain

#### `feedbacks` (23 columns)
Weekly structured feedback from managers to sellers.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `store_id` | UUID | YES | NULL (FK → stores.id) |
| `manager_id` | UUID | YES | NULL (FK → users.id) |
| `seller_id` | UUID | YES | NULL (FK → users.id) |
| `week_reference` | DATE | NO | — |
| `leads_week` | INTEGER | NO | `0` |
| `agd_week` | INTEGER | NO | `0` |
| `visit_week` | INTEGER | NO | `0` |
| `vnd_week` | INTEGER | NO | `0` |
| `tx_lead_agd` | NUMERIC(5,2) | NO | `0` |
| `tx_agd_visita` | NUMERIC(5,2) | NO | `0` |
| `tx_visita_vnd` | NUMERIC(5,2) | NO | `0` |
| `meta_compromisso` | INTEGER | NO | `0` |
| `positives` | TEXT | YES | NULL |
| `attention_points` | TEXT | YES | NULL |
| `action` | TEXT | YES | NULL |
| `notes` | TEXT | YES | NULL |
| `team_avg_json` | JSONB | NO | `'{}'` |
| `diagnostic_json` | JSONB | NO | `'{}'` |
| `commitment_suggested` | INTEGER | NO | `0` |
| `acknowledged` | BOOLEAN | YES | `FALSE` |
| `acknowledged_at` | TIMESTAMPTZ | YES | NULL |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |

**Unique Constraint:** `(seller_id, week_reference)`

#### `weekly_feedback_reports` (14 columns)
Aggregated weekly report per store with delivery tracking.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `store_id` | UUID | NO | — (FK → stores.id) |
| `week_start` | DATE | NO | — |
| `week_end` | DATE | NO | — |
| `team_avg_json` | JSONB | NO | `'{}'` |
| `ranking_json` | JSONB | NO | `'[]'` |
| `benchmark_json` | JSONB | NO | `'{}'` |
| `weekly_goal` | INTEGER | NO | `0` |
| `report_url` | TEXT | YES | NULL |
| `email_status` | TEXT | NO | `'not_sent'` (CHECK: dry_run, sent, failed, not_sent) |
| `recipients` | TEXT[] | NO | `'{}'` |
| `warnings` | TEXT[] | NO | `'{}'` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

**Unique Constraint:** `(store_id, week_start, week_end)`

#### `pdis` (29 columns)
Individual Development Plans (legacy PDI 2.0 with competence scoring).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `store_id` | UUID | NO | — (FK → stores.id) |
| `manager_id` | UUID | NO | — (FK → users.id) |
| `seller_id` | UUID | NO | — (FK → users.id) |
| `comp_prospeccao` | INTEGER | YES | `6` |
| `comp_abordagem` | INTEGER | YES | `6` |
| `comp_demonstracao` | INTEGER | YES | `6` |
| `comp_fechamento` | INTEGER | YES | `6` |
| `comp_crm` | INTEGER | YES | `6` |
| `comp_digital` | INTEGER | YES | `6` |
| `comp_disciplina` | INTEGER | YES | `6` |
| `comp_organizacao` | INTEGER | YES | `6` |
| `comp_negociacao` | INTEGER | YES | `6` |
| `comp_produto` | INTEGER | YES | `6` |
| `meta_6m` | TEXT | NO | — |
| `meta_12m` | TEXT | NO | — |
| `meta_24m` | TEXT | NO | — |
| `action_1` | TEXT | NO | — |
| `action_2` | TEXT | YES | NULL |
| `action_3` | TEXT | YES | NULL |
| `action_4` | TEXT | YES | NULL |
| `action_5` | TEXT | YES | NULL |
| `due_date` | DATE | YES | NULL |
| `status` | TEXT | NO | `'aberto'` |
| `acknowledged` | BOOLEAN | NO | `FALSE` |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |
| `objective` | TEXT | YES | NULL (legacy shadow) |
| `action` | TEXT | YES | NULL (legacy shadow) |

#### `pdi_reviews` (7 columns)
Follow-up reviews for legacy PDI plans.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `pdi_id` | UUID | NO | — (FK → pdis.id) |
| `evolution` | TEXT | NO | — |
| `difficulties` | TEXT | YES | NULL |
| `adjustments` | TEXT | YES | NULL |
| `next_review_date` | DATE | YES | NULL |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |

---

### 4. PDI 360 Domain

#### `pdi_niveis_cargo` (5 columns)
Cargo level scale definitions (levels 1-5).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `nivel` | INTEGER | NO | — |
| `nome` | VARCHAR(255) | NO | — |
| `nota_min` | INTEGER | NO | — |
| `nota_max` | INTEGER | NO | — |

#### `pdi_descritores_escala` (5 columns)
Scale descriptors per cargo level.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `nivel_cargo_id` | UUID | NO | — (FK → pdi_niveis_cargo.id) |
| `nota` | INTEGER | NO | — |
| `descritor` | VARCHAR(255) | NO | — |
| `ordem` | INTEGER | NO | — |

#### `pdi_competencias` (6 columns)
18 competencies (10 technical + 8 behavioral).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `nome` | VARCHAR(255) | NO | — |
| `tipo` | VARCHAR(50) | NO | — (CHECK: tecnica, comportamental) |
| `descricao_completa` | TEXT | NO | — |
| `indicador` | VARCHAR(255) | NO | — |
| `ordem` | INTEGER | NO | — |

#### `pdi_acoes_sugeridas` (3 columns)
Suggested improvement actions per competency.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `competencia_id` | UUID | NO | — (FK → pdi_competencias.id) |
| `descricao_acao` | TEXT | NO | — |

#### `pdi_frases_inspiracionais` (2 columns)
Motivational phrases for PDI sessions.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `texto` | TEXT | NO | — |

#### `pdi_sessoes` (9 columns)
PDI 360 session instances (collaborator + manager).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `colaborador_id` | UUID | NO | — (FK → auth.users.id) |
| `gerente_id` | UUID | NO | — (FK → auth.users.id) |
| `loja_id` | UUID | YES | NULL |
| `data_realizacao` | TIMESTAMPTZ | YES | `NOW()` |
| `proxima_revisao_data` | TIMESTAMPTZ | YES | NULL |
| `status` | VARCHAR(50) | NO | `'draft'` (CHECK: draft, concluido) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `pdi_metas` (6 columns)
Goals per session (6/12/24 month horizons).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `sessao_id` | UUID | NO | — (FK → pdi_sessoes.id) |
| `prazo` | VARCHAR(50) | NO | — (CHECK: 6_meses, 12_meses, 24_meses) |
| `tipo` | VARCHAR(50) | NO | — (CHECK: pessoal, profissional) |
| `descricao` | TEXT | NO | — |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `pdi_avaliacoes_competencia` (6 columns)
Competency scoring per session.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `sessao_id` | UUID | NO | — (FK → pdi_sessoes.id) |
| `competencia_id` | UUID | NO | — (FK → pdi_competencias.id) |
| `nota_atribuida` | INTEGER | NO | — |
| `alvo` | INTEGER | NO | — |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `pdi_plano_acao` (13 columns)
Action plans derived from PDI sessions.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `sessao_id` | UUID | NO | — (FK → pdi_sessoes.id) |
| `competencia_id` | UUID | NO | — (FK → pdi_competencias.id) |
| `descricao_acao` | TEXT | NO | — |
| `data_conclusao` | DATE | NO | — |
| `impacto` | VARCHAR(50) | NO | — (CHECK: baixo, medio, alto) |
| `custo` | VARCHAR(50) | NO | — (CHECK: baixo, medio, alto) |
| `status` | VARCHAR(50) | NO | `'pendente'` (CHECK: pendente, em_andamento, concluido) |
| `evidencia_url` | TEXT | YES | NULL |
| `aprovado_por` | UUID | YES | NULL (FK → auth.users.id) |
| `data_aprovacao` | TIMESTAMPTZ | YES | NULL |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `pdi_objetivos_pessoais` (10 columns)
Personal development objectives per session.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `sessao_id` | UUID | NO | — (FK → pdi_sessoes.id) |
| `caracteristica` | VARCHAR(255) | NO | — |
| `itens_desenvolver` | TEXT | NO | — |
| `acao` | TEXT | NO | — |
| `data_conclusao` | DATE | NO | — |
| `status` | VARCHAR(50) | NO | `'pendente'` (CHECK: pendente, em_andamento, concluido) |
| `evidencia_url` | TEXT | YES | NULL |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

---

### 5. Operational Domain

#### `trainings` (8 columns)
Training video content catalog.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `title` | TEXT | NO | — |
| `description` | TEXT | YES | NULL |
| `type` | TEXT | YES | NULL |
| `video_url` | TEXT | NO | — |
| `target_audience` | TEXT | YES | NULL |
| `active` | BOOLEAN | YES | `TRUE` |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |

#### `training_progress` (4 columns)
Tracks which users completed which trainings.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `user_id` | UUID | YES | NULL (FK → users.id) |
| `training_id` | UUID | YES | NULL (FK → trainings.id) |
| `watched_at` | TIMESTAMPTZ | YES | `NOW()` |

#### `notifications` (16 columns)
Inbox notification system with broadcast support.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `recipient_id` | UUID | YES | NULL (FK → users.id) |
| `store_id` | UUID | YES | NULL (FK → stores.id) |
| `title` | TEXT | NO | — |
| `message` | TEXT | NO | — |
| `type` | TEXT | NO | `'system'` |
| `priority` | TEXT | NO | `'medium'` |
| `link` | TEXT | YES | NULL |
| `read` | BOOLEAN | NO | `FALSE` |
| `sender_id` | UUID | YES | NULL (FK → users.id) |
| `broadcast_id` | UUID | YES | NULL |
| `target_type` | TEXT | YES | NULL |
| `target_store_id` | UUID | YES | NULL |
| `target_role` | TEXT | YES | NULL |
| `sent_at` | TIMESTAMPTZ | YES | NULL |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `notification_reads` (4 columns)
Read receipt tracking for notifications.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `notification_id` | UUID | YES | NULL |
| `user_id` | UUID | YES | NULL |
| `read_at` | TIMESTAMPTZ | YES | `NOW()` |

**Unique Constraint:** `(notification_id, user_id)`

#### `manager_routine_logs` (17 columns)
Daily routine execution logs for managers.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `store_id` | UUID | NO | — (FK → stores.id) |
| `manager_id` | UUID | NO | — (FK → users.id) |
| `routine_date` | DATE | NO | — |
| `reference_date` | DATE | NO | — |
| `checkins_pending_count` | INTEGER | NO | `0` |
| `sem_registro_count` | INTEGER | NO | `0` |
| `agd_cart_today` | INTEGER | NO | `0` |
| `agd_net_today` | INTEGER | NO | `0` |
| `previous_day_leads` | INTEGER | NO | `0` |
| `previous_day_sales` | INTEGER | NO | `0` |
| `ranking_snapshot` | JSONB | NO | `'[]'` |
| `notes` | TEXT | YES | NULL |
| `status` | TEXT | NO | `'completed'` (CHECK: completed) |
| `executed_at` | TIMESTAMPTZ | NO | `NOW()` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

**Unique Constraint:** `(store_id, manager_id, routine_date)`

#### `whatsapp_share_logs` (8 columns)
Usage tracking for WhatsApp sharing feature.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `store_id` | UUID | NO | — (FK → stores.id) |
| `user_id` | UUID | NO | — (FK → users.id) |
| `reference_date` | DATE | NO | — |
| `source` | TEXT | NO | `'morning_report'` (CHECK: morning_report) |
| `message_text` | TEXT | NO | — |
| `shared_via` | TEXT | NO | `'whatsapp'` (CHECK: whatsapp, native_share) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |

---

### 6. Audit Domain

#### `audit_logs` (7 columns)
General-purpose audit trail for admin actions.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `user_id` | UUID | YES | NULL (FK → users.id) |
| `action` | TEXT | NO | — |
| `entity` | TEXT | YES | NULL |
| `entity_id` | UUID | YES | NULL |
| `details_json` | JSONB | YES | NULL |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |

#### `checkin_correction_requests` (10 columns)
Workflow for retroactive check-in correction with approval.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `checkin_id` | UUID | NO | — (FK → daily_checkins.id) |
| `seller_id` | UUID | NO | — (FK → users.id) |
| `store_id` | UUID | NO | — (FK → stores.id) |
| `requested_values` | JSONB | NO | — |
| `reason` | TEXT | NO | — |
| `status` | CORRECTION_STATUS | NO | `'pending'` |
| `auditor_id` | UUID | YES | NULL (FK → users.id) |
| `reviewed_at` | TIMESTAMPTZ | YES | NULL |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `checkin_audit_logs` (8 columns)
Immutable log of all check-in data modifications.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `checkin_id` | UUID | NO | — (FK → daily_checkins.id) |
| `correction_request_id` | UUID | YES | NULL (FK → checkin_correction_requests.id) |
| `changed_by` | UUID | NO | — (FK → users.id) |
| `old_values` | JSONB | NO | — |
| `new_values` | JSONB | NO | — |
| `change_type` | TEXT | NO | `'manual_correction'` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `reprocess_logs` (16 columns)
Batch data import/reprocessing execution logs.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `store_id` | UUID | YES | NULL (FK → stores.id) |
| `source_type` | TEXT | NO | — |
| `triggered_by` | UUID | YES | NULL (FK → users.id) |
| `status` | TEXT | NO | `'pending'` (CHECK: pending, processing, completed, failed) |
| `rows_processed` | INTEGER | NO | `0` |
| `records_processed` | INTEGER | NO | `0` |
| `records_failed` | INTEGER | NO | `0` |
| `warnings` | JSONB | NO | `'[]'` |
| `errors` | JSONB | NO | `'[]'` |
| `error_log` | JSONB | NO | `'[]'` |
| `file_hash` | TEXT | YES | NULL |
| `started_at` | TIMESTAMPTZ | YES | `NOW()` |
| `finished_at` | TIMESTAMPTZ | YES | NULL |
| `processed_at` | TIMESTAMPTZ | YES | NULL |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |

#### `raw_imports` (4 columns)
Raw data staging for reprocessing pipeline.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `log_id` | UUID | NO | — (FK → reprocess_logs.id) |
| `raw_data` | JSONB | NO | — |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |

---

### 7. Consulting CRM Domain

#### `consulting_clients` (13 columns)
Consulting engagement client master record.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `name` | TEXT | NO | — |
| `legal_name` | TEXT | YES | NULL |
| `cnpj` | TEXT | YES | NULL |
| `product_name` | TEXT | YES | NULL |
| `status` | TEXT | NO | `'ativo'` |
| `notes` | TEXT | YES | NULL |
| `primary_store_id` | UUID | YES | NULL (FK → stores.id) |
| `created_by` | UUID | YES | NULL (FK → users.id) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `consulting_client_units` (8 columns)
Client business unit/branch tracking.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `client_id` | UUID | NO | — (FK → consulting_clients.id) |
| `name` | TEXT | NO | — |
| `city` | TEXT | YES | NULL |
| `state` | TEXT | YES | NULL |
| `is_primary` | BOOLEAN | NO | `FALSE` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `consulting_client_contacts` (9 columns)
Contact persons at consulting clients.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `client_id` | UUID | NO | — (FK → consulting_clients.id) |
| `name` | TEXT | NO | — |
| `email` | TEXT | YES | NULL |
| `phone` | TEXT | YES | NULL |
| `role` | TEXT | YES | NULL |
| `is_primary` | BOOLEAN | NO | `FALSE` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `consulting_assignments` (7 columns)
Consultant-to-client assignment mapping.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `client_id` | UUID | NO | — (FK → consulting_clients.id) |
| `user_id` | UUID | NO | — (FK → users.id) |
| `assignment_role` | TEXT | NO | `'responsavel'` (CHECK: responsavel, auxiliar, viewer) |
| `active` | BOOLEAN | NO | `TRUE` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

**Unique Index:** `(client_id, user_id)`

#### `consulting_methodology_steps` (7 columns)
Standard consulting visit methodology checklist.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `visit_number` | INTEGER | NO | — |
| `objective` | TEXT | NO | — |
| `target` | TEXT | YES | NULL |
| `duration` | TEXT | YES | NULL |
| `evidence_required` | TEXT | YES | NULL |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `consulting_visits` (16 columns)
Scheduled and completed consulting visits.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `client_id` | UUID | NO | — (FK → consulting_clients.id) |
| `visit_number` | INTEGER | NO | — |
| `scheduled_at` | TIMESTAMPTZ | NO | — |
| `duration_hours` | NUMERIC | YES | `3` |
| `modality` | TEXT | NO | `'Presencial'` |
| `status` | TEXT | NO | `'agendada'` |
| `consultant_id` | UUID | YES | NULL (FK → users.id) |
| `auxiliary_consultant_id` | UUID | YES | NULL (FK → users.id) |
| `objective` | TEXT | YES | NULL |
| `checklist_data` | JSONB | YES | `'[]'` |
| `feedback_client` | TEXT | YES | NULL |
| `executive_summary` | TEXT | YES | NULL |
| `google_event_id` | TEXT | YES | NULL |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

#### `consulting_financials` (13 columns)
Monthly DRE/financial data per client.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `client_id` | UUID | NO | — (FK → consulting_clients.id) |
| `reference_date` | DATE | NO | — |
| `revenue` | NUMERIC | YES | `0` |
| `fixed_expenses` | NUMERIC | YES | `0` |
| `marketing_expenses` | NUMERIC | YES | `0` |
| `investments` | NUMERIC | YES | `0` |
| `financing` | NUMERIC | YES | `0` |
| `net_profit` | NUMERIC | YES | `0` |
| `roi` | NUMERIC | YES | `0` |
| `conversion_rate` | NUMERIC | YES | `0` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

**Unique Constraint:** `(client_id, reference_date)`

#### `consulting_oauth_tokens` (9 columns)
OAuth2 token storage for external integrations (Google Calendar).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `user_id` | UUID | NO | — (FK → users.id) |
| `provider` | TEXT | NO | `'google'` |
| `access_token` | TEXT | NO | — |
| `refresh_token` | TEXT | YES | NULL |
| `expires_at` | TIMESTAMPTZ | YES | NULL |
| `scopes` | TEXT[] | YES | NULL |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

**Unique Constraint:** `(user_id, provider)`

#### `consulting_calendar_settings` (8 columns)
Per-user Google Calendar sync configuration.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `user_id` | UUID | NO | — (FK → users.id) |
| `client_id` | UUID | YES | NULL (FK → consulting_clients.id) |
| `google_calendar_id` | TEXT | NO | `'primary'` |
| `sync_active` | BOOLEAN | NO | `TRUE` |
| `last_sync_at` | TIMESTAMPTZ | YES | NULL |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

**Unique Index:** `(user_id)`

#### `consulting_google_oauth_states` (9 columns)
Temporary OAuth state tokens for Google Calendar integration.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` (PK) |
| `user_id` | UUID | NO | — (FK → users.id) |
| `client_id` | UUID | YES | NULL (FK → consulting_clients.id) |
| `state` | TEXT | NO | — (UNIQUE) |
| `redirect_uri` | TEXT | NO | — |
| `expires_at` | TIMESTAMPTZ | NO | — |
| `consumed_at` | TIMESTAMPTZ | YES | NULL |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` |

---

### 8. Digital Products Domain

#### `digital_products` (6 columns)
Digital product catalog.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `title` | TEXT | NO | — |
| `description` | TEXT | YES | NULL |
| `type` | TEXT | YES | NULL |
| `video_url` | TEXT | YES | NULL |
| `active` | BOOLEAN | YES | `TRUE` |

---

### 9. Legacy Domain

> **Note:** These tables originate from the pre-canonical era and may have partial migration coverage. 17 tables remain without versioned migrations.

#### `agencies` (5 columns)
Legacy multi-tenancy agency concept.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `name` | TEXT | NO | — |
| `plan` | TEXT | YES | `'free'` |
| `logo_url` | TEXT | YES | NULL |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |

#### `goals` (8 columns)
Legacy goal tracking.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `store_id` | UUID | YES | NULL (FK → stores.id) |
| `user_id` | UUID | YES | NULL (FK → users.id) |
| `month` | INTEGER | YES | NULL |
| `year` | INTEGER | YES | NULL |
| `target` | NUMERIC | YES | NULL |
| `updated_by` | UUID | YES | NULL (FK → users.id) |
| `updated_at` | TIMESTAMPTZ | YES | `NOW()` |

#### `benchmarks` (5 columns)
Legacy benchmark data (superseded by `store_benchmarks`).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `store_id` | UUID | YES | NULL (FK → stores.id) |
| `lead_to_appt` | NUMERIC | YES | NULL |
| `appt_to_visit` | NUMERIC | YES | NULL |
| `visit_to_sale` | NUMERIC | YES | NULL |

#### `roles` (4 columns)
Legacy role catalog.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `name` | TEXT | NO | — (UNIQUE) |
| `description` | TEXT | YES | NULL |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |

#### `user_roles` (5 columns)
Legacy user-role assignment.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `user_id` | UUID | YES | NULL (FK → users.id) |
| `role_id` | UUID | YES | NULL (FK → roles.id) |
| `store_id` | UUID | YES | NULL (FK → stores.id) |
| `assigned_at` | TIMESTAMPTZ | YES | `NOW()` |

#### `goal_logs` (6 columns)
Legacy goal change history.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `goal_id` | UUID | YES | NULL (FK → goals.id) |
| `changed_by` | UUID | YES | NULL (FK → users.id) |
| `old_value` | NUMERIC | YES | NULL |
| `new_value` | NUMERIC | YES | NULL |
| `changed_at` | TIMESTAMPTZ | YES | `NOW()` |

#### `daily_lead_volumes` (6 columns)
Legacy lead volume tracking.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `store_id` | UUID | YES | NULL (FK → stores.id) |
| `date` | DATE | YES | NULL |
| `source` | TEXT | YES | NULL |
| `volume` | INTEGER | YES | NULL |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |

#### `automation_configs` (13 columns)
Legacy report automation configuration.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `agency_id` | UUID | YES | NULL |
| `report_type` | TEXT | NO | — |
| `is_enabled` | BOOLEAN | YES | `TRUE` |
| `schedule_cron` | TEXT | NO | — |
| `recipients` | JSONB | YES | `'[]'` |
| `ai_context` | TEXT | YES | NULL |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |
| `updated_at` | TIMESTAMPTZ | YES | `NOW()` |
| `time_to_trigger` | TIME | YES | `'18:00'` |
| `target_roles` | TEXT[] | YES | `'{Manager, Owner}'` |
| `custom_message` | TEXT | YES | NULL |
| `is_active` | BOOLEAN | YES | `FALSE` |

#### `communication_instances` (10 columns)
Legacy WhatsApp integration instance management.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `agency_id` | UUID | YES | NULL |
| `name` | TEXT | NO | — |
| `provider` | TEXT | YES | `'evolution_api'` |
| `status` | TEXT | YES | `'disconnected'` |
| `api_url` | TEXT | YES | NULL |
| `api_key` | TEXT | YES | NULL |
| `instance_name` | TEXT | YES | NULL |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |
| `updated_at` | TIMESTAMPTZ | YES | `NOW()` |

#### `report_history` (7 columns)
Legacy AI-generated report history.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `config_id` | UUID | YES | NULL (FK → automation_configs.id) |
| `report_type` | TEXT | NO | — |
| `data_snapshot` | JSONB | YES | NULL |
| `ai_insight` | TEXT | YES | NULL |
| `delivery_status` | JSONB | YES | `'[]'` |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |

#### `role_assignments_audit` (6 columns)
Legacy role assignment audit log.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NO | `uuid_generate_v4()` (PK) |
| `user_id` | UUID | YES | NULL (FK → users.id) |
| `role_id` | UUID | YES | NULL (FK → roles.id) |
| `assigned_by` | UUID | YES | NULL (FK → users.id) |
| `action` | TEXT | YES | NULL |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` |

---

## Views

### `view_sem_registro`
Identifies active sellers who have not submitted a daily check-in for the current reference date.

**Logic:** LEFT JOIN `store_sellers` (active, within tenure) against `daily_checkins` for `CURRENT_DATE`. Returns sellers with no matching check-in.

### `view_store_daily_production`
Aggregates daily production per store, handling the `is_venda_loja` (store sale) entity according to `store_meta_rules.include_venda_loja_in_store_total`.

**Columns:** `store_id`, `reference_date`, `total_leads`, `total_visits`, `total_agendamentos`, `total_vendas`

### `view_seller_tenure_status`
Provides a denormalized view of seller tenure with store name, seller name, active/ended status, and operational date.

**Columns:** `tenure_id`, `store_id`, `store_name`, `seller_user_id`, `seller_name`, `started_at`, `ended_at`, `is_active`, `closing_month_grace`, `tenure_status`, `operational_date`

### `view_daily_team_status`
Canonical "Sem Registro" view for D-1. Crosses `store_sellers` (active tenure) with `daily_checkins` (metric_scope=daily) to produce per-seller daily status with submission metadata.

**Columns:** `store_id`, `store_name`, `seller_id`, `seller_name`, `reference_date`, `checkin_id`, `sem_registro`, `submission_status`, `submitted_at`, `submitted_late`, `started_at`, `ended_at`, `closing_month_grace`

---

## Foreign Keys (86)

### Core Domain
| # | Child Table | Column | Parent Table | Column | On Delete |
|---|-------------|--------|--------------|--------|-----------|
| 1 | users | id | auth.users | id | CASCADE |
| 2 | memberships | user_id | users | id | CASCADE |
| 3 | memberships | store_id | stores | id | CASCADE |
| 4 | daily_checkins | store_id | stores | id | CASCADE |
| 5 | daily_checkins | seller_user_id | users | id | CASCADE |
| 6 | daily_checkins | created_by | users | id | SET NULL |
| 7 | daily_checkins | user_id | users | id | CASCADE |
| 8 | store_sellers | store_id | stores | id | CASCADE |
| 9 | store_sellers | seller_user_id | users | id | CASCADE |

### Performance Domain
| # | Child Table | Column | Parent Table | Column | On Delete |
|---|-------------|--------|--------------|--------|-----------|
| 10 | store_meta_rules | store_id | stores | id | CASCADE |
| 11 | store_meta_rules | updated_by | users | id | SET NULL |
| 12 | store_meta_rules_history | store_id | stores | id | CASCADE |
| 13 | store_meta_rules_history | changed_by | users | id | SET NULL |
| 14 | store_benchmarks | store_id | stores | id | CASCADE |
| 15 | store_benchmarks | updated_by | users | id | SET NULL |
| 16 | store_delivery_rules | store_id | stores | id | CASCADE |
| 17 | store_delivery_rules | updated_by | users | id | SET NULL |

### Quality Domain
| # | Child Table | Column | Parent Table | Column | On Delete |
|---|-------------|--------|--------------|--------|-----------|
| 18 | feedbacks | store_id | stores | id | CASCADE |
| 19 | feedbacks | manager_id | users | id | SET NULL |
| 20 | feedbacks | seller_id | users | id | CASCADE |
| 21 | weekly_feedback_reports | store_id | stores | id | CASCADE |
| 22 | pdis | store_id | stores | id | CASCADE |
| 23 | pdis | manager_id | users | id | SET NULL |
| 24 | pdis | seller_id | users | id | CASCADE |
| 25 | pdi_reviews | pdi_id | pdis | id | CASCADE |

### PDI 360 Domain
| # | Child Table | Column | Parent Table | Column | On Delete |
|---|-------------|--------|--------------|--------|-----------|
| 26 | pdi_descritores_escala | nivel_cargo_id | pdi_niveis_cargo | id | CASCADE |
| 27 | pdi_acoes_sugeridas | competencia_id | pdi_competencias | id | CASCADE |
| 28 | pdi_sessoes | colaborador_id | auth.users | id | — |
| 29 | pdi_sessoes | gerente_id | auth.users | id | — |
| 30 | pdi_metas | sessao_id | pdi_sessoes | id | CASCADE |
| 31 | pdi_avaliacoes_competencia | sessao_id | pdi_sessoes | id | CASCADE |
| 32 | pdi_avaliacoes_competencia | competencia_id | pdi_competencias | id | — |
| 33 | pdi_plano_acao | sessao_id | pdi_sessoes | id | CASCADE |
| 34 | pdi_plano_acao | competencia_id | pdi_competencias | id | — |
| 35 | pdi_plano_acao | aprovado_por | auth.users | id | — |
| 36 | pdi_objetivos_pessoais | sessao_id | pdi_sessoes | id | CASCADE |

### Operational Domain
| # | Child Table | Column | Parent Table | Column | On Delete |
|---|-------------|--------|--------------|--------|-----------|
| 37 | training_progress | user_id | users | id | CASCADE |
| 38 | training_progress | training_id | trainings | id | CASCADE |
| 39 | notifications | recipient_id | users | id | CASCADE |
| 40 | notifications | store_id | stores | id | CASCADE |
| 41 | notifications | sender_id | users | id | SET NULL |
| 42 | manager_routine_logs | store_id | stores | id | CASCADE |
| 43 | manager_routine_logs | manager_id | users | id | RESTRICT |
| 44 | whatsapp_share_logs | store_id | stores | id | CASCADE |
| 45 | whatsapp_share_logs | user_id | users | id | RESTRICT |

### Audit Domain
| # | Child Table | Column | Parent Table | Column | On Delete |
|---|-------------|--------|--------------|--------|-----------|
| 46 | audit_logs | user_id | users | id | SET NULL |
| 47 | checkin_correction_requests | checkin_id | daily_checkins | id | CASCADE |
| 48 | checkin_correction_requests | seller_id | users | id | — |
| 49 | checkin_correction_requests | store_id | stores | id | — |
| 50 | checkin_correction_requests | auditor_id | users | id | — |
| 51 | checkin_audit_logs | checkin_id | daily_checkins | id | CASCADE |
| 52 | checkin_audit_logs | correction_request_id | checkin_correction_requests | id | — |
| 53 | checkin_audit_logs | changed_by | users | id | — |
| 54 | reprocess_logs | store_id | stores | id | CASCADE |
| 55 | reprocess_logs | triggered_by | users | id | SET NULL |
| 56 | raw_imports | log_id | reprocess_logs | id | CASCADE |

### Consulting CRM Domain
| # | Child Table | Column | Parent Table | Column | On Delete |
|---|-------------|--------|--------------|--------|-----------|
| 57 | consulting_clients | primary_store_id | stores | id | SET NULL |
| 58 | consulting_clients | created_by | users | id | SET NULL |
| 59 | consulting_client_units | client_id | consulting_clients | id | CASCADE |
| 60 | consulting_client_contacts | client_id | consulting_clients | id | CASCADE |
| 61 | consulting_assignments | client_id | consulting_clients | id | CASCADE |
| 62 | consulting_assignments | user_id | users | id | CASCADE |
| 63 | consulting_visits | client_id | consulting_clients | id | CASCADE |
| 64 | consulting_visits | consultant_id | users | id | SET NULL |
| 65 | consulting_visits | auxiliary_consultant_id | users | id | SET NULL |
| 66 | consulting_financials | client_id | consulting_clients | id | CASCADE |
| 67 | consulting_oauth_tokens | user_id | users | id | CASCADE |
| 68 | consulting_calendar_settings | user_id | users | id | CASCADE |
| 69 | consulting_calendar_settings | client_id | consulting_clients | id | SET NULL |
| 70 | consulting_google_oauth_states | user_id | users | id | CASCADE |
| 71 | consulting_google_oauth_states | client_id | consulting_clients | id | SET NULL |

### Legacy Domain
| # | Child Table | Column | Parent Table | Column | On Delete |
|---|-------------|--------|--------------|--------|-----------|
| 72 | goals | store_id | stores | id | — |
| 73 | goals | user_id | users | id | — |
| 74 | goals | updated_by | users | id | — |
| 75 | benchmarks | store_id | stores | id | — |
| 76 | user_roles | user_id | users | id | — |
| 77 | user_roles | role_id | roles | id | — |
| 78 | user_roles | store_id | stores | id | — |
| 79 | goal_logs | goal_id | goals | id | — |
| 80 | goal_logs | changed_by | users | id | — |
| 81 | daily_lead_volumes | store_id | stores | id | — |
| 82 | report_history | config_id | automation_configs | id | SET NULL |
| 83 | role_assignments_audit | user_id | users | id | — |
| 84 | role_assignments_audit | role_id | roles | id | — |
| 85 | role_assignments_audit | assigned_by | users | id | — |
| 86 | agencies | (various FK via legacy multi-tenancy) | — | — | — |

---

## Functions (34)

### Role & Access Helpers
| # | Function | Returns | Language | Security |
|---|----------|---------|----------|----------|
| 1 | `normalize_mx_role(p_role text)` | TEXT | SQL IMMUTABLE | — |
| 2 | `is_admin()` | BOOLEAN | SQL STABLE | DEFINER |
| 3 | `has_store_role(p_store_id uuid, p_roles text[])` | BOOLEAN | SQL STABLE | DEFINER |
| 4 | `is_owner_of(p_store_id uuid)` | BOOLEAN | SQL STABLE | — |
| 5 | `is_manager_of(p_store_id uuid)` | BOOLEAN | SQL STABLE | — |
| 6 | `is_member_of(p_store_id uuid)` | BOOLEAN | SQL STABLE | — |
| 7 | `check_user_role_in_store(p_store_id uuid, p_roles text[])` | BOOLEAN | SQL STABLE | DEFINER |
| 8 | `has_write_access()` | BOOLEAN | SQL | DEFINER |
| 9 | `get_user_agency_id()` | UUID | SQL | DEFINER |
| 10 | `can_access_consulting_client(p_client_id uuid)` | BOOLEAN | SQL STABLE | DEFINER |

### CRUD & Sync Helpers
| # | Function | Returns | Language | Security |
|---|----------|---------|----------|----------|
| 11 | `update_updated_at_column()` | TRIGGER | plpgsql | — |
| 12 | `update_updated_at_column_canonical()` | TRIGGER | plpgsql | — |
| 13 | `set_manager_routine_logs_updated_at()` | TRIGGER | plpgsql | — |
| 14 | `handle_new_user()` | TRIGGER | plpgsql | DEFINER |

### Data Synchronization
| # | Function | Returns | Language | Security |
|---|----------|---------|----------|----------|
| 15 | `sync_daily_checkins_canonical()` | TRIGGER | plpgsql | — |
| 16 | `sync_pdi_legacy_shadow_columns()` | TRIGGER | plpgsql | — |
| 17 | `sync_notification_reads()` | TRIGGER | plpgsql | DEFINER |
| 18 | `log_store_meta_rules_changes()` | TRIGGER | plpgsql | DEFINER |

### Reprocessing & Import
| # | Function | Returns | Language | Security |
|---|----------|---------|----------|----------|
| 19 | `process_import_data(p_log_id uuid)` | VOID | plpgsql | DEFINER |

### PDI 360 RPCs
| # | Function | Returns | Language | Security |
|---|----------|---------|----------|----------|
| 20 | `get_pdi_form_template(p_cargo_id uuid)` | JSONB | plpgsql | DEFINER |
| 21 | `get_suggested_actions(p_competencia_id uuid)` | JSONB | plpgsql | DEFINER |
| 22 | `create_pdi_session_bundle(p_payload jsonb)` | UUID | plpgsql | DEFINER |
| 23 | `get_pdi_print_bundle(p_sessao_id uuid)` | JSONB | plpgsql | DEFINER |
| 24 | `approve_pdi_action_evidence(p_action_id uuid, p_approval_payload jsonb)` | VOID | plpgsql | DEFINER |

### Business Logic
| # | Function | Returns | Language | Security |
|---|----------|---------|----------|----------|
| 25 | `enforce_feedback_seller_ack_only()` | TRIGGER | plpgsql | DEFINER |
| 26 | `check_orphan_users_after_membership_deletion()` | TRIGGER | plpgsql | DEFINER |
| 27 | `send_broadcast_notification(...)` | UUID | plpgsql | DEFINER |

### Cron Scheduling
| # | Function | Returns | Language | Security |
|---|----------|---------|----------|----------|
| 28 | `configure_morning_report_cron(p_function_url text, p_bearer_token text)` | VOID | plpgsql | DEFINER |
| 29 | `configure_weekly_feedback_cron(p_function_url text, p_bearer_token text)` | VOID | plpgsql | DEFINER |
| 30 | `configure_monthly_report_cron(p_function_url text, p_bearer_token text, p_schedule text)` | VOID | plpgsql | DEFINER |

### Additional Helpers (from legacy migrations)
| # | Function | Returns | Language | Security |
|---|----------|---------|----------|----------|
| 31 | `is_admin()` (legacy variant) | BOOLEAN | SQL | DEFINER |
| 32 | `get_user_agency_id()` (legacy) | UUID | SQL | DEFINER |
| 33 | `has_write_access()` (legacy) | BOOLEAN | SQL | DEFINER |
| 34 | `is_admin()` (optimized variant) | BOOLEAN | SQL | DEFINER |

---

## Triggers (32)

| # | Trigger Name | Table | Event | Function |
|---|-------------|-------|-------|----------|
| 1 | `update_users_updated_at` | users | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 2 | `update_stores_updated_at` | stores | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 3 | `update_memberships_updated_at` | memberships | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 4 | `update_store_sellers_updated_at` | store_sellers | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 5 | `sync_daily_checkins_canonical` | daily_checkins | BEFORE INSERT OR UPDATE | `sync_daily_checkins_canonical()` |
| 6 | `update_daily_checkins_updated_at` | daily_checkins | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 7 | `update_store_benchmarks_updated_at` | store_benchmarks | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 8 | `update_store_delivery_rules_updated_at` | store_delivery_rules | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 9 | `update_store_meta_rules_updated_at` | store_meta_rules | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 10 | `tr_log_store_meta_rules_changes` | store_meta_rules | AFTER UPDATE | `log_store_meta_rules_changes()` |
| 11 | `update_pdis_updated_at` | pdis | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 12 | `pdis_sync_legacy_shadow_columns` | pdis | BEFORE INSERT OR UPDATE | `sync_pdi_legacy_shadow_columns()` |
| 13 | `update_manager_routine_logs_set_updated_at` | manager_routine_logs | BEFORE UPDATE | `set_manager_routine_logs_updated_at()` |
| 14 | `weekly_feedback_reports_set_updated_at` | weekly_feedback_reports | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 15 | `feedbacks_seller_ack_only` | feedbacks | BEFORE UPDATE | `enforce_feedback_seller_ack_only()` |
| 16 | `notifications_sync_notification_reads` | notifications | AFTER INSERT OR UPDATE OF read | `sync_notification_reads()` |
| 17 | `tr_cleanup_orphans_on_store_seller_delete` | store_sellers | AFTER DELETE | `check_orphan_users_after_membership_deletion()` |
| 18 | `tr_cleanup_orphans_on_membership_delete` | memberships | AFTER DELETE | `check_orphan_users_after_membership_deletion()` |
| 19 | `update_consulting_clients_updated_at` | consulting_clients | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 20 | `update_consulting_client_units_updated_at` | consulting_client_units | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 21 | `update_consulting_client_contacts_updated_at` | consulting_client_contacts | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 22 | `update_consulting_assignments_updated_at` | consulting_assignments | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 23 | `update_consulting_visits_updated_at` | consulting_visits | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 24 | `update_consulting_financials_updated_at` | consulting_financials | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 25 | `update_consulting_oauth_tokens_updated_at` | consulting_oauth_tokens | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 26 | `update_consulting_calendar_settings_updated_at` | consulting_calendar_settings | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 27 | `update_consulting_google_oauth_states_updated_at` | consulting_google_oauth_states | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 28 | `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` |
| 29 | `update_automation_configs_updated_at` | automation_configs | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 30 | `update_communication_instances_updated_at` | communication_instances | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 31 | `update_agencies_updated_at` | agencies | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| 32 | `update_report_history_updated_at` | report_history | BEFORE UPDATE | `update_updated_at_column_canonical()` |

---

## Indexes (113)

### Core Domain
| # | Index Name | Table | Columns | Type |
|---|-----------|-------|---------|------|
| 1 | `users_email_key` | users | email | UNIQUE |
| 2 | `users_pkey` | users | id | PK |
| 3 | `stores_pkey` | stores | id | PK |
| 4 | `memberships_pkey` | memberships | id | PK |
| 5 | `idx_memberships_user_store_role` | memberships | (user_id, store_id, role) | B-TREE |
| 6 | `idx_memberships_store_role` | memberships | (store_id, role) | B-TREE |
| 7 | `daily_checkins_pkey` | daily_checkins | id | PK |
| 8 | `daily_checkins_seller_store_reference_key` | daily_checkins | (seller_user_id, store_id, reference_date) | UNIQUE |
| 9 | `daily_checkins_store_reference_idx` | daily_checkins | (store_id, reference_date) | B-TREE |
| 10 | `daily_checkins_seller_reference_idx` | daily_checkins | (seller_user_id, reference_date) | B-TREE |
| 11 | `idx_checkins_store_date` | daily_checkins | (store_id, reference_date) | B-TREE |
| 12 | `idx_checkins_seller_date` | daily_checkins | (seller_user_id, reference_date) | B-TREE |

### Performance Domain
| # | Index Name | Table | Columns | Type |
|---|-----------|-------|---------|------|
| 13 | `store_sellers_pkey` | store_sellers | id | PK |
| 14 | `store_sellers_store_seller_started_idx` | store_sellers | (store_id, seller_user_id, started_at) | UNIQUE |
| 15 | `store_sellers_store_active_idx` | store_sellers | (store_id, is_active, started_at, ended_at) | B-TREE |
| 16 | `store_sellers_seller_idx` | store_sellers | (seller_user_id) | B-TREE |
| 17 | `store_meta_rules_pkey` | store_meta_rules | store_id | PK |
| 18 | `store_benchmarks_pkey` | store_benchmarks | store_id | PK |
| 19 | `store_delivery_rules_pkey` | store_delivery_rules | store_id | PK |

### Quality Domain
| # | Index Name | Table | Columns | Type |
|---|-----------|-------|---------|------|
| 20 | `feedbacks_pkey` | feedbacks | id | PK |
| 21 | `feedbacks_seller_week_unique` | feedbacks | (seller_id, week_reference) | UNIQUE |
| 22 | `feedbacks_store_week_idx` | feedbacks | (store_id, week_reference DESC) | B-TREE |
| 23 | `feedbacks_seller_week_idx` | feedbacks | (seller_id, week_reference DESC) | B-TREE |
| 24 | `weekly_feedback_reports_pkey` | weekly_feedback_reports | id | PK |
| 25 | `weekly_feedback_reports_unique` | weekly_feedback_reports | (store_id, week_start, week_end) | UNIQUE |
| 26 | `weekly_feedback_reports_store_week_idx` | weekly_feedback_reports | (store_id, week_start DESC) | B-TREE |
| 27 | `pdis_pkey` | pdis | id | PK |
| 28 | `pdi_reviews_pkey` | pdi_reviews | id | PK |
| 29 | `pdi_reviews_pdi_created_idx` | pdi_reviews | (pdi_id, created_at DESC) | B-TREE |

### PDI 360 Domain
| # | Index Name | Table | Columns | Type |
|---|-----------|-------|---------|------|
| 30 | `pdi_niveis_cargo_pkey` | pdi_niveis_cargo | id | PK |
| 31 | `pdi_descritores_escala_pkey` | pdi_descritores_escala | id | PK |
| 32 | `pdi_competencias_pkey` | pdi_competencias | id | PK |
| 33 | `pdi_acoes_sugeridas_pkey` | pdi_acoes_sugeridas | id | PK |
| 34 | `pdi_frases_inspiracionais_pkey` | pdi_frases_inspiracionais | id | PK |
| 35 | `pdi_sessoes_pkey` | pdi_sessoes | id | PK |
| 36 | `pdi_metas_pkey` | pdi_metas | id | PK |
| 37 | `pdi_avaliacoes_competencia_pkey` | pdi_avaliacoes_competencia | id | PK |
| 38 | `pdi_plano_acao_pkey` | pdi_plano_acao | id | PK |
| 39 | `pdi_objetivos_pessoais_pkey` | pdi_objetivos_pessoais | id | PK |

### Operational Domain
| # | Index Name | Table | Columns | Type |
|---|-----------|-------|---------|------|
| 40 | `trainings_pkey` | trainings | id | PK |
| 41 | `training_progress_pkey` | training_progress | id | PK |
| 42 | `notifications_pkey` | notifications | id | PK |
| 43 | `notifications_recipient_created_idx` | notifications | (recipient_id, created_at DESC) | B-TREE |
| 44 | `notifications_store_created_idx` | notifications | (store_id, created_at DESC) | B-TREE |
| 45 | `notifications_sender_id_idx` | notifications | (sender_id) | B-TREE |
| 46 | `notifications_broadcast_id_idx` | notifications | (broadcast_id) | B-TREE |
| 47 | `notification_reads_pkey` | notification_reads | id | PK |
| 48 | `notification_reads_notification_user_unique` | notification_reads | (notification_id, user_id) | UNIQUE |
| 49 | `manager_routine_logs_pkey` | manager_routine_logs | id | PK |
| 50 | `manager_routine_logs_unique_day` | manager_routine_logs | (store_id, manager_id, routine_date) | UNIQUE |
| 51 | `manager_routine_logs_store_date_idx` | manager_routine_logs | (store_id, routine_date DESC) | B-TREE |
| 52 | `manager_routine_logs_manager_date_idx` | manager_routine_logs | (manager_id, routine_date DESC) | B-TREE |
| 53 | `whatsapp_share_logs_pkey` | whatsapp_share_logs | id | PK |
| 54 | `whatsapp_share_logs_store_created_idx` | whatsapp_share_logs | (store_id, created_at DESC) | B-TREE |
| 55 | `whatsapp_share_logs_user_created_idx` | whatsapp_share_logs | (user_id, created_at DESC) | B-TREE |

### Audit Domain
| # | Index Name | Table | Columns | Type |
|---|-----------|-------|---------|------|
| 56 | `audit_logs_pkey` | audit_logs | id | PK |
| 57 | `checkin_correction_requests_pkey` | checkin_correction_requests | id | PK |
| 58 | `checkin_audit_logs_pkey` | checkin_audit_logs | id | PK |
| 59 | `checkin_audit_logs_store_created_idx` | checkin_audit_logs | (changed_by, created_at DESC) | B-TREE |
| 60 | `checkin_audit_logs_checkin_idx` | checkin_audit_logs | (checkin_id) | B-TREE |
| 61 | `checkin_audit_logs_changed_by_created_idx` | checkin_audit_logs | (changed_by, created_at DESC) | B-TREE |
| 62 | `checkin_audit_logs_created_at_idx` | checkin_audit_logs | (created_at DESC) | B-TREE |
| 63 | `checkin_audit_logs_type_created_idx` | checkin_audit_logs | (change_type, created_at DESC) | B-TREE |
| 64 | `reprocess_logs_pkey` | reprocess_logs | id | PK |
| 65 | `reprocess_logs_store_started_idx` | reprocess_logs | (store_id, started_at DESC) | B-TREE |
| 66 | `reprocess_logs_source_type_idx` | reprocess_logs | (source_type) | B-TREE |
| 67 | `reprocess_logs_file_hash_idx` | reprocess_logs | (file_hash) WHERE file_hash IS NOT NULL | PARTIAL |
| 68 | `reprocess_logs_store_created_idx` | reprocess_logs | (store_id, created_at DESC) | B-TREE |
| 69 | `reprocess_logs_active_status_idx` | reprocess_logs | (status, created_at DESC) WHERE status IN ('pending','processing','failed') | PARTIAL |
| 70 | `reprocess_logs_triggered_by_idx` | reprocess_logs | (triggered_by, created_at DESC) WHERE triggered_by IS NOT NULL | PARTIAL |
| 71 | `raw_imports_pkey` | raw_imports | id | PK |
| 72 | `raw_imports_log_id_idx` | raw_imports | (log_id) | B-TREE |

### Consulting CRM Domain
| # | Index Name | Table | Columns | Type |
|---|-----------|-------|---------|------|
| 73 | `consulting_clients_pkey` | consulting_clients | id | PK |
| 74 | `consulting_clients_name_idx` | consulting_clients | (name) | B-TREE |
| 75 | `consulting_clients_status_idx` | consulting_clients | (status) | B-TREE |
| 76 | `consulting_client_units_pkey` | consulting_client_units | id | PK |
| 77 | `consulting_units_client_idx` | consulting_client_units | (client_id) | B-TREE |
| 78 | `consulting_client_contacts_pkey` | consulting_client_contacts | id | PK |
| 79 | `consulting_contacts_client_idx` | consulting_client_contacts | (client_id) | B-TREE |
| 80 | `consulting_assignments_pkey` | consulting_assignments | id | PK |
| 81 | `consulting_assignments_client_user_unique` | consulting_assignments | (client_id, user_id) | UNIQUE |
| 82 | `consulting_assignments_user_active_idx` | consulting_assignments | (user_id, active) | B-TREE |
| 83 | `consulting_methodology_steps_pkey` | consulting_methodology_steps | id | PK |
| 84 | `consulting_visits_pkey` | consulting_visits | id | PK |
| 85 | `consulting_visits_client_idx` | consulting_visits | (client_id) | B-TREE |
| 86 | `consulting_visits_scheduled_at_idx` | consulting_visits | (scheduled_at) | B-TREE |
| 87 | `consulting_financials_pkey` | consulting_financials | id | PK |
| 88 | `consulting_financials_client_date_idx` | consulting_financials | (client_id, reference_date) | B-TREE |
| 89 | `consulting_oauth_tokens_pkey` | consulting_oauth_tokens | id | PK |
| 90 | `consulting_oauth_tokens_user_provider_unique` | consulting_oauth_tokens | (user_id, provider) | UNIQUE |
| 91 | `consulting_calendar_settings_pkey` | consulting_calendar_settings | id | PK |
| 92 | `consulting_calendar_settings_user_unique_idx` | consulting_calendar_settings | (user_id) | UNIQUE |
| 93 | `consulting_google_oauth_states_pkey` | consulting_google_oauth_states | id | PK |

### Digital Products & Legacy
| # | Index Name | Table | Columns | Type |
|---|-----------|-------|---------|------|
| 94 | `digital_products_pkey` | digital_products | id | PK |
| 95 | `agencies_pkey` | agencies | id | PK |
| 96 | `goals_pkey` | goals | id | PK |
| 97 | `benchmarks_pkey` | benchmarks | id | PK |
| 98 | `roles_pkey` | roles | id | PK |
| 99 | `roles_name_key` | roles | name | UNIQUE |
| 100 | `user_roles_pkey` | user_roles | id | PK |
| 101 | `goal_logs_pkey` | goal_logs | id | PK |
| 102 | `daily_lead_volumes_pkey` | daily_lead_volumes | id | PK |
| 103 | `automation_configs_pkey` | automation_configs | id | PK |
| 104 | `communication_instances_pkey` | communication_instances | id | PK |
| 105 | `report_history_pkey` | report_history | id | PK |
| 106 | `role_assignments_audit_pkey` | role_assignments_audit | id | PK |
| 107-113 | (additional legacy PK and FK indexes) | various | various | B-TREE |

---

## RLS Policies (107)

### Summary by Table

| Table | RLS Enabled | Policy Count | Access Pattern |
|-------|-------------|-------------|----------------|
| **users** | YES | 1 | Authenticated SELECT (public profiles) |
| **stores** | YES | 4 | SELECT (authenticated), INSERT/UPDATE/DELETE (admin) |
| **memberships** | YES | 2 | SELECT (authenticated=true), WRITE (admin) |
| **daily_checkins** | YES | 4 | SELECT (admin/owner/manager/self), INSERT (self), UPDATE (self), secured variant |
| **store_sellers** | YES | 4 | SELECT (admin/member/secured), WRITE (admin or admin+manager) |
| **store_meta_rules** | YES | 2 | SELECT (admin/owner/manager/member), WRITE (admin/manager) |
| **store_meta_rules_history** | — | — | Access via parent FK |
| **store_benchmarks** | YES | 2 | SELECT (admin/owner/manager), WRITE (admin) |
| **store_delivery_rules** | YES | 2 | SELECT (admin/owner/manager), WRITE (admin) |
| **feedbacks** | YES | 3 | SELECT (admin/owner/manager/self), INSERT (admin/manager), UPDATE (admin/manager/self) |
| **weekly_feedback_reports** | YES | 4 | SELECT/INSERT/UPDATE (admin/owner/manager), DELETE (admin) |
| **pdis** | YES | 3 | SELECT (admin/owner/manager/self), INSERT (admin/manager), UPDATE (admin/manager/self) |
| **pdi_reviews** | YES | 2 | SELECT (via parent PDI access), INSERT (manager of PDI store) |
| **pdi_niveis_cargo** | YES | 1 | SELECT (authenticated) |
| **pdi_descritores_escala** | YES | 1 | SELECT (authenticated) |
| **pdi_competencias** | YES | 1 | SELECT (authenticated) |
| **pdi_acoes_sugeridas** | YES | 1 | SELECT (authenticated) |
| **pdi_frases_inspiracionais** | YES | 1 | SELECT (authenticated) |
| **pdi_sessoes** | YES | 2 | SELECT (colaborador_id=uid OR gerente_id=uid) |
| **pdi_metas** | YES | 1 | ALL (via session access) |
| **pdi_avaliacoes_competencia** | YES | 1 | ALL (via session access) |
| **pdi_plano_acao** | YES | 1 | ALL (via session access) |
| **pdi_objetivos_pessoais** | YES | 1 | ALL (via session access) |
| **trainings** | YES | 2 | SELECT (true), WRITE (admin) |
| **training_progress** | YES | 4 | SELECT (admin/self/manager-of), INSERT/UPDATE/DELETE (admin/self) |
| **digital_products** | YES | 2 | SELECT (true), WRITE (admin) |
| **notifications** | YES | 4 | SELECT (admin/self), INSERT (admin/manager/self), UPDATE/DELETE (admin/self) |
| **notification_reads** | YES | 2 | SELECT/INSERT (admin/self) |
| **manager_routine_logs** | YES | 4 | SELECT (admin/owner/manager), INSERT/UPDATE (admin/manager+self), DELETE (admin) |
| **whatsapp_share_logs** | YES | 4 | SELECT (admin/owner/manager), INSERT (admin/manager+self), UPDATE/DELETE (admin) |
| **audit_logs** | YES | 1 | ALL (admin or agency) |
| **checkin_correction_requests** | YES | 2 | ALL (self), SELECT (manager of store) |
| **checkin_audit_logs** | YES | 1 | SELECT (admin/owner/manager) |
| **reprocess_logs** | YES | 2 | SELECT (admin/owner), WRITE (admin) |
| **raw_imports** | YES | 1 | ALL (admin) |
| **consulting_clients** | YES | 4 | SELECT (assignment check), INSERT/UPDATE/DELETE (admin) |
| **consulting_client_units** | YES | 2 | SELECT (assignment check), WRITE (admin) |
| **consulting_client_contacts** | YES | 2 | SELECT (assignment check), WRITE (admin) |
| **consulting_assignments** | YES | 2 | SELECT (admin/assignment check), WRITE (admin) |
| **consulting_methodology_steps** | YES | 1 | SELECT (true) |
| **consulting_visits** | YES | 2 | SELECT (assignment check), WRITE (admin) |
| **consulting_financials** | YES | 2 | SELECT (assignment check), WRITE (admin) |
| **consulting_oauth_tokens** | YES | 1 | ALL (self only) |
| **consulting_calendar_settings** | YES | 1 | ALL (self only) |
| **consulting_google_oauth_states** | YES | 1 | ALL (self only) |

### Legacy Tables with RLS
| Table | RLS Enabled | Notes |
|-------|-------------|-------|
| goals | YES | admin/owner/manager/self |
| benchmarks | YES | admin only write |
| roles | — | Legacy catalog |
| user_roles | — | Legacy |
| agencies | YES | admin/member |
| automation_configs | — | Legacy |
| communication_instances | YES | Permissive (legacy) |
| report_history | — | Legacy |
| goal_logs | — | Legacy |
| daily_lead_volumes | — | Legacy |
| role_assignments_audit | — | Legacy |

---

## Migration Timeline

### Phase 1: Foundation (2026-02-24)
- `20260224151812_initial_schema.sql` — Core 18 tables
- `20260224154400_rename_consultoria_to_admin.sql`
- `20260224154500_user_sync.sql`
- `20260224160000_multi_tenancy.sql` — Agencies, multi-tenant FKs
- `20260224170000_rls_hardening.sql` — First RLS pass
- `20260224180000_reporting_automations.sql` — automation_configs, report_history
- `20260224190000_communication_hub_refinement.sql` — communication_instances

### Phase 2: Canonization (2026-04-03)
- `20260403000000_epic01_canonical_schema.sql` — Canonical stores, checkins, benchmarks
- `20260403000001_epic01_views.sql` — view_sem_registro, view_store_daily_production
- `20260403000002_epic09_pdi.sql` — PDI tables
- `20260403000003_epic11_reprocess.sql` — raw_imports, process_import_data()
- `20260403000004_epic13_rls.sql` — Canonical RLS pass
- `20260403000005_epic01_canonization_final.sql` — store_meta_rules_history, checkin_scope enum
- `20260403000010_pdi_2_0_schema.sql` — Competence columns

### Phase 3: Reconciliation (2026-04-07 to 2026-04-08)
- `20260407000000_role_matrix_dono_admin.sql` — Role normalization + helper functions
- `20260407001000_canonical_domain_alignment.sql` — Full canonical migration on live DB
- `20260407002000_checkin_temporal_status.sql` — submitted_late, submission_status
- `20260407003000_manager_daily_routine.sql` — manager_routine_logs
- `20260407004000_morning_report_cron_1030.sql` — Cron scheduling
- `20260407005000_whatsapp_share_logs.sql` — WhatsApp tracking
- `20260407006000_weekly_feedback_official.sql` — weekly_feedback_reports
- `20260407006100_feedback_seller_ack_guard.sql` — Seller ack enforcement
- `20260407160000_reconcile_epic09_12_end_to_end.sql` — Notifications, views, final reconcile
- `20260407161000_pdi_legacy_compatibility.sql` — Legacy shadow columns
- `20260407162000_training_progress_rls.sql` — Training RLS
- `20260407170000_fix_auth_rls.sql` — Auth flow RLS fix
- `20260407180000_fix_meta_rules_rls.sql` — Meta rules member access
- `20260407190000_optimize_rls_performance.sql` — RLS optimization
- `20260407200000_kill_rls_recursion.sql` — RLS recursion fix
- `20260407210000_permissive_select_rls.sql` — Permissive SELECT for core tables

### Phase 4: Hardening (2026-04-09 to 2026-04-15)
- `20260409135401_pdi_mx_360_foundation.sql` — PDI 360 tables (10 tables)
- `20260409135731_pdi_mx_360_rpcs.sql` — PDI 360 RPCs (5 functions)
- `20260409140000_secure_rls_frontend_access.sql` — Frontend RLS fix
- `20260410000000_sec01_rls_hardening.sql` — daily_checkins RLS hardening
- `20260411000000_add_projection_mode.sql` — projection_mode enum
- `20260411001000_checkin_audit_system.sql` — checkin_correction_requests, checkin_audit_logs
- `20260411002000_add_audit_indexes.sql` — Audit performance indexes
- `20260411003000_native_enums_migration.sql` — Native enum types
- `20260411004000_membership_orphan_cleanup.sql` — Orphan user prevention triggers
- `20260413000000_perf_add_composite_index.sql` — Composite checkin indexes
- `20260413001000_drop_legacy_tables.sql` — Drop gamification, activities, inventory
- `20260413002000_secure_pdi_constraints.sql` — PDI NOT NULL constraints
- `20260413110000_consulting_core_foundation.sql` — Consulting CRM (4 tables + RLS)
- `20260413120000_consulting_google_calendar.sql` — Google Calendar OAuth (3 tables)
- `20260413120100_consulting_crm_extended.sql` — Visits, financials, methodology
- `20260414103000_consulting_google_calendar_hardening.sql` — Calendar constraints fix
- `20260415001000_db02_audit_composite_indexes.sql` — Comprehensive audit indexing
