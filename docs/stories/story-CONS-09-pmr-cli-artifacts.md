# Story [CONS-09]: Geracao CLI-First de Entregaveis PMR

**Status:** READY FOR REVIEW
**Agent:** @aiox-master + @dev
**Priority:** HIGH

## Context

A Constitution exige CLI First. Antes de gerar PowerPoint/PDF visual, o sistema precisa gerar resumo executivo e payload estruturado reproduzivel.

## User Story

Como consultor MX,
quero gerar resumo executivo e payload de planejamento via CLI,
para produzir entregaveis PMR a partir de dados estruturados.

## Acceptance Criteria

- [x] CLI gera planejamento estrategico estruturado.
- [x] CLI gera resumo executivo em Markdown.
- [x] Artefatos ficam registrados no cliente.
- [x] UI apenas consome artefatos gerados.

## File List

- `docs/stories/story-CONS-09-pmr-cli-artifacts.md`
- `scripts/consulting_generate_strategic_plan.ts`
- `scripts/consulting_generate_executive_summary.ts`
- `scripts/README.md`
- `package.json`
- `src/hooks/useConsultingStrategicPlan.ts`
- `src/features/consultoria/components/ConsultingStrategicView.tsx`
