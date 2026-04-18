# Story [CONS-05]: Formularios PMR Nativos de Diagnostico

**Status:** READY FOR REVIEW
**Agent:** @aiox-master + @dev
**Priority:** HIGH

## Context

O modelo PMR exige quatro formularios na Visita 1: donos/socios, gerentes, vendedores e processos. Hoje o processo ainda depende de links externos.

## User Story

Como consultor MX,
quero preencher formularios PMR nativos no cliente,
para gerar diagnostico estruturado sem depender de Google Forms.

## Acceptance Criteria

- [x] Existem templates nativos para dono/socio, gerente, vendedor e processos.
- [x] Respostas ficam ligadas ao cliente e opcionalmente a uma visita.
- [x] Consultor com assignment consegue registrar respostas.
- [x] Diagnostico fica disponivel para o planejamento estrategico.

## File List

- `docs/stories/story-CONS-05-pmr-native-diagnostics.md`
- `supabase/migrations/20260418001000_pmr_native_engine.sql`
- `src/hooks/usePmrDiagnostics.ts`
- `src/features/consultoria/components/PmrDiagnosticsView.tsx`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
- `src/lib/schemas/consulting-client.schema.ts`
- `src/test/schemas/schemas.test.ts`
