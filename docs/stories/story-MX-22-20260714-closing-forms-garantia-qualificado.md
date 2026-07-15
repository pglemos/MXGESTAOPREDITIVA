# Story MX-22.4 - Formulários — Garantia & Qualificado

## Status

InReview

## Epic Reference

- **Épico:** EPIC-MX-22 — Fechamento Diário do Vendedor (Data Operacional, D-1→D0, Histórico & Regularização)
- **Arquivo:** `docs/stories/epics/epic-mx-22-fechamento-diario-vendedor-2026-07-14.md`
- **Fonte:** "Revisão Funcional Definitiva — Fechamento Diário do Vendedor" v2.0 (14/07/2026), `docs/prd/spec-fechamento-diario-vendedor-v2-2026-07-14.md`, seção §9 (Alterações nos formulários do Fechamento — §9.1 Novo Cliente/Garantia, §9.2 Novo Cliente/Qualificado), §14 FEV-FORM-01/FEV-FORM-02.
- **Stories anteriores:** `docs/stories/story-MX-22-20260714-active-closing-context.md` (22.1, **Done**), `docs/stories/story-MX-22-20260714-closing-transition-persistence-idempotency.md` (22.2, **Done**), `docs/stories/story-MX-22-20260714-closing-history-regularization.md` (22.3, **Done**). Esta story **não reabre** `ActiveClosingContext`, a regra de horário 12:00, a persistência/idempotência de D-1/D0, o Histórico ou a Regularização — consome `selectedDate`/`referenceDate` como dado de entrada (já resolvido por 22.1) sem recalculá-lo.

## Story

**As a** Vendedor,
**I want** que os formulários de Garantia e Qualificado dentro do fluxo "Novo Cliente" usem dados reais e ajuda operacional de verdade (responsável de uma lista oficial de gente que existe, data/hora pré-preenchidas corretamente, catálogo de descrição por motivo, e uma explicação de verdade — não um tooltip nativo do navegador — para cada passo da oportunidade),
**so that** eu não registre um responsável fictício ou inativo, não erre a data de retorno da Garantia, e entenda o efeito real de cada "Passo atual da oportunidade" no Mentor Comercial e nas métricas sem precisar perguntar ao gestor ou adivinhar.

## Executor Assignment

executor: "dev"
quality_gate: "architect"
quality_gate_tools: ["npm run typecheck", "npm run lint", "npm test -- src/features/checkin"]

## ⚠️ Achado de Exploração (REUSE > ADAPT > CREATE — ler antes de implementar)

O pedido de trabalho presumia que os dois formulários (Garantia/Qualificado) ainda precisavam ser construídos do zero. **Isso não é verdade.** O commit `cc338e13` (`feat(checkin): aplicar fechamento diario por data operacional`, já em `main`, aplicado por processo automático sem QA, 2026-07-14 09:15) já alterou `src/features/checkin/sections/NovoRegistroModal.tsx` (78 linhas, +64/-14) e criou `NovoRegistroModal.test.ts` (36 linhas, 4 testes) cobrindo boa parte do §9.1/§9.2. A maior parte do trabalho de conteúdo já foi feita; os gaps reais são pontuais mas um deles é **crítico** (RLS bloqueia o próprio caso de uso).

### 1. Responsável pela Tratativa — lista já trocada de texto livre para combo (REUSE parcial) + GAP CRÍTICO de RLS (CREATE)

`NovoRegistroModal.tsx:369-394` já busca `vinculos_loja` (`.eq('store_id', effectiveStoreId).eq('is_active', true).in('role', ['vendedor','gerente','dono'])`) com join `user:usuarios!user_id(id, name, role, active)`, filtra `user.active !== false` no client e ordena por nome (`localeCompare('pt-BR')`). O catálogo fictício antigo `RESPONSAVEIS_TRATATIVA` (`'Vendedor' | 'Gerente de Vendas' | 'Pós-venda' | ...`) foi removido; não existe mais opção "Outro" nem texto livre (`FormGarantia`, `NovoRegistroModal.tsx:256-264`; validação em `canSaveForm`, linha 339: `Boolean(form.responsavel)`). Isso cobre a letra do requisito.

**GAP CRÍTICO (CREATE — real, verificado no schema, não hipotético):** a RLS de `vinculos_loja_select` (`supabase/migrations/20260430190000_fundacao_portugues_permissoes_evidencias.sql:903-909`) só libera `SELECT` para: área interna MX, a própria linha (`user_id = auth.uid()`), ou `tem_papel_loja(store_id, ARRAY['dono','gerente'])` — e `tem_papel_loja` (`supabase/migrations/20260507143000_yolo_second_pass_rls_hardening.sql:4-20`) avalia o papel do **usuário que está consultando**, não do usuário sendo lido. Um **vendedor comum** que abre este formulário (o único persona real que usa `NovoRegistroModal` — ver `CheckinCrmSection.tsx:1331-1336` e `RegularizarFechamentoDrawer.tsx:252`, ambos fluxo do vendedor) recebe de volta **apenas a própria linha** em `vinculos_loja`, nunca as dos colegas. O mesmo vale para o join em `usuarios`: `usuarios_select` usa `pode_ver_usuario(id)` (`fundacao_portugues_permissoes_evidencias.sql:208-226`), que também só libera ver outro usuário se o chamador for `dono`/`gerente` daquela loja. **Resultado prático hoje: o combo "Responsável pela Tratativa" carrega vazio (ou só com o próprio vendedor) para o persona real do formulário — o requisito "lista de usuários ativos/elegíveis da loja" nunca é satisfeito em produção para um vendedor comum**, apesar do código de UI estar correto.

Este exato problema já tem um precedente documentado e resolvido no repositório para um caso irmão: `supabase/migrations/20260701120000_contar_vendedores_ativos_loja.sql` cria a RPC `contar_vendedores_ativos_loja(p_store_id)`, `SECURITY DEFINER`, com o comentário explícito: *"a RLS de vinculos_loja restringe SELECT a: area interna MX, a propria linha do usuario, ou dono/gerente da loja... Um vendedor comum NAO consegue contar os colegas."* — o mesmíssimo diagnóstico, para outra feature (rateio de meta). O padrão de solução (RPC `SECURITY DEFINER` retornando só o necessário, gated por "chamador precisa ser membro ativo da própria loja", nunca abrindo a tabela crua) é o precedente a seguir aqui — **ADAPT desse padrão, não invenção de mecanismo novo.**

**Nenhum teste hoje cobre esse caminho.** `NovoRegistroModal.test.ts:7-13` só verifica *strings* no código-fonte (`from('vinculos_loja')`, `.eq('is_active', true)`, `.in('role', [...])`, ausência de `RESPONSAVEIS_TRATATIVA`) — não executa a query nem simula RLS. Não existe nenhum teste, unitário ou de migration, que comprove que um vendedor autenticado de fato recebe a lista completa de colegas elegíveis.

### 2. Data para Posicionar o Cliente — já correta (REUSE, sem gap)

`NovoRegistroModal.tsx:398-399`: `hoje = defaultDate || getSaoPauloDateOnly()`; `amanha = addDaysDateOnly(hoje, 1)`. `defaultDate` é passado como `selectedDate` por `CheckinCrmSection.tsx:1335`, que por sua vez vem de `ctx.selectedDate || customReferenceDate || ctx.referenceDate` (`CheckinForm.tsx:167`) — ou seja, o **`mainDate`/`referenceDate` já resolvido pelo `ActiveClosingContext` da Story 22.1** (servidor/regra de negócio, não `new Date()` cru do dispositivo). O fallback local `getSaoPauloDateOnly()` (linha 89-96, `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })`) só roda se `defaultDate` não for passado (não acontece no caminho real de produção; existe por defensividade/testabilidade). `hora_posicionamento` já inicializa em `'09:00'` (`handleSelectTipo`, linha 417) e ambos os campos (`data_posicionamento`, `hora_posicionamento`) permanecem editáveis (`FormField type="date"`/`type="time"`, linhas 254-255). `NovoRegistroModal.test.ts:15-21` já cobre isso via regex de string. **Nenhum gap real aqui** — apenas confirmar com um teste de comportamento (não só string) que reforce a regressão.

### 3. Descrição da Garantia — catálogo já existe (REUSE, sem gap)

`DESCRICOES_GARANTIA_POR_MOTIVO` (linha 53) mapeia cada um dos 6 motivos de `MOTIVOS_GARANTIA` (linha 51) a uma lista de descrições terminando em `'Outro'`; o `<Select>` de descrição (linha 242-250) é `disabled={!form.motivo_garantia}` e é resetado ao trocar de motivo (`onChange` do motivo, linhas 233-237, zera `descricao_garantia`/`descricao_garantia_outro`); ao escolher "Outro" abre `FormField` obrigatório (linha 251-252); `canSaveForm` (linha 338) exige o texto quando `descricao_garantia === 'Outro'`. **Nenhum gap real** — só reforçar regressão.

### 4. Qualificado — conteúdo de ajuda já existe, mecanismo de exibição é o gap real (CREATE pontual)

`SITUACOES_OPORTUNIDADE_AJUDA` (`NovoRegistroModal.tsx:37-44`) já tem, para os 6 status (`Nova, Validação, Construção, Compromisso, Decisão, Recuperação`), um texto único cobrindo literalmente os 8 elementos do §9.2: Significado, Quando usar, Mentor Comercial, Próxima ação, Agendamento, Temperatura/prioridade, Rotina, Métricas. `NovoRegistroModal.test.ts:29-35` já confirma a presença de 4 desses marcadores por regex. **O conteúdo está correto — não precisa ser reescrito.**

**GAP real (CREATE — mecanismo, não conteúdo):** o ícone de ajuda (`NovoRegistroModal.tsx:310-312`) é `<span title={SITUACOES_OPORTUNIDADE_TITLE} className="shrink-0 cursor-help"><HelpCircle .../></span>` — ou seja, usa o **atributo HTML nativo `title`**, que é textualmente a definição de "tooltip genérico": (a) só aparece em `hover`, **inacessível em dispositivos touch** (o público real — vendedor de loja, majoritariamente celular) sem nenhum fallback de toque/clique; (b) não é focável/acionável por teclado de forma confiável entre navegadores; (c) `SITUACOES_OPORTUNIDADE_TITLE` (linha 45-47) concatena **todos os 6 status numa única string gigante** separada por `\n`, exibida de uma vez, em vez de uma explicação legível por status individual. Além disso, o único componente de "ajuda" reutilizável hoje no design system — `src/components/molecules/GlossaryHint.tsx` — **também usa `title` nativo** (linha 12-13: `<abbr title={definition} ...>`), então não existe hoje nenhum componente REUSE-ready que já resolva isso; é necessário criar um mecanismo acionável por clique/toque (ex.: popover/painel inline), sem herdar o padrão `title` do resto do código. Isso é exatamente o requisito explícito do spec: *"Não usar tooltip genérico."* (§9.2, linha 546 do spec-fonte).

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in core-config.yaml

## Acceptance Criteria

Todo AC abaixo mapeia ao Epic AC-14/AC-15 (`docs/stories/epics/epic-mx-22-fechamento-diario-vendedor-2026-07-14.md` §3) e a FEV-FORM-01/FEV-FORM-02 (spec §9, §14). ACs marcados **(CREATE)** cobrem gaps reais; ACs marcados **(ADAPT/regressão)** cobrem comportamento já implementado, apenas com teste reforçado.

1. **(CREATE) Given** um vendedor comum (papel `vendedor`, não `dono`/`gerente`) autenticado e vinculado a uma loja com outros usuários ativos elegíveis, **when** ele abre "Novo Cliente → Garantia" e o combo "Responsável pela Tratativa" carrega, **then** a lista retornada inclui **todos** os usuários ativos com papel elegível (`vendedor`, `gerente`, `dono`) vinculados àquela loja — não apenas a própria linha do vendedor — através de uma function RPC `SECURITY DEFINER` dedicada (seguindo o padrão de `contar_vendedores_ativos_loja`, `supabase/migrations/20260701120000_contar_vendedores_ativos_loja.sql`), pois a RLS atual (`vinculos_loja_select`/`usuarios_select`, `tem_papel_loja`/`pode_ver_usuario`) restringe um vendedor comum a enxergar só a própria linha. A RPC deve exigir que o chamador seja membro ativo da própria loja (defesa em profundidade, mesmo padrão do precedente) e retornar apenas `id`, `name`, `role` — nunca dados sensíveis adicionais. *(Epic AC-14; Spec §9.1 "Responsável pela Tratativa"; §14 FEV-FORM-01)*
2. **(ADAPT/regressão, já implementado) Given** o formulário de Garantia, **when** o combo de Responsável é renderizado, **then** não existe opção "Outro" nem campo de texto livre — a única fonte é a lista de usuários reais retornada pela função de leitura (AC-1), filtrados por `is_active`/`active !== false` — e o catálogo fictício antigo (`RESPONSAVEIS_TRATATIVA`) permanece ausente do código. *(Epic AC-14; Spec §9.1)*
3. **(ADAPT/regressão, já implementado) Given** o formulário de Garantia é aberto para uma `reference_date` (`mainDate` resolvido pelo `ActiveClosingContext` da Story 22.1, recebido via prop `defaultDate`/`selectedDate` — nunca `new Date()` cru do dispositivo), **when** nenhuma data foi alterada manualmente, **then** "Data para Posicionar o Cliente" = `reference_date + 1 dia`, "Hora" = `09:00`, e ambos os campos continuam editáveis pelo vendedor. *(Epic AC-14; Spec §9.1 "Data para Posicionar o Cliente"; §14 FEV-FORM-01)*
4. **(ADAPT/regressão, já implementado) Given** o vendedor seleciona um Motivo de Garantia, **when** o campo Descrição é aberto, **then** somente as descrições do catálogo vinculado àquele motivo (`DESCRICOES_GARANTIA_POR_MOTIVO`) aparecem, a troca de motivo reseta a descrição selecionada, e ao escolher "Outro" um campo de texto é exigido antes de habilitar o salvamento. *(Epic AC-14; Spec §9.1 "Descrição da Garantia"; §14 FEV-FORM-01)*
5. **(CREATE) Given** o vendedor abre "Novo Cliente → Qualificado", **when** ele interage com o ícone de informação ao lado de "Passo atual da oportunidade" por clique/toque (não apenas hover), **then** a ajuda operacional de cada status (significado, quando usar, efeito no Mentor Comercial, próxima ação esperada, se cria agendamento, se altera temperatura/prioridade, se aparece na Rotina, se entra em métricas) fica visível e legível por status individual, em um mecanismo acionável (ex.: popover/painel), funcional em dispositivo touch sem depender de `:hover` — substituindo o atributo HTML `title` nativo usado hoje (`NovoRegistroModal.tsx:310`), que é o "tooltip genérico" que o spec pede para não usar. *(Epic AC-15; Spec §9.2 "Não usar tooltip genérico"; §14 FEV-FORM-02)*
6. **(ADAPT/regressão, conteúdo já existe) Given** a migração do mecanismo de exibição (AC-5), **when** o novo componente renderiza a ajuda, **then** o texto de cada um dos 6 status (`SITUACOES_OPORTUNIDADE_AJUDA`) é preservado literalmente — sem reescrita de conteúdo — e continua cobrindo os 8 elementos exigidos pelo §9.2 para cada status, apresentados de forma legível por status individual, não como um bloco único concatenado de todos os status. *(Epic AC-15; Spec §9.2; §14 FEV-FORM-02)*

## Scope

**IN:** function RPC `SECURITY DEFINER` para listar responsáveis elegíveis de uma loja (novo, resolve o GAP crítico de RLS do AC-1); troca da chamada direta a `vinculos_loja`/`usuarios` em `NovoRegistroModal.tsx` pela nova função de leitura; testes de comportamento (não só string) para o combo de Responsável, cobrindo o caso de um vendedor comum; novo componente/mecanismo de ajuda acionável por clique/toque para "Passo atual da oportunidade" (substitui o `title` nativo), preservando o conteúdo textual já existente por status; testes de regressão reforçados (comportamento, não só string) para Data/Hora de Posicionamento (D+1/09:00) e catálogo Motivo→Descrição, já que ambos já funcionam mas só têm cobertura de string hoje.

**OUT (fica para outras stories):** Histórico/Regularização (22.3, já Done); integração com Módulo Gerencial — contabilização, pendência gerencial, snapshot 09:31 (22.5); estados de interface genéricos do §13 (carregando/salvando/sem conexão — 22.6); qualquer reabertura de `ActiveClosingContext`, regra de horário 12:00, persistência/idempotência de D-1/D0 (22.1/22.2, Done); qualquer alteração aos formulários de Agendamento/Venda (`FormAgendamento`/`FormVenda`) dentro de `NovoRegistroModal.tsx` — fora do escopo do §9, que só cobre Garantia e Qualificado; reescrita do conteúdo textual de `SITUACOES_OPORTUNIDADE_AJUDA` (conteúdo já aprovado pelo spec, só o mecanismo de exibição muda); extração de `getSaoPauloDateOnly` duplicada entre `NovoRegistroModal.tsx` e `src/hooks/checkins/useCheckinsSubmit.ts` para um helper único (observação de qualidade de código registrada em Dev Notes, não bloqueante, fora do escopo desta story salvo instrução explícita de @architect).

## Dependencies

- **Bloqueado por:** Story 22.1 (`ActiveClosingContext`/`selectedDate`/`referenceDate` — **Done**, consumido via prop `defaultDate` sem recálculo).
- **Bloqueia:** nenhuma story subsequente depende estritamente desta para iniciar (22.5/22.6 têm escopos independentes).
- **Coordenação externa:** o AC-1 (RPC `SECURITY DEFINER` para listar responsáveis elegíveis) é uma migration nova — deve ser desenhada/revisada com @data-engineer antes da implementação (Schema/DB/RLS/Migrations é escopo de @data-engineer por delegação de @architect), seguindo estritamente o padrão de defesa em profundidade já estabelecido por `contar_vendedores_ativos_loja` (chamador precisa ser membro ativo da própria loja; a função retorna só o necessário — `id`, `name`, `role` — nunca dados sensíveis adicionais).

## Complexity

**M** (5 pts) — o conteúdo de 3 dos 4 sub-requisitos (Responsável sem fictícios, Data/Hora D+1 09:00, catálogo Motivo→Descrição) já está implementado e só precisa de teste de comportamento reforçado; o esforço real está em: (a) desenhar e aplicar uma migration nova (RPC `SECURITY DEFINER`) para o GAP crítico de RLS do AC-1 — maior risco desta story, pois toca segurança/RLS em produção; (b) trocar a query direta client-side por essa função; (c) construir um novo mecanismo de ajuda acionável por clique/toque para Qualificado, sem componente REUSE-ready disponível hoje (o único candidato, `GlossaryHint`, também usa `title` nativo).

## Business Value

Sem o AC-1, o requisito central do spec para Garantia (§9.1: "lista de opções... usuários ativos da loja... sem opção inválida ou inativa") está tecnicamente implementado no código mas **inoperante em produção para o próprio persona que o usa** — um vendedor comum vê o combo vazio ou só a si mesmo, o que é pior para a experiência do que o campo de texto livre que substituiu (que ao menos permitia digitar um nome). Corrigir isso evita que o vendedor fique travado ou digite informação fora do formulário (ex.: no campo Observação) para contornar um combo quebrado. Para o Qualificado, trocar o `title` nativo por um mecanismo tocável evita que a ajuda operacional — que já existe e é rica — seja invisível para o público real (vendedor no celular), que é justamente quem mais precisa entender o efeito de cada status no Mentor Comercial antes de errar a classificação.

## Risks

- **RPC nova (AC-1) toca segurança/RLS em produção** — precisa de revisão de @data-engineer/@architect antes de aplicar; seguir estritamente o padrão de `contar_vendedores_ativos_loja` (gated por "chamador é membro ativo da própria loja") para não abrir a tabela crua a qualquer usuário autenticado.
- **Nenhum teste de comportamento real hoje para o combo de Responsável** — os 4 testes existentes em `NovoRegistroModal.test.ts` são só regex sobre o código-fonte; não pegam o bug de RLS porque não executam a query real nem simulam permissões. Esta story precisa de um teste que efetivamente prove que um vendedor comum recebe a lista completa (ex.: teste de migration com asserção sobre a função SQL, seguindo o padrão de `checkin-regularization-migration.test.ts`/`definitive-daily-closing-migration.test.ts`).
- **Migração do mecanismo de ajuda (AC-5/AC-6) pode introduzir regressão de conteúdo** — como `SITUACOES_OPORTUNIDADE_TITLE` concatena tudo numa string, ao decompor por status é preciso garantir que nenhum dos 8 elementos por status seja perdido na refatoração; o teste de regressão do AC-6 deve comparar o texto renderizado por status contra `SITUACOES_OPORTUNIDADE_AJUDA`, não reescrever o dicionário.
- **`GlossaryHint` (único componente de ajuda reutilizável hoje) também usa `title` nativo** — não deve ser reaproveitado diretamente para o AC-5 sem alteração, ou o mesmo problema de "tooltip genérico" se repete; se @dev optar por generalizar `GlossaryHint` para suportar um modo clicável, isso é uma decisão de implementação a documentar no Dev Agent Record, não uma nova migration/AC.

## Definition of Done

- [x] RPC `SECURITY DEFINER` nova para listar responsáveis elegíveis de uma loja, revisada com @data-engineer, seguindo o padrão de `contar_vendedores_ativos_loja` (gated por membership ativo).
- [x] `NovoRegistroModal.tsx` consome a nova função em vez da query direta a `vinculos_loja`/`usuarios`.
- [x] Teste de comportamento (não só string) comprovando que um vendedor comum recebe a lista completa de colegas elegíveis (não só a própria linha).
- [x] Novo mecanismo de ajuda acionável por clique/toque para "Passo atual da oportunidade", substituindo o `title` nativo, preservando literalmente o conteúdo de `SITUACOES_OPORTUNIDADE_AJUDA` por status.
- [x] Testes de regressão reforçados (comportamento) para Data/Hora de Posicionamento (D+1/09:00) e catálogo Motivo→Descrição — hoje só cobertos por regex de string.
- [x] Nenhuma migration nova além da RPC do AC-1; nenhuma reabertura de `ActiveClosingContext`, regra de 12:00, persistência/idempotência D-1/D0, Histórico ou Regularização.
- [x] `npm run typecheck`, `npm run lint` e `npm test -- src/features/checkin` verdes.
- [x] Nenhuma regressão nos testes existentes de `NovoRegistroModal.test.ts`, `CheckinCrmSection.test.tsx`.

## Tasks / Subtasks

- [x] **Task 1 — Ler o real antes de codar (AC: n/a — pré-requisito)**
  - [x] Ler `src/features/checkin/sections/NovoRegistroModal.tsx` completo (já lido nesta exploração; reconfirmar antes de editar).
  - [x] Ler `supabase/migrations/20260701120000_contar_vendedores_ativos_loja.sql` completo (padrão de RPC a seguir).
  - [x] Ler `supabase/migrations/20260430190000_fundacao_portugues_permissoes_evidencias.sql` (linhas 208-226 `pode_ver_usuario`, 903-909 `vinculos_loja_select`) e `20260507143000_yolo_second_pass_rls_hardening.sql` (linhas 4-20 `tem_papel_loja`) para confirmar que o GAP crítico do AC-1 continua real antes de implementar.
  - [x] Confirmar com @data-engineer/@architect o desenho exato da RPC (nome, assinatura, colunas retornadas) antes de escrever a migration.
- [x] **Task 2 — Migration: RPC de leitura de responsáveis elegíveis (AC: 1)**
  - [x] Criar `supabase/migrations/{timestamp}_listar_responsaveis_tratativa_loja.sql` com function `SECURITY DEFINER` (nome sugerido: `listar_responsaveis_tratativa_loja(p_store_id uuid)`), retornando `id`, `name`, `role` de usuários ativos com papel elegível (`vendedor`, `gerente`, `dono`) vinculados à loja, gated por "chamador precisa ser membro ativo da própria loja" (mesmo padrão de `contar_vendedores_ativos_loja`).
  - [x] `GRANT EXECUTE` para `authenticated`.
  - [x] Teste de migration (regex sobre o SQL, padrão de `definitive-daily-closing-migration.test.ts`) confirmando `SECURITY DEFINER`, o gate de membership e as colunas retornadas.
- [x] **Task 3 — Trocar a query direta pela nova função (AC: 1, 2)**
  - [x] Substituir a chamada `supabase.from('vinculos_loja').select(...)` em `NovoRegistroModal.tsx` (linhas 377-393) por `supabase.rpc('listar_responsaveis_tratativa_loja', { p_store_id: effectiveStoreId })`.
  - [x] Manter o filtro/ordenação client-side (`localeCompare('pt-BR')`) sobre o resultado da RPC.
  - [x] Confirmar que `RESPONSAVEIS_TRATATIVA` (catálogo fictício) e a opção "Outro" continuam ausentes.
- [x] **Task 4 — Teste de comportamento real para o combo de Responsável (AC: 1, 2)**
  - [x] Criar teste que simule (mock de `supabase.rpc`) um vendedor comum recebendo múltiplos colegas elegíveis (não só a própria linha), confirmando que o componente renderiza todas as opções.
- [x] **Task 5 — Novo mecanismo de ajuda para Qualificado (AC: 5, 6)**
  - [x] Decidir com @architect se o mecanismo é um novo componente (ex.: popover clicável) ou uma generalização de `GlossaryHint` para suportar modo clicável — documentar a decisão no Dev Agent Record.
  - [x] Substituir `<span title={SITUACOES_OPORTUNIDADE_TITLE}>` (`NovoRegistroModal.tsx:310-312`) pelo novo mecanismo, preservando `SITUACOES_OPORTUNIDADE_AJUDA` literalmente, exibindo por status individual (não a string concatenada).
  - [x] Garantir acionamento por clique/toque, funcional sem `:hover` (teste manual ou automatizado de que não depende de mouseenter).
- [x] **Task 6 — Regressão reforçada de Data/Hora e catálogo Motivo→Descrição (AC: 3, 4)**
  - [x] Teste de comportamento (render) confirmando que `data_posicionamento`/`hora_posicionamento` default para D+1/09:00 a partir de `defaultDate`, e que ambos permanecem editáveis.
  - [x] Teste de comportamento (render) confirmando que a troca de Motivo reseta a Descrição e filtra as opções corretamente, e que "Outro" exige texto antes de habilitar salvar.
- [x] **Task 7 — Regressão e gates**
  - [x] `npm run typecheck`
  - [x] `npm run lint`
  - [x] `npm test -- src/features/checkin`

## Dev Notes

### Arquivos reais a tocar (achados por exploração, não hipotéticos)

- `src/features/checkin/sections/NovoRegistroModal.tsx` — `getSaoPauloDateOnly` (89-96), `ResponsavelTratativa` (52), `DESCRICOES_GARANTIA_POR_MOTIVO` (53-58), `SITUACOES_OPORTUNIDADE_AJUDA` (37-44), `SITUACOES_OPORTUNIDADE_TITLE` (45-47), fetch de `vinculos_loja` (369-394, **substituir por RPC**), `FormGarantia` (linhas ~213-267, combo Responsável 256-264, Data/Hora 254-255), ícone de ajuda de Qualificado (310-312, **substituir mecanismo**), `canSaveForm` (326-347). Núcleo desta story.
- `src/features/checkin/sections/NovoRegistroModal.test.ts` — hoje só 4 testes de regex de string; adicionar testes de comportamento (Tasks 4 e 6).
- `supabase/migrations/20260701120000_contar_vendedores_ativos_loja.sql` — padrão de referência para a nova RPC do AC-1 (não modificar este arquivo; criar um novo).
- `supabase/migrations/20260430190000_fundacao_portugues_permissoes_evidencias.sql` — `pode_ver_usuario` (208-226), `usuarios_select` (862-864), `vinculos_loja_select` (903-909). Origem do GAP crítico; não modificar RLS existente, apenas adicionar a RPC nova.
- `supabase/migrations/20260507143000_yolo_second_pass_rls_hardening.sql` — `tem_papel_loja` (4-20). Confirma o mecanismo exato do bloqueio.
- `src/components/molecules/GlossaryHint.tsx` — único componente de ajuda reutilizável hoje; usa `title` nativo (linha 12-13), **não reaproveitar sem alteração** para o AC-5 (mesmo problema se repetiria); avaliar generalização com @architect.
- `src/components/atoms/Tooltip.tsx` — atom de tooltip hover-based existente; **não é solução para o AC-5** (também depende de hover/focus, `whitespace-nowrap`, uma única string) — referência de padrão a *evitar* aqui, não a copiar.
- `src/features/checkin/sections/CheckinCrmSection.tsx` — linha 1331-1336, único ponto que renderiza `NovoRegistroModal` no fluxo principal do vendedor (`defaultDate={selectedDate}`); linha 200 (`selectedDate: '2026-06-16'` fixture de contexto default/teste — não é o valor real de produção, só default do tipo de contexto).
- `src/features/checkin/sections/RegularizarFechamentoDrawer.tsx` — linha 252, segundo ponto que renderiza `CheckinCrmSection`/`NovoRegistroModal` no fluxo de regularização (também vendedor).
- `src/features/checkin/sections/CheckinForm.tsx` — linha 167, origem de `selectedDate` (`ctx.selectedDate || customReferenceDate || ctx.referenceDate`), que é o `mainDate` já resolvido por `ActiveClosingContext` (22.1) — não recalcular aqui.
- `src/features/checkin/lib/crm-derived-totals.ts` — `addDaysDateOnly`, já reaproveitado por `NovoRegistroModal.tsx:14`; não duplicar.

### Nota de qualidade de código (não bloqueante, fora de escopo desta story)

`getSaoPauloDateOnly` está duplicada identicamente em `NovoRegistroModal.tsx:89-96` e `src/hooks/checkins/useCheckinsSubmit.ts:10`. Extrair para um helper único é uma melhoria de DRY válida, mas fora do escopo do §9 — registrado aqui para @architect decidir se vale abrir como item de tech debt separado.

### Fuso horário

Nenhum código novo desta story deve introduzir `new Date().getHours()`/`Date.now()` cru para calcular a data de posicionamento. O caminho real de produção já usa `defaultDate` (= `mainDate`/`referenceDate` de 22.1); o fallback local `getSaoPauloDateOnly()` só existe para uso defensivo/teste isolado do componente e já usa `Intl.DateTimeFormat` com `timeZone: 'America/Sao_Paulo'` (não UTC, não device timezone cru).

### Testing

- Framework: `bun:test` (ver `NovoRegistroModal.test.ts`, `CheckinCrmSection.test.tsx`).
- Comando: `npm test -- src/features/checkin` (cobre os arquivos desta story; não precisa do escopo mais amplo usado por 22.2/22.3 pois não há mudança em `useCheckinAuditor`/`checkin-history-state`).
- Para o teste de migration da RPC nova (Task 2), seguir o padrão de asserção via regex sobre o SQL de `definitive-daily-closing-migration.test.ts`/`checkin-regularization-migration.test.ts` (não há harness de Postgres real no CI — memória do time: checks de pgTAP/Supabase Preview falham por ausência de secrets, não por código).
- Para os testes de comportamento novos (Tasks 4 e 6), preferir testar via render real do componente (padrão que 22.3 adotou para `RegularizarFechamentoDrawer.test.tsx` — "teste de regressão real, não só string-fonte") em vez de apenas expandir os regex existentes em `NovoRegistroModal.test.ts`.

## Change Log

| Date | Version | Description | Author |
|------|---------|--------------|--------|
| 2026-07-15 | 1.0 | Story criada a partir do EPIC-MX-22 e da spec-fonte §9.1/§9.2/§14 FEV-FORM-01/02. Exploração real de código confirmou que o commit `cc338e13` já implementou a maior parte do conteúdo dos dois formulários (Responsável como combo real, Data/Hora D+1 09:00 via `reference_date` de 22.1, catálogo Motivo→Descrição, texto de ajuda operacional completo por status de Qualificado) — REUSE/ADAPT, não CREATE do zero. Dois gaps reais identificados e confirmados no schema: (1) GAP CRÍTICO — a RLS de `vinculos_loja_select`/`usuarios_select` (`tem_papel_loja`/`pode_ver_usuario`) bloqueia um vendedor comum de ver colegas, tornando o combo "Responsável pela Tratativa" inoperante em produção para o próprio persona que o usa; mesmo diagnóstico já documentado e resolvido para outro caso em `contar_vendedores_ativos_loja.sql`, que serve de padrão a seguir; (2) o ícone de ajuda de Qualificado usa o atributo HTML `title` nativo — exatamente o "tooltip genérico" que o spec pede para não usar, inacessível em touch — apesar do conteúdo textual já estar correto e completo. Escopo desta story fechado nesses dois gaps reais (uma migration nova + um novo mecanismo de UI), sem reabrir 22.1/22.2/22.3 nem reescrever conteúdo já aprovado. | @sm (River) |
| 2026-07-15 | 1.1 | Validação `*validate-story-draft` (checklist 10 pontos): **GO 10/10**. Status Draft → Ready. Claims load-bearing verificados na fonte pelo @po: precedente `contar_vendedores_ativos_loja.sql` confirmado (`SECURITY DEFINER`, `SET search_path=public`, gate `EXISTS(self.user_id=auth.uid() AND is_active)`, retorna só o necessário, `GRANT EXECUTE ... authenticated`) — AC-1 é ADAPT fiel desse padrão, não invenção (Art. IV No Invention OK). `GlossaryHint.tsx:13` (`title={definition}`) e atom `Tooltip.tsx` (hover `onMouseEnter`/`onFocus`, `whitespace-nowrap`, string única) confirmados NÃO reuse-ready — story justifica corretamente por que não servem e defere create-vs-generalizar a @architect. `NovoRegistroModal.tsx:310` `title` nativo + `SITUACOES_OPORTUNIDADE_TITLE` concatenado confirmados. Mapeamento AC verificado: Epic AC-14→ACs 1-4, Epic AC-15→ACs 5-6; spec §9.2 linha 546 "Não usar tooltip genérico" confirmada. Story não reabre trabalho correto de `cc338e13` (ACs 2/3/4/6 = ADAPT/regressão, conteúdo preservado literalmente, OUT explícito). RPC do AC-1 aprovada para permanecer NESTA story (é condição habilitadora do requisito central; DDL concreto delegado a @data-engineer via Dependencies/Task 2, sem desenhar SQL na story). Nenhum fix requerido. | @po (Pax) |
| 2026-07-15 | 1.2 | Status: Ready → InProgress → InReview. **AC-1**: nova migration `20260715124852_listar_responsaveis_tratativa_loja.sql` (RPC `SECURITY DEFINER`, mesmo padrão de `contar_vendedores_ativos_loja.sql` — gate de membership ativo, retorna só `id/name/role`); `NovoRegistroModal.tsx` trocou a query direta a `vinculos_loja` (bloqueada por RLS pra vendedor comum) pela RPC; mapeamento extraído pra `responsaveis-tratativa.ts` (função pura testável sem montar o modal inteiro). **AC-5/6**: `title` nativo trocado por `QualificadoStatusHelp` (popover acionado por clique/toque, cada status em bloco próprio, conteúdo de `SITUACOES_OPORTUNIDADE_AJUDA` preservado literalmente). **Decisão de implementação não pré-aprovada pelo @po** (a story deferia create-vs-generalizar a @architect): optei por um componente novo e pequeno local ao arquivo, não por generalizar `Tooltip.tsx`/`GlossaryHint.tsx` — nenhum dos dois suporta hoje "clique + múltiplos blocos", generalizá-los tocaria outros consumidores fora do escopo desta story; registrado aqui para @architect revisar se depois quiser consolidar. **AC-3**: fórmula D+1/09:00 extraída pra `resolveGarantiaPositionDefaults` (antes inline em `handleSelectTipo`) — mesmo resultado, agora testável com comportamento real. Dead code removido como efeito direto da mudança: `SITUACOES_OPORTUNIDADE_TITLE` e `SITUACAO_OPORTUNIDADE_DESCRICAO` (ambos órfãos após a troca do `title`). Testes novos: `listar-responsaveis-tratativa-loja-migration.test.ts`, `responsaveis-tratativa.test.ts` (comportamento — múltiplos colegas sobrevivem, não colapsa self-only), `QualificadoStatusHelp.test.tsx` (render real, clique não hover), `garantia-position-defaults.test.ts`, `FormGarantia.test.tsx` (render real do cascade Motivo→Descrição + "Outro"). `NovoRegistroModal.test.ts` atualizado (query antiga não existe mais). `npx tsc --noEmit` limpo, `npm run lint` 0 erros, `bun test --isolate src/features/checkin src/hooks/checkins src/lib` → 438/438 verdes. | @dev (Dex) |

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 — implementação direta na sessão (sem subagent @dev; 3ª vez consecutiva neste epic que subagent bateu limite de sessão).

### Debug Log References

_Nenhum — YOLO direto, sem checkpoints intermediários registrados._

### Completion Notes List

- AC-1 (RLS/RPC) e AC-5/6 (tooltip) fechados; AC-3 (D+1/09:00) e AC-4 (Motivo→Descrição) ganharam testes de comportamento que faltavam, sem mudar a lógica já correta de `cc338e13`.
- Decisão de UI não pré-validada pelo @po (componente novo vs. generalizar Tooltip/GlossaryHint) registrada acima — @qa/@architect podem revisar.

### File List

- `supabase/migrations/20260715124852_listar_responsaveis_tratativa_loja.sql` (novo) — RPC `SECURITY DEFINER`.
- `src/lib/listar-responsaveis-tratativa-loja-migration.test.ts` (novo).
- `src/features/checkin/lib/responsaveis-tratativa.ts` (novo) — mapeamento puro.
- `src/features/checkin/lib/responsaveis-tratativa.test.ts` (novo).
- `src/features/checkin/lib/garantia-position-defaults.ts` (novo) — fórmula D+1/09:00.
- `src/features/checkin/lib/garantia-position-defaults.test.ts` (novo).
- `src/features/checkin/sections/NovoRegistroModal.tsx` — RPC no lugar da query direta, `QualificadoStatusHelp` no lugar do `title`, `handleSelectTipo` usa `resolveGarantiaPositionDefaults`, dead code removido (`SITUACOES_OPORTUNIDADE_TITLE`, `SITUACAO_OPORTUNIDADE_DESCRICAO`); `FormGarantia`/`FormProps`/`QualificadoStatusHelp` exportados pra teste isolado.
- `src/features/checkin/sections/NovoRegistroModal.test.ts` — 1 teste atualizado (query antiga removida).
- `src/features/checkin/sections/QualificadoStatusHelp.test.tsx` (novo).
- `src/features/checkin/sections/FormGarantia.test.tsx` (novo).

## QA Results

_A preencher por @qa_
