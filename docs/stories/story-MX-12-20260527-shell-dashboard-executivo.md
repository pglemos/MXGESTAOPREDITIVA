# Story MX-12.1 - Shell do Dashboard Executivo

## Status

InProgress

## Story

**As a** dono ou diretor,
**I want** um Dashboard Executivo com KPIs, blocos consultivos, filtros e estados pendentes,
**so that** eu veja decisoes e riscos sem cair em BI tradicional ou excesso de graficos.

## Executor Assignment

executor: "ux-design-expert"
quality_gate: "dev"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "browser responsive audit"]

## Epic Reference

- **Epic:** EPIC-MX-12 - Dashboard Executivo
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
- **Dependencies:** EPIC-MX-01, EPIC-MX-07, EPIC-MX-08, EPIC-MX-10, EPIC-MX-11
- **Related existing story:** `docs/stories/story-MX-03-20260527-shell-executivo-dono.md`
- **Current implementation candidates:** `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`, `src/features/dashboard-loja/sections/PerformanceTab.tsx`

## Context

Esta story entrega o shell visual do Dashboard Executivo. Ela pode consumir dados existentes e estados pendentes, mas nao deve fingir que score, benchmark ou agenda estao completos quando as engines ainda estiverem em construcao.

## Acceptance Criteria

1. Dashboard exibe filtros seguros de periodo e loja sem quebrar layout.
2. KPIs principais possuem slots para lucro bruto, margem, volume de vendas, estoque e MX Score.
3. Blocos de meta, alertas, score, gargalos, benchmark, evolucao, agenda e observacao consultiva estao presentes.
4. Cada bloco informa fonte e data de atualizacao quando houver dado real.
5. Blocos sem engine/fonte mostram estado pendente explicito.
6. UI prioriza cards e status, com poucos graficos.
7. Acesso fica restrito a perfis executivos/autorizados.
8. Desktop e mobile passam sem overflow horizontal.

## Tasks / Subtasks

- [x] Reconciliar shell com Home Dono e evitar duplicacao de blocos.
- [x] Definir grid responsivo do Dashboard Executivo.
- [x] Implementar filtros de periodo/loja com estados controlados.
- [x] Criar slots de KPIs e blocos consultivos.
- [x] Conectar dados reais existentes e marcar pendentes onde faltarem engines.
- [x] Validar permissao por perfil executivo/autorizado.
- [ ] Rodar browser audit desktop/mobile.
- [x] Rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- [x] Atualizar Dev Agent Record e File List antes de concluir.

## Dev Notes

- Nao transformar a tela em BI; usar leitura executiva de cards/status.
- Nao mascarar ausencia de dados estrategicos.
- Seguir Design System do EPIC-MX-01.
- Os arquivos de UI ja estao em WIP no working tree; antes de implementar, reconciliar cuidadosamente com alteracoes existentes.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Browser audit: desktop `1366x768`
- Browser audit: mobile `390x844`

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| KPIs principais | PRD §4.11 FR-DASH |
| Blocos executivos | PRD §4.11 FR-DASH |
| Poucos graficos | PRD §5.2 NFR-V7 |
| Home Dono relacionada | PRD §4.2 FR-HOME-1 |

## File List

- `docs/stories/story-MX-12-20260527-shell-dashboard-executivo.md`
- `src/components/Layout.tsx`
- `src/features/dashboard-loja/DashboardLoja.container.tsx`
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`
- `src/features/dashboard-loja/sections/PerformanceAlerts.tsx`
- `src/features/dashboard-loja/sections/PerformanceTab.tsx`
- `src/features/dashboard-loja/hooks/useDashboardLojaData.ts`
- `src/lib/auth/routeAccess.ts`

## Dev Agent Record

### Debug Log

- Story criada em modo YOLO via @sm para formalizar EPIC-MX-12.1.
- 2026-05-27: Reconciliado com `OwnerExecutiveCockpit`, que já entrega Home Dono/Dashboard Executivo por seções via `ownerSection`.
- 2026-05-27: Shell cobre KPIs de lucro bruto, margem, volume, estoque pendente e MX Score compacto, além de meta, alertas, plano de ação, evolução, departamentos, benchmark, agenda, biblioteca e consultor.
- 2026-05-27: Blocos sem engine/fonte completa aparecem como `Pendente`, preservando transparência para estoque, alguns departamentos e fontes futuras.
- 2026-05-27: Acesso passa por `/lojas/:storeSlug` em `src/App.tsx`, `RoleSwitch` e `src/lib/auth/routeAccess.ts`, restrito a perfis internos, dono e gerente conforme rota.
- 2026-05-27: Gates executados no lote MX: `npm run lint` passou com warnings preexistentes, `npm run typecheck` passou, `npm test` passou com 329 testes e `npm run build` passou.
- 2026-05-27: Browser audit autenticado ficou pendente porque o bypass local não possui loja/vínculo ativo suficiente para abrir o cockpit autenticado por RLS.

### Completion Notes

- Dashboard Executivo foi reconciliado como seção do cockpit do dono, evitando uma rota paralela de BI.
- O botão de filtros e o contexto de loja/período existem no shell; filtros avançados continuam dependentes das fontes/engines das epics de score, agenda e benchmarking.
- Ainda falta auditoria visual autenticada desktop/mobile com sessão real ou seed local de loja/membership.

### Change Log

- 2026-05-27: Story atualizada de `Draft` para `InProgress` com evidência de implementação existente e gates de qualidade.
