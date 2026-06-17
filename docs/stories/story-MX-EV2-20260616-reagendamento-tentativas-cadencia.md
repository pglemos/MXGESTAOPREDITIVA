# Story MX-EV2-20260616 - Reagendamento Automatico de Tentativas

## Status

Ready for Review

## Story

**As a** vendedor,
**I want** que tentativas sem sucesso sejam reagendadas automaticamente,
**so that** nenhum cliente fique parado sem proxima acao.

## Source Requirements

- PRD EV-2.4: ao registrar "nao consegui contato", o sistema reagenda a acao para o proximo dia, nao para o mesmo dia.
- PRD EV-2.4: acao reagendada deve reaparecer na Central de Execucao no dia seguinte.
- PRD EV-2.4: limite de tentativas configuravel por fluxo; ao estourar, cliente cai em retorno em X dias ou status terminal.
- PRD EV-2.4: reagendamento nasce do motor de cadencia, nao de job isolado na UI.
- PRD EV-2.4: historico da tentativa deve ser registrado para analytics futuro.

## Acceptance Criteria

1. Passos do fluxo suportam limite configuravel de tentativas sem sucesso.
2. Estado da cadencia persiste tentativas do passo atual e total de reagendamentos sem sucesso.
3. Ao registrar `nao_feito` ou `aguardando` antes do limite, o RPC mantem o passo atual ativo e define `proxima_acao_em = CURRENT_DATE + 1`.
4. Ao atingir o limite, o RPC segue a transicao configurada para retorno futuro ou encerra a cadencia em status terminal quando nao ha fallback.
5. O historico registra tentativa, limite, se houve reagendamento automatico e se houve estouro de limite.
6. A Carteira deixa claro que `nao_feito` representa contato sem sucesso.
7. Existem testes automatizados para contrato da migration, regra de fluxo e interacao da UI.
8. Gates obrigatorios da story passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- EV-2.2 criou `cadencia_fluxos`, `cadencia_estado_cliente` e `inicializar_cadencia_cliente`.
- EV-2.3 criou `registrar_status_acao_cadencia` e os controles Feito / Nao feito / Aguardando.
- A Central de Execucao consome a data da proxima acao em EV-2.5; esta story garante que o motor grava a data correta para o dia seguinte.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.

## Tasks / Subtasks

- [x] Adicionar limite de tentativas aos passos padrao do fluxo (AC: 1).
- [x] Persistir tentativas/reagendamentos no estado de cadencia (AC: 2).
- [x] Atualizar RPC `registrar_status_acao_cadencia` para reagendar antes do limite e avancar/encerrar ao atingir limite (AC: 3, 4, 5).
- [x] Atualizar tipos gerados para novos campos do estado (AC: 2).
- [x] Ajustar microcopy do controle `nao_feito` na Carteira (AC: 6).
- [x] Adicionar testes de contrato, regra e UI (AC: 7).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 8).

## File List

- `docs/stories/story-MX-EV2-20260616-reagendamento-tentativas-cadencia.md`
- `supabase/migrations/20260616203000_cadencia_configuravel_vendedor.sql`
- `src/types/database.generated.ts`
- `src/features/crm/lib/cadencia.ts`
- `src/features/crm/lib/cadencia.test.ts`
- `src/features/crm/CarteiraClientes.container.tsx`
- `src/features/crm/CarteiraClientes.container.test.tsx`
- `src/lib/cadencia-configuravel-migration.test.ts`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- `bun test src/features/crm/lib/cadencia.test.ts src/lib/cadencia-configuravel-migration.test.ts src/features/crm/CarteiraClientes.container.test.tsx` - 14 pass.
- `npm run lint` - passou (`tsc --noEmit`, `lint-tokens-ast`, `eslint`).
- `npm run typecheck` - passou.
- `npm test` - 447 pass.
- `npm run build` - passou (`vite build`).
- `git diff --check` - passou.
- CodeRabbit local indisponivel: `command -v wsl` e `command -v coderabbit` sem resultado.

### Completion Notes

- `cadencia_estado_cliente` agora persiste `tentativas_passo`, `tentativa_limite` e `reagendamentos_sem_sucesso`.
- Passos de `cadencia_fluxos.passos` suportam `limiteTentativas`; os seeds globais foram atualizados para internet, carteira e porta.
- `registrar_status_acao_cadencia` mantem `nao_feito`/`aguardando` no mesmo passo e agenda para `CURRENT_DATE + 1` enquanto a tentativa esta abaixo do limite.
- Ao atingir o limite, a RPC segue a transicao configurada; se nao houver fallback, encerra a cadencia com status `cancelado`.
- Historico JSONB registra tentativa, limite, reagendamento automatico, estouro de limite e proxima data.
- Carteira renomeou o botao `nao_feito` para "Sem contato" mantendo o contrato `status: 'nao_feito'`.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-2.4.
- 2026-06-16: Implementado reagendamento automatico de tentativas e validado pelos gates obrigatorios.
