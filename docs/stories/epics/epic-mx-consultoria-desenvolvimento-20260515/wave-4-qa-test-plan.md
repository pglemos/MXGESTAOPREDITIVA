# Wave 4 QA Test Plan

**Status:** Draft para @qa  
**Onda:** 4 - Desenvolvimento de pessoas  
**Stories:** DEV-24, DEV-25, DEV-26, DEV-27

## Objetivo

Validar que a area de desenvolvimento funciona como produto de entrada, sem virar LMS paralelo, e que progresso, PDI, feedback, avaliacoes e recomendacoes respeitam acesso por papel.

## Matriz de Papeis

| Papel | Deve conseguir | Nao deve conseguir |
|---|---|---|
| Vendedor | Ver biblioteca, progresso, trilha propria e recomendacoes proprias. | Ver PDI/feedback/progresso de outro vendedor. |
| Gerente | Ver equipe, atribuir trilha/conteudo e acompanhar progresso da loja. | Acessar loja fora do vinculo. |
| Dono/lojista | Ver leitura agregada se produto liberar. | Administrar conteudos MX ou ver feedback individual indevido. |
| Admin/admin master MX | Administrar conteudos, trilhas, sugestoes e auditoria. | Quebrar isolamento multi-tenant por atalhos de UI. |

## Cenarios Funcionais

### DEV-24

- [ ] Navegacao apresenta area como Desenvolvimento/Evolucao conforme decisao.
- [ ] Rotas antigas de Treinamentos continuam funcionando.
- [ ] Vendedor encontra biblioteca, recomendados, progresso e PDI/feedback permitido.
- [ ] Gerente encontra equipe, trilhas, biblioteca e PDI/feedback.
- [ ] Admin MX preserva auditoria/admin da area.

### DEV-25

- [ ] Busca textual encontra conteudo por titulo/descricao/tema.
- [ ] Filtro por tema funciona.
- [ ] Progresso de conteudo continua sendo registrado.
- [ ] Usuario avalia conteudo.
- [ ] Usuario sugere conteudo.
- [ ] Conteudo mal avaliado aparece para revisao administrativa.
- [ ] Vendedor nao altera avaliacao/progresso de outro usuario.

### DEV-26

- [ ] Gerente/admin MX atribui trilha a novo vendedor.
- [ ] Vendedor ve etapas e progresso.
- [ ] Etapa bloqueada respeita prerequisito.
- [ ] Conclusao da trilha notifica gerente.
- [ ] Sistema deixa claro que liberacao para venda e decisao do gestor.

### DEV-27

- [ ] Feedback/PDI registra lacuna/competencia.
- [ ] Lacuna recomenda conteudo por regra deterministica.
- [ ] Vendedor ve recomendacao propria com motivo.
- [ ] Gerente acompanha consumo do conteudo recomendado.
- [ ] Recomendacao nao depende de IA.
- [ ] Feedback/PDI de outro vendedor nao aparece.

## Testes Tecnicos

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] RLS/access smoke para vendedor, gerente, dono e admin.
- [ ] Browser smoke mobile para vendedor.
- [ ] Browser smoke desktop para gerente/admin.
- [ ] Teste de avaliacao unica por usuario/conteudo se houver schema.
- [ ] Teste de recomendacao deterministica.

## Dados de Teste Sugeridos

- Vendedor com progresso de conteudo.
- Vendedor sem progresso.
- Conteudo com avaliacao alta.
- Conteudo com avaliacao baixa.
- Sugestao de conteudo pendente.
- Trilha atribuida.
- Trilha concluida.
- Feedback com lacuna.
- PDI com objetivo ligado a tema.
- Gerente com uma loja vinculada.
- Admin MX.

## Criterio de Falha Bloqueadora

- Rota antiga de Treinamentos quebra.
- Vendedor ve PDI/feedback de outro vendedor.
- Gerente ve loja fora do vinculo.
- Trilha conclui e libera venda automaticamente.
- Recomendacao depende de IA no MVP.
- Conteudo personalizado de loja entra nesta onda sem isolamento aprovado.
