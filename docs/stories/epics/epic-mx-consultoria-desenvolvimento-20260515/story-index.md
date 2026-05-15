# Story Index - EPIC-MX-CONS-DEV-20260515

**Status:** Implementation index - aguardando QA/PO final  
**Fonte:** PRD e escopo da reuniao Daniel/Jose  
**Uso:** ponto unico para @sm, @po, @dev e @qa localizarem stories.

## Wave 1 - Consultoria PMR

| Story | Arquivo | Status | Lead |
|---|---|---|---|
| CONS-13 | `docs/stories/story-CONS-13-visita-8-acompanhamento-mensal.md` | Implemented - aguardando validacao final | @data-engineer + @dev |
| CONS-14 | `docs/stories/story-CONS-14-fluxo-sequencial-visita-pmr.md` | Implemented - aguardando validacao final | @ux-design-expert + @dev |
| CONS-15 | `docs/stories/story-CONS-15-filtro-periodo-visita-relatorio.md` | Implemented - aguardando validacao final | @data-engineer + @dev |
| CONS-16 | `docs/stories/story-CONS-16-relatorio-executivo-resumo-tempo-real.md` | Implemented - aguardando validacao final | @architect + @dev |

## Wave 2 - Dono e Planejamento

| Story | Arquivo | Status | Lead |
|---|---|---|---|
| CONS-17 | `docs/stories/story-CONS-17-recorte-indicadores-planejamento-mvp.md` | Implemented - aguardando validacao final | @pm + @data-engineer |
| CONS-18 | `docs/stories/story-CONS-18-planejamento-estrategico-planejado-realizado.md` | Implemented - aguardando validacao final | @data-engineer + @dev |
| CONS-19 | `docs/stories/story-CONS-19-visao-dono-performance-alertas.md` | Implemented - aguardando validacao final | @ux-design-expert + @dev |

## Wave 3 - Rotina Diaria

| Story | Arquivo | Status | Lead |
|---|---|---|---|
| OPS-20 | `docs/stories/story-OPS-20-campos-preenchimento-diario-vendedor.md` | Implemented - aguardando validacao final | @ux-design-expert + @dev |
| OPS-21 | `docs/stories/story-OPS-21-validacao-gerente-rotina-diaria.md` | Implemented - aguardando validacao final | @dev + @data-engineer |
| OPS-22 | `docs/stories/story-OPS-22-notificacoes-puxada-diaria.md` | Implemented - aguardando validacao final | @architect + @dev |
| OPS-23 | `docs/stories/story-OPS-23-insights-disciplina-vendedor.md` | Implemented - aguardando validacao final | @data-engineer + @dev |

## Wave 4 - Desenvolvimento

| Story | Arquivo | Status | Lead |
|---|---|---|---|
| DEV-24 | `docs/stories/story-DEV-24-reposicionar-treinamentos-desenvolvimento.md` | Implemented - aguardando validacao final | @ux-design-expert + @dev |
| DEV-25 | `docs/stories/story-DEV-25-biblioteca-conteudo-temas-avaliacao.md` | Implemented - avaliacao, sugestao e curadoria persistidas | @data-engineer + @dev |
| DEV-26 | `docs/stories/story-DEV-26-trilha-novo-colaborador.md` | Implemented - workflow persistido com bloqueios e notificacao | @architect + @dev |
| DEV-27 | `docs/stories/story-DEV-27-feedback-pdi-recomendacao-conteudo.md` | Implemented - recomendacoes persistidas por feedback/PDI | @architect + @data-engineer + @dev |

## Wave 5 - Personalizacao e App Readiness

| Story | Arquivo | Status | Lead |
|---|---|---|---|
| APP-28 | `docs/stories/story-APP-28-trilha-institucional-personalizada-loja.md` | Implemented - conteudo institucional por loja | @architect + @dev |
| APP-29 | `docs/stories/story-APP-29-curadoria-conteudos-especialistas-fornecedores.md` | Implemented - curadoria persistida | @pm + @dev |
| APP-30 | `docs/stories/story-APP-30-app-readiness-mobile-pwa.md` | Implemented - readiness documental e PWA shortcuts ajustados | @devops + @qa + @dev |
| APP-31 | `docs/stories/story-APP-31-checklist-submissao-apple-google.md` | Implemented - checklist operacional criado | @devops + @qa |

## Proximo Lote Recomendado

1. QA autenticado por papel para CONS-13..APP-31.
2. PO revisar APP-28/29 como extensoes comerciais implementadas; DEV-25/26/27 foram completadas.
3. Data/RLS review das migrations CONS-13, CONS-15 e CONS-17.
4. DevOps branch/PR/deploy se o pacote for aceito.

Justificativa: a segunda passada fechou biblioteca, trilha, feedback/PDI, curadoria, APP-28 e os 45 indicadores; o risco restante fica na decisao de publicacao mobile.
