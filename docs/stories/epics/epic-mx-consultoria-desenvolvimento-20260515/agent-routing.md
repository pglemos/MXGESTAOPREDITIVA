# Roteamento AIOX - MX Consultoria Digital e Desenvolvimento de Pessoas

Este arquivo direciona o trabalho para agentes AIOX. Nao usar agentes nativos de background do Codex para esta orquestracao.

## Regra de Autoridade

| Tipo de trabalho | Agente correto | Observacao |
|---|---|---|
| Orquestrar workflow, corrigir rota, coordenar ondas | @aiox-master | Mantem plano e checkpoints |
| PRD, priorizacao, metricas, recorte de MVP | @pm | Nao cria story final sozinho |
| Validar escopo, aceite, rastreabilidade | @po | Gate entre ondas |
| Criar stories detalhadas | @sm | Autoridade para story creation |
| Arquitetura, impacto, contratos | @architect | Obrigatorio antes de mudancas amplas |
| Schema, RLS, migrations, dados | @data-engineer | Obrigatorio para qualquer tabela/policy |
| UX/UI, mobile, jornada por papel | @ux-design-expert | Obrigatorio para telas novas/rework forte |
| Implementar codigo | @dev | Usa story aprovada |
| Revisar qualidade, risco, testes | @qa | Gate antes de conclusao |
| Push, PR, release, deploy | @devops | Autoridade exclusiva |

## Artefatos Obrigatorios Antes de Executar

- `story-index.md`: confirmar story e arquivo correto.
- `requirements-traceability.md`: confirmar origem do requisito.
- `risk-register.md`: confirmar riscos e mitigacoes.
- `decision-log.md`: confirmar decisoes pendentes.
- `dependency-matrix.md`: confirmar dependencias e paralelismo seguro.
- `go-no-go-checklist.md`: confirmar gate da onda.
- `execution-plan.yaml`: confirmar agentes e criterio de qualidade.

## Sequencia Padrao por Story

1. @sm cria story a partir do epic e do PRD.
2. @po valida story.
3. @architect cria plano se houver impacto tecnico relevante.
4. @data-engineer valida schema/RLS quando houver dados.
5. @ux-design-expert valida fluxo/tela quando houver UX.
6. @dev implementa.
7. @qa revisa e roda gate.
8. @dev corrige feedback de QA, se houver.
9. @devops executa push/PR/deploy quando aprovado.

## Subfrentes por Dominio

### Consultoria PMR

- Lider tecnico: @architect
- Produto: @pm
- UX: @ux-design-expert
- Dados: @data-engineer
- Execucao: @dev
- Gate: @qa

Foco:

- visitas PMR 1-7;
- visita 8 acompanhamento;
- relatorio executivo;
- resumo em tempo real;
- filtro de periodo;
- anexos e historico.

### Visao Dono e Planejamento

- Lider de produto: @pm
- Dados: @data-engineer
- UX: @ux-design-expert
- Arquitetura: @architect
- Gate: @po + @qa

Foco:

- indicadores MVP;
- planejado x realizado;
- comparativo ano anterior;
- volume vendas;
- volume carros de troca;
- alertas por performance.

### Rotina Diaria e Mobile

- Lider UX: @ux-design-expert
- Produto: @pm
- Dados: @data-engineer
- Implementacao: @dev
- Gate: @qa

Foco:

- vendedor registra dados;
- gerente valida;
- notificacoes;
- disciplina/engajamento;
- experiencia celular/app.

### Desenvolvimento de Pessoas

- Lider arquitetura: @architect
- Produto: @pm
- UX: @ux-design-expert
- Dados: @data-engineer
- Gate: @po + @qa

Foco:

- biblioteca;
- trilha novo colaborador;
- PDI;
- feedback estruturado;
- recomendacao de conteudo;
- plano de carreira/evolucao.

### Personalizacao e App Readiness

- Lider operacional: @devops
- Produto: @pm
- Arquitetura: @architect
- QA: @qa

Foco:

- trilha institucional por loja;
- conteudo premium;
- checklist Apple/Google;
- regressao final;
- deploy/submissao.
