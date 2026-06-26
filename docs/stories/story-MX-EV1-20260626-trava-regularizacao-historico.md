# Story MX-EV1-20260626 - Trava de Edição na Regularização do Histórico

## Status

InReview

## Story

**As a** gerente,
**I want** que um fechamento "Pendente de Fechamento" só possa ser preenchido pelo vendedor depois que eu libero,
**so that** a liberação tenha efeito real, não só visual/decorativo.

## Source Requirements

- Especificação Funcional — Tela Fechamento Diário, seção 22.
- PRD EV-1.9 (`docs/prd/modulo-vendedor/01-epic-fechamento.md#EV-1.9`).
- Achado de código: `CheckinHeader.tsx` (`handleSelectRow`/`handleSubmitCorrection`, linhas 143-292) permite preencher e enviar a regularização de qualquer dia "Pendente de Fechamento" sem checar liberação alguma — a trava só existe hoje no formulário principal (`CheckinForm.tsx:765-779`), não no fluxo de regularização do Histórico.

## Acceptance Criteria

1. Ao abrir (`handleSelectRow`) um item "Pendente de Fechamento" no Histórico sem liberação registrada (fonte: `lancamentos_diarios.fechamento_liberado` de EV-1.5/EV-1.6, ou ausência de registro em `fechamento_liberacoes` com status `liberado`), os campos do formulário de regularização ficam desabilitados.
2. Nesse mesmo cenário sem liberação, o botão de envio (`handleSubmitCorrection`) fica vermelho/desabilitado com a mesma mensagem usada no fluxo principal ("Prazo encerrado às 09h30. Solicite liberação ao seu gerente para finalizar este fechamento.").
3. Com liberação registrada para aquele `lancamento_id`/data, os campos habilitam normalmente e aparece o aviso de penalização de 10% antes do envio (texto consistente com `disciplineMessage`/banner do fluxo principal).
4. Teste cobrindo os dois estados (sem liberação / com liberação) no componente `CheckinHeader`.
5. Gates obrigatórios da story passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- Depende de EV-1.5 (colunas de liberação em `lancamentos_diarios`) e EV-1.6 (fluxo real de liberação) — esta story é só leitura + trava de UI no Histórico, sem lógica nova de liberação.
- Reaproveitar a mesma fonte de dado de liberação que `CheckinForm.tsx` já consome (`fechamentoLiberado` do contexto `useCheckinPage`), mas para a data selecionada no Histórico, não necessariamente a `selectedDate` do fechamento principal — `CheckinHeader` precisa buscar a liberação por `row.date`, não reaproveitar o estado do dia corrente sem ajuste.
- Imports absolutos `@/*` são padrão do projeto e da Constituição AIOX. [Source: .aiox-core/constitution.md#vi-absolute-imports-should]

## Tasks / Subtasks

- [x] Buscar/derivar status de liberação por `row.date` dentro de `CheckinHeader.tsx` (AC: 1, 3).
- [x] Desabilitar campos e botão de envio quando não liberado (AC: 1, 2).
- [x] Habilitar campos + aviso de penalização quando liberado (AC: 3).
- [x] Extrair a condição de bloqueio em função pura testável (`isRegularizacaoBloqueada`) e testar os 2+ estados (AC: 4).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 5).

## File List

- `docs/stories/story-MX-EV1-20260626-trava-regularizacao-historico.md`
- `src/features/checkin/lib/regularizacao-lock.ts` (novo)
- `src/features/checkin/lib/regularizacao-lock.test.ts` (novo)
- `src/features/checkin/sections/CheckinHeader.tsx`

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (aiox-master orquestrando, hat @dev)

### Debug Log References

- `npm run typecheck`, `npm run lint`, `npm test` (654/654, 0 falhas), `npm run build` — todos verdes.

### Completion Notes

- `CheckinHeader.tsx` agora busca a liberação real direto em `fechamento_liberacoes` (mesma tabela/RPC de EV-1.6) filtrando por `vendedor_id`+`data_fechamento` = `row.date` quando o item selecionado é "Pendente de Fechamento" (`row.finalized === false`) — dias já finalizados (fluxo de "Ajustar"/correção) não passam por essa checagem, só o caminho de regularização de pendência.
- Condição de bloqueio extraída como função pura `isRegularizacaoBloqueada({ rowSelected, rowFinalized, liberacaoStatus })` em `lib/regularizacao-lock.ts`, seguindo o mesmo padrão de `disciplina.ts`/`lock-stage.ts`/`confirm-finalize.ts` — evita testar a condição via render pesado (o componente depende de `useCheckinAuditor`+Supabase, sem mock estabelecido no repo para esse hook) e cobre os 5 estados relevantes do AC4 (nenhuma linha, finalizado, pendente sem liberação, pendente com solicitação só "pendente", pendente liberado).
- Os 10 inputs numéricos + select de motivo + textarea de observações recebem `disabled={regularizacaoBloqueada}` (mesmo padrão `min="0"` se repetia identicamente nos 10 campos, permitindo um único `replace_all`). Botão de envio fica vermelho com o texto "Aguardando liberação do gerente" quando bloqueado, na mesma linguagem do fluxo principal (`CheckinForm.tsx`).
- Banner acima do formulário replica o texto do fluxo principal (vermelho: "Prazo encerrado às 09h30...", verde: aviso de penalização de 10%) — só aparece para itens "Pendente de Fechamento", não para ajustes em dias já finalizados.

### Change Log

- 2026-06-26: Story criada a partir de PRD EV-1.9 (gerado pela Especificação Funcional — Tela Fechamento Diário).
- 2026-06-26: Validação @po — GO, mas marcado como bloqueado por dependência: só pode entrar em InProgress depois de EV-1.5 e EV-1.6 estarem Done (a fonte de dado de liberação que esta story consome ainda não existia). Status definido como Ready (apto para fila, não para início imediato).
- 2026-06-26: EV-1.5 e EV-1.6 concluídas nesta mesma sessão — dependência resolvida. Implementação concluída por @dev. Gates verdes. Status: Ready for Review.
- 2026-06-26: QA (@qa, Quinn) — PASS. Confirmado que a trava de UI tem efeito real no servidor (achado documentado no Dev Agent Record de EV-1.6: `historical` scope agora também passa pelo gate de 09:45/liberação). 1 concern não-bloqueante (C2: gate por relógio atual, não por idade da pendência). Ver relatório completo em `docs/reports/qa-gate-ev1-fechamento-stories-20260626.md`. Status: InReview.

## QA Results

**Verdict:** ✅ PASS (1 concern não-bloqueante)
**Relatório completo:** `docs/reports/qa-gate-ev1-fechamento-stories-20260626.md`

- Os 12 campos do formulário de regularização (10 inputs numéricos + select de motivo + textarea de observações) confirmados com `disabled={regularizacaoBloqueada}`.
- Botão de envio confirmado vermelho/desabilitado com texto "Aguardando liberação do gerente" quando bloqueado.
- `handleSubmitCorrection` tem guard client-side redundante (`if (regularizacaoBloqueada) return`) — correto como defesa em profundidade, mesmo sabendo que o servidor já bloqueia via `checkin_validation_kit`.
- **C2 (concern):** o gate de horário usado por `historical` (herdado da EV-1.6) é por relógio atual (`now() > 09:45`), não pela idade da pendência específica — um vendedor que abrir o Histórico antes das 09:45 de hoje consegue regularizar uma pendência antiga sem liberação. Comportamento pré-existente do desenho original (mesma lógica já valia para `daily`), não introduzido por esta story. Registrado para decisão de produto futura, não bloqueia esta story.
