# Story MX-EV2-20260616 - Status da Acao de Cadencia

## Status

Ready for Review

## Story

**As a** vendedor,
**I want** marcar a acao da cadencia como Feito, Nao feito ou Aguardando,
**so that** o sistema recalcule o proximo ciclo do cliente sem ele sair do fluxo.

## Source Requirements

- PRD EV-2.3: cada acao do cliente tem 3 status: Feito, Nao feito, Aguardando.
- PRD EV-2.3: status escolhido cria o proximo ciclo da cadencia.
- PRD EV-2.3: observacao livre nao e obrigatoria por padrao.
- PRD EV-2.3: Nao feito e Aguardando mantem o cliente vivo no fluxo.

## Acceptance Criteria

1. Existe RPC para registrar status de acao de cadencia com valores `feito`, `nao_feito` e `aguardando`.
2. A RPC atualiza `cadencia_estado_cliente`, registra historico e recalcula `passo_atual_key`, `proxima_acao` e `proxima_acao_em`.
3. `nao_feito` e `aguardando` seguem as transicoes do fluxo e mantem o estado ativo quando ha proximo passo.
4. A Carteira exibe controles Feito / Nao feito / Aguardando no painel "Fluxo do Cliente".
5. O clique em qualquer status chama a RPC e atualiza a carteira sem exigir observacao.
6. Existem testes automatizados para contrato da RPC e interacao basica da UI.
7. Gates obrigatorios da story passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- EV-2.2 criou `cadencia_fluxos`, `cadencia_estado_cliente` e `inicializar_cadencia_cliente`.
- A UI atual da Carteira fica em `src/features/crm/CarteiraClientes.container.tsx`.
- O hook de carteira fica em `src/features/crm/hooks/useClientes.ts`.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Adicionar RPC `registrar_status_acao_cadencia` na migration de cadencia (AC: 1, 2, 3).
- [x] Atualizar tipos gerados para a RPC (AC: 1).
- [x] Expor `registrarStatusCadencia` em `useClientes` (AC: 5).
- [x] Adicionar controles Feito / Nao feito / Aguardando no painel da Carteira (AC: 4, 5).
- [x] Adicionar testes de contrato da migration e UI (AC: 6).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 7).

## File List

- `docs/stories/story-MX-EV2-20260616-status-acao-cadencia.md`
- `supabase/migrations/20260616203000_cadencia_configuravel_vendedor.sql`
- `src/types/database.generated.ts`
- `src/features/crm/hooks/useClientes.ts`
- `src/features/crm/CarteiraClientes.container.tsx`
- `src/features/crm/CarteiraClientes.container.test.tsx`
- `src/features/checkin/sections/CheckinCrmSection.test.tsx`
- `src/lib/cadencia-configuravel-migration.test.ts`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- `bun test src/lib/cadencia-configuravel-migration.test.ts src/features/crm/CarteiraClientes.container.test.tsx` - 6 pass.
- `npm run lint` - passou (`tsc --noEmit`, `lint-tokens-ast`, `eslint`).
- `npm run typecheck` - passou.
- `npm test` - 442 pass.
- `npm run build` - passou (`vite build`).
- `git diff --check` - passou.
- CodeRabbit local indisponivel: `command -v wsl` e `command -v coderabbit` sem resultado.

### Completion Notes

- RPC `registrar_status_acao_cadencia` aceita somente `feito`, `nao_feito` e `aguardando`.
- A RPC le o passo atual, escolhe a transicao correspondente, grava historico JSONB e atualiza `cadencia_estado_cliente` e `clientes.proxima_acao`.
- Para `nao_feito` e `aguardando`, se nao houver transicao declarada, o cliente permanece ativo no mesmo passo com novo prazo.
- `useClientes` expoe `registrarStatusCadencia`, retornando erro textual como os demais metodos CRM.
- Painel "Fluxo do Cliente" exibe botoes Feito / Nao feito / Aguardando sem exigir observacao.
- Teste de UI valida que clicar em Feito chama `registrarStatusCadencia({ clienteId, status: 'feito' })`.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-2.3.
- 2026-06-16: Implementado registro de status da acao de cadencia e validado pelos gates obrigatorios.
