---
description: Build MX PERFORMANCE v1.0 — Full autonomous implementation from PRD v5.0
---

# 🚀 MX PERFORMANCE — Workflow de Implementação Completo

> **PRD:** `/Users/pedroguilherme/PROJETOS/MX PERFORMANCE/PRD_MX_Gestao_Preditiva_90D_atualizado.md`
> **Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4 + Supabase + Vercel
> **Projeto:** `/Users/pedroguilherme/PROJETOS/MX PERFORMANCE`
> **Supabase ID:** `fbhcmzzgwjdgkctlfvbo`

---

## ⚠️ REGRAS DE EXECUÇÃO

// turbo-all

1. Sempre leia o PRD antes de cada fase
2. Conecte tudo ao Supabase real — zero mock data
3. Design premium — Inter, cores modernas, micro-animações, glassmorphism
4. 3 canais de venda (porta/carteira/internet) em TUDO
5. Login de teste: `admin@mxperformance.com.br` / `Jose20161@`
6. Após cada fase: `npm run build` para validar + teste via browser `http://localhost:3000`

---

## FASE 0 — LIMPEZA

### 0.1: Limpar código CRM antigo
1. `git checkout -b feature/mx-performance-v1`
2. Deletar páginas CRM:
   - `Activities.tsx`, `Agenda.tsx`, `AiDiagnostics.tsx`, `CommissionRules.tsx`
   - `Communication.tsx`, `CrossSalesReports.tsx`, `Financeiro.tsx`, `Inventory.tsx`
   - `LeadOps.tsx`, `Leads.tsx`, `SalesPerformance.tsx`, `Tarefas.tsx`
3. Manter (serão reescritos): Login, Dashboard, Funnel, GoalManagement, MorningReport, SellerPerformance, Settings, Team, Training, Reports
4. Deletar: `src/lib/mock-data.ts`, `src/lib/ai-service.ts`, `src/lib/schema.sql`
5. Deletar scripts raiz: `check_admin.cjs`, `check_data.cjs`, `create_admin_user.cjs`, `fix_admin_role.cjs`, `fix_rls.cjs`, `get_cols.cjs`, `inspect_data*.cjs`, `inspect_vol.cjs`, `parse_*.cjs`, `run_sql.cjs`, `rls_fix.sql`, `e2e_*.mjs`, `verify_admin*.cjs`

### 0.2: Atualizar projeto
1. `package.json`: remover `@google/genai`, `@hello-pangea/dnd`, `express`, `pg`, `playwright`, `postgres`, `xlsx`
2. `npm install`
3. `index.html`: title = "MX PERFORMANCE"

---

## FASE 1 — BANCO DE DADOS

### 1.1: Schema completo (migration)
Usar `mcp_supabase-mcp-server_apply_migration` com nome `mx_gestao_preditiva_schema`.

Tabelas (15 entidades do PRD Seção 12):

**users** — id (refs auth.users), name, email, role (consultor/gerente/vendedor), avatar_url, active, created_at

**stores** — id, name, manager_email, active, created_at

**memberships** — id, user_id→users, store_id→stores, role, UNIQUE(user_id, store_id)

**goals** — id, store_id→stores, user_id→users (null=loja), month, year, target, updated_at, updated_by, UNIQUE(store_id, user_id, month, year)

**goal_logs** — id, goal_id→goals, changed_by→users, prev_value, new_value, changed_at

**daily_checkins** — id, user_id→users, store_id→stores, date, leads, agd_cart, agd_net, vnd_porta, vnd_cart, vnd_net, visitas, note, zero_reason, created_at, updated_at, UNIQUE(user_id, store_id, date)

**benchmarks** — id, store_id→stores (UNIQUE), lead_to_appt (default 20), appt_to_visit (default 60), visit_to_sale (default 33)

**trainings** — id, title, description, type, video_url, target_audience, active, created_at

**training_progress** — id, user_id→users, training_id→trainings, watched_at, UNIQUE(user_id, training_id)

**digital_products** — id, name, description, link, target_store_id, created_at

**feedbacks** — id, store_id, manager_id, seller_id, positives, attention_points, action, notes, acknowledged, created_at

**pdis** — id, store_id, manager_id, seller_id, objective, action, due_date, status (aberto/em_andamento/concluido), acknowledged, created_at, updated_at

**notifications** — id, sender_id, title, message, target_type (all/store), target_store_id, target_role, sent_at

**notification_reads** — id, notification_id, user_id, read_at, UNIQUE(notification_id, user_id)

**audit_logs** — id, user_id, action, entity, entity_id, details_json (JSONB), created_at

Triggers: updated_at para daily_checkins, pdis, goals.
Function: handle_new_user (cria profile em users após auth.users insert).

### 1.2: RLS Policies (migration)
Nome: `mx_gestao_preditiva_rls`

- users: SELECT todos auth, UPDATE próprio
- stores: SELECT membro/consultor, INSERT/UPDATE consultor
- memberships: SELECT membro/consultor, INSERT gerente/consultor
- daily_checkins: INSERT/UPDATE próprio, SELECT mesma loja/consultor
- goals: SELECT mesma loja/consultor, INSERT/UPDATE gerente/consultor
- feedbacks: SELECT envolvido/consultor, INSERT gerente
- pdis: SELECT envolvido/consultor, INSERT gerente
- trainings: SELECT todos auth, INSERT/UPDATE consultor
- notifications: SELECT destinatário, INSERT consultor
- benchmarks: SELECT membro/consultor, UPDATE gerente/consultor

### 1.3: Seed data
Via `mcp_supabase-mcp-server_execute_sql`:
- 8 lojas: ESPINDOLA, PAAY MOTORS, SEMINOVOS BHZ, ACERTTCAR, RK2 MOTORS, GANDINI, DNA VEICULOS, BROTHERS CAR
- Metas (mês atual) por loja
- Benchmarks padrão (20/60/33) por loja
- Garantir admin existente tem role=consultor na tabela users

### 1.4: Validar
- `list_tables` → 15 tabelas
- Query: `SELECT * FROM stores` → 8 lojas
- Query: `SELECT * FROM users WHERE role='consultor'` → admin existe

---

## FASE 2 — CAMADA DE DADOS (Frontend)

### 2.1: Tipos TypeScript
Criar `src/types/database.ts`:
- Interfaces para todas as 15 tabelas
- `DailyCheckin` com agd_cart, agd_net, vnd_porta, vnd_cart, vnd_net
- Tipos derivados: `CheckinWithTotals`, `StoreWithStats`, `RankingEntry`
- Form types: `CheckinFormData`, `GoalFormData`, `FeedbackFormData`, `PDIFormData`

### 2.2: Hooks de dados
Criar em `src/hooks/`:
- `useAuth.ts` — login, logout, profile, role, store_id
- `useStore.ts` — dados da loja, memberships
- `useCheckins.ts` — CRUD check-ins, validações, totais
- `useGoals.ts` — metas, projeção, ritmo, atingimento
- `useRanking.ts` — ranking por loja e global
- `useFunnel.ts` — funil agregado + benchmarks
- `useTeam.ts` — vendedores da loja + status check-in
- `useTrainings.ts` — listar, marcar assistido
- `useFeedbacks.ts` — CRUD feedbacks
- `usePDIs.ts` — CRUD PDIs
- `useNotifications.ts` — listar, marcar lida, contagem não-lidas

### 2.3: Cálculos de negócio
Criar `src/lib/calculations.ts`:
- `calcularProjecao(vendas, diasDecorridos, totalDias)`
- `calcularRitmo(meta, vendas, diasRestantes)`
- `calcularAtingimento(vendas, meta)` → percentual
- `calcularFaltaX(meta, vendas)`
- `calcularTotais(checkin)` → { agd_total, vnd_total }
- `identificarGargalo(taxasReais, benchmarks)` → diagnóstico

---

## FASE 3 — AUTH + LAYOUT + ROTAS

### 3.1: Login
Reescrever `src/pages/Login.tsx`:
- Design premium, logo "MX PERFORMANCE"
- Email + Senha → Supabase signInWithPassword
- Redirect por role: consultor→`/painel`, gerente→`/loja`, vendedor→`/home`

### 3.2: Layout + Sidebar
Reescrever `src/components/Layout.tsx`:
- Sidebar dinâmica por role (PRD Seção 15):
  - **Consultor:** Dashboard Global, Lojas, Treinamentos, Produtos, Notificações, Configurações
  - **Gerente:** Home Loja, Equipe, Metas, Funil, Feedback, PDI, Treinamentos
  - **Vendedor:** Home, Check-in, Histórico, Ranking, Treinamentos, Feedback&PDI, Notificações, Perfil
- Header: nome, role badge, loja, avatar, badge notificações
- Mobile: hamburger menu

### 3.3: App.tsx (rotas)
Reescrever rotas conforme PRD Seção 15:
- Consultor: `/painel`, `/lojas`, `/treinamentos`, `/produtos`, `/notificacoes`, `/configuracoes`
- Gerente: `/loja`, `/equipe`, `/metas`, `/funil`, `/feedback`, `/pdi`, `/treinamentos`
- Vendedor: `/home`, `/checkin`, `/historico`, `/ranking`, `/treinamentos`, `/feedback`, `/notificacoes`, `/perfil`
- ProtectedRoute com role check
- Lazy loading todas as pages

---

## FASE 4 — PÁGINAS DO VENDEDOR ⭐ (PRIORIDADE MÁXIMA)

### 4.1: Check-in Diário (`/checkin`) — src/pages/Checkin.tsx
**O módulo mais importante do sistema inteiro.**

Formulário em 5 seções visuais:
1. **Prospecção:** Leads (number, min=0)
2. **Agendamentos:** AGD Carteira + AGD Internet + totalizador
3. **Visitas:** Visitas realizadas
4. **Vendas:** VND Porta + VND Carteira + VND Internet + totalizador
5. **Observações:** textarea (280 chars)

Validações: funil lógico (vnd_total ≤ visitas ≤ agd_total), anti-duplicidade (UNIQUE), motivo se tudo=0, confetti se vendas>0.

Regras edição: mesmo dia=livre, D+1=com log, D+2+=v1.1

### 4.2: Home Vendedor (`/home`) — src/pages/VendedorHome.tsx
Widgets: meta (barra progresso), vendas mês (total+por canal), vendas semana, ritmo ("falta X em Y dias"), ranking (posição), CTA "Fazer Check-in", banner pendente.

### 4.3: Histórico (`/historico`) — src/pages/Historico.tsx
Lista check-ins passados, filtros semana/mês, detalhe por canal, edição dia atual/ontem.

### 4.4: Ranking (`/ranking`) — src/pages/Ranking.tsx
Lista ordenada por vendas, medalhas 🥇🥈🥉, destaque "Você", filtro mês/semana.

### 4.5: Feedback&PDI Vendedor (`/feedback`) — src/pages/VendedorFeedback.tsx
Tabs: Feedbacks (leitura + "Li e entendi") + PDIs (leitura + "Li e entendi" + status).

### 4.6: Treinamentos Vendedor (`/treinamentos`) — src/pages/VendedorTreinamentos.tsx
Lista filtrada, embed vídeo, "Marcar como assistido", progresso geral.

### 4.7: Notificações + Perfil
- `src/pages/Notificacoes.tsx` — lista, badge não-lida, marcar como lida
- `src/pages/Perfil.tsx` — nome, email, loja, logout

---

## FASE 5 — PÁGINAS DO GERENTE

### 5.1: Dashboard Loja (`/loja`) — src/pages/Dashboard.tsx (reescrever)
Cards: vendas mês (total+por canal), meta+ating+faltaX, projeção, vendedores, leads, agendamentos, alertas.
Seções: funil com taxas, status check-in (✅/❌), tabela por vendedor, gráfico evolução, vendas por canal, ranking.

### 5.2: Equipe (`/equipe`) — src/pages/Equipe.tsx
Lista vendedores: nome, status check-in, vendas, %, última atividade. Convidar vendedor.

### 5.3: Metas (`/metas`) — src/pages/GoalManagement.tsx (reescrever)
Meta loja + metas individuais, auto-cálculo, aviso soma≠total, projeção/ritmo ao vivo.

### 5.4: Funil (`/funil`) — src/pages/Funnel.tsx (reescrever)
Barras Leads→AGD→Visitas→VND com %, benchmark comparison, gargalo, visão por canal.

### 5.5: Feedback Gerente (`/feedback`) — src/pages/GerenteFeedback.tsx
CRUD feedbacks: select vendedor, campos positivos/atenção/ação, status lido/não-lido.

### 5.6: PDI Gerente (`/pdi`) — src/pages/GerentePDI.tsx
CRUD PDIs: select vendedor, objetivo/ação/prazo, badges status, filtros.

---

## FASE 6 — PÁGINAS DO CONSULTOR

### 6.1: Dashboard Global (`/painel`) — src/pages/PainelConsultor.tsx
Ranking lojas (tabela: loja/meta/vendido/%/projeção/vendedores), ranking global vendedores, saúde sistema, consolidado, vendas por canal global.

### 6.2: Lojas (`/lojas`) — src/pages/Lojas.tsx
CRUD lojas: cards, criar/editar/desativar, email gerente, meta, convidar gerente.

### 6.3: Treinamentos Consultor (`/treinamentos`) — src/pages/ConsultorTreinamentos.tsx
CRUD completo, progresso por loja.

### 6.4: Produtos Digitais (`/produtos`) — src/pages/ProdutosDigitais.tsx
CRUD: nome, descrição, link, loja alvo.

### 6.5: Notificações Consultor (`/notificacoes`) — src/pages/ConsultorNotificacoes.tsx
Enviar notificação: título, mensagem, destino (todas/loja específica).

### 6.6: Configurações (`/configuracoes`) — src/pages/Settings.tsx (reescrever)
Lojas, benchmarks globais, parâmetros (dias corridos/úteis).

---

## FASE 7 — AUTOMAÇÕES

### 7.1: Relatório Matinal
Edge Function `relatorio-matinal`: cron ~8h, para cada loja: tabela vendedor×métricas, meta, projeção, %, faltaX, ranking, email HTML.

### 7.2: Feedback Semanal
Edge Function `feedback-semanal`: cron 2ªf ~9h, últimos 7 dias, funil vs benchmark, gargalo, ranking, campeão.

### 7.3: Relatório Mensal
Edge Function `relatorio-mensal`: cron dia 1 ~9h, consolidado, ranking final, %, por canal.

---

## FASE 8 — VALIDAÇÃO

### 8.1: Build zero erros
`npm run build` sem erros TypeScript.

### 8.2: Teste funcional via browser
Login admin → dashboard consultor com 8 lojas.
Criar vendedor teste → check-in com 3 canais → dashboard atualiza → ranking reflete.
Funil com taxas corretas. Metas com projeção.

### 8.3: Design polish
Responsivo, cores premium, animações, dark mode, loading/empty states.

### 8.4: Seed final
Vendedores reais das 8 lojas, metas reais, dados de teste.

---

## CHECKLIST FINAL (PRD Seção 14)

### Vendedor
- [ ] Check-in 3 canais ≤ 60s
- [ ] Totalizadores automáticos
- [ ] Anti-duplicidade
- [ ] Validação funil
- [ ] Home com meta/vendas/ritmo/ranking
- [ ] Histórico + Ranking + Treinamentos + Feedback&PDI + Notificações

### Gerente
- [ ] Dashboard com vendas por canal
- [ ] Status check-in (✅/❌)
- [ ] Metas + projeção + funil com taxas
- [ ] CRUD Feedback + PDI
- [ ] Ranking + Equipe + Alertas

### Consultor
- [ ] Dashboard global (VISAO_GERAL)
- [ ] CRUD Lojas (CONFIG)
- [ ] CRUD Treinamentos + Produtos
- [ ] Notificações para lojas
- [ ] Relatórios por email

---

*Workflow v1.0 — MX PERFORMANCE · PRD v5.0*
