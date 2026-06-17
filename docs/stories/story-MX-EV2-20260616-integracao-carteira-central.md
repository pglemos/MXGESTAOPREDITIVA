# Story MX-EV2-20260616 - Integracao Carteira Central

## Status

Ready for Review

## Story

**As a** vendedor,
**I want** ver proximas acoes da cadencia na Central de Execucao,
**so that** eu abra o sistema e saiba o que executar hoje sem alternar para a Carteira.

## Source Requirements

- PRD EV-2.5: toda proxima acao com prazo hoje aparece na Agenda do Dia da Central.
- PRD EV-2.5: cada item mostra cliente, acao sugerida e horario.
- PRD EV-2.5: concluir o item na Central atualiza o status na Carteira e vice-versa.
- PRD EV-2.5: sistema sugere o que fazer em cada horario.
- PRD EV-2.5: expor proximas acoes por consulta/RPC compartilhada; conclusao idempotente para evitar dupla baixa.

## Acceptance Criteria

1. Existe RPC compartilhada para listar acoes ativas de cadencia do vendedor, com filtro opcional por data.
2. Central consome a RPC por hook dedicado e unifica acoes de cadencia com agendamentos reais na Agenda do Dia.
3. Linha de cadencia mostra horario sugerido, cliente, canal, status de cadencia e proxima acao.
4. Concluir acao de cadencia na Central chama o mesmo fluxo de status usado na Carteira (`registrar_status_acao_cadencia` via hook).
5. Atualizacao pela Central recarrega a agenda de cadencia e a carteira, mantendo a interligacao Carteira -> Central.
6. Existem testes automatizados para contrato da RPC, regra de horario sugerido e interacao basica da Central.
7. Gates obrigatorios da story passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- EV-2.2 criou estado versionado em `cadencia_estado_cliente`.
- EV-2.3 criou a RPC de status `registrar_status_acao_cadencia`.
- EV-2.4 garantiu que tentativas reagendadas gravam `proxima_acao_em` no dia correto.
- A tela atual da Central fica em `src/features/crm/CentralExecucao.container.tsx`.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Adicionar RPC `listar_acoes_cadencia_vendedor` na migration de cadencia (AC: 1).
- [x] Atualizar tipos gerados para a RPC (AC: 1).
- [x] Criar hook `useCadenciaAgenda` para consumir a RPC (AC: 2).
- [x] Unificar agendamentos e cadencia na tabela da Central com horario sugerido (AC: 2, 3).
- [x] Permitir concluir acao de cadencia pela Central usando o fluxo da Carteira (AC: 4, 5).
- [x] Adicionar testes de contrato, regra e UI (AC: 6).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 7).

## File List

- `docs/stories/story-MX-EV2-20260616-integracao-carteira-central.md`
- `supabase/migrations/20260616203000_cadencia_configuravel_vendedor.sql`
- `src/types/database.generated.ts`
- `src/features/crm/hooks/useCadenciaAgenda.ts`
- `src/features/crm/CentralExecucao.container.tsx`
- `src/features/crm/CentralExecucao.container.test.tsx`
- `src/features/crm/lib/cadencia.ts`
- `src/features/crm/lib/cadencia.test.ts`
- `src/lib/cadencia-configuravel-migration.test.ts`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- `bun test src/features/crm/lib/cadencia.test.ts src/lib/cadencia-configuravel-migration.test.ts src/features/crm/CentralExecucao.container.test.tsx` - 15 pass.
- `npm run lint` - passou (`tsc --noEmit`, `lint-tokens-ast`, `eslint`).
- `npm run typecheck` - passou.
- `npm test` - 450 pass.
- `npm run build` - passou (`vite build`).
- `git diff --check` - passou.
- CodeRabbit local indisponivel: `command -v wsl` e `command -v coderabbit` sem resultado.

### Completion Notes

- RPC `listar_acoes_cadencia_vendedor` lista acoes ativas de cadencia do vendedor com filtro opcional por data e permissao explicita.
- Hook `useCadenciaAgenda` consome a RPC e faz parsing defensivo dos itens.
- Central unifica agendamentos reais e acoes de cadencia na mesma tabela, com status "Cadencia" e horario sugerido por regra de acao/canal.
- Linha de cadencia possui WhatsApp e botoes de baixa Feito / Sem contato / Aguardando, chamando o mesmo `registrar_status_acao_cadencia` usado pela Carteira.
- A baixa pela Central recarrega `useCadenciaAgenda` e `useClientes`, mantendo a interligacao Carteira -> Central.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-2.5.
- 2026-06-16: Implementada integracao Carteira -> Central e validada pelos gates obrigatorios.
