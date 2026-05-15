# Story OPS-23 - Insights de Disciplina do Vendedor

**Status:** Implemented - aguardando validacao final  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 3 - Acompanhamento diario e rotina mobile  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @data-engineer + @dev  
**Quality Gate:** @qa  
**Prioridade:** Medium

## Contexto

Daniel reforcou que o vendedor precisa entender por que deve preencher dados. A reuniao sugeriu disciplina, estrelas, comparacao com mercado e uma leitura individual de evolucao. O sistema ja possui ranking, matinal, status de check-in e calculos de funil.

Esta story cria um MVP simples de disciplina, sem gamificacao robusta.

## User Story

Como vendedor,  
quero ver minha consistencia e meus principais insights de rotina,  
para entender como o preenchimento diario ajuda meu resultado.

## Acceptance Criteria

- [x] Sistema calcula disciplina de lancamento por vendedor em periodo definido.
- [x] Vendedor visualiza sua propria disciplina e tendencia simples.
- [x] Gerente visualiza disciplina/pendencia da equipe no centro de comando.
- [x] Admin/admin master MX visualiza disciplina por loja no centro de comando.
- [x] Indicador e exibido como percentual e status simples.
- [x] Insight diferencia ausencia de dado de desempenho baixo.
- [x] Nao expor dados de outros vendedores para vendedor comum.

## Regras de Negocio

- Disciplina mede consistencia de preenchimento, nao performance de venda.
- Performance comercial pode aparecer como contexto, mas nao deve misturar com disciplina.
- MVP deve evitar badges complexos e premiacao automatica.

## Arquivos Provaveis

- `src/hooks/useRanking.ts`
- `src/pages/VendedorHome.tsx`
- `src/pages/Ranking.tsx`
- `src/pages/MorningReport.tsx`
- `src/pages/RotinaGerente.tsx`
- `supabase/migrations/20260430214500_corrige_benchmark_anonimo_vendedores.sql`

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [ ] Access regression para vendedor, gerente e admin.

## File List

- `docs/stories/story-OPS-23-insights-disciplina-vendedor.md`
- `src/lib/daily-routine.ts`
- `src/lib/daily-routine.test.ts`
- `src/pages/VendedorHome.tsx`
- `src/pages/RotinaGerente.tsx`
