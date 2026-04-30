# Story [CONS-06]: Parametros e Benchmarks PMR Editaveis

**Status:** READY FOR REVIEW
**Agent:** @aiox-master + @dev
**Priority:** HIGH

## Context

A reuniao identificou conflito entre parametros 20/60/33 e formulas da planilha. Nenhum benchmark PMR deve ficar fixo no codigo.

## User Story

Como admin MX,
quero manter indicadores, benchmarks e formulas PMR em configuracoes,
para atualizar o metodo sem depender do desenvolvedor.

## Acceptance Criteria

- [x] Catalogo central de indicadores PMR criado.
- [x] Conjunto ativo de parametros versionado.
- [x] Valores de media de mercado, boa pratica e formulas sao editaveis.
- [x] Seeds reproduzem os indicadores da planilha principal.

## File List

- `docs/stories/story-CONS-06-pmr-parameters.md`
- `supabase/migrations/20260418001000_pmr_native_engine.sql`
- `scripts/consultoria_carregar_parametros.ts`
- `src/hooks/useConsultingParameters.ts`
- `src/features/consultoria/components/ConsultingParametersView.tsx`
- `src/pages/ConsultoriaParametros.tsx`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `package.json`
- `src/test/schemas/schemas.test.ts`
