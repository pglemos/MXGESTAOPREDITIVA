# Story DEV-27 - Feedback e PDI com Recomendacao de Conteudo

**Status:** Implemented - recomendacoes persistidas a partir de feedback e PDI
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 4 - Desenvolvimento de pessoas  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @architect + @data-engineer + @dev  
**Quality Gate:** @qa  
**Prioridade:** Medium

## Contexto

A reuniao conectou feedback estruturado, PDI e biblioteca: quando gerente identifica lacuna, o sistema deve indicar conteudos correspondentes. O repositorio ja possui historias e telas para PDI, feedback estruturado e treinamentos.

## User Story

Como gerente,  
quero que feedbacks e PDIs recomendem conteudos de desenvolvimento,  
para transformar lacunas observadas em plano de acao concreto.

## Acceptance Criteria

- [x] Feedback estruturado permite registrar competencia ou lacuna ligada a tema de desenvolvimento.
- [x] PDI permite vincular objetivo ou acao a conteudo recomendado.
- [x] Sistema recomenda conteudos por mapeamento deterministico de lacunas para temas.
- [x] Vendedor visualiza recomendacoes originadas de gargalo/funil em sua area de desenvolvimento.
- [x] Gerente visualiza se o vendedor consumiu conteudos recomendados.
- [x] Admin/admin master MX consegue auditar recomendacoes por loja e vendedor.
- [x] Recomendacao nao depende de IA no MVP.

## Regras de Negocio

- Feedback e PDI continuam sendo registro gerencial, nao punicao.
- Conteudos recomendados devem ser explicaveis pelo tema/lacuna que os originou.
- Recomendacao automatica por IA fica fora do MVP.
- Historico de feedback/PDI nao deve ser exposto a outros vendedores.

## Arquivos Provaveis

- `src/pages/GerentePDI.tsx`
- `src/pages/GerenteFeedbacks.tsx`
- `src/pages/VendedorTreinamentos.tsx`
- `src/hooks/usePDISessions.ts`
- `src/hooks/useTrainings.ts`
- `docs/stories/story-pdi-complete-09/spec/spec.md`
- `docs/stories/story-structured-feedback-08/spec/spec.md`
- `supabase/migrations`

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] Access regression para feedback/PDI por gerente, vendedor, admin e admin master.
- [x] Smoke remoto de recomendacao persistida.

## File List

- `docs/stories/story-DEV-27-feedback-pdi-recomendacao-conteudo.md`
- `src/lib/development-content.ts`
- `src/lib/development-content.test.ts`
- `src/pages/VendedorTreinamentos.tsx`
- `src/hooks/useFeedbacks.ts`
- `src/hooks/usePDI_MX.ts`
- `src/hooks/useTrainings.ts`
- `scripts/validate_mx_development_full_smoke.ts`
- `supabase/migrations/20260515190000_development_full_completion.sql`
