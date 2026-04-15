# PRD Mestre — MX Performance

**Status:** Documento canônico consolidado  
**Versão:** 2.1  
**Data:** 2026-04-15  
**Produto:** MX Performance  
**Responsável funcional:** Pedro Guilherme / MX Consultoria  
**Tipo de produto:** Plataforma unificada de gestão operacional, performance comercial, desenvolvimento de equipe, automação gerencial, BI e CRM consultivo para redes de lojas automotivas

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

Este PRD foi consolidado para refletir o **mapeamento atual real do sistema**, inclusive estrutura de banco, rotas, hooks, automações e estado de produção.

---

## 2. Visão do produto

### 2.1 O que o produto é

O MX Performance é uma plataforma SaaS multi-store da MX Consultoria para transformar operação comercial em gestão disciplinada, previsível e auditável.

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

---

## 3. Roles e permissões

## 3.1 Papéis do sistema

| Role | Redirect | Escopo |
|------|----------|--------|
| `admin` | `/painel` | Governança total: lojas, usuários, metas, benchmarks, treinamentos, consultoria, relatórios, reprocessamento |
| `dono` | `/lojas` | Suas lojas, performance, metas, funil, relatórios, feedbacks, PDIs |
| `gerente` | `/loja` | Painel da loja, equipe, metas, funil, ranking, feedback, PDI, treinamentos, rotina |
| `vendedor` | `/home` | Check-in diário, histórico, ranking, feedback, PDI, treinamentos, notificações |

## 3.2 Regras gerais de autorização

- Autenticação via Supabase Auth.
- Roles legados devem ser normalizados para os papéis canônicos.
- Multi-tenancy via `memberships`.
- Usuários com múltiplas lojas podem trocar de contexto de loja.
- **Zero Trust:** não-admin sem memberships ativas deve ser deslogado automaticamente.
- RLS deve ser a camada final de proteção.
- O admin possui governança total do sistema.
- Dono, gerente e vendedor devem respeitar escopo de loja e dados associados.

---

## 4. Stack e infraestrutura

## 4.1 Stack atual do sistema

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Roteamento | React Router v6 (BrowserRouter) |
| Estado | Context API com `AuthProvider` |
| Design System | Atomic custom |
| Estilo | Tailwind CSS + CSS variables (tokens MX) |
| Animação | Framer Motion |
| Gráficos | Recharts |
| Ícones | Lucide React |
| Validação | Zod |
| Backend | Supabase (Postgres + Auth + Storage) |
| Edge Functions | Deno Runtime |
| Email | Resend |
| Excel | ExcelJS + `xlsx` |
| Agendamento | node-cron |
| Deploy | Vercel |
| CI | GitHub Actions |
| Repositório | `pglemos/MXGESTAOPREDITIVA` |

## 4.2 Requisitos técnicos fundamentais

- O sistema deve continuar operando com Vite, React Router, Supabase e design system atual.
- O banco principal é Postgres gerenciado via Supabase.
- O shell de layout deve continuar role-based.
- As automações devem continuar integradas a email, Excel e rotinas agendadas.
- O sistema precisa manter compatibilidade com dados legados enquanto consolida o domínio canônico.

---

## 5. Módulos ativos do sistema

O sistema possui atualmente os seguintes módulos ativos, que compõem o escopo funcional do produto:

1. Checkin  
2. Ranking  
3. Feedback  
4. PDI 360  
5. Relatório Matinal  
6. Relatório Mensal  
7. Relatório Semanal  
8. Consultoria CRM  
9. DRE / Financeiro  
10. Google Calendar  
11. Notificações  
12. Treinamentos  
13. Metas  
14. Funil  
15. Equipe  
16. Rotina do Gerente  
17. BI  
18. Auditoria  
19. Reprocessamento

Esses módulos devem ser tratados como parte do mesmo produto, mesmo quando alguns itens ainda dependam de migrations pendentes ou refinamentos técnicos.

---

## 6. Rotas e páginas do sistema

## 6.1 Rotas públicas

- `/login`
- `/privacy`
- `/terms`

## 6.2 Rotas protegidas por papel

### Vendedor

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

### Gerente

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
| `/auditoria` | `AiDiagnostics` | Diagnóstico forense |

### Dono

| Rota | Página | Funcionalidade |
|------|--------|----------------|
| `/lojas` | `Lojas` | Listagem de lojas e visão executiva |
| `/loja` | `DashboardLoja` | Acompanhamento de performance |
| `/metas` | `GoalManagement` | Metas |
| `/funil` | `Funil` | Funil |
| `/relatorio-matinal` | `MorningReport` | Matinal oficial |
| `/feedback` | `GerenteFeedback` | Visão executiva de feedback |
| `/pdi` | `GerentePDI` | Visão executiva de PDI |

### Admin

| Rota | Página |
|------|--------|
| `/painel` | `PainelConsultor` |
| `/lojas` | `Lojas` |
| `/produtos` | `ProdutosDigitais` |
| `/configuracoes` | `Configuracoes` |
| `/configuracoes/operacional` | `OperationalSettings` |
| `/configuracoes/reprocessamento` | `Reprocessamento` |
| `/relatorio-matinal` | `MorningReport` |
| `/relatorios/performance-vendas` | `SalesPerformance` |
| `/relatorios/performance-vendedores` | `SellerPerformance` |
| `/auditoria` | `AiDiagnostics` |
| `/treinamentos` | `ConsultorTreinamentos` |
| `/notificacoes` | `ConsultorNotificacoes` |
| `/consultoria` | `Consultoria` |
| `/consultoria/clientes` | `ConsultoriaClientes` |
| `/consultoria/clientes/:clientId` | `ConsultoriaClienteDetalhe` |
| `/consultoria/clientes/:clientId/visitas/:visitNumber` | `ConsultoriaVisitaExecucao` |
| `/metas` | `GoalManagement` |
| `/funil` | `Funil` |
| `/ranking` | `Ranking` |
| `/checkin` | `Checkin` |
| `/perfil` | `Perfil` |

## 6.3 Regras de navegação

- O shell deve exibir sidebar role-based.
- Há páginas acessíveis via link interno, via URL direta e via header.
- O admin deve manter a navegação em três grupos: Governança MX, Rituais MX e Sustentação.
- Dono, gerente e vendedor devem ter navegação simplificada e orientada ao seu ritual operacional.
- A existência de rotas sem link na sidebar é parte do comportamento atual e deve ser preservada ou deliberadamente tratada em backlog.

---

## 7. Banco de dados

## 7.1 Estado atual do banco

O sistema possui **45 tabelas base + 4 views** no schema público.

## 7.2 Tabelas core

- `users`
- `stores`
- `memberships`
- `daily_checkins`
- `goals`
- `benchmarks`
- `feedbacks`
- `pdis`
- `notifications`
- `notification_reads`
- `trainings`
- `training_progress`
- `digital_products`
- `roles`
- `user_roles`
- `goal_logs`
- `inventory`
- `agencies`
- `daily_lead_volumes`
- `audit_logs`

## 7.3 Tabelas de automação e comunicação

- `automation_configs`
- `communication_instances`
- `report_history`
- `role_assignments_audit`

## 7.4 Tabelas canônicas de domínio

- `store_sellers`
- `store_benchmarks`
- `store_delivery_rules`
- `store_meta_rules`
- `store_meta_rules_history`
- `reprocess_logs`
- `raw_imports`

## 7.5 Tabelas operacionais

- `manager_routine_logs`
- `whatsapp_share_logs`
- `weekly_feedback_reports`
- `checkin_correction_requests` *(migration pendente)*
- `checkin_audit_logs` *(migration pendente)*

## 7.6 Tabelas PDI 360

Migrations definidas no repositório, mas ainda não aplicadas em produção:

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

## 7.7 Tabelas consultoria / CRM

- `consulting_clients`
- `consulting_client_units`
- `consulting_client_contacts`
- `consulting_assignments`
- `consulting_methodology_steps`
- `consulting_visits`
- `consulting_financials`
- `consulting_oauth_tokens`
- `consulting_calendar_settings`
- `consulting_google_oauth_states`

## 7.8 Views

- `view_sem_registro`
- `view_store_daily_production`
- `view_seller_tenure_status`
- `view_daily_team_status`

## 7.9 Requisitos de dados

- O sistema deve preservar o banco como fonte única de verdade.
- O domínio legado e o domínio canônico devem coexistir com sincronização controlada.
- O sistema deve continuar tratando como pendentes as migrations ainda não aplicadas em produção.
- As tabelas consultoria fazem parte do produto unificado e devem permanecer no mesmo PRD.

---

## 8. Funções, triggers e segurança

## 8.1 Funções principais

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
- `log_store_meta_rules_changes()`
- `process_import_data()`
- `configure_*_cron()`
- `enforce_feedback_seller_ack_only()`
- `send_broadcast_notification()`
- `sync_notification_reads()`
- `sync_pdi_legacy_shadow_columns()`

## 8.2 Triggers principais

O sistema deve preservar e evoluir os triggers que:

- sincronizam checkins legados/canônicos
- atualizam `updated_at`
- impedem edição indevida de feedbacks pelo vendedor
- sincronizam shadow columns de PDI
- escrevem histórico de mudanças
- rastreiam leitura de notificação
- mantêm dados consultoria atualizados

## 8.3 Requisitos de segurança

- Todas as tabelas com dados sensíveis devem operar com RLS ativa.
- O sistema deve utilizar funções auxiliares seguras para checagem de escopo.
- Input de Edge Functions deve ser validado com Zod.
- Tokens OAuth2 devem permanecer criptografados.
- O frontend deve evitar XSS, erros de `.single()` indevidos e tela branca por falha global.

---

## 9. Edge Functions e automações

## 9.1 Edge Functions ativas

| Função | Trigger | Propósito |
|--------|---------|-----------|
| `relatorio-matinal` | pg_cron 08:30 BRT + manual | Relatório matinal |
| `relatorio-mensal` | pg_cron dia 1 10:30 BRT + manual | Fechamento mensal |
| `feedback-semanal` | pg_cron segunda 12:30 BRT + manual | Feedback semanal |
| `send-individual-feedback` | manual | Envio de feedback individual |
| `google-oauth-handler` | callback OAuth | Conexão Google Calendar |
| `google-calendar-events` | consulta de eventos | Busca de eventos com refresh token |

## 9.2 Módulos `_shared`

As Edge Functions dependem de módulos compartilhados para CORS, response, formatting, cliente Supabase, email, crypto, Google e schemas.

## 9.3 Requisitos de automação

- Relatórios devem poder rodar por cron e manualmente.
- Toda execução deve ser rastreável.
- A integração Google deve prever refresh de token.
- A geração de XLSX e email deve continuar parte do fluxo oficial.
- O sistema deve suportar compartilhamento operacional via WhatsApp quando homologado.

---

## 10. Hooks do sistema

Os hooks são a camada principal de abstração de negócio no frontend e devem continuar refletindo o comportamento funcional do sistema.

### Hooks principais

- `useAuth`
- `useCheckins`
- `useMyCheckins`
- `useCheckinsByDateRange`
- `useCheckinAuditor`
- `useTeam`
- `useStores`
- `useMemberships`
- `useStoresStats`
- `useSellersByStore`
- `useNetworkHierarchy`
- `useOperationalSettings`
- `useRanking`
- `useGlobalRanking`
- `useStorePerformance`
- `useSellerMetrics`
- `useStoreSales`
- `useGoals`
- `useAllStoreGoals`
- `useStoreMetaRules`
- `useStoreGoal`
- `useFeedbacks`
- `useWeeklyFeedbackReports`
- `usePDIs`
- `useMyPDIs`
- `useTrainings`
- `useTeamTrainings`
- `usePDI_MX`
- `useTacticalPrescription`
- `useNotifications`
- `useSystemBroadcasts`
- `useManagerRoutine`
- `useConsultingClients`
- `useConsultingClientDetail`
- `useConsultingMethodology`
- `useConsultingClientMetrics`
- `useConsultingAgenda`

### Requisitos para hooks

- Toda lógica de negócio relevante deve estar encapsulada em hooks ou serviços.
- Hooks devem continuar acessando tabelas e RPCs de forma coerente com o papel do usuário.
- O sistema deve preservar a separação entre hook de UI, cálculo puro e integração externa.

---

## 11. Componentes do sistema

## 11.1 Camadas de componentes

### Atoms
- `Button`
- `Typography`
- `Skeleton`
- `Input`
- `Textarea`
- `Badge`

### Molecules
- `Card`
- `FormField`
- `MXScoreCard`

### Organisms
- `DataGrid`

### Admin
- `AdminNetworkView`

### Layout
- `Layout`
- `LegacyModuleShell`
- `AuthProvider`

### Features especializadas
- `GoogleCalendarView`
- `WizardPDI`
- `WeeklyStoreReport`
- `PrintableFeedback`

## 11.2 Requisitos de UI

- O design system deve continuar baseado em atomic design.
- Componentes precisam ser reutilizáveis, responsivos e coerentes com tokens MX.
- O shell deve continuar role-based.
- A experiência mobile deve permanecer funcional para vendedor, gerente e dono.

---

## 12. Libs, services e automação

## 12.1 Motor de cálculos

`calculations.ts` é um módulo crítico e deve continuar responsável por:

- totais de checkin
- atingimento
- gap
- projeção
- ritmo
- leitura de dias do mês
- cálculo do funil
- diagnóstico de gargalo
- score MX
- status operacional
- textos para WhatsApp
- benchmarks padrão

## 12.2 Services e API layer

O sistema utiliza módulos como:

- `supabase.ts`
- `auth-service.ts`
- `services/checkin-service.ts`
- `export.ts`
- `migration-validator.ts`
- `api/stores.ts`
- `api/manager.ts`
- `validation/legacy-normalizer.ts`
- `validation/checkin-validator.ts`
- `automation/*`
- `mock-data.ts`

Esses módulos são parte da infraestrutura lógica do produto e devem permanecer alinhados ao PRD.

---

## 13. Requisitos funcionais por módulo

## 13.1 Autenticação e autorização

- Login com email e senha.
- Sessão persistente com refresh.
- Redirect por papel.
- Normalização de roles legados.
- Zero trust.
- Multi-store switching.
- Criação automática de perfil.
- Desativação de usuários órfãos.

## 13.2 Gestão de lojas e rede

- CRUD de lojas.
- Gestão de memberships.
- Gestão de vigências via `store_sellers`.
- Hierarquia completa da rede.
- Estatísticas por loja.

## 13.3 Checkin diário

- Lançamento diário com deadline 09:30.
- Lock 09:45.
- Sanitização XSS.
- Upsert por vendedor/loja/data.
- Histórico de checkins.
- Correção retroativa com aprovação.
- Auditoria imutável.
- Regras de venda-loja.

## 13.4 Ranking e performance

- Ranking por loja.
- Ranking global.
- Meta, atingimento, projeção, ritmo, gap, eficiência.
- Score MX.
- Semáforo por performance.

## 13.5 Funil MX

- Pipeline 20/60/33.
- Cálculo de conversões.
- Diagnóstico de gargalo.
- Prescrição tática conectada a treinamento.

## 13.6 Metas e benchmarks

- Meta mensal por loja.
- Modo calendário/dias úteis.
- Benchmarks por loja.
- Delivery rules.
- Auditoria de mudanças.

## 13.7 Feedback

- CRUD de feedback semanal.
- Snapshot vendedor vs equipe.
- Ciência do vendedor.
- Envio individual por email.
- Relatórios semanais consolidados.

## 13.8 PDI

- CRUD de PDI.
- Revisões.
- Ciência do vendedor.
- Impressão.
- Compatibilidade legada.

## 13.9 PDI 360

- Wizard 4 etapas.
- Cargos, descritores e competências.
- Radar.
- Ações sugeridas.
- Sessão bundle.
- Impressão.
- Aprovação de evidência.

## 13.10 Treinamentos

- Catálogo.
- Progresso.
- Prescrição por gargalo.
- Progresso da equipe.
- Lembretes.

## 13.11 Notificações

- Inbox por usuário.
- Broadcast.
- Leitura rastreada.
- Real-time.
- Gatilhos automáticos.

## 13.12 Relatórios automatizados

- Relatório matinal.
- Relatório semanal.
- Relatório mensal.
- XLSX.
- Email.
- Disparo manual.
- Históricos e logs.

## 13.13 Rotina do gerente

- Registro diário.
- Pendências de checkin.
- Snapshot de ranking.
- Gatilho matinal.
- Notas da operação.

## 13.14 Reprocessamento e importação

- Importação CSV.
- Normalização de dados legados.
- Processamento em lote.
- Logs de reprocessamento.
- Armazenamento bruto.

## 13.15 Auditoria e diagnósticos

- Audit logs.
- Diagnóstico forense.
- Views especializadas.
- Logs em tempo real.

## 13.16 Consultoria CRM

- Clientes.
- Unidades.
- Contatos.
- Assignments.
- Detalhe completo do cliente.
- Métricas agregadas.

## 13.17 Agenda, visitas e metodologia PMR

- Checklist de metodologia.
- Execução de visitas.
- Status da visita.
- Fluxo contextual por cliente.
- Visão integrada com Google Calendar.

## 13.18 Financeiro / DRE

- Financeiro por cliente.
- Receita, custos, ROI e indicadores.
- Exibição no detalhe do cliente.

## 13.19 Google Calendar

- OAuth.
- Busca de eventos.
- Refresh de token.
- Configuração por cliente.

## 13.20 Produtos digitais

- Catálogo de produtos.
- CRUD admin.
- Listagem autenticada.

## 13.21 Perfil

- Dados pessoais.
- Avatar.
- Senha.

---

## 14. Testes e qualidade

## 14.1 Estado atual

O sistema possui testes ativos cobrindo:

- motor de cálculos
- utils
- supabase client
- auth service
- relatório matinal
- normalização CSV
- validação de checkin
- hooks de store sales, notifications e checkins
- componente `MXScoreCard`
- benchmark de performance

## 14.2 Requisitos de qualidade

- Todo módulo crítico deve ter cobertura de teste adequada.
- O motor de cálculos é bloqueante para regressão.
- O sistema deve continuar suportando quality gates de lint, typecheck e testes.

---

## 15. Requisitos não funcionais

### Segurança
- RLS ativa nas tabelas sensíveis.
- Tokens criptografados.
- Zod nos inputs críticos.
- Sanitização e error boundaries.

### Performance
- Índices compostos adequados.
- Cache local onde já homologado.
- Chunks de bundle controlados.

### UX
- Shell consistente por role.
- Responsividade real.
- Navegação funcional em sidebar, mobile bar e header.

### Confiabilidade
- Cron jobs oficiais.
- Logs de execução.
- Integrações com retry e refresh token quando necessário.
- Compatibilidade com dados legados e canônicos.

### Código
- TypeScript.
- Atomic design.
- Hooks por domínio.
- Separação entre cálculo, UI e integração.

---

## 16. KPIs do produto

- taxa de checkin no prazo
- disciplina por loja
- cobertura de feedback semanal
- ciência de feedback
- cobertura de PDI
- aderência a treinamentos prescritos
- precisão do relatório matinal
- performance de vendas por loja e vendedor
- clientes ativos na consultoria
- visitas executadas por cliente
- atualização financeira por cliente
- uso dos módulos administrativos

---

## 17. Regras críticas de negócio

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
- O backlog deve respeitar o que existe em produção e o que ainda está pendente de migration.

---

## 18. Estratégia para geração de backlog pelos agentes

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
Os agentes **não devem** separar o produto em “core” e “consultoria” como produtos independentes. Devem tratá-lo como uma plataforma unificada, respeitando apenas dependências internas e estado real de produção.

### Regra de realidade operacional
O backlog deve considerar:

- o que já está em produção
- o que existe em código, mas ainda depende de migration
- o que existe em banco
- o que depende de Edge Function, trigger ou RPC
- o que depende de ajuste de UX, segurança ou governança

---

## 19. Decisão final de produto

O **MX Performance** é um sistema único, completo e unificado.

Tudo que pertence a operação comercial, governança, qualidade, desenvolvimento de equipe, automação executiva, consultoria, agenda, visitas, financeiro e CRM faz parte do mesmo produto.

Este PRD deve ser usado como fonte única para backlog mestre completo, detalhado e orientado ao estado real do sistema atual.

