# Auditoria e Correção de Bugs — MX Gestão Preditiva (07-07) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir as causas raiz (verificadas em código, não em suposição) dos bugs relatados por José Roberto em teste real: contadores de Showroom/Carteira/Internet que "somem" sem erro, Nova Atividade que não salva, leads de Internet que nunca persistem, Regularização de Fechamento que nunca chega ao gerente, e sino de notificações decorativo.

**Architecture:** SPA Vite+React, sem backend próprio — `src/api/base44Client.js` é uma camada de compatibilidade que emula um SDK antigo (Base44) por cima de chamadas diretas ao Supabase (`@supabase/supabase-js`). Todas as correções deste plano acontecem nessa camada, nos componentes de UI que a chamam, e em migrations SQL novas quando o schema realmente não suporta o dado (caso do `leads_internet` e da Regularização).

**Tech Stack:** React 18 + Vite, react-router-dom v7, Supabase JS client, `moment`, Zod (só para parse, não para validação de formulário), `bun test` como test runner (convenção do repo: `describe/expect/test` de `'bun:test'`, sem mocking framework de Supabase pré-existente — funções que tocam rede devem ser desenhadas com injeção de dependência para serem testáveis com dublês simples).

## Global Constraints

- Não alterar o design system / classes Tailwind existentes além do estritamente necessário para o bug.
- Não introduzir `AppErrorResponse` genérico em todo o sistema — fora de escopo; os formulários auditados (`NovoRegistroModal.jsx` canônico) já fazem `setSaveError` + toast com `err.message` real, não é o "erro genérico" que o relatório supôs. O erro genérico real está concentrado nos 2 pontos do Task 2.
- `src/components/fechamento/NovoRegistroModal.jsx` é o modal canônico de Venda/Agendamento/Garantia/Qualificado (é o que roda de fato, chamado por `ClientCard.jsx:916`). `src/features/checkin/sections/NovoRegistroModal.tsx` e toda a árvore `src/features/checkin/Checkin.container.tsx` **não têm rota em `App.tsx`** — são código morto, fora de escopo deste plano. Não tocar.
- Toda query nova a `agendamentos`/`atendimentos`/`eventos_comerciais` precisa resolver `loja_id` via `vinculos_loja` (padrão já usado em `DailyClose.create`/`CarteiraCliente.create`/`EventoComercial.create`) — nunca confiar em `me.loja_id`, que `base44.auth.me()` (`src/api/base44Client.js:165-183`) nunca retorna.
- Migrations novas seguem o padrão de nomenclatura `YYYYMMDDHHMMSS_descricao.sql` em `supabase/migrations/`.

---

## Task 1: Extrair `resolveStoreId()` — elimina duplicação e a causa raiz dos saves que falham

**Contexto:** `src/api/base44Client.js` tem a mesma query (`vinculos_loja` do vendedor ativo) copiada 3x (`DailyClose.create:396-402`, `CarteiraCliente.create:521-527`, `EventoComercial.create:1424-1430`) — e 2 lugares que deveriam ter a mesma lógica mas usam `me.loja_id || null` (que é sempre `null`, pois `auth.me()` nunca inclui `loja_id`): `AtividadeExecucao.create:826` e `ExecutionOpportunity.create:698`. Como `agendamentos.loja_id` é `NOT NULL` (`supabase/migrations/20260609120000_mx_crm_vendedor_foundation.sql:131`), todo insert desses dois cai em violação de constraint — é a causa raiz do "Nova Atividade não salva" e de atividades de Venda/Agendamento/Garantia que somem silenciosamente da Central de Execução.

**Files:**
- Modify: `src/api/base44Client.js`
- Test: `src/api/resolveStoreId.test.ts` (novo)
- Create: `src/api/resolveStoreId.ts` (novo — função extraída, importada por `base44Client.js`)

**Interfaces:**
- Produces: `resolveStoreId(supabaseClient: SupabaseClient, sellerId: string): Promise<string | null>` — usada pelas Tasks 1 e 2.

- [ ] **Step 1: Escrever o teste (falhando)**

```ts
// src/api/resolveStoreId.test.ts
import { describe, expect, test, mock } from 'bun:test'
import { resolveStoreId } from './resolveStoreId'

function fakeSupabase(rows: Array<{ store_id: string }>) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      }),
    }),
  } as any
}

describe('resolveStoreId', () => {
  test('retorna o store_id do vínculo ativo', async () => {
    const client = fakeSupabase([{ store_id: 'loja-123' }])
    const result = await resolveStoreId(client, 'vendedor-1')
    expect(result).toBe('loja-123')
  })

  test('retorna null quando vendedor não tem vínculo ativo', async () => {
    const client = fakeSupabase([])
    const result = await resolveStoreId(client, 'vendedor-1')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar o teste, confirmar falha**

Run: `bun test src/api/resolveStoreId.test.ts`
Expected: FAIL — `Cannot find module './resolveStoreId'`

- [ ] **Step 3: Implementar `resolveStoreId`**

```ts
// src/api/resolveStoreId.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export async function resolveStoreId(
  supabaseClient: SupabaseClient,
  sellerId: string
): Promise<string | null> {
  const { data: vinculos } = await supabaseClient
    .from('vinculos_loja')
    .select('store_id')
    .eq('user_id', sellerId)
    .eq('is_active', true)
    .limit(1)

  return vinculos?.[0]?.store_id ?? null
}
```

- [ ] **Step 4: Rodar o teste, confirmar sucesso**

Run: `bun test src/api/resolveStoreId.test.ts`
Expected: PASS (2 testes)

- [ ] **Step 5: Substituir as 3 duplicações em `base44Client.js` pela função extraída**

No topo do arquivo, adicionar o import:

```js
// src/api/base44Client.js — logo após `import moment from 'moment';` (linha 2)
import { resolveStoreId } from './resolveStoreId';
```

Em `DailyClose.create` (linhas 396-402), substituir:

```js
        // Fetch active store for vendor
        const { data: vinculos } = await supabase
          .from('vinculos_loja')
          .select('store_id')
          .eq('user_id', me.id)
          .eq('is_active', true)
          .limit(1);
        const storeId = vinculos?.[0]?.store_id;
```

por:

```js
        const storeId = await resolveStoreId(supabase, me.id);
```

Em `CarteiraCliente.create` (linhas 521-527), mesma substituição (variável `storeId`, mesmo padrão).

Em `EventoComercial.create` (linhas 1424-1430), mesma substituição.

- [ ] **Step 6: Rodar suíte completa dos arquivos tocados, confirmar que nada quebrou**

Run: `bun test src/api`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/api/resolveStoreId.ts src/api/resolveStoreId.test.ts src/api/base44Client.js
git commit -m "refactor: extrai resolveStoreId para eliminar duplicação de lookup de loja"
```

---

## Task 2: Corrigir `AtividadeExecucao.create` e `ExecutionOpportunity.create` — Nova Atividade volta a salvar

**Contexto:** Com `resolveStoreId` disponível (Task 1), aplicar nos 2 pontos que hoje inserem `loja_id: null` em `agendamentos` (coluna `NOT NULL`), causando falha silenciosa (`ExecutionOpportunity`, usado por `NovaAtividadeModal.jsx`) ou erro real capturado por `.catch(() => {})` (`AtividadeExecucao`, usado por `NovoRegistroModal.jsx` ao criar eventos de agendamento/entrega/garantia).

**Files:**
- Modify: `src/api/base44Client.js:687-707` (`ExecutionOpportunity.create`)
- Modify: `src/api/base44Client.js:811-857` (`AtividadeExecucao.create`)

**Interfaces:**
- Consumes: `resolveStoreId(supabaseClient, sellerId)` de `src/api/resolveStoreId.ts` (Task 1).

- [ ] **Step 1: Corrigir `ExecutionOpportunity.create`**

Trocar (linha 687-707):

```js
      create: async (data) => {
        const me = await base44.auth.me();
        
        let dbStatus = 'confirmado';
        if (data.status === 'Resolvida') dbStatus = 'compareceu';
        else if (data.status === 'Cancelada') dbStatus = 'nao_compareceu';

        const { data: created, error } = await supabase
          .from('agendamentos')
          .insert({
            cliente_id: data.cliente_id || null,
            loja_id: me.loja_id || null,
            seller_user_id: me.id,
```

por:

```js
      create: async (data) => {
        const me = await base44.auth.me();
        const storeId = await resolveStoreId(supabase, me.id);
        if (!storeId) throw new Error('Você não possui vínculo ativo com nenhuma loja. Fale com seu gerente antes de criar atividades.');

        let dbStatus = 'confirmado';
        if (data.status === 'Resolvida') dbStatus = 'compareceu';
        else if (data.status === 'Cancelada') dbStatus = 'nao_compareceu';

        const { data: created, error } = await supabase
          .from('agendamentos')
          .insert({
            cliente_id: data.cliente_id || null,
            loja_id: storeId,
            seller_user_id: me.id,
```

(resto do bloco inalterado)

- [ ] **Step 2: Corrigir `AtividadeExecucao.create`**

Trocar (linha 811-833):

```js
      create: async (data) => {
        const me = await base44.auth.me();
        
        let dbTipo = data.tipo_atividade;
        if (dbTipo === 'agendamento') dbTipo = 'visita';
        
        let dbStatus = 'aguardando';
        if (data.status_atividade === 'Resolvida') dbStatus = 'compareceu';
        else if (data.status_atividade === 'Pendente') dbStatus = 'confirmado';

        const { data: created, error } = await supabase
          .from('agendamentos')
          .insert({
            cliente_id: data.cliente_id || null,
            oportunidade_id: data.oportunidade_id || null,
            loja_id: data.loja_id || me.loja_id || null,
            seller_user_id: data.vendedor_id || me.id,
```

por:

```js
      create: async (data) => {
        const me = await base44.auth.me();
        const sellerId = data.vendedor_id || me.id;
        const storeId = data.loja_id || await resolveStoreId(supabase, sellerId);
        if (!storeId) throw new Error('Vendedor sem vínculo ativo com loja — não é possível registrar a atividade.');

        let dbTipo = data.tipo_atividade;
        if (dbTipo === 'agendamento') dbTipo = 'visita';
        
        let dbStatus = 'aguardando';
        if (data.status_atividade === 'Resolvida') dbStatus = 'compareceu';
        else if (data.status_atividade === 'Pendente') dbStatus = 'confirmado';

        const { data: created, error } = await supabase
          .from('agendamentos')
          .insert({
            cliente_id: data.cliente_id || null,
            oportunidade_id: data.oportunidade_id || null,
            loja_id: storeId,
            seller_user_id: sellerId,
```

(resto do bloco inalterado — a linha seguinte já usava `data.vendedor_id || me.id` para `seller_user_id`, agora reaproveitada via `sellerId`)

- [ ] **Step 3: Verificar manualmente**

Não há mock de Supabase no repo para testar estas funções isoladamente (elas fazem I/O real). Validação é via teste manual (Task 8 deste plano lista o roteiro). Rodar typecheck/lint para garantir que a edição não quebrou sintaxe:

Run: `bun run lint`
Expected: sem novos erros em `src/api/base44Client.js`

- [ ] **Step 4: Commit**

```bash
git add src/api/base44Client.js
git commit -m "fix: resolve loja_id via vinculos_loja em AtividadeExecucao e ExecutionOpportunity

Nova Atividade falhava sempre (loja_id NOT NULL violado) porque
base44.auth.me() nunca retorna loja_id. Atividades criadas a partir de
Venda/Agendamento/Garantia no NovoRegistroModal também falhavam
silenciosamente pelo mesmo motivo (erro engolido por .catch(() => {}))."
```

---

## Task 3: Nova Atividade aceita nome de cliente ainda não cadastrado

**Contexto:** `src/components/execucao/NovaAtividadeModal.jsx` já busca cliente por telefone e já salva `nome_cliente_snapshot`/`telefone_snapshot` mesmo sem cliente encontrado — mas hoje usa a string fixa `"Cliente avulso"` (linha 96), sem deixar o usuário digitar o nome real. É o único gap real do bug 3.8 do relatório (o resto — snapshot de cliente novo, sem redirecionamento — já funciona).

**Files:**
- Modify: `src/components/execucao/NovaAtividadeModal.jsx`

- [ ] **Step 1: Adicionar estado para nome manual**

Em `src/components/execucao/NovaAtividadeModal.jsx:34-36`, trocar:

```js
  const [telefone, setTelefone] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
```

por:

```js
  const [telefone, setTelefone] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [nomeManual, setNomeManual] = useState("");
```

E em `resetar()` (linha 46-53), adicionar `setNomeManual("");` junto aos outros `set*`.

- [ ] **Step 2: Renderizar campo de nome quando cliente não é encontrado**

Em `src/components/execucao/NovaAtividadeModal.jsx:164-174`, trocar:

```jsx
              {naoEncontrado && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                  <UserX className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-amber-800">Cliente não encontrado.</p>
                    <Link to="/carteira" onClick={handleClose} className="text-[11px] text-[#005BFF] underline">
                      Abrir Carteira de Clientes para cadastrar
                    </Link>
                  </div>
                </div>
              )}
```

por:

```jsx
              {naoEncontrado && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                    <UserX className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-amber-800">Cliente não encontrado.</p>
                      <Link to="/carteira" onClick={handleClose} className="text-[11px] text-[#005BFF] underline">
                        Abrir Carteira de Clientes para cadastrar depois
                      </Link>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nome do cliente</label>
                    <Input
                      value={nomeManual}
                      onChange={e => setNomeManual(e.target.value)}
                      placeholder="Nome de quem você vai atender"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              )}
```

- [ ] **Step 3: Usar o nome manual no payload e exigi-lo antes de salvar**

Em `handleSalvar` (linha 81-109), trocar:

```js
        nome_cliente_snapshot: clienteEncontrado?.name || (telefone ? "Cliente avulso" : "Atividade interna"),
```

por:

```js
        nome_cliente_snapshot: clienteEncontrado?.name || nomeManual.trim() || (telefone ? "Cliente avulso" : "Atividade interna"),
```

Em `podesSalvar` (linha 111), trocar:

```js
  const podesSalvar = tipo && form.data && form.hora;
```

por:

```js
  const podesSalvar = tipo && form.data && form.hora && (!!clienteEncontrado || !naoEncontrado || nomeManual.trim().length > 0);
```

- [ ] **Step 4: Mostrar a mensagem real de erro (não mais genérica)**

Com a Task 2 aplicada, `ExecutionOpportunity.create` agora lança `Error` com mensagem específica (ex.: "Você não possui vínculo ativo com nenhuma loja..."). O `catch` de `handleSalvar` (linha 104-107) hoje descarta essa mensagem:

```js
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao criar. Tente novamente." });
    }
```

Trocar por:

```js
    } catch (e) {
      console.error(e);
      toast({ title: "Não foi possível criar a atividade.", description: e?.message || "Tente novamente." });
    }
```

- [ ] **Step 5: Verificar visualmente no browser**

Rodar o dev server, abrir Fechamento Diário → Nova Atividade, digitar um telefone que não existe na Carteira, confirmar que:
- aparece o campo "Nome do cliente"
- botão "Salvar atividade" fica desabilitado até preencher o nome
- ao salvar, a atividade aparece na Central de Execução com o nome digitado (não "Cliente avulso")

- [ ] **Step 6: Commit**

```bash
git add src/components/execucao/NovaAtividadeModal.jsx
git commit -m "feat: permite informar nome do cliente em Nova Atividade quando não cadastrado"
```

---

## Task 4: Contadores de Showroom/Carteira/Internet param de "sumir" sem explicação

**Contexto:** O componente `StepperInput` (`src/components/fechamento/FluxoFechamento.jsx:7-68`) está correto — não reseta valor no blur. O bug é que `setCounter` em `src/base44-reference/pages/FechamentoDiario.jsx:141-165` é `async` e é chamado sem tratamento de erro pelos `onIncrement`/`onDecrement`/`onSet` do `StepperInput`. Se o insert/RPC falhar (janela de horário fechada às 09:45, rede instável, etc.), a `Promise` rejeita sem handler algum, o usuário não vê nada, e o valor exibido volta ao antigo porque `dailyClose` nunca foi atualizado no state.

**Files:**
- Modify: `src/base44-reference/pages/FechamentoDiario.jsx:141-170`

- [ ] **Step 1: Adicionar feedback de erro ao `setCounter`/`updateCounter`**

Trocar (linhas 141-170):

```js
  const setCounter = async (field, newVal) => {
    // Se finalizado: só permite alterar campos D+1 durante a janela de ajuste
    if (jaFinalizado) {
      if (!d1Editavel) return; // bloqueado total
      if (!D1_FIELDS.includes(field)) return; // campo não-D+1 bloqueado
    }
    const safeVal = Math.min(999, Math.max(0, newVal));
    const baseObj = {
      date: closingDate,
      leads_carteira: 0, leads_internet: 0,
      atendimentos_showroom: 0, atendimentos_carteira: 0, atendimentos_internet: 0,
      agendamentos_carteira: 0, agendamentos_internet: 0,
    };
    const current = dailyClose || baseObj;
    const data = { ...current, [field]: safeVal };
    delete data.id; delete data.created_date; delete data.updated_date; delete data.created_by_id;

    if (dailyClose?.id) {
      const updated = await base44.entities.DailyClose.update(dailyClose.id, { [field]: safeVal });
      setDailyClose(updated);
    } else {
      const created = await base44.entities.DailyClose.create(data);
      setDailyClose(created);
    }
  };

  const updateCounter = (field, delta) => {
    const current = dailyClose || {};
    setCounter(field, (current[field] || 0) + delta);
  };
```

por:

```js
  const setCounter = async (field, newVal) => {
    // Se finalizado: só permite alterar campos D+1 durante a janela de ajuste
    if (jaFinalizado) {
      if (!d1Editavel) return; // bloqueado total
      if (!D1_FIELDS.includes(field)) return; // campo não-D+1 bloqueado
    }
    const safeVal = Math.min(999, Math.max(0, newVal));
    const baseObj = {
      date: closingDate,
      leads_carteira: 0, leads_internet: 0,
      atendimentos_showroom: 0, atendimentos_carteira: 0, atendimentos_internet: 0,
      agendamentos_carteira: 0, agendamentos_internet: 0,
    };
    const current = dailyClose || baseObj;
    const data = { ...current, [field]: safeVal };
    delete data.id; delete data.created_date; delete data.updated_date; delete data.created_by_id;

    try {
      if (dailyClose?.id) {
        const updated = await base44.entities.DailyClose.update(dailyClose.id, { [field]: safeVal });
        setDailyClose(updated);
      } else {
        const created = await base44.entities.DailyClose.create(data);
        setDailyClose(created);
      }
    } catch (err) {
      console.error("[FechamentoDiario] Falha ao salvar contador:", err);
      toast({
        title: "Não foi possível salvar esse valor.",
        description: err?.message || "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
    }
  };

  const updateCounter = (field, delta) => {
    const current = dailyClose || {};
    setCounter(field, (current[field] || 0) + delta);
  };
```

(`toast` já está desestruturado de `useToast()` na linha 33 do arquivo — nenhum import novo necessário)

- [ ] **Step 2: Verificar visualmente no browser**

Rodar o dev server, abrir Fechamento Diário depois das 09:45 (horário de Brasília) num usuário vendedor — a `submit_checkin` RPC (`supabase/migrations/20260516125000_submit_checkin_rpc.sql:66-68`) rejeita lançamento diário fora da janela. Clicar em "+" no Showroom deve agora mostrar um toast de erro em vez de simplesmente não incrementar. Antes das 09:45, clicar "+"/"-" deve incrementar/decrementar normalmente e persistir (recarregar a página mantém o valor).

- [ ] **Step 3: Commit**

```bash
git add src/base44-reference/pages/FechamentoDiario.jsx
git commit -m "fix: contadores de fechamento avisam o usuário quando o salvamento falha

Antes, erro no DailyClose.create/update (janela de horário fechada,
rede instável) era engolido silenciosamente — o valor visualmente
'sumia' sem nenhuma explicação."
```

---

## Task 5: Leads de Internet — coluna nunca existiu, contador não tinha onde ser salvo

**Contexto:** `lancamentos_diarios` (`supabase/migrations/00000000000000_baseline_legacy_schema.sql:235-268`, renomeada de `daily_checkins`) só tem uma coluna genérica `leads`/`leads_prev_day` (hoje usada para Carteira). Não existe nenhuma coluna para leads de Internet. `DailyClose.filter` em `base44Client.js:375` hardcoda `leads_internet: 0` sempre, e `DailyClose.create` (linhas 404-425) nunca lê `data.leads_internet`. O campo é um fantasma: nem grava, nem lê. É uma correção de schema, não só de código.

**Files:**
- Create: `supabase/migrations/20260707120000_add_leads_internet_lancamentos_diarios.sql`
- Modify: `supabase/migrations` — atualizar `submit_checkin` RPC (nova migration, não editar a antiga)
- Modify: `src/api/base44Client.js` (`DailyClose.filter`, `.create`, `.update`)

- [ ] **Step 1: Migration — adicionar colunas**

```sql
-- supabase/migrations/20260707120000_add_leads_internet_lancamentos_diarios.sql
ALTER TABLE public.lancamentos_diarios
  ADD COLUMN IF NOT EXISTS leads_net integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS leads_net_prev_day integer DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.lancamentos_diarios.leads_net IS 'Leads recebidos via Internet no dia de referência (campo "Internet" do Fechamento Diário).';
COMMENT ON COLUMN public.lancamentos_diarios.leads_net_prev_day IS 'Espelho histórico de leads_net, mesmo padrão usado por leads_prev_day/vnd_net_prev_day.';
```

- [ ] **Step 2: Migration — estender `submit_checkin` para persistir as novas colunas**

```sql
-- supabase/migrations/20260707130000_submit_checkin_leads_net.sql
CREATE OR REPLACE FUNCTION public.submit_checkin(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_store_id uuid;
  v_seller_id uuid;
  v_reference_date date;
  v_scope text := coalesce(p_payload->>'metric_scope', 'daily');
  v_official_reference date := ((timezone('America/Sao_Paulo', now()))::date - 1);
  v_current_sp_time time := (timezone('America/Sao_Paulo', now()))::time;
  v_is_internal boolean := false;
  v_can_manage_store boolean := false;
  v_checkin_id uuid;
BEGIN
  SELECT role
    INTO v_caller_role
    FROM public.usuarios
   WHERE id = v_caller_id
     AND active = true;

  IF v_caller_role IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário não autenticado ou inativo.');
  END IF;

  v_is_internal := v_caller_role IN ('administrador_geral', 'administrador_mx', 'consultor_mx');
  v_store_id := nullif(p_payload->>'store_id', '')::uuid;
  v_seller_id := coalesce(nullif(p_payload->>'seller_user_id', '')::uuid, v_caller_id);
  v_reference_date := nullif(p_payload->>'reference_date', '')::date;

  IF v_store_id IS NULL OR v_seller_id IS NULL OR v_reference_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payload de check-in incompleto.');
  END IF;

  IF v_scope NOT IN ('daily', 'adjustment', 'historical') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Escopo de check-in inválido.');
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM public.vinculos_loja
     WHERE user_id = v_caller_id
       AND store_id = v_store_id
       AND role IN ('dono', 'gerente')
       AND coalesce(is_active, true) = true
  )
  INTO v_can_manage_store;

  IF v_scope = 'daily' THEN
    IF v_caller_role <> 'vendedor' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Registro diário é permitido apenas para vendedor.');
    END IF;

    IF v_reference_date <> v_official_reference THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Registro diário aceita somente a referência oficial.');
    END IF;

    IF v_seller_id <> v_caller_id THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Registro diário deve ser feito pelo próprio vendedor.');
    END IF;

    IF v_current_sp_time > time '09:45:00' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Lançamentos diários ficam disponíveis somente até 09:45.');
    END IF;
  ELSE
    IF NOT (v_is_internal OR v_can_manage_store) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Ajuste técnico é restrito a gestores e perfis internos MX.');
    END IF;
  END IF;

  IF v_reference_date > v_official_reference THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Lançamentos não podem usar data futura ou o dia corrente.');
  END IF;

  IF NOT v_is_internal AND NOT EXISTS (
    SELECT 1
      FROM public.vinculos_loja
     WHERE user_id = v_seller_id
       AND store_id = v_store_id
       AND coalesce(is_active, true) = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário não possui vínculo ativo com a loja.');
  END IF;

  INSERT INTO public.lancamentos_diarios (
    seller_user_id,
    store_id,
    reference_date,
    submitted_at,
    metric_scope,
    submission_status,
    submitted_late,
    edit_locked_at,
    leads_prev_day,
    leads_net_prev_day,
    agd_cart_prev_day,
    agd_net_prev_day,
    agd_cart_today,
    agd_net_today,
    vnd_porta_prev_day,
    vnd_cart_prev_day,
    vnd_net_prev_day,
    visit_prev_day,
    zero_reason,
    note,
    created_by,
    updated_at
  ) VALUES (
    v_seller_id,
    v_store_id,
    v_reference_date,
    coalesce(nullif(p_payload->>'submitted_at', '')::timestamptz, now()),
    v_scope,
    coalesce(nullif(p_payload->>'submission_status', ''), 'on_time'),
    coalesce((p_payload->>'submitted_late')::boolean, false),
    nullif(p_payload->>'edit_locked_at', '')::timestamptz,
    coalesce((p_payload->>'leads_prev_day')::integer, 0),
    coalesce((p_payload->>'leads_net_prev_day')::integer, 0),
    coalesce((p_payload->>'agd_cart_prev_day')::integer, 0),
    coalesce((p_payload->>'agd_net_prev_day')::integer, 0),
    coalesce((p_payload->>'agd_cart_today')::integer, 0),
    coalesce((p_payload->>'agd_net_today')::integer, 0),
    coalesce((p_payload->>'vnd_porta_prev_day')::integer, 0),
    coalesce((p_payload->>'vnd_cart_prev_day')::integer, 0),
    coalesce((p_payload->>'vnd_net_prev_day')::integer, 0),
    coalesce((p_payload->>'visit_prev_day')::integer, 0),
    nullif(trim(coalesce(p_payload->>'zero_reason', '')), ''),
    nullif(trim(coalesce(p_payload->>'note', '')), ''),
    v_caller_id,
    now()
  )
  ON CONFLICT (seller_user_id, store_id, reference_date, metric_scope)
  DO UPDATE SET
    submitted_at = EXCLUDED.submitted_at,
    submission_status = EXCLUDED.submission_status,
    submitted_late = EXCLUDED.submitted_late,
    edit_locked_at = EXCLUDED.edit_locked_at,
    leads_prev_day = EXCLUDED.leads_prev_day,
    leads_net_prev_day = EXCLUDED.leads_net_prev_day,
    agd_cart_prev_day = EXCLUDED.agd_cart_prev_day,
    agd_net_prev_day = EXCLUDED.agd_net_prev_day,
    agd_cart_today = EXCLUDED.agd_cart_today,
    agd_net_today = EXCLUDED.agd_net_today,
    vnd_porta_prev_day = EXCLUDED.vnd_porta_prev_day,
    vnd_cart_prev_day = EXCLUDED.vnd_cart_prev_day,
    vnd_net_prev_day = EXCLUDED.vnd_net_prev_day,
    visit_prev_day = EXCLUDED.visit_prev_day,
    zero_reason = EXCLUDED.zero_reason,
    note = EXCLUDED.note,
    created_by = EXCLUDED.created_by,
    updated_at = now()
  RETURNING id INTO v_checkin_id;

  RETURN jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object('id', v_checkin_id)
  );
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_checkin(jsonb) TO authenticated;
```

- [ ] **Step 3: Aplicar as migrations no projeto Supabase**

Run: `supabase db push` (ou o método de aplicação já documentado no projeto — ver memória `reference_supabase_mx_performance.md` sobre CLI via keychain, já que MCP não tem permissão neste projeto)
Expected: as duas migrations aplicadas sem erro; `lancamentos_diarios` com as 2 colunas novas.

- [ ] **Step 4: Atualizar `DailyClose.filter` em `base44Client.js`**

Em `src/api/base44Client.js:369-386`, trocar:

```js
        const mapped = (rows || []).map(r => ({
          id: r.id,
          date: r.reference_date || r.date,
          vendedor_id: r.seller_user_id,
          loja_id: r.store_id,
          leads_carteira: r.leads || r.leads_prev_day || 0,
          leads_internet: 0,
```

por:

```js
        const mapped = (rows || []).map(r => ({
          id: r.id,
          date: r.reference_date || r.date,
          vendedor_id: r.seller_user_id,
          loja_id: r.store_id,
          leads_carteira: r.leads || r.leads_prev_day || 0,
          leads_internet: r.leads_net || r.leads_net_prev_day || 0,
```

- [ ] **Step 5: Atualizar `DailyClose.create` em `base44Client.js`**

Em `src/api/base44Client.js:404-425`, trocar:

```js
        const payload = {
          metric_scope: 'daily',
          store_id: storeId,
          seller_user_id: me.id,
          reference_date: data.date,
          date: data.date,
          leads: data.leads_carteira || 0,
          leads_prev_day: data.leads_carteira || 0,
          visit_prev_day: data.atendimentos_showroom || 0,
```

por:

```js
        const payload = {
          metric_scope: 'daily',
          store_id: storeId,
          seller_user_id: me.id,
          reference_date: data.date,
          date: data.date,
          leads: data.leads_carteira || 0,
          leads_prev_day: data.leads_carteira || 0,
          leads_net_prev_day: data.leads_internet || 0,
          visit_prev_day: data.atendimentos_showroom || 0,
```

- [ ] **Step 6: Atualizar `DailyClose.update` em `base44Client.js`**

Em `src/api/base44Client.js:448-459`, trocar:

```js
        return base44.entities.DailyClose.create({
          date: existing.reference_date || existing.date,
          leads_carteira: existing.leads_prev_day ?? existing.leads ?? 0,
          atendimentos_showroom: existing.visit_prev_day ?? existing.visitas ?? 0,
```

por:

```js
        return base44.entities.DailyClose.create({
          date: existing.reference_date || existing.date,
          leads_carteira: existing.leads_prev_day ?? existing.leads ?? 0,
          leads_internet: existing.leads_net_prev_day ?? existing.leads_net ?? 0,
          atendimentos_showroom: existing.visit_prev_day ?? existing.visitas ?? 0,
```

- [ ] **Step 7: Verificar visualmente no browser**

Fechamento Diário → Internet → colocar "Leads recebidos" = 5 → recarregar a página → confirmar que continua 5. Abrir Histórico de Fechamentos → confirmar que o dia mostra leads incluindo o de Internet (a linha `leads = (h.leads_carteira || 0) + (h.leads_internet || 0)` em `FechamentoDiario.jsx:492` já soma os dois — só precisava que `leads_internet` deixasse de ser sempre 0).

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260707120000_add_leads_internet_lancamentos_diarios.sql \
        supabase/migrations/20260707130000_submit_checkin_leads_net.sql \
        src/api/base44Client.js
git commit -m "fix: persiste leads de Internet — coluna nunca existiu no schema

lancamentos_diarios só tinha 'leads' (usado para Carteira). O contador
de Internet nunca teve onde ser salvo: DailyClose.filter hardcodava 0
e DailyClose.create nunca lia o campo. Adiciona leads_net/leads_net_prev_day
e estende submit_checkin para persistir."
```

---

## Task 6: Sino de notificações — badge real e clique funcional

**Contexto:** 2 instâncias do sino são puramente decorativas (`<span>`/`<div>` sem `onClick`, badge `3` hardcoded): `FechamentoDiario.jsx:280-283` (desktop, rota live) e `SellerSidebar.tsx:454-458` (mobile — este já navega para `/notificacoes`, mas o badge continua fixo em `3`). O hook `useNotifications()` (`src/hooks/useNotifications.ts:23-46`) já expõe `unreadCount` real, consultando a tabela `notificacoes` filtrada por `recipient_id`. `CheckinHeader.tsx` (`features/checkin/`) fica fora de escopo — é código morto (ver Global Constraints).

**Files:**
- Modify: `src/base44-reference/pages/FechamentoDiario.jsx`
- Modify: `src/components/SellerSidebar.tsx:454-458`

**Interfaces:**
- Consumes: `useNotifications()` de `src/hooks/useNotifications.ts` → `{ unreadCount: number }`.

- [ ] **Step 1: `FechamentoDiario.jsx` — importar hook e `useNavigate`**

No topo do arquivo (linha 1), trocar:

```jsx
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
```

por:

```jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useNotifications } from "@/hooks/useNotifications";
```

- [ ] **Step 2: `FechamentoDiario.jsx` — usar o hook e tornar o sino clicável**

Dentro de `export default function FechamentoDiario()`, logo após `const { toast } = useToast();` (linha 33), adicionar:

```js
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
```

Trocar o bloco do sino (linhas 279-284):

```jsx
          {/* Sino — apenas desktop */}
          <div className="relative cursor-pointer hidden sm:block">
            <Bell className="w-5 h-5 text-[#64748B]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-black rounded-full flex items-center justify-center">3</span>
          </div>
```

por:

```jsx
          {/* Sino — apenas desktop */}
          <button
            type="button"
            onClick={() => navigate("/notificacoes")}
            aria-label="Abrir notificações"
            className="relative hidden sm:flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-[#64748B]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#EF4444] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
```

- [ ] **Step 3: `SellerSidebar.tsx` — badge real**

Verificar se `useNotifications` já está importado no topo do arquivo; se não, adicionar:

```tsx
import { useNotifications } from '@/hooks/useNotifications'
```

Localizar onde o componente que renderiza o header mobile obtém seus dados (mesmo componente function que contém o JSX da linha 454-458) e adicionar `const { unreadCount } = useNotifications()`.

Trocar (linhas 454-458):

```tsx
          <button type="button" aria-label="Abrir notificações" onClick={() => navigate(notificationsPath)} className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-[#00A896]/45">
            <Bell size={22} aria-hidden="true" />
            <span className="absolute right-1 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-black leading-none text-white">3</span>
          </button>
```

por:

```tsx
          <button type="button" aria-label="Abrir notificações" onClick={() => navigate(notificationsPath)} className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-[#00A896]/45">
            <Bell size={22} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-black leading-none text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
```

- [ ] **Step 4: Verificar visualmente no browser**

Desktop: sino no Fechamento Diário agora clica e vai para `/notificacoes`, badge mostra contagem real (some se 0 não lidas). Mobile: badge do `SellerSidebar` mostra contagem real.

- [ ] **Step 5: Commit**

```bash
git add src/base44-reference/pages/FechamentoDiario.jsx src/components/SellerSidebar.tsx
git commit -m "fix: sino de notificações vira clicável e mostra contagem real

Sino do desktop (Fechamento Diário) não tinha onClick nenhum; o do
mobile já navegava mas o badge era hardcoded '3' nos dois."
```

---

## Task 7: Regularização de Fechamento — sai do localStorage, vira tabela real

**Contexto:** `RegularizacaoFechamento` e `D1AuditLog` (`src/api/base44Client.js:959-979`) são implementados 100% sobre `localStorage` do navegador (`getLocal`/`setLocal`). Um pedido de regularização feito pelo vendedor nunca sai do dispositivo dele — não existe tabela real, então o gerente jamais recebe a solicitação em outra sessão/aparelho. É a causa raiz do "regularização não funciona".

**Escopo desta task:** tornar a submissão do vendedor persistente e visível entre dispositivos/sessões (o que o bug relatado pede). Não existe hoje nenhuma tela de aprovação para o gerente (diferente de `LiberacaoFechamento`, que tem RPCs reais `consultar_liberacao_por_token`/`liberar_fechamento_por_token`) — construir essa tela é fora de escopo deste plano, fica registrado como pendência de regra de negócio.

**Files:**
- Create: `supabase/migrations/20260707140000_regularizacao_fechamento.sql`
- Modify: `src/api/base44Client.js` (`RegularizacaoFechamento`, `D1AuditLog`)

- [ ] **Step 1: Migration — tabelas + RLS**

```sql
-- supabase/migrations/20260707140000_regularizacao_fechamento.sql

CREATE TABLE IF NOT EXISTS public.regularizacao_fechamento (
  id                                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id                                 uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  vendedor_id                             uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  vendedor_nome                           text,
  data_competencia                        date NOT NULL,
  data_hora_envio                         timestamptz NOT NULL DEFAULT now(),
  status_solicitacao                      text NOT NULL DEFAULT 'Pendente'
                                           CHECK (status_solicitacao IN ('Pendente', 'Aprovada', 'Recusada')),
  tipo_solicitacao                        text NOT NULL DEFAULT 'Regularização de Fechamento',
  motivo_recusa                           text,
  contabilizar_no_sistema                 boolean NOT NULL DEFAULT false,
  regularizado_fora_do_prazo              boolean NOT NULL DEFAULT true,
  enviado_para_aprovacao                  boolean NOT NULL DEFAULT true,
  pontuacao_disciplina_calculada          numeric,
  pontuacao_disciplina_com_penalizacao    numeric,
  leads_carteira                          integer NOT NULL DEFAULT 0,
  leads_internet                          integer NOT NULL DEFAULT 0,
  atendimentos_showroom                   integer NOT NULL DEFAULT 0,
  atendimentos_carteira                   integer NOT NULL DEFAULT 0,
  atendimentos_internet                   integer NOT NULL DEFAULT 0,
  agendamentos_carteira                   integer NOT NULL DEFAULT 0,
  agendamentos_internet                   integer NOT NULL DEFAULT 0,
  created_at                              timestamptz NOT NULL DEFAULT now(),
  updated_at                              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendedor_id, data_competencia)
);
COMMENT ON TABLE public.regularizacao_fechamento IS 'Solicitação de vendedor para regularizar fechamento diário enviado fora do prazo. Substitui a versão anterior baseada em localStorage.';

CREATE INDEX IF NOT EXISTS idx_regularizacao_fechamento_loja ON public.regularizacao_fechamento(loja_id, data_competencia);
CREATE INDEX IF NOT EXISTS idx_regularizacao_fechamento_vendedor ON public.regularizacao_fechamento(vendedor_id, data_competencia);

DROP TRIGGER IF EXISTS trg_regularizacao_fechamento_updated_at ON public.regularizacao_fechamento;
CREATE TRIGGER trg_regularizacao_fechamento_updated_at BEFORE UPDATE ON public.regularizacao_fechamento
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

ALTER TABLE public.regularizacao_fechamento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS regularizacao_fechamento_seller_rw ON public.regularizacao_fechamento;
CREATE POLICY regularizacao_fechamento_seller_rw ON public.regularizacao_fechamento FOR ALL TO authenticated
  USING (vendedor_id = auth.uid())
  WITH CHECK (vendedor_id = auth.uid());

DROP POLICY IF EXISTS regularizacao_fechamento_store_manage ON public.regularizacao_fechamento;
CREATE POLICY regularizacao_fechamento_store_manage ON public.regularizacao_fechamento FOR SELECT TO authenticated
  USING (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id) OR public.user_has_role(ARRAY['admin_mx','master','consultant']));

DROP POLICY IF EXISTS regularizacao_fechamento_store_approve ON public.regularizacao_fechamento;
CREATE POLICY regularizacao_fechamento_store_approve ON public.regularizacao_fechamento FOR UPDATE TO authenticated
  USING (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id) OR public.user_has_role(ARRAY['admin_mx','master','consultant']))
  WITH CHECK (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id) OR public.user_has_role(ARRAY['admin_mx','master','consultant']));

CREATE TABLE IF NOT EXISTS public.d1_audit_log (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id            uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  usuario_nome          text,
  fechamento_id         uuid,
  cliente_id            text,
  data_hora_alteracao   timestamptz NOT NULL DEFAULT now(),
  tipo_alteracao        text NOT NULL,
  valor_anterior         text,
  valor_novo             text,
  created_at            timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.d1_audit_log IS 'Trilha de auditoria de ajustes feitos na janela D+1. Substitui a versão anterior baseada em localStorage.';

CREATE INDEX IF NOT EXISTS idx_d1_audit_log_usuario ON public.d1_audit_log(usuario_id, data_hora_alteracao);

ALTER TABLE public.d1_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS d1_audit_log_seller_rw ON public.d1_audit_log;
CREATE POLICY d1_audit_log_seller_rw ON public.d1_audit_log FOR ALL TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());
```

- [ ] **Step 2: Aplicar a migration**

Run: `supabase db push`
Expected: tabelas `regularizacao_fechamento` e `d1_audit_log` criadas, RLS ativa.

- [ ] **Step 3: Reescrever `RegularizacaoFechamento` em `base44Client.js`**

Em `src/api/base44Client.js:959-970`, trocar:

```js
    RegularizacaoFechamento: {
      filter: async (filter) => {
        const items = getLocal('RegularizacaoFechamento');
        return items.filter(r => matchQuery(r, filter));
      },
      create: async (data) => {
        const items = getLocal('RegularizacaoFechamento');
        const newItem = { id: Math.random().toString(36).slice(2), ...data, status_solicitacao: 'Solicitado', created_date: new Date().toISOString() };
        setLocal('RegularizacaoFechamento', [...items, newItem]);
        return newItem;
      }
    },
```

por:

```js
    RegularizacaoFechamento: {
      filter: async (filter) => {
        const me = await base44.auth.me();
        const { data: rows, error } = await supabase
          .from('regularizacao_fechamento')
          .select('*')
          .eq('vendedor_id', me.id);
        if (error) { console.error('Error fetching regularizacoes:', error); return []; }
        return (rows || []).filter(r => matchQuery(r, filter));
      },
      create: async (data) => {
        const me = await base44.auth.me();
        const storeId = await resolveStoreId(supabase, me.id);
        if (!storeId) throw new Error('Você não possui vínculo ativo com nenhuma loja.');

        const { data: created, error } = await supabase
          .from('regularizacao_fechamento')
          .insert({
            loja_id: storeId,
            vendedor_id: me.id,
            vendedor_nome: data.vendedor_nome || me.full_name || '',
            data_competencia: data.data_competencia,
            data_hora_envio: data.data_hora_envio || new Date().toISOString(),
            status_solicitacao: 'Pendente',
            tipo_solicitacao: data.tipo_solicitacao || 'Regularização de Fechamento',
            contabilizar_no_sistema: data.contabilizar_no_sistema ?? false,
            regularizado_fora_do_prazo: data.regularizado_fora_do_prazo ?? true,
            enviado_para_aprovacao: data.enviado_para_aprovacao ?? true,
            pontuacao_disciplina_calculada: data.pontuacao_disciplina_calculada ?? null,
            pontuacao_disciplina_com_penalizacao: data.pontuacao_disciplina_com_penalizacao ?? null,
            leads_carteira: data.leads_carteira || 0,
            leads_internet: data.leads_internet || 0,
            atendimentos_showroom: data.atendimentos_showroom || 0,
            atendimentos_carteira: data.atendimentos_carteira || 0,
            atendimentos_internet: data.atendimentos_internet || 0,
            agendamentos_carteira: data.agendamentos_carteira || 0,
            agendamentos_internet: data.agendamentos_internet || 0,
          })
          .select()
          .single();

        if (error) throw error;
        return created;
      },
      update: async (id, data) => {
        const payload = {};
        ['leads_carteira', 'leads_internet', 'atendimentos_showroom', 'atendimentos_carteira',
         'atendimentos_internet', 'agendamentos_carteira', 'agendamentos_internet',
         'pontuacao_disciplina_calculada', 'pontuacao_disciplina_com_penalizacao',
         'data_hora_envio', 'status_solicitacao', 'motivo_recusa'].forEach(key => {
          if (data[key] !== undefined) payload[key] = data[key];
        });
        // Reenvio após recusa volta para "Pendente"
        if (data.status_solicitacao === undefined) payload.status_solicitacao = 'Pendente';

        const { data: updated, error } = await supabase
          .from('regularizacao_fechamento')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return updated;
      }
    },
```

- [ ] **Step 4: Reescrever `D1AuditLog` em `base44Client.js`**

Em `src/api/base44Client.js:972-979`, trocar:

```js
    D1AuditLog: {
      create: async (data) => {
        const items = getLocal('D1AuditLog');
        const newItem = { id: Math.random().toString(36).slice(2), ...data, created_date: new Date().toISOString() };
        setLocal('D1AuditLog', [...items, newItem]);
        return newItem;
      }
    },
```

por:

```js
    D1AuditLog: {
      create: async (data) => {
        const { data: created, error } = await supabase
          .from('d1_audit_log')
          .insert({
            usuario_id: data.usuario_id,
            usuario_nome: data.usuario_nome || '',
            fechamento_id: data.fechamento_id || null,
            cliente_id: data.cliente_id || '',
            data_hora_alteracao: data.data_hora_alteracao || new Date().toISOString(),
            tipo_alteracao: data.tipo_alteracao,
            valor_anterior: data.valor_anterior || '',
            valor_novo: data.valor_novo || '',
          })
          .select()
          .single();

        if (error) throw error;
        return created;
      }
    },
```

- [ ] **Step 5: Confirmar que `getLocal`/`setLocal` continuam usadas por outras entidades**

`AtividadeExecucao`/`ExecutionOpportunity`/`ActionPlan`/`EventoComercial` no bloco `getLocal` (linhas 71-157) são apenas *seed de fallback* para as versões antigas dessas entidades — as versões reais já usadas em produção (linhas 648+, 765+, 1392+) não chamam `getLocal`. Não remover `getLocal`/`setLocal` do arquivo (ainda podem ser referenciadas por código legado fora do escopo deste plano) — apenas confirmar, via `grep`, que nada mais depende do branch `RegularizacaoFechamento`/`D1AuditLog` de `getLocal`:

Run: `grep -n "getLocal('RegularizacaoFechamento')\|getLocal('D1AuditLog')" "src/api/base44Client.js"`
Expected: nenhum resultado (as duas entidades já foram reescritas nos Steps 3-4).

- [ ] **Step 6: Verificar visualmente no browser (2 sessões diferentes)**

Vendedor A envia uma regularização de um dia atrasado (`RegularizarFechamentoDrawer`). Abrir o mesmo usuário em uma aba anônima/outro navegador → `base44.entities.RegularizacaoFechamento.filter({ data_competencia: date })` deve retornar o registro (antes, ficava preso ao `localStorage` da primeira aba).

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260707140000_regularizacao_fechamento.sql src/api/base44Client.js
git commit -m "fix: Regularização de Fechamento sai do localStorage, vira tabela real

Pedido do vendedor nunca saía do navegador dele — sem tabela no banco,
o gerente jamais recebia a solicitação em outra sessão/dispositivo.
D1AuditLog tinha o mesmo problema, corrigido junto."
```

---

## Task 8: Roteiro de teste manual (todas as correções)

**Contexto:** Não há ambiente de staging automatizado para estes fluxos (dependem de horário do dia — janela de 09:45 — e de dados reais de `vinculos_loja`). Este roteiro documenta a verificação manual esperada, na ordem das tasks.

- [ ] **Showroom/Carteira/Internet (Task 4):** antes das 09:45, incrementar/decrementar cada contador, recarregar a página, confirmar persistência. Depois das 09:45 (ou usando um usuário sem vínculo de loja), confirmar que aparece toast de erro em vez de reset silencioso.
- [ ] **Internet → Leads recebidos (Task 5):** setar valor, recarregar, confirmar que não volta a 0. Conferir no Histórico de Fechamentos que o total de leads do dia inclui o valor de Internet.
- [ ] **Nova Atividade (Tasks 2 e 3):** criar atividade com telefone de cliente já cadastrado (autopreenche) e com telefone não cadastrado + nome manual. Confirmar que ambas aparecem na Central de Execução e que nenhuma lança erro genérico.
- [ ] **Venda/Agendamento/Garantia via Fechamento (Task 2):** criar cada tipo pelo `NovoRegistroModal.jsx` (botão "Novo Registro" no Fechamento Diário). Confirmar que a atividade auxiliar (`AtividadeExecucao`) aparece na Central de Execução — antes, falhava silenciosamente.
- [ ] **Sino (Task 6):** clicar no sino do desktop (Fechamento Diário) e do mobile (menu lateral) — ambos devem navegar para `/notificacoes` e mostrar contagem real (não mais "3" fixo).
- [ ] **Regularização (Task 7):** enviar regularização de um dia atrasado em uma sessão, confirmar visibilidade em outra sessão/dispositivo do mesmo vendedor.
- [ ] **Regressão geral:** `bun run lint`, `bun test`, navegar pelas telas de Fechamento, Carteira, Central de Execução e Notificações sem erros no console.

---

## Achados que NÃO viraram task (verificados, sem bug encontrado)

- **Cadastro de Venda/Agendamento/Qualificado "não salva" (itens 3.4-3.6 do relatório original):** o caminho principal (`CarteiraCliente.create`, chamado por `buscarOuCriarCliente` em `NovoRegistroModal.jsx`) já resolve `loja_id` corretamente via `vinculos_loja` e já funcionava. O que de fato falhava era só o registro auxiliar em `AtividadeExecucao` (corrigido na Task 2) — por isso o cliente/venda ficava salvo, mas a atividade correspondente sumia da Central de Execução, dando a impressão de que "não salvou".
- **Histórico de Fechamento "não mostra lançamentos" (item 3.9):** `loadHistory()` em `FechamentoDiario.jsx` já consulta dados reais. O sintoma some por si só depois das Tasks 4 e 5 (contadores que falhavam silenciosamente e leads de Internet que nunca persistiam).
- **Mentor Comercial exibindo cliente de outra empresa (item 3.11):** RLS auditada em `supabase/migrations/20260609120000_mx_crm_vendedor_foundation.sql:178-212` — `clientes_seller_rw`/`clientes_store_read` corretas, sem vazamento entre tenants encontrado. O efeito relatado é mais provavelmente o mesmo `loja_id = null` da Task 2 (registros ficavam invisíveis para o gerente, não visíveis para outra empresa).
- **Nova atividade redireciona para tela errada (item 3.8, parte 2):** não encontrado nenhum `navigate`/redirecionamento em `NovaAtividadeModal.jsx` — `handleClose()` só fecha o modal. Sem reprodução, não há o que corrigir; se acontecer de novo, anexar passo a passo.

## Fora de escopo (registrado, não implementado)

- **"Finalizar o Dia" não parece concluir (item 3.9, parte "finalizar")**: este plano não rastreou o botão de finalização em `BottomSection.jsx` (prop `onDailyCloseUpdate`, chamado por `FechamentoDiario.jsx:353-369`) — não foi lido a fundo. Se o sintoma persistir depois das Tasks 4-5, abrir investigação específica nesse componente.
- **`src/features/checkin/*`** (inclui `NovoRegistroModal.tsx`, `CheckinHeader.tsx`, `CheckinForm.tsx`, `useCheckins`): árvore inteira sem rota em `App.tsx`, não afeta usuários reais. Vale uma decisão de produto separada — é migração incompleta abandonada, ou WIP para um cutover futuro? Recomendo perguntar antes de excluir (tem 6+ arquivos de teste, sugere esforço investido).
- **Tela de aprovação de Regularização para o gerente:** a Task 7 torna a solicitação do vendedor persistente e visível via query, mas não existe hoje nenhuma UI para o gerente aprovar/recusar (diferente do fluxo de `LiberacaoFechamento`, que tem RPCs com token). Necessário definir regra de negócio (quem aprova, prazo, notificação).
- **Padronização de erro (`AppErrorResponse`) em todo o sistema:** não há evidência de que seja necessário — o modal canônico já expõe erro real por campo. Se novos bugs de "erro genérico" aparecerem fora dos pontos corrigidos aqui, vale revisitar.
- **Filtro de data "parece fixo" (item 3.13 do relatório original):** não localizado nenhum `DatePicker`/filtro hardcoded nas telas auditadas (`closingDate` é sempre calculado dinamicamente a partir do horário de Brasília). Sem reprodução concreta, não há o que corrigir — se o usuário reproduzir de novo, anexar print/passo a passo.
