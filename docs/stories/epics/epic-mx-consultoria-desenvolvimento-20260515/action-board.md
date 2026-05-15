# Action Board - EPIC-MX-CONS-DEV-20260515

**Status:** Specialist gates passed - aguardando staging/PR DevOps  
**Uso:** fila de acoes para agentes AIOX.

## Ready for PR Packaging

| ID | Acao | Dono | Entrada | Saida esperada |
|---|---|---|---|---|
| A-01 | Escopo e segunda passada validados | @po | `story-index.md`, `go-no-go-checklist.md` | Concluido |
| A-02 | Riscos criticos e acesso validados | @qa | `risk-register.md`, QA plans | Concluido |
| A-03 | Smoke autenticado por papel | @qa | app em ambiente conectado | Concluido |
| A-04 | Revisar migrations/RLS | @data-engineer + @qa | `supabase/migrations/*` | Concluido |
| A-05 | Decidir PWA/wrapper/nativo | @pm + @devops | `docs/app-readiness/*` | Estrategia para submissao real |
| A-06 | Preparar staging/branch/PR/deploy | @devops | pacote validado | PR/deploy conforme Constitution |

## Technical Preflight Completed

| ID | Acao | Dono | Entrada | Saida esperada |
|---|---|---|---|---|
| T-01 | Mapear impacto PMR 1-7 e visita 8 | @architect | `wave-1-architecture-notes.md` | `wave-1-architect-preflight.md` |
| T-02 | Validar migration visita 8 e periodo | @data-engineer | `wave-1-data-rls-notes.md` | `wave-1-data-preflight.md` |
| T-03 | Validar fluxo sequencial de visita | @ux-design-expert | `wave-1-ux-brief.md` | `wave-1-ux-preflight.md` |
| T-04 | Confirmar QA da Onda 1 | @qa | `wave-1-qa-test-plan.md` | `wave-1-qa-preflight.md` |

## Implementation Progress

| ID | Story | Dono | Pre-condicao |
|---|---|---|---|
| I-01 | CONS-13 | @dev | Implementada e validada em yolo mode |
| I-02 | CONS-15 | @dev | Implementada e validada em yolo mode |
| I-03 | CONS-14 | @dev | Implementada e validada em yolo mode |
| I-04 | CONS-16 | @dev | Implementada e validada em yolo mode |
| I-05 | CONS-17 | @pm/@data-engineer | 45 indicadores completos implementados em helper, catalogo e migration |
| I-06 | CONS-18 | @dev | Tabela planejado x realizado implementada |
| I-07 | CONS-19 | @dev/@ux-design-expert | Visao do dono com alertas implementada |
| I-08 | OPS-20 | @dev/@ux-design-expert | Campos MVP e UX dia anterior/hoje implementados |
| I-09 | OPS-21 | @dev/@data-engineer | Validacao gerente enriquecida com snapshot de rotina |
| I-10 | OPS-22 | @dev/@architect | Lembrete manual in-app para pendentes implementado |
| I-11 | OPS-23 | @dev/@data-engineer | Disciplina simples do vendedor implementada |
| I-12 | DEV-24 | @dev/@ux-design-expert | Reposicionamento para Desenvolvimento implementado |
| I-13 | DEV-25 | @dev/@data-engineer | Biblioteca com avaliacao, sugestao e curadoria persistidas |
| I-14 | DEV-26 | @architect/@dev | Trilha de novo colaborador persistida com bloqueios e notificacao |
| I-15 | DEV-27 | @architect/@data-engineer | Feedback/PDI geram recomendacoes persistidas |
| I-16 | APP-28 | @architect/@dev | Contrato de conteudo institucional por loja preparado |
| I-17 | APP-29 | @pm/@dev | Curadoria persistida com ratings, sugestoes e status editorial |
| I-18 | APP-30 | @devops/@qa/@dev | Readiness mobile/PWA documentado e shortcuts corrigidos |
| I-19 | APP-31 | @devops/@qa | Checklist Apple/Google criado |

## Later Queue

| ID | Onda | Acao | Dono |
|---|---|---|---|
| L-04 | 5 | Decidir PWA/wrapper/nativo | @devops/@pm |

## Blocked

| ID | Item | Motivo | Desbloqueio |
|---|---|---|---|
| B-01 | Implementacao Onda 1 | Sem bloqueio tecnico restante | Pronta para revisao PO/QA final |
| B-02 | Implementacao Onda 2 | Sem bloqueio tecnico restante | Pronta para QA final |
| B-03 | Implementacao Onda 4 | Sem bloqueio tecnico restante | Validada por smoke remoto de desenvolvimento |
| B-04 | Submissao app | Depende de decisao PWA/wrapper/nativo, contas demo finais e @devops | APP-30/APP-31 prontos como checklist |
