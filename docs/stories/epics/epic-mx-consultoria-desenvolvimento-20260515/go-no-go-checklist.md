# GO/NO-GO Checklist - EPIC-MX-CONS-DEV-20260515

**Status:** Specialist gates passed - pronto para PR packaging  
**Responsavel pelo gate entre ondas:** @po  
**Responsaveis tecnicos:** @architect, @data-engineer, @ux-design-expert, @qa, @devops

## Regra Geral

Uma onda so deve entrar em desenvolvimento quando:

- [x] Stories estao em `docs/stories/`.
- [x] Acceptance criteria estao verificaveis.
- [x] Dependencias estao claras.
- [x] RLS/permissoes estao mapeadas quando houver dados por papel.
- [x] UX mobile esta considerada quando o fluxo envolver vendedor, gerente ou dono.
- [x] Plano de rollback ou compatibilidade esta claro para mudancas brownfield.

## Wave 0 - Requisitos

GO se:

- [x] Escopo da reuniao esta documentado.
- [x] Papeis estao corrigidos: consultor = admin/admin master MX; cliente = lojista/dono.
- [x] PRD brownfield existe.
- [x] Backlog por ondas existe.
- [x] PO confirma que nao ha requisito inventado.

NO-GO se:

- [ ] Ainda houver duvida sobre objetivo principal do produto.
- [ ] A primeira entrega nao estiver priorizada.

## Wave 1 - Consultoria PMR

GO se:

- [x] Decisao sobre visita 8 esta aprovada em yolo mode.
- [x] Fluxo legado PMR 1-7 esta protegido.
- [x] Periodo de analise tem contrato definido.
- [x] Relatorio executivo tem secoes padrao.
- [x] RLS de visitas e relatorios validada por QA autenticado.

NO-GO se:

- [ ] Visita 8 altera progresso PMR principal sem decisao explicita.
- [ ] Relatorio depende de IA para MVP.
- [ ] Dono consegue acessar dados fora do cliente/loja.

## Wave 2 - Dono e Planejamento

GO se:

- [x] Indicadores MVP foram aprovados em yolo mode.
- [x] Fontes dos indicadores estao classificadas como existente, derivada ou ausente.
- [x] Dados ausentes aparecem como sem dados, nao como zero.
- [x] Visao do dono esta separada da visao admin MX.

NO-GO se:

- [ ] Tentativa de implementar os 45 indicadores de uma vez.
- [ ] Indicador financeiro sensivel aparece sem decisao de produto.

## Wave 3 - Rotina Diaria

GO se:

- [x] Campos obrigatorios do check-in diario estao congelados.
- [x] Validacao do gerente esta definida.
- [x] Notificacao in-app esta definida sem dependencia de WhatsApp.
- [x] Disciplina mede consistencia, nao performance comercial.
- [x] Fluxo mobile foi considerado.

NO-GO se:

- [ ] Sistema cobra dado sem mostrar valor ao vendedor.
- [ ] Gerente valida informacao de loja fora do seu vinculo.

## Wave 4 - Desenvolvimento

GO se:

- [x] Nome da area foi decidido como Desenvolvimento no MVP.
- [x] Biblioteca tem taxonomia MVP.
- [x] Avaliacao e sugestao tem dono operacional para persistencia futura.
- [x] Trilha de novo colaborador depende de conteudo minimo.
- [x] Feedback/PDI recomendam conteudo por regra deterministica.

NO-GO se:

- [ ] O escopo virar LMS completo.
- [ ] Recomendacao depender de IA no MVP.
- [ ] PDI/feedback ficarem visiveis para usuario indevido.

## Wave 5 - Personalizacao e App Readiness

GO se:

- [x] Onda 4 tem base de biblioteca/trilha suficiente.
- [x] Conteudo institucional respeita multi-tenant no contrato.
- [x] Estrategia PWA/wrapper/nativo esta definida por @pm/@devops.
- [x] Checklist Apple/Google foi revisado por @qa e @devops.
- [x] Conta demo por papel foi planejada.

NO-GO se:

- [ ] Submissao real for tentada sem QA mobile.
- [ ] Credencial, certificado ou token estiver em docs ou git.
- [ ] Conteudo de terceiro nao tiver aprovacao de uso.

## Evidencias Minimas por Story Implementada

- [x] Story atualizada com checklist e File List.
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] Browser smoke sem sessao para rotas protegidas.
- [x] RLS smoke autenticado quando houver tabela/policy.
- [x] @qa registrou gate.
- [x] @devops registrou pre-push report; push/PR/deploy seguem retidos por gate.
