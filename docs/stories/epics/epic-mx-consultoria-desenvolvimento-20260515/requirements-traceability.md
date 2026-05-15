# Requirements Traceability - EPIC-MX-CONS-DEV-20260515

**Status:** Draft operacional  
**Fonte primaria:** `docs/prd/escopo-reuniao-daniel-sistema-2026-05-15.md`  
**Objetivo:** rastrear requisitos da reuniao para stories, agentes e gates.

## Matriz de Rastreabilidade

| Requisito da reuniao | Stories | Agentes gate | Evidencia esperada |
|---|---|---|---|
| Agenda como porta de entrada da consultoria | CONS-13, CONS-14 | @architect, @qa | Admin MX inicia visita pela agenda. |
| Visita 8 de acompanhamento mensal | CONS-13 | @architect, @data-engineer, @qa | Visita 8 existe sem quebrar PMR 1-7. |
| Tela de visita limpa e sequencial | CONS-14 | @ux-design-expert, @qa | Fluxo orienta objetivo, checklist, registro e finalizacao. |
| Periodo de analise na visita | CONS-15 | @data-engineer, @qa | Periodo aparece na visita e no relatorio. |
| Relatorio executivo padrao MX | CONS-16 | @architect, @qa | Relatorio gerado com secoes padrao. |
| Resumo em tempo real para cliente/dono | CONS-16 | @architect, @qa | Resumo fica disponivel no historico da visita. |
| Planejamento semelhante ao DRE | CONS-17, CONS-18 | @pm, @data-engineer, @po | Indicadores planejado x realizado aprovados. |
| Visao do dono separada da visao admin MX | CONS-19 | @ux-design-expert, @data-engineer, @qa | Dono ve apenas dados da sua loja/cliente. |
| Vendedor preenche rotina diaria mobile | OPS-20 | @ux-design-expert, @qa | Check-in simples e responsivo. |
| Gerente valida rotina | OPS-21 | @data-engineer, @qa | Gerente valida somente sua equipe/loja. |
| Notificacoes ou pop-ups da puxada diaria | OPS-22 | @architect, @qa | Notificacao in-app sem dependencia de WhatsApp. |
| Insights e disciplina do vendedor | OPS-23 | @data-engineer, @qa | Disciplina separada de performance comercial. |
| Reposicionar Treinamentos como Desenvolvimento | DEV-24 | @pm, @ux-design-expert, @po | Navegacao e linguagem refletem desenvolvimento de pessoas. |
| Biblioteca pesquisavel por tema | DEV-25 | @data-engineer, @qa | Conteudos filtraveis por tema e progresso registrado. |
| Avaliacao por estrelas e sugestao de conteudo | DEV-25 | @data-engineer, @qa | Avaliacao/sugestao registrada por usuario. |
| Trilha de novo colaborador | DEV-26 | @architect, @qa | Gerente atribui trilha e recebe conclusao. |
| Feedback/PDI recomendam conteudo | DEV-27 | @architect, @data-engineer, @qa | Lacuna gera recomendacao deterministica. |
| Personalizacao institucional por loja | APP-28 | @data-engineer, @qa | Conteudo de loja nao vaza entre tenants. |
| Conteudos de especialistas/fornecedores | APP-29 | @pm, @qa | Conteudo possui fonte, status editorial e revisao. |
| Mobile/app readiness | APP-30 | @qa, @devops | Matriz mobile/PWA validada. |
| Checklist Apple/Google | APP-31 | @devops, @qa | Checklist sem credenciais e com evidencias de QA. |

## Cobertura por Area do Escopo

| Area do escopo | Cobertura | Observacao |
|---|---|---|
| 4.1 Consultoria e Visitas PMR | CONS-13 a CONS-14 | Coberta. |
| 4.2 Relatorio Executivo e Resumo | CONS-16 | Coberta; transcricao fica como extensao se fonte existir. |
| 4.3 Filtros de Periodo | CONS-15 | Coberta. |
| 4.4 Planejamento Estrategico | CONS-17 a CONS-18 | Coberta com recorte MVP. |
| 4.5 Visao Dono/Admin/Gerente/Vendedor | CONS-19, OPS-21, DEV-24 | Coberta por papel. |
| 4.6 Acompanhamento Diario | OPS-20 a OPS-23 | Coberta. |
| 4.7 Desenvolvimento de Pessoas | DEV-24 | Coberta. |
| 4.8 Biblioteca de Conteudo | DEV-25, APP-29 | Coberta. |
| 4.9 Trilha Novo Colaborador | DEV-26 | Coberta. |
| 4.10 Personalizacao por Loja | APP-28 | Coberta como Onda 5. |
| 4.11 Feedback/PDI | DEV-27 | Coberta com reuso de stories existentes. |
| 4.12 Engajamento/Gamificacao | OPS-23, DEV-24 | Coberta como disciplina simples, sem gamificacao completa. |
| 4.13 App Mobile/Publicacao | APP-30, APP-31 | Coberta como readiness, nao submissao real. |

## Gaps Aceitos no MVP

- Transcricao automatica de reuniao depende de fonte externa e nao bloqueia CONS-16.
- IA para relatorio/recomendacao nao entra no MVP; usar builder/regra deterministica.
- 45 indicadores do planejamento ficam fora do primeiro recorte.
- WhatsApp fica fora da Onda 3; notificacao in-app primeiro.
- Submissao real Apple/Google fica fora ate APP-30 e APP-31 passarem.
