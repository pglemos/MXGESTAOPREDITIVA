# Story MX-04.1 - Shell Operacional do Gerente Comercial

## Status

InProgress

## Story

**As a** Gerente Comercial,
**I want** abrir uma Home operacional com meta, realizado, projecao, funil, equipe, alertas, ranking e agenda,
**so that** eu saiba quem cobrar, qual gargalo atacar e como conduzir a rotina comercial do dia.

## Executor Assignment

executor: "ux-design-expert"
quality_gate: "dev"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "browser responsive audit"]

## Epic Reference

- **Epic:** EPIC-MX-04 - Home Gerente Comercial
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
- **Related existing story:** `docs/stories/story-OPS-20260508-role-ui-responsive-hardening.md`
- **Current implementation candidates:** `src/features/dashboard-loja/sections/ManagerOperationalCockpit.tsx`, `src/features/dashboard-loja/sections/KpisSection.tsx`, `src/features/dashboard-loja/DashboardLoja.container.tsx`

## Context

Esta story formaliza o shell operacional do gerente. A revisao visual ja registra um cockpit gerencial no working tree atual, mas precisa de trilho proprio para validacao, file list, gates e browser audit.

## Acceptance Criteria

1. Perfil `gerente` acessa Home Gerencial em sua loja sem ver a experiencia executiva do dono.
2. A primeira tela exibe Meta, Realizado, Projecao, Agendamentos Hoje, Conversao e MX Score.
3. A tela inclui equipe, funil comercial, alertas, engajamento, ranking e agenda operacional.
4. O gerente consegue identificar vendedores abaixo do ritmo ou com rotina pendente.
5. O funil usa dados reais de leads, agendamentos, visitas e vendas.
6. Estados sem dados mostram pendencia de lancamento/integracao sem ocultar o problema.
7. O header legado do Dashboard Loja nao compete com o cockpit gerencial quando a Home esta em foco.
8. Desktop e mobile passam sem overflow horizontal ou tabelas quebradas.

## Tasks / Subtasks

- [x] Validar se `ManagerOperationalCockpit.tsx` cobre o shell operacional esperado.
- [x] Confirmar que `PerformanceTab` renderiza cockpit para `role === gerente`.
- [x] Validar KPIs de ritmo e funil com dados reais.
- [x] Confirmar estados vazios para ranking, agenda e alertas.
- [x] Validar que navegacao do gerente reflete Central Operacional, Rotina Comercial e Gestao de Gente.
- [ ] Rodar browser audit desktop/mobile autenticado como gerente ou via simulacao autorizada.
- [x] Rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- [x] Atualizar Dev Agent Record e File List antes de concluir.

## Dev Notes

- Nao transformar a Home do gerente em BI executivo.
- O foco e acao diaria: cobranca, acompanhamento e execucao.
- Se a sessao autenticada bloquear `/simulacao/gerente`, registrar 403 como comportamento correto e validar por gates + rota autorizada quando possivel.
- Preservar alteracoes de `Layout.tsx` e dashboard ja existentes no working tree.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Browser audit: gerente desktop `1366x768`
- Browser audit: gerente mobile `390x844`

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| Indicadores e blocos da Home Gerente | PRD §4.2 FR-HOME-2 |
| Dados operacionais diarios | PRD §4.4 FR-DATA-1 |
| Fechamento e disciplina | PRD §4.5 FR-DAILY |
| Alertas | PRD §4.6 FR-ALERT |

## File List

- `docs/stories/story-MX-04-20260527-shell-operacional-gerente.md`
- `src/components/Layout.tsx`
- `src/features/dashboard-loja/DashboardLoja.container.tsx`
- `src/features/dashboard-loja/sections/ManagerOperationalCockpit.tsx`
- `src/features/dashboard-loja/sections/PerformanceAlerts.tsx`
- `src/features/dashboard-loja/sections/PerformanceTab.tsx`

## Dev Agent Record

### Debug Log

- Story criada em modo YOLO via @sm para formalizar EPIC-MX-04.1.
- @dev validou que `PerformanceTab` roteia `role === 'gerente'` para `ManagerOperationalCockpit`.
- @dev validou que o cockpit gerencial cobre meta, realizado, projecao, ritmo diario, conversao, agendamentos, MX Score, equipe, funil, alertas, ranking, engajamento e agenda.
- @dev validou que ranking, agenda e alertas possuem estados vazios ou pendentes.
- Browser audit autenticado ficou bloqueado no ambiente local: dev bypass nao possui loja ativa/vinculo via RLS para concluir simulacao de gerente.

### Completion Notes

- Gates de codigo passaram com a implementacao atual do cockpit gerencial.
- A story permanece `InProgress` ate browser audit autenticado real.

### Change Log

- 2026-05-27: Validacao tecnica do shell operacional do gerente e registro de gates.
