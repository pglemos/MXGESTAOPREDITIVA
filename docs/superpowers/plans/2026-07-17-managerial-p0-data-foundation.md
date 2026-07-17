# Módulo Gerencial P0 Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar as fontes canônicas e versionadas exigidas pelo PDF para Agenda D+1, Rotina do Gerente, Rotina do Vendedor e Plano de Sustentação, sem substituir as tabelas operacionais existentes.

**Architecture:** `lancamentos_diarios`, `agendamentos`, `clientes`, `oportunidades` e `execution_actions` continuam como fontes operacionais. Novas tabelas de snapshot armazenam versões oficiais imutáveis. RPCs `SECURITY DEFINER` consolidam dados após validar escopo. A interface passa a consultar fontes canônicas sem importar entidades paralelas do Base44.

**Tech Stack:** PostgreSQL 17/Supabase, pg_cron, React 19, TypeScript 5.8, Supabase JS 2.102, Bun Test, Vite 6.

## Global Constraints

- Branch de código: `main`.
- Fuso oficial: `America/Sao_Paulo`.
- Migrations forward-only e idempotentes.
- Sem apagar ou reescrever snapshots oficiais.
- Erro técnico não penaliza usuário.
- Regra textual do PDF prevalece sobre mockup.
- Base44 Gerencial é referência visual/UX, não banco definitivo.

---

### Task 1: Contrato de migration P0

**Files:**
- Create: `src/lib/managerial-p0-data-foundation-migration.test.ts`
- Create: `supabase/migrations/20260717040000_managerial_p0_data_foundation.sql`

**Interfaces:**
- Produces: tabelas `d1_snapshot_batches`, `d1_snapshot_items`, `manager_daily_tasks`, `manager_routine_snapshots`, `seller_routine_snapshots`, `store_target_plans`.
- Produces: RPCs `consolidate_d1_snapshot`, `refresh_manager_daily_tasks`, `consolidate_manager_routine_snapshot`.

- [ ] **Step 1: escrever teste de contrato que exige tabelas, RLS, versionamento, cron e ausência de UPDATE/DELETE no snapshot.**
- [ ] **Step 2: executar teste e confirmar falha porque a migration ainda não existe.**
- [ ] **Step 3: criar migration mínima para satisfazer o contrato.**
- [ ] **Step 4: executar teste e confirmar aprovação.**
- [ ] **Step 5: aplicar migration no Supabase e validar objetos por SQL.**

### Task 2: Snapshot oficial D+1

**Files:**
- Modify: `supabase/migrations/20260717040000_managerial_p0_data_foundation.sql`
- Test: `src/lib/managerial-p0-data-foundation-migration.test.ts`

**Interfaces:**
- Consumes: `lancamentos_diarios`, `agendamentos`, `clientes`, `oportunidades`, `usuarios`, `lojas`.
- Produces: `consolidate_d1_snapshot(p_reference_date date, p_store_id uuid)`.

- [ ] **Step 1: testar que o snapshot cria nova versão e nunca sobrescreve versão anterior.**
- [ ] **Step 2: implementar batch + itens com fechamento, vendedor, cliente, data/hora, canal, tipo, veículo, status, versão e `consolidated_at`.**
- [ ] **Step 3: agendar execução horária no minuto 31 e consolidar apenas quando o relógio local estiver entre 09:31 e 09:59.**
- [ ] **Step 4: validar RLS para vendedor, gerente, dono e Admin MX.**

### Task 3: Rotina canônica do gerente

**Files:**
- Modify: `supabase/migrations/20260717040000_managerial_p0_data_foundation.sql`
- Modify: `src/features/manager/day-routine/ManagerDayRoutine.container.tsx`
- Test: `src/features/manager/day-routine/manager-day-routine-canonical-source.test.ts`

**Interfaces:**
- Consumes: `solicitacoes_correcao_lancamento`, `lancamentos_diarios`, `agendamentos`, `execution_actions`, `central_execucao_aberturas`, `prospecting_schedule`, `eventos_comerciais`.
- Produces: `manager_daily_tasks` e `manager_routine_snapshots`.

- [ ] **Step 1: testar que a tela não consulta `regularizacao_fechamento`.**
- [ ] **Step 2: trocar a consulta pela fonte canônica `solicitacoes_correcao_lancamento`.**
- [ ] **Step 3: persistir tarefas automáticas por chave idempotente e encerrar quando a condição de origem desaparecer.**
- [ ] **Step 4: excluir erros técnicos e tarefas pessoais do denominador oficial.**

### Task 4: Snapshots do vendedor e Plano da Meta

**Files:**
- Modify: `supabase/migrations/20260717040000_managerial_p0_data_foundation.sql`
- Test: `src/lib/managerial-p0-data-foundation-migration.test.ts`

**Interfaces:**
- Produces: `seller_routine_snapshots` com blocos/numeradores/denominadores/status/base confiável/versão.
- Produces: `store_target_plans` com horizonte/necessidade/ritmo/razão/mensagem/versão.

- [ ] **Step 1: testar constraints de status, versão e unicidade.**
- [ ] **Step 2: criar tabelas append-only com políticas de leitura e escrita por RPC.**
- [ ] **Step 3: validar que dias não aplicáveis aceitam pontuação nula e ficam fora das médias.**

### Task 5: Verificação e publicação

**Files:**
- Modify: `src/types/database.generated.ts` após regeneração.
- Modify: `docs/qa/MODULO_GERENCIAL_FINAL_REPORT.md` com evidência desta onda.

- [ ] **Step 1: gerar tipos TypeScript do Supabase.**
- [ ] **Step 2: executar testes de contrato, typecheck, lint e build.**
- [ ] **Step 3: verificar advisors de segurança/performance.**
- [ ] **Step 4: confirmar deployment Vercel `READY`.**
- [ ] **Step 5: executar smoke test de login/rotas gerenciais e registrar lacunas restantes.**
