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
| D-05 | Planejamento iniciou por recorte e depois recebeu os 45 indicadores completos. | 2026-05-15 | CONS-17 second pass | Atende a cobranca de catalogo completo sem depender de BI externo. |
| D-06 | Desenvolvimento fica completo para biblioteca, trilha, feedback/PDI e curadoria; nao vira marketplace/LMS externo. | 2026-05-15 | Wave 4 second pass | Mantem foco em desenvolvimento comercial persistido no sistema. |
| D-07 | Recomendacao de conteudo sera deterministica e persistida. | 2026-05-15 | Wave 4 architecture | Evita dependencia de IA e preserva historico auditavel. |
| D-08 | App store sera readiness/checklist antes de submissao real. | 2026-05-15 | Wave 5 notes | Evita envio prematuro. |
| D-09 | Catalogo de planejamento fica com 45 indicadores. | 2026-05-15 | CONS-17 second pass | Fecha o gap apontado pelo usuario sobre os indicadores do Daniel. |
| D-10 | `trade_in_volume` fica como indicador materializado no catalogo de planejamento. | 2026-05-15 | CONS-17/Data preflight | Mantem o tema citado na reuniao visivel no dono/consultoria. |
| D-11 | Area sera apresentada como Desenvolvimento no MVP. | 2026-05-15 | DEV-24 yolo mode | Reposiciona Treinamentos sem quebrar rotas existentes. |
| D-12 | Campos do check-in diario reutilizam `lancamentos_diarios`. | 2026-05-15 | OPS-20 yolo mode | Evita banco paralelo e preserva validacoes existentes. |
| D-13 | Primeiro incentivo sera disciplina percentual/status simples. | 2026-05-15 | OPS-23 yolo mode | Evita gamificacao robusta no MVP. |

## Decisoes Pendentes

| ID | Decisao pendente | Dono | Bloqueia | Opcao recomendada |
|---|---|---|---|---|
| P-11 | Estrategia PWA, wrapper ou app nativo. | @devops/@pm | APP-30/31 | Validar PWA primeiro. |
| P-12 | Conta demo e evidencias para Apple/Google. | @qa/@devops/@pm | APP-31 | Criar fora do repositorio e nunca registrar credenciais em docs. |

## Como Atualizar

- Decisao aprovada sai de "Decisoes Pendentes" e entra em "Decisoes Tomadas".
- Toda mudanca que alterar escopo deve apontar para PRD, story ou transcricao.
- Decisao sem dono nao deve desbloquear implementacao.
