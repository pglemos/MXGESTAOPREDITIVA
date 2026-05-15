# Story CONS-18 - Planejamento Estrategico com Planejado x Realizado

**Status:** Implemented - aguardando validacao final  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 2 - Visao do dono e planejamento estrategico  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @data-engineer + @dev  
**Quality Gate:** @qa  
**Prioridade:** High

## Contexto

Na reuniao, Daniel pediu uma tela parecida com o DRE financeiro, mas para planejamento estrategico: planejado, realizado, percentual de realizacao e comparativo com ano anterior.

`ConsultingStrategicView` ja apresenta indicadores PMR com realizado, mercado, boa pratica e status. A evolucao deve ampliar essa visao para planejado x realizado sem criar outra fonte de verdade.

## User Story

Como admin/admin master MX,  
quero visualizar planejamento estrategico com planejado x realizado e comparativos,  
para discutir desempenho com o lojista/dono de forma objetiva.

## Acceptance Criteria

- [x] Tela estrategica exibe colunas de planejado/meta, realizado, percentual de realizacao e status.
- [x] Quando houver dado do ano anterior, a tela exibe comparativo YoY.
- [x] Indicadores usam o recorte MVP aprovado em CONS-17.
- [x] Volume de vendas e volume de carros de troca aparecem quando houver dados ou como `sem dado` quando a fonte ainda estiver pendente.
- [x] A leitura interna do admin MX pode mostrar detalhes operacionais.
- [x] Dados ausentes aparecem como estado vazio, nao como erro.
- [x] Export/relatorio futuro fica preparado por contrato, sem obrigatoriedade no MVP.

## Regras de Negocio

- Planejado/meta vem dos targets PMR ou metas da loja quando aplicavel.
- Realizado vem dos resultados PMR derivados/importados.
- Ano anterior deve ser opcional e nao bloquear a tela.
- Comparativos devem respeitar o periodo selecionado quando usado junto da visita.

## Arquivos Provaveis

- `src/features/consultoria/components/ConsultingStrategicView.tsx`
- `src/hooks/useConsultingMetrics.ts`
- `src/hooks/useConsultingStrategicPlan.ts`
- `src/lib/consultoria/pmr-engine.ts`
- `src/features/consultoria/types.ts`
- `src/test/*.test.ts`

## Plano AIOX

1. @data-engineer valida fontes para meta, realizado e ano anterior.
2. @architect confirma contrato de view model.
3. @ux-design-expert valida tabela/densidade.
4. @dev implementa.
5. @qa valida dados ausentes e calculos.

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`

## File List

- `docs/stories/story-CONS-18-planejamento-estrategico-planejado-realizado.md`
- `src/features/consultoria/components/ConsultingStrategicView.tsx`
- `src/lib/consultoria/pmr-engine.ts`
- `src/lib/consultoria/pmr-engine.test.ts`
- `src/lib/consultoria/pmr-mvp-indicators.ts`
