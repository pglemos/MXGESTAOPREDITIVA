# Story [CONS-07]: Entradas Operacionais PMR

**Status:** READY FOR REVIEW
**Agent:** @aiox-master + @dev
**Priority:** HIGH

## Context

A planilha de fechamento de mes possui tres fontes operacionais: marketing, vendas e estoque. O acompanhamento diario deve alimentar metas/resultados do planejamento.

## User Story

Como consultor MX,
quero lancar ou importar dados mensais e diarios,
para atualizar indicadores PMR sem depender de planilhas externas.

## Acceptance Criteria

- [x] Importador valida abas `Cadmkt`, `Cadven` e `Cadest`.
- [x] Marketing mensal, vendas e estoque ficam estruturados em tabelas `consulting_*`.
- [x] Metas e resultados por indicador ficam disponiveis para relatorios.
- [x] Importacao possui modo dry-run.

## File List

- `docs/stories/story-CONS-07-pmr-operational-inputs.md`
- `supabase/migrations/20260418001000_pmr_native_engine.sql`
- `scripts/consultoria_importar_fechamento_mensal.ts`
- `src/hooks/useConsultingMetrics.ts`
- `src/features/consultoria/components/ConsultingStrategicView.tsx`
- `package.json`
