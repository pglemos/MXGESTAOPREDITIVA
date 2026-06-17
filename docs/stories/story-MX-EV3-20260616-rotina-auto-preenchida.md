# Story MX-EV3-20260616 - Rotina Auto Preenchida

## Status

Ready for Review

## Story

**As a** vendedor,
**I want** que a rotina do dia seja marcada automaticamente por eventos reais,
**so that** eu foque em executar e nao em registrar checks manuais.

## Source Requirements

- PRD EV-3.3: Atendimento faz check ao atingir minimo configuravel de atendimentos.
- PRD EV-3.3: Organizacao do dia faz check ao atualizar status dos clientes na Central.
- PRD EV-3.3: Novos Clientes / Contato com novos leads faz check ao preencher agendamentos ou cadastrar cliente.
- PRD EV-3.3: Fechamento do dia faz check ao concluir Fechamento Diario.
- PRD EV-3.3: itens sem fonte de dado podem passar batido, sem check manual obrigatorio.
- PRD EV-3.3: horarios da rotina ajustados conforme jornada cadastrada no Meu Perfil.
- PRD EV-3.3: tela apenas visual, sem botao de marcacao manual obrigatoria.

## Acceptance Criteria

1. Existe helper puro para derivar a Rotina do Dia a partir de eventos reais.
2. Atendimento fica concluido ao atingir o minimo configuravel de atendimentos do dia.
3. Organizacao fica concluida quando ha cliente atualizado/interagido no dia.
4. Novos Clientes e Contato com Leads ficam concluidos quando ha cliente cadastrado ou agendamento criado no dia.
5. Fechamento fica concluido quando existe fechamento diario do dia.
6. Mentalidade aparece como item sem fonte obrigatoria, sem exigir acao manual.
7. Horarios sao recalculados dentro da jornada do vendedor quando `hora_entrada` e `hora_saida` existem.
8. Central usa o helper e nao usa mais estado baseado apenas no relogio atual para marcar checks.
9. Existem testes automatizados para helper e renderizacao basica da Central.
10. Gates obrigatorios da story passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- `src/lib/daily-routine.ts` ja concentra helpers de rotina/fechamento.
- `src/features/crm/CentralExecucao.container.tsx` ja consome clientes, agendamentos, cadencia e fechamento do dia.
- `src/features/crm/hooks/useAtendimentos.ts` fornece contagem real de atendimentos do dia.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Adicionar helper de derivacao da rotina em `daily-routine.ts` (AC: 1-7).
- [x] Integrar `useAtendimentos` e eventos reais na Central (AC: 2-8).
- [x] Remover dependencia de check visual puramente baseado no horario atual (AC: 8).
- [x] Adicionar testes do helper e da Central (AC: 9).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 10).

## File List

- `docs/stories/story-MX-EV3-20260616-rotina-auto-preenchida.md`
- `src/lib/daily-routine.ts`
- `src/lib/daily-routine.test.ts`
- `src/features/crm/CentralExecucao.container.tsx`
- `src/features/crm/CentralExecucao.container.test.tsx`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- `bun test src/lib/daily-routine.test.ts src/features/crm/CentralExecucao.container.test.tsx` - 9 pass.
- `npm run lint` - passou (`tsc --noEmit`, `lint-tokens-ast`, `eslint`).
- `npm run typecheck` - passou.
- `npm test` - 453 pass.
- `npm run build` - passou (`vite build`).
- `git diff --check` - passou.
- CodeRabbit local indisponivel: `command -v wsl` e `command -v coderabbit` sem resultado.

### Completion Notes

- `daily-routine.ts` agora deriva os sete itens da rotina a partir de contadores reais e trata Mentalidade como `not_required`.
- Atendimento conclui ao atingir o minimo configuravel informado ao helper; a Central usa 5 atendimentos como minimo inicial do PRD.
- Organizacao usa clientes com `ultima_interacao` no dia; Novos Leads/Prospeccao usam clientes/agendamentos criados no dia.
- Lista Quente usa agenda/cadencia com negociacao ou proposta para o dia; Fechamento usa `todayCheckin`.
- Horarios da timeline sao distribuidos dentro da jornada quando `hora_entrada` e `hora_saida` existem no perfil.
- Central deixou de marcar rotina pelo relogio atual e passou a renderizar estados calculados pelo helper.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-3.3.
- 2026-06-16: Implementado auto-preenchimento da rotina e validado pelos gates obrigatorios.
