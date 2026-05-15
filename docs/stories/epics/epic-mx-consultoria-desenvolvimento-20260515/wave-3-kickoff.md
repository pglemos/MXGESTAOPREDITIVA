# Wave 3 Kickoff - Acompanhamento Diario e Rotina Mobile

**Status:** Ready for PO review  
**Onda:** 3  
**Stories:** OPS-20, OPS-21, OPS-22, OPS-23  
**Objetivo:** tornar o preenchimento diario confiavel, simples no celular e validado pelo gerente, sem criar um novo check-in.

## Resultado Esperado

Ao final da Onda 3, a equipe MX deve conseguir demonstrar:

1. Vendedor registra rotina diaria em mobile com campos MVP.
2. Gerente ve pendentes, preenchidos e valida a rotina da loja.
3. Sistema lembra vendedor pendente via notificacao in-app/popup.
4. Vendedor, gerente e admin MX veem disciplina de preenchimento sem misturar com performance comercial.
5. Admin MX usa os dados como insumo para consultoria.

## Ordem de Execucao

1. `OPS-20` - Campos do preenchimento diario do vendedor.
2. `OPS-21` - Validacao do gerente na rotina diaria.
3. `OPS-22` - Notificacoes da puxada diaria.
4. `OPS-23` - Insights de disciplina do vendedor.

## Por que essa ordem

- `OPS-20` congela o que o vendedor preenche.
- `OPS-21` valida o que foi preenchido.
- `OPS-22` notifica com base em pendencias reais.
- `OPS-23` calcula disciplina a partir de preenchimento e validacao.

## Decisoes que Precisam Estar Fechadas

| Decisao | Dono | Recomendacao |
|---|---|---|
| Campos obrigatorios do check-in diario | @pm + @po | Reaproveitar campos atuais de `lancamentos_diarios`. |
| Regra de justificativa para producao zero | @pm + @qa | Manter regra atual e validar UX mobile. |
| Horario padrao da puxada diaria | @pm | Documentar horario operacional no MVP. |
| Indicador de disciplina | @pm + @ux-design-expert | Status simples ou percentual, sem gamificacao robusta. |

## Definition of Ready

- [ ] Campos MVP aprovados por @pm/@po.
- [ ] @data-engineer confirmou que `lancamentos_diarios` continua fonte.
- [ ] @ux-design-expert validou fluxo mobile.
- [ ] @architect validou contrato de notificacao sem WhatsApp.
- [ ] @qa aprovou plano de testes por papel.

## Definition of Done

- [ ] OPS-20 a OPS-23 atualizadas com checklist e File List.
- [ ] `npm run lint` passou.
- [ ] `npm run typecheck` passou.
- [ ] `npm test` passou.
- [ ] Vendedor preenche em mobile sem bloqueio visual.
- [ ] Gerente valida apenas loja/equipe permitida.
- [ ] Notificacao nao duplica indefinidamente.
- [ ] Disciplina diferencia ausencia de dado de desempenho baixo.

## Arquivos de Referencia

- `docs/stories/story-OPS-20-campos-preenchimento-diario-vendedor.md`
- `docs/stories/story-OPS-21-validacao-gerente-rotina-diaria.md`
- `docs/stories/story-OPS-22-notificacoes-puxada-diaria.md`
- `docs/stories/story-OPS-23-insights-disciplina-vendedor.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-3-routine-notes.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-3-qa-test-plan.md`
