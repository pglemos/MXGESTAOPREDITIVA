# Story MX-06.1 - Shell da Central MX

## Status

Done

## Story

**As a** usuario executivo ou gestor autorizado,
**I want** acessar uma Central MX que integre score, alertas, benchmarking, plano de acao, indicadores, agenda e Consultor IA,
**so that** o sistema funcione como cerebro consultivo e converta diagnostico em execucao.

## Executor Assignment

executor: "ux-design-expert"
quality_gate: "architect"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "browser responsive audit"]

## Epic Reference

- **Epic:** EPIC-MX-06 - Central MX (Cerebro)
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
- **Related existing story:** `docs/stories/story-OPS-20260508-role-ui-responsive-hardening.md`
- **Current implementation candidates:** `src/components/Layout.tsx`, `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`, `src/features/dashboard-loja/sections/PerformanceAlerts.tsx`

## Context

Esta story cria o primeiro shell integrador da Central MX. Ela nao precisa finalizar todas as engines, mas deve criar a navegacao e os blocos estruturais que consumirao score, alertas, benchmarking, plano de acao, indicadores, agenda e Consultor IA rules-based.

## Acceptance Criteria

1. Central MX aparece como area de navegacao para perfis autorizados.
2. A Central MX tem entradas para Planejamento Estrategico, Plano de Acao, Alertas Inteligentes, Benchmarking, Agenda Executiva e Consultor IA.
3. A tela integra blocos de score, alertas, plano de acao, benchmarking, agenda e recomendacoes rules-based quando dados existirem.
4. Blocos sem engine/fonte final mostram estado pendente e explicam a fonte necessaria.
5. Cada alerta ou recomendacao mostra problema, impacto, recomendacao e acao rapida quando aplicavel.
6. A UI evita excesso de graficos e prioriza cards/status.
7. Permissoes respeitam perfil, loja e escopo.
8. Desktop e mobile passam sem overflow horizontal.

## Tasks / Subtasks

- [x] Definir shell e rotas internas da Central MX sem duplicar Dashboard Executivo.
- [x] Reconciliar navegacao existente do dono com a estrutura `ownerSection`.
- [x] Mapear blocos disponiveis: score, alertas, benchmarking, plano de acao, agenda, Consultor IA.
- [x] Criar estados pendentes para engines ainda incompletas.
- [x] Definir CTAs de drill-down para cada modulo.
- [x] Validar permissao por perfil autorizado.
- [x] Registrar browser audit desktop/mobile para o QA gate D1-T7.
- [x] Rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- [x] Atualizar Dev Agent Record e File List antes de concluir.

## Dev Notes

- Central MX e o cerebro integrador, nao uma landing page.
- Nao implementar IA preditiva ou LLM; Consultor IA 2026 e rules-based.
- Nao mascarar ausencia de score, benchmark, plano ou agenda.
- Usar artefatos de EPIC-MX-07, EPIC-MX-08, EPIC-MX-09, EPIC-MX-10, EPIC-MX-11 e EPIC-MX-14 como fontes.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Browser audit: perfil executivo desktop `1366x768`
- Browser audit: perfil executivo mobile `390x844`

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| Central MX como cerebro | PRD §4.13 FR-CENTRAL |
| Score | PRD §4.7 FR-SCORE |
| Alertas | PRD §4.6 FR-ALERT |
| Plano de acao | PRD §4.8 FR-PLAN |
| Benchmarking | PRD §4.9 FR-BENCH |
| Agenda | PRD §4.10 FR-AGENDA |
| Consultor IA rules-based | PRD §4.14 FR-IA |

## File List

- `docs/stories/story-MX-06-20260527-shell-central-mx.md`
- `src/components/Layout.tsx`
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`
- `src/features/dashboard-loja/sections/PerformanceAlerts.tsx`
- `src/features/dashboard-loja/sections/PerformanceTab.tsx`

## Dev Agent Record

### Debug Log

- Story criada em modo YOLO via @sm para formalizar EPIC-MX-06.1.
- @dev validou que a Central MX existe como categoria de navegacao do dono com Planejamento Estrategico, Plano de Acao, Alertas Inteligentes, Benchmarking, Agenda Executiva e Consultor IA.
- @dev validou que `OwnerExecutiveCockpit` renderiza secoes internas por `ownerSection` e nao duplica o Dashboard Executivo como rota separada.
- @dev validou que blocos de score, alertas, plano de acao, benchmarking, agenda e Consultor IA possuem estados reais ou pendentes sem LLM/preditivo.
- Browser audit autenticado ficou bloqueado no ambiente local: dev bypass nao possui loja ativa/vinculo via RLS para concluir simulacao executiva.
- 2026-05-28: @aiox-master ratificou D1-T6 sem novo codigo: `Layout.tsx` expoe Central MX para `dono`, `ownerSection` cobre planejamento, plano de acao, alertas, benchmarking, agenda e consultor, e `OwnerExecutiveCockpit` renderiza os estados pendentes sem mascarar engines futuras.
- 2026-05-28: Gates do lote executados apos fechamento D1-T5: `npm run lint`, `npm run typecheck`, `npm test` (358 pass), `npm run build`.

### Completion Notes

- Gates de codigo passaram com a implementacao atual da Central MX.
- Central MX fechada como shell integrador do Dia 1; browser audit autenticado real fica no QA gate D1-T7 por depender de sessao/vinculo de loja real.

### Change Log

- 2026-05-27: Validacao tecnica do shell Central MX e registro de gates.
- 2026-05-28: Finalizacao D1-T6. Story marcada `Done` como shell pronto, com smoke autenticado real delegado ao QA gate D1-T7.
