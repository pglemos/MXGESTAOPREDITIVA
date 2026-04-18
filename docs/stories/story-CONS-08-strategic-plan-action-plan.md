# Story [CONS-08]: Planejamento Estrategico e Plano de Acao PMR

**Status:** READY FOR REVIEW
**Agent:** @aiox-master + @dev
**Priority:** HIGH

## Context

Os decks PMR mostram duas entregas centrais: planejamento estrategico e plano de acao com responsavel, prazo, prioridade e status.

## User Story

Como consultor MX,
quero abas de Planejamento Estrategico e Plano de Acao no cliente,
para acompanhar execucao do PMR em tempo real.

## Acceptance Criteria

- [x] Detalhe do cliente possui abas `Estratégico` e `Plano de Ação`.
- [x] Plano de acao registra indicador, acao, como, responsavel, prazo, prioridade, status e eficacia.
- [x] Planejamento estrategico consome diagnostico, indicadores e parametros.
- [x] Dados atualizam ao novo lancamento mensal/diario.

## File List

- `docs/stories/story-CONS-08-strategic-plan-action-plan.md`
- `supabase/migrations/20260418001000_pmr_native_engine.sql`
- `src/hooks/useConsultingStrategicPlan.ts`
- `src/hooks/useConsultingActionPlan.ts`
- `src/hooks/useConsultingMetrics.ts`
- `src/features/consultoria/components/ConsultingStrategicView.tsx`
- `src/features/consultoria/components/ConsultingActionPlanView.tsx`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
- `src/test/schemas/schemas.test.ts`
