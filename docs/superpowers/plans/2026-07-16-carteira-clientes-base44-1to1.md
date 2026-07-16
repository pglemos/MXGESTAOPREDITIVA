# Carteira de Clientes Base44 1:1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a rota `/carteira-clientes` por uma reprodução visual, responsiva e comportamental 1:1 da rota `/carteira` do Base44, preservando a arquitetura normalizada, RLS, auditoria, idempotência e integrações do MX.

**Architecture:** A interface usará a composição observável do Base44 e os componentes já versionados em `src/components/carteira`, enquanto uma camada adaptadora converterá `clientes`, `oportunidades`, `agendamentos`, `eventos_comerciais`, `cadencia_estado_cliente` e `execution_actions` no contrato visual esperado. Toda mutação multientidade será executada em RPC transacional e idempotente; o Base44 continuará sendo referência de UX e não será usado como banco concorrente.

**Tech Stack:** React 19, TypeScript 5.8, React Router 7, Tailwind CSS 4, Radix UI, Motion, Lucide, Supabase PostgreSQL/RLS/RPC, Bun Test, Testing Library, Playwright, Vite 6 e Vercel.

## Global Constraints

- Branch final e deploy: `main`, conforme aprovação explícita do responsável.
- Rota canônica substituída: `/carteira-clientes`.
- Referência: Base44 app `6a3b2a814401f8c6bf1653df`, rota `/carteira`.
- Paridade obrigatória: estrutura visual, tipografia, espaçamentos, tamanhos, cores, bordas, sombras, ícones, estados vazios, cards, filtros, modais, ficha lateral, transições, animações e comportamento de cada clique.
- Viewports obrigatórios: desktop 1440×900 e 1280×800; tablet 1024×768 e 768×1024; mobile 430×932 e 390×844.
- Tolerância visual máxima: 2 px em dimensões, alinhamentos e espaçamentos; cores devem usar os mesmos valores observáveis do Base44.
- Nenhum botão, ícone, card, filtro, menu ou CTA pode permanecer decorativo.
- Ficha lateral deve abrir sobre a Carteira e sobre o Modo Ataque sem desmontar a fila atual.
- Não importar SDK, autenticação, banco, registros, mocks ou entidades concorrentes do Base44.
- Não copiar a entidade monolítica `CarteiraCliente`; preservar `clientes`, `oportunidades`, `agendamentos`, `eventos_comerciais`, `cadencia_estado_cliente` e `execution_actions`.
- Mudança de etapa deve atualizar a oportunidade ativa; nova oportunidade somente com decisão explícita e chave idempotente.
- Reagendamento deve atualizar o mesmo agendamento quando aplicável.
- Histórico comercial é append-only.
- Toda gravação multientidade deve ocorrer por RPC transacional.
- Desktop, tablet e mobile devem reproduzir os comportamentos responsivos do Base44, não apenas encolher o desktop.
- Não declarar paridade concluída sem testes, build, capturas nos seis viewports e diff visual revisado.

---

## Mapa de arquivos

### Especificação, QA e CI

- Create: `docs/superpowers/specs/2026-07-16-carteira-clientes-base44-1to1-design.md`
- Create: `docs/qa/evidence/carteira-clientes/README.md`
- Create: `src/test/carteira-clientes-base44-parity.playwright.ts`
- Create: `.github/workflows/carteira-clientes-parity-verification.yml`

### Contratos e regras

- Create: `src/features/carteira-clientes/types/carteira.types.ts`
- Create: `src/features/carteira-clientes/lib/carteira-mappers.ts`
- Create: `src/features/carteira-clientes/lib/carteira-state-machine.ts`
- Create: `src/features/carteira-clientes/lib/carteira-mappers.test.ts`
- Create: `src/features/carteira-clientes/lib/carteira-state-machine.test.ts`

### Banco e persistência

- Create: `supabase/migrations/20260716190000_carteira_base44_parity.sql`
- Create: `src/lib/carteira-base44-migration.test.ts`
- Modify: `src/types/database.generated.ts`
- Modify: `src/api/base44Client.js`

### Interface

- Create: `src/features/carteira-clientes/pages/CarteiraClientesBase44Page.tsx`
- Modify: `src/pages/CarteiraClientes.tsx`
- Modify: `src/components/carteira/CarteiraAtivaTab.jsx`
- Modify: `src/components/carteira/PlanoAtaqueTab.jsx`
- Modify: `src/components/carteira/ExecucaoMissao.jsx`
- Modify: `src/components/carteira/ModoAtaque.jsx`
- Modify: `src/components/carteira/FichaClienteSheet.jsx`
- Modify: `src/components/carteira/NovoClienteModal.jsx`
- Modify: `src/components/carteira/WhatsAppRoteiro.jsx`
- Modify: `src/components/carteira/AlterarProximoPasso.jsx`
- Modify: `src/components/carteira/ProximaOportunidadeModal.jsx`
- Modify: `src/components/carteira/RetornoWhatsAppModal.jsx`
- Create: `src/features/carteira-clientes/pages/CarteiraClientesBase44Page.test.tsx`
- Create: `src/features/carteira-clientes/components/carteira-responsive.test.tsx`
- Create: `src/features/carteira-clientes/components/carteira-interactions.test.tsx`

---

### Task 1: Contrato visual e comportamental 1:1

**Files:**
- Create: `docs/superpowers/specs/2026-07-16-carteira-clientes-base44-1to1-design.md`
- Create: `src/features/carteira-clientes/pages/CarteiraClientesBase44Page.test.tsx`

**Interfaces:**
- Produces: matriz de elementos, estados, breakpoints, clique esperado e seletores estáveis `data-testid`.

- [ ] **Step 1: documentar a hierarquia observável**

A especificação deve registrar, com medidas e comportamento:

```md
# Carteira Base44 1:1 Design Specification

## Header e navegação
- container máximo: 1440 px
- fundo: #F8FAFC
- abas: Carteira ativa, Plano de ataque e Execução quando houver missão ativa
- aba ativa: fundo #005BFF, texto branco, raio 12 px
- aba inativa: fundo branco, texto #475569

## Carteira ativa
- busca, filtros e chips removíveis
- agrupamentos Hoje, Amanhã e próximos dias
- card desktop em colunas; card mobile empilhado
- CTAs Executar próximo passo e Abrir ficha

## Overlays
- filtro: drawer lateral direito
- ficha: sheet lateral sobre a página e sobre o Modo Ataque
- modais: foco preso, Escape fecha quando seguro, backdrop fecha apenas quando não há gravação

## Breakpoints
- desktop >= 1280
- tablet 768–1279
- mobile < 768
```

- [ ] **Step 2: escrever teste RED da rota**

```tsx
import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

test('a rota carteira usa a página Base44 adaptada e não o container legado', () => {
  const source = readFileSync('src/pages/CarteiraClientes.tsx', 'utf8')
  expect(source).toContain('CarteiraClientesBase44Page')
  expect(source).not.toContain('CarteiraClientes.container')
})
```

- [ ] **Step 3: executar RED**

Run: `bun test src/features/carteira-clientes/pages/CarteiraClientesBase44Page.test.tsx`
Expected: FAIL porque a rota ainda exporta `CarteiraClientes.container`.

---

### Task 2: Contrato normalizado e mapeamento Base44

**Files:**
- Create: `src/features/carteira-clientes/types/carteira.types.ts`
- Create: `src/features/carteira-clientes/lib/carteira-mappers.ts`
- Create: `src/features/carteira-clientes/lib/carteira-mappers.test.ts`

**Interfaces:**
- Consumes: `Cliente`, `Oportunidade`, `Agendamento`, `EventoComercial`.
- Produces: `CarteiraVisualClient`, `mapMxClientToCarteiraVisual`, `selectActiveOpportunity`, `selectRelevantAppointment`.

- [ ] **Step 1: escrever testes RED**

```ts
import { describe, expect, test } from 'bun:test'
import { mapMxClientToCarteiraVisual, selectActiveOpportunity } from './carteira-mappers'

describe('carteira mappers', () => {
  test('seleciona a oportunidade ativa mais recente e não a primeira linha retornada', () => {
    const result = selectActiveOpportunity([
      { id: 'perdida', etapa: 'perdido', updated_at: '2026-07-16T10:00:00Z' },
      { id: 'ativa', etapa: 'negociacao', updated_at: '2026-07-16T11:00:00Z' },
    ] as never)
    expect(result?.id).toBe('ativa')
  })

  test('converte dados normalizados para o contrato visual sem duplicar oportunidade', () => {
    const result = mapMxClientToCarteiraVisual({
      cliente: { id: 'c1', nome: 'Maria', telefone: '31999999999', status: 'oportunidade' },
      oportunidades: [{ id: 'o1', etapa: 'negociacao', veiculo_interesse: 'Corolla' }],
      agendamentos: [],
    } as never)
    expect(result.id).toBe('c1')
    expect(result.veiculo_interesse).toBe('Corolla')
  })
})
```

- [ ] **Step 2: executar RED**

Run: `bun test src/features/carteira-clientes/lib/carteira-mappers.test.ts`
Expected: FAIL porque os contratos e mapeadores ainda não existem.

- [ ] **Step 3: implementar contratos e mapeadores mínimos**

A implementação deve ordenar oportunidades por estado ativo e `updated_at`, ordenar agendamentos por compromisso aberto e data, normalizar telefone, preservar IDs relacionais e nunca usar `array[0]` sem ordenação explícita.

- [ ] **Step 4: executar GREEN**

Run: `bun test src/features/carteira-clientes/lib/carteira-mappers.test.ts`
Expected: PASS.

---

### Task 3: Máquina de estados comercial

**Files:**
- Create: `src/features/carteira-clientes/lib/carteira-state-machine.ts`
- Create: `src/features/carteira-clientes/lib/carteira-state-machine.test.ts`

**Interfaces:**
- Produces: `resolveCarteiraTransition(resultCode, context)` retornando etapa, situação, temperatura, próximo passo, data, status da cadência e necessidade de agendamento.

- [ ] **Step 1: escrever RED para resultados críticos**

```ts
expect(resolveCarteiraTransition('visit_scheduled', context)).toMatchObject({
  opportunityStage: 'agendamento',
  cadenceStatus: 'ativa',
  requiresAppointment: true,
})
expect(resolveCarteiraTransition('future_opportunity', context)).toMatchObject({
  clientStatus: 'oportunidade',
  cadenceStatus: 'futura',
  requiresReactivationDate: true,
})
expect(resolveCarteiraTransition('do_not_contact', context)).toMatchObject({
  cadenceStatus: 'encerrada',
  doNotContact: true,
})
```

- [ ] **Step 2: implementar o catálogo equivalente PP01–PP17**

O catálogo deve cobrir contato realizado, não atendeu, não respondeu, visita agendada, reagendamento, proposta, financiamento, avanço, oportunidade futura, compra na concorrência, venda perdida, venda realizada, número inválido, encerramento amigável e não contato.

- [ ] **Step 3: executar GREEN**

Run: `bun test src/features/carteira-clientes/lib/carteira-state-machine.test.ts`
Expected: PASS.

---

### Task 4: Persistência transacional, missões e histórico

**Files:**
- Create: `supabase/migrations/20260716190000_carteira_base44_parity.sql`
- Create: `src/lib/carteira-base44-migration.test.ts`
- Modify: `src/types/database.generated.ts`

**Interfaces:**
- Produces: `carteira_missoes`, `carteira_missao_itens`, `carteira_do_not_contact`, RPC `carteira_registrar_resultado`, RPC `carteira_salvar_cliente`, RPC `carteira_reagendar`, RPC `carteira_iniciar_missao`.

- [ ] **Step 1: escrever teste RED do contrato SQL**

```ts
const sql = readFileSync('supabase/migrations/20260716190000_carteira_base44_parity.sql', 'utf8')
for (const token of [
  'CREATE TABLE IF NOT EXISTS public.carteira_missoes',
  'CREATE TABLE IF NOT EXISTS public.carteira_missao_itens',
  'CREATE OR REPLACE FUNCTION public.carteira_registrar_resultado',
  'CREATE OR REPLACE FUNCTION public.carteira_salvar_cliente',
  'idempotency_key',
]) expect(sql).toContain(token)
expect(sql).not.toContain('CREATE TABLE public.CarteiraCliente')
```

- [ ] **Step 2: criar migration aditiva**

As RPCs devem usar `SECURITY DEFINER`, `SET search_path`, validar usuário/loja, bloquear oportunidade e agendamento com `FOR UPDATE`, aplicar chave idempotente, gravar `eventos_comerciais` e executar rollback integral em erro.

- [ ] **Step 3: aplicar migration e regenerar tipos**

Run: `bun test src/lib/carteira-base44-migration.test.ts`
Apply: `Supabase.apply_migration(project_id='fbhcmzzgwjdgkctlfvbo', name='carteira_base44_parity', query=<SQL>)`.
Run: `npm run gen:db-types`.

---

### Task 5: Adaptador Supabase para os componentes Base44

**Files:**
- Modify: `src/api/base44Client.js`

**Interfaces:**
- `CarteiraCliente.filter` usa mapeadores normalizados.
- `CarteiraCliente.create/update` chamam RPCs transacionais.
- `CarteiraHistorico.filter/create` usa `eventos_comerciais` append-only.
- `CarteiraMissao.filter/create/update` usa tabelas persistentes.

- [ ] **Step 1: substituir seleção não determinística**

Remover padrões `r.oportunidades?.[0]` e `r.agendamentos?.[0]`; usar ordenação explícita e oportunidade ativa.

- [ ] **Step 2: substituir gravações separadas**

`CarteiraCliente.create` e `update` devem chamar RPC e retornar a ficha hidratada. Não podem executar `insert clientes`, depois `insert oportunidades`, depois `insert agendamentos` em chamadas independentes.

- [ ] **Step 3: implementar histórico e missão persistentes**

Toda ação deve produzir evento com `cliente_id`, `oportunidade_id`, `agendamento_id`, `origem_modulo`, situação anterior, situação nova, resultado e observação.

- [ ] **Step 4: executar testes**

Run: `bun test src/features/carteira-clientes src/lib/carteira-base44-migration.test.ts`
Expected: PASS.

---

### Task 6: Substituição direta da rota e composição 1:1

**Files:**
- Create: `src/features/carteira-clientes/pages/CarteiraClientesBase44Page.tsx`
- Modify: `src/pages/CarteiraClientes.tsx`

**Interfaces:**
- Produces página com abas Carteira ativa, Plano de ataque e Execução; todos os overlays permanecem montados conforme o Base44.

- [ ] **Step 1: implementar página adaptada**

A página deve reproduzir a composição de `src/base44-reference/pages/CarteiraClientes.jsx`, usar `src/components/carteira/*`, manter detecção de retorno do WhatsApp, fluxo contínuo, Modo Ataque, ficha sobreposta, execução de missão e estado de carregamento.

- [ ] **Step 2: substituir a exportação da rota**

```ts
export { CarteiraClientesBase44Page as default } from '@/features/carteira-clientes/pages/CarteiraClientesBase44Page'
```

- [ ] **Step 3: executar teste da rota**

Run: `bun test src/features/carteira-clientes/pages/CarteiraClientesBase44Page.test.tsx`
Expected: PASS.

---

### Task 7: Paridade visual responsiva

**Files:**
- Modify: `src/components/carteira/CarteiraAtivaTab.jsx`
- Modify: `src/components/carteira/PlanoAtaqueTab.jsx`
- Modify: `src/components/carteira/ExecucaoMissao.jsx`
- Create: `src/features/carteira-clientes/components/carteira-responsive.test.tsx`

**Interfaces:**
- Produces composição 1:1 nos seis viewports obrigatórios.

- [ ] **Step 1: escrever testes RED de classes e regiões**

Os testes devem validar presença de busca, botão de filtros, chips, cabeçalhos de grupo, card desktop, card mobile, abas, estado vazio, contadores e CTAs.

- [ ] **Step 2: reproduzir valores do Base44**

Aplicar exatamente tipografia, alturas, larguras, gaps, paddings, raios, cores, bordas, sombras, ícones e estados hover/focus/pressed/disabled/loading. No mobile, cards devem empilhar situação, recomendação e CTAs; no tablet, preservar legibilidade sem overflow horizontal.

- [ ] **Step 3: executar testes**

Run: `bun test src/features/carteira-clientes/components/carteira-responsive.test.tsx`
Expected: PASS.

---

### Task 8: Modais, filtros, ficha lateral e Modo Ataque

**Files:**
- Modify: `src/components/carteira/ModoAtaque.jsx`
- Modify: `src/components/carteira/FichaClienteSheet.jsx`
- Modify: `src/components/carteira/NovoClienteModal.jsx`
- Modify: `src/components/carteira/WhatsAppRoteiro.jsx`
- Modify: `src/components/carteira/AlterarProximoPasso.jsx`
- Modify: `src/components/carteira/ProximaOportunidadeModal.jsx`
- Modify: `src/components/carteira/RetornoWhatsAppModal.jsx`
- Create: `src/features/carteira-clientes/components/carteira-interactions.test.tsx`

**Interfaces:**
- Produces comportamento de cada clique e overlay.

- [ ] **Step 1: testar ficha sem desmontar Modo Ataque**

```tsx
fireEvent.click(screen.getByRole('button', { name: /ficha/i }))
expect(screen.getByTestId('modo-ataque')).toBeInTheDocument()
expect(screen.getByTestId('ficha-cliente-sheet')).toBeInTheDocument()
```

- [ ] **Step 2: implementar timeline real**

A ficha deve exibir dados, oportunidade ativa, compromisso, observações e eventos cronológicos com data, usuário, resultado, estado anterior e novo estado.

- [ ] **Step 3: implementar estados dos overlays**

Todos os overlays devem possuir backdrop, foco preso, Escape, loading, erro, sucesso, bloqueio durante gravação, animação de entrada/saída e comportamento responsivo equivalente ao Base44.

- [ ] **Step 4: testar cada CTA**

Cobrir busca, filtro, limpar, aplicar, remover chip, executar, abrir ficha, ligar, WhatsApp, alterar tom, copiar, registrar resultado, pular, avançar, voltar, iniciar missão, pausar, retomar, concluir, novo cliente, salvar, reagendar e encerrar.

---

### Task 9: Playwright, evidências e acessibilidade

**Files:**
- Create: `src/test/carteira-clientes-base44-parity.playwright.ts`
- Create: `docs/qa/evidence/carteira-clientes/README.md`
- Create: `.github/workflows/carteira-clientes-parity-verification.yml`

**Interfaces:**
- Produces capturas e relatório por viewport.

- [ ] **Step 1: criar cenários Playwright**

Cenários: estado carregando, vazio, carteira preenchida, filtros, ficha, novo cliente, WhatsApp, próximo passo, Modo Ataque, missão ativa e retorno do WhatsApp.

- [ ] **Step 2: capturar seis viewports**

Salvar screenshots com nomes determinísticos e sem mascarar overflow, clipping, foco ou modais.

- [ ] **Step 3: validar acessibilidade**

Todos os ícones acionáveis devem ter nome acessível, foco visível e área mínima de toque de 44 px no mobile.

---

### Task 10: Verificação, main, Supabase e produção Vercel

**Files:**
- Modify only files aprovados nas tarefas anteriores.

- [ ] **Step 1: executar suíte completa**

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e -- src/test/carteira-clientes-base44-parity.playwright.ts
```

Expected: todos os comandos com código 0.

- [ ] **Step 2: consultar Supabase**

Confirmar migrations aplicadas, funções presentes, índices idempotentes, RLS e ausência de duplicidades introduzidas.

- [ ] **Step 3: revisar diff contra a especificação**

Revisar os seis viewports, todos os overlays e cada clique. Nenhuma diferença acima de 2 px ou comportamento ausente pode permanecer sem registro e correção.

- [ ] **Step 4: atualizar `main` e publicar**

Somente após verificação completa, atualizar `main`, aguardar checks do GitHub e promover deployment do projeto `mxperformance` na Vercel.

- [ ] **Step 5: smoke test de produção**

Validar login, `/carteira-clientes`, filtros, ficha, Modo Ataque, missão, criação/edição, próximo passo, reagendamento, WhatsApp, timeline e sincronização com Central e Fechamento.
