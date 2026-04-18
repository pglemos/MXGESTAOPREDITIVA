# Story [CONS-04]: Modulos Internos por Cliente da Consultoria

**Status:** READY FOR REVIEW
**Agent:** @aiox-master + @dev
**Priority:** HIGH

## Context

A reuniao de 17/04/2026 separou produtos comerciais de ferramentas internas da consultoria. DRE nao deve ser produto compravel no catalogo: deve ser modulo interno premium habilitado por cliente no cadastro e na edicao.

## User Story

Como admin MX,
quero habilitar ou desabilitar modulos internos por cliente,
para controlar DRE, diagnostico, planejamento e plano de acao sem misturar com produto comercial.

## Acceptance Criteria

- [x] Cliente possui lista de modulos internos configuravel.
- [x] DRE so aparece quando o modulo `dre` estiver habilitado.
- [x] Query de `consulting_financials` respeita o modulo `dre`.
- [x] Produto comercial continua em `product_name`.
- [x] RLS impede acesso indevido.

## File List

- `docs/stories/story-CONS-04-client-modules.md`
- `supabase/migrations/20260418001000_pmr_native_engine.sql`
- `src/hooks/useConsultingModules.ts`
- `src/hooks/useConsultingClients.ts`
- `src/features/consultoria/components/ConsultingModulesPanel.tsx`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
