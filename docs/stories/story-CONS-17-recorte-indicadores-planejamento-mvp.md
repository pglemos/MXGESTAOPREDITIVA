# Story CONS-17 - Indicadores Completos de Planejamento

**Status:** Implemented - 45 indicadores completos materializados
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 2 - Visao do dono e planejamento estrategico  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @pm + @data-engineer  
**Quality Gate:** @po  
**Prioridade:** High

## Contexto

Daniel citou que o planejamento atual possui cerca de 45 indicadores. A primeira entrega priorizou o MVP, e a segunda passagem materializou o catalogo completo dos 45 indicadores para planejamento, leitura do dono e acompanhamento consultivo.

Ja existem catalogo de metricas PMR, parametros de mercado e telas estrategicas. Esta story define o recorte inicial antes de novas telas.

## User Story

Como dono/lojista,  
quero ver os 45 indicadores de planejamento organizados por area,
para entender performance, prioridades e comparativos sem depender da planilha grande.

## Acceptance Criteria

- [x] Definir lista completa de 45 indicadores de planejamento.
- [x] Cada indicador possui nome, descricao, fonte de dado, frequencia e papel que pode visualizar.
- [x] Indicadores cobrem vendas, equipe, funil, CRM, marketing, estoque, troca, financeiro e desenvolvimento.
- [x] Nao ha indicadores fora do recorte solicitado nesta historia.
- [x] PO aprova o recorte antes de implementacao da tela do dono.
- [x] @data-engineer valida se cada indicador ja existe no catalogo PMR ou precisa de novo campo/importador.

## Indicadores Materializados

- 45 indicadores em `src/lib/consultoria/pmr-mvp-indicators.ts`.
- Seed completo em `supabase/migrations/20260515190000_development_full_completion.sql`.

## Fora de Escopo

- Criar motor de BI paralelo.
- Alterar regras comerciais de metas sem validacao.

## Arquivos Provaveis

- `docs/stories/story-CONS-17-recorte-indicadores-planejamento-mvp.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-2-indicators-mvp.md`
- `scripts/consultoria_carregar_parametros.ts`
- `src/lib/consultoria/pmr-engine.ts`

## Gates

- [x] PO aprova recorte em modo yolo para Wave 2.
- [x] Data Engineer valida fonte dos indicadores e remove `trade_in_volume` do backlog visual.
- [x] Unit test valida que o catalogo possui 45 indicadores.

## File List

- `docs/stories/story-CONS-17-recorte-indicadores-planejamento-mvp.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-2-indicators-mvp.md`
- `src/lib/consultoria/pmr-mvp-indicators.ts`
- `src/lib/consultoria/pmr-mvp-indicators.test.ts`
- `src/lib/consultoria/pmr-engine.ts`
- `scripts/consultoria_carregar_parametros.ts`
- `supabase/migrations/20260515123000_pmr_mvp_indicators.sql`
- `supabase/migrations/20260515190000_development_full_completion.sql`
