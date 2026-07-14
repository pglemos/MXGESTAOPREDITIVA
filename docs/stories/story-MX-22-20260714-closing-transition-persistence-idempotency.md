# Story MX-22.2 - Transição D-1→D0, Persistência e Idempotência

## Status

InProgress

## Epic Reference

- **Épico:** EPIC-MX-22 — Fechamento Diário do Vendedor (Data Operacional, D-1→D0, Histórico & Regularização)
- **Arquivo:** `docs/stories/epics/epic-mx-22-fechamento-diario-vendedor-2026-07-14.md`
- **Fonte:** "Revisão Funcional Definitiva — Fechamento Diário do Vendedor" v2.0 (14/07/2026) — `docs/prd/spec-fechamento-diario-vendedor-v2-2026-07-14.md`, seções §6 (Transição após finalizar D-1), §12 (Persistência e integridade), §14 FEV-DATA-05/06/07/08/09.
- **Story anterior:** `docs/stories/story-MX-22-20260714-active-closing-context.md` (22.1, **Done**) — entrega a camada pura `ActiveClosingContext`/`getActiveClosingContext`, a regra de horário 12:00 e os cards de contexto. Esta story **não reabre** esse escopo; consome-o como dado de entrada.

## Story

**As a** Vendedor,
**I want** que a transição de D-1 para D0 aconteça de fato no banco e na tela assim que eu finalizar o fechamento anterior — sem duplicar registros, sem apagar D-1, sem perder o que já digitei em D0 se eu atualizar a página —,
**so that** eu confie que meu fechamento foi realmente salvo, uma única vez, e que a tela sempre reflita o estado real de cada data sem precisar recarregar manualmente.

## Executor Assignment

executor: "dev"
quality_gate: "architect"
quality_gate_tools: ["npm run typecheck", "npm run lint", "npm test -- src/features/checkin src/hooks/checkins src/lib/definitive-daily-closing-migration.test.ts"]

## ⚠️ Achado de Exploração (REUSE > ADAPT > CREATE — ler antes de implementar)

Ao contrário do que o pedido de trabalho presumia, **a maior parte da persistência/idempotência do spec §12 já existe e está em produção**. Esta story é **ADAPT + CREATE pontual**, não uma reconstrução de índice/idempotência do zero. Ordem de leitura recomendada antes de codar: `submit_checkin` (RPC) → `useCheckinsSubmit.ts` → `useCheckinPage.ts` (efeitos de `previousCheckin`/`historicalCheckin`) → `CheckinForm.tsx` (botão "Salvar rascunho").

### O que JÁ existe (REUSE/ADAPT — não recriar)

1. **Índice único (§12.1) já existe desde 03/05/2026**, muito antes da migration nova. `supabase/migrations/20260503020000_admin_master_e2e_hardening.sql` (linhas 105-118) já dropa índices legados divergentes e cria `lancamentos_diarios_seller_store_reference_scope_key UNIQUE (seller_user_id, store_id, reference_date, metric_scope)` — com `EXCEPTION WHEN duplicate_object THEN NULL` (idempotente na própria migration). Essa migration é antiga o suficiente para estar aplicada em produção (ao contrário da `20260714150000`, que a auditoria de 22.1 já confirmou **não aplicada**). A migration nova (`20260714150000_definitive_daily_closing_window.sql`, linhas 65-80) apenas **reconfirma** a mesma constraint com um `DO $do$ ... IF NOT EXISTS` — redundante, mas inofensivo (não cria um segundo índice). **Não criar uma terceira migration de índice único**: se a constraint já existir (caso mais provável), qualquer `ADD CONSTRAINT` sem guarda de existência falha; a `20260714150000` já tem a guarda certa. Ação real desta story: confirmar/aplicar a migration pendente (coordenar com quem aplica no Supabase; esta story de @sm não aplica infra), não recriar o índice.
2. **Idempotência da finalização (§12.3, FEV-DATA-08) já é resolvida no servidor por upsert atômico.** `submit_checkin` (`supabase/migrations/20260710120000_harden_submit_checkin_operational_date.sql`, linhas ~168-233) faz `INSERT ... ON CONFLICT (seller_user_id, store_id, reference_date, metric_scope) DO UPDATE ... WHERE EXCLUDED.metric_scope <> 'daily' OR NOT (lancamentos_diarios já finalizado)`. Isso significa: (a) duplo clique/retry gera **um único registro** por vendedor+loja+data+escopo — não duplica linha; (b) se a linha já está finalizada (tem `submitted_at`, não é rascunho, e tem alguma métrica > 0 ou `zero_reason`), o `WHERE` bloqueia o `DO UPDATE` e a função retorna erro `"Fechamento já concluído para esta data..."` em vez de sobrescrever silenciosamente. Isso já cobre a proibição central do §12.3 ("não duplicar fechamento", "não criar dois registros para a mesma data"). **Não recriar essa lógica em uma nova função ou no client.**
3. **Guarda de reentrância no cliente já existe.** `useCheckinPage.ts` `submitCheckin()` (linha 632) começa com `if (saving) return`, e o botão de finalizar usa esse estado — duplo clique físico não dispara duas chamadas RPC concorrentes na maioria dos casos (mitiga, não substitui, a garantia de servidor do item 2).
4. **Separação D-1/D0 (§12.2) já é estrutural.** Cada `reference_date` é uma linha distinta em `lancamentos_diarios`; não há campo "status global". `todayClosing`/`yesterdayClosing` em `useCheckinPage.ts` (linhas 212-229) já buscam registros por data separadamente.
5. **D0 inexistente = estado zerado (FEV-DATA-06) e D0 concluído = bloqueado (FEV-DATA-07) já funcionam.** Sem `historicalCheckin`, o formulário usa `createEmptyCheckinForm()` (linha 287); com `activeClosingContext.isMainDateSubmitted = true`, `fechamentoConcluido` (linha 543) bloqueia `submitCheckin()` com toast de erro (linha 633-638) e `canEditMainForm=false` trava os campos via `ActiveClosingContext` (22.1).
6. **Proibição de zerar D-1 (§6) já é satisfeita por construção**, não por uma trava explícita: `submit_checkin` só faz `INSERT/UPDATE` na linha cuja chave é `(seller, store, reference_date, scope)` do payload enviado — salvar D0 nunca toca a linha de D-1, porque `reference_date` é diferente. Não existe nenhum caminho de código que zere `reference_date - 1` ao salvar `reference_date`. Esta story deve **documentar isso com um teste de regressão explícito**, não reimplementar a trava.

### Gaps REAIS identificados (o que esta story precisa fechar — CREATE/ADAPT pontual)

**GAP 1 — Invalidação de estado pós-transição não é confiável em tela (§6 passo "invalidar queries D-1/D0" + "recalcular contexto").**
`previousCheckin` (o registro de D-1) em `useCheckinPage.ts` é buscado uma única vez por um `useEffect` cujas dependências são `[yesterdaySP, fetchCheckinByDate]` (linhas 199-210) — ou seja, só refaz o fetch quando a data de "ontem" muda (virada de dia) ou quando `fetchCheckinByDate` é recriado (praticamente nunca, deps `[profile, storeId]`). O `afterSubmit` da submissão (`useCheckins.ts` linha 68-70) só chama `fetchTodayCheckin()` + `fetchCheckins()` — nenhum dos dois atualiza `previousCheckin`. Como `yesterdayClosing = previousCheckin ?? ...` (linha 221, `??` só cai para o fallback se `previousCheckin` for `null`/`undefined`), **depois que o vendedor finaliza D-1, o objeto em `previousCheckin` continua sendo a versão pré-finalização (sem `submitted_at`/com `submission_status` "draft" ou ausente)**. `isSubmittedClosing(yesterdayClosing)` (usado por `getActiveClosingContext`) continua retornando `false`, então `mainDate` **não** troca imediatamente para D0 como o AC-02/FEV-DATA-02 exige — a troca só acontece de fato depois de um reload completo da página (novo mount do hook) ou da virada real do dia. Isso é uma regressão silenciosa: os testes unitários de 22.1 cobrem a função pura `resolveActiveClosingContext`/`getActiveClosingContext` isoladamente (com fixtures corretas), não o fluxo integrado de invalidação em `useCheckinPage`.
**Correção esperada:** expor e chamar uma função de refetch específica para o par D-1/D0 (`previousCheckin` + `todayClosing`) dentro do `afterSubmit`/callback pós-`submitCheckin`, de forma que a troca de `mainDate` aconteça no mesmo ciclo de render após a resposta do servidor — sem exigir F5.

**GAP 2 — "Salvar rascunho" não persiste nada que sobrevive a um refresh real (FEV-DATA-05).**
O botão "Salvar rascunho" (`CheckinForm.tsx` linha ~895, oculto visualmente mas presente por contrato de teste) chama `handleSaveDraft()` (`useCheckinPage.ts` linhas 740-771), que grava em `window.localStorage` sob a chave `mx-checkin-draft:{selectedDate}:{metricScope}` — **e nada no repositório lê essa chave de volta** (confirmado por busca; `CHECKIN_DRAFT_STORAGE_PREFIX` só aparece na escrita). Ou seja: campos digitados manualmente (`leads_cart`, `leads_net`, `vnd_*`, `zero_reason`, `note`, etc.) que ainda não foram finalizados **não sobrevivem a um F5** — ao recarregar, `historicalCheckin` vem vazio (nenhuma linha em `lancamentos_diarios` foi criada, pois só `submitCheckin`/`saveTechnicalAdjustment` chamam a RPC) e o formulário volta para `createEmptyCheckinForm()`. Só sobrevivem ao refresh os valores que já vêm de fontes server-side agregadas em tempo real — `crmDailyCounters`/`effectiveForm` (oportunidades/agendamentos já salvos no CRM) — porque são recalculados a cada carga, não porque há um rascunho salvo. Isso viola literalmente FEV-DATA-05 ("refresh mantém D0; progresso real é carregado; dados não somem") para o subconjunto de campos que só existem como digitação manual do formulário.
**Correção esperada:** substituir (ou complementar) o "Salvar rascunho" local por uma persistência real — a rota mais barata é reaproveitar a própria RPC/tabela: `submit_checkin` e o trigger `normalize_daily_closing_window` já têm tratamento explícito para `submission_status = 'draft'` (`normalize_daily_closing_window`, linha 29: `IF coalesce(NEW.submission_status, 'draft') <> 'draft' THEN ...` — ou seja, o schema já foi desenhado prevendo linhas rascunho que não passam pela normalização de prazo/penalidade). Hoje, porém, `buildSubmitCheckinPayload` (`useCheckinsSubmit.ts` linhas 58-60) só produz `submission_status: 'on_time' | 'late'`, nunca `'draft'` — o caminho de rascunho no banco nunca é exercitado pelo client atual. Esta story deve fechar esse elo: permitir salvar um rascunho real (scope `daily`, status `draft`, sem `submitted_at` "oficial" e sem contar como finalização) e garantir que `fetchCheckinByDate`/`historicalCheckin` o carreguem de volta ao reabrir a tela — sem que esse rascunho seja tratado como fechamento pelo `WHERE` de idempotência do item 2 (que hoje só bloqueia sobrescrita quando a linha já não é rascunho — o rascunho pode e deve ser sobrescrito livremente até a finalização real).

**GAP 3 — Sequência de 12 passos do §6 não existe como unidade testável.**
Hoje a transição "finalizar D-1 → salvar → marcar finalizado → persistir submitted_at → invalidar D-1/D0 → limpar estado local → recalcular contexto → trocar mainDate → carregar rascunho D0 → mostrar 0% se não existe → card de sucesso → liberar campos D0" é um efeito emergente de vários `useState`/`useEffect` reagindo de forma assíncrona e desacoplada (ver GAP 1) — não há um ponto único onde a ordem é garantida e testável isoladamente. Isso torna o comportamento frágil a mudanças futuras (ex.: qualquer novo `useEffect` competindo pelas mesmas dependências pode reintroduzir GAP 1 silenciosamente).
**Correção esperada:** não é necessário reescrever a arquitetura de hooks, mas a correção do GAP 1 deve ser estruturada de forma que a sequência seja verificável por teste de integração (ex.: teste de hook com `@testing-library/react-hooks`/render de `useCheckinPage` mockando Supabase, simulando finalizar D-1 e asserindo que, no próximo render, `mainDate === todaySP` sem exigir remount).

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in core-config.yaml

## Acceptance Criteria

Todo AC abaixo mapeia a um AC do epic (`docs/stories/epics/epic-mx-22-fechamento-diario-vendedor-2026-07-14.md` §3) e ao(s) FEV-DATA do spec v2.0 citados na missão. ACs marcados **(ADAPT/regressão)** cobrem comportamento que já existe e só precisa de teste de guarda; ACs marcados **(CREATE)** cobrem os gaps reais.

1. **(CREATE) Given** o vendedor finaliza D-1 antes das 12:00 (SP) com sucesso, **when** a resposta da RPC `submit_checkin` retorna `ok: true`, **then**, no mesmo ciclo (sem F5, sem navegação), o `previousCheckin`/`todayClosing` usados por `getActiveClosingContext` são invalidados e recarregados, e `activeClosingContext.mainDate` passa a ser `todaySP` — reproduzindo de fato o FEV-DATA-02/AC-02 do epic em nível de integração (hoje só validado na função pura por 22.1). *(Epic AC-02, AC-07; Spec §6 passos "invalidar queries"/"recalcular contexto"/"trocar mainDate"; FEV-DATA-02)*
2. **(CREATE) Given** o vendedor digita valores no formulário de D0 (campos manuais, ex. `leads_cart`, `vnd_porta`, `zero_reason`) sem finalizar, **when** a página é recarregada (F5) antes da finalização, **then** os valores digitados são recuperados (via persistência real — rascunho no banco com `submission_status = 'draft'` ou mecanismo equivalente auditável — não apenas os totais derivados do CRM), sem herdar nada de D-1. *(Epic AC-05, AC-06; Spec §3.3, §12.2; FEV-DATA-05)*
3. **(ADAPT/regressão) Given** D0 sem nenhum registro em `lancamentos_diarios` para `seller_user_id + store_id + reference_date + 'daily'`, **when** a tela carrega, **then** progresso = 0%, formulário = `createEmptyCheckinForm()`, `canEditMainForm = true`, sem nenhum campo herdado de D-1 — comportamento já existente; este AC apenas exige um teste de regressão explícito (hoje implícito). *(Epic AC-05; Spec §3.4; FEV-DATA-06)*
4. **(ADAPT/regressão) Given** D0 já concluído (`isMainDateSubmitted = true`), **when** o vendedor tenta submeter novamente ou editar campos, **then** `submitCheckin()` é bloqueado com a mensagem "Fechamento já concluído para esta data..." e `canEditMainForm = false` trava os campos, sem abrir D+1 antecipadamente — comportamento já existente (`fechamentoConcluido`, linha 543/633); este AC exige teste de regressão explícito cobrindo o guard client-side E o `WHERE` de servidor (não apenas um dos dois). *(Epic AC-05; Spec §3.5; FEV-DATA-07)*
5. **(ADAPT/regressão) Given** duplo clique em "Finalizar", perda de rede com retry do mesmo payload, ou reenvio do mesmo `submit_checkin` com o mesmo `(seller_user_id, store_id, reference_date, metric_scope)`, **when** as chamadas concorrentes/repetidas chegam ao servidor, **then** existe **um único** registro final para essa chave (garantido pelo `ON CONFLICT ... DO UPDATE ... WHERE` já existente), nenhuma duplicidade de linha, e uma segunda tentativa após finalização real retorna erro em vez de sobrescrever. Este AC exige teste de regressão (incluindo teste unitário do guard client `if (saving) return` e um teste que documente/valide a semântica do `WHERE` da RPC) — não uma nova implementação de idempotência. *(Epic AC-09; Spec §12.3; FEV-DATA-08)*
6. **(ADAPT/regressão, não duplicar 22.1) Given** o `submit_checkin`/trigger `normalize_daily_closing_window` calculam `reference_date`/prazo/atraso, **when** a submissão ocorre perto da virada de meia-noite ou perto do corte de 12:00 em `America/Sao_Paulo`, **then** o cálculo usa fuso SP (via `timezone('America/Sao_Paulo', now())` no servidor e `Intl.DateTimeFormat` no client), nunca UTC nem data local do dispositivo — 22.1 já cobre a camada de contexto pura; este AC cobre especificamente que a correção dos GAP 1/GAP 2 desta story **não introduz** nenhum novo cálculo de data/hora fora desse padrão (ex.: nenhum `new Date().getHours()`/`Date.now()` cru no código novo de invalidação/rascunho). *(Epic AC-10; Spec §2.1-§2.3; FEV-DATA-09 — não duplicar)*
7. **(CREATE) Given** o índice único `(seller_user_id, store_id, reference_date, metric_scope)` já existente desde `20260503020000_admin_master_e2e_hardening.sql`, **when** a migration nova `20260714150000_definitive_daily_closing_window.sql` é avaliada para aplicação em produção, **then** o time de infra/dados confirma que ela é segura para aplicar (idempotente, não duplica constraint) e a story documenta esse status — sem propor uma terceira migration equivalente. *(Epic AC-08; Spec §12.1)*
8. **(CREATE) Given** D0 é salvo (rascunho ou finalização) para `reference_date = hoje`, **when** o registro de D-1 (`reference_date = ontem`) é consultado antes e depois dessa gravação, **then** o registro de D-1 permanece byte-a-byte inalterado (mesmo `id`, mesmos valores, mesmo `submitted_at`) — teste de regressão explícito para a "Proibição" do spec §6 ("D-1 não é zerado no banco ao trocar pra D0"). *(Epic AC-07; Spec §6 Proibição)*

## Scope

**IN:** invalidação/recarregamento do par D-1/D0 em `useCheckinPage.ts` logo após finalização bem-sucedida (GAP 1); persistência real de rascunho de D0 que sobrevive a refresh, usando o suporte de `submission_status = 'draft'` já previsto no trigger (GAP 2); testes de regressão para idempotência de servidor (`ON CONFLICT ... DO UPDATE ... WHERE`), bloqueio de D0 concluído, estado zerado de D0 inexistente, e a proibição de zerar D-1 ao salvar D0; confirmação documentada do status da migration `20260714150000` (já em `main`, ainda não aplicada) frente ao índice único pré-existente.

**OUT (fica para outras stories):** Histórico/Regularização completo — diff, nova versão, remoção do campo "Observações Operacionais" (22.3); formulários de Garantia/Qualificado (22.4); integração com Módulo Gerencial/penalização/contabilização (22.5); estados de interface adicionais do §13 não citados nos ACs acima e janela de snapshot D+1 09:31 (22.6); qualquer reabertura da camada `ActiveClosingContext`/regra de horário 12:00/textos dos cards (22.1, Done — não duplicar); aplicação em si da migration pendente no Supabase real (ação de infra/dados, não desta story de @sm).

## Dependencies

- **Bloqueado por:** Story 22.1 (`ActiveClosingContext` + regra D-1/D0 + hierarquia visual — **Done**, fundação consumida aqui).
- **Bloqueia:** Story 22.3 (Histórico/Regularização depende de rascunho/idempotência confiáveis desta story), Story 22.6 (estados de interface de "finalizando"/"troca automática"/"retomada após refresh" dependem da invalidação corrigida aqui).
- **Coordenação externa:** aplicação da migration `20260714150000_definitive_daily_closing_window.sql` no Supabase real — ação de infraestrutura fora do escopo de @sm/@dev desta story; a story apenas documenta e valida que é segura.

## Complexity

**M** (5 pts) — a maior parte da integridade de dados já existe e está testada indiretamente; o esforço real está concentrado em: (a) fechar a lacuna de invalidação de estado pós-transição (GAP 1, risco de regressão silenciosa do AC-02 de 22.1), (b) decidir e implementar o mecanismo real de rascunho de D0 (GAP 2, toca RPC/payload/trigger já existentes), (c) escrever os testes de regressão que hoje não existem para comportamento já implementado (idempotência de servidor, proibição de zerar D-1).

## Business Value

Sem estes ajustes, o vendedor pode finalizar D-1 e continuar vendo a tela de D-1 até recarregar manualmente (confusão operacional direta), e pode perder dados digitados em D0 ao atualizar a página por engano — os dois problemas que o épico foi criado para eliminar. Fechar os dois garante que a "transição imediata" e a "persistência confiável" prometidas no Goal do épico sejam reais na tela, não só na função pura.

## Risks

- **GAP 1 é uma regressão silenciosa não coberta pelos testes de 22.1** — os 9+ cenários de `active-closing-context.test.ts` testam a função pura com fixtures corretas, não o fluxo de invalidação real do hook. Mitigação: os testes desta story devem ser de integração do hook (`useCheckinPage`), não apenas mais casos da função pura.
- **Mecanismo de rascunho (GAP 2) tem duas rotas possíveis** — (a) reaproveitar `submit_checkin` com `submission_status: 'draft'` (reusa infra existente, mas exige garantir que rascunho nunca dispare `submitted_late`/penalidade/liberação) ou (b) criar uma tabela/coluna de rascunho separada (mais isolado, mais trabalho, risco de duplicar a chave única do §12.1 com uma segunda estrutura). **[AUTO-DECISION]** Recomendar a rota (a) — reason: o trigger `normalize_daily_closing_window` já tem o branch `coalesce(NEW.submission_status, 'draft') <> 'draft'` pronto para ignorar linhas rascunho na normalização de prazo, então a rota (a) é a que já tem suporte de schema; @architect deve confirmar antes da implementação, pois altera o contrato do payload de `buildSubmitCheckinPayload`.
- **Migration pendente em produção** — `20260714150000` ainda não aplicada; se algum teste desta story assumir que a constraint só existe após essa migration, o teste mentiria sobre o estado real (a constraint já existe desde maio). Mitigação: AC-7 exige documentar isso explicitamente, não testar contra uma constraint "nova" que na verdade é antiga.

## Definition of Done

- [ ] `useCheckinPage.ts` invalida/recarrega `previousCheckin` e `todayClosing` (ou equivalente) imediatamente após `submitCheckin()` bem-sucedido, sem exigir F5 (fecha GAP 1).
- [ ] Existe um mecanismo real de persistência de rascunho de D0 que sobrevive a refresh para campos digitados manualmente (fecha GAP 2), sem afetar a semântica de idempotência/finalização já existente.
- [ ] Testes de regressão cobrindo: idempotência de servidor (duplo clique/retry), D0 concluído bloqueado, D0 inexistente zerado, proibição de zerar D-1 ao salvar D0.
- [ ] Nenhuma regressão nos testes existentes de `active-closing-context.test.ts`, `useCheckinsSubmit.test.ts`, `definitive-daily-closing-migration.test.ts`.
- [ ] `npm run typecheck`, `npm run lint` e `npm test -- src/features/checkin src/hooks/checkins src/lib/definitive-daily-closing-migration.test.ts` verdes.
- [ ] Dev Notes atualizadas com a decisão final sobre o mecanismo de rascunho (rota a/b) e o status de aplicação da migration `20260714150000`.

## Tasks / Subtasks

- [ ] **Task 1 — Fechar GAP 1: invalidação pós-transição (AC: 1)**
  - [ ] Ler `useCheckinPage.ts` linhas 196-247 (fetch de `previousCheckin`, cálculo de `activeClosingContext`) e `useCheckins.ts`/`useCheckinsSubmit.ts` (fluxo de `afterSubmit`).
  - [ ] Expor uma forma de refetch do par D-1/D0 (ex.: extrair o efeito de `previousCheckin` para uma função callable, ou adicionar ao `afterSubmit` um refetch explícito de `yesterdaySP`) chamada logo após `submitCheckin()` retornar sucesso.
  - [ ] Escrever teste de integração do hook (mock de Supabase) que finaliza D-1 antes de 12:00 e assere que, no próximo render (sem remount), `activeClosingContext.mainDate === todaySP`.
- [ ] **Task 2 — Fechar GAP 2: rascunho real de D0 (AC: 2)**
  - [ ] Confirmar com @architect a rota (a) `submission_status: 'draft'` via `submit_checkin` vs. rota (b) estrutura separada (ver Risks).
  - [ ] Se rota (a): estender `buildSubmitCheckinPayload`/`useCheckinsSubmit.saveCheckin` para aceitar um modo "rascunho" (sem marcar como finalizado, sem `submitted_late`/penalidade), e trocar `handleSaveDraft()` (hoje só localStorage) para persistir via essa rota, mantendo compatibilidade com o contrato de teste do botão oculto em `CheckinForm.tsx`.
  - [ ] Garantir que `fetchCheckinByDate`/`historicalCheckin` carreguem o rascunho de volta ao reabrir a tela, e que o rascunho não dispare o `WHERE` de bloqueio de idempotência (deve ser sobrescrevível até a finalização real).
  - [ ] Teste: digitar campos, "salvar rascunho", simular reload (novo mount do hook com o mesmo mock de banco), assere que os campos voltam preenchidos.
- [ ] **Task 3 — Regressões de idempotência e bloqueio (AC: 4, 5)**
  - [ ] Teste unitário/documentação do `WHERE` de `submit_checkin` (via teste do arquivo de migration, seguindo o padrão de `definitive-daily-closing-migration.test.ts`) confirmando que reenvio da mesma chave após finalização retorna erro em vez de sobrescrever.
  - [ ] Teste de `submitCheckin()` client-side confirmando o guard `if (saving) return` e o bloqueio via `fechamentoConcluido`.
- [ ] **Task 4 — Regressão da proibição de zerar D-1 (AC: 8)**
  - [ ] Teste que salva D0 (rascunho ou finalização) e assere que o registro de D-1 pré-existente permanece inalterado (mesmo objeto/valores) antes/depois.
- [ ] **Task 5 — Confirmar estado zerado/bloqueado de D0 (AC: 3, 4)**
  - [ ] Testes de regressão explícitos para `createEmptyCheckinForm()` quando `historicalCheckin` é nulo e para o bloqueio de edição quando `isMainDateSubmitted`.
- [ ] **Task 6 — Regressão de fuso sem duplicar 22.1 (AC: 6)**
  - [ ] Revisar o código novo das Tasks 1-2 e confirmar (grep) que nenhum `new Date().getHours()`/cálculo de data local cru foi introduzido; usar apenas os helpers `getSaoPauloMinutes`/`getSPDateOnly`/`timezone('America/Sao_Paulo', now())` já existentes.
- [ ] **Task 7 — Documentar status da migration pendente (AC: 7)**
  - [ ] Confirmar (via `supabase migration list` ou equivalente, coordenando com quem tem acesso) se `20260714150000_definitive_daily_closing_window.sql` já foi aplicada; documentar o resultado nesta story (Dev Notes), sem aplicá-la nesta story se isso for responsabilidade de outro agente/processo.
- [ ] **Task 8 — Regressão e gates**
  - [ ] `npm run typecheck`
  - [ ] `npm run lint`
  - [ ] `npm test -- src/features/checkin src/hooks/checkins src/lib/definitive-daily-closing-migration.test.ts`

## Dev Notes

### Arquivos reais a tocar (achados por exploração, não hipotéticos)

- `src/features/checkin/hooks/useCheckinPage.ts` — efeito de `previousCheckin` (linhas 199-210, GAP 1), `activeClosingContext` (linhas 231-237), `handleSaveDraft` (linhas 740-771, GAP 2), `submitCheckin` (linhas 631-733).
- `src/hooks/useCheckins.ts` — composição do `afterSubmit` (linhas 68-70) que hoje só chama `fetchTodayCheckin()` + `fetchCheckins()`; ponto natural para adicionar invalidação de D-1 também, ou para expor um callback adicional que `useCheckinPage` possa acoplar.
- `src/hooks/checkins/useCheckinsSubmit.ts` — `buildSubmitCheckinPayload` (linhas 37-88) e `saveCheckin` (linhas 97-125); ponto de extensão para suportar `submission_status: 'draft'` se a rota (a) do GAP 2 for aprovada.
- `src/hooks/checkins/useCheckinsByDate.ts` — `fetchCheckinByDate` já busca por `(seller, store, date, scope)`; deve continuar funcionando sem alteração para carregar o rascunho de volta (rota a).
- `supabase/migrations/20260710120000_harden_submit_checkin_operational_date.sql` — `submit_checkin` RPC, `ON CONFLICT ... DO UPDATE ... WHERE` (idempotência já existente, linhas ~215-232).
- `supabase/migrations/20260714150000_definitive_daily_closing_window.sql` — trigger `normalize_daily_closing_window`, branch `submission_status <> 'draft'` (linha 29) que já prevê rascunhos; **em `main`, ainda não aplicada no Supabase real** (confirmado pela QA de 22.1).
- `supabase/migrations/20260503020000_admin_master_e2e_hardening.sql` — constraint única já existente (linhas 105-118), predecessora da reconfirmação feita pela migration nova.
- `src/features/checkin/sections/CheckinForm.tsx` (linha ~891-898) — botão oculto "Salvar rascunho" (contrato de teste existente); qualquer mudança de comportamento do rascunho deve preservar esse contrato ou atualizá-lo deliberadamente.
- `src/lib/definitive-daily-closing-migration.test.ts` — padrão de teste baseado em regex sobre o SQL da migration (sem banco real); seguir esse padrão para os novos testes de regressão de idempotência/proibição se não houver harness de banco disponível.

### Regra de negócio (extraída literalmente do spec, sem invenção)

> "Atualização atômica (§12.3): Finalização precisa ser idempotente. Repetir clique, refresh ou retorno de rede não pode: duplicar venda; duplicar fechamento; duplicar eventos; criar dois registros para a mesma data; apagar D0; reabrir D-1 incorretamente." — Spec §12.3, já satisfeito no servidor pelo `ON CONFLICT ... DO UPDATE ... WHERE` de `submit_checkin`.

> "Proibição (§6): D-1 não é zerado no banco, apenas a representação do formulário ao mudar para D0." — Spec §6, já satisfeito estruturalmente (chaves diferentes por `reference_date`); esta story só adiciona o teste de regressão que documenta essa garantia.

### Fuso horário

Padrão já estabelecido por 22.1 e pelo servidor: `Intl.DateTimeFormat('en-US'/'en-CA', { timeZone: 'America/Sao_Paulo', ... })` no client, `timezone('America/Sao_Paulo', now())` no servidor. Nenhum código novo desta story deve introduzir `new Date().getHours()`, `Date.now()` cru para decisões de data operacional, ou comparação com a data local do dispositivo.

### Testing

- Framework: `bun:test` (ver `active-closing-context.test.ts`, `useCheckinsSubmit.test.ts`, `definitive-daily-closing-migration.test.ts`).
- Comando: `npm test -- src/features/checkin src/hooks/checkins src/lib/definitive-daily-closing-migration.test.ts`.
- Para a migration (Task 3/4), seguir o padrão já usado em `definitive-daily-closing-migration.test.ts` (asserções via regex sobre o texto SQL) se não houver harness de Postgres real disponível no CI deste projeto (memória do time indica que checks de pgTAP/Supabase Preview falham por ausência de secrets, não por código — não depender deles para os testes desta story).
- Para GAP 1 (Task 1), o teste precisa exercitar o hook de fato (não só a função pura `getActiveClosingContext`), mockando `@/lib/supabase` para simular a resposta de `submit_checkin` e a consulta subsequente de `previousCheckin`/`todayClosing` — este é o teste que hoje **não existe** e que teria pego a regressão.

## Change Log

| Date | Version | Description | Author |
|------|---------|--------------|--------|
| 2026-07-14 | 1.0 | Story criada a partir do EPIC-MX-22, com exploração real do código: índice único e idempotência de servidor já existentes (REUSE), gap real de invalidação de estado pós-transição (GAP 1) e ausência de persistência real de rascunho de D0 (GAP 2) documentados como CREATE. Migration `20260714150000` (em main, não aplicada) mapeada como redundante-porém-inofensiva sobre a constraint já existente desde `20260503020000`. | @sm (River) |
| 2026-07-14 | 1.0.1 | Validated GO (9/10) — Status: Draft → Ready. 10-point checklist aprovado; todas as claims técnicas (constraint 20260503:117-118, ON CONFLICT 20260710:219-220, trigger draft 20260714150000:29, previousCheckin/handleSaveDraft/CHECKIN_DRAFT write-only) verificadas contra o código real. ACs cobrem os 2 gaps reais sem reinventar constraint/ON CONFLICT; Proibição §6 é AC-8 explícito; FEV-DATA-06/07 tratados como regressão-guard, sem reabrir 22.1. | @po (Pax) |

## Dev Agent Record

### Agent Model Used

_A preencher por @dev_

### Debug Log References

_A preencher por @dev_

### Completion Notes List

_A preencher por @dev_

### File List

_A preencher por @dev_

## QA Results

_A preencher por @qa_
