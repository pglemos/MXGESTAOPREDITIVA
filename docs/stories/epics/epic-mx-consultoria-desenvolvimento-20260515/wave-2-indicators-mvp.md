# Wave 2 - Indicadores MVP de Planejamento

**Status:** Aprovado e implementado no recorte MVP  
**Base:** Reuniao Daniel + artefatos PMR existentes  
**Objetivo:** evitar tentar implementar os 45 indicadores de uma vez.

## Recorte MVP Proposto

| Grupo | Indicador | Fonte provavel | Observacao |
|---|---|---|---|
| Vendas | Volume de vendas | vendas PMR / daily checkins / fechamento mensal | Essencial para dono |
| Vendas | Meta de vendas | targets PMR / metas loja | Planejado |
| Vendas | Realizacao da meta | calculado | Realizado / planejado |
| Funil | Leads recebidos | marketing mensal / checkins | Entrada do funil |
| Funil | Agendamentos | checkins | Rotina comercial |
| Funil | Visitas/comparecimentos | checkins | Conversao intermediaria |
| Funil | Lead -> agendamento | calculado | Benchmark ja existe |
| Funil | Agendamento -> visita | calculado | Benchmark ja existe |
| Funil | Visita -> venda | calculado | Benchmark ja existe |
| Marketing | Investimento internet | marketing mensal / financeiro | Dado de fechamento |
| Marketing | Custo por venda internet | calculado | Valor percebido alto |
| Estoque | Estoque total | snapshot estoque | Ja aparece em fechamento |
| Estoque | Giro de estoque | PMR engine | Indicador de gestao |
| Estoque | Estoque acima de 90 dias | PMR engine | Alerta operacional |
| Troca | Volume de carros de troca | novo campo/importacao a confirmar | Citado explicitamente na reuniao |
| Rentabilidade | Margem media | vendas/financeiro | Se existir fonte confiavel |

## Backlog Pos-MVP

- Todos os demais indicadores da planilha do Daniel.
- Indicadores financeiros avancados.
- Indicadores de contratacao.
- Indicadores de treinamento.
- Indicadores por vendedor com serie historica completa.

## Decisoes Necessarias

1. "Volume de carros de troca" fica no MVP visual, mas com fonte pendente/backlog ate existir campo/importador confiavel.
2. Margem media usa fonte financeira/vendas quando disponivel.
3. Visao do dono prioriza indicadores operacionais e mostra DRE apenas quando o dado ja existir e o papel tiver permissao.

## Recomendacao

Usar esses 16 indicadores como MVP inicial. Dados ausentes aparecem como "sem dado" e entram em backlog de coleta, nao como erro. O recorte foi materializado em `src/lib/consultoria/pmr-mvp-indicators.ts` para manter ordem, fonte, frequencia, visibilidade e status de disponibilidade.
