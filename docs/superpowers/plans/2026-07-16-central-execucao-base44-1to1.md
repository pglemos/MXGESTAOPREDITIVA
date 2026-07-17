# Central de Execução Base44 1:1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a Central de Execução atual por uma implementação visual e comportamental 1:1 da rota `/execucao` do Base44, preservando Supabase, RLS, auditoria e os domínios normalizados do MX.

**Architecture:** `public.execution_actions` será evoluída como a única fila operacional da Central, ligada a `clientes`, `oportunidades`, `agendamentos` e `eventos_comerciais`. O frontend será modularizado em componentes pequenos e consumirá apenas hooks e RPCs transacionais, enquanto o Base44 permanecerá referência de composição visual, textos, estados e fluxos observáveis.

**Tech Stack:** React 19, TypeScript 5.8, React Router 7, Tailwind CSS 4, Radix UI, Motion, Supabase PostgreSQL 17/RLS/RPC, Bun Test, Testing Library, Playwright, Vite 6 e Vercel.

## Global Constraints

- Branch de implementação: `main`, conforme aprovação explícita do responsável do projeto.
- Rotas canônicas: `/central-execucao` e `/central-de-execucao`.
- Referência visual: Base44 app `6a3b2a814401f8c6bf1653df`, rota `/execucao`.
- Fidelidade mensurável: até 2 px para posição, dimensão e espaçamento.
- Viewports obrigatórios: 1440 px, 1280 px, 768 px e 390 px.
- Não importar SDK, autenticação, banco, mocks ou entidades concorrentes do Base44.
- Não criar `atividades_execucao`; evoluir `public.execution_actions`.
- `eventos_comerciais` permanece append-only.
- Reagendamento atualiza o mesmo `agendamento` e a mesma `execution_action`.
- Toda mutação crítica multientidade deve ocorrer em RPC transacional e idempotente.
- Nenhum botão pode permanecer decorativo.
- Não declarar pixel perfect sem captura Base44 × MX no mesmo viewport e diff visual revisado.
- Migrations devem ser aditivas e compatíveis com os registros existentes de PDI, feedback, funil e manual.
- Não corrigir automaticamente as três tabelas com RLS desabilitada sem políticas revisadas; tratar em mudança de segurança separada.

---

## Mapa de arquivos

### Banco e tipos

- Modify: `supabase/migrations/20260617006000_pdi_vendedor_execucao_actions.sql` somente como referência histórica, sem reescrever migration aplicada.
- Create: `supabase/migrations/20260716170000_central_execucao_canonical_queue.sql`
- Modify: `src/types/database.generated.ts`
- Create: `src/lib/central-execucao-migration.test.ts`

### Regras, hooks e dados

- Modify: `src/features/crm/hooks/useExecutionActions.ts`
- Create: `src/features/central-execucao/types/central-execucao.types.ts`
- Create: `src/features/central-execucao/lib/activity-priority.ts`
- Create: `src/features/central-execucao/lib/activity-results.ts`
- Create: `src/features/central-execucao/lib/activity-mappers.ts`
- Create: `src/features/central-execucao/lib/whatsapp-return.ts`
- Create: `src/features/central-execucao/lib/activity-priority.test.ts`
- Create: `src/features/central-execucao/lib/activity-results.test.ts`
- Create: `src/features/central-execucao/lib/activity-mappers.test.ts`
- Create: `src/features/central-execucao/lib/whatsapp-return.test.ts`
- Create: `src/features/central-execucao/hooks/useCentralExecutionActions.ts`
- Create: `src/features/central-execucao/hooks/useCentralMutations.ts`
- Create: `src/features/central-execucao/hooks/useWhatsappReturn.ts`

### Interface

- Modify: `src/features/crm/CentralExecucao.container.tsx`
- Create: `src/features/central-execucao/pages/CentralExecucaoPage.tsx`
- Create: `src/features/central-execucao/tabs/HojeTab.tsx`
- Create: `src/features/central-execucao/tabs/RotinaDiaTab.tsx`
- Create: `src/features/central-execucao/components/CentralHeader.tsx`
- Create: `src/features/central-execucao/components/CentralTabs.tsx`
- Create: `src/features/central-execucao/components/AtividadeCard.tsx`
- Create: `src/features/central-execucao/components/FiltrosAtividade.tsx`
- Create: `src/features/central-execucao/components/PendenciasBanner.tsx`
- Create: `src/features/central-execucao/components/PendenciasDrawer.tsx`
- Create: `src/features/central-execucao/components/FichaClienteSheet.tsx`
- Create: `src/features/central-execucao/components/LinhaTempoRotina.tsx`
- Create: `src/features/central-execucao/components/EstadoVazio.tsx`
- Create: `src/features/central-execucao/modals/NovaAtividadeModal.tsx`
- Create: `src/features/central-execucao/modals/ResolverAtividadeModal.tsx`
- Create: `src/features/central-execucao/modals/ReagendarAtividadeModal.tsx`
- Create: `src/features/central-execucao/modals/RegistrarVendaModal.tsx`
- Create: `src/features/central-execucao/modals/RegistrarPerdaModal.tsx`
- Create: `src/features/central-execucao/modals/EscalarGerenteModal.tsx`
- Create: `src/features/central-execucao/CentralExecucaoPage.test.tsx`
- Create: `src/features/central-execucao/components/AtividadeCard.test.tsx`
- Create: `src/features/central-execucao/modals/ResolverAtividadeModal.test.tsx`
- Create: `src/features/central-execucao/modals/NovaAtividadeModal.test.tsx`

### E2E, evidência e CI

- Create: `src/test/central-execucao-base44-parity.playwright.ts`
- Create: `docs/qa/evidence/central-execucao/README.md`
- Create: `.github/workflows/central-execucao-parity-verification.yml`
- Modify: `docs/superpowers/specs/2026-07-16-central-execucao-base44-1to1-design.md`

---

### Task 1: Contratos canônicos e regras puras

**Files:**
- Create: `src/features/central-execucao/types/central-execucao.types.ts`
- Create: `src/features/central-execucao/lib/activity-priority.ts`
- Create: `src/features/central-execucao/lib/activity-results.ts`
- Create: `src/features/central-execucao/lib/activity-priority.test.ts`
- Create: `src/features/central-execucao/lib/activity-results.test.ts`

**Interfaces:**
- Produces: `CentralExecutionAction`, `CentralActivityType`, `CentralActionStatus`, `CentralResultCode`, `sortCentralActions`, `getResultOptions`.

- [ ] **Step 1: escrever o teste RED de ordenação**

```ts
import { describe, expect, test } from 'bun:test'
import { sortCentralActions } from './activity-priority'

const action = (overrides: Record<string, unknown>) => ({
  id: crypto.randomUUID(),
  activity_type: 'retorno',
  due_at: '2026-07-16T15:00:00-03:00',
  priority_rank: 5,
  status: 'pendente',
  ...overrides,
})

describe('sortCentralActions', () => {
  test('ordena vencidas antes das futuras e desempata por prioridade e horário', () => {
    const now = new Date('2026-07-16T12:00:00-03:00')
    const result = sortCentralActions([
      action({ id: 'future', due_at: '2026-07-16T16:00:00-03:00', priority_rank: 1 }),
      action({ id: 'late-low', due_at: '2026-07-16T10:00:00-03:00', priority_rank: 5 }),
      action({ id: 'late-high', due_at: '2026-07-16T11:00:00-03:00', priority_rank: 1 }),
    ], now)
    expect(result.map(item => item.id)).toEqual(['late-high', 'late-low', 'future'])
  })
})
```

- [ ] **Step 2: executar o teste e confirmar RED**

Run: `bun test src/features/central-execucao/lib/activity-priority.test.ts`

Expected: FAIL porque `activity-priority.ts` ainda não existe.

- [ ] **Step 3: implementar a ordenação mínima**

```ts
export function sortCentralActions<T extends { due_at: string; priority_rank: number }>(items: T[], now = new Date()): T[] {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.due_at).getTime()
    const rightTime = new Date(right.due_at).getTime()
    const leftLate = leftTime < now.getTime()
    const rightLate = rightTime < now.getTime()
    if (leftLate !== rightLate) return leftLate ? -1 : 1
    if (left.priority_rank !== right.priority_rank) return left.priority_rank - right.priority_rank
    return leftTime - rightTime
  })
}
```

- [ ] **Step 4: escrever e executar testes RED/GREEN do catálogo de resultados**

```ts
expect(getResultOptions('retorno').map(item => item.code)).toEqual([
  'contacted', 'no_answer', 'no_response', 'reschedule', 'advanced', 'manager_required',
])
expect(getResultOptions('entrega').map(item => item.code)).toContain('delivery_completed')
expect(getResultOptions('garantia').map(item => item.code)).toContain('waiting_part')
```

Run: `bun test src/features/central-execucao/lib/activity-results.test.ts`

Expected: PASS depois da implementação mínima.

- [ ] **Step 5: executar typecheck focado e commit**

Run: `npm run typecheck`

```bash
git add src/features/central-execucao/types src/features/central-execucao/lib
git commit -m "feat(central): add canonical execution contracts"
```

---

### Task 2: Evolução aditiva de `execution_actions`

**Files:**
- Create: `src/lib/central-execucao-migration.test.ts`
- Create: `supabase/migrations/20260716170000_central_execucao_canonical_queue.sql`

**Interfaces:**
- Produces: colunas relacionais e de resolução em `public.execution_actions`, índices idempotentes, RLS compatível e triggers de timestamp.

- [ ] **Step 1: escrever teste RED do contrato SQL**

```ts
import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const sql = readFileSync('supabase/migrations/20260716170000_central_execucao_canonical_queue.sql', 'utf8')

test('evolui execution_actions sem criar fila concorrente', () => {
  expect(sql).toContain('ALTER TABLE public.execution_actions')
  expect(sql).not.toContain('CREATE TABLE public.atividades_execucao')
  for (const column of ['cliente_id', 'oportunidade_id', 'agendamento_id', 'evento_id', 'activity_type', 'result_code', 'idempotency_key']) {
    expect(sql).toContain(column)
  }
})
```

- [ ] **Step 2: executar e confirmar RED**

Run: `bun test src/lib/central-execucao-migration.test.ts`

Expected: FAIL por arquivo inexistente.

- [ ] **Step 3: criar migration aditiva**

A migration deve, no mínimo:

```sql
ALTER TABLE public.execution_actions
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agendamento_id uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS evento_id uuid REFERENCES public.eventos_comerciais(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activity_type text,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS priority_rank smallint NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS result_code text,
  ADD COLUMN IF NOT EXISTS result_note text,
  ADD COLUMN IF NOT EXISTS origin_module text NOT NULL DEFAULT 'central_execucao',
  ADD COLUMN IF NOT EXISTS source_record_id text,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS automatic boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_name_snapshot text,
  ADD COLUMN IF NOT EXISTS phone_snapshot text,
  ADD COLUMN IF NOT EXISTS vehicle_snapshot text,
  ADD COLUMN IF NOT EXISTS manager_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalation_reason text,
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz;
```

Também deve substituir constraints com `NOT VALID` + validação posterior, preservando os valores antigos, permitir `reagendada`, expandir `source_type`, criar índices por vendedor/status/data e índices únicos parciais para `idempotency_key` e origem.

- [ ] **Step 4: executar testes e aplicar migration no Supabase**

Run: `bun test src/lib/central-execucao-migration.test.ts`

Expected: PASS.

Apply: `Supabase.apply_migration(project_id='fbhcmzzgwjdgkctlfvbo', name='central_execucao_canonical_queue', query=<SQL>)`.

- [ ] **Step 5: consultar catálogo, advisors e commit**

Run SQL:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'execution_actions'
order by ordinal_position;
```

Run security and performance advisors. Não aplicar correção automática às três tabelas antigas sem RLS.

```bash
git add supabase/migrations/20260716170000_central_execucao_canonical_queue.sql src/lib/central-execucao-migration.test.ts
git commit -m "feat(db): evolve canonical execution queue"
```

---

### Task 3: RPCs transacionais e idempotentes

**Files:**
- Extend: `supabase/migrations/20260716170000_central_execucao_canonical_queue.sql`
- Extend: `src/lib/central-execucao-migration.test.ts`

**Interfaces:**
- Produces:
  - `central_create_manual_action(p_payload jsonb, p_idempotency_key text) returns uuid`
  - `central_sync_appointment_action(p_agendamento_id uuid, p_idempotency_key text) returns uuid`
  - `central_reschedule_action(p_action_id uuid, p_due_at timestamptz, p_note text, p_idempotency_key text) returns uuid`
  - `central_resolve_action(p_action_id uuid, p_result_code text, p_note text, p_payload jsonb, p_idempotency_key text) returns jsonb`
  - `central_escalate_action(p_action_id uuid, p_reason text, p_idempotency_key text) returns uuid`

- [ ] **Step 1: adicionar expectativas RED para as cinco RPCs**

```ts
for (const rpc of [
  'central_create_manual_action',
  'central_sync_appointment_action',
  'central_reschedule_action',
  'central_resolve_action',
  'central_escalate_action',
]) expect(sql).toContain(`FUNCTION public.${rpc}`)
expect(sql).toContain('FOR UPDATE')
expect(sql).toContain('idempotency_key')
```

- [ ] **Step 2: confirmar RED e implementar RPCs**

Cada RPC deve:

```sql
IF auth.uid() IS NULL THEN
  RAISE EXCEPTION 'Sessao invalida.';
END IF;
```

Validar vendedor e loja, bloquear a linha com `FOR UPDATE`, consultar idempotência antes de escrever, atualizar o mesmo agendamento, criar `eventos_comerciais` somente quando houver fato comercial real e retornar sem deixar gravações parciais em caso de erro.

- [ ] **Step 3: implementar matriz de resolução**

`central_resolve_action` deve tratar explicitamente:

```text
contacted, no_answer, no_response, reschedule, advanced, manager_required,
attended, no_show, sale_completed, sale_lost,
delivery_completed, delivery_confirmed, documentation_pending,
warranty_resolved, waiting_workshop, waiting_part,
post_sale_satisfied, post_sale_question, complaint, repurchase, referral
```

Resultados de venda/perda atualizam a oportunidade ligada. Resultados de presença atualizam o agendamento ligado. Resultado `reschedule` deve rejeitar payload sem `due_at`.

- [ ] **Step 4: testar no banco dentro de transação de verificação**

Executar consultas de introspecção e chamadas com usuário autenticado de homologação. Não fabricar UUIDs em migration. Confirmar rollback em payload inválido.

- [ ] **Step 5: testes, advisors e commit**

Run: `bun test src/lib/central-execucao-migration.test.ts`

```bash
git add supabase/migrations/20260716170000_central_execucao_canonical_queue.sql src/lib/central-execucao-migration.test.ts
git commit -m "feat(db): add transactional Central execution RPCs"
```

---

### Task 4: Tipos gerados e hook canônico

**Files:**
- Modify: `src/types/database.generated.ts`
- Modify: `src/features/crm/hooks/useExecutionActions.ts`
- Create: `src/features/central-execucao/hooks/useCentralExecutionActions.ts`
- Create: `src/features/central-execucao/hooks/useCentralMutations.ts`

**Interfaces:**
- Produces:

```ts
useCentralExecutionActions(): {
  actions: CentralExecutionAction[]
  pendingPrevious: CentralExecutionAction[]
  loading: boolean
  error: string | null
  refetch(): Promise<void>
}

useCentralMutations(): {
  createManualAction(input: CreateManualActionInput): Promise<MutationResult>
  resolveAction(input: ResolveActionInput): Promise<MutationResult>
  rescheduleAction(input: RescheduleActionInput): Promise<MutationResult>
  escalateAction(input: EscalateActionInput): Promise<MutationResult>
}
```

- [ ] **Step 1: gerar tipos Supabase e escrever teste RED do mapper**

Usar `Supabase.generate_typescript_types`, substituir `src/types/database.generated.ts` e escrever teste que converte uma linha de `execution_actions` em `CentralExecutionAction` sem perder snapshots, vínculos e metadata.

- [ ] **Step 2: implementar mapper mínimo e confirmar GREEN**

```ts
export function mapExecutionActionRow(row: ExecutionActionRow): CentralExecutionAction {
  return {
    id: row.id,
    activityType: row.activity_type ?? inferActivityType(row),
    dueAt: row.due_at,
    status: row.status,
    priorityRank: row.priority_rank ?? 5,
    client: row.cliente ?? null,
    opportunity: row.oportunidade ?? null,
    appointment: row.agendamento ?? null,
    snapshots: {
      name: row.client_name_snapshot,
      phone: row.phone_snapshot,
      vehicle: row.vehicle_snapshot,
    },
  }
}
```

- [ ] **Step 3: evoluir `useExecutionActions` sem duplicar hook legado**

O hook existente continuará exportado para consumidores antigos, mas sua consulta deverá selecionar os novos campos. `useCentralExecutionActions` compõe o hook e aplica ordenação/filtros, não abre uma segunda consulta concorrente sem motivo.

- [ ] **Step 4: implementar mutations somente por RPC**

Nenhuma mutação crítica deve executar múltiplos `.from(...).update()` no cliente.

- [ ] **Step 5: testes, typecheck e commit**

Run: `bun test src/features/central-execucao/lib/activity-mappers.test.ts`
Run: `npm run typecheck`

```bash
git add src/types/database.generated.ts src/features/crm/hooks/useExecutionActions.ts src/features/central-execucao
git commit -m "feat(central): connect canonical execution queue"
```

---

### Task 5: Shell 1:1, header, tabs, filtros e cards

**Files:**
- Create: `src/features/central-execucao/pages/CentralExecucaoPage.tsx`
- Create: `src/features/central-execucao/tabs/HojeTab.tsx`
- Create: `src/features/central-execucao/components/CentralHeader.tsx`
- Create: `src/features/central-execucao/components/CentralTabs.tsx`
- Create: `src/features/central-execucao/components/AtividadeCard.tsx`
- Create: `src/features/central-execucao/components/FiltrosAtividade.tsx`
- Create: `src/features/central-execucao/components/PendenciasBanner.tsx`
- Create: `src/features/central-execucao/components/EstadoVazio.tsx`
- Create: `src/features/central-execucao/components/AtividadeCard.test.tsx`
- Create: `src/features/central-execucao/CentralExecucaoPage.test.tsx`
- Modify: `src/features/crm/CentralExecucao.container.tsx`

**Interfaces:**
- `CentralExecucao.container.tsx` vira adaptador fino que exporta `CentralExecucaoPage`.
- `HojeTab` recebe ações, filtros e callbacks. Nenhum componente visual acessa Supabase.

- [ ] **Step 1: escrever testes RED do shell Base44**

```tsx
expect(screen.getByRole('heading', { name: 'Rotina do Dia' })).toBeTruthy()
expect(screen.getByRole('tab', { name: 'Hoje' })).toHaveAttribute('aria-selected', 'true')
expect(screen.getByRole('button', { name: 'Nova atividade' })).toBeTruthy()
expect(screen.getByLabelText('Ordenar atividades')).toBeTruthy()
```

Também exigir barra superior de 64 px, tabs sticky, conteúdo `p-5 lg:p-6`, card com barra lateral colorida, avatar, tipo, horário, WhatsApp, telefone, ficha e Resolver.

- [ ] **Step 2: executar e confirmar RED**

Run: `bun test src/features/central-execucao/CentralExecucaoPage.test.tsx src/features/central-execucao/components/AtividadeCard.test.tsx`

- [ ] **Step 3: portar a composição visual do Base44**

Usar a anatomia dos arquivos fornecidos pelo usuário:

```text
src/pages/CentralExecucao.jsx
src/components/execucao/AbaHoje.jsx
```

Adaptar JSX e classes para TypeScript e dados MX, sem copiar SDK Base44. Preservar textos, espaçamentos, ícones, badges, hover/focus, ordem e responsividade observáveis.

- [ ] **Step 4: conectar filtros e ordenação às regras puras**

Filtros: todas, atendimento/visita, retorno, documentação, entrega, pós-venda, aniversário, garantia e comercial. Ordenação: prioridade, horário, tipo e cliente.

- [ ] **Step 5: testes, lint e commit**

Run: `bun test src/features/central-execucao`
Run: `npm run typecheck`
Run: `npm run lint:tokens`

```bash
git add src/features/crm/CentralExecucao.container.tsx src/features/central-execucao
git commit -m "feat(central): rebuild Today view from Base44 reference"
```

---

### Task 6: Pendências anteriores e ficha lateral

**Files:**
- Create: `src/features/central-execucao/components/PendenciasDrawer.tsx`
- Create: `src/features/central-execucao/components/FichaClienteSheet.tsx`
- Create: `src/features/central-execucao/components/FichaClienteSheet.test.tsx`

**Interfaces:**
- `FichaClienteSheet` recebe `clienteId`, `open`, `onOpenChange` e carrega cliente, oportunidade, agendamentos e até 30 eventos comerciais.

- [ ] **Step 1: escrever testes RED**

Exigir que a ficha abra sobre a Central sem desmontar a aba atual e apresente contato, veículo, oportunidade, financiamento, troca, próxima ação e timeline.

- [ ] **Step 2: implementar drawer de pendências 1:1**

Portar composição de `PendenciasDrawer.jsx`, substituindo as entidades Base44 por `CentralExecutionAction[]` vencidas.

- [ ] **Step 3: implementar ficha usando domínios normalizados**

A timeline deve unir `eventos_comerciais`, agendamentos e resoluções de `execution_actions`, ordenada por data, sem duplicar eventos idempotentes.

- [ ] **Step 4: validar navegação e foco**

Abrir/fechar sheet mantém filtros, scroll e aba. Escape fecha somente o sheet superior.

- [ ] **Step 5: testes e commit**

```bash
git add src/features/central-execucao/components
git commit -m "feat(central): add pending drawer and client sheet"
```

---

### Task 7: Nova atividade e busca de cliente

**Files:**
- Create: `src/features/central-execucao/modals/NovaAtividadeModal.tsx`
- Create: `src/features/central-execucao/modals/NovaAtividadeModal.test.tsx`

**Interfaces:**
- Consumes: `createManualAction`.
- Produces: atividade avulsa vinculada ao cliente quando encontrado, snapshots estruturados quando não encontrado.

- [ ] **Step 1: escrever testes RED dos dois passos**

Exigir seleção de tipo, busca por telefone/nome, estado cliente encontrado, estado não encontrado, nome obrigatório para atividade avulsa, data, horário, veículo, descrição e objetivo.

- [ ] **Step 2: implementar seleção visual 1:1**

Portar `NovaAtividadeModal.jsx` do Base44, mantendo cartões, ícones, textos e transição entre passos.

- [ ] **Step 3: implementar lookup normalizado**

Usar `telefone_normalizado` e busca de nome apenas como fallback. Nunca escolher homônimo automaticamente quando houver mais de um resultado.

- [ ] **Step 4: salvar pela RPC idempotente**

Gerar chave estável por sessão de submissão e desabilitar dupla submissão.

- [ ] **Step 5: testes e commit**

```bash
git add src/features/central-execucao/modals/NovaAtividadeModal.tsx src/features/central-execucao/modals/NovaAtividadeModal.test.tsx
git commit -m "feat(central): add structured activity creation"
```

---

### Task 8: Resolver, reagendar, venda, perda e gerente

**Files:**
- Create: `src/features/central-execucao/modals/ResolverAtividadeModal.tsx`
- Create: `src/features/central-execucao/modals/ReagendarAtividadeModal.tsx`
- Create: `src/features/central-execucao/modals/RegistrarVendaModal.tsx`
- Create: `src/features/central-execucao/modals/RegistrarPerdaModal.tsx`
- Create: `src/features/central-execucao/modals/EscalarGerenteModal.tsx`
- Create: `src/features/central-execucao/modals/ResolverAtividadeModal.test.tsx`

**Interfaces:**
- Consumes: catálogos de `getResultOptions` e mutations por RPC.

- [ ] **Step 1: testes RED por tipo**

Testar pelo menos um resultado exclusivo de retorno, entrega, garantia e pós-venda. Testar que `reschedule` exige data/hora; venda exige valor; perda exige motivo; gerente exige justificativa.

- [ ] **Step 2: portar shell e fluxo do `ResolverModal.jsx`**

Manter hierarquia, cards de resultado, observação, botões, estados saving/error e transições Base44.

- [ ] **Step 3: reagendar o mesmo registro**

A RPC deve atualizar `agendamentos.data_hora`, `execution_actions.due_at/status` e próxima ação do cliente na mesma transação.

- [ ] **Step 4: venda/perda e escalonamento**

Venda/perda atualizam a oportunidade vinculada e criam evento comercial idempotente. Escalonamento marca a atividade, define gerente da loja e cria notificação/alerta gerencial auditável.

- [ ] **Step 5: testes e commit**

```bash
git add src/features/central-execucao/modals
git commit -m "feat(central): add transactional activity resolution flows"
```

---

### Task 9: Retorno automático do WhatsApp

**Files:**
- Create: `src/features/central-execucao/lib/whatsapp-return.ts`
- Create: `src/features/central-execucao/lib/whatsapp-return.test.ts`
- Create: `src/features/central-execucao/hooks/useWhatsappReturn.ts`

**Interfaces:**
- Produces: `CENTRAL_WHATSAPP_RETURN_KEY`, `saveWhatsappDeparture`, `consumeWhatsappReturn`, `useWhatsappReturn`.

- [ ] **Step 1: escrever teste RED**

```ts
saveWhatsappDeparture(storage, { actionId: 'a1', leftAt: 1000 })
expect(consumeWhatsappReturn(storage, 2000)).toEqual({ actionId: 'a1', leftAt: 1000 })
expect(consumeWhatsappReturn(storage, 2001)).toBeNull()
```

- [ ] **Step 2: implementar armazenamento de uso único**

Usar `sessionStorage`, validar schema, expirar em 12 horas e remover após consumo.

- [ ] **Step 3: integrar eventos `visibilitychange`, `focus` e `pageshow`**

Ao retornar, abrir `ResolverAtividadeModal` com o texto “Como foi o contato?”. Não abrir duas vezes pelo mesmo registro.

- [ ] **Step 4: testes e commit**

```bash
git add src/features/central-execucao/lib/whatsapp-return* src/features/central-execucao/hooks/useWhatsappReturn.ts
git commit -m "feat(central): restore WhatsApp contact outcome"
```

---

### Task 10: Rotina do Dia 1:1 e contexto real

**Files:**
- Create: `src/features/central-execucao/tabs/RotinaDiaTab.tsx`
- Create: `src/features/central-execucao/components/LinhaTempoRotina.tsx`
- Create: `src/features/central-execucao/tabs/RotinaDiaTab.test.tsx`

**Interfaces:**
- Consumes: `useRoutinePlaybook`, agenda do dia, metas, funil e PDI existentes.

- [ ] **Step 1: escrever teste RED da linha do tempo**

Exigir sete etapas, horário, etapa atual expandida, passadas/futuras, objetivo, instruções, meta, atalhos, “Ver como fazer” e aviso de conflito.

- [ ] **Step 2: portar `AbaRotina.jsx`**

Reproduzir layout desktop/mobile, ícones, linha, cartões, expansão, sombras, cores e conteúdo observável.

- [ ] **Step 3: conectar dados reais**

Usar meta mensal, vendas, faltante, oportunidades quentes, agenda, perdas, PDI e semana do mês. Ausência de dado oficial deve aparecer como indisponível, nunca como zero inventado.

- [ ] **Step 4: testes e commit**

```bash
git add src/features/central-execucao/tabs/RotinaDiaTab* src/features/central-execucao/components/LinhaTempoRotina.tsx
git commit -m "feat(central): rebuild daily routine from Base44 reference"
```

---

### Task 11: Backfill idempotente e integrações de origem

**Files:**
- Extend: `supabase/migrations/20260716170000_central_execucao_canonical_queue.sql`
- Extend: `src/lib/central-execucao-migration.test.ts`

**Interfaces:**
- Produces: ações para agendamentos ativos e preserva ações PDI/feedback/funil existentes.

- [ ] **Step 1: escrever testes RED do backfill**

Exigir `INSERT ... SELECT` com `ON CONFLICT` ou `WHERE NOT EXISTS`, chave estável e nenhuma duplicação em segunda execução.

- [ ] **Step 2: backfill de agendamentos abertos**

Mapear `visita`, `retorno`, `test_drive`, `entrega`, `negociacao`, `garantia` e `pos_venda`, preservando snapshots e vínculos.

- [ ] **Step 3: criar triggers/funções de sincronização para novos agendamentos**

A sincronização deve ser transacional e não criar ação para agendamento já concluído/cancelado.

- [ ] **Step 4: validar contagens e duplicidades**

```sql
select source_type, count(*)
from public.execution_actions
where active
group by source_type;

select idempotency_key, count(*)
from public.execution_actions
where idempotency_key is not null
group by idempotency_key
having count(*) > 1;
```

Expected: segunda consulta sem linhas.

- [ ] **Step 5: testes, advisors e commit**

```bash
git add supabase/migrations/20260716170000_central_execucao_canonical_queue.sql src/lib/central-execucao-migration.test.ts
git commit -m "feat(db): backfill Central execution actions"
```

---

### Task 12: CI, E2E, diff visual, deploy e smoke test

**Files:**
- Create: `src/test/central-execucao-base44-parity.playwright.ts`
- Create: `.github/workflows/central-execucao-parity-verification.yml`
- Create: `docs/qa/evidence/central-execucao/README.md`
- Modify: `docs/superpowers/specs/2026-07-16-central-execucao-base44-1to1-design.md`

**Interfaces:**
- Produces: evidência reproduzível e gate de release.

- [ ] **Step 1: criar Playwright não destrutivo para estados visuais**

Capturar Hoje com itens, filtros, pendências, nova atividade nos dois passos, ficha, resolver por tipos, reagendar, Rotina do Dia, 1440/1280/768/390. Mutações reais ficam em teste separado com dados de homologação e cleanup.

- [ ] **Step 2: criar workflow de verificação**

Executar:

```bash
npm install --legacy-peer-deps
npm run typecheck
npm test
npm run lint:tokens
npm run lint
npm run build
```

Preservar logs como artifact mesmo em falha.

- [ ] **Step 3: executar gates locais/CI**

Expected:
- typecheck PASS;
- testes PASS;
- lint tokens PASS;
- lint sem erros;
- build PASS;
- migration tests PASS;
- advisors sem nova vulnerabilidade crítica causada pela mudança.

- [ ] **Step 4: publicar no Vercel e executar smoke test autenticado**

Validar `/central-execucao` e `/central-de-execucao`, carregamento, filtros, abertura de ficha, criação, resolução, reagendamento e retorno WhatsApp.

- [ ] **Step 5: comparar Base44 × MX**

Capturas no mesmo viewport, lado a lado e diff. Corrigir divergências acima de 2 px antes de marcar 1:1.

- [ ] **Step 6: atualizar status e commit final**

Alterar a especificação para `Implementado e homologado` somente após todos os gates.

```bash
git add .github/workflows/central-execucao-parity-verification.yml src/test/central-execucao-base44-parity.playwright.ts docs/qa/evidence/central-execucao docs/superpowers/specs/2026-07-16-central-execucao-base44-1to1-design.md
git commit -m "test(central): verify Base44 parity and production flow"
```

---

## Ordem de publicação

1. Tests RED de contratos e migration.
2. Migration aditiva e RPCs no repositório.
3. Aplicação da migration em produção.
4. Regeneração dos tipos.
5. Hooks e regras.
6. Interface Hoje.
7. Pendências, ficha e modais.
8. WhatsApp e Rotina.
9. Backfill e validação de duplicidade.
10. Typecheck, testes, lint e build.
11. Deploy Vercel.
12. Smoke test autenticado.
13. Diff visual Base44 × MX.
14. Correções finais e homologação.

## Critérios de parada

Interromper a execução e registrar bloqueio quando ocorrer qualquer um destes casos:

- migration não puder ser aplicada de forma aditiva;
- RPC falhar em rollback ou idempotência;
- dados existentes de PDI/feedback/funil deixarem de aparecer;
- RLS impedir o próprio vendedor ou expor dados de outro vendedor;
- typecheck, testes, lint ou build falharem repetidamente;
- Vercel não produzir deployment `READY`;
- não houver acesso autenticado para executar o smoke test;
- não houver evidência visual suficiente para declarar 1:1.

## Auto-revisão do plano

- Cobertura da especificação: dados, RPCs, Hoje, Rotina, pendências, ficha, criação, resolução, WhatsApp, gerente, backfill, CI, deploy e visual.
- Fila única: apenas `execution_actions`.
- Compatibilidade: PDI, feedback, funil e manual preservados.
- Segurança: RLS e autorização por usuário/loja em todas as RPCs.
- Integridade: atualização multientidade transacional e eventos idempotentes.
- Fidelidade: inventário de estados e viewports obrigatório.
- Sem placeholders: assinaturas, caminhos, comandos e resultados esperados definidos.
