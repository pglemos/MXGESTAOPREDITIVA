# Story MX-EV6-20260616 - Acao de Feedback na Central

## Status

Ready for Review

## Story

**As a** vendedor,
**I want** receber a acao definida no feedback como item rastreavel na Central de Execucao,
**so that** eu execute a orientacao do gestor durante a rotina e nao deixe a devolutiva morrer no historico.

## Source Requirements

- PRD EV-6.3: acao definida no feedback vira item recorrente na Central de Execucao, no horario.
- PRD EV-6.3: alerta visual vermelho persiste ate a acao ser concluida.
- PRD EV-6.3: a acao percorre Central e Fechamento como base para EV-1.4.
- PRD EV-6.3: tarefa precisa ser rastreavel e vinculada a devolutiva original.
- PRD EV-3.4: feedback do gestor com acao aparece como item com alerta vermelho ate concluir.

## Acceptance Criteria

1. Existe tabela/contrato persistido para acoes de feedback com vinculo a `devolutivas`.
2. Criar feedback com `action` gera ou atualiza acao rastreavel para o vendedor.
3. A Central lista acoes de feedback pendentes do dia junto com agendamentos/cadencia.
4. Item de feedback tem origem rastreavel, status proprio e tom visual de alerta vermelho enquanto pendente.
5. Vendedor consegue concluir a acao de feedback pela Central.
6. Acao concluida deixa de aparecer como pendente nos filtros de hoje/atrasados.
7. Existem testes automatizados para contrato da migration, payload e montagem da agenda.
8. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- `devolutivas.action` ja e obrigatoria na tela do gerente; EV-6.2 adicionou `caso_motivo`.
- Central ja agrega `agendamentos` e `cadencia`; esta story adiciona origem `feedback` preservando rastreabilidade.
- EV-1.4 fica para uma story seguinte usando o mesmo contrato de acoes pendentes/justificadas.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.
- Arquivos `devLoadAlwaysFiles` e fallbacks definidos em `.aiox-core/core-config.yaml` nao existem neste checkout; usar padroes observados no codigo.

## Tasks / Subtasks

- [x] Criar testes vermelhos para migration e helper de agenda de feedback (AC: 1-7).
- [x] Criar migration/tipos para `devolutiva_acoes` (AC: 1).
- [x] Gerar/upsert de acao ao salvar feedback (AC: 2).
- [x] Criar hook/mapper para acoes de feedback na Central (AC: 3-4).
- [x] Adicionar conclusao de acao de feedback na Central (AC: 5-6).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 8).

## File List

- `docs/stories/story-MX-EV6-20260616-acao-feedback-central.md`
- `supabase/migrations/20260617001000_devolutiva_acoes_central.sql`
- `src/lib/devolutiva-acoes-migration.test.ts`
- `src/features/gerente-feedback/lib/feedback-actions.ts`
- `src/features/gerente-feedback/lib/feedback-actions.test.ts`
- `src/features/crm/hooks/useFeedbackActions.ts`
- `src/features/crm/hooks/useExecutionActions.ts`
- `src/features/crm/CentralExecucao.container.tsx`
- `src/features/crm/CentralExecucao.container.test.tsx`
- `supabase/migrations/20260617006000_pdi_vendedor_execucao_actions.sql`
- `src/lib/pdi-vendedor-execution-actions-migration.test.ts`
- `src/hooks/useFeedbacks.ts`
- `src/types/database.generated.ts`
- `src/pages/VendedorFeedback.tsx`
- `src/pages/VendedorFeedback.test.tsx`
- `src/features/crm/hooks/useOportunidades.test.ts`
- `src/pages/VendedorTreinamentos.test.tsx`
- `src/features/vendedor-home/VendedorHome.container.test.tsx`
- `src/features/crm/FunilVendedor.container.test.tsx`
- `src/pages/VendedorPDI.test.tsx`
- `src/pages/VendedorPDI.tsx`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- Arquivos `docs/framework/*` e fallbacks `docs/architecture/padroes-de-codigo.md`, `docs/architecture/pilha-tecnologica.md`, `docs/architecture/arvore-de-origem.md` ausentes no checkout.
- Testes vermelhos iniciais: `bun test src/features/gerente-feedback/lib/feedback-actions.test.ts src/lib/devolutiva-acoes-migration.test.ts` falhou por helper e migration ausentes.
- Teste focado final: `bun test src/features/gerente-feedback/lib/feedback-actions.test.ts src/lib/devolutiva-acoes-migration.test.ts src/features/crm/CentralExecucao.container.test.tsx src/features/gerente-feedback/lib/validation.test.ts src/features/gerente-feedback/sections/FeedbackList.test.tsx` - 12 pass.
- `npm run typecheck` - passou.
- `npm run lint` - passou, incluindo token lint em 511 arquivos.
- `npm test` - passou, 495 testes.
- `npm run build` - passou.
- `git diff --check` - passou.
- `command -v wsl` - indisponivel neste ambiente.
- `command -v coderabbit` - indisponivel neste ambiente.
- Ajuste tela Feedback vendedor: `bun test src/pages/VendedorFeedback.test.tsx` - passou, 5 testes.
- Gate tela Feedback: `bun test src/features/crm/hooks/useOportunidades.test.ts src/pages/VendedorFeedback.test.tsx src/pages/VendedorTreinamentos.test.tsx src/features/vendedor-home/VendedorHome.container.test.tsx src/features/crm/FunilVendedor.container.test.tsx` - passou.
- Gate tela Feedback: `npm run typecheck` - passou.
- Gate tela Feedback: `npm run lint` - passou, incluindo token lint em 522 arquivos.
- Gate tela Feedback: `npm test` - passou.
- Gate tela Feedback: `npm run build` - passou.
- Gate tela Feedback: `git diff --check` - passou.
- Ajuste auxiliar de gate: `bun test src/pages/VendedorPDI.test.tsx` - passou, 5 testes.
- Gate workspace atual: `npm test` - passou, 548 testes.
- Gate workspace atual: `npm run build` - passou.

### Completion Notes

- Nova tabela `devolutiva_acoes` registra acao rastreavel com vinculo a `devolutivas`, status, recorrencia, horario sugerido e flag futura de trava de fechamento.
- Ao salvar feedback, `useFeedbacks` cria/atualiza uma acao pendente por `devolutiva_id`.
- Helper `buildFeedbackActionPayload` normaliza texto, horario e payload de acao.
- Hook `useFeedbackActions` lista acoes pendentes do vendedor e permite concluir pela Central.
- `CentralExecucao` agrega `feedback` como terceira origem de agenda, com alerta vermelho e botao de conclusao.
- Testes cobrem migration, helper e renderizacao/conclusao da acao de feedback na Central.
- `VendedorFeedback` segue a hierarquia final: header, 6 KPIs, acoes vinculadas, pendencias, lateral de orientacao/impacto/Central, historico e evolucao.
- Feedback pendente exibe motivo/caso, indicador, responsavel e acao vinculada; comentario, detalhe da acao e justificativa usam modais.
- Confirmacao de leitura nao conclui acao obrigatoria; a acao permanece pendente ate execucao ou justificativa.
- Ajuste Tecnico permanece fora de Feedback.
- `execution_actions` criado como persistencia propria da Central para acoes rastreaveis de PDI/funil/manual, mantendo `devolutiva_acoes` para feedback recorrente.
- `CentralExecucao` passa a agregar acoes persistidas de `execution_actions` e permite concluir item PDI pela Central.
- Validacao 2026-06-17: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` passaram; teste focado `bun test src/pages/VendedorPDI.test.tsx src/features/crm/CentralExecucao.container.test.tsx src/lib/pdi-vendedor-execution-actions-migration.test.ts` tambem passou.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-6.3 / EV-3.4.
- 2026-06-16: Implementada acao de feedback na Central e validada por testes focados, gates globais e build.
- 2026-06-17: Ajustada tela Feedback do vendedor conforme hierarquia final aprovada e validada por testes/gates.
- 2026-06-17: Adicionada persistencia propria da Central para acoes enviadas do PDI e teste focado de conclusao.
