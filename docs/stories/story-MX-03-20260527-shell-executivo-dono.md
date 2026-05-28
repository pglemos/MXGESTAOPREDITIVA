# Story MX-03.1 - Shell Executivo do Dono / Diretor

## Status

InProgress

## Story

**As a** Dono ou Diretor de loja,
**I want** abrir uma Home executiva com KPIs, alertas, agenda, plano de acao e score por departamento,
**so that** eu consiga decidir rapidamente o que cobrar, acompanhar ou priorizar sem navegar por muitas telas.

## Executor Assignment

executor: "ux-design-expert"
quality_gate: "dev"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "browser responsive audit"]

## Epic Reference

- **Epic:** EPIC-MX-03 - Home Dono / Diretor
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
- **Related existing story:** `docs/stories/story-OWNER-20260526-cockpit-executivo-dono.md`
- **Current implementation candidates:** `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`, `src/components/Layout.tsx`, `src/features/dashboard-loja/sections/PerformanceTab.tsx`

## Context

Esta story formaliza o primeiro corte executavel do EPIC-MX-03. Parte da implementacao ja aparece no working tree atual, especialmente no cockpit do dono e na navegacao por `ownerSection`. O objetivo aqui e transformar esse trabalho em uma story verificavel, sem inventar dados e sem reabrir a arquitetura.

## Acceptance Criteria

1. Perfil `dono` ou equivalente executivo acessa a Home em `/lojas/:storeSlug`.
2. A primeira tela contem KPIs executivos, alertas importantes, plano de acao, score por departamento, agenda executiva e proximas acoes.
3. KPIs com fonte real exibem valor real; itens sem fonte mostram estado pendente, nao numero falso.
4. O dono nao precisa navegar por menus profundos para entender prioridades do dia.
5. Alertas exibem problema, impacto, recomendacao e acao rapida quando a fonte existe.
6. A navegacao do dono aponta para Home, Central MX, Resultados, Visitas, Departamentos, Treinamentos e Falar com Consultor conforme PRD.
7. Desktop e mobile nao apresentam overflow horizontal, texto cortado, icones desalinhados ou sobreposicao.
8. Gerente, vendedor e perfis internos nao perdem suas rotas atuais.

## Tasks / Subtasks

- [x] Reconciliar esta story com `story-OWNER-20260526-cockpit-executivo-dono.md`.
- [x] Validar se `OwnerExecutiveCockpit.tsx` cobre o shell executivo esperado.
- [x] Confirmar fontes reais para vendas, meta, funil, DRE, score e agenda.
- [x] Marcar explicitamente estados pendentes para estoque, ticket medio, ano anterior ou fonte ausente.
- [x] Validar navegacao por `ownerSection` para planejamento, plano de acao, alertas, benchmarking, agenda, visitas, departamentos, consultor e biblioteca.
- [ ] Rodar browser audit desktop e mobile autenticado como dono.
- [x] Rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- [x] Atualizar Dev Agent Record e File List antes de concluir.

## Dev Notes

- Nao criar dado ficticio para preencher imagem ou layout.
- Preferir componentes e tokens existentes do Design System.
- Usar `AlertCard` quando a estrutura de alerta exigir problema, impacto, recomendacao e acao.
- Manter o escopo em Home executiva; detalhes profundos podem ficar como drill-down planejado.
- Preservar trabalho em progresso do usuario no working tree.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Browser audit: dono desktop `1366x768`
- Browser audit: dono mobile `390x844`

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| KPIs e blocos da Home Dono | PRD §4.2 FR-HOME-1 |
| Experiencia por alertas e prioridades | PRD §4.2 FR-HOME-1 |
| Estrutura obrigatoria de alerta | PRD §4.6 FR-ALERT-2 |
| Score por departamento | PRD §4.7 FR-SCORE-3 |
| Agenda executiva | PRD §4.10 FR-AGENDA |

## File List

- `docs/stories/story-MX-03-20260527-shell-executivo-dono.md`
- `src/components/Layout.tsx`
- `src/features/dashboard-loja/DashboardLoja.container.tsx`
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`
- `src/features/dashboard-loja/sections/PerformanceAlerts.tsx`
- `src/features/dashboard-loja/sections/PerformanceTab.tsx`

## Dev Agent Record

### Debug Log

- Story criada em modo YOLO via @sm para formalizar EPIC-MX-03.1.
- @dev validou que `PerformanceTab` roteia `isOwner` para `OwnerExecutiveCockpit`.
- @dev validou que `OwnerExecutiveCockpit` cobre home executiva, planejamento, resultados, plano de acao, alertas, benchmarking, agenda, visitas, departamentos, biblioteca e consultor via `ownerSection`.
- @dev validou estados pendentes explicitos para estoque, DRE/margem, benchmark, agenda e fontes incompletas.
- Browser audit autenticado ficou bloqueado no ambiente local: dev bypass nao possui loja ativa/vinculo via RLS para concluir simulacao de dono.

### Completion Notes

- Gates de codigo passaram com a implementacao atual do cockpit executivo.
- A story permanece `InProgress` ate browser audit autenticado real.

### Change Log

- 2026-05-27: Validacao tecnica do shell executivo existente e registro de gates.
