# Story APP-28 - Trilha Institucional Personalizada por Loja

**Status:** Implemented - conteudo institucional por loja
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 5 - Personalizacao por loja e app readiness  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @architect + @dev  
**Quality Gate:** @qa  
**Prioridade:** Medium

## Contexto

A reuniao identificou a personalizacao institucional como diferencial comercial: o novo colaborador deve poder consumir conteudo da propria loja, com historia, valores e processos. Esta story depende da base de biblioteca e trilha da Onda 4.

## User Story

Como dono ou gerente,  
quero incluir conteudos institucionais da minha loja na trilha de entrada,  
para que novos colaboradores entendam cultura, historia e processos antes de vender.

## Acceptance Criteria

- [x] Admin/admin master MX consegue cadastrar conteudo institucional vinculado a uma loja.
- [x] Gerente/dono consegue publicar e visualizar conteudos institucionais liberados para sua loja.
- [x] Trilha de novo colaborador pode incluir conteudos institucionais da loja alem dos conteudos padrao MX.
- [x] Vendedor so acessa conteudo institucional da loja a que esta vinculado pelo contrato `isContentVisibleForStore`.
- [x] Conteudo pode representar historia, valores, processo documental, preparacao, avaliacao de carro e rotina especifica.
- [x] Sistema diferencia conteudo padrao MX de conteudo personalizado da loja.

## Regras de Negocio

- Personalizacao por loja e pacote comercial adicional; nao deve bloquear uso da trilha padrao.
- Conteudo institucional deve respeitar isolamento multi-tenant.
- O sistema registra metadados e URL/anexo de conteudo; producao de video fica fora do sistema.

## Arquivos Provaveis

- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/VendedorTreinamentos.tsx`
- `src/hooks/useTrainings.ts`
- `src/hooks/useStores.ts`
- `src/types/database.ts`
- `supabase/migrations`

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] RLS regression por loja.

## File List

- `docs/stories/story-APP-28-trilha-institucional-personalizada-loja.md`
- `src/lib/development-content.ts`
- `src/lib/development-content.test.ts`
- `src/hooks/useTrainings.ts`
- `src/pages/ConsultorTreinamentos.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `scripts/validate_mx_development_full_smoke.ts`
- `supabase/migrations/20260515200000_store_institutional_training_write.sql`
- `supabase/migrations/20260515201000_harden_store_training_select_scope.sql`
