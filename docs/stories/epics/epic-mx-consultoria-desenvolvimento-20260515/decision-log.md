# Decision Log - EPIC-MX-CONS-DEV-20260515

**Status:** Decisions updated after yolo implementation  
**Uso:** registrar decisoes tomadas e pendentes antes de execucao.

## Decisoes Tomadas

| ID | Decisao | Data | Fonte | Impacto |
|---|---|---|---|---|
| D-01 | Consultor no sistema sera tratado como admin/admin master MX. | 2026-05-15 | Reuniao + ajuste de escopo | Evita confundir cliente/lojista com consultor. |
| D-02 | Cliente sera tratado como lojista/dono. | 2026-05-15 | Reuniao + ajuste de escopo | Orienta visao do dono e relatorios. |
| D-03 | Implementacao sera por ondas, nao big bang. | 2026-05-15 | AIOX Master | Reduz risco brownfield. |
| D-04 | Onda 1 prioriza consultoria PMR pronta para uso. | 2026-05-15 | PRD/Plano | Entrega valor operacional imediato. |
| D-05 | Planejamento usara recorte MVP dos indicadores antes dos 45 indicadores. | 2026-05-15 | Wave 2 notes | Evita escopo excessivo. |
| D-06 | Desenvolvimento nao sera LMS completo no MVP. | 2026-05-15 | Wave 4 notes | Mantem foco em desenvolvimento comercial. |
| D-07 | Recomendacao de conteudo sera deterministica no MVP. | 2026-05-15 | Wave 4 architecture | Evita dependencia de IA. |
| D-08 | App store sera readiness/checklist antes de submissao real. | 2026-05-15 | Wave 5 notes | Evita envio prematuro. |
| D-09 | Recorte MVP de planejamento fica em 16 indicadores. | 2026-05-15 | CONS-17 yolo mode | Libera tela de planejamento e visao do dono sem esperar os 45 indicadores. |
| D-10 | `trade_in_volume` aparece no MVP como indicador com fonte pendente. | 2026-05-15 | CONS-17/Data preflight | Mantem o tema citado na reuniao visivel sem bloquear entrega. |
| D-11 | Area sera apresentada como Desenvolvimento no MVP. | 2026-05-15 | DEV-24 yolo mode | Reposiciona Treinamentos sem quebrar rotas existentes. |
| D-12 | Campos do check-in diario reutilizam `lancamentos_diarios`. | 2026-05-15 | OPS-20 yolo mode | Evita banco paralelo e preserva validacoes existentes. |
| D-13 | Primeiro incentivo sera disciplina percentual/status simples. | 2026-05-15 | OPS-23 yolo mode | Evita gamificacao robusta no MVP. |

## Decisoes Pendentes

| ID | Decisao pendente | Dono | Bloqueia | Opcao recomendada |
|---|---|---|---|---|
| P-08 | Taxonomia oficial da biblioteca. | @pm/@ux-design-expert | DEV-25 | Usar temas de funil e rotina comercial. |
| P-09 | Escala de avaliacao de conteudo. | @pm/@data-engineer | DEV-25 | 1 a 5 estrelas com comentario opcional. |
| P-10 | Persistencia formal da trilha de novo colaborador. | @pm/@data-engineer | DEV-26 | Mercado, rotina, funil, atendimento, CRM/check-in como contrato inicial. |
| P-11 | Estrategia PWA, wrapper ou app nativo. | @devops/@pm | APP-30/31 | Validar PWA primeiro. |
| P-12 | Conta demo e evidencias para Apple/Google. | @qa/@devops/@pm | APP-31 | Criar fora do repositorio e nunca registrar credenciais em docs. |

## Como Atualizar

- Decisao aprovada sai de "Decisoes Pendentes" e entra em "Decisoes Tomadas".
- Toda mudanca que alterar escopo deve apontar para PRD, story ou transcricao.
- Decisao sem dono nao deve desbloquear implementacao.
