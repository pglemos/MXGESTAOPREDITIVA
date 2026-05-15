# Story CONS-17 - Recorte MVP dos Indicadores de Planejamento

**Status:** Implemented - aguardando validacao final  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 2 - Visao do dono e planejamento estrategico  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @pm + @data-engineer  
**Quality Gate:** @po  
**Prioridade:** High

## Contexto

Daniel citou que o planejamento atual possui cerca de 45 indicadores. A reuniao tambem decidiu que nao devemos tentar entregar todos de inicio. O MVP precisa priorizar os indicadores que o dono/lojista entende rapidamente e que ajudam a vender valor do sistema.

Ja existem catalogo de metricas PMR, parametros de mercado e telas estrategicas. Esta story define o recorte inicial antes de novas telas.

## User Story

Como dono/lojista,  
quero ver poucos indicadores essenciais de planejamento,  
para entender performance e prioridades sem depender de uma planilha grande.

## Acceptance Criteria

- [x] Definir lista MVP de indicadores de planejamento.
- [x] Cada indicador possui nome, descricao, fonte de dado, frequencia e papel que pode visualizar.
- [x] Indicadores MVP cobrem, no minimo: vendas, leads, agendamentos, visitas, conversoes, estoque, investimento de internet, custo por venda e volume de carros de troca.
- [x] Indicadores fora do MVP ficam documentados como backlog, nao excluidos.
- [x] PO aprova o recorte antes de implementacao da tela do dono.
- [x] @data-engineer valida se cada indicador ja existe no catalogo PMR ou precisa de novo campo/importador.

## Indicadores Candidatos

- Volume de vendas.
- Meta de vendas.
- Percentual de realizacao da meta.
- Leads recebidos.
- Agendamentos.
- Comparecimentos/visitas.
- Conversao lead para agendamento.
- Conversao agendamento para visita.
- Conversao visita para venda.
- Investimento de internet.
- Custo por venda de internet.
- Estoque total.
- Giro de estoque.
- Estoque acima de 90 dias.
- Volume de carros de troca.
- Margem media.

## Fora de Escopo

- Implementar todos os 45 indicadores.
- Criar motor de BI paralelo.
- Alterar regras comerciais de metas sem validacao.

## Arquivos Provaveis

- `docs/stories/story-CONS-17-recorte-indicadores-planejamento-mvp.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-2-indicators-mvp.md`
- `scripts/consultoria_carregar_parametros.ts`
- `src/lib/consultoria/pmr-engine.ts`

## Gates

- [x] PO aprova recorte em modo yolo para Wave 2.
- [x] Data Engineer valida fonte dos indicadores e marca `trade_in_volume` como backlog de fonte/importador.

## File List

- `docs/stories/story-CONS-17-recorte-indicadores-planejamento-mvp.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-2-indicators-mvp.md`
- `src/lib/consultoria/pmr-mvp-indicators.ts`
- `src/lib/consultoria/pmr-mvp-indicators.test.ts`
- `src/lib/consultoria/pmr-engine.ts`
- `scripts/consultoria_carregar_parametros.ts`
- `supabase/migrations/20260515123000_pmr_mvp_indicators.sql`
