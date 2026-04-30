# PRD Mestre — MX Performance

**Status:** Documento canônico consolidado
**Versão:** 3.0
**Data:** 2026-04-15
**Produto:** MX Performance
**Responsável funcional:** Pedro Guilherme / MX Consultoria
**Tipo de produto:** Plataforma unificada de gestão operacional, performance comercial, desenvolvimento de equipe, automação gerencial, BI e CRM consultivo para redes de lojas automotivas

> **Este é o PRD único e canônico do sistema.** Todos os demais documentos de PRD foram consolidados neste arquivo e removidos. Backlog, stories e épics devem ser gerados exclusivamente a partir deste documento.

---

## 1. Resumo executivo

O **MX Performance** é o sistema central e unificado da MX Consultoria para operar, medir, auditar e evoluir a performance comercial de redes de lojas automotivas, ao mesmo tempo em que centraliza o relacionamento consultivo da MX com seus clientes.

Este produto deve ser tratado como **uma única plataforma**, não como dois produtos separados. Para fins de PRD, backlog, stories, arquitetura de execução, testes e atuação dos agentes, tudo pertence ao mesmo sistema e deve ser planejado de forma integrada.

O sistema hoje cobre, dentro do mesmo ecossistema:

- autenticação, autorização e zero trust
- governança de lojas e rede
- operação diária de check-in comercial
- metas, benchmarks, ranking, score e funil
- feedback estruturado e PDI
- PDI avançado estilo 360
- treinamentos e progresso do time
- notificações e broadcast
- relatórios matinal, semanal e mensal
- rotina do gerente
- reprocessamento e importação
- auditoria e diagnósticos
- BI e performance de vendas
- consultoria / CRM interno de clientes
- agenda, visitas PMR, financeiro e Google Calendar
- catálogo de produtos digitais
- shell administrativo, componentes compartilhados e automações

---

## 2. Visão do produto

### 2.1 O que o produto é

O MX Performance é uma plataforma SaaS multi-store da MX Consultoria para transformar operação comercial em gestão disciplinada, previsível e auditável.

**Identidade:**

- **Nome do produto:** MX PERFORMANCE
- **Repositório:** github.com/pglemos/MXGESTAOPREDITIVA
- **Deploy:** Vercel (frontend) + Supabase (backend)
- **Domínio público:** mxperformance.vercel.app

Ele existe para:

- obrigar o uso diário da rotina comercial
- dar visibilidade real de resultado por loja, gerente e vendedor
- conectar performance a feedback, PDI e treinamento
- automatizar relatórios executivos e operacionais
- criar memória institucional da consultoria
- registrar clientes, agendas, visitas, financeiro e histórico consultivo dentro do mesmo sistema

### 2.2 O que o produto resolve

O sistema resolve simultaneamente quatro grupos de problema:

1. **Falta de disciplina operacional diária**
   Sem check-in confiável, sem ritmo, sem meta controlada, sem leitura real do funil.

2. **Falta de governança gerencial**
   Sem ritual do gerente, sem feedback estruturado, sem PDI, sem responsabilização.

3. **Falta de automação executiva**
   Sem relatórios recorrentes, sem rastreabilidade, sem histórico consistente e sem visão consolidada.

4. **Falta de memória institucional da consultoria**
   Cliente espalhado entre agenda, planilha, documentos, financeiro e mensagens, sem continuidade entre consultores.

### 2.3 Objetivos estratégicos

- Padronizar a metodologia MX em toda a rede atendida.
- Converter dados operacionais em gestão diária.
- Reduzir dependência de planilhas e controles paralelos.
- Conectar gargalos do funil com ação prática, treinamento e cobrança.
- Permitir visão executiva para o dono e visão operacional para o gerente.
- Escalar a capacidade da MX de operar múltiplas lojas e múltiplos clientes com rastreabilidade.
- Consolidar dentro do próprio sistema a jornada consultiva da MX.

### 2.4 Princípios de produto

- O sistema é **um só**.
- Todo papel opera no mesmo ecossistema, com permissões diferentes.
- O check-in é a base do motor operacional.
- O funil é leitura gerencial, não enfeite gráfico.
- Feedback, PDI e treinamento são consequência da operação, não módulos isolados.
- Toda automação deve deixar rastro.
- Toda integração crítica deve falhar com segurança.
- Toda evolução precisa preservar o comportamento atual do sistema.

### 2.5 KPIs de sucesso do produto

| KPI | Meta | Como medir | Fonte |
|-----|------|------------|-------|
| Taxa de check-in no prazo | >= 85% dos check-ins com submission_status = 'on_time' | `daily_checkins.submission_status` | Banco |
| Cobertura de feedback semanal | >= 80% dos vendedores ativos recebem feedback por semana | `devolutivas` vs `store_sellers` ativos | Banco |
| Ciência de feedback | >= 70% dos devolutivas recebem acknowledge em até 48h | `devolutivas.acknowledged` + `acknowledged_at` | Banco |
| Cobertura de PDI | >= 90% dos vendedores com PDI ativo (status em aberto ou em_andamento) | `pdis` vs `store_sellers` | Banco |
| Precisão do relatório matinal | 0 erros em dados de ranking por loja (comparar com source) | `logs_reprocessamento.status` + feedback admin | Auditoria |
| Tempo de setup de nova loja | < 10 minutos (criação + meta + delivery rules + primeiro vendedor) | Timestamp entre criação e config completa | Banco |
| Adoção de treinamento por gargalo | >= 60% dos vendedores com gargalo completam treinamento prescrito | `training_progress` + `useTacticalPrescription` | Banco |
| Zero regressão no core | 0 testes falhando em CI após cada release | CI: npm run lint + typecheck + test + build | CI |
| Uptime do sistema | >= 99.5% durante horário comercial (8h-20h BRT) | Vercel + Supabase monitoring | Infra |
| NPS do admin MX | >= 8/10 satisfação com o sistema | Pesquisa trimestral | Manual |

---

## 3. Roles e permissões

### 3.1 Papéis do sistema

| Role | Tipo | Origem | Redirect | Escopo |
|------|------|--------|----------|--------|
| `admin` | UserRole | Tabela `users` | `/painel` | Governança total: lojas, usuários, metas, benchmarks, treinamentos, consultoria, relatórios, reprocessamento. Alias legado `consultor` normalizado para `admin`. |
| `dono` | UserRole + MembershipRole | `users` + `memberships` | `/lojas` | Suas lojas, performance, metas, funil, relatórios, devolutivas, PDIs. Visão executiva sem operar rotina diária. |
| `gerente` | MembershipRole | `memberships` | `/loja` | Painel da loja, equipe, metas, funil, ranking, feedback, PDI, treinamentos, rotina. |
| `vendedor` | MembershipRole | `memberships` | `/home` | Check-in diário, histórico, ranking, feedback, PDI, treinamentos, notificações. |

### 3.2 Regras gerais de autorização

- Autenticação via Supabase Auth (email/senha).
- Alias legados normalizados: `consultor → admin`, `owner → dono`, `manager → gerente`, `seller → vendedor`.
- Multi-tenant via `memberships`: usuário pertence a N lojas com um role por loja.
- **Zero Trust:** não-admin sem memberships ativas é deslogado automaticamente.
- Admin sem memberships recebe fallback storeId para operação global.
- Troca de loja ativa via `setActiveStoreId()` para admin/dono.
- RLS deve ser a camada final de proteção.
- O admin possui governança total do sistema.
- Dono, gerente e vendedor devem respeitar escopo de loja e dados associados.

---

## 4. Stack e infraestrutura

### 4.1 Stack atual do sistema

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript 5.8 + Vite 6 |
| Roteamento | React Router v7 (BrowserRouter) |
| Estado | Context API com `AuthProvider` |
| Design System | Atomic custom |
| Estilo | Tailwind CSS v4 + CSS variables (tokens MX) |
| Animação | Motion (ex-Framer Motion) |
| Toasts | Sonner |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Validação | Zod |
| Backend | Supabase (Postgres + Auth + Storage) |
| Edge Functions | Deno Runtime |
| Email | Resend |
| Excel | ExcelJS + `xlsx` |
| Testes | Bun test |
| Agendamento | node-cron |
| Deploy | Vercel |
| CI | GitHub Actions |
| Repositório | `pglemos/MXGESTAOPREDITIVA` |

### 4.2 Requisitos técnicos fundamentais

- O sistema deve continuar operando com Vite, React Router, Supabase e design system atual.
- O banco principal é Postgres gerenciado via Supabase.
- O shell de layout deve continuar role-based.
- As automações devem continuar integradas a email, Excel e rotinas agendadas.
- O sistema precisa manter compatibilidade com dados legados enquanto consolida o domínio canônico.

---

## 5. Módulos ativos do sistema

O sistema possui atualmente os seguintes módulos ativos, que compõem o escopo funcional do produto:

| # | Módulo | Descrição |
|---|--------|-----------|
| 1 | Autenticação e Autorização | Login, roles, memberships, zero trust |
| 2 | Gestão de Lojas | CRUD de lojas, stats, disciplina |
| 3 | Check-in Diário | Lançamento de métricas com deadline e lock |
| 4 | Ranking e Performance | Ranking mensal com meta, projeção, ritmo |
| 5 | Funil MX | Diagnóstico de gargalo com benchmarks 20/60/33 |
| 6 | Metas e Regras | Meta mensal, modo projeção, benchmarks, regras venda-loja |
| 7 | Feedback Semanal | Feedback estruturado com análise de funil |
| 8 | PDI (Plano de Desenvolvimento Individual) | PDI com 10 competências, metas 6/12/24 meses |
| 9 | PDI MX 360 | PDI avançado com wizard, radar, cargos, ações sugeridas |
| 10 | Treinamentos | Vídeos por público-alvo, progresso, prescrição por gargalo |
| 11 | Notificações | Inbox por usuário, broadcast por role/loja, real-time |
| 12 | Relatórios Automatizados | Matinal, semanal, mensal via Edge Functions |
| 13 | Rotina do Gerente | Checklist diário, agendamentos, ranking, notas |
| 14 | Reprocessamento e Importação | Importação CSV, reprocessamento, logs |
| 15 | Auditoria e Diagnósticos | Audit logs, check-in corrections, AI diagnostics |
| 16 | CRM de Consultoria | Clientes, unidades, contatos, visitas PMR, financeiro |
| 17 | Produtos Digitais | Catálogo de produtos digitais |
| 18 | Configurações | Config operacional, regras entrega, vigências |
| 19 | Perfil do Usuário | Dados pessoais, troca de senha |

Esses módulos devem ser tratados como parte do mesmo produto.

---

## 6. Rotas e páginas do sistema

### 6.1 Rotas públicas

- `/login`
- `/privacy`
- `/terms`

### 6.2 Rotas protegidas por papel

#### Vendedor (9)

| Rota | Página | Funcionalidade |
|------|--------|----------------|
| `/home` | `VendedorHome` | Dashboard com KPIs, meta, atingimento, projeção, score MX e prescrição tática |
| `/checkin` | `Checkin` | Lançamento diário com deadline 09:30 e lock 09:45 |
| `/historico` | `Historico` | Histórico de check-ins |
| `/ranking` | `Ranking` | Ranking mensal |
| `/feedback` | `VendedorFeedback` | Feedbacks recebidos e ciência |
| `/pdi` | `VendedorPDI` | PDIs recebidos |
| `/treinamentos` | `VendedorTreinamentos` | Treinamentos e progresso |
| `/notificacoes` | `Notificacoes` | Caixa de notificações |
| `/perfil` | `Perfil` | Perfil, avatar e senha |

#### Gerente (9)

| Rota | Página | Funcionalidade |
|------|--------|----------------|
| `/loja` | `DashboardLoja` | Painel da loja com métricas agregadas |
| `/loja/:storeSlug` | `DashboardLoja` | Painel de loja específica |
| `/equipe` | `Equipe` | Gestão da equipe e vigências |
| `/funil` | `Funil` | Análise do funil |
| `/metas` | `GoalManagement` | Metas e benchmarks |
| `/rotina` | `RotinaGerente` | Rotina diária |
| `/feedback` | `GerenteFeedback` | Feedbacks |
| `/pdi` | `GerentePDI` | Gestão de PDIs |
| `/treinamentos` | `GerenteTreinamentos` | Treinamentos da equipe |

#### Dono (herda Gerente +)

| Rota | Página | Funcionalidade |
|------|--------|----------------|
| `/lojas` | `Lojas` | Listagem de lojas e visão executiva |
| `/relatorio-matinal` | `MorningReport` | Matinal oficial |

#### Admin (17 exclusivas + herda todas)

| Rota | Página | Funcionalidade |
|------|--------|----------------|
| `/painel` | `PainelConsultor` | Dashboard admin |
| `/lojas` | `Lojas` | Governança de lojas |
| `/produtos` | `ProdutosDigitais` | Catálogo de produtos |
| `/configuracoes` | `Configuracoes` | Configurações gerais |
| `/configuracoes/operacional` | `OperationalSettings` | Config operacional por loja |
| `/configuracoes/reprocessamento` | `Reprocessamento` | Importação e reprocessamento |
| `/relatorio-matinal` | `MorningReport` | Relatório matinal |
| `/relatorios/performance-vendas` | `SalesPerformance` | BI de vendas |
| `/relatorios/performance-vendedores` | `SellerPerformance` | BI de vendedores |
| `/auditoria` | `AiDiagnostics` | Diagnóstico forense |
| `/treinamentos` | `ConsultorTreinamentos` | Gestão de treinamentos |
| `/notificacoes` | `ConsultorNotificacoes` | Broadcast e notificações |
| `/consultoria` | `Consultoria` | Dashboard consultoria |
| `/consultoria/clientes` | `ConsultoriaClientes` | Listagem de clientes |
| `/consultoria/clientes/:clientId` | `ConsultoriaClienteDetalhe` | Detalhe do cliente |
| `/consultoria/clientes/:clientId/visitas/:visitNumber` | `ConsultoriaVisitaExecucao` | Execução de visita PMR |
| `/metas` | `GoalManagement` | Metas |
| `/funil` | `Funil` | Funil |
| `/ranking` | `Ranking` | Ranking |
| `/checkin` | `Checkin` | Check-in (admin pode operar) |
| `/perfil` | `Perfil` | Perfil |

### 6.3 Regras de navegação

- O shell deve exibir sidebar role-based.
- Há páginas acessíveis via link interno, via URL direta e via header.
- O admin deve manter a navegação em três grupos: Governança MX, Rituais MX e Sustentação.
- Dono, gerente e vendedor devem ter navegação simplificada e orientada ao seu ritual operacional.
- A existência de rotas sem link na sidebar é parte do comportamento atual e deve ser preservada ou deliberadamente tratada em backlog.

---

## 7. Banco de dados

### 7.1 Estado atual do banco

O sistema possui **57 tabelas base + 4 views** no schema público.

### 7.2 Tabelas core (4)

- `users`
- `stores`
- `memberships`
- `daily_checkins`

### 7.3 Tabelas de performance (5)

- `regras_metas_loja`
- `historico_regras_metas_loja`
- `benchmarks_loja`
- `regras_entrega_loja`
- `store_sellers`

### 7.4 Tabelas de qualidade (4)

- `devolutivas`
- `relatorios_devolutivas_semanais`
- `pdis`
- `pdi_reviews`

### 7.5 Tabelas PDI MX 360 (10)

- `pdi_niveis_cargo`
- `pdi_descritores_escala`
- `pdi_competencias`
- `pdi_acoes_sugeridas`
- `pdi_frases_inspiracionais`
- `pdi_sessoes`
- `pdi_metas`
- `pdi_avaliacoes_competencia`
- `pdi_plano_acao`
- `pdi_objetivos_pessoais`

### 7.6 Tabelas operacionais (6)

- `trainings`
- `training_progress`
- `notificacoes`
- `notification_reads`
- `logs_rotina_gerente`
- `logs_compartilhamento_whatsapp`

### 7.7 Tabelas de auditoria (5)

- `audit_logs`
- `solicitacoes_correcao_lancamento`
- `checkin_audit_logs`
- `logs_reprocessamento`
- `importacoes_brutas`

### 7.8 Tabelas consultoria / CRM (10)

- `consulting_clients`
- `unidades_cliente_consultoria`
- `contatos_cliente_consultoria`
- `atribuicoes_consultoria`
- `etapas_metodologia_consultoria`
- `consulting_visits`
- `consulting_financials`
- `tokens_oauth_consultoria`
- `configuracoes_calendario_consultoria`
- `estados_oauth_google_consultoria`

### 7.9 Outras (1)

- `produtos_digitais`

### 7.10 Tabelas legadas (sem migration versionada)

Estas tabelas existem no banco de produção mas não possuem migration no repositório. Foram criadas antes da adoção do sistema de migrations. Devem ser tratadas como legadas — não criar novas dependências.

- `goals`
- `benchmarks`
- `roles`
- `user_roles`
- `goal_logs`
- `inventory`
- `agencies`
- `daily_lead_volumes`
- `automation_configs`
- `communication_instances`
- `report_history`
- `role_assignments_audit`
- `notification_reads`

> **Nota:** `notification_reads` aparece tanto em 7.6 (como tabela operacional usada pelo sistema) quanto aqui (como tabela legada sem migration). O sistema a utiliza ativamente via trigger.

### 7.11 Views (4)

- `view_sem_registro`
- `view_store_daily_production`
- `view_seller_tenure_status`
- `view_daily_team_status`

### 7.12 Enums (6)

- `checkin_scope`
- `projection_mode`
- `correction_status`
- `store_source_mode`
- `individual_goal_mode`
- `submission_status`

### 7.13 Requisitos de dados

- O sistema deve preservar o banco como fonte única de verdade.
- O domínio legado e o domínio canônico devem coexistir com sincronização controlada.
- As tabelas consultoria fazem parte do produto unificado e devem permanecer no mesmo PRD.
- Todas as migrations com estado pendente foram aplicadas ao banco de produção em 2026-04-15.

---

## 8. Funções, triggers e segurança

### 8.1 Funções principais

O sistema deve manter e evoluir funções de verificação de papel, acesso por loja, acesso por cliente de consultoria, sincronização, normalização de papel, processamento de importação, configuração de cron e controle de permissões.

Funções relevantes incluem:

- `is_admin()`
- `has_store_role()`
- `is_owner_of()`
- `is_manager_of()`
- `is_member_of()`
- `is_consultor()`
- `check_user_role_in_store()`
- `can_access_consulting_client()`
- `normalize_mx_role()`
- `handle_new_user()`
- `sync_daily_checkins_canonical()`
- `log_regras_metas_loja_changes()`
- `process_import_data()`
- `configure_*_cron()`
- `enforce_feedback_seller_ack_only()`
- `send_broadcast_notification()`
- `sync_notification_reads()`
- `sync_pdi_legacy_shadow_columns()`
- `check_orphan_users_after_membership_deletion()`
- `get_pdi_form_template()`
- `get_suggested_actions()`
- `create_pdi_session_bundle()`
- `get_pdi_print_bundle()`
- `approve_pdi_action_evidence()`
- `get_admin_executive_overview()`

### 8.2 Triggers principais

| Trigger | Tabela | Função |
|---------|--------|--------|
| `sync_daily_checkins_canonical` | daily_checkins | Sincroniza colunas legadas/canônicas, calcula submission_status |
| `update_updated_at_column` | 18 tabelas | Auto-set updated_at |
| `on_auth_user_created` | auth.users | Cria perfil automático |
| `notificacoes_sync_notification_reads` | notificacoes | Rastreia leitura |
| `devolutivas_seller_ack_only` | devolutivas | Vendedor só pode dar ciência |
| `check_orphan_users` (x2) | store_sellers, memberships | Desativa órfãos |
| `pdis_sync_legacy_shadow_columns` | pdis | Compatibilidade legada |
| `log_regras_metas_loja_changes` | regras_metas_loja | Auditoria de configuração |

### 8.3 Requisitos de segurança

- Todas as tabelas com dados sensíveis devem operar com RLS ativa (92 policies em produção).
- O sistema deve utilizar funções auxiliares seguras para checagem de escopo.
- Input de Edge Functions deve ser validado com Zod.
- Tokens OAuth2 devem permanecer criptografados.
- O frontend deve evitar XSS, erros de `.single()` indevidos e tela branca por falha global.

---

## 9. Edge Functions e automações

### 9.1 Edge Functions ativas

| Função | Trigger | Propósito |
|--------|---------|-----------|
| `relatorio-matinal` | pg_cron 08:30 BRT + manual | Relatório matinal |
| `relatorio-mensal` | pg_cron dia 1 10:30 BRT + manual | Fechamento mensal |
| `feedback-semanal` | pg_cron segunda 12:30 BRT + manual | Feedback semanal |
| `send-individual-feedback` | manual | Envio de feedback individual |
| `google-oauth-handler` | callback OAuth | Conexão Google Calendar |
| `google-calendar-events` | consulta de eventos | Busca de eventos com refresh token |

### 9.2 Módulos `_shared`

As Edge Functions dependem de módulos compartilhados: CORS, response, formatting, cliente Supabase, email, crypto, Google e schemas (Zod).

### 9.3 Requisitos de automação

- Relatórios devem poder rodar por cron e manualmente.
- Toda execução deve ser rastreável.
- A integração Google deve prever refresh de token.
- A geração de XLSX e email deve continuar parte do fluxo oficial.
- O sistema deve suportar compartilhamento operacional via WhatsApp quando homologado.

---

## 10. Hooks do sistema

Os hooks são a camada principal de abstração de negócio no frontend e devem continuar refletindo o comportamento funcional do sistema.

### 10.1 Hooks ativos

| Hook | Propósito |
|------|-----------|
| `useAuth` | Auth, roles, memberships, store switching, zero trust |
| `useCheckins` | CRUD check-in, deadlines, sanitização |
| `useMyCheckins` | Check-ins do próprio vendedor |
| `useCheckinsByDateRange` | Check-ins por período |
| `useCheckinAuditor` | Correção retroativa com aprovação |
| `useRanking` | Ranking por loja com cache 5min |
| `useGlobalRanking` | Ranking cross-loja |
| `useStorePerformance` | Performance por loja com semáforo |
| `useSellerMetrics` | Métricas individuais |
| `useTacticalPrescription` | Gargalo → treinamento |
| `useStoreSales` | Agregação vendas + regras venda-loja |
| `useTeam` | Equipe com vigências |
| `useStores` | CRUD lojas |
| `useStoresStats` | Stats por loja |
| `useSellersByStore` | Vendedores de uma loja |
| `useMemberships` | Memberships |
| `useNetworkHierarchy` | Hierarquia rede |
| `useGoals` | Meta mensal |
| `useAllStoreGoals` | Todas metas + benchmarks |
| `useStoreMetaRules` | Regras completas |
| `useStoreGoal` | Meta simplificada |
| `useStoreDeliveryRules` | Regras entrega |
| `useTrainings` | Treinamentos + progresso |
| `useTeamTrainings` | Progresso treinos com gap |
| `useFeedbacks` | Feedbacks com CRUD |
| `useWeeklyFeedbackReports` | Relatórios semanais |
| `usePDIs` | PDIs com reviews |
| `useMyPDIs` | PDIs próprios |
| `usePDI_MX` | PDI 360: cargos, templates, ações |
| `useNotifications` | Notificações + broadcast |
| `useSystemBroadcasts` | Broadcasts admin |
| `useManagerRoutine` | Rotina diária |
| `useOperationalSettings` | Config operacional completa |
| `useConsultingClients` | Clientes consultoria |
| `useConsultingClientDetail` | Detalhe cliente completo |
| `useConsultingMethodology` | Steps PMR |
| `useConsultingClientMetrics` | Métricas consultoria |
| `useConsultingAgenda` | Agenda Google Calendar |

### 10.2 Requisitos para hooks

- Toda lógica de negócio relevante deve estar encapsulada em hooks ou serviços.
- Hooks devem continuar acessando tabelas e RPCs de forma coerente com o papel do usuário.
- O sistema deve preservar a separação entre hook de UI, cálculo puro e integração externa.

---

## 11. Componentes do sistema

### 11.1 Camadas de componentes

#### Atoms (6)
- `Typography`
- `Button`
- `Input`
- `Textarea`
- `Badge`
- `Skeleton`

#### Molecules (3)
- `Card` (com Header/Title/Description/Content/Footer)
- `FormField`
- `MXScoreCard`

#### Organisms (1)
- `DataGrid` (desktop table + mobile cards, animado, React.memo)

#### Admin (1)
- `AdminNetworkView`

#### Layout (3)
- `Layout`
- `LegacyModuleShell`
- `AuthProvider`

#### Features especializadas (4)
- `GoogleCalendarView`
- `WizardPDI` (4 etapas com radar chart)
- `PrintableFeedback`
- `WeeklyStoreReport`

### 11.2 Requisitos de UI

- O design system deve continuar baseado em atomic design.
- Componentes precisam ser reutilizáveis, responsivos e coerentes com tokens MX.
- O shell deve continuar role-based.
- A experiência mobile deve permanecer funcional para vendedor, gerente e dono.

---

## 12. Libs, services e automação

### 12.1 Motor de cálculos

`calculations.ts` é um módulo crítico e deve continuar responsável por:

- calcularTotais, calcularAtingimento, calcularFaltaX, calcularProjecao, calcularRitmo
- isBusinessDay, getBusinessDaysInMonth, getDiasInfo
- calcularFunil, gerarDiagnosticoMX, validarFunil
- calcularScoreMX, getOperationalStatus
- somarVendas, somarVendasPorCanal
- MX_BENCHMARKS (20/60/33)
- formatWhatsAppMorningReport, formatStructuredWhatsAppFeedback

### 12.2 Services e API layer

O sistema utiliza módulos como:

- `supabase.ts` — Client singleton
- `services/checkin-service.ts` — Storage idempotente
- `export.ts` — Exportação Excel
- `migration-validator.ts` — Validação dados legados
- `api/stores.ts` — Governança lojas
- `api/manager.ts` — Dados rotina gerente
- `validation/legacy-normalizer.ts` — Mapeamento headers legados
- `validation/checkin-validator.ts` — Validação payload checkin
- `automation/*` — 14 arquivos: scheduler, engines, templates, XLSX, WhatsApp

---

## 13. Requisitos funcionais por módulo

### Módulo 1 — Autenticação e Autorização

FR-AUTH-01: O sistema deve autenticar via Supabase Auth com email e senha.
FR-AUTH-02: O sistema deve normalizar roles legados (consultor→admin, owner→dono, manager→gerente, seller→vendedor).
FR-AUTH-03: O sistema deve redirecionar para a tela correta após login (admin→/painel, dono→/lojas, gerente→/loja, vendedor→/home).
FR-AUTH-04: O sistema deve deslogar automaticamente não-admins sem memberships ativas (Zero Trust).
FR-AUTH-05: O sistema deve permitir troca de loja ativa para admin e dono.
FR-AUTH-06: O sistema deve criar perfil automaticamente ao registrar via Supabase Auth (trigger on_auth_user_created).
FR-AUTH-07: O sistema deve desativar usuários órfãos (sem memberships ou store_sellers ativos) via trigger automático.
FR-AUTH-08: O sistema deve manter sessão com refresh token automático via Supabase.
FR-AUTH-09: O sistema deve persistir estado de auth em React Context com provider global.

### Módulo 2 — Gestão de Lojas

FR-STORE-01: Admin deve criar, editar, excluir e ativar/desativar lojas.
FR-STORE-02: Dono deve ver apenas suas lojas (filtrado por memberships).
FR-STORE-03: Gerente deve ver apenas a loja atribuída.
FR-STORE-04: A listagem de lojas deve mostrar: nome, status, total vendedores, vendedores com check-in, % disciplina.
FR-STORE-05: Cada loja deve ter source_mode (legacy_forms, native_app, hybrid).
FR-STORE-06: Admin deve poder gerenciar a hierarquia da rede (promover/demover/remover membros por loja).

### Módulo 3 — Check-in Diário

FR-CHK-01: Vendedor deve registrar check-in diário com métricas: leads dia anterior, agendamentos carteira/internet dia anterior e hoje, vendas porta/carteira/internet dia anterior, visitas dia anterior.
FR-CHK-02: O sistema deve calcular data de referência como dia anterior (produção declarada = D-1).
FR-CHK-03: O sistema deve marcar check-in como atrasado se submetido após 09:30 BRT.
FR-CHK-04: O sistema deve bloquear edição do check-in após 09:45 BRT.
FR-CHK-05: O sistema deve permitir motivo de zero vendas (zero_reason) e notas.
FR-CHK-06: O sistema deve validar unicidade por vendedor + loja + data de referência (upsert).
FR-CHK-07: O sistema deve sanitizar inputs contra XSS.
FR-CHK-08: O sistema deve registrar submission_status (on_time/late) automaticamente via trigger.
FR-CHK-09: O sistema deve sincronizar colunas canônicas e legadas via trigger sync_daily_checkins_canonical.
FR-CHK-10: O sistema deve suportar scope (daily, adjustment, historical).
FR-CHK-11: O sistema deve suportar venda-loja (is_venda_loja) com regras configuráveis por loja.
FR-CHK-12: O sistema deve gerenciar corretivas retroativas com workflow de aprovação (vendedor solicita → gerente aprova/rejeita).
FR-CHK-13: O sistema deve manter trilha de auditoria imutável para todas as correções de check-in.

### Módulo 4 — Ranking e Performance

FR-RNK-01: O sistema deve gerar ranking mensal por vendedor com: vendas totais, leads, agendamentos, visitas, meta individual, atingimento %, projeção, ritmo, gap, eficiência, posição.
FR-RNK-02: O sistema deve calcular meta individual a partir da meta da loja dividida pelo número de vendedores (modo even) ou configurável.
FR-RNK-03: O sistema deve calcular projeção mensal com base em vendas acumuladas e dias decorridos/total.
FR-RNK-04: O sistema deve calcular ritmo diário necessário para atingir a meta.
FR-RNK-05: O sistema deve calcular score MX (0-1800+) baseado em vendas, meta, funil e disciplina.
FR-RNK-06: O sistema deve classificar vendedor com status operacional (verde/amarelo/vermelho).
FR-RNK-07: O sistema deve gerar ranking global cross-loja (rede inteira) para admin.
FR-RNK-08: O sistema deve calcular performance por loja com semáforo (verde/amarelo/vermelho).
FR-RNK-09: O sistema deve cachear ranking por 5 minutos no localStorage.

### Módulo 5 — Funil MX

FR-FUN-01: O sistema deve exibir funil com 4 etapas: Leads → Agendamentos → Visitas → Vendas.
FR-FUN-02: O sistema deve calcular taxas de conversão: Lead→Agd, Agd→Visita, Visita→Venda.
FR-FUN-03: O sistema deve comparar conversões com benchmarks configuráveis (padrão 20/60/33).
FR-FUN-04: O sistema deve identificar o gargalo do funil (LEAD_AGD, AGD_VISITA, VISITA_VND).
FR-FUN-05: O sistema deve gerar diagnóstico textual e sugestão de ação para o gargalo.
FR-FUN-06: O sistema deve validar consistência lógica do funil.
FR-FUN-07: O sistema deve mostrar agregação por canal (Porta, Carteira, Internet).

### Módulo 6 — Metas e Regras

FR-META-01: O sistema deve permitir definir meta mensal por loja em regras_metas_loja.
FR-META-02: O sistema deve suportar modos de projeção: calendário (todos os dias) ou dias úteis.
FR-META-03: O sistema deve suportar modos de meta individual: even (dividido igual), custom, proportional.
FR-META-04: O sistema deve configurar se venda-loja entra no total da loja e/ou na meta individual.
FR-META-05: O sistema deve configurar benchmarks por loja (lead_agd, agd_visita, visita_vnd).
FR-META-06: O sistema deve configurar regras de entrega de email por loja (destinatários matinal, semanal, mensal).
FR-META-07: O sistema deve registrar auditoria de alterações em regras_metas_loja.
FR-META-08: O sistema deve permitir admin editar todas as configurações operacionais de uma loja em tela unificada.
FR-META-09: O sistema deve permitir gerenciar vigências de vendedores por loja (data início, data fim, closing_month_grace).

### Módulo 7 — Feedback Semanal

FR-FB-01: Gerente/admin deve criar feedback semanal por vendedor com: leads, agd, visitas, vendas, taxas de conversão, meta compromisso, pontos positivos, pontos de atenção, ação.
FR-FB-02: O sistema deve calcular automaticamente taxas de conversão e média da equipe.
FR-FB-03: O sistema deve incluir diagnóstico JSON com snapshot vendedor vs equipe.
FR-FB-04: O sistema deve garantir unicidade por vendedor + semana (upsert).
FR-FB-05: Vendedor deve visualizar feedback recebido e dar ciência (acknowledge).
FR-FB-06: O sistema deve impedir que vendedor edite campos do feedback (trigger devolutivas_seller_ack_only), apenas acknowledge.
FR-FB-07: Gerente deve poder enviar feedback individual por email (Edge Function send-individual-feedback).
FR-FB-08: O sistema deve gerar relatórios semanais consolidados por loja com ranking, benchmarks e status de envio.
FR-FB-09: O sistema deve exibir feedback com comparação Real vs Ideal usando benchmarks MX.

### Módulo 8 — PDI (Plano de Desenvolvimento Individual)

FR-PDI-01: Gerente/admin deve criar PDI para vendedor com 10 competências (escala 1-10): prospecção, abordagem, demonstração, fechamento, CRM, digital, disciplina, organização, negociação, produto.
FR-PDI-02: PDI deve ter metas de 6, 12 e 24 meses e até 5 ações de desenvolvimento.
FR-PDI-03: PDI deve ter data limite e status (aberto, em_andamento, concluido).
FR-PDI-04: Vendedor deve visualizar PDI e dar ciência (acknowledge).
FR-PDI-05: Gerente/admin deve criar revisões de PDI com notas de evolução, dificuldades e ajustes.
FR-PDI-06: O sistema deve manter colunas legadas (objective, action) sincronizadas via trigger.
FR-PDI-07: O sistema deve suportar impressão de PDI formatado.
FR-PDI-08: O sistema deve restringir criação/edição de PDI a admin e gerente; vendedor pode apenas visualizar e dar ciência.

### Módulo 9 — PDI MX 360

FR-PDI360-01: O sistema deve fornecer wizard de PDI em 4 etapas: Especialista (seleção + cargo), Metas (9 metas pessoais/profissionais), Mapeamento (competências com sliders + radar), Plano de Ação (top 5 gaps com ações sugeridas).
FR-PDI360-02: O sistema deve ter tabela de níveis de cargo (Higienizador → CEO, notas 1-25) com descritores de escala.
FR-PDI360-03: O sistema deve ter 18 competências (10 técnicas + 8 comportamentais) com indicadores.
FR-PDI360-04: O sistema deve sugerir ações por competência via tabela pdi_acoes_sugeridas.
FR-PDI360-05: O sistema deve exibir frases inspiracionais durante a sessão.
FR-PDI360-06: O sistema deve criar sessão PDI completa atomicamente via RPC create_pdi_session_bundle (sessão + metas + avaliações + plano de ação).
FR-PDI360-07: O sistema deve permitir impressão do bundle completo via RPC get_pdi_print_bundle.
FR-PDI360-08: Cada ação do plano deve ter: data conclusão, impacto (baixo/medio/alto), custo (baixo/medio/alto), status, evidência e aprovação.
FR-PDI360-09: O sistema deve permitir aprovação de evidência de ação via RPC approve_pdi_action_evidence.
FR-PDI360-10: O sistema deve exibir radar chart (Recharts) com notas atribuídas vs alvo.

### Módulo 10 — Treinamentos

FR-TRN-01: Admin deve criar treinamentos com: título, descrição, tipo (prospeccao, fechamento, atendimento, gestao, pre-vendas), URL do vídeo, público-alvo (vendedor, gerente, todos).
FR-TRN-02: O sistema deve filtrar treinamentos por público-alvo do usuário logado.
FR-TRN-03: Vendedor/gerente deve marcar treinamento como assistido.
FR-TRN-04: O sistema deve prescrever treinamento automaticamente com base no gargalo de funil (LEAD_AGD→prospeccao, AGD_VISITA→atendimento, VISITA_VND→fechamento).
FR-TRN-05: O sistema deve exibir progresso de treinamento por vendedor com % assistido e gap de funil.
FR-TRN-06: Gerente/admin deve poder enviar notificação de lembrete de treinamento a vendedores.
FR-TRN-07: Admin deve poder ativar/desativar treinamentos.

### Módulo 11 — Notificações

FR-NOT-01: O sistema deve ter inbox de notificações por usuário com contagem de não lidas.
FR-NOT-02: Usuário deve poder marcar como lida individualmente ou todas.
FR-NOT-03: Usuário deve poder excluir notificações.
FR-NOT-04: Admin deve poder enviar broadcast de notificação por loja e/ou role via RPC send_broadcast_notification.
FR-NOT-05: O sistema deve suportar tipos: system, discipline, performance, alert.
FR-NOT-06: O sistema deve suportar prioridades: low, medium, high.
FR-NOT-07: O sistema deve rastrear leitura via tabela notification_reads (trigger automático).
FR-NOT-08: O sistema deve suportar subscription real-time (Supabase postgres_changes) para atualização instantânea.
FR-NOT-09: Notificações de disciplina (check-in ausente) devem ser enviadas automaticamente pelo relatório matinal.
FR-NOT-10: Notificações de performance (gargalo de funil) devem ser enviadas automaticamente pelo relatório semanal.

### Módulo 12 — Relatórios Automatizados

FR-RPT-01: O sistema deve gerar relatório matinal automático diário às 08:30 BRT via pg_cron + Edge Function.
FR-RPT-02: O relatório matinal deve conter: ranking do mês, vendas por canal, projeção, gap, lista sem registro.
FR-RPT-03: O relatório matinal deve enviar email HTML com anexo XLSX via Resend para destinatários configurados por loja.
FR-RPT-04: O relatório matinal deve incluir link WhatsApp para compartilhamento manual.
FR-RPT-05: O relatório matinal deve gerar notificações de disciplina para vendedores sem check-in e gerentes.
FR-RPT-06: O sistema deve gerar relatório semanal automático toda segunda às 12:30 BRT.
FR-RPT-07: O relatório semanal deve conter: análise de funil por vendedor, comparação com benchmarks, diagnóstico de gargalo.
FR-RPT-08: O relatório semanal deve enviar email com anexo XLSX e notificações de gargalo por vendedor.
FR-RPT-09: O sistema deve gerar relatório mensal automático no 1° dia às 10:30 BRT.
FR-RPT-10: O relatório mensal deve conter: vendas totais por canal, ranking completo, atingimento da meta.
FR-RPT-11: O relatório mensal deve enviar email com anexo XLSX.
FR-RPT-12: Admin deve poder disparar qualquer relatório manualmente pelo Painel Consultor.
FR-RPT-13: Gerente deve poder disparar relatório matinal manualmente pela Rotina do Gerente.
FR-RPT-14: O sistema deve registrar execução em logs_reprocessamento com idempotência.
FR-RPT-15: O sistema deve permitir download manual de XLSX pela tela Morning Report.
FR-RPT-16: O sistema deve permitir compartilhamento WhatsApp manual pela tela Morning Report.

### Módulo 13 — Rotina do Gerente

FR-ROT-01: Gerente deve registrar rotina diária com: check-ins pendentes, sem registro, agendamentos carteira/internet hoje, leads/vendas dia anterior, snapshot do ranking, notas.
FR-ROT-02: O sistema deve garantir unicidade por loja + gerente + data.
FR-ROT-03: O sistema deve exibir histórico de 7 dias da rotina.
FR-ROT-04: Gerente deve poder enviar notificações a partir da rotina.
FR-ROT-05: Gerente deve poder disparar relatório matinal a partir da rotina.

### Módulo 14 — Reprocessamento e Importação

FR-REP-01: Admin deve poder importar dados via CSV com headers: DATA, LOJA, VENDEDOR, LEADS, AGD_CART, AGD_NET, VND_PORTA, VND_CART, VND_NET, VISITA.
FR-REP-02: O sistema deve normalizar headers legados para campos canônicos.
FR-REP-03: O sistema deve validar dados importados com relatório de erros e warnings.
FR-REP-04: O sistema deve processar importação em batch via RPC process_import_data com deduplicação.
FR-REP-05: O sistema deve manter log de reprocessamento com status, rows processados, falhas, file hash.
FR-REP-06: O sistema deve armazenar dados brutos em importacoes_brutas para auditoria.

### Módulo 15 — Auditoria e Diagnósticos

FR-AUD-01: O sistema deve manter audit_logs para todas as operações sensíveis.
FR-AUD-02: O sistema deve manter checkin_audit_logs imutável para correções de check-in.
FR-AUD-03: O sistema deve manter historico_regras_metas_loja para alterações de configuração.
FR-AUD-04: O sistema deve exibir audit logs em tempo real via subscription.
FR-AUD-05: O sistema deve exibir view_sem_registro (vendedores sem check-in hoje).
FR-AUD-06: O sistema deve exibir view_store_daily_production (produção agregada por loja/dia).
FR-AUD-07: O sistema deve exibir view_seller_tenure_status (vigências ativas).
FR-AUD-08: O sistema deve exibir view_daily_team_status (status diário da equipe).

### Módulo 16 — CRM de Consultoria

FR-CRM-01: Admin deve cadastrar clientes da consultoria com: nome, razão social, CNPJ, produto contratado, status (ativo/inativo/suspenso/prospect), notas, loja primária.
FR-CRM-02: Admin deve cadastrar unidades por cliente com: nome, cidade, UF, unidade primária.
FR-CRM-03: Admin deve cadastrar contatos por cliente com: nome, email, telefone, cargo, contato primário.
FR-CRM-04: Admin deve atribuir consultores a clientes com role (responsavel, auxiliar, viewer) e toggle ativo.
FR-CRM-05: O sistema deve exibir dashboard de consultoria com: total clientes, ativos, suspensos, visitas pendentes.
FR-CRM-06: O sistema deve exibir detalhe do cliente com abas: dados, unidades, contatos, consultores, visitas, financeiro, agenda Google.
FR-CRM-07: O sistema deve suportar visitas PMR com: número da visita, data, duração, modalidade, status, consultor/auxiliar, objetivo, checklist_data (JSONB), feedback, resumo executivo.
FR-CRM-08: O sistema deve permitir execução de visita com checklist e campos obrigatórios.
FR-CRM-09: O sistema deve registrar dados financeiros por cliente e período: receita, despesas fixas, marketing, investimentos, financiamento, lucro líquido, ROI, taxa conversão.
FR-CRM-10: O sistema deve fornecer steps de metodologia PMR (7 visitas) com objetivo, alvo, duração, evidência requerida.
FR-CRM-11: O sistema deve suportar OAuth2 com Google Calendar para sincronização de agenda.
FR-CRM-12: O sistema deve armazenar tokens OAuth em tokens_oauth_consultoria (access_token, refresh_token, expires_at, scopes).
FR-CRM-13: O sistema deve armazenar configurações de sincronização por cliente/consultor em configuracoes_calendario_consultoria.
FR-CRM-14: O sistema deve restringir acesso a clientes de consultoria via RLS com função can_access_consulting_client().

### Módulo 17 — Produtos Digitais

FR-PRD-01: Admin deve cadastrar produtos digitais com: nome, descrição, link.
FR-PRD-02: O sistema deve listar produtos digitais para todos os usuários autenticados.
FR-PRD-03: Apenas admin pode criar, editar e excluir produtos.

### Módulo 18 — Configurações

FR-CFG-01: Admin deve configurar todas as definições operacionais de uma loja em tela unificada: meta, benchmarks, regras de entrega, modo de projeção, regras venda-loja.
FR-CFG-02: Admin deve gerenciar vigências de vendedores (data início, data fim, grace period).
FR-CFG-03: O sistema deve salvar todas as configurações em paralelo (meta + benchmarks + delivery + vigências).
FR-CFG-04: Gerente/dono pode visualizar configurações mas não editar.

### Módulo 19 — Perfil do Usuário

FR-PRF-01: Usuário deve visualizar seus dados: nome, email, telefone, avatar, role.
FR-PRF-02: Usuário deve poder alterar nome, telefone e avatar.
FR-PRF-03: Usuário deve poder trocar sua senha.

---

## 14. Requisitos não funcionais

NFR-01: TypeScript estrito em todo o código.
NFR-02: Design system consistente com tokens MX (cores, espaçamento, tipografia).
NFR-03: RLS ativa em todas as tabelas com políticas por role.
NFR-04: Todas as páginas lazy-loaded com Suspense.
NFR-05: Responsivo para desktop e mobile (viewport a partir de 375px).
NFR-06: Navegação role-based com sidebar categorizada e bottom bar mobile.
NFR-07: Todas as operações de escrita gated por role no hook/frontend E no RLS.
NFR-08: Audit trail para operações sensíveis (correções de check-in, alterações de meta, imports).
NFR-09: Idempotência em relatórios automatizados (logs_reprocessamento).
NFR-10: Real-time via Supabase postgres_changes para notificações e audit logs.
NFR-11: Sanitização de inputs de texto contra XSS.
NFR-12: Cache de ranking por 5 minutos (localStorage).
NFR-13: Timeout de 4 segundos para fetch de dados de usuário.
NFR-14: Componentes atômicos reutilizáveis (Typography, Button, Card, Badge, Input, DataGrid).
NFR-15: Zero quebra de rotas legadas ao adicionar novas funcionalidades.
NFR-16: Rollback seguro: remoção de rotas /consultoria desativa o módulo sem afetar o core.
NFR-17: Componentes do sistema devem atender nível AA do WCAG 2.1 para contraste de texto mínimo 4.5:1, navegação por teclado em todas as interações, labels em todos os campos de formulário, e aria-labels em ícones e botões de ação.
NFR-18: Tempo de resposta de listagens deve ser inferior a 2 segundos para 80 lojas com até 200 check-ins cada, medido em conexão 4G.
NFR-19: Tempo de resposta de abertura de tela (First Contentful Paint) deve ser inferior a 1.5 segundos.
NFR-20: O sistema deve suportar upload de anexos até 25 MB com feedback visual de progresso.
NFR-21: O sistema deve funcionar em navegadores mobile (Chrome/Safari) com viewport a partir de 375px sem perda funcional.
NFR-22: Importações devem processar até 5.000 linhas em menos de 30 segundos com feedback de progresso.
NFR-23: O sistema deve estar disponível 99.5% do tempo durante horário comercial (8h-20h BRT), excluindo janelas de deploy programado (máx 2x/semana, 15 min cada).
NFR-24: O sistema deve registrar audit log para operações de criação, edição e exclusão em metas, configurações e correções de check-in, com usuário, timestamp e dados anteriores quando aplicável.
NFR-25: Edge Functions devem ter timeout de 60 segundos e retry automático com backoff exponencial (1s, 2s, 4s) para falhas transitórias.
NFR-26: O sistema deve suportar pelo menos 50 usuários simultâneos sem degradação de performance.

---

## 15. Testes e qualidade

### 15.1 Estado atual

O sistema possui testes ativos cobrindo:

- motor de cálculos
- utils
- supabase client
- relatório matinal
- normalização CSV
- validação de checkin
- hooks de store sales, notificacoes e checkins
- componente `MXScoreCard`
- benchmark de performance

### 15.2 Requisitos de qualidade

- Todo módulo crítico deve ter cobertura de teste adequada.
- O motor de cálculos é bloqueante para regressão.
- O sistema deve continuar suportando quality gates de lint, typecheck e testes.
- Framework de testes: Bun test.

---

## 16. KPIs do produto

- taxa de checkin no prazo (>= 85%)
- disciplina por loja
- cobertura de feedback semanal (>= 80%)
- ciência de feedback (>= 70% em 48h)
- cobertura de PDI (>= 90%)
- aderência a treinamentos prescritos (>= 60%)
- precisão do relatório matinal (0 erros)
- performance de vendas por loja e vendedor
- clientes ativos na consultoria
- visitas executadas por cliente
- atualização financeira por cliente
- uso dos módulos administrativos

---

## 17. API Specs — Edge Functions

### 17.1 relatorio-matinal

```
POST /functions/v1/relatorio-matinal
Headers: Authorization: Bearer {service-role-key}
Content-Type: application/json

Request Body:
{
  "store_id": "uuid (opcional, sem = todas)",
  "reference_date": "YYYY-MM-DD (opcional, default = yesterday)",
  "dry_run": false
}

Response 200:
{
  "processed": 3,
  "errors": [],
  "logs": [
    { "store_id": "uuid", "store_name": "Loja X", "status": "sent", "recipients": 2, "notificacoes_sent": 5 }
  ]
}
```

### 17.2 feedback-semanal

```
POST /functions/v1/feedback-semanal
Headers: Authorization: Bearer {service-role-key}

Request Body:
{
  "store_id": "uuid (opcional)",
  "week_start": "YYYY-MM-DD (opcional)",
  "week_end": "YYYY-MM-DD (opcional)"
}

Response 200:
{
  "processed": 2,
  "errors": [],
  "reports": [
    { "store_id": "uuid", "store_name": "Loja Y", "status": "sent", "recipients": 3 }
  ]
}
```

### 17.3 relatorio-mensal

```
POST /functions/v1/relatorio-mensal
Headers: Authorization: Bearer {service-role-key}

Request Body:
{
  "store_id": "uuid (opcional)",
  "month": "YYYY-MM (opcional, default = previous month)"
}

Response 200:
{
  "processed": 3,
  "errors": [],
  "reports": [
    { "store_id": "uuid", "store_name": "Loja Z", "status": "sent" }
  ]
}
```

### 17.4 send-individual-feedback

```
POST /functions/v1/send-individual-feedback
Headers: Authorization: Bearer {anon-key}
Content-Type: application/json

Request Body:
{
  "feedback_id": "uuid"
}

Response 200:
{ "sent": true, "to": ["gerente@email.com", "dono@email.com"] }
Response 404:
{ "error": "Feedback not found" }
```

### 17.5 google-oauth-handler

```
GET /functions/v1/google-oauth-handler?code={auth_code}&state={user_id}
(OAuth redirect callback)

Response 200: HTML confirmation page
Response 400: { "error": "Missing code or state" }
```

---

## 18. Diagramas do Sistema

### 18.1 Diagrama ER (Entidade-Relacionamento)

```
auth.users
  └── public.users (1:1 via id)
       ├── memberships (N:N user↔store com role)
       ├── store_sellers (1:N, vigências)
       ├── daily_checkins (1:N, métricas diárias)
       ├── devolutivas (1:N como manager ou seller)
       ├── pdis (1:N como manager ou seller)
       │   └── pdi_reviews (1:N)
       ├── training_progress (1:N)
       ├── notificacoes (1:N como recipient ou sender)
       ├── logs_rotina_gerente (1:N)
       ├── atribuicoes_consultoria (1:N → consulting_clients)
       ├── tokens_oauth_consultoria (1:1)
       └── configuracoes_calendario_consultoria (1:N)

stores
  ├── memberships (1:N)
  ├── store_sellers (1:N)
  ├── daily_checkins (1:N)
  ├── benchmarks_loja (1:1, PK=store_id)
  ├── regras_entrega_loja (1:1, PK=store_id)
  ├── regras_metas_loja (1:1, PK=store_id)
  │   └── historico_regras_metas_loja (1:N)
  ├── devolutivas (1:N)
  ├── relatorios_devolutivas_semanais (1:N)
  ├── pdis (1:N)
  ├── logs_rotina_gerente (1:N)
  ├── consulting_clients (1:N via primary_store_id)
  └── notificacoes (1:N)

consulting_clients
  ├── unidades_cliente_consultoria (1:N)
  ├── contatos_cliente_consultoria (1:N)
  ├── atribuicoes_consultoria (1:N)
  ├── configuracoes_calendario_consultoria (1:N)
  ├── consulting_visits (1:N)
  └── consulting_financials (1:N, unique por client+date)

pdi_niveis_cargo
  └── pdi_descritores_escala (1:N)

pdi_competencias
  └── pdi_acoes_sugeridas (1:N)

pdi_sessoes
  ├── pdi_metas (1:N)
  ├── pdi_avaliacoes_competencia (1:N → pdi_competencias)
  ├── pdi_plano_acao (1:N → pdi_competencias)
  └── pdi_objetivos_pessoais (1:N)

daily_checkins
  ├── solicitacoes_correcao_lancamento (1:N)
  └── checkin_audit_logs (1:N)

logs_reprocessamento
  └── importacoes_brutas (1:N)
```

### 18.2 Fluxo do Check-in Diário

```
VENDEDOR                    SISTEMA                          BANCO
   │                          │                               │
   ├─ Acessa /checkin ───────►│                               │
   │                          ├─ Busca ref date (D-1) ───────►│
   │                          │◄─ Retorna data ref ───────────┤
   │                          ├─ Verifica deadline 09:30      │
   │  Preenche métricas       │                               │
   ├─ Submit ────────────────►│                               │
   │                          ├─ Sanitiza XSS                 │
   │                          ├─ Determina on_time/late       │
   │                          ├─ UPSERT checkin ─────────────►│
   │                          │                               ├─ Trigger sync_canonical
   │                          │                               ├─ Trigger updated_at
   │                          │◄─ Confirma ───────────────────┤
   │  Toast sucesso ◄─────────┤                               │
```

### 18.3 Fluxo de Feedback Semanal

```
GERENTE                     SISTEMA                          BANCO
   │                          │                               │
   ├─ Acessa /feedback ──────►│                               │
   │                          ├─ Busca vendedores ───────────►│
   │                          │◄─ Lista equipe ───────────────┤
   ├─ Seleciona vendedor ────►│                               │
   ├─ Preenche métricas ─────►│                               │
   │                          ├─ Calcula taxas conversão      │
   │                          ├─ Gera diagnóstico (vendedor vs equipe)
   │                          ├─ UPSERT feedback ────────────►│
   │                          │                               ├─ Trigger seller_ack_only
   │  Toast sucesso ◄─────────┤                               │
   │                          │                               │
   ├─ [Email] ───────────────►│                               │
   │                          ├─ POST send-individual-feedback│
   │                          │   → Resend API                │
   │  Toast enviado ◄─────────┤                               │
```

### 18.4 Fluxo de Relatório Matinal Automatizado

```
PG_CRON (08:30 BRT)
   │
   ├─ POST relatorio-matinal ──► Edge Function
   │                               │
   │                               ├─ Busca lojas ativas
   │                               ├─ Para cada loja:
   │                               │   ├─ Busca vendedores + checkins MTD
   │                               │   ├─ Calcula ranking
   │                               │   ├─ Gera XLSX
   │                               │   ├─ Gera HTML email
   │                               │   ├─ Envia via Resend
   │                               │   ├─ Identifica sem registro
   │                               │   └─ Cria notificações disciplina
   │                               ├─ Registra em logs_reprocessamento
   │                               └─ Response
```

### 18.5 Fluxo de Visita PMR (Consultoria)

```
ADMIN                       SISTEMA                          BANCO
   │                          │                               │
   ├─ Acessa /consultoria ──►│                               │
   │   /clientes/:id          │                               │
   │   /visitas/:num          │                               │
   │                          ├─ Busca methodology_steps ────►│
   │                          ├─ Busca visita ───────────────►│
   │  Exibe checklist ◄───────┤                               │
   │                          │                               │
   ├─ Preenche etapas ───────►│                               │
   │                          ├─ Valida obrigatórias          │
   │                          ├─ UPDATE checklist_data ──────►│
   │                          │                               ├─ Trigger updated_at
   │  Finaliza visita ───────►│                               │
   │                          ├─ UPDATE status='concluida' ──►│
   │  Toast sucesso ◄─────────┤                               │
```

---

## 19. Stakeholders e Responsabilidades

| Stakeholder | Papel | Responsabilidade | Aprova |
|-------------|-------|------------------|--------|
| Pedro Guilherme (Dono MX) | Product Owner final | Valida escopo, prioridades e releases | Release de cada fase |
| Admin MX | Champion do produto | Valida fluxos operacionais, testes em produção | Configurações operacionais |
| Dono de Agência | Early adopter | Valida visão executiva, relatórios | Funcionalidades dono |
| Gerente de Agência | Usuário-chave | Valida rituais diários, feedback, PDI | Fluxos do gerente |
| Vendedor | Usuário final | Valida check-in, ranking, treinamentos | Usabilidade mobile |
| Dev Team | Implementação | Estimativa, implementação, testes | PRs e deploys |

### Processo de aprovação por módulo

| Módulo | Quem valida | Critério de aprovação |
|--------|------------|----------------------|
| Auth/Roles | Dev Team + Admin MX | Login para todos os roles; redirect correto; zero trust |
| Check-in | Gerente + Vendedor | Prazo 09:30; lock 09:45; dados corretos |
| Ranking | Admin MX + Dono | Cálculos batem com planilha de referência |
| Funil | Admin MX | Benchmarks 20/60/33; gargalo identificado |
| Feedback | Gerente + Vendedor | Envio email; ciência funciona |
| PDI | Gerente + Admin MX | Wizard completo; radar renderiza |
| Relatórios | Admin MX + Dono | Email recebido; XLSX correto; dados consistentes |
| CRM Consultoria | Admin MX | CRUD completo; visitas executáveis |
| Config operacional | Admin MX | Meta salva; auditoria registrada |

---

## 20. Análise de Riscos e Mitigações

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|---------------|---------|-----------|
| R1 | Google Calendar API muda ou limita quota | Média | Alto | Wrapper com retry; fallback para registro manual; batch operations |
| R2 | Supabase Edge Function timeout em meses com muitos dados | Média | Médio | Paginação por loja; processamento assíncrono; timeout de 60s com retry |
| R3 | Vendedores não adotam check-in diário | Alto | Alto | Notificações disciplina automáticas; deadline com alerta; campanha de onboarding |
| R4 | Resend API downtime afeta relatórios | Baixo | Médio | Log de falha em logs_reprocessamento; retry manual pelo admin; fallback console |
| R5 | RLS policy mal configurada vaza dados entre lojas | Baixo | Crítico | Testes automatizados de RLS por role; audit de policies; script check_rls.ts |
| R6 | Grande volume de imports sobrecarrega banco | Média | Médio | Batch de 500 linhas; file_hash para dedup; timeout configurável |
| R7 | Dependência de pg_cron para relatórios automáticos | Baixo | Médio | Fallback manual via Painel Consultor; monitoramento do cron |
| R8 | Mobile browsers com limitações de storage/cache | Média | Baixo | Service worker para offline; cache agressivo de ranking; fallback graceful |
| R9 | Usuário órfão após remoção de membership | Média | Baixo | Trigger automático de desativação; re-ativação ao re-adicionar |

---

## 21. Política de Retenção de Dados

| Tabela | Período de retenção | Ação após expiração |
|--------|-------------------|-------------------|
| `daily_checkins` | Indefinido (dados operacionais) | Arquivar em tabela `_archive` após 24 meses |
| `audit_logs` | 24 meses | Delete após 24 meses (cron mensal) |
| `checkin_audit_logs` | 36 meses | Delete após 36 meses |
| `solicitacoes_correcao_lancamento` | 12 meses após resolução | Delete após 12 meses |
| `logs_reprocessamento` | 12 meses | Delete após 12 meses |
| `importacoes_brutas` | 6 meses | Delete após 6 meses |
| `notificacoes` | 90 dias para lidas; indefinido para não lidas | Delete lidas após 90 dias (cron semanal) |
| `notification_reads` | 90 dias | Delete após 90 dias |
| `logs_compartilhamento_whatsapp` | 12 meses | Delete após 12 meses |
| `logs_rotina_gerente` | 24 meses | Arquivar após 24 meses |
| `relatorios_devolutivas_semanais` | Indefinido (dados de qualidade) | Arquivar após 24 meses |
| `historico_regras_metas_loja` | Indefinido (auditoria) | Sem expiração |
| `consulting_*` | Indefinido (dados de cliente) | Sem expiração (LGPD: exclusão sob requisição) |
| `devolutivas` | Indefinido | Arquivar após 24 meses |
| `pdis` / `pdi_reviews` | Indefinido | Arquivar após 36 meses |
| `training_progress` | Indefinido | Sem expiração |
| `pdi_sessoes` e derivadas | Indefinido | Arquivar após 36 meses |

### Notas LGPD

- Dados pessoais em `users` (nome, email, telefone) podem ser excluídos sob requisição do titular.
- Exclusão LGPD: anonymize (SET name='REMOVIDO', email=NULL, phone=NULL, active=false) em vez de DELETE para preservar integridade referencial.
- Dados de `contatos_cliente_consultoria` seguem mesma regra.

---

## 22. Cronograma e Milestones

### Fase 1 — Fundação (Epics 01, 02, 19, 20, 21) — Core operacional
- Auth, roles, memberships, zero trust
- Gestão de lojas e rede
- Layout, navegação e design system
- Motor de cálculos e utilitários
- **Status:** Em produção

### Fase 2 — Rituais MX (Epics 03, 04, 05, 06, 13) — Operação diária
- Check-in diário com deadlines
- Ranking e performance
- Funil MX com diagnóstico
- Metas, benchmarks e regras
- Rotina do gerente
- **Status:** Em produção

### Fase 3 — Qualidade e Desenvolvimento (Epics 07, 08, 09, 10) — Gestão de pessoas
- Feedback semanal
- PDI (10 competências)
- PDI MX 360 (wizard avançado)
- Treinamentos com prescrição
- **Status:** Em produção

### Fase 4 — Comunicação e Automação (Epics 11, 12) — Escala
- Notificações com broadcast e real-time
- Relatórios automatizados (matinal, semanal, mensal)
- **Status:** Em produção

### Fase 5 — Governança (Epics 14, 15, 18) — Admin
- Reprocessamento e importação
- Auditoria e diagnósticos
- Configurações operacionais
- **Status:** Em produção

### Fase 6 — Expansão (Epics 16, 17) — Novos módulos
- CRM de Consultoria
- Produtos Digitais
- **Status:** Em produção (CRM em expansão)

---

## 23. Dependências entre Epics

```
P0 (Fundação — pré-requisito de tudo):
  EPIC 21 (Motor) ─┐
  EPIC 20 (Design) ─┤
  EPIC 19 (Layout) ─┤
  EPIC 01 (Auth) ───┤
       │            │
       ▼            │
  EPIC 02 (Lojas) ◄─┘
       │
       ├─► EPIC 03 (Check-in) ──► EPIC 04 (Ranking)
       │                        ──► EPIC 05 (Funil) ──► EPIC 10 (Treinamentos)
       │                        ──► EPIC 13 (Rotina)
       │
       ├─► EPIC 06 (Metas)
       ├─► EPIC 07 (Feedback) ──► EPIC 12 (Relatórios)
       ├─► EPIC 08 (PDI) ──► EPIC 09 (PDI 360)
       ├─► EPIC 11 (Notificações) [cross-cutting]
       ├─► EPIC 14 (Reprocessamento)
       ├─► EPIC 15 (Auditoria)
       ├─► EPIC 16 (CRM Consultoria)
       ├─► EPIC 17 (Produtos Digitais)
       └─► EPIC 18 (Configurações)

Dependências críticas:
- EPIC 01 é pré-requisito de TUDO (auth)
- EPIC 02 é pré-requisito de tudo operacional (multi-tenant)
- EPIC 21 (Motor de cálculos) é pré-requisito de EPIC 04, 05, 12
- EPIC 03 (Check-in) é pré-requisito de EPIC 04, 05 (ranking e funil precisam de dados)
- EPIC 05 (Funil) é pré-requisito de EPIC 10 (treinamento prescrito por gargalo)
- EPIC 11 (Notificações) é cross-cutting: usado por EPIC 03, 07, 10, 12, 13
```

---

## 24. Estratégia de Rollback

Cada story deve ter estratégia de rollback documentada. Padrão:

| Tipo de Story | Estratégia de Rollback |
|---------------|----------------------|
| Nova tabela/migration | `DROP TABLE` + remover migration; dados criados são perdidos |
| Nova rota/página | Remover rota do App.tsx; deletar arquivo da página; sem impacto em core |
| Novo hook | Remover import do hook; deletar arquivo; componentes que usavam quebram (reverter também) |
| Novo componente | Remover import; deletar arquivo; pages que usavam precisam ser revertidas |
| Alteração em página existente | `git revert` do commit da story |
| Alteração em hook existente | `git revert` + verificar pages que dependem |
| Edge Function nova | Deletar diretório da function; sem impacto em core |
| Trigger/RPC nova | `DROP FUNCTION` / `DROP TRIGGER`; sem impacto em dados existentes |
| RLS policy | `DROP POLICY`; tabela fica sem restrição (dev only) |

### Rollback por Epic

| Epic | Rollback | Impacto |
|------|----------|---------|
| EPIC 01 | Reverter para auth legada | Crítico — sem auth, sistema inteiro para |
| EPIC 02 | Remover rotas /lojas, /loja | Médio — lojas ficam sem gestão |
| EPIC 03 | Remover rota /checkin | Médio — checkins param, ranking fica sem dados |
| EPIC 04 | Remover rota /ranking | Baixo — sem visualização, dados preservados |
| EPIC 05 | Remover rota /funil | Baixo — sem diagnóstico |
| EPIC 06 | Remover config screens | Médio — configs voltam ao banco direto |
| EPIC 07 | Remover rota /feedback | Médio — devolutivas param |
| EPIC 08-09 | Remover rotas /pdi | Médio — PDIs param |
| EPIC 10 | Remover rota /treinamentos | Baixo — treinamentos preservados no banco |
| EPIC 11 | Remover rota /notificacoes | Baixo — notificações acumulam sem UI |
| EPIC 12 | Desativar pg_cron + Edge Functions | Médio — relatórios param |
| EPIC 13 | Remover rota /rotina | Baixo |
| EPIC 14 | Remover rota /reprocessamento | Baixo — imports param |
| EPIC 15 | Remover rota /auditoria | Baixo — logs continuam no banco |
| EPIC 16 | Remover rotas /consultoria* | Baixo — core não afetado |
| EPIC 17 | Remover rota /produtos | Baixo |
| EPIC 18 | Remover rota /configuracoes/operacional | Baixo — config via banco |
| EPIC 19-21 | Reverter para UI anterior | Crítico — shell do sistema |

---

## 25. Regras críticas de negócio

- O sistema deve continuar sendo tratado como **uma única plataforma**.
- O admin governa toda a plataforma.
- O vendedor opera seu próprio ritual e seus próprios dados.
- O gerente governa a operação da loja e da equipe.
- O dono tem visão executiva da própria rede.
- O checkin é a base do motor operacional.
- O funil deve orientar decisão e treinamento.
- Consultoria, visitas, financeiro e agenda fazem parte do mesmo produto.
- Toda automação precisa deixar rastro.
- Toda alteração crítica precisa ser auditável.
- O backlog deve respeitar o que existe em produção.

---

## 26. Estratégia para geração de backlog pelos agentes

Os agentes devem gerar backlog completo do sistema inteiro com base neste PRD e no mapeamento atual real.

### Regra de decomposição
Cada módulo deve ser quebrado em:

- épicos
- stories
- subtarefas técnicas
- critérios de aceite
- dependências
- testes necessários
- estratégia de rollback

### Regra de modelagem
Os agentes **não devem** separar o produto em "core" e "consultoria" como produtos independentes. Devem tratá-lo como uma plataforma unificada, respeitando apenas dependências internas e estado real de produção.

### Regra de realidade operacional
O backlog deve considerar:

- o que já está em produção
- o que existe em código
- o que existe em banco
- o que depende de Edge Function, trigger ou RPC
- o que depende de ajuste de UX, segurança ou governança

---

## 27. Decisão final de produto

O **MX Performance** é um sistema único, completo e unificado.

Tudo que pertence a operação comercial, governança, qualidade, desenvolvimento de equipe, automação executiva, consultoria, agenda, visitas, financeiro e CRM faz parte do mesmo produto.

Este PRD deve ser usado como fonte única para backlog mestre completo, detalhado e orientado ao estado real do sistema atual.
