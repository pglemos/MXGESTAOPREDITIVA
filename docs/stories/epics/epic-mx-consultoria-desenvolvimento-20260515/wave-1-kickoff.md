# Wave 1 Kickoff - Consultoria PMR Pronta para Uso

**Status:** Ready for PO review  
**Onda:** 1  
**Stories:** CONS-13, CONS-14, CONS-15, CONS-16  
**Objetivo:** admin/admin master MX executa visita, registra dados, seleciona periodo, gera resumo e relatorio sem sair do sistema.

## Resultado Esperado

Ao final da Onda 1, a equipe MX deve conseguir demonstrar este fluxo:

1. Admin MX abre agenda.
2. Admin MX inicia visita de consultoria.
3. Sistema mostra objetivo, metodologia e checklist da visita.
4. Admin MX seleciona periodo de analise.
5. Admin MX registra dados, anexos e proximas acoes.
6. Sistema gera resumo executivo e relatorio padrao MX.
7. Dono/lojista acessa somente o resultado permitido para seu papel.

## Ordem de Execucao

1. `CONS-13` - Visita 8 de acompanhamento mensal.
2. `CONS-15` - Filtro de periodo para visita e relatorio.
3. `CONS-14` - Fluxo sequencial e limpo da visita PMR.
4. `CONS-16` - Relatorio executivo e resumo em tempo real.

## Por que essa ordem

- `CONS-13` altera limites PMR e precisa ser estabilizada antes de UI.
- `CONS-15` define o contrato de periodo que aparece no fluxo e no relatorio.
- `CONS-14` usa os contratos anteriores para organizar a tela.
- `CONS-16` fecha a entrega usando visita, periodo e registros.

## Decisoes que Precisam Estar Fechadas

| Decisao | Dono | Recomendacao |
|---|---|---|
| Visita 8 como `pmr_8` ou acompanhamento compativel | @architect + @po | Acompanhamento compativel sem quebrar PMR 1-7. |
| Campos de periodo | @data-engineer + @architect | `analysis_period_start`, `analysis_period_end`, `analysis_period_preset`. |
| Padrao do relatorio executivo | @pm + @po | Builder deterministico com secoes fixas. |
| Exposicao do dono/lojista | @data-engineer + @po | Dono ve somente dados permitidos do seu cliente/loja. |

## Definition of Ready

- [ ] `go-no-go-checklist.md` aprovado para Wave 1.
- [ ] `decision-log.md` sem pendencia bloqueadora para CONS-13 a CONS-16.
- [ ] @po aprovou as quatro stories da Onda 1.
- [ ] @architect aprovou abordagem de visita 8 e relatorio.
- [ ] @data-engineer aprovou persistencia de periodo e RLS.
- [ ] @ux-design-expert aprovou fluxo sequencial.
- [ ] @qa aprovou plano de testes.

## Definition of Done

- [ ] CONS-13 a CONS-16 atualizadas com checklist e File List.
- [ ] `npm run lint` passou.
- [ ] `npm run typecheck` passou.
- [ ] `npm test` passou.
- [ ] Regressao PMR 1-7 validada.
- [ ] Visita 8 validada.
- [ ] Relatorio com periodo validado.
- [ ] RLS smoke por papel validado quando aplicavel.
- [ ] Smoke visual desktop/mobile validado.

## Arquivos de Referencia

- `docs/stories/story-CONS-13-visita-8-acompanhamento-mensal.md`
- `docs/stories/story-CONS-14-fluxo-sequencial-visita-pmr.md`
- `docs/stories/story-CONS-15-filtro-periodo-visita-relatorio.md`
- `docs/stories/story-CONS-16-relatorio-executivo-resumo-tempo-real.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-1-architecture-notes.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-1-data-rls-notes.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-1-ux-brief.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-1-qa-test-plan.md`
