# MAPEAMENTO COMPLETO — MX PERFORMANCE

> Última atualização: 15/04/2026 | Commit: `ec3984d`

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Stack e Infraestrutura](#2-stack-e-infraestrutura)
3. [Banco de Dados (45 tabelas + 4 views)](#3-banco-de-dados)
4. [Edge Functions (6 + _shared)](#4-edge-functions)
5. [Rotas e Páginas (38 rotas, 34 lazy-loaded)](#5-rotas-e-páginas)
6. [Hooks (16 arquivos, ~40 hooks)](#6-hooks)
7. [Componentes (Design System Atomic)](#7-componentes)
8. [Lib: Cálculos, Validação, Automação](#8-lib)
9. [Features](#9-features)
10. [Testes](#10-testes)
11. [Segurança (RLS + Auth)](#11-segurança)
12. [Deploy e CI/CD](#12-deploy-e-cicd)

---

## 1. Visão Geral

O **MX PERFORMANCE** é um sistema operacional de gestão de performance comercial para redes de lojas automotivas. Funciona como SaaS multi-store com 4 roles:

| Role | Descrição | Landing page |
|------|-----------|-------------|
| `admin` | Gestor MX (consultor interno) | `/painel` |
| `dono` | Dono de agência | `/lojas` |
| `gerente` | Gerente de unidade | `/loja` |
| `vendedor` | Vendedor/especialista | `/home` |

**Zero Trust:** não-admin sem memberships ativas → deslogado automaticamente via `check_orphan_users_after_membership_deletion` trigger.

**Módulos**: 19 módulos ativos (Checkin, Ranking, Feedback, PDI 360, Matinal, Mensal, Semanal, Consultoria CRM, DRE Financeiro, Google Calendar, Notificações, Treinamentos, Metas, Funil, Equipe, Rotina Gerente, BI, Auditoria, Reprocessamento).

---

## 2. Stack e Infraestrutura

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Roteamento | React Router v6 (BrowserRouter) |
| Estado | Context API (AuthProvider) |
| Design System | Custom Atomic (atoms/molecules/organisms) |
| Estilo | Tailwind CSS + CSS variables (MX tokens) |
| Animação | Framer Motion (`motion/react`) |
| Gráficos | Recharts (RadarChart, AreaChart) |
| Ícones | Lucide React |
| Formulários | Zod (validação) |
| Backend | Supabase (Postgres + Auth + Storage) |
| Edge Functions | Deno Runtime (Supabase Functions) |
| Email | Resend API |
| Excel | ExcelJS + `xlsx` |
| Agendamento | node-cron (matinal, semanal, mensal) |
| Deploy | Vercel (`mxperformance.vercel.app`) |
| CI | GitHub Actions (Atomic Design Enforcement) |
| Repo | `github.com/pglemos/MXGESTAOPREDITIVA` |

### Bundle Chunks (vite.config.ts)

| Chunk | Conteúdo | Tamanho |
|-------|----------|---------|
| `vendor-react` | React + React DOM + Router | ~140KB |
| `vendor-ui` | lucide-react + motion | ~168KB |
| `vendor-charts` | recharts | ~420KB |
| `vendor-export` | xlsx + exceljs | ~350KB |
| `vendor-supabase` | @supabase/supabase-js | ~60KB |
| `vendor-utils` | date-fns + clsx + twMerge + Zod | ~80KB |

---

## 3. Banco de Dados

> **Validado via Supabase Management API** — 45 tabelas BASE TABLE + 4 views no schema `public`.

### 3.1 Tabelas Core (pre-existentes)

| Tabela | Colunas | Propósito | RLS |
|--------|---------|-----------|-----|
| `users` | 10 | Perfil de usuário (id, name, email, role, active, is_venda_loja, phone) | SELECT authenticated, UPDATE own |
| `stores` | 7 | Lojas (id, name, active, manager_email, source_mode) | Role matrix (admin/member) |
| `memberships` | 5 | Vínculo usuário↔loja (user_id, store_id, role) | SELECT all, WRITE admin |
| `daily_checkins` | 32 | Checkin diário (leads, visitas, vendas por canal) | Role matrix (seller own, manager store) |
| `goals` | 8 | Metas por vendedor/store | Role matrix |
| `benchmarks` | 5 | Benchmarks legados por loja | SELECT admin/owner/manager |
| `feedbacks` | 23 | Feedback semanal estruturado | Role matrix |
| `pdis` | 29 | PDI legado + colunas 2.0 | Role matrix |
| `notifications` | 16 | Notificações in-app (recipient, sender, broadcast) | recipient_id = auth.uid() |
| `notification_reads` | 4 | Controle de leitura | user_id = auth.uid() |
| `trainings` | 8 | Catálogo de treinamentos | SELECT all, WRITE admin |
| `training_progress` | 4 | Progresso do usuário em treinamentos | user_id control |
| `digital_products` | 6 | Catálogo de produtos digitais | SELECT all, WRITE admin |
| `roles` | 4 | Lookup de roles | — |
| `user_roles` | 5 | Atribuição de roles (user_id, role_id, assigned_by, assigned_at) | — |
| `goal_logs` | 6 | Audit de alterações em goals (goal_id, prev_value, new_value, changed_by) | INSERT/SELECT authenticated |
| `inventory` | 9 | Inventário/estojo (model, year, price, agency_id, aging_days, plate, status) | OPEN (authenticated + anon) |
| `agencies` | 5 | Agências (name, plan, logo_url) | SELECT public |
| `daily_lead_volumes` | 6 | Volume de leads por dia (seller_id, date, volume, agency_id) | OPEN (authenticated + anon) |
| `audit_logs` | 7 | Audit genérico (user_id, action, entity, entity_id, details_json) | INSERT authenticated, SELECT consultor |

### 3.2 Tabelas de Automação e Comunicação (legadas, pre-existentes)

| Tabela | Colunas | Propósito | RLS |
|--------|---------|-----------|-----|
| `automation_configs` | 13 | Config de automação (report_type, schedule_cron, recipients, ai_context, target_roles) | OPEN (authenticated + anon) |
| `communication_instances` | 10 | Instâncias de comunicação/WhatsApp (provider, status, api_url, api_key, instance_name) | OPEN (authenticated + anon) |
| `report_history` | 7 | Histórico de relatórios gerados (config_id, report_type, data_snapshot, ai_insight) | OPEN (authenticated + anon) |
| `role_assignments_audit` | 6 | Audit de atribuição de roles (user_id, role_name, assigned_by, action) | — |

### 3.2 Tabelas Canonical Domain (migradas)

| Tabela | Propósito | Chave | Migration |
|--------|-----------|-------|-----------|
| `store_sellers` | Tenure de vendedores (started_at, ended_at, is_active) | UNIQUE (store_id, seller_user_id, started_at) | `20260407001000` |
| `store_benchmarks` | Benchmarks por loja (lead_to_agend, agend_to_visit, visit_to_sale) | PK store_id | `20260407001000` |
| `store_delivery_rules` | Destinatários de email (matinal/weekly/monthly) + WhatsApp | PK store_id | `20260407001000` |
| `store_meta_rules` | Configuração da loja (meta, benchmarks, projection_mode, venda_loja) | PK store_id | `20260407001000` |
| `store_meta_rules_history` | Audit log imutável de mudanças em meta_rules | id | `20260407001000` |
| `reprocess_logs` | Batch de reprocessamento (status, rows, warnings, errors) | id | `20260407001000` |
| `raw_imports` | Dados brutos de importação CSV | id → reprocess_logs | `20260407001000` |

### 3.3 Tabelas Operacionais

| Tabela | Propósito | Migration | Status |
|--------|-----------|-----------|--------|
| `manager_routine_logs` | Rotina diária do gerente (audit trail) | `20260407003000` | Em produção |
| `whatsapp_share_logs` | Log de compartilhamento WhatsApp | `20260407005000` | Em produção |
| `weekly_feedback_reports` | Snapshots de relatório semanal (email tracking) | `20260407006000` | Em produção |
| `checkin_correction_requests` | Solicitação de correção de checkin (seller→manager) | `20260411001000` | **Migration pendente** |
| `checkin_audit_logs` | Log imutável de alterações em checkins | `20260411001000` | **Migration pendente** |

### 3.4 Tabelas PDI 360 (Migrations pendentes — não aplicadas ao banco)

> **ATENÇÃO:** As tabelas abaixo estão definidas em migrations SQL no repo mas NÃO existem no banco de produção. As RPCs que dependem delas também não estão disponíveis.

| Tabela | Propósito |
|--------|-----------|
| `pdi_niveis_cargo` | Escala de níveis de cargo (1-5) |
| `pdi_descritores_escala` | Descritores por cargo+nivel |
| `pdi_competencias` | Catálogo de competências (técnica/comportamental) |
| `pdi_acoes_sugeridas` | Ações sugeridas por competência |
| `pdi_frases_inspiracionais` | Frases para relatório PDI |
| `pdi_sessoes` | Sessão PDI (colaborador + gerente + status) |
| `pdi_metas` | Metas 6/12/24 meses (pessoal/profissional) |
| `pdi_avaliacoes_competencia` | Notas de competência por sessão |
| `pdi_plano_acao` | Plano de ação com impacto/custo/status |
| `pdi_objetivos_pessoais` | Objetivos pessoais de desenvolvimento |

**Tabelas PDI já em produção:** `pdis` (29 colunas), `pdi_reviews` (7 colunas)
| `pdi_reviews` | Reviews/evoluções de PDI |

### 3.5 Tabelas Consultoria CRM

| Tabela | Propósito |
|--------|-----------|
| `consulting_clients` | Empresas cliente (name, cnpj, status) |
| `consulting_client_units` | Unidades/filiais do cliente |
| `consulting_client_contacts` | Contatos do cliente |
| `consulting_assignments` | Atribuição consultor↔cliente (responsavel/auxiliar/viewer) |
| `consulting_methodology_steps` | Checklist de visitas (1-7) |
| `consulting_visits` | Visitas de consultoria (agendamento + execução) |
| `consulting_financials` | DRE mensal por cliente (receita, custos, ROI) |
| `consulting_oauth_tokens` | Tokens Google OAuth2 criptografados (AES-GCM) |
| `consulting_calendar_settings` | Configuração sync Google Calendar |
| `consulting_google_oauth_states` | Estados temporários OAuth (TTL 10min) |

### 3.6 Funções e Triggers Principais

> **Validado via Supabase Management API** — 27 funções + 29 triggers.

| Função | Propósito |
|--------|-----------|
| `is_admin()` | Verifica se user é admin (2 overloads) |
| `has_store_role(store_id, roles[])` | Verifica role do user na loja |
| `is_owner_of(store_id)` | admin OU dono da loja |
| `is_manager_of(store_id)` | admin OU gerente da loja |
| `is_member_of(store_id)` | admin OU membro da loja |
| `is_consultor()` | Verifica se user é consultor (usado em audit_logs) |
| `is_gerente_of(store_id)` | Verifica se é gerente (variante) |
| `get_user_agency_id()` | Retorna agency_id do user corrente |
| `check_user_role_in_store(store_id, roles[])` | RLS-safe role checker |
| `can_access_consulting_client(client_id)` | admin OU assignment no cliente |
| `normalize_mx_role(role)` | Mapeia roles legados → canônicos |
| `handle_new_user()` | Trigger: cria profile automático no auth signup |
| `sync_daily_checkins_canonical()` | Sync colunas legadas↔canônicas |
| `update_updated_at()` / `update_updated_at_column()` / `update_updated_at_column_canonical()` | Generic trigger: updated_at = now() (3 variantes) |
| `log_store_meta_rules_changes()` | Audit para store_meta_rules |
| `process_import_data(log_id)` | Processa raw_imports → daily_checkins |
| `configure_*_cron()` | 3 funções: agenda pg_cron (matinal 08:30, semanal seg 12:30, mensal dia 1 10:30) |
| `enforce_feedback_seller_ack_only()` | Vendedor só pode ack, não editar |
| `send_broadcast_notification()` | Notificação em massa |
| `sync_notification_reads()` | Trigger: escreve notification_reads |
| `sync_pdi_legacy_shadow_columns()` | Compatibilidade PDI legada |
| `set_manager_routine_logs_updated_at()` | Trigger updated_at em routine logs |

### 3.7 Triggers (29)

| Trigger | Tabela | Evento | Função |
|---------|--------|--------|--------|
| `sync_daily_checkins_canonical` | daily_checkins | BEFORE INSERT/UPDATE | `sync_daily_checkins_canonical()` |
| `trg_checkins_updated` | daily_checkins | BEFORE UPDATE | `update_updated_at()` |
| `update_daily_checkins_updated_at` | daily_checkins | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_users_updated_at` | users | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_stores_updated_at` | stores | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_store_sellers_updated_at` | store_sellers | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_store_benchmarks_updated_at` | store_benchmarks | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_store_delivery_rules_updated_at` | store_delivery_rules | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_store_meta_rules_updated_at` | store_meta_rules | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `tr_log_store_meta_rules_changes` | store_meta_rules | AFTER UPDATE | `log_store_meta_rules_changes()` |
| `manager_routine_logs_set_updated_at` | manager_routine_logs | BEFORE UPDATE | `set_manager_routine_logs_updated_at()` |
| `weekly_feedback_reports_set_updated_at` | weekly_feedback_reports | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `feedbacks_seller_ack_only` | feedbacks | BEFORE UPDATE | `enforce_feedback_seller_ack_only()` |
| `pdis_sync_legacy_shadow_columns` | pdis | BEFORE INSERT/UPDATE | `sync_pdi_legacy_shadow_columns()` |
| `trg_pdis_updated` | pdis | BEFORE UPDATE | `update_updated_at()` |
| `trg_goals_updated` | goals | BEFORE UPDATE | `update_updated_at()` |
| `notifications_sync_notification_reads` | notifications | AFTER INSERT/UPDATE | `sync_notification_reads()` |
| `update_consulting_clients_updated_at` | consulting_clients | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_consulting_client_units_updated_at` | consulting_client_units | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_consulting_client_contacts_updated_at` | consulting_client_contacts | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_consulting_assignments_updated_at` | consulting_assignments | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_consulting_oauth_tokens_updated_at` | consulting_oauth_tokens | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_consulting_calendar_settings_updated_at` | consulting_calendar_settings | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_consulting_google_oauth_states_updated_at` | consulting_google_oauth_states | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_consulting_visits_updated_at` | consulting_visits | BEFORE UPDATE | `update_updated_at_column_canonical()` |
| `update_consulting_financials_updated_at` | consulting_financials | BEFORE UPDATE | `update_updated_at_column_canonical()` |

---

## 4. Edge Functions

### 4.1 Funções Ativas (6)

| Função | Trigger | Input (Zod) | Propósito |
|--------|---------|-------------|-----------|
| `relatorio-matinal` | pg_cron 08:30 BRT + manual | `{store_id?, dry_run?, force?}` | Gera relatório matinal por loja: ranking, meta, projeção, XLSX, email via Resend |
| `relatorio-mensal` | pg_cron dia 1 10:30 BRT + manual | `{store_id?, dry_run?, force?}` | Fechamento mensal por loja |
| `feedback-semanal` | pg_cron segunda 12:30 BRT + manual | `{store_id?, dry_run?, force?}` | Feedback semanal com diagnóstico de funil por vendedor |
| `send-individual-feedback` | Manual (botão no dashboard) | `{feedbackId: uuid}` | Envia feedback individual por email |
| `google-oauth-handler` | Botão "Conectar Agenda" | `{clientId?}` + OAuth callback | OAuth2 Google Calendar (authorization code flow) |
| `google-calendar-events` | Consulta de eventos | `{clientId?, maxResults?, timeMin?, timeMax?}` | Busca eventos Google Calendar com auto-refresh token |

### 4.2 _shared/ (9 módulos extraídos)

| Módulo | Exporta |
|--------|---------|
| `cors.ts` | `corsHeaders` |
| `response.ts` | `jsonResponse()` |
| `format.ts` | `formatPtBrDate()`, `escapeXml()`, `escapeHtml()` |
| `supabase-client.ts` | `createServiceClient()`, `createResendClient()` |
| `store.ts` | `buildStoreQuery()` |
| `email.ts` | `sendReportEmail()` |
| `crypto.ts` | `requireEnv()`, `toBase64Url()`, `fromBase64Url()`, `deriveAesKey()`, `encryptToken()`, `decryptToken()` |
| `google.ts` | `parseClientId()`, `refreshAccessToken()`, `createSessionClient()`, `assertClientAccess()` |
| `schemas.ts` | `reportRequestSchema`, `sendFeedbackSchema`, `calendarEventsSchema`, `parseReportBody()`, `parseStrictBody()` |

---

## 5. Rotas e Páginas

### 5.1 Rotas Públicas

| Path | Component | Descrição |
|------|-----------|-----------|
| `/login` | `Login` | Login com email/senha + rate limiting (5 tentativas) |
| `/privacy` | `Privacy` | Política de privacidade |
| `/terms` | `Terms` | Termos de uso |

### 5.2 Rotas Protegidas (todas lazy-loaded)

#### Redirects

| Path | Destino |
|------|---------|
| `/` | Role-based: admin→`/painel`, dono→`/lojas`, gerente→`/loja`, vendedor→`/home` |
| `/dashboard` | Mesmo que `/` |
| `/settings` → `/configuracoes` | Redirect permanente |
| `/funnel` → `/funil` | Redirect permanente |
| `/team` → `/equipe` | Redirect permanente |
| `/training` → `/treinamentos` | Redirect permanente |
| `/goal-management` → `/metas` | Redirect com query string |

#### Vendedor

| Path | Component | Descrição |
|------|-----------|-----------|
| `/home` | `VendedorHome` | Dashboard do vendedor: MX Score, meta, agendamentos, prescrição tática |
| `/checkin` | `Checkin` | Formulário de checkin diário (funil completo) |
| `/historico` | `Historico` | Histórico de checkins com filtros |
| `/ranking` | `Ranking` | Ranking da loja |
| `/feedback` | `VendedorFeedback` | Feedback recebido (view + ack) |
| `/pdi` | `VendedorPDI` | PDI pessoal |
| `/treinamentos` | `VendedorTreinamentos` | Treinamentos prescritos |
| `/notificacoes` | `Notificacoes` | Caixa de notificações |
| `/perfil` | `Perfil` | Editar perfil + avatar + senha |

#### Gerente

| Path | Component | Descrição |
|------|-----------|-----------|
| `/loja` | `DashboardLoja` | Dashboard da loja (métricas agregadas) |
| `/loja/:storeSlug` | `DashboardLoja` | Dashboard de loja específica |
| `/equipe` | `Equipe` | Gestão de equipe (vigência, membership) |
| `/funil` | `Funil` | Análise de funil (geral + por vendedor) |
| `/metas` | `GoalManagement` | Configuração de metas e benchmarks |
| `/rotina` | `RotinaGerente` | Rotina diária do gerente |
| `/feedback` | `GerenteFeedback` | Criar/gerenciar feedbacks |
| `/pdi` | `GerentePDI` | Gerenciar PDIs da equipe |
| `/treinamentos` | `GerenteTreinamentos` | Treinamentos da equipe |
| `/auditoria` | `AiDiagnostics` | Diagnóstico forense de funil |

#### Admin / Dono

| Path | Component | Descrição |
|------|-----------|-----------|
| `/painel` | `PainelConsultor` | Dashboard administrativo (rede toda) |
| `/lojas` | `Lojas` | CRUD de lojas |
| `/produtos` | `ProdutosDigitais` | Catálogo de produtos digitais |
| `/configuracoes` | `Configuracoes` | Settings do usuário |
| `/configuracoes/operacional` | `OperationalSettings` | Config operacional (admin) |
| `/configuracoes/reprocessamento` | `Reprocessamento` | Importação CSV + reprocessamento |
| `/relatorio-matinal` | `MorningReport` | Relatório matinal manual |
| `/relatorios/performance-vendas` | `SalesPerformance` | BI: gráficos de performance |
| `/relatorios/performance-vendedores` | `SellerPerformance` | Ranking detalhado por vendedor |
| `/notificacoes` | `ConsultorNotificacoes` | Notificações admin |

#### Consultoria CRM

| Path | Component | Descrição |
|------|-----------|-----------|
| `/consultoria` | `Consultoria` | Redirect para `/consultoria/clientes` |
| `/consultoria/clientes` | `ConsultoriaClientes` | Lista de clientes CRM |
| `/consultoria/clientes/:clientId` | `ConsultoriaClienteDetalhe` | Detalhe: overview, visitas, financeiro, unidades, contatos, Google Calendar |
| `/consultoria/clientes/:clientId/visitas/:visitNumber` | `ConsultoriaVisitaExecucao` | Execução de visita com checklist |

#### PDI Print

| Path | Component | Descrição |
|------|-----------|-----------|
| `/pdi/:id/print` | `PDIPrint` | Relatório PDI para impressão |

### 5.3 Matriz de Acesso por Role

| Rota | admin | dono | gerente | vendedor |
|------|-------|------|---------|----------|
| `/home` | redirect `/painel` | VendedorHome | VendedorHome | VendedorHome |
| `/checkin` | Checkin | Checkin | Checkin | Checkin |
| `/historico` | redirect `/painel` | Historico | Historico | Historico |
| `/ranking` | Ranking | Ranking | Ranking | Ranking |
| `/treinamentos` | ConsultorTreinamentos | redirect `/lojas` | GerenteTreinamentos | VendedorTreinamentos |
| `/feedback` | GerenteFeedback | GerenteFeedback | GerenteFeedback | VendedorFeedback |
| `/pdi` | GerentePDI | GerentePDI | GerentePDI | VendedorPDI |
| `/notificacoes` | ConsultorNotificacoes | Notificacoes | Notificacoes | Notificacoes |
| `/equipe` | Equipe | Equipe | Equipe | redirect `/home` |
| `/rotina` | RotinaGerente | redirect `/lojas` | RotinaGerente | redirect `/home` |
| `/painel` | PainelConsultor | PainelConsultor | PainelConsultor | PainelConsultor |
| `/lojas` | Lojas | Lojas | Lojas | Lojas |
| `/configuracoes/reprocessamento` | Reprocessamento | redirect `/lojas` | redirect `/loja` | redirect `/home` |
| `/auditoria` | AiDiagnostics | redirect `/lojas` | AiDiagnostics | redirect `/home` |
| `/consultoria/*` | Full | Full | Full | Full |
| `/perfil` | Perfil | Perfil | Perfil | Perfil |

### 5.4 Navegação Sidebar (role-segmentada)

**admin** — 3 categorias:
- Governança MX: Painel Geral, Lojas, Consultoria, Metas, Benchmarks, Funil
- Rituais MX: Checkin, Ranking, Matinal Oficial, Feedback/PDI, Treinamentos, Produtos Digitais, Notificações
- Sustentação: Configuração Operacional, Configurações

**dono** — 2 categorias:
- Visão Executiva: Minhas Lojas, Performance, Metas, Funil
- Acompanhamento: Matinal Oficial, Feedback/PDI

**gerente** — 2 categorias:
- Operação Loja: Painel da Loja, Equipe, Rotina Diária, Ranking
- Gestão de Gente: Feedback Estruturado, PDI, Treinamentos

**vendedor** — 2 categorias:
- Meu Ritual: Home, Lançamento Diário, Histórico, Ranking
- Evolução: Feedback, PDI, Treinamentos

---

## 6. Hooks

### 6.1 Auth e Context

| Hook | Arquivo | Propósito |
|------|---------|-----------|
| `AuthProvider` / `useAuth()` | `useAuth.tsx` | Context central: sessão Supabase, perfil, memberships, roles, multi-store switching |

### 6.2 Checkin e Auditoria

| Hook | Arquivo | Tabelas | Propósito |
|------|---------|---------|-----------|
| `useCheckins()` | `useCheckins.ts` | `daily_checkins` | CRUD de checkins com deadline enforcement (09:30) e sanitização |
| `useMyCheckins()` | `useCheckins.ts` | `daily_checkins` | Checkins do usuário corrente |
| `useCheckinsByDateRange()` | `useCheckins.ts` | `daily_checkins` | Checkins por intervalo de datas |
| `useCheckinAuditor()` | `useCheckinAuditor.ts` | `checkin_correction_requests`, `checkin_audit_logs` | Fluxo de correção: request → approve/reject |

### 6.3 Equipe e Store

| Hook | Arquivo | Tabelas | Propósito |
|------|---------|---------|-----------|
| `useTeam()` | `useTeam.ts` | `store_sellers`, `memberships`, `daily_checkins` | Sellers com status checkin + vigência |
| `useStores()` | `useTeam.ts` | `stores`, `store_delivery_rules` | CRUD de lojas (role-filtered) |
| `useMemberships()` | `useTeam.ts` | `memberships` | Todas memberships com store names |
| `useStoresStats()` | `useTeam.ts` | `store_sellers`, `daily_checkins` | Stats por loja (sellers, checked-in, disciplina) |
| `useSellersByStore()` | `useTeam.ts` | `store_sellers`, `daily_checkins` | Sellers de uma loja específica |
| `useNetworkHierarchy()` | `useNetworkHierarchy.ts` | `stores`, `memberships`, `daily_checkins` | Hierarquia completa da rede (admin) |
| `useOperationalSettings()` | `useOperationalSettings.ts` | `stores`, `store_delivery_rules`, `store_benchmarks`, `store_meta_rules`, `store_sellers` | Settings operacionais completos (admin) |

### 6.4 Ranking e Performance

| Hook | Arquivo | Tabelas | Propósito |
|------|---------|---------|-----------|
| `useRanking()` | `useRanking.ts` | `daily_checkins`, `store_sellers`, `store_meta_rules` | Ranking mensal com MX Score + cache 5min |
| `useGlobalRanking()` | `useRanking.ts` | `daily_checkins`, `store_sellers` | Ranking rede toda (admin) |
| `useStorePerformance()` | `useRanking.ts` | `stores`, `store_meta_rules`, `daily_checkins`, `store_sellers` | Performance por loja (meta, realizado, semáforo) |
| `useSellerMetrics()` | `useSellerMetrics.ts` | (computação pura) | Métricas do vendedor: vendas, canais, meta, projeção |
| `useStoreSales()` | `useStoreSales.ts` | (computação pura) | Agregação de vendas da loja com regras venda_loja |

### 6.5 Metas e Benchmarks

| Hook | Arquivo | Tabelas | Propósito |
|------|---------|---------|-----------|
| `useGoals()` | `useGoals.ts` | `store_meta_rules` | Meta mensal da loja |
| `useAllStoreGoals()` | `useGoals.ts` | `store_meta_rules`, `store_benchmarks` | Todas metas + benchmarks (admin) |
| `useStoreMetaRules()` | `useGoals.ts` | `store_meta_rules` | Full meta rules da loja |
| `useStoreGoal()` | `useGoals.ts` | `store_meta_rules` | Meta de uma loja específica |

### 6.6 Feedback, PDI, Treinamentos

| Hook | Arquivo | Tabelas | Propósito |
|------|---------|---------|-----------|
| `useFeedbacks()` | `useData.ts` | `feedbacks` | CRUD feedback semanal |
| `useWeeklyFeedbackReports()` | `useData.ts` | `weekly_feedback_reports` | Relatórios semanais (últimos 12) |
| `usePDIs()` | `useData.ts` | `pdis`, `pdi_reviews` | CRUD PDI + reviews |
| `useMyPDIs()` | `useData.ts` | `pdis` | PDIs do usuário corrente |
| `useTrainings()` | `useData.ts` | `trainings`, `training_progress` | Catálogo + progresso |
| `useTeamTrainings()` | `useData.ts` | `memberships`, `trainings`, `daily_checkins`, `training_progress` | Progresso por vendedor (gerente) |
| `usePDI_MX()` | `usePDI_MX.ts` | `pdi_niveis_cargo` + RPCs | Motor PDI 360: wizard, templates, bundles |
| `useTacticalPrescription()` | `useTacticalPrescription.ts` | (computação pura) | Prescrição tática: gargalo → treinamento |

### 6.7 Notificações e Rotina

| Hook | Arquivo | Tabelas | Propósito |
|------|---------|---------|-----------|
| `useNotifications()` | `useData.ts` | `notifications` + RPC broadcast | CRUD notificações + broadcast |
| `useSystemBroadcasts()` | `useData.ts` | `notifications` | Broadcasts admin |
| `useManagerRoutine()` | `useManagerRoutine.ts` | `manager_routine_logs` | Rotina diária do gerente (log + register) |

### 6.8 Consultoria

| Hook | Arquivo | Tabelas | Propósito |
|------|---------|---------|-----------|
| `useConsultingClients()` | `useConsultingClients.ts` | `consulting_clients` | Lista/cria clientes |
| `useConsultingClientDetail()` | `useConsultingClients.ts` | 6 tabelas consulting_* | CRUD completo: units, contacts, assignments, visits, financials |
| `useConsultingMethodology()` | `useConsultingClients.ts` | `consulting_methodology_steps` | Checklist de visitas |
| `useConsultingClientMetrics()` | `useConsultingClients.ts` | (derivado) | Métricas agregadas |
| `useConsultingAgenda()` | `useConsultingAgenda.ts` | `consulting_assignments`, `consulting_oauth_tokens` + Edge Functions | Google Calendar OAuth + eventos |

---

## 7. Componentes

### 7.1 Atoms (5)

| Component | Arquivo | Descrição |
|-----------|---------|-----------|
| `Button` | `atoms/Button.tsx` | Polymorphic button com CVA variants (primary/secondary/success/warning/info/danger/outline/ghost) + sizes |
| `Typography` | `atoms/Typography.tsx` | Polymorphic text (h1/h2/h3/p/caption/tiny/mono) com tons (default/brand/success/warning/info/error/muted/white) |
| `Skeleton` | `atoms/Skeleton.tsx` | Loading placeholder com shimmer (rect/circle) |
| `Input` | `atoms/Input.tsx` | Input field com MX design tokens |
| `Textarea` | `atoms/Textarea.tsx` | Textarea com min-height 120px |
| `Badge` | `atoms/Badge.tsx` | Inline badge com variants de cor |

### 7.2 Molecules (3)

| Component | Arquivo | Descrição |
|-----------|---------|-----------|
| `Card` | `molecules/Card.tsx` | Compound card (CardHeader/Title/Description/Content/Footer) |
| `FormField` | `molecules/FormField.tsx` | Label + Input + error com auto-id |
| `MXScoreCard` | `molecules/MXScoreCard.tsx` | Score card com ícone + valor + sub-label (React.memo) |

### 7.3 Organisms (1)

| Component | Arquivo | Descrição |
|-----------|---------|-----------|
| `DataGrid<T>` | `organisms/DataGrid.tsx` | Data grid responsivo: desktop table + mobile cards, skeletons, empty state, Framer Motion (React.memo) |

### 7.4 Admin (1)

| Component | Arquivo | Descrição |
|-----------|---------|-----------|
| `AdminNetworkView` | `admin/AdminNetworkView.tsx` | Accordion de rede: stores + members + role toggle |

### 7.5 Layout (3)

| Component | Arquivo | Descrição |
|-----------|---------|-----------|
| `Layout` | `Layout.tsx` | Shell: sidebar role-based + header + store switcher + mobile nav |
| `LegacyModuleShell` | `LegacyModuleShell.tsx` | Wrapper com ornamentos decorativos |
| `AuthProvider` | `auth-provider.tsx` | Legacy wrapper do useAuth |

---

## 8. Lib

### 8.1 calculations.ts (Motor de Cálculos)

| Função | Propósito |
|--------|-----------|
| `calcularTotais(checkin)` | agd_total + vnd_total |
| `calcularAtingimento(vendas, meta)` | % atingimento |
| `calcularFaltaX(meta, vendas)` | Gap restante |
| `calcularProjecao(vendas, decorridos, total)` | Projeção mensal |
| `calcularRitmo(meta, vendas, restantes)` | Ritmo diário necessário |
| `getDiasInfo(ref?, mode?)` | Dias do mês (calendar ou business mode) |
| `calcularFunil(checkins)` | Agregação funil + taxas de conversão |
| `gerarDiagnosticoMX(funil, isVendaLoja?, rules?)` | Diagnóstico de gargalo vs benchmarks |
| `calcularScoreMX(vendas, meta, funil, checkinCount, days)` | MX Score (vendas + conversão * disciplina) |
| `getOperationalStatus(pacing, discipline)` | Status operacional (EXCELÊNCIA/NO RITMO/ALERTA/CRÍTICO/INDISCIPLINA) |
| `formatWhatsAppMorningReport(...)` | Texto WhatsApp matinal |
| `formatStructuredWhatsAppFeedback(...)` | Texto WhatsApp feedback |
| `MX_BENCHMARKS` | Constantes: 20/60/33 |

### 8.2 Services

| Arquivo | Exporta | Propósito |
|---------|---------|-----------|
| `supabase.ts` | `supabase`, `getSupabaseClient` | Singleton client |
| `auth-service.ts` | `getUserData()` | Fetch role/agency com timeout |
| `services/checkin-service.ts` | `storeCheckin()` | Storage idempotente + audit |
| `export.ts` | `exportToExcel()` | Geração XLSX via `xlsx` |
| `migration-validator.ts` | `validateLegacyCSV()` | Validação CSV legado |

### 8.3 API Layer

| Arquivo | Exporta |
|---------|---------|
| `api/stores.ts` | `getStoreGovernance()`, `updateStoreGovernance()` |
| `api/manager.ts` | `getManagerRoutineData()`, `getRankingSnapshot()` |

### 8.4 Validation

| Arquivo | Exporta | Propósito |
|---------|---------|-----------|
| `validation/legacy-normalizer.ts` | `normalizeLegacyData()` | Mapeia headers CSV legados → campos canônicos |
| `validation/checkin-validator.ts` | `validateCheckinPayload()` | Validação e tipagem de payload de checkin |

### 8.5 Automação (`lib/automation/`)

| Arquivo | Exporta | Propósito |
|---------|---------|-----------|
| `scheduler.ts` | `startAutomationJobs()` | 3 cron jobs: matinal (10:30), semanal (seg 12:30), mensal (dia 1 10:30) |
| `cron-scheduler.ts` | `runMatinalWorkflow()` | Workflow matinal completo |
| `monthly/close-engine.ts` | `runMonthlyCloseWorkflow()` | Fechamento mensal |
| `weekly/feedback-engine.ts` | `runWeeklyFeedbackWorkflow()` | Feedback semanal automático |
| `email/sender.ts` | `sendEmailReport()` | Envio de email via Resend |
| `email/templates/matinal.ts` | `getMatinalEmailTemplate()` | Template HTML matinal |
| `email/templates/weekly-feedback.ts` | `getWeeklyFeedbackEmailTemplate()` | Template HTML feedback |
| `reports/xlsx-generator.ts` | `generateMorningReportXlsx()`, `generateFeedbackXlsx()` | Geração Excel via ExcelJS |
| `whatsapp/script-generator.ts` | `generateWhatsAppScript()` | Texto WhatsApp diagnóstico |
| `admin/overview.ts` | `getAdminExecutiveOverview()` | Overview executivo via RPC |
| `training/engine.ts` | `trackTrainingConsumption()`, `getTrainingByBottleneck()` | Progresso + prescrição por gargalo |
| `logger.ts` | `logAutomation()` | Logger de automação |

---

## 9. Features

### 9.1 Consultoria (`features/consultoria/`)

| Arquivo | Exporta | Propósito |
|---------|---------|-----------|
| `types.ts` | 10 interfaces | Tipos do módulo consultoria |
| `components/GoogleCalendarView.tsx` | `GoogleCalendarView` | View de eventos Google Calendar com OAuth |

### 9.2 PDI (`features/pdi/`)

| Arquivo | Exporta | Propósito |
|---------|---------|-----------|
| `WizardPDI.tsx` | `WizardPDI` | Wizard 4 etapas: cargo → metas → competências (radar chart) → plano de ação |

### 9.3 Feedback (`features/feedback/`)

| Arquivo | Exporta | Propósito |
|---------|---------|-----------|
| `WeeklyStoreReport.tsx` | `WeeklyStoreReport` | Relatório semanal print-ready |
| `PrintableFeedback.tsx` | `PrintableFeedback` | Feedback individual print-ready |

---

## 10. Testes

**66 testes passando** (bun test, 13 arquivos)

| Arquivo | Escopo |
|---------|--------|
| `src/lib/calculations.test.ts` | Motor de cálculos (atingimento, projeção, funil, diagnóstico, MX Score) |
| `src/lib/utils.test.ts` | `cn()`, `toCamelCase()`, `toSnakeCase()`, `getAvatarUrl()` |
| `src/lib/supabase.test.ts` | Supabase client |
| `src/lib/auth-service.test.ts` | Auth service com timeout |
| `src/lib/morning-report.test.ts` | Geração relatório matinal |
| `src/lib/validation/legacy-normalizer.test.ts` | Normalização CSV |
| `src/lib/validation/checkin-validator.test.ts` | Validação checkin |
| `src/hooks/useStoreSales.test.ts` | Hook useStoreSales |
| `src/hooks/useNotifications.test.ts` | Hook useNotifications |
| `src/hooks/useCheckins.test.ts` | Hook useCheckins |
| `src/components/molecules/MXScoreCard.test.ts` | Componente MXScoreCard |
| `src/benchmarks/find_optimization.test.ts` | Benchmark performance |

---

## 11. Segurança

### 11.1 RLS (Row Level Security)

Todas as 47 tabelas possuem RLS habilitado com policies baseadas em:
- `is_admin()` — acesso total
- `is_owner_of(store_id)` — dono da loja
- `is_manager_of(store_id)` — gerente da loja
- `seller_user_id = auth.uid()` — vendedor vê apenas seus dados
- `can_access_consulting_client(client_id)` — assignment consultoria

### 11.2 Auth

- Login com rate limiting (5 tentativas, lockout exponencial)
- Sessão Supabase (JWT + refresh token)
- Sem backdoor hardcoded (removido)
- Perfil: troca de senha + avatar upload (Supabase Storage)

### 11.3 Edge Functions

- Input validado com Zod schemas
- Logs sanitizados (sem objetos completos em console.error)
- Responses sanitizadas (sem stack traces)
- Tokens OAuth2 criptografados (AES-256-GCM)
- OAuth states com TTL 10min + consumo único

### 11.4 Frontend

- Error Boundary global (tela branca eliminada)
- XSS sanitization em checkins
- `.single()` → `.maybeSingle()` em 5 arquivos (PGRST116 fix)

---

## 12. Deploy e CI/CD

| Aspecto | Detalhe |
|---------|---------|
| **URL produção** | `https://mxperformance.vercel.app` |
| **Repo** | `https://github.com/pglemos/MXGESTAOPREDITIVA` |
| **Branch** | `main` (deploy automático) |
| **CI** | GitHub Actions: "MX Atomic Design Enforcement" |
| **Quality gates** | `npm run lint` + `npm run typecheck` + `npm test` (66/66) |
| **Último commit** | `5ae272a` |
| **Framework** | Vite + React |
| **Build** | `vite build` com manual chunks (6 vendor bundles) |

---

## Anexo A: Índices do Banco (50+)

Principais índices compostos para performance:

- `daily_checkins`: (seller_user_id, store_id, reference_date) UNIQUE, (store_id, reference_date), (seller_user_id, reference_date)
- `memberships`: (user_id, store_id, role), (store_id, role)
- `store_sellers`: (store_id, seller_user_id, started_at) UNIQUE, (store_id, is_active), (seller_user_id)
- `reprocess_logs`: (store_id, started_at DESC), (source_type), (file_hash) partial, (status, created_at DESC) partial
- `notifications`: (recipient_id, created_at DESC), (store_id, created_at DESC), (broadcast_id)
- `consulting_*`: múltiplos índices em client_id, user_id, reference_date

## Anexo B: Views

| View | Migration | Propósito |
|------|-----------|-----------|
| `view_sem_registro` | `20260407001000` | Vendedores sem registro no dia anterior |
| `view_store_daily_production` | `20260407001000` | Produção diária agregada por loja |
| `view_seller_tenure_status` | `20260407160000` | Status de tenure dos vendedores (ativo/inativo + datas) |
| `view_daily_team_status` | `20260407160000` | Status diário da equipe com checkin info |

## Anexo C: ENUMs

| Enum | Valores |
|------|---------|
| `correction_status` | pending, approved, rejected |
| `projection_mode` | calendar, business |
| `individual_goal_mode` | even, proportional, custom |

## Anexo D: RPCs

| RPC | Status | Propósito |
|-----|--------|-----------|
| `send_broadcast_notification` | Em produção | Notificação em massa |
| `process_import_data` | Em produção | Processa raw_imports → daily_checkins |
| `configure_morning_report_cron` | Em produção | Agenda cron matinal (08:30 BRT) |
| `configure_weekly_feedback_cron` | Em produção | Agenda cron semanal (seg 12:30 BRT) |
| `configure_monthly_report_cron` | Em produção | Agenda cron mensal (dia 1 10:30 BRT) |
| `get_pdi_form_template` | **Migration pendente** | Template PDI por cargo |
| `get_suggested_actions` | **Migration pendente** | Ações sugeridas por competência |
| `create_pdi_session_bundle` | **Migration pendente** | Cria sessão PDI completa |
| `get_pdi_print_bundle` | **Migration pendente** | Bundle PDI para impressão |
| `approve_pdi_action_evidence` | **Migration pendente** | Aprova evidência de ação |
| `get_ranking_snapshot` | **Migration pendente** | Snapshot ranking para rotina |
| `get_admin_executive_overview` | **Migration pendente** | Overview executivo admin |
