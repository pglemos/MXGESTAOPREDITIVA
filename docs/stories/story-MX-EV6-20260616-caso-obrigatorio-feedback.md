# Story MX-EV6-20260616 - Caso Obrigatorio no Feedback do Gerente

## Status

Ready for Review

## Story

**As a** gerente,
**I want** registrar o caso que motivou cada feedback,
**so that** a devolutiva seja especifica, rastreavel e util como documentacao.

## Source Requirements

- PRD EV-6.2: gerente obrigatoriamente informa o caso/motivo ao registrar feedback.
- PRD EV-6.2: caso fica no historico e serve como documentacao.
- PRD EV-6.2: sem caso, feedback nao e enviado.
- PRD EV-6.2: vendedor de loja apenas; depende de EV-12 para diferenciar loja vs autonomo.

## Acceptance Criteria

1. `devolutivas` possui campo persistido para `caso_motivo`.
2. Hook de feedback grava `caso_motivo` junto com a devolutiva.
3. Criacao de feedback bloqueia envio sem caso/motivo preenchido.
4. Modal do gerente possui campo de caso/motivo.
5. Historico/lista de feedback mostra o caso/motivo registrado.
6. Schema e tipos aceitam o campo sem descartar linhas antigas.
7. Existem testes automatizados para validacao, schema e migration.
8. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- `useFeedbacks` e `StoreFeedbackModal` concentram o fluxo de gerente de loja.
- Linhas antigas podem ter `caso_motivo` nulo; obrigatoriedade vale para novos registros via UI/hook.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Criar migration e tipagem para `caso_motivo` em `devolutivas` (AC: 1, 6).
- [x] Atualizar schema/useFeedbacks para ler/gravar o campo (AC: 2, 6).
- [x] Atualizar modal/hook do gerente com campo e bloqueio de envio (AC: 3-4).
- [x] Mostrar caso/motivo na lista/historico de feedbacks (AC: 5).
- [x] Adicionar testes e rodar gates (AC: 7-8).

## File List

- `docs/stories/story-MX-EV6-20260616-caso-obrigatorio-feedback.md`
- `supabase/migrations/20260616230000_devolutivas_caso_motivo.sql`
- `src/hooks/useFeedbacks.ts`
- `src/lib/schemas/feedback.schema.ts`
- `src/lib/schemas/feedback.schema.test.ts`
- `src/lib/devolutivas-caso-motivo-migration.test.ts`
- `src/types/database.ts`
- `src/types/database.generated.ts`
- `src/features/gerente-feedback/lib/validation.ts`
- `src/features/gerente-feedback/lib/validation.test.ts`
- `src/features/gerente-feedback/hooks/useStoreFeedback.ts`
- `src/features/gerente-feedback/modals/StoreFeedbackModal.tsx`
- `src/features/gerente-feedback/sections/FeedbackList.tsx`
- `src/features/gerente-feedback/sections/FeedbackList.test.tsx`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- `bun test src/features/gerente-feedback/lib/validation.test.ts src/lib/schemas/feedback.schema.test.ts src/lib/devolutivas-caso-motivo-migration.test.ts src/features/gerente-feedback/sections/FeedbackList.test.tsx` - 8 pass.
- `npm run typecheck` - passou.
- `npm run lint` - passou (`tsc --noEmit`, `lint-tokens-ast`, `eslint`).
- `npm test` - 477 pass.
- `npm run build` - passou (`vite build`).
- `git diff --check` - passou.
- CodeRabbit local indisponivel: `command -v wsl` e `command -v coderabbit` sem resultado.

### Completion Notes

- Migration adiciona `caso_motivo` em `devolutivas`, com constraint para impedir texto em branco quando informado sem quebrar linhas antigas nulas.
- `FeedbackSchema` aceita `caso_motivo` preenchido e mantem compatibilidade com devolutivas antigas.
- `useFeedbacks` seleciona e grava `caso_motivo`.
- `StoreFeedbackModal` ganhou campo `Caso/Motivo` e o hook bloqueia envio sem esse campo.
- `FeedbackList` mostra o caso/motivo no card de historico.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-6.2.
- 2026-06-16: Implementado caso/motivo obrigatorio no feedback do gerente e validado pelos gates obrigatorios.
