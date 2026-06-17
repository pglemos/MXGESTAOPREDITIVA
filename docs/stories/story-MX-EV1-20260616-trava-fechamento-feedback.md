# Story MX-EV1-20260616 - Trava de Fechamento por Acao de Feedback

## Status

Ready for Review

## Story

**As a** gerente,
**I want** exigir conclusao ou justificativa quando ha acao obrigatoria de feedback pendente,
**so that** o fechamento diario reforce a execucao combinada na devolutiva.

## Source Requirements

- PRD EV-1.4: se ha acao de feedback pendente do dia, o botao de finalizar fechamento exige observacao obrigatoria com motivo de nao cumprimento.
- PRD EV-1.4: a trava vale apenas quando a loja/gerente configurou a acao como obrigatoria.
- PRD EV-6.3: a acao percorre Central e Fechamento como alerta final.
- PRD EV-6.3: tarefa deve ser rastreavel e vinculada a devolutiva original.

## Acceptance Criteria

1. Fechamento diario identifica acoes de feedback pendentes com `obrigatoria_fechamento=true`.
2. Sem acao obrigatoria pendente, o fechamento preserva o comportamento atual.
3. Com acao obrigatoria pendente e sem observacao suficiente, o submit e bloqueado.
4. Com acao obrigatoria pendente e observacao suficiente, o fechamento salva.
5. Apos salvar, a acao obrigatoria e marcada como `justificada` com a observacao do vendedor.
6. A trava nao se aplica a ajustes tecnicos/historicos (`metricScope=adjustment`).
7. Existem testes automatizados para a regra de bloqueio e justificativa.
8. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- EV-6.3 criou `devolutiva_acoes`, `obrigatoria_fechamento`, `status` e `justificativa`.
- A justificativa operacional ja existe como `CheckinForm.note`.
- Esta story nao cria UI de configuracao da obrigatoriedade; usa o contrato persistido para quando a loja/gerente marcar a acao como obrigatoria.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.
- Arquivos `devLoadAlwaysFiles` e fallbacks definidos em `.aiox-core/core-config.yaml` nao existem neste checkout; usar padroes observados no codigo.

## Tasks / Subtasks

- [x] Criar testes vermelhos para regra de bloqueio/justificativa (AC: 1-7).
- [x] Criar helper puro de trava de fechamento por acao obrigatoria (AC: 1-4, 6).
- [x] Estender hook de acoes de feedback para justificar obrigatorias apos fechamento (AC: 5).
- [x] Integrar trava em `useCheckinPage` antes do submit (AC: 1-6).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 8).

## File List

- `docs/stories/story-MX-EV1-20260616-trava-fechamento-feedback.md`
- `src/features/checkin/lib/feedback-action-lock.ts`
- `src/features/checkin/lib/feedback-action-lock.test.ts`
- `src/features/checkin/hooks/useCheckinPage.ts`
- `src/features/checkin/sections/CheckinForm.tsx`
- `src/features/crm/hooks/useFeedbackActions.ts`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- Arquivos `docs/framework/*` e fallbacks `docs/architecture/padroes-de-codigo.md`, `docs/architecture/pilha-tecnologica.md`, `docs/architecture/arvore-de-origem.md` ausentes no checkout.
- Teste vermelho inicial: `bun test src/features/checkin/lib/feedback-action-lock.test.ts` falhou por helper ausente.
- Teste focado final: `bun test src/features/checkin/lib/feedback-action-lock.test.ts src/features/gerente-feedback/lib/feedback-actions.test.ts src/features/crm/CentralExecucao.container.test.tsx` - 9 pass.
- `npm run typecheck` - passou.
- `npm run lint` - passou, incluindo token lint em 512 arquivos.
- `npm test` - passou, 499 testes.
- `npm run build` - passou.
- `git diff --check` - passou.
- `command -v wsl` - indisponivel neste ambiente.
- `command -v coderabbit` - indisponivel neste ambiente.

### Completion Notes

- Helper `resolveFeedbackActionCloseLock` bloqueia fechamento diario quando ha acao obrigatoria pendente sem observacao suficiente.
- `useCheckinPage` aplica a trava antes de `saveCheckin` e ignora ajustes tecnicos/historicos.
- `CheckinForm` exibe alerta final quando ha acao obrigatoria de feedback pendente.
- `useFeedbackActions` registra justificativa em lote apos o fechamento salvo, marcando a acao como `justificada`.
- Comportamento atual permanece inalterado quando nao ha acao obrigatoria pendente.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-1.4 / EV-6.3.
- 2026-06-16: Implementada trava de fechamento por acao obrigatoria de feedback e validada por testes focados, gates globais e build.
