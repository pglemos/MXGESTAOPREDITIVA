# Database Schema — MX Gestão Preditiva

| Field | Value |
|-------|-------|
| **Status** | ACTIVE |
| **Version** | 3.0 (Brownfield Discovery Phase 2/10) |
| **Date** | 2026-05-16 |
| **Agent** | @data-engineer (Dara) |
| **Engine** | PostgreSQL 17 (Supabase) |
| **Migrations analisadas** | 89 SQL files em `supabase/migrations/` + `migrations_legacy/` |
| **Edge Functions** | 15 (Deno runtime) |
| **Extensions** | uuid-ossp, pgcrypto, pg_cron, pg_net |

> Esta versão substitui a v2.0 (15-abr-2026 / 46 tabelas) para refletir 30+ renames PT-BR, expansão consultoria, novos RPCs sensíveis e expansão para ~100 tabelas.

---

## 1. Visão Geral

### Sumário Estatístico

| Categoria | Quantidade |
|-----------|-----------|
| Tabelas (public) | ~100 (incluindo 2 backups de migração) |
| Views | 4 |
| Functions / RPCs únicas | 68 (87 ocorrências `SECURITY DEFINER`, 75 com `SET search_path`) |
| Triggers | 60 |
| Indexes (`CREATE INDEX`) | 101 |
| Foreign Keys | ~195 (174 com `ON DELETE`, 21 sem cláusula explícita) |
| RLS `USING (true)` | 33 ocorrências em 23 tabelas |
| Tabelas SEM RLS | 5 (3 administrativas + 2 backups) |

### Modelo Multi-tenant

Single-database, tenant via `store_id` (rebatizado para `lojas`) e `client_id` (`clientes_consultoria`).

- **Branch Performance:** isolamento via `vinculos_loja` (ex-`memberships`) com `(user_id, store_id, role, is_active)`; helpers `check_user_role_in_store`, `tem_papel_loja`.
- **Branch Consultoria:** isolamento via `atribuicoes_consultoria` + helper `can_access_consulting_client(p_client_id)`.
- **Admin global:** roles `administrador_geral`, `administrador_mx`, `consultor_mx` curto-circuitam restrições via `eh_administrador_mx()`, `eh_admin_master_mx()`, `eh_area_interna_mx()`.

### Padrão Naming PT-BR (Maio 2026)

Migrations recentes renomearam ~30 tabelas para PT-BR:

| Original (EN) | Renomeada (PT-BR) |
|---------------|-------------------|
| `users` | `usuarios` |
| `stores` | `lojas` |
| `memberships` | `vinculos_loja` |
| `store_sellers` | `vendedores_loja` |
| `daily_checkins` | `lancamentos_diarios` |
| `trainings` | `treinamentos` |
| `training_progress` | `progresso_treinamentos` |
| `consulting_clients` | `clientes_consultoria` |
| `consulting_visits` | `visitas_consultoria` |
| `consulting_action_items` | `itens_plano_acao` |
| `consulting_strategic_plans` | `planejamentos_estrategicos` |
| `consulting_financials` | `financeiro_consultoria` |
| `goals` | `metas` |
| `goal_logs` | `historico_metas` |
| `audit_logs` | `logs_auditoria` |
| `consulting_assignments` | `atribuicoes_consultoria` |
| `consulting_client_units` | `unidades_cliente_consultoria` |
| `consulting_client_contacts` | `contatos_cliente_consultoria` |
| `consulting_methodology_steps` | `etapas_metodologia_consultoria` |
| `consulting_oauth_tokens` | `tokens_oauth_consultoria` |
| `consulting_calendar_settings` | `configuracoes_calendario_consultoria` |
| `consulting_google_oauth_states` | `estados_oauth_google_consultoria` |
| `consulting_visit_programs` | `programas_visita_consultoria` |
| `consulting_visit_template_steps` | `etapas_modelo_visita_consultoria` |
| `consulting_client_modules` | `modulos_cliente_consultoria` |
| `consulting_pmr_form_templates` | `modelos_formulario_pmr` |
| `consulting_pmr_form_responses` | `respostas_formulario_pmr` |
| `consulting_metric_catalog` | `catalogo_metricas_consultoria` |
| `consulting_parameter_sets` | `conjuntos_parametros_consultoria` |
| `consulting_parameter_values` | `valores_parametros_consultoria` |

⚠️ **Risco:** views, RPCs e código TS podem ainda referenciar nomes antigos. `src/types/database.ts` foi encontrado mas ainda não confirmado como `database.types.ts` gerado por `supabase gen types` — vide DB-AUDIT DB-014.

---

## 2. Tabelas por Domínio

> **Detalhe coluna-a-coluna:** definições autoritativas vivem nas migrations. Para evitar deriva (Article IV — No Invention) usar `grep -A 80 "CREATE TABLE public\.<name>" supabase/migrations/*.sql` para a definição canônica.

### Domínio Core (identidade, lojas, vínculos)

| Tabela | Propósito | RLS |
|--------|-----------|-----|
| `usuarios` (ex-`users`) | Perfis MX (role text: administrador_geral/administrador_mx/consultor_mx/dono/gerente/vendedor) | ⚠️ USING (true) |
| `lojas` (ex-`stores`) | Cadastro de loja, partners jsonb, source_mode | ✅ |
| `vinculos_loja` (ex-`memberships`) | M:N user↔store com papel e janela `started_at..ended_at` (soft close 2026-05-16) | ✅ |
| `vendedores_loja` (ex-`store_sellers`) | Vendedores ativos por loja, tenure tracking | ⚠️ USING (true) |
| `pre_cadastros_loja` | Fluxo store-pre-registration → approve-store-registration | ✅ |
| `agencies` | Agências externas | ⚠️ USING (true) |
| `perfis`, `permissoes_modulo`, `modulos_sistema`, `perfis_permissoes` | Sistema de permissões legado | ⚠️ USING (true) |

### Domínio Performance (check-ins, metas, relatórios)

| Tabela | Propósito | RLS |
|--------|-----------|-----|
| `lancamentos_diarios` (ex-`daily_checkins`) | Check-in diário (leads, agd, vnd, visit), unique `(seller_user_id, store_id, reference_date, metric_scope)` | ⚠️ USING (true) — endurecido por RPC |
| `checkin_correction_requests` | Pedidos de ajuste pós-9h45 | ✅ |
| `checkin_audit_logs` | Trilha imutável de correções | ✅ |
| `regras_metas_loja` (`store_meta_rules`) | Meta mensal, modo individual, benchmarks | ✅ |
| `store_meta_rules_history` | Histórico de mudanças de regras | 🚨 SEM RLS |
| `benchmarks_loja` (`store_benchmarks`) | Benchmarks lead→agd→visita→venda | ✅ |
| `metas` (ex-`goals`), `historico_metas` (ex-`goal_logs`) | Metas semanais e log de variação | ⚠️ USING (true) |
| `daily_lead_volumes` | Volumes diários derivados | ⚠️ USING (true) |
| `regras_entrega_loja` (`store_delivery_rules`) | Lista de destinatários por relatório | ✅ |
| `report_history` | Histórico de relatórios enviados | ⚠️ USING (true) |
| `feedbacks` | Feedback semanal por seller | ✅ |
| `weekly_feedback_reports` | Agregação semanal | ✅ |

### Domínio PDI 360

`pdis`, `pdi_sessoes`, `pdi_competencias`, `pdi_descritores_escala`, `pdi_niveis_cargo`, `pdi_acoes_sugeridas`, `pdi_avaliacoes_competencia`, `pdi_plano_acao`, `pdi_metas`, `pdi_reviews`, `pdi_objetivos_pessoais`, `pdi_frases_inspiracionais`, `recomendacoes_desenvolvimento`, `trilhas_desenvolvimento`, `etapas_trilha_desenvolvimento`, `atribuicoes_trilha_desenvolvimento`, `progresso_etapa_trilha`. RLS ativo (validado em migrations 2026-04-1[5-7]).

### Domínio Consultoria CRM

`clientes_consultoria`, `unidades_cliente_consultoria`, `contatos_cliente_consultoria`, `atribuicoes_consultoria`, `visitas_consultoria`, `programas_visita_consultoria` (⚠️ USING true), `etapas_modelo_visita_consultoria` (⚠️ USING true), `etapas_metodologia_consultoria` (⚠️ USING true), `modulos_cliente_consultoria`, `modelos_formulario_pmr` (⚠️ USING true), `respostas_formulario_pmr`, `catalogo_metricas_consultoria` (⚠️ USING true), `conjuntos_parametros_consultoria` (⚠️ USING true), `valores_parametros_consultoria` (⚠️ USING true), `consulting_client_metric_results/snapshots/targets`, `financeiro_consultoria` (DRE), `consulting_sales_entries`, `consulting_inventory_items`, `consulting_inventory_snapshots`, `consulting_marketing_monthly`, `consulting_import_batches/rows`, `planejamentos_estrategicos`, `itens_plano_acao`, `consulting_generated_artifacts`, `opcoes_agenda_consultoria`, `consulting_schedule_events` (⚠️ USING true). Helper de isolamento: `can_access_consulting_client(uuid)`.

### Domínio Google Integration

`tokens_oauth_consultoria` (refresh_token criptografado AES-GCM via `crypto.ts`), `estados_oauth_google_consultoria` (PKCE/state com cleanup cron), `configuracoes_calendario_consultoria`, `espelhos_agenda_google_usuario`, `pastas_drive_consultoria`, `arquivos_drive_consultoria`.

### Domínio Treinamento Institucional

`treinamentos` (⚠️ USING true), `progresso_treinamentos`, `treinamento_avaliacoes`, `sugestoes_conteudo`.

### Domínio Comunicação

`communication_instances` (⚠️ USING true), `whatsapp_share_logs`, `notifications`, `notification_reads`, `automation_configs` (⚠️ USING true), `manager_routine_logs`.

### Domínio Auditoria / Logs

`logs_auditoria` (ex-`audit_logs`), `logs_acesso_sensivel`, `store_audit_log`, `role_assignments_audit` (🚨 SEM RLS), `roles` (🚨 SEM RLS — catálogo público intencional?), `reprocess_logs`, `raw_imports`.

### Domínio Operacional / Misc

`evidencias_visita`, `documentos_loja`, `digital_products` (⚠️ USING true), `inventory` (⚠️ USING true).

### Tabelas Backup (legacy)

🚨 `migration_backup_lancamentos_diarios_duplicates_20260503`, `migration_backup_vendedores_loja_duplicates_20260503` — sem RLS, devem ser arquivadas/dropadas (vide DB-AUDIT DB-013).

---

## 3. Relacionamentos

Modelo central:

```
auth.users ──1:1── usuarios ──N:M (via vinculos_loja) ── lojas
                       │                                     │
                       │                                     ├── vendedores_loja
                       │                                     ├── regras_metas_loja
                       │                                     ├── regras_entrega_loja
                       │                                     ├── benchmarks_loja
                       │                                     └── lancamentos_diarios (FK seller+store+date)
                       │
                       ├── pdis ── pdi_sessoes ── pdi_avaliacoes_competencia ── pdi_competencias
                       │
                       └── atribuicoes_consultoria ── clientes_consultoria ──┬── visitas_consultoria
                                                                              ├── financeiro_consultoria
                                                                              ├── itens_plano_acao
                                                                              └── tokens_oauth_consultoria
```

**FKs sem `ON DELETE` explícito:** 21 (default RESTRICT). Verificar com:
`grep "REFERENCES" supabase/migrations/*.sql | grep -v "ON DELETE"`. Risco de bloqueio em deleções administrativas e dados órfãos.

---

## 4. Índices

- 101 `CREATE INDEX` ao longo das migrations.
- `20260416000000_pdi_360_performance_indexes.sql` cobre cargas críticas de PDI.
- Indexes parciais para filas/jobs ativos (`WHERE active = true`).

### ⚠️ Faltantes (sugestões priorizadas — validar antes de criar)

| Sugestão | Tabela / Coluna | Motivo |
|----------|-----------------|--------|
| IDX-001 | `lancamentos_diarios(submitted_at)` | Sort em relatórios diários |
| IDX-002 | `feedbacks(week_reference, store_id)` | Filtro semanal por loja |
| IDX-003 | `vinculos_loja(user_id, is_active)` partial | Lookup de papéis ativos do usuário (RLS hot path) |
| IDX-004 | `visitas_consultoria(client_id, scheduled_at)` | Agenda por cliente |
| IDX-005 | `notifications(user_id, read_at)` partial WHERE read_at IS NULL | Badge de não lidas |
| IDX-006 | `logs_acesso_sensivel(user_id, accessed_at)` | Compliance LGPD lookups |

---

## 5. Views e Functions

### Views

| View | Propósito |
|------|-----------|
| `view_daily_team_status` | Status de check-in do time no dia |
| `view_seller_tenure_status` | Tenure ativo/encerrado de vendedores |
| `view_sem_registro` | Sellers sem lançamento hoje |
| `view_store_daily_production` | Produção agregada da loja por dia |

### Functions / RPCs (68 únicas)

Principais (todas com `SET search_path = public` salvo onde indicado):

| Nome | Tipo | SECURITY | Args | Notas |
|------|------|----------|------|-------|
| `submit_checkin(jsonb)` | RPC | DEFINER | `p_payload` | **NOVO 2026-05-16.** Gateway de check-in; valida role, janela 09:45, FK loja/seller, scope, ON CONFLICT |
| `update_my_profile(jsonb)` | RPC | DEFINER | `p_updates` | **NOVO.** Self-service (name/phone/avatar) |
| `complete_password_change()` | RPC | DEFINER | — | **NOVO.** Limpa `must_change_password` |
| `admin_create_store(jsonb)` | RPC | DEFINER | `p_payload` | **NOVO.** Cria loja + regras + benchmarks; restrito a admins |
| `admin_update_store(uuid, jsonb)` | RPC | DEFINER | `p_store_id, p_payload` | **NOVO.** Atualiza loja; soft-close de vinculos quando `active=false` |
| `admin_archive_store(uuid)` / `admin_restore_store(uuid)` | RPC | DEFINER | — | Wrappers |
| `approve_correction_request(uuid)` | RPC | DEFINER | `request_id` | Aprova correção de check-in |
| `approve_pdi_action_evidence(uuid, jsonb)` | RPC | DEFINER | — | Aprova evidência PDI |
| `create_pdi_session_bundle(jsonb)` | RPC | DEFINER | — | Cria sessão PDI completa |
| `concluir_visita_consultoria(uuid)` | RPC | DEFINER | — | Fecha visita |
| `concluir_etapa_trilha(uuid, text)` | RPC | DEFINER | — | Avança trilha de desenvolvimento |
| `can_access_consulting_client(uuid)` | Helper | DEFINER | — | Gate de RLS consultoria |
| `check_user_role_in_store(uuid, text[])` | Helper | DEFINER | — | Gate de RLS performance (EN) |
| `tem_papel_loja(uuid, text[], uuid)` | Helper | DEFINER | — | Versão PT-BR (2026-05-07 yolo hardening) |
| `pode_lancar_checkin(uuid, uuid, date, uuid)` | Helper | DEFINER | — | Valida janela + papel + vínculo |
| `eh_admin_master_mx`, `eh_administrador_mx`, `eh_area_interna_mx` | Helpers | DEFINER | — | Atalhos de role |
| `decrypt_phone(bytea)` | Util | DEFINER | — | PII encrypt/decrypt (migration 2026-04-16) |
| `handle_new_user()` | Trigger | DEFINER | — | Hook auth.users → usuarios |
| `check_orphan_users_after_membership_deletion()` | Trigger | DEFINER | — | Limpeza de órfãos |
| `bloquear_self_update_usuarios_sensivel()` | Trigger | DEFINER | — | Bloqueia escalada via self-update |
| `enforce_feedback_seller_ack_only()` | Trigger | DEFINER | — | Vendedor só ACK em feedbacks |
| `configure_morning_report_cron / configure_weekly_feedback_cron / configure_monthly_report_cron` | Setup | DEFINER | — | pg_cron schedulers |
| `compute_dre(consulting_financials)` / `compute_dre(financeiro_consultoria)` | Calc | INVOKER | — | Overloaded em ambos nomes — pendência de cleanup |
| `gerar_recomendacoes_desenvolvimento_pdi/feedback` | RPC | DEFINER | — | Recommenders |
| `get_pdi_form_template`, `get_pdi_print_bundle`, `get_suggested_actions` | Read | DEFINER | — | Bundles de leitura |
| `is_admin`, `is_consultor`, `is_member_of`, `is_manager_of`, `is_gerente_of`, `has_store_role` | Helpers | DEFINER | — | Legados EN (coexistem com PT-BR) |

> **Risco:** coexistência de helpers EN e PT-BR — vide DB-AUDIT DB-006.

---

## 6. Edge Functions

| Função | verify_jwt | Auth Helper | Propósito | Secrets usados |
|--------|-----------|------------|-----------|----------------|
| `approve-store-registration` | ✅ true | manual | Aprova pre-cadastro de loja, cria usuários | SUPABASE_SERVICE_ROLE_KEY |
| `feedback-semanal` | (default) | `authorizeReportRequest` | Gera/envia feedback semanal (xlsx + email) | SERVICE_ROLE, RESEND_API_KEY |
| `google-calendar-events` | (default) | sessionClient + `assertClientAccess` | Lista eventos Google Calendar | SERVICE_ROLE, GOOGLE_* |
| `google-calendar-merged` | (default) | sessionClient + privacy filter | Merge calendar pessoal + central MX | SERVICE_ROLE, GOOGLE_* |
| `google-calendar-sync` | (default) | sessionClient + privacy filter | Upsert/delete eventos | SERVICE_ROLE, GOOGLE_* |
| `google-drive-files` | (default) | sessionClient + role check | Drive ops por cliente | SERVICE_ROLE, GOOGLE_* |
| `google-oauth-handler` | 🚨 **false** | — (state validation interna) | OAuth callback Google | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| `manage-store-team` | (default) | `requireAuthenticatedRole` | Add/remove membros de loja | SERVICE_ROLE |
| `register-user` | (default) | `requireAuthenticatedRole` | Cria usuário (admin path) | SERVICE_ROLE |
| `relatorio-matinal` | (default) | `authorizeReportRequest` | Relatório matinal automatizado | SERVICE_ROLE, RESEND_API_KEY |
| `relatorio-mensal` | (default) | `authorizeReportRequest` | Relatório mensal | SERVICE_ROLE, RESEND_API_KEY |
| `send-individual-feedback` | (default) | `requireAuthenticatedRole` | Envia feedback PDF individual | SERVICE_ROLE, RESEND_API_KEY |
| `send-visit-report` | (default) | `requireAuthenticatedRole` | Relatório de visita | SERVICE_ROLE, RESEND_API_KEY |
| `store-pre-registration` | 🚨 **false** | nenhum (público) | Cadastro público de loja (pre-aprovação) | SERVICE_ROLE |

**CORS:** todas com `Access-Control-Allow-Origin: *` (wildcard) em `_shared/cors.ts` — vide DB-AUDIT DB-009.

---

## 7. Migrations

- **89 arquivos** ativos em `supabase/migrations/` + `migrations_legacy/` + `_archived/`.
- **Baseline:** `00000000000000_baseline_legacy_schema.sql` + `00000000000001_mark_existing_migrations_applied.sql`.
- **Naming:** `YYYYMMDDHHMMSS_<feature>.sql` a partir de `20260407001000`.
- **Idempotência:** `IF NOT EXISTS`, `ON CONFLICT DO NOTHING/UPDATE`, `CREATE OR REPLACE FUNCTION`. ✅
- **Hardening:** migrations `*_harden_*`, `*_yolo_*_rls_hardening` aplicam fixes incrementais conforme defeitos surgem (`20260501030000`, `20260503020000`, `20260507120000`, `20260507143000`, `20260515162000`, `20260515201000`).
- **Migration legadas problemáticas:** 2 tabelas backup `migration_backup_*_20260503` deixadas no schema sem cleanup task (DB-013).

---

## 8. Multi-Tenancy — Propagação

### `store_id` (lojas)

1. **Client (TS):** Supabase JWT → `auth.uid()` no PostgREST.
2. **RLS:** ~95 tabelas filtram por `vinculos_loja` via `tem_papel_loja` / `check_user_role_in_store`.
3. **RPC:** funções `SECURITY DEFINER` revalidam `auth.uid()` + `usuarios.role` + `vinculos_loja.is_active` antes de escrita.
4. **Edge Functions:** `requireAuthenticatedRole` + `sessionClient` (JWT do usuário) + `adminClient` (service role) separados.

### `client_id` (clientes_consultoria)

1. Helper `can_access_consulting_client(p_client_id)` checa:
   - role interna MX (admin/consultor) → full access
   - OR `atribuicoes_consultoria(user_id=auth.uid(), client_id=p_client_id, is_active=true)`
2. RLS de `consulting_*` chama o helper.

### Riscos

- ⚠️ Tabelas catálogo (`catalogo_metricas_consultoria`, `etapas_metodologia_consultoria`, `modelos_formulario_pmr` etc.) usam `USING (true)` — aceitável SE só armazenam catálogo público MX, mas precisa confirmar.
- ⚠️ `lancamentos_diarios` com `USING (true)` + gate apenas via RPC `submit_checkin`. Qualquer cliente authenticated chamando PostgREST direto poderia INSERT/UPDATE — bloqueio depende de revogar `GRANT` da tabela, NÃO auditado nas migrations.
