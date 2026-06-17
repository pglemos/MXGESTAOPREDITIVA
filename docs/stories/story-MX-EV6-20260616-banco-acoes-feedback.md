# Story MX-EV6-20260616 - Banco de Acoes Selecionaveis no Feedback

## Status

Ready for Review

## Story

**As a** gerente,
**I want** selecionar a acao do feedback a partir de um banco pre-definido,
**so that** a devolutiva gere uma tarefa padronizada na rotina sem depender de texto livre.

## Source Requirements

- PRD EV-6.4: gerente seleciona a acao de um banco pre-cadastrado em vez de digitar.
- PRD EV-6.4: a acao escolhida aciona o fluxograma vinculado e dispara tarefa/alerta na rotina.
- PRD EV-6.4: catalogo versionado de acoes e fluxogramas.
- PRD EV-6.3: selecao deve gerar acao concreta compativel com Central de Execucao e Fechamento.

## Acceptance Criteria

1. Existe catalogo versionado de acoes de feedback com identificador estavel, titulo, descricao e template de acao.
2. Catalogo contem pelo menos acoes para retorno diario, confirmacao de visita, argumentacao/financiamento e retomada de clientes parados.
3. Selecao de uma acao aplica texto concreto no `formData.action`, mantendo possibilidade de ajuste manual.
4. Texto aplicado inclui horario rastreavel para `buildFeedbackActionPayload` gerar tarefa na Central.
5. Modal do gerente exibe controle de selecao de acao antes do campo livre.
6. Modal admin/interno tambem pode selecionar a mesma acao padronizada.
7. Migration documenta/seed do catalogo versionado sem quebrar devolutivas existentes.
8. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- Reutilizar `buildFeedbackActionPayload`; nao criar outro mecanismo de tarefa.
- O banco de acoes pode iniciar como catalogo versionado local + migration seed para alinhar codigo e banco.
- O campo de texto livre permanece para ajustes; o select preenche uma acao pronta.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.
- Template/checklist formais do agente SM (`story-tmpl.yaml`, `story-draft-checklist.md`) nao existem neste checkout; usar formato local das stories `story-MX-EV*`.
- Arquivos `devLoadAlwaysFiles` e fallbacks definidos em `.aiox-core/core-config.yaml` nao existem neste checkout; usar padroes observados no codigo.

## Tasks / Subtasks

- [x] Criar testes vermelhos para catalogo e selecao de acao (AC: 1-4).
- [x] Criar teste de migration do catalogo versionado (AC: 7).
- [x] Implementar catalogo/helper de aplicacao de acao (AC: 1-4).
- [x] Integrar select nos modais de feedback gerente/admin (AC: 5-6).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 8).

## File List

- `docs/stories/story-MX-EV6-20260616-banco-acoes-feedback.md`
- `src/features/gerente-feedback/lib/feedback-action-catalog.ts`
- `src/features/gerente-feedback/lib/feedback-action-catalog.test.ts`
- `src/features/gerente-feedback/modals/AdminFeedbackModal.tsx`
- `src/features/gerente-feedback/modals/StoreFeedbackModal.tsx`
- `src/features/gerente-feedback/modals/FeedbackActionCatalogModal.test.tsx`
- `src/lib/feedback-action-catalog-migration.test.ts`
- `src/test/setup.ts`
- `supabase/migrations/20260617004000_feedback_action_catalog.sql`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- Template/checklist do SM ausentes no checkout; story segue formato local ja usado em `docs/stories/story-MX-EV*.md`.
- Arquivos `docs/framework/*` e fallbacks `docs/architecture/padroes-de-codigo.md`, `docs/architecture/pilha-tecnologica.md`, `docs/architecture/arvore-de-origem.md` ausentes no checkout.
- Red: `bun test src/features/gerente-feedback/lib/feedback-action-catalog.test.ts src/lib/feedback-action-catalog-migration.test.ts` falhou por modulo/migration ausentes.
- Red UI: `bun test src/features/gerente-feedback/modals/FeedbackActionCatalogModal.test.tsx` falhou por ausencia do controle `Acao padronizada`.
- Focused pass: `bun test src/features/gerente-feedback/lib/feedback-action-catalog.test.ts src/lib/feedback-action-catalog-migration.test.ts src/features/gerente-feedback/modals/FeedbackActionCatalogModal.test.tsx` -> 7 pass, 0 fail.
- Gate: `npm run typecheck` -> pass.
- Gate: `npm run lint` -> pass; `lint-tokens-ast` escaneou 516 arquivos.
- Gate: `npm test` -> 524 pass, 0 fail.
- Gate: `npm run build` -> pass.
- Gate: `git diff --check` -> pass.
- Extra: `command -v wsl` e `command -v coderabbit` sem binarios disponiveis no ambiente.

### Completion Notes

- Catalogo versionado local criado com quatro acoes operacionais obrigatorias e templates com horario rastreavel.
- Migration adiciona `feedback_action_catalog`, RLS de leitura ativa e seed idempotente do catalogo v1.
- Modal de gerente de loja e modal admin/interno exibem select `Acao padronizada` antes do campo livre.
- Selecao preenche `formData.action` com texto concreto usando vendedor e semana, preservando edicao manual do textarea.
- Setup de teste recebeu mock de `requestAnimationFrame` para permitir render de modais com `motion/react`.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-6.4 e dependencia EV-6.3.
- 2026-06-17: Implementado banco versionado de acoes, migration, selecao nos modais e validacao completa.
