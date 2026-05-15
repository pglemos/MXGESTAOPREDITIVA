# Story CONS-19 - Visao do Dono com Performance e Alertas

**Status:** Implemented - aguardando validacao final  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 2 - Visao do dono e planejamento estrategico  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @ux-design-expert + @dev  
**Quality Gate:** @qa  
**Prioridade:** High

## Contexto

A reuniao reforcou que a visao do dono/lojista ainda nao esta totalmente configurada. O dono deve enxergar valor claro: performance da loja, indicadores principais, alertas e prioridades, sem a complexidade operacional do admin/admin master MX.

Ja existe `DashboardLoja` para performance da loja e `ConsultingStrategicView` para estrategia PMR. Esta story deve compor uma leitura do dono reaproveitando esses dados.

## User Story

Como dono/lojista,  
quero uma visao simples de performance, alertas e prioridades,  
para entender onde minha loja esta abaixo, dentro ou acima do esperado.

## Acceptance Criteria

- [x] Dono visualiza somente dados das lojas vinculadas ao seu papel.
- [x] Tela apresenta indicadores principais do recorte MVP por meio dos blocos de meta, vendido, funil, disciplina e DRE quando disponivel.
- [x] Cada alerta possui status visual simples: critico, atencao ou ok.
- [x] Tela mostra proximas acoes/prioridades em linguagem operacional.
- [x] Visao do dono nao exibe controles administrativos da MX.
- [x] Admin/admin master MX continua tendo acesso a visao operacional completa.
- [x] Mobile exibe indicadores e alertas em grid responsivo sem sobreposicao.
- [x] RLS e filtros por papel reaproveitam `useAuth`, vinculos de loja e queries existentes.

## Regras de UX

- Leitura orientada a decisao, nao a planilha.
- Poucos cards, bem organizados.
- Alertas devem explicar o motivo, nao apenas colorir numero.
- Dono nao deve precisar entender a metodologia PMR para perceber valor.

## Arquivos Provaveis

- `src/pages/DashboardLoja.tsx`
- `src/features/consultoria/components/ConsultingStrategicView.tsx`
- `src/features/consultoria/components/ConsultingActionPlanView.tsx`
- `src/hooks/useConsultingMetrics.ts`
- `src/hooks/useAuth.tsx`
- `src/test/*.playwright.ts`

## Plano AIOX

1. @ux-design-expert define arquitetura da leitura do dono.
2. @data-engineer valida filtros por loja/cliente.
3. @dev implementa composicao da visao.
4. @qa testa papel dono, gerente, admin MX e acesso cruzado.

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [ ] Playwright de acesso por papel quando implementado.

## File List

- `docs/stories/story-CONS-19-visao-dono-performance-alertas.md`
- `src/pages/DashboardLoja.tsx`
