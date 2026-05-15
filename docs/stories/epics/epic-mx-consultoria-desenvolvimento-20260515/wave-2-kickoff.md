# Wave 2 Kickoff - Visao do Dono e Planejamento Estrategico

**Status:** Ready for PO review  
**Onda:** 2  
**Stories:** CONS-17, CONS-18, CONS-19  
**Objetivo:** entregar leitura clara de planejamento e performance para dono/lojista, sem criar BI paralelo nem implementar os 45 indicadores de uma vez.

## Resultado Esperado

Ao final da Onda 2, a equipe MX deve conseguir demonstrar:

1. Indicadores MVP aprovados.
2. Planejamento estrategico com planejado, realizado, percentual e status.
3. Comparativo com ano anterior quando houver fonte confiavel.
4. Visao do dono com alertas e prioridades.
5. Admin MX ainda com leitura operacional completa.
6. Dono sem acesso a dados de outras lojas/clientes.

## Ordem de Execucao

1. `CONS-17` - Recorte MVP dos indicadores de planejamento.
2. `CONS-18` - Planejamento estrategico com planejado x realizado.
3. `CONS-19` - Visao do dono com performance e alertas.

## Por que essa ordem

- `CONS-17` define o que pode aparecer.
- `CONS-18` cria o view model e a leitura interna.
- `CONS-19` transforma a leitura operacional em valor para o dono.

## Decisoes que Precisam Estar Fechadas

| Decisao | Dono | Recomendacao |
|---|---|---|
| Lista final de indicadores MVP | @pm + @po | Comecar com os indicadores de `wave-2-indicators-mvp.md`. |
| Fonte de volume de carros de troca | @data-engineer | Marcar como missing/deferred se nao houver fonte confiavel. |
| Exposicao de margem/financeiro ao dono | @pm + @po | Nao exibir financeiro sensivel sem decisao explicita. |
| Tratamento de dados ausentes | @data-engineer + @qa | Mostrar "sem dados", nunca zero implicito. |

## Definition of Ready

- [ ] `CONS-17` aprovado por @pm/@po.
- [ ] Indicadores classificados como existing, derived ou missing.
- [ ] Dados sensiveis aprovados ou removidos do MVP.
- [ ] @data-engineer validou fonte por indicador.
- [ ] @ux-design-expert validou leitura do dono.
- [ ] @qa aprovou matriz de acesso por papel.

## Definition of Done

- [ ] CONS-17 a CONS-19 atualizadas com checklist e File List.
- [ ] `npm run lint` passou.
- [ ] `npm run typecheck` passou.
- [ ] `npm test` passou.
- [ ] Indicadores ausentes nao aparecem como zero real.
- [ ] Dono acessa somente lojas vinculadas.
- [ ] Admin MX mantem visao operacional.
- [ ] Mobile sem sobreposicao para dashboard do dono.

## Arquivos de Referencia

- `docs/stories/story-CONS-17-recorte-indicadores-planejamento-mvp.md`
- `docs/stories/story-CONS-18-planejamento-estrategico-planejado-realizado.md`
- `docs/stories/story-CONS-19-visao-dono-performance-alertas.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-2-indicators-mvp.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-2-qa-test-plan.md`
