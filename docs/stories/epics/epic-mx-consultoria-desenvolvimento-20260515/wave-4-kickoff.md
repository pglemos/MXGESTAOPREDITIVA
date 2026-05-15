# Wave 4 Kickoff - Desenvolvimento de Pessoas

**Status:** Ready for PO review  
**Onda:** 4  
**Stories:** DEV-24, DEV-25, DEV-26, DEV-27  
**Objetivo:** reposicionar Treinamentos como Desenvolvimento de Pessoas, com biblioteca, trilha de novo colaborador e recomendacoes ligadas a feedback/PDI.

## Resultado Esperado

Ao final da Onda 4, a equipe MX deve conseguir demonstrar:

1. Area atual de Treinamentos reposicionada como Desenvolvimento/Evolucao.
2. Biblioteca pesquisavel por tema.
3. Conteudo com progresso, avaliacao e sugestao.
4. Gerente/admin MX atribui trilha de novo colaborador.
5. Vendedor acompanha progresso da trilha.
6. Feedback/PDI gera recomendacao deterministica de conteudo.
7. PDI, feedback e progresso respeitam acesso por papel.

## Ordem de Execucao

1. `DEV-24` - Reposicionar Treinamentos como Desenvolvimento.
2. `DEV-25` - Biblioteca de conteudo por tema, avaliacao e sugestao.
3. `DEV-26` - Trilha de novo colaborador.
4. `DEV-27` - Feedback e PDI com recomendacao de conteudo.

## Por que essa ordem

- `DEV-24` define linguagem, navegacao e arquitetura de informacao.
- `DEV-25` cria catalogo e metadados que sustentam trilha e recomendacao.
- `DEV-26` usa a biblioteca para montar onboarding.
- `DEV-27` conecta lacunas de desenvolvimento aos conteudos ja catalogados.

## Decisoes que Precisam Estar Fechadas

| Decisao | Dono | Recomendacao |
|---|---|---|
| Nome final da area | @pm + @po | Desenvolvimento como modulo; Meu Plano de Carreira como subarea do vendedor. |
| Taxonomia MVP da biblioteca | @pm + @ux-design-expert | Temas de funil, rotina e competencias comerciais. |
| Escala de avaliacao | @pm + @data-engineer | 1 a 5 estrelas com comentario opcional. |
| Conteudos obrigatorios da trilha | @pm | Mercado, rotina, funil, atendimento e CRM/check-in. |
| Modelo de recomendacao | @architect | Deterministico: lacuna -> tema -> conteudo. |

## Definition of Ready

- [ ] Nome da area aprovado por @pm/@po.
- [ ] Taxonomia MVP aprovada.
- [ ] @data-engineer aprovou metadados, avaliacoes, sugestoes e RLS.
- [ ] @architect aprovou contrato de trilha/recomendacao.
- [ ] @ux-design-expert aprovou arquitetura de informacao.
- [ ] @qa aprovou plano de testes por papel.

## Definition of Done

- [ ] DEV-24 a DEV-27 atualizadas com checklist e File List.
- [ ] `npm run lint` passou.
- [ ] `npm run typecheck` passou.
- [ ] `npm test` passou.
- [ ] Rotas existentes continuam funcionando.
- [ ] Vendedor ve apenas proprio progresso/PDI/feedback permitido.
- [ ] Gerente ve apenas equipe/loja permitida.
- [ ] Conteudo mal avaliado vira revisao, nao remocao automatica.
- [ ] Recomendacao funciona sem IA.

## Arquivos de Referencia

- `docs/stories/story-DEV-24-reposicionar-treinamentos-desenvolvimento.md`
- `docs/stories/story-DEV-25-biblioteca-conteudo-temas-avaliacao.md`
- `docs/stories/story-DEV-26-trilha-novo-colaborador.md`
- `docs/stories/story-DEV-27-feedback-pdi-recomendacao-conteudo.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-4-development-notes.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-4-architecture-notes.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-4-data-rls-notes.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-4-ux-brief.md`
- `docs/stories/epics/epic-mx-consultoria-desenvolvimento-20260515/wave-4-qa-test-plan.md`
