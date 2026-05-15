# Story DEV-24 - Reposicionar Treinamentos como Desenvolvimento

**Status:** Implemented - aguardando validacao final  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 4 - Desenvolvimento de pessoas  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @ux-design-expert + @dev  
**Quality Gate:** @qa  
**Prioridade:** High

## Contexto

Na reuniao, Treinamentos deixou de ser tratado como uma area isolada de aulas e passou a ser visto como produto de entrada: um sistema que desenvolve pessoas. A aplicacao ja possui telas de treinamentos, PDI, feedback e progresso. Esta story reposiciona a experiencia e a arquitetura de informacao sem quebrar rotas existentes.

## User Story

Como vendedor, gerente ou dono,  
quero acessar uma area de desenvolvimento clara,  
para enxergar treinamento, PDI, feedback e evolucao como uma jornada unica.

## Acceptance Criteria

- [x] Area atual de Treinamentos e apresentada como Desenvolvimento, Evolucao ou Meu Plano de Carreira conforme decisao do PO.
- [x] Rotas existentes continuam funcionando para evitar quebra de navegacao, bookmarks e permissoes.
- [x] Vendedor visualiza em um mesmo ambiente: conteudos recomendados, progresso, biblioteca e trilha base.
- [x] Gerente visualiza equipe, progresso e acoes de desenvolvimento.
- [ ] Admin/admin master MX mantem capacidade de auditar e administrar a area.
- [x] A experiencia diferencia biblioteca livre, conteudo recomendado e trilha obrigatoria.
- [x] A mudanca nao altera regras de acesso ja existentes sem aprovacao de @data-engineer.

## Regras de Negocio

- O posicionamento de produto deve evitar comunicacao de "plataforma de curso" como oferta principal.
- O sistema deve reforcar desenvolvimento de vendedor, rotina, PDI e feedback.
- Nome final da area e decisao de produto: Desenvolvimento, Evolucao ou Meu Plano de Carreira.

## Arquivos Provaveis

- `src/components/Layout.tsx`
- `src/pages/VendedorTreinamentos.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/GerentePDI.tsx`
- `src/pages/GerenteFeedbacks.tsx`
- `src/hooks/useTrainings.ts`

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [ ] Browser/mobile check para vendedor e gerente.

## File List

- `docs/stories/story-DEV-24-reposicionar-treinamentos-desenvolvimento.md`
- `src/components/Layout.tsx`
- `src/pages/VendedorTreinamentos.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/lib/development-content.ts`
