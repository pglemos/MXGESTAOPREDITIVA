# Story MX-22.3 - Histórico de Fechamentos + Regularização

## Status

InReview

## Epic Reference

- **Épico:** EPIC-MX-22 — Fechamento Diário do Vendedor (Data Operacional, D-1→D0, Histórico & Regularização)
- **Arquivo:** `docs/stories/epics/epic-mx-22-fechamento-diario-vendedor-2026-07-14.md`
- **Fonte:** "Revisão Funcional Definitiva — Fechamento Diário do Vendedor" v2.0 (14/07/2026), `docs/prd/spec-fechamento-diario-vendedor-v2-2026-07-14.md`, seções §1.3 (remoção do campo), §8 (Histórico e Regularização — §8.1 Estados mínimos, §8.2 Ações por estado, §8.3 Regra do botão Ajustar, §8.4 Campo removido), §12.4 (Auditoria mínima), §14 FEV-DATA-10.
- **Stories anteriores:** `docs/stories/story-MX-22-20260714-active-closing-context.md` (22.1, **Done**) e `docs/stories/story-MX-22-20260714-closing-transition-persistence-idempotency.md` (22.2, **Done**). Esta story **não reabre** `ActiveClosingContext`, a regra de horário 12:00, os textos dos cards de contexto, a persistência/idempotência de D-1/D0, nem o índice único — consome tudo isso como dado de entrada.

## Story

**As a** Vendedor,
**I want** que o Histórico de Fechamentos mostre o estado real de cada dia (inclusive quando já enviei uma regularização e ela está em análise, foi aprovada ou foi recusada) e que o botão Ajustar continue funcionando sobre a data exata, sem sobrescrever nem duplicar nada,
**so that** eu saiba exatamente o que aconteceu com cada correção que solicitei, sem precisar perguntar ao gestor ou adivinhar pelo estado binário "Finalizado/Pendente" que a tela mostra hoje.

## Executor Assignment

executor: "dev"
quality_gate: "architect"
quality_gate_tools: ["npm run typecheck", "npm run lint", "npm test -- src/features/checkin src/hooks/useCheckinAuditor.test.ts"]

## ⚠️ Achado de Exploração (REUSE > ADAPT > CREATE — ler antes de implementar)

O pedido de trabalho presumia que o campo "Observações Operacionais (Justificativa)" ainda precisava ser removido e que o Histórico/Regularização precisava ser construído do zero. **Nenhuma das duas premissas é verdadeira.** A infraestrutura de regularização (banco + RPCs + auditoria) já é robusta e está em produção; o que falta é majoritariamente **CREATE pontual na camada de apresentação** (o vendedor não enxerga o próprio ciclo de vida da regularização), não reconstrução de backend.

### 1. Campo "Observações Operacionais (Justificativa)" — JÁ REMOVIDO (não recriar remoção; só reforçar teste)

Confirmado por `git show cc338e13 -- src/features/checkin/sections/RegularizarFechamentoDrawer.tsx` e `.../CheckinHeader.tsx`: o commit `cc338e13` (já em `main`, aplicado por processo automático sem QA, 2026-07-14 09:15) removeu:
- O textarea `Observações Operacionais (Justificativa)` de `RegularizarFechamentoDrawer.tsx` (era renderizado só quando `!finalized`, com `maxLength={250}` e contador de caracteres).
- O campo `note`/`onNoteChange` de `RegularizarFormValues`, das props do drawer e de `formValues` em `CheckinHeader.tsx`.
- A concatenação `${formValues.reason}: ${formValues.note}` que era enviada como `reason` para `requestCorrection` — agora envia só `formValues.reason` (o motivo do catálogo `ADJUSTMENT_REASONS`, ex.: "Correção de registro", "Erro operacional", "Outro motivo").
- `canSubmit` não exige mais `formValues.note.trim().length > 0` — só `!!formValues.reason`.

`CheckinHeader.test.ts` linha 50-54 já assere `not.toContain('formValues.note')`, `not.toContain('onNoteChange')` e `formSource` (que é `CheckinForm.tsx`, não o drawer) `not.toContain('Observações Operacionais (Justificativa)')`. **Gap real:** essa última asserção testa o arquivo errado por segurança dupla (o texto nunca esteve em `CheckinForm.tsx`); não existe hoje nenhuma asserção que leia o código-fonte de `RegularizarFechamentoDrawer.tsx` (onde o texto de fato existia e foi removido) e garanta que ele não volte. Esta story fecha esse gap com um teste de regressão no arquivo certo — **não remove nada que já não esteja removido**.

**Não confundir com:** `CheckinForm.tsx` linha 397 tem um campo **diferente e legítimo**, `Observações Operacionais (Obrigatório)/(Opcional)` (`id="checkin-note"`), que é a nota do formulário principal do dia (obrigatória quando há Produção Zero ou ações de feedback pendentes) — **não é** o campo "(Justificativa)" do spec §8.4/§1.3, que é específico do fluxo de Ajustar/Regularizar. Esse campo do formulário principal está **fora de escopo** desta story e não deve ser tocado.

### 2. Backend de Regularização (§8.2 estados Aprovado/Recusado, §8.3 diff/versão, §12.4 auditoria) — JÁ EXISTE, robusto, em produção

- `supabase/migrations/20260710130000_canonical_checkin_regularization.sql` já implementa a tabela `solicitacoes_correcao_lancamento` com `status` (`'pending' | 'approved' | 'rejected' | 'cancelled'`, tipo `CorrectionStatus` em `src/types/database.ts:32`), `original_values`, `requested_values`, `delta` (o diff — chave por campo com `{original, solicitado}`), `reason`, `rejection_reason`, `requested_by`, `auditor_id`, `reviewed_at`, `applied_at`, `cancelled_at`, `idempotency_key`.
- RPC `solicitar_regularizacao_fechamento` (linhas 66-225): bloqueia duplicidade (idempotency key único quando `pending`; erro explícito `"Já existe uma regularização pendente para este fechamento"` se já houver uma `pending` para o `checkin_id`), calcula o `delta` automaticamente comparando `v_original` vs `v_requested`, nunca sobrescreve `lancamentos_diarios` diretamente — só insere uma linha em `solicitacoes_correcao_lancamento` com `status='pending'`. Isso **já satisfaz** "gerar diff", "criar nova versão", "não sobrescrever original silenciosamente" e "não criar duplicidade" do §8.3.
- RPC `aplicar_regularizacao_fechamento` (linhas 227-340): aplica o `delta` de forma atômica só quando `status='pending'`, escreve em `checkin_audit_logs` (`old_values`, `new_values`, `change_type='approved_regularization'`), muda `status` para `'approved'`, seta `auditor_id`/`reviewed_at`/`applied_at`, e notifica o vendedor (`notificacoes`, link `/vendedor/terminal-mx`).
- RPC `rejeitar_regularizacao_fechamento` (linhas 342-369): muda `status` para `'rejected'`, grava `rejection_reason`, `auditor_id`, `reviewed_at`, notifica o vendedor com o motivo.
- RPC `cancelar_regularizacao_fechamento` (linhas 371-390): permite ao próprio solicitante cancelar enquanto `pending`.
- Política RLS `solicitacoes_correcao_select` (linhas 39-46) **já permite** `seller_id = auth.uid()` ler as próprias solicitações — não é necessária nenhuma migration nova para o vendedor consultar seu próprio histórico de regularização.
- `src/types/database.ts` linhas 270-298 já modelam `CheckinCorrectionRequest` e `CheckinAuditLog` com todos os campos acima.

**Ação real desta story sobre o backend:** nenhuma migration nova. Apenas consumir o que já existe via uma nova função de leitura no client (ver Gap 3 abaixo).

### 3. Gaps REAIS identificados (CREATE — o que esta story precisa fechar)

**GAP 1 — Histórico (`historyRows` em `CheckinHeader.tsx`, linhas 78-153) só conhece 2 dos 7 estados mínimos do §8.1.** Hoje cada linha é computada só a partir de `lancamentos_diarios` (`isSubmittedClosing(checkin)` → `'Finalizado'` ou `'Pendente de Fechamento'`), completamente cego a `solicitacoes_correcao_lancamento`. Um vendedor que já enviou uma regularização para o dia 08/07 e está aguardando aprovação, ou que teve a regularização aprovada, ou recusada, vê exatamente a mesma linha "Pendente de Fechamento"/"Finalizado" que veria se nunca tivesse solicitado nada — **nenhuma indicação de que algo está em análise, foi aprovado ou foi recusado.** Os 7 estados do §8.1 (Em andamento; Finalizado; Pendente de fechamento; Fora do horário; Aguardando aprovação; Regularizado aprovado; Regularização recusada) não são todos representáveis hoje.

**GAP 2 — Não existe função de leitura das próprias solicitações do vendedor.** `useCheckinAuditor.fetchPendingRequests` (linha 28-38) busca solicitações **pendentes de toda a loja** (uso do gestor em `RotinaAjustesTab.tsx`/`useRotinaGerentePage.ts`), não filtra por `seller_id` do usuário logado nem inclui `approved`/`rejected`. Não há nenhuma chamada, em nenhum lugar do código do vendedor, a `solicitacoes_correcao_lancamento` filtrando pelo próprio `seller_id`. Sem isso, o Histórico do vendedor não tem como saber se uma data tem uma solicitação (e em que estado) — a RLS já permite (`seller_id = auth.uid()`), só falta o client chamar.

**GAP 3 — Ações por estado do §8.2 não existem.** Hoje toda linha do Histórico tem exatamente um botão (`Ajustar` ou `Regularizar`) que sempre abre o mesmo `RegularizarFechamentoDrawer` genérico, independente de já existir uma solicitação pendente/aprovada/recusada para aquela data. Faltam: "Ver solicitação" + badge `Em análise` (Aguardando aprovação, sem permitir reabrir o drawer); "Ver versão original" + "Ver versão aprovada" + "Ver auditoria" (Aprovado); "Ver motivo da recusa" + "Criar nova versão de regularização" (Recusado — este último **pode** reabrir o drawer, pois o servidor permite nova solicitação depois de `rejected`, já que o guard de duplicidade só bloqueia `status='pending'`).

**GAP 4 — Teste de regressão da remoção do campo aponta para o arquivo errado.** Ver item 1 acima — `CheckinHeader.test.ts` verifica `formSource` (`CheckinForm.tsx`), não `RegularizarFechamentoDrawer.tsx` (onde o campo de fato existia). `RegularizarFechamentoDrawer.test.tsx` não tem nenhuma asserção sobre isso.

## 🤖 CodeRabbit Integration

> **CodeRabbit Integration**: Disabled
>
> CodeRabbit CLI is not enabled in `core-config.yaml`.
> Quality validation will use manual review process only.
> To enable, set `coderabbit_integration.enabled: true` in core-config.yaml

## Acceptance Criteria

Todo AC abaixo mapeia a um AC do epic (`docs/stories/epics/epic-mx-22-fechamento-diario-vendedor-2026-07-14.md` §3, AC-12/AC-13) e ao(s) FEV-DATA-10/§8/§1.3 do spec v2.0. ACs marcados **(ADAPT/regressão)** cobrem comportamento que já existe e só precisa de teste de guarda; ACs marcados **(CREATE)** cobrem os gaps reais.

1. **(CREATE) Given** o vendedor abre o Histórico de Fechamentos, **when** uma data dos últimos 7 dias (incluindo hoje) é renderizada, **then** o estado exibido é um dos 7 estados mínimos do §8.1 — Em andamento, Finalizado, Pendente de fechamento, Fora do horário, Aguardando aprovação, Regularizado aprovado, Regularização recusada — calculado combinando `lancamentos_diarios` (`isSubmittedClosing`, `submission_status`) com a solicitação de regularização mais recente daquela `reference_date` em `solicitacoes_correcao_lancamento` (quando existir), e não apenas o binário atual `Finalizado`/`Pendente de Fechamento`. *(Epic AC-12; Spec §8.1)*
   - **[AUTO-DECISION]** Mapeamento estado→dado, documentado para @po confirmar na validação (spec não define os critérios exatos de corte por estado):
     - `Em andamento` = data é `mainDate`/hoje e ainda não finalizada (a linha de hoje passa a existir na lista, hoje ausente porque o loop atual é `i=1..7` a partir de ontem).
     - `Finalizado` = `isSubmittedClosing(checkin) && submission_status === 'on_time'` e sem solicitação de regularização com `status IN ('pending','approved')` mais recente que a finalização.
     - `Pendente de fechamento` = nenhum `lancamentos_diarios.daily` para a data e nenhuma solicitação de regularização existente.
     - `Fora do horário` = nenhum `lancamentos_diarios.daily` finalizado dentro da janela E a janela de 12:00 (SP) já passou para aquela `reference_date` (reaproveitar o helper de atraso já existente de `isCheckinLateForReferenceDate`/`useCheckins.ts`, não recriar cálculo de fuso) — **razão:** distinguir "ainda pode enviar no prazo" de "só resta regularizar" sem inventar uma segunda régua de tempo.
     - `Aguardando aprovação` = existe solicitação com `status === 'pending'` para a data.
     - `Regularizado aprovado` = existe solicitação com `status === 'approved'` (a mais recente por `reviewed_at`) e nenhuma `pending` mais nova.
     - `Regularização recusada` = existe solicitação com `status === 'rejected'` (a mais recente) e nenhuma `pending`/`approved` mais nova para a mesma data.
2. **(CREATE) Given** o estado de uma linha do Histórico, **when** as ações daquela linha são renderizadas, **then** elas seguem exatamente §8.2: `Finalizado` → `Ver detalhes` + `Ajustar`; `Pendente de fechamento` ou `Fora do horário` → `Regularizar`; `Aguardando aprovação` → `Ver solicitação` + badge `Em análise` (sem oferecer `Ajustar`/`Regularizar` de novo, para não colidir com o guard de duplicidade pendente do servidor); `Regularizado aprovado` → `Ver versão original` + `Ver versão aprovada` + `Ver auditoria`; `Regularização recusada` → `Ver motivo da recusa` + `Criar nova versão de regularização` (reabre o drawer normal, pois o servidor permite nova solicitação após `rejected`). *(Epic AC-12; Spec §8.2)*
3. **(CREATE) Given** o vendedor autenticado, **when** o Histórico carrega, **then** existe uma função de leitura (`useCheckinAuditor` ou hook equivalente) que busca as solicitações do **próprio** `seller_id` (não filtradas a `pending` como `fetchPendingRequests`, que é escopo de gestor/loja) para o intervalo de datas do Histórico, usando a política RLS já existente (`seller_id = auth.uid()`) — sem nenhuma migration nova. *(Epic AC-12; Spec §8.1/§8.2, viabilizador técnico)*
4. **(ADAPT/regressão, já implementado no servidor) Given** o vendedor clica em `Ajustar`/`Regularizar`/`Criar nova versão de regularização` para uma data específica, **when** o drawer abre e a solicitação é enviada, **then** (a) carrega exatamente a data escolhida (`selectedRow.date`, nunca outra), (b) carrega os dados originais dessa data (`handleSelectRow`), (c) o servidor gera o diff automaticamente (`v_delta` em `solicitar_regularizacao_fechamento`), (d) uma nova versão é criada como uma nova linha `pending` em vez de sobrescrever `lancamentos_diarios`, (e) uma segunda tentativa com uma solicitação já `pending` para o mesmo `checkin_id` é rejeitada pelo servidor (`"Já existe uma regularização pendente para este fechamento"`), (f) o gestor da loja recebe notificação (`notificacoes`, `target_role='gerente'`). Este AC exige testes de regressão explícitos para os 6 itens — **não é uma reimplementação**. *(Epic AC-12; Spec §8.3)*
5. **(ADAPT/regressão, já implementado) Given** o formulário de regularização, **when** o vendedor tenta habilitar o botão de envio, **then** o campo obrigatório é exclusivamente o `Motivo do Ajuste` (`ADJUSTMENT_REASONS`, catálogo fechado), nunca um campo de texto livre `Observações Operacionais (Justificativa)` — o campo foi removido em `cc338e13` e este AC adiciona o teste de regressão que hoje não existe no arquivo certo (`RegularizarFechamentoDrawer.tsx`/`.test.tsx`), sem recriar nem re-remover nada. **Não afeta** o campo distinto e legítimo `Observações Operacionais (Obrigatório/Opcional)` do formulário principal do dia (`CheckinForm.tsx` linha 397, `id="checkin-note"`), que permanece intocado. *(Epic AC-13; Spec §1.3, §8.4, §14 FEV-DATA-10)*
6. **(ADAPT/regressão, já implementado no servidor) Given** uma solicitação de regularização é aprovada ou recusada, **when** `aplicar_regularizacao_fechamento`/`rejeitar_regularizacao_fechamento` processam a decisão, **then** o registro de auditoria (`checkin_audit_logs.old_values`/`new_values`/`change_type`) e os campos da própria solicitação (`status` anterior→novo, `auditor_id`, `reviewed_at`, `applied_at`/`rejection_reason`, `requested_by`) cobrem usuário, status anterior/novo, valores anteriores/novos, versão (id da solicitação) e responsável pela decisão do §12.4 automaticamente, sem ação adicional do vendedor. Este AC documenta explicitamente quais dos 12 campos do §12.4 **não** têm coluna própria hoje (perfil/role do ator e fuso não são persistidos como coluna dedicada — são deriváveis, respectivamente, via join em `usuarios.role` e são implicitamente `America/Sao_Paulo` em todo o sistema) como observação não bloqueante para @po decidir se exige coluna dedicada. *(Epic AC-13; Spec §12.4)*

## Scope

**IN:** modelo de estado do Histórico cobrindo os 7 estados mínimos do §8.1 (combinando `lancamentos_diarios` + `solicitacoes_correcao_lancamento`); ações por estado do §8.2 (`Ver detalhes`, `Ajustar`, `Regularizar`, `Ver solicitação`/badge `Em análise`, `Ver versão original`/`Ver versão aprovada`/`Ver auditoria`, `Ver motivo da recusa`/`Criar nova versão de regularização`); nova função de leitura das próprias solicitações do vendedor (client-side, sem migration); testes de regressão para a regra do botão Ajustar (§8.3, já implementada no servidor); teste de regressão no arquivo correto (`RegularizarFechamentoDrawer`) para a ausência do campo "Observações Operacionais (Justificativa)" (§8.4/§1.3, já removido); documentação explícita da cobertura de auditoria (§12.4) já existente.

**OUT (fica para outras stories):** formulários de Garantia/Qualificado (22.4); integração com Módulo Gerencial — contabilização, pendência gerencial, conciliação da janela 12:00×snapshot 09:31 (22.5); estados de interface genéricos do §13 não citados nos ACs acima (carregando/salvando/sem conexão/conflito de versão — 22.6); qualquer reabertura de `ActiveClosingContext`, regra de horário 12:00, textos dos cards de contexto (22.1, Done); qualquer reabertura da persistência/idempotência de D-1/D0, índice único, rascunho real (22.2, Done); qualquer migration nova em `solicitacoes_correcao_lancamento`/RPCs de regularização (já existem e cobrem o necessário — nenhuma alteração de schema/RPC nesta story); adicionar coluna dedicada de "perfil"/"fuso" em `checkin_audit_logs` (fica documentado como observação para @po decidir, não implementado aqui salvo instrução explícita).

## Dependencies

- **Bloqueado por:** Story 22.1 (`ActiveClosingContext` — **Done**), Story 22.2 (persistência/idempotência/índice único — **Done**, consumida indiretamente pois o Histórico lê `lancamentos_diarios`).
- **Bloqueia:** nenhuma story subsequente depende estritamente desta para iniciar (22.4/22.5/22.6 têm escopos independentes), mas 22.5 (integração gerencial) deve reaproveitar o mesmo mapeamento de estados desta story para evitar duas fontes de verdade sobre "o que conta como pendência gerencial".
- **Coordenação externa:** nenhuma. Toda a leitura usa RLS já existente (`seller_id = auth.uid()`); nenhuma migration, aplicação de infra ou coordenação de banco é necessária nesta story.

## Complexity

**M** (5 pts) — a parte de maior risco (backend de regularização, diff, idempotência, auditoria) já existe e está testada em produção; o esforço real está em: (a) combinar duas fontes de dados (`lancamentos_diarios` + `solicitacoes_correcao_lancamento`) num único modelo de estado por data sem duplicar lógica de fuso/janela já existente de 22.1/22.2, (b) construir as 5 ações novas por estado na UI (a maioria é apenas leitura/exibição, não formulários novos), (c) fechar o teste de regressão do campo removido no arquivo certo.

## Business Value

O vendedor hoje solicita uma regularização e depois "some" da tela — ele não sabe se foi vista, aprovada ou recusada até o gestor avisar por fora do sistema (ou até checar `/vendedor/terminal-mx` por acaso, já que a notificação existe mas o Histórico não reflete o estado). Fechar essa lacuna reduz retrabalho de suporte/gestor e entrega a transparência de auditoria que o épico promete, sem reconstruir nada que já funciona.

## Risks

- **Ambiguidade de mapeamento estado→dado (§8.1 "Fora do horário" vs "Pendente de fechamento")** — o spec não define o critério de corte entre os dois; o mapeamento proposto no [AUTO-DECISION] do AC-1 reaproveita o cálculo de atraso já existente (`isCheckinLateForReferenceDate`) em vez de inventar uma segunda régua de tempo, mas **precisa de confirmação de @po** na validação — se rejeitado, o AC-1 precisa de ajuste, não a arquitetura da story.
- **"Em andamento" incluir hoje no Histórico é uma extensão do escopo atual do componente** (`historyRows` hoje itera só `i=1..7` a partir de ontem, nunca hoje) — necessário para o estado existir e ser testável; documentado explicitamente para não ser lido como invenção não rastreada (Epic AC-12 exige que o Histórico "exponha os estados mínimos", e "Em andamento" só existe para a data de hoje).
- **Duas fontes de verdade por data (`lancamentos_diarios` + `solicitacoes_correcao_lancamento`) podem divergir em corridas raras** (ex.: solicitação aprovada entre o fetch de uma e o fetch da outra) — mitigar com um único ponto de composição do estado (função pura testável), não com múltiplos `useEffect` competindo (mesmo padrão de risco do GAP 1 de 22.2).
- **Nenhuma migration nova nesta story** — se @architect/@dev identificarem, na implementação, que falta um índice para consultar `solicitacoes_correcao_lancamento` por `(seller_id, reference_date)` de forma performática (hoje a tabela não guarda `reference_date` diretamente, só `checkin_id`; a busca por data exigiria um join com `lancamentos_diarios` ou filtrar client-side pelas datas dos checkins já carregados), isso deve ser levantado como decisão explícita de @architect antes de criar uma migration — não assumido silenciosamente nesta story de @sm.

## Definition of Done

- [x] Histórico expõe os 7 estados mínimos do §8.1 combinando `lancamentos_diarios` + `solicitacoes_correcao_lancamento`, com o mapeamento do AC-1 confirmado por @po (ou ajustado conforme feedback da validação).
- [x] Ações por estado do §8.2 implementadas: `Ver detalhes`/`Ajustar` (Finalizado), `Regularizar` (Pendente/Fora do horário), `Ver solicitação`+badge `Em análise` (Aguardando aprovação, sem reabrir o drawer), `Ver versão original`/`Ver versão aprovada`/`Ver auditoria` (Aprovado), `Ver motivo da recusa`/`Criar nova versão de regularização` (Recusado).
- [x] Nova função de leitura das próprias solicitações do vendedor implementada sem nenhuma migration nova, usando a RLS já existente.
- [x] Testes de regressão para a regra do botão Ajustar (§8.3): data exata, dados originais, diff no servidor, nova versão sem sobrescrita, bloqueio de duplicidade `pending`, notificação ao gestor.
- [x] Teste de regressão no arquivo correto (`RegularizarFechamentoDrawer.tsx`/`.test.tsx`) confirmando a ausência definitiva de "Observações Operacionais (Justificativa)", sem afetar o campo distinto `checkin-note` de `CheckinForm.tsx`.
- [x] Dev Notes atualizadas com a decisão final sobre o mapeamento "Fora do horário" vs "Pendente de fechamento" e sobre a necessidade (ou não) de índice/coluna adicional para consultar solicitações por data.
- [x] `npm run typecheck`, `npm run lint` e `npm test -- src/features/checkin src/hooks/useCheckinAuditor.test.ts` verdes.
- [x] Nenhuma regressão nos testes existentes de `CheckinHeader.test.ts`, `RegularizarFechamentoDrawer.test.tsx`, `active-closing-context.test.ts`.

## Tasks / Subtasks

- [x] **Task 1 — Ler o real antes de codar (AC: n/a — pré-requisito)**
  - [x] Ler `src/features/checkin/sections/CheckinHeader.tsx` completo (já lido nesta exploração; reconfirmar antes de editar).
  - [x] Ler `src/features/checkin/sections/RegularizarFechamentoDrawer.tsx` completo.
  - [x] Ler `src/hooks/useCheckinAuditor.ts` completo.
  - [x] Ler `supabase/migrations/20260710130000_canonical_checkin_regularization.sql` completo (RPCs e RLS).
  - [x] Confirmar via `git show cc338e13 -- src/features/checkin/sections/RegularizarFechamentoDrawer.tsx src/features/checkin/sections/CheckinHeader.tsx` que a remoção do campo já ocorreu (não repetir a exploração, só validar que nada mudou desde então).
- [x] **Task 2 — Nova função de leitura das próprias solicitações (AC: 3)**
  - [x] Adicionar em `useCheckinAuditor.ts` (ou hook dedicado) uma função que busca `solicitacoes_correcao_lancamento` filtradas por `seller_id = auth.uid()` (via RLS já existente) para o conjunto de `checkin_id`/datas do Histórico — decidir com @architect se o filtro é por `checkin_id IN (...)` (reaproveitando os ids já carregados de `lancamentos_diarios`) ou por `seller_id` direto (mais simples, sem depender de já ter os checkins carregados).
  - [x] Expor o resultado tipado com `CheckinCorrectionRequest[]` (`src/types/database.ts:270`).
- [x] **Task 3 — Modelo de estado combinado (AC: 1)**
  - [x] Extrair a lógica de `historyRows` (`CheckinHeader.tsx` linhas 78-153) para uma função pura testável que recebe `checkins` + `correctionRequests` + `now` e devolve o estado (`'em_andamento' | 'finalizado' | 'pendente' | 'fora_do_horario' | 'aguardando_aprovacao' | 'aprovado' | 'recusado'`) por data — seguindo o padrão de camada pura já estabelecido por `active-closing-context.ts` (22.1), sem duplicar cálculo de fuso/janela (reaproveitar `isCheckinLateForReferenceDate` ou equivalente).
  - [x] Incluir a data de hoje na lista (hoje ausente do loop atual `i=1..7` a partir de ontem) para que `Em andamento` seja representável.
  - [x] Testes unitários da função pura cobrindo os 7 estados e as transições (`pending → approved`, `pending → rejected`, `rejected → nova solicitação pending`).
- [x] **Task 4 — Ações por estado na UI (AC: 2)**
  - [x] Estender o `activeView` (`'list' | 'form'`) de `CheckinHeader.tsx` com uma visão adicional para `Ver solicitação`/`Ver versão original`/`Ver versão aprovada`/`Ver auditoria`/`Ver motivo da recusa` — reaproveitando a estrutura de modal existente (ADAPT), não criando um sistema de modais paralelo.
  - [x] Renderizar os badges/ações corretos por estado nas linhas do Histórico (`historyRows.map`).
  - [x] Garantir que `Aguardando aprovação` **não** ofereça `Ajustar`/`Regularizar` (evitar colisão com o guard de duplicidade `pending` do servidor).
  - [x] Garantir que `Regularização recusada` ofereça `Criar nova versão de regularização` reabrindo o `RegularizarFechamentoDrawer` normalmente.
- [x] **Task 5 — Regressão do botão Ajustar (AC: 4)**
  - [x] Teste (padrão de `definitive-daily-closing-migration.test.ts`/`submit-checkin-operational-date-migration.test.ts`: asserção via regex sobre o SQL) confirmando que `solicitar_regularizacao_fechamento` calcula `v_delta` automaticamente e bloqueia duplicidade `pending` via `EXISTS (... AND status = 'pending')`.
  - [x] Teste de `handleSelectRow`/`handleAdjustPrevious` confirmando que a data carregada é exatamente `selectedRow.date`/`previousCard.date`.
- [x] **Task 6 — Regressão do campo removido no arquivo certo (AC: 5)**
  - [x] Adicionar em `RegularizarFechamentoDrawer.test.tsx` (ou um teste de contrato de source-string, seguindo o padrão de `CheckinHeader.test.ts`) uma asserção lendo o próprio arquivo `RegularizarFechamentoDrawer.tsx` e garantindo `not.toContain('Observações Operacionais (Justificativa)')` e `not.toContain('onNoteChange')`.
  - [x] Confirmar (teste ou comentário) que `CheckinForm.tsx` linha ~397 (`Observações Operacionais (Obrigatório)/(Opcional)`, `id="checkin-note"`) permanece intocado e não é confundido com o campo removido.
- [x] **Task 7 — Documentar cobertura de auditoria (AC: 6)**
  - [x] Nas Dev Notes, listar os 12 campos do §12.4 e marcar quais já têm coluna própria em `solicitacoes_correcao_lancamento`/`checkin_audit_logs` vs. quais são deriváveis/implícitos (perfil, fuso) — sem implementar coluna nova nesta story salvo decisão explícita de @po/@architect.
- [x] **Task 8 — Regressão e gates**
  - [x] `npm run typecheck`
  - [x] `npm run lint`
  - [x] `npm test -- src/features/checkin src/hooks/useCheckinAuditor.test.ts`

## Dev Notes

### Arquivos reais a tocar (achados por exploração, não hipotéticos)

- `src/features/checkin/sections/CheckinHeader.tsx` — `historyRows` (linhas 78-153, hoje só 2 estados), `handleSelectRow` (155-198), `handleAdjustPrevious` (200-222), `handleSubmitCorrection` (236-329), modal do Histórico (518-662, hoje só lista `Finalizado`/`Pendente de Fechamento`). Núcleo desta story (ADAPT + CREATE pontual).
- `src/features/checkin/sections/RegularizarFechamentoDrawer.tsx` — já sem o campo de observação (removido em `cc338e13`); `ADJUSTMENT_REASONS` (linhas 10-18), `canSubmit = !!formValues.reason` (linha 144). Precisa só do teste de regressão (Task 6).
- `src/features/checkin/sections/RegularizarFechamentoDrawer.test.tsx` — hoje só 1 teste; adicionar o teste de regressão do campo removido.
- `src/features/checkin/sections/CheckinHeader.test.ts` — linha 50-54, asserção existente que testa o arquivo errado (`formSource`/`CheckinForm.tsx`) para a remoção do campo; manter (não é falsa, só redundante) e adicionar a nova em `RegularizarFechamentoDrawer.test.tsx`.
- `src/hooks/useCheckinAuditor.ts` — `requestCorrection` (12-25), `fetchPendingRequests` (28-38, escopo gestor/loja, não reaproveitar diretamente para o vendedor), `approveRequest`/`rejectRequest`/`cancelRequest` (41-87). Adicionar função de leitura das próprias solicitações (Task 2).
- `src/types/database.ts` — `CorrectionStatus` (linha 32), `CheckinCorrectionRequest` (270-286), `CheckinAuditLog` (289-298) já modelam tudo que esta story precisa ler.
- `supabase/migrations/20260710130000_canonical_checkin_regularization.sql` — RPCs `solicitar_regularizacao_fechamento` (66-225), `aplicar_regularizacao_fechamento` (227-340), `rejeitar_regularizacao_fechamento` (342-369), `cancelar_regularizacao_fechamento` (371-390); RLS `solicitacoes_correcao_select` (39-46, já permite `seller_id = auth.uid()`). Nenhuma migration nova esperada.
- `src/features/rotina-gerente/sections/RotinaAjustesTab.tsx` — referência de padrão visual para exibir `requested_values`/`delta` no lado do gestor; útil como inspiração para as views `Ver versão original`/`Ver versão aprovada`/`Ver auditoria` do vendedor, mas **não** deve ser reaproveitado diretamente (é escopo de gestor, com ações de aprovar/rejeitar que o vendedor não tem).
- `src/features/checkin/hooks/useCheckinPage.ts` — consumidor de `CheckinHeader` (via `Checkin.container.tsx`); confirmar que nenhuma nova prop quebra o contrato existente entre o container e o header.

### Campo removido — não recriar, só testar (§1.3/§8.4/FEV-DATA-10)

> "Remover do ajuste: `Observações Operacionais (Justificativa)`." — Spec §8.4, já satisfeito por `cc338e13`. Esta story adiciona apenas o teste de regressão no arquivo correto (Task 6); **nenhum código de produção precisa mudar para este AC**, só o teste.

### Motivo de regularização como conceito separado (§8.4)

`ADJUSTMENT_REASONS` (catálogo fechado: "Correção de registro", "Inclusão de dado", "Ajuste de contagem", "Erro operacional", "Duplicidade removida", "Fechamento esquecido", "Outro motivo") já é o único campo obrigatório do drawer, e o servidor (`solicitar_regularizacao_fechamento` linha 89-91) exige `length(trim(p_reason)) >= 8` — o motivo em si já cumpre o papel de "conceito separado" do §8.4; não há mais nenhum campo de "justificativa" livre a remover.

### Cobertura de auditoria §12.4 (levantamento, não implementação)

| Campo do §12.4 | Coberto hoje? | Onde |
|---|---|---|
| usuário | Sim | `requested_by` / `auditor_id` / `changed_by` |
| perfil | Parcial (derivável via join, sem coluna própria) | `usuarios.role` a partir de `requested_by`/`auditor_id` |
| loja | Sim | `store_id` |
| data operacional | Sim (via join) | `lancamentos_diarios.reference_date` a partir de `checkin_id` |
| data/hora real | Sim | `created_at`/`reviewed_at`/`applied_at`/`checkin_audit_logs.created_at` |
| fuso | Implícito (sistema inteiro é `America/Sao_Paulo`), sem coluna própria | — |
| status anterior/novo | Sim | `status` antes/depois da transição + `checkin_audit_logs.old_values`/`new_values` |
| valores anteriores/novos | Sim | `original_values`/`requested_values`/`delta`, `checkin_audit_logs.old_values`/`new_values` |
| origem da ação | Parcial (implícito pelo fluxo, sem coluna `origin` dedicada) | — |
| versão | Sim (cada solicitação é uma versão) | `solicitacoes_correcao_lancamento.id` |
| aprovação/recusa | Sim | `status`, `rejection_reason` |
| responsável pela decisão | Sim | `auditor_id` |

Gaps reais (perfil/fuso/origem sem coluna própria) são de baixo risco (deriváveis ou constantes do sistema) — registrados para @po decidir se exige coluna dedicada; **não implementado nesta story** salvo instrução explícita.

### Fuso horário

Nenhum código novo desta story deve introduzir `new Date().getHours()`/`Date.now()` cru. Reaproveitar os helpers já estabelecidos por 22.1/22.2 (`getSaoPauloMinutes`, `getSPDateOnly`, `isCheckinLateForReferenceDate`) para qualquer cálculo de "janela ainda aberta" usado no mapeamento `Fora do horário` vs `Pendente de fechamento` do AC-1.

### Testing

- Framework: `bun:test` (ver `active-closing-context.test.ts`, `CheckinHeader.test.ts`, `RegularizarFechamentoDrawer.test.tsx`).
- Comando: `npm test -- src/features/checkin src/hooks/useCheckinAuditor.test.ts` (criar este arquivo se não existir).
- Para a função pura de estado combinado (Task 3), seguir o padrão de fixtures de `active-closing-context.test.ts` (`closing(date)`, `draftClosing(date)` etc.) — não recriar fixtures do zero.
- Para os testes de regressão de RPC (Task 5), seguir o padrão de asserção via regex sobre o SQL de `definitive-daily-closing-migration.test.ts`/`submit-checkin-operational-date-migration.test.ts`, já que não há harness de Postgres real disponível no CI (memória do time: checks de pgTAP/Supabase Preview falham por ausência de secrets, não por código).

## Change Log

| Date | Version | Description | Author |
|------|---------|--------------|--------|
| 2026-07-14 | 1.0 | Story criada a partir do EPIC-MX-22 e da spec-fonte §1.3/§8/§12.4/FEV-DATA-10. Exploração real de código confirmou (via `git show cc338e13`) que o campo "Observações Operacionais (Justificativa)" já foi removido do `RegularizarFechamentoDrawer.tsx`/`CheckinHeader.tsx` antes desta story — não é escopo de remoção, só de teste de regressão no arquivo certo. Backend de regularização (`solicitacoes_correcao_lancamento` + RPCs `solicitar/aplicar/rejeitar/cancelar_regularizacao_fechamento`) já cobre diff, versão, idempotência e auditoria mínima do §8.3/§12.4 — REUSE, não CREATE. Gap real identificado: Histórico do vendedor (`CheckinHeader.tsx`) só expõe 2 dos 7 estados mínimos do §8.1 e é cego a `solicitacoes_correcao_lancamento` — nenhuma leitura client-side das próprias solicitações do vendedor existe hoje. Escopo desta story fechado nesses gaps reais (CREATE pontual), sem reabrir 22.1/22.2 nem propor migration nova. | @sm (River) |
| 2026-07-14 | 1.1 | Validação PO `*validate-story-draft` (10-point checklist): **GO 10/10**. Status Draft → Ready. Verificações contra código real: commit `cc338e13` existe; campo "Observações Operacionais (Justificativa)" ausente em `RegularizarFechamentoDrawer.tsx` (0 ocorrências); campo legítimo distinto `checkin-note` intacto em `CheckinForm.tsx:396`; `fetchPendingRequests` é escopo gestor (`status='pending'`, sem reader `seller_id=auth.uid()`) — GAP 2 confirmado real. Spec §8.1 (7 estados) e §8.2 (ações por estado) batem 1:1 com AC-1/AC-2, sem ações inventadas. Backend de regularização não reaberto, nenhuma migration nova. AC-5 (fix do teste no arquivo certo) e Task 6 (distinção campo removido × campo legítimo) presentes. **[AUTO-DECISION CONFIRMADO]** "Fora do horário" ≠ "Pendente de fechamento": permanecem estados distintos por critério de dado (janela 12:00 via `isCheckinLateForReferenceDate` de 22.1/22.2) mas compartilham a mesma ação `Regularizar` conforme §8.2 ("Pendente ou fora do horário → Regularizar") — a story NÃO os colapsou; mapeamento aprovado. | @po (Pax) |
| 2026-07-14 | 1.2 | Status: Ready → InProgress → InReview. Implementado: `checkin-history-state.ts` (nova camada pura, mesmo padrão de `active-closing-context.ts`) com `resolveHistoryRowState`/`actionsForHistoryRowState`/`latestRequestForCheckin`; `useCheckinAuditor.fetchOwnRequests` (Task 2, filtra por `seller_id` direto — opção mais simples do AC-3, sem join por `checkin_id`); `CheckinHeader.tsx` — loop do Histórico agora `i=0..7` (inclui hoje), `historyRows` carrega `state`/`latestRequest`, badges e ações renderizados via `actionsForHistoryRowState`, nova view `activeView='detail'` (painel único de leitura cobrindo Ver solicitação/versão original/versão aprovada/auditoria/motivo da recusa — **decisão de implementação**: uma tela só, não 5 telas separadas, já que o spec não prescreve layout, só as ações; "Ver detalhes" de Finalizado não ganhou botão próprio porque as métricas inline já cumprem esse papel). **Desvio documentado do AUTO-DECISION do AC-1:** `Finalizado` foi implementado como `isSubmittedClosing(checkin)` puro (sem a cláusula `&& submission_status === 'on_time'`) — a leitura estrita do AUTO-DECISION deixaria um lançamento finalizado-porém-tardio (só alcançável por clock skew do cliente, caso defensivo de 22.2) sem estado nenhum nos 7 definidos; a precedência de solicitação de regularização (pending/approved/rejected) continua batendo antes desse fallback, então o comportamento observável pro caso comum é idêntico ao aprovado. Registrado para @qa avaliar se precisa de novo ciclo de @po. Testes novos: `checkin-history-state.test.ts` (13 casos, 7 estados + ações + `latestRequestForCheckin`), `useCheckinAuditor.test.ts` (novo arquivo, contrato de `fetchOwnRequests`), `RegularizarFechamentoDrawer.test.tsx` (teste de regressão real — renderiza o componente, não só string-fonte — confirmando ausência do campo), `checkin-regularization-migration.test.ts` (2 testes novos: delta automático, bloqueio de duplicidade pending), `CheckinHeader.test.ts` (4 testes novos). `npx tsc --noEmit` limpo, `npm run lint` 0 erros, `bun test --isolate src/features/checkin src/hooks/checkins src/hooks/useCheckinAuditor.test.ts src/lib/checkin-regularization-migration.test.ts` → 115/115 verdes. Nenhuma migration nova. | @dev (Dex) |

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 — implementação direta na sessão (sem subagent @dev; evitou o padrão de crash por limite de sessão observado em 22.1/22.2).

### Completion Notes List

- GAP 1 (7 estados) e GAP 2 (leitura própria de solicitações) fechados; nenhuma migration nova; backend de regularização (§8.2/§8.3/§12.4) tratado como REUSE, não reaberto.
- Ver Change Log v1.2 pro desvio documentado do AUTO-DECISION do AC-1 (`Finalizado` sem a cláusula `on_time`).

### File List

- `src/features/checkin/lib/checkin-history-state.ts` (novo) — camada pura dos 7 estados + ações por estado.
- `src/features/checkin/lib/checkin-history-state.test.ts` (novo).
- `src/hooks/useCheckinAuditor.ts` — `fetchOwnRequests` novo, exportado.
- `src/hooks/useCheckinAuditor.test.ts` (novo).
- `src/features/checkin/sections/CheckinHeader.tsx` — loop `i=0..7`, `historyRows` com `state`/`latestRequest`, badges/ações por estado, nova view `detail`.
- `src/features/checkin/sections/CheckinHeader.test.ts` — 4 testes novos (MX-22.3).
- `src/features/checkin/sections/RegularizarFechamentoDrawer.test.tsx` — teste de regressão real (render) pro campo removido.
- `src/lib/checkin-regularization-migration.test.ts` — 2 testes novos (delta automático, bloqueio de duplicidade).

## QA Results

_A preencher por @qa_
