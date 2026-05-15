# Epic Set: MX Consultoria Digital e Desenvolvimento de Pessoas

**Epic Set ID:** EPIC-MX-CONS-DEV-20260515  
**Status:** SPECIALIST GATES PASSED - READY FOR PR PACKAGING  
**Origem:** reuniao Jose Roberto + Daniel Santos MX, registrada em `docs/prd/escopo-reuniao-daniel-sistema-2026-05-15.md`  
**PRD Brownfield:** `docs/prd/prd-mx-consultoria-digital-desenvolvimento-20260515.md`  
**Orquestracao:** @aiox-master (Orion)  
**Produto:** @pm (Morgan) + @po (Pax)  
**Data:** 2026-05-15

## Comando AIOX Recomendado

```text
@aiox-master
*workflow brownfield-fullstack --mode=guided
*plan create EPIC-MX-CONS-DEV-20260515
```

Para execucao por ondas, usar:

```text
@aiox-master
*workflow epic-orchestration --mode=guided
```

Para cada story nova, usar:

```text
@sm
*create-story

@architect
*plan create {storyId}

@dev
*task dev-develop-story

@qa
*task qa-review-story
```

## Artefatos de Controle

- `execution-brief.md`: resumo operacional de uma pagina para kickoff.
- `action-board.md`: fila de acoes por agente.
- `package-manifest.md`: inventario completo do pacote.
- `validation-report.md`: resultado de validacao estrutural dos artefatos.
- `story-index.md`: indice unico das stories.
- `requirements-traceability.md`: rastreabilidade entre reuniao, requisitos e stories.
- `risk-register.md`: riscos, mitigacoes e politica de escalada.
- `decision-log.md`: decisoes tomadas e pendentes.
- `dependency-matrix.md`: dependencias, paralelismo seguro e ordem minima.
- `go-no-go-checklist.md`: criterios de passagem entre ondas.
- `agent-routing.md`: autoridade e responsabilidade por agente AIOX.
- `execution-plan.yaml`: plano estruturado para orquestracao.
- `wave-1-kickoff.md`: pacote de partida da primeira onda executavel.
- `wave-1-qa-test-plan.md`: plano de testes da primeira onda.
- `docs/qa/gates/epic-mx-cons-dev-20260515.yml`: gate QA do pacote.
- `po-acceptance-note.md`: aceite PO da segunda passada de completude.
- `data-rls-predeploy-review.md`: revisao Data/RLS antes de deploy.
- `devops-prepush-report.md`: pre-push report e decisao de segurar push.

## Direcao Estrategica

O sistema deve deixar de ser apenas ferramenta operacional interna e virar plataforma de consultoria e produto de entrada para lojistas. Existem dois eixos:

1. **Consultoria PMR digitalizada:** admin/admin master MX conduz visitas, coleta dados, gera relatorio e entrega resumo ao lojista/dono sem sair do sistema.
2. **Desenvolvimento de pessoas como produto de entrada:** lojista recebe rotina, biblioteca, trilha de novo colaborador, PDI, feedback e engajamento diario para desenvolver vendedores.

## Principios de Execucao

- CLI First: qualquer regra, relatorio ou automacao deve ser modelada antes como contrato/servico verificavel.
- Observability Second: telas devem refletir estados, historico, logs e indicadores.
- UI Third: UI entra depois do contrato funcional, mantendo responsividade e clareza.
- Story-driven: nenhuma implementacao sem story em `docs/stories/`.
- RLS e papeis antes de expor dados por dono, gerente ou vendedor.
- Reutilizar o que ja existe em consultoria, PDI, treinamentos, matinal, agenda e notificacoes.

## Mapa de Agentes

| Frente | Agente lider | Subfrentes AIOX | Entregaveis |
|---|---|---|---|
| Escopo, PRD e priorizacao | @pm | @po para validacao | PRD revisado, epics, criterios de sucesso |
| UX de visitas, dono, vendedor e mobile | @ux-design-expert | @pm para valor de usuario | fluxos, wireframes, estados, responsivo |
| Arquitetura brownfield | @architect | @data-engineer para banco | contratos, impacto, limites, integracoes |
| Dados, RLS, relatorios e indicadores | @data-engineer | @qa para validacao de seguranca | schema, migrations, RLS, seeds, queries |
| Stories executaveis | @sm | @po para aceite | stories com ACs e File List |
| Implementacao | @dev | @ux-design-expert e @data-engineer por area | codigo, testes, atualizacao de stories |
| Qualidade | @qa | @dev para fixes | QA gate, testes, riscos, regressao |
| Deploy, PR e ambientes | @devops | @qa para gate final | branch, PR, release/deploy |

## Ondas de Execucao

### Onda 0 - Preparacao e fechamento de requisitos

**Objetivo:** transformar a reuniao em requisitos aprovados e stories bem cortadas.

Agentes:

- @pm: consolidar PRD brownfield.
- @po: validar escopo contra artefatos existentes.
- @architect: avaliar impacto tecnico.
- @ux-design-expert: mapear fluxos por papel.
- @data-engineer: mapear dados ja existentes e lacunas.

Saidas:

- `docs/prd/escopo-reuniao-daniel-sistema-2026-05-15.md` validado.
- backlog dividido por ondas.
- decisoes em aberto tratadas ou marcadas como bloqueadores.

### Onda 1 - Consultoria PMR pronta para uso

**Objetivo:** fechar o fluxo que permite ao admin/admin master MX conduzir visitas dentro do sistema.

Escopo:

- agenda como entrada operacional;
- visita 8 de acompanhamento mensal;
- fluxo sequencial e limpo para visitas;
- objetivo/metodologia/checklist por visita;
- filtro de periodo;
- conclusao administrativa de visitas legadas;
- anexos e relatorios;
- resumo em tempo real ao lojista/dono;
- relatorio executivo padrao MX.

Agentes:

- @ux-design-expert: redesenhar experiencia da visita.
- @architect: definir contrato do motor de visitas e relatorios.
- @data-engineer: validar `consulting_*`, RLS, anexos e status.
- @dev: implementar.
- @qa: regressao consultoria.

### Onda 2 - Visao do dono e planejamento estrategico

**Objetivo:** entregar valor claro ao lojista/dono com performance, alertas e planejamento.

Escopo:

- visao dono/cliente separada da visao admin MX;
- planejamento estrategico no estilo DRE, mas com planejado x realizado;
- comparativo ano anterior;
- volume de vendas;
- volume de carros de troca;
- recorte inicial dos 45 indicadores;
- alertas abaixo/dentro/acima do mercado.

Agentes:

- @pm: priorizar indicadores MVP.
- @ux-design-expert: visual de leitura do dono.
- @data-engineer: modelo de indicadores e consultas.
- @architect: compatibilidade com BI atual.
- @dev: implementacao.
- @qa: validacao de acesso por papel.

### Onda 3 - Acompanhamento diario, matinal e rotina

**Objetivo:** criar input diario confiavel para alimentar consultoria e engajar vendedor/gerente.

Escopo:

- preenchimento diario simples pelo vendedor;
- rotina sugerida;
- validacao pelo gerente;
- notificacoes/pop-ups;
- insights individuais;
- disciplina, pontuacao, estrelas ou ranking simples;
- foco em mobile/app.

Agentes:

- @pm: definir campos obrigatorios do MVP.
- @ux-design-expert: experiencia mobile do vendedor.
- @architect: contrato de notificacoes e rotinas.
- @data-engineer: modelo de preenchimento, validacao e auditoria.
- @dev: implementacao.
- @qa: testes por papel e mobile.

### Onda 4 - Desenvolvimento de pessoas

**Objetivo:** transformar Treinamentos em ambiente de desenvolvimento e produto de entrada.

Escopo:

- reposicionar area como Desenvolvimento/Evolucao/Meu Plano de Carreira;
- biblioteca pesquisavel por tema;
- avaliacao por estrelas;
- sugestao de conteudo;
- trilha de novo colaborador;
- feedback estruturado com lacunas;
- recomendacao de conteudo;
- PDI conectado a performance e rotina.

Agentes:

- @pm: proposta de produto e priorizacao.
- @ux-design-expert: arquitetura de informacao da area.
- @data-engineer: progresso, avaliacoes, trilhas, recomendacoes.
- @architect: integracao com PDI/feedback/treinamentos existentes.
- @dev: implementacao.
- @qa: validacao de fluxo gerente/vendedor.

### Onda 5 - Personalizacao por loja e publicacao app

**Objetivo:** criar diferenciais comerciais e preparar distribuicao mobile.

Escopo:

- trilha institucional por loja;
- conteudo sobre historia, valores e processos da loja;
- conteudos de especialistas e fornecedores;
- pacote de personalizacao comercial;
- checklist Apple/Google;
- verificacao dos fluxos principais antes da submissao.

Agentes:

- @pm: embalagem comercial e criterios de MVP.
- @ux-design-expert: experiencia da trilha institucional.
- @architect: modelo de conteudo personalizado.
- @dev: implementacao.
- @qa: regressao final.
- @devops: publicacao, PR, deploy e controle de ambiente.

## Backlog por Epic

| Epic | Titulo | Onda | Lider | Status |
|---|---|---:|---|---|
| EPIC-CONS-01 | Consultoria PMR executavel no sistema | 1 | @pm + @architect | Implemented - QA final |
| EPIC-CONS-02 | Relatorio executivo e resumo ao dono | 1 | @pm + @dev | Implemented - QA final |
| EPIC-CONS-03 | Planejamento estrategico e visao do dono | 2 | @pm + @data-engineer | Implemented - QA final |
| EPIC-OPS-04 | Rotina diaria, matinal e validacao gerente | 3 | @pm + @ux-design-expert | Implemented - QA final |
| EPIC-DEV-05 | Desenvolvimento de pessoas e biblioteca | 4 | @pm + @architect | Implemented - segunda passada |
| EPIC-DEV-06 | Trilha de novo colaborador | 4 | @pm + @sm | Implemented - segunda passada |
| EPIC-APP-07 | Personalizacao por loja e app readiness | 5 | @pm + @devops | Partial/Readiness |

## Stories Criadas - Onda 1

| Story | Titulo | Status | Agentes principais |
|---|---|---|---|
| CONS-13 | [Visita 8 de acompanhamento mensal](../../story-CONS-13-visita-8-acompanhamento-mensal.md) | Implemented - aguardando validacao final | @data-engineer + @dev |
| CONS-14 | [Fluxo sequencial e limpo da visita PMR](../../story-CONS-14-fluxo-sequencial-visita-pmr.md) | Implemented - aguardando validacao final | @ux-design-expert + @dev |
| CONS-15 | [Filtro de periodo para visita e relatorio](../../story-CONS-15-filtro-periodo-visita-relatorio.md) | Implemented - aguardando validacao final | @data-engineer + @dev |
| CONS-16 | [Relatorio executivo e resumo em tempo real](../../story-CONS-16-relatorio-executivo-resumo-tempo-real.md) | Implemented - aguardando validacao final | @architect + @dev |

Plano de implementacao da onda: `wave-1-implementation.yaml`.
Kickoff da onda: `wave-1-kickoff.md`.
Plano QA da onda: `wave-1-qa-test-plan.md`.
Readiness review: `wave-1-readiness-review.md`.

## Stories Criadas - Onda 2

| Story | Titulo | Status | Agentes principais |
|---|---|---|---|
| CONS-17 | [Catalogo completo dos indicadores de planejamento](../../story-CONS-17-recorte-indicadores-planejamento-mvp.md) | Implemented - 45 indicadores | @pm + @data-engineer |
| CONS-18 | [Planejamento estrategico com planejado x realizado](../../story-CONS-18-planejamento-estrategico-planejado-realizado.md) | Implemented - aguardando validacao final | @data-engineer + @dev |
| CONS-19 | [Visao do dono com performance e alertas](../../story-CONS-19-visao-dono-performance-alertas.md) | Implemented - aguardando validacao final | @ux-design-expert + @dev |

Plano de implementacao da onda: `wave-2-implementation.yaml`.
Recorte de indicadores: `wave-2-indicators-mvp.md`.
Kickoff da onda: `wave-2-kickoff.md`.
Plano QA da onda: `wave-2-qa-test-plan.md`.

## Stories Criadas - Onda 3

| Story | Titulo | Status | Agentes principais |
|---|---|---|---|
| OPS-20 | [Campos do preenchimento diario do vendedor](../../story-OPS-20-campos-preenchimento-diario-vendedor.md) | Implemented - aguardando validacao final | @ux-design-expert + @dev |
| OPS-21 | [Validacao do gerente na rotina diaria](../../story-OPS-21-validacao-gerente-rotina-diaria.md) | Implemented - aguardando validacao final | @dev + @data-engineer |
| OPS-22 | [Notificacoes da puxada diaria](../../story-OPS-22-notificacoes-puxada-diaria.md) | Implemented - aguardando validacao final | @architect + @dev |
| OPS-23 | [Insights de disciplina do vendedor](../../story-OPS-23-insights-disciplina-vendedor.md) | Implemented - aguardando validacao final | @data-engineer + @dev |

Plano de implementacao da onda: `wave-3-implementation.yaml`.
Notas de rotina: `wave-3-routine-notes.md`.
Kickoff da onda: `wave-3-kickoff.md`.
Plano QA da onda: `wave-3-qa-test-plan.md`.

## Stories Criadas - Onda 4

| Story | Titulo | Status | Agentes principais |
|---|---|---|---|
| DEV-24 | [Reposicionar Treinamentos como Desenvolvimento](../../story-DEV-24-reposicionar-treinamentos-desenvolvimento.md) | Implemented - aguardando validacao final | @ux-design-expert + @dev |
| DEV-25 | [Biblioteca de conteudo por tema, avaliacao e sugestao](../../story-DEV-25-biblioteca-conteudo-temas-avaliacao.md) | Implemented - persistencia completa | @data-engineer + @dev |
| DEV-26 | [Trilha de novo colaborador](../../story-DEV-26-trilha-novo-colaborador.md) | Implemented - workflow persistido | @architect + @dev |
| DEV-27 | [Feedback e PDI com recomendacao de conteudo](../../story-DEV-27-feedback-pdi-recomendacao-conteudo.md) | Implemented - recomendacoes persistidas | @architect + @data-engineer + @dev |

Plano de implementacao da onda: `wave-4-implementation.yaml`.
Notas de desenvolvimento: `wave-4-development-notes.md`.
Notas tecnicas: `wave-4-architecture-notes.md`, `wave-4-data-rls-notes.md`, `wave-4-ux-brief.md`.
Kickoff da onda: `wave-4-kickoff.md`.
Plano QA da onda: `wave-4-qa-test-plan.md`.

## Stories Criadas - Onda 5

| Story | Titulo | Status | Agentes principais |
|---|---|---|---|
| APP-28 | [Trilha institucional personalizada por loja](../../story-APP-28-trilha-institucional-personalizada-loja.md) | Implemented - conteudo institucional por loja | @architect + @dev |
| APP-29 | [Curadoria de conteudos com especialistas e fornecedores](../../story-APP-29-curadoria-conteudos-especialistas-fornecedores.md) | Implemented - curadoria persistida | @pm + @dev |
| APP-30 | [App readiness mobile e PWA](../../story-APP-30-app-readiness-mobile-pwa.md) | Implemented - readiness documental e PWA shortcuts ajustados | @devops + @qa + @dev |
| APP-31 | [Checklist de submissao Apple e Google](../../story-APP-31-checklist-submissao-apple-google.md) | Implemented - checklist operacional criado | @devops + @qa |

Plano de implementacao da onda: `wave-5-implementation.yaml`.
Notas de app readiness: `wave-5-app-readiness-notes.md`.
Checklist Apple/Google: `../../../app-readiness/apple-google-submission-checklist.md`.
Kickoff da onda: `wave-5-kickoff.md`.
Plano QA da onda: `wave-5-qa-test-plan.md`.

## Quality Gates

Cada story deve concluir com:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- testes E2E quando houver fluxo por papel ou mobile;
- story atualizada com checklist e File List;
- QA Gate de @qa antes de merge;
- @devops para push/PR/deploy, conforme Constitution.

## Bloqueadores e Decisoes Pendentes

- QA autenticado por papel: vendedor, gerente, dono e admin/admin master MX concluido.
- Segunda passada de biblioteca, trilha, feedback/PDI, curadoria, APP-28 e 45 indicadores concluida.
- Data/RLS validar migrations e isolamento multi-tenant em ambiente conectado concluido.
- DevOps decidir PWA, wrapper nativo ou submissao Apple/Google e conduzir branch/PR/deploy.
