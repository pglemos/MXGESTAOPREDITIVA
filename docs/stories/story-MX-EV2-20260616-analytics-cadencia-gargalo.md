# Story MX-EV2-20260616 - Analytics de Cadencia e Gargalo

## Status

Ready for Review

## Story

**As a** gerente ou marketing,
**I want** enxergar gargalos da cadencia, demanda por veiculo e conversao por fluxo,
**so that** eu corrija a etapa onde o cliente para e melhore o fluxo comercial.

## Source Requirements

- PRD EV-2.6: relatorio mostra em qual etapa do fluxo o cliente para.
- PRD EV-2.6: agrega modelo/tipo de veiculo de interesse por loja como demanda real.
- PRD EV-2.6: calcula taxa de conversao por fluxo/versionamento.
- PRD EV-2.6: usa fluxo aplicado ao cliente e eventos por etapa/canal/loja.
- PRD EV-2.6: prepara base para feedback autonomo (EV-6.5).

## Acceptance Criteria

1. Existe motor puro de analytics a partir de `cadencia_estado_cliente` e oportunidades.
2. Gargalos sao agregados por etapa atual, status, resultado e reagendamentos.
3. Demanda de veiculo agrega oportunidades por `tipo_veiculo`.
4. Conversao por fluxo considera `fluxo_id`, `fluxo_version` e oportunidades ganhas por cliente.
5. Relatorio do vendedor exibe gargalos, demanda e conversao quando houver dados.
6. Empty state permanece honesto quando nao ha estados de cadencia.
7. Existem testes automatizados para os agregados principais.
8. Gates obrigatorios passam: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Notes

- EV-2.2 a EV-2.5 ja criaram `cadencia_estado_cliente`, `historico`, `fluxo_version`, `last_result` e `reagendamentos_sem_sucesso`.
- `oportunidades` ja possui `cliente_id`, `etapa`, `tipo_veiculo`, `canal` e `valor_negociado`.
- A primeira entrega sera leitura/agregacao operacional; alertas automaticos do autonomo ficam em EV-6.5.
- ClickUp/MCP nao esta habilitado (`mcp.enabled: false`), entao esta story foi criada apenas localmente.
- Arquivos `devLoadAlwaysFiles` e fallbacks definidos em `.aiox-core/core-config.yaml` nao existem neste checkout; usar padroes observados no codigo.

## Tasks / Subtasks

- [x] Criar testes vermelhos para motor de analytics (AC: 1-4, 7).
- [x] Implementar helper puro `buildCadenciaAnalytics` (AC: 1-4).
- [x] Criar hook de leitura de estados de cadencia (AC: 1, 5-6).
- [x] Integrar blocos de analytics no relatorio do vendedor (AC: 5-6).
- [x] Rodar gates e atualizar File List / Dev Agent Record (AC: 8).

## File List

- `docs/stories/story-MX-EV2-20260616-analytics-cadencia-gargalo.md`
- `src/features/crm/RelatoriosVendedor.container.tsx`
- `src/features/crm/RelatoriosVendedor.container.test.tsx`
- `src/features/crm/hooks/useCadenciaAnalytics.ts`
- `src/features/crm/lib/cadencia-analytics.ts`
- `src/features/crm/lib/cadencia-analytics.test.ts`

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Story criada localmente por indisponibilidade de ClickUp/MCP no `core-config.yaml`.
- Arquivos `docs/framework/*` e fallbacks `docs/architecture/padroes-de-codigo.md`, `docs/architecture/pilha-tecnologica.md`, `docs/architecture/arvore-de-origem.md` ausentes no checkout.
- TDD: teste focado inicial de `cadencia-analytics` validou gargalos, demanda e conversao por fluxo.
- Mock do relatorio ajustado para preservar exports nomeados de `useClientes` e `useOportunidades` usados por testes de contrato.
- `bun test src/features/crm/RelatoriosVendedor.container.test.tsx src/features/crm/hooks/useClientes.test.ts src/features/crm/hooks/useOportunidades.test.ts src/features/crm/lib/cadencia-analytics.test.ts` - 8 pass, 0 fail.
- `npm run typecheck` - exit 0.
- `npm run lint` - exit 0; token lint OK em 514 arquivos.
- `npm test` - 503 pass, 0 fail.
- `npm run build` - exit 0; Vite build concluido.
- `git diff --check` - exit 0.
- `command -v wsl` - exit 1 sem output; indisponivel neste ambiente.
- `command -v coderabbit` - exit 1 sem output; indisponivel neste ambiente.

### Completion Notes

- `buildCadenciaAnalytics` agrega estados reais de `cadencia_estado_cliente` por etapa, status, resultado e reagendamentos sem sucesso.
- A demanda por veiculo usa `tipo_veiculo` das oportunidades e preserva fallback honesto para registros sem tipo.
- A conversao por fluxo usa `fluxo_id` + `fluxo_version`, clientes em cadencia e oportunidades ganhas por cliente.
- `useCadenciaAnalytics` le estados por vendedor ou loja ativa e entrega loading, error, empty state e refetch ao relatorio.
- `RelatoriosVendedor` exibe gargalos, demanda por veiculo e conversao por fluxo quando ha dados, mantendo empty state quando nao ha cadencia.

### Change Log

- 2026-06-16: Story criada a partir de PRD EV-2.6.
- 2026-06-16: Implementados motor, hook, UI de relatorio e testes para analytics de cadencia.
