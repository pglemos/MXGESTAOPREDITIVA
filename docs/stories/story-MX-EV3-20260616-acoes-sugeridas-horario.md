# Story MX-EV3-20260616 - Acoes Sugeridas por Horario na Central

## Status

Ready for Review

## Story

**As a** vendedor,
**I want** ver na Central o que executar em cada horario,
**so that** eu siga um roteiro unico de agendamentos, cadencia e feedback sem consultar telas separadas.

## Source Requirements

- PRD EV-3.4: proximas acoes da cadencia entram na Agenda do Dia com horario sugerido.
- PRD EV-3.4: acoes reagendadas aparecem automaticamente.
- PRD EV-3.4: feedback do gestor com acao aparece como item com alerta vermelho ate concluir.
- PRD EV-3.4: Novo Compromisso cria agendamento real.
- PRD EV-3.4: manter origem rastreavel na lista ordenada por horario.

## Acceptance Criteria

1. Central agrega `agendamentos`, `cadencia` e `feedback` em uma agenda unica.
2. Itens de cadencia usam horario sugerido pelo motor e permitem baixa por status.
3. Acoes reagendadas pela cadencia reaparecem quando `proxima_acao_em` muda.
4. Acoes de feedback aparecem com alerta vermelho ate conclusao.
5. Novo compromisso continua criando `agendamentos` reais.
6. Testes cobrem cadencia e feedback na agenda da Central.
7. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- EV-2.5 entregou `useCadenciaAgenda`, RPC compartilhada e baixa de status pela Central.
- EV-6.3 entregou `devolutiva_acoes`, `useFeedbackActions` e origem `feedback` na Central.
- Esta story reconcilia o escopo EV-3.4 porque a implementacao ficou distribuida nas stories dependentes.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.
- Arquivos `devLoadAlwaysFiles` e fallbacks definidos em `.aiox-core/core-config.yaml` nao existem neste checkout; usar padroes observados no codigo.

## Tasks / Subtasks

- [x] Confirmar origem `cadencia` na agenda unificada (AC: 1-3).
- [x] Confirmar origem `feedback` com alerta vermelho e baixa (AC: 1, 4).
- [x] Confirmar que novo compromisso segue usando `agendamentos` reais (AC: 5).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 6-7).

## File List

- `docs/stories/story-MX-EV3-20260616-acoes-sugeridas-horario.md`
- `src/features/crm/CentralExecucao.container.tsx`
- `src/features/crm/CentralExecucao.container.test.tsx`
- `src/features/crm/hooks/useCadenciaAgenda.ts`
- `src/features/crm/hooks/useFeedbackActions.ts`
- `src/features/crm/lib/cadencia.ts`
- `src/features/gerente-feedback/lib/feedback-actions.ts`
- `supabase/migrations/20260616203000_cadencia_configuravel_vendedor.sql`
- `supabase/migrations/20260617001000_devolutiva_acoes_central.sql`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- Arquivos `docs/framework/*` e fallbacks `docs/architecture/padroes-de-codigo.md`, `docs/architecture/pilha-tecnologica.md`, `docs/architecture/arvore-de-origem.md` ausentes no checkout.
- Teste focado: `bun test src/features/crm/CentralExecucao.container.test.tsx` - cobriu cadencia e feedback na Central.
- `npm run typecheck` - passou.
- `npm run lint` - passou, incluindo token lint em 512 arquivos.
- `npm test` - passou, 499 testes.
- `npm run build` - passou.
- `git diff --check` - passou.
- `command -v wsl` - indisponivel neste ambiente.
- `command -v coderabbit` - indisponivel neste ambiente.

### Completion Notes

- Central lista agendamentos, cadencia e feedback com origem rastreavel.
- Cadencia usa horario sugerido e baixa de status compartilhada com Carteira.
- Feedback entra como alerta vermelho ate conclusao pela Central.
- Novo compromisso permanece em `agendamentos`, sem criar entidade paralela.

### Change Log

- 2026-06-16: Story reconciliada a partir de PRD EV-3.4 com evidencias de EV-2.5 e EV-6.3.
