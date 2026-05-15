# Story APP-29 - Curadoria de Conteudos com Especialistas e Fornecedores

**Status:** Partial MVP - metadados editoriais preparados  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 5 - Personalizacao por loja e app readiness  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @pm + @dev  
**Quality Gate:** @qa  
**Prioridade:** Low

## Contexto

Daniel e Jose citaram conteudos de especialistas, fornecedores, financiamento, avaliacao e veiculos premium. A necessidade de produto e ter um fluxo editorial simples para publicar, substituir e acompanhar conteudos.

## User Story

Como admin MX,  
quero curar conteudos de especialistas e fornecedores na biblioteca,  
para ampliar valor percebido sem criar uma operacao manual desorganizada.

## Acceptance Criteria

- [x] Admin/admin master MX pode marcar conteudo como interno MX, especialista convidado ou fornecedor no contrato de conteudo.
- [x] Conteudo possui metadados minimos: tema, publico-alvo/fonte por tipo, status editorial e data de revisao no contrato.
- [x] Conteudos podem ser ativados, pausados ou substituidos sem apagar historico de progresso quando persistencia editorial for conectada.
- [ ] Avaliacoes e sugestoes ajudam a priorizar substituicao de conteudos.
- [x] Vendedor visualiza conteudo liberado sem expor dados administrativos da fonte.

## Regras de Negocio

- Curadoria nao e marketplace.
- Fonte do conteudo nao deve criar promessa comercial automatica com fornecedor.
- Historico de progresso deve permanecer valido quando um conteudo e pausado.

## Arquivos Provaveis

- `src/pages/ConsultorTreinamentos.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/VendedorTreinamentos.tsx`
- `src/hooks/useTrainings.ts`
- `supabase/migrations`

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`

## File List

- `docs/stories/story-APP-29-curadoria-conteudos-especialistas-fornecedores.md`
- `src/lib/development-content.ts`
- `src/lib/development-content.test.ts`
