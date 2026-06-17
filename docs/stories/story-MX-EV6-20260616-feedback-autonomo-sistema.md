# Story MX-EV6-20260616 - Feedback Autonomo Gerado pelo Sistema

## Status

Ready for Review

## Story

**As a** vendedor autonomo sem gerente,
**I want** receber feedback gerado pelo sistema a partir dos meus gargalos de cadencia,
**so that** eu saiba onde estou errando no fluxo e tenha uma acao concreta na rotina.

## Source Requirements

- PRD EV-6.5: sistema analisa numeros e gera feedback automatico.
- PRD EV-6.5: aponta a etapa do fluxo onde o vendedor falha.
- PRD EV-6.5: usa a mesma UX do feedback humano, com confirmacao e acao na rotina.
- PRD EV-6.5: devolutiva sistemica nao possui responsavel humano.
- PRD EV-2.6: analytics de gargalo prepara a base para feedback autonomo.
- PRD EV-12.1: feedback autonomo se aplica ao vendedor com `vinculo_tipo = autonomo`.

## Acceptance Criteria

1. Existe motor puro que recebe analytics de cadencia e decide se deve gerar feedback autonomo.
2. Feedback so e gerado para `vinculo_tipo = autonomo`; vendedor de loja nao recebe feedback sistemico automatico.
3. O feedback aponta a etapa de maior gargalo e explica o motivo de forma rastreavel.
4. O payload de devolutiva sistemica usa `manager_id = null` e metadata indicando origem `sistema`.
5. A acao sugerida e convertida em payload de `devolutiva_acoes` compatível com a Central e a trava de fechamento.
6. `VendedorFeedback` mostra responsavel "Sistema MX" quando nao ha gerente humano.
7. Existem testes automatizados cobrindo geracao, bloqueio para loja e payload de acao.
8. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- Reutilizar `src/features/crm/lib/cadencia-analytics.ts` como entrada do motor.
- Reutilizar `devolutivas` para historico e UX existente; nao criar tabela paralela de feedback autonomo.
- Reutilizar `devolutiva_acoes` e `buildFeedbackActionPayload` para que a acao entre na Central/Fechamento.
- Ajustar schema/types/migration somente se necessario para `manager_id` nulo em devolutiva sistemica.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.
- Template/checklist formais do agente SM (`story-tmpl.yaml`, `story-draft-checklist.md`) nao existem neste checkout; usar formato local das stories `story-MX-EV*`.
- Arquivos `devLoadAlwaysFiles` e fallbacks definidos em `.aiox-core/core-config.yaml` nao existem neste checkout; usar padroes observados no codigo.

## Tasks / Subtasks

- [x] Criar testes vermelhos para motor de feedback autonomo (AC: 1-5, 7).
- [x] Implementar helper puro de decisao e payload sistemico (AC: 1-5).
- [x] Ajustar persistencia/types/migration se `manager_id` exigir nulo para origem sistema (AC: 4).
- [x] Ajustar `VendedorFeedback` para responsavel sistemico (AC: 6).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 8).

## File List

- `docs/stories/story-MX-EV6-20260616-feedback-autonomo-sistema.md`
- `package.json`
- `src/features/gerente-feedback/lib/autonomous-feedback.ts`
- `src/features/gerente-feedback/lib/autonomous-feedback.test.ts`
- `src/features/gerente-feedback/lib/feedback-actions.ts`
- `src/hooks/useFeedbacks.ts`
- `src/lib/feedback-autonomo-migration.test.ts`
- `src/lib/schemas/feedback.schema.ts`
- `src/lib/schemas/feedback.schema.test.ts`
- `src/pages/VendedorFeedback.tsx`
- `src/pages/VendedorFeedback.test.tsx`
- `src/pages/VendedorPDI.test.tsx`
- `src/types/database.ts`
- `src/types/database.generated.ts`
- `supabase/migrations/20260617003000_feedback_autonomo_sistema.sql`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- Template/checklist do SM ausentes no checkout; story segue formato local ja usado em `docs/stories/story-MX-EV*.md`.
- Arquivos `docs/framework/*` e fallbacks `docs/architecture/padroes-de-codigo.md`, `docs/architecture/pilha-tecnologica.md`, `docs/architecture/arvore-de-origem.md` ausentes no checkout.
- TDD red: `bun test src/features/gerente-feedback/lib/autonomous-feedback.test.ts` falhou por modulo `./autonomous-feedback` ausente.
- TDD red: `bun test src/lib/feedback-autonomo-migration.test.ts src/lib/schemas/feedback.schema.test.ts` falhou por migration ausente e `FeedbackSchema` rejeitando `manager_id = null`.
- TDD red: `bun test src/pages/VendedorFeedback.test.tsx` falhou por nao exibir `Sistema MX` e depois por nao chamar `createAutonomousFeedback`.
- `bun test src/features/gerente-feedback/lib/autonomous-feedback.test.ts src/features/gerente-feedback/lib/feedback-actions.test.ts src/lib/feedback-autonomo-migration.test.ts src/lib/schemas/feedback.schema.test.ts src/pages/VendedorFeedback.test.tsx` - 13 pass, 0 fail.
- `bun test src/pages` inicialmente expôs mocks incompletos de `useVendedorPerfil`; apos ajuste, 8 pass, 0 fail.
- `npm test` ampliado para incluir `src/pages`; primeira execucao expôs mock incompleto de `buildOportunidadePayload`; apos ajuste, 517 pass, 0 fail.
- `npm run typecheck` - exit 0.
- `npm run lint` - exit 0; token lint OK em 515 arquivos.
- `npm run build` - exit 0; Vite build concluido.
- `git diff --check` - exit 0.
- `command -v wsl` - exit 1 sem output; indisponivel neste ambiente.
- `command -v coderabbit` - exit 1 sem output; indisponivel neste ambiente.

### Completion Notes

- Motor puro `buildAutonomousFeedbackFromCadencia` gera devolutiva sistemica somente para vendedor autonomo com gargalo real de cadencia.
- Devolutiva sistemica usa `manager_id = null`, metadata `diagnostic_json.origem = sistema`, etapa de gargalo e regra explicavel.
- Migration permite `manager_id` nulo em `devolutivas` e `devolutiva_acoes`, com RLS especifica para vendedor autonomo inserir feedback/acao sistemicos.
- `useFeedbacks` ganhou `createAutonomousFeedback`, reaproveitando `devolutivas` e `devolutiva_acoes` sem criar UX/tabela paralela.
- `VendedorFeedback` gera feedback autonomo a partir de analytics de cadencia quando nao existe devolutiva sistemica da semana e mostra responsavel `Sistema MX`.
- `npm test` agora inclui `src/pages`, cobrindo os testes de `VendedorFeedback`, `VendedorPDI` e `VendedorTreinamentos` no gate padrao.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-6.5, EV-2.6 e EV-12.1.
- 2026-06-16: Implementados motor, migration, persistencia, UX e testes de feedback autonomo sistemico.
