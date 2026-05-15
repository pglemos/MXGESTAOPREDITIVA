# Story DEV-25 - Biblioteca de Conteudo por Tema, Avaliacao e Sugestao

**Status:** Implemented - biblioteca, avaliacao, sugestao e curadoria persistidas
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 4 - Desenvolvimento de pessoas  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @data-engineer + @dev  
**Quality Gate:** @qa  
**Prioridade:** High

## Contexto

Daniel priorizou uma biblioteca flexivel em vez de trilha obrigatoria para todos. A biblioteca deve permitir que vendedor busque conteudos por necessidade real e que MX acompanhe consumo, avaliacao e demanda por novos temas.

## User Story

Como vendedor,  
quero buscar conteudos por tema e avaliar as aulas,  
para estudar somente o que ajuda minha rotina e indicar o que precisa melhorar.

## Acceptance Criteria

- [x] Biblioteca permite busca textual por titulo, descricao ou tema.
- [x] Conteudos podem ser filtrados por temas como prospeccao, agendamento, atendimento, apresentacao, financiamento, carro de troca, fechamento, funil e rotina diaria.
- [x] Sistema registra progresso de consumo por usuario.
- [x] Usuario pode avaliar conteudo com estrelas ou escala simples.
- [x] Usuario pode sugerir novo conteudo dentro do sistema.
- [x] Admin/admin master MX consegue visualizar conteudos mal avaliados e sugestoes recebidas.
- [x] Vendedor so visualiza seu proprio progresso e suas proprias avaliacoes, alem dos conteudos liberados para sua loja/perfil.

## Regras de Negocio

- Conteudo mal avaliado nao deve ser removido automaticamente; deve ser marcado para revisao.
- Sugestao de conteudo e backlog editorial, nao promessa automatica de producao.
- Implementacao reaproveita `treinamentos` e `progresso_treinamentos`, adicionando tabelas de avaliacao, sugestao e curadoria.
- Marketplace, cobranca por conteudo e hospedagem avancada de video ficam fora do MVP.

## Arquivos Provaveis

- `src/pages/VendedorTreinamentos.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/hooks/useTrainings.ts`
- `src/hooks/useData.ts`
- `src/pages/Notificacoes.tsx`
- `supabase/migrations`

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] RLS regression para vendedor, gerente, admin e admin master.
- [x] Smoke remoto de desenvolvimento completo.

## File List

- `docs/stories/story-DEV-25-biblioteca-conteudo-temas-avaliacao.md`
- `src/lib/development-content.ts`
- `src/lib/development-content.test.ts`
- `src/pages/VendedorTreinamentos.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/ConsultorTreinamentos.tsx`
- `src/hooks/useTrainings.ts`
- `scripts/validate_mx_development_full_smoke.ts`
- `supabase/migrations/20260515190000_development_full_completion.sql`
