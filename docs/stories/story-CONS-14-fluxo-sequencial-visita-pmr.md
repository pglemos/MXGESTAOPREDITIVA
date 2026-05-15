# Story CONS-14 - Fluxo Sequencial e Limpo da Visita PMR

**Status:** Implemented - aguardando validacao final  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 1 - Consultoria PMR pronta para uso  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @ux-design-expert + @dev  
**Quality Gate:** @qa  
**Prioridade:** Critical

## Contexto

Daniel sinalizou que a tela atual esta no caminho certo, mas ainda confusa para uso por consultores novos e para reunioes online. O sistema deve conduzir a reuniao: abrir a visita, seguir as etapas, preencher o que precisa e fechar tudo dentro do sistema.

## User Story

Como admin/admin master MX,  
quero executar uma visita PMR em uma tela sequencial, limpa e guiada,  
para conduzir reunioes online ou presenciais sem depender da memoria da metodologia.

## Acceptance Criteria

- [x] Tela da visita apresenta objetivo, publico-alvo e metodologia antes dos campos operacionais.
- [x] Fluxo da visita e organizado em etapas previsiveis: contexto, periodo, checklist, registros, anexos, resumo e finalizacao.
- [x] Checklist fica sempre associado ao objetivo da visita atual.
- [x] Campos e acoes mudam conforme `visit_number`.
- [x] O consultor consegue iniciar visita a partir da agenda e cair no fluxo correto.
- [x] O layout funciona em desktop e mobile sem sobreposicao.
- [x] O fluxo evita cards aninhados e reduz ruido visual.
- [x] Estados de vazio, carregamento, erro e visita concluida sao claros.

## Regras de UX

- A tela deve ser obvia para consultor novo.
- Online e presencial devem usar o mesmo fluxo.
- Hero/marketing nao se aplica; e uma tela de trabalho.
- Priorizar densidade organizada, leitura rapida e comandos claros.

## Arquivos Provaveis

- `src/pages/ConsultoriaClienteDetalhe.tsx`
- `src/features/consultoria/components/VisitExecutionViews.tsx`
- `src/features/consultoria/components/VisitActionQuickAdd.tsx`
- `src/components/organisms/VisitCard.tsx`
- `src/hooks/useAgendaAdmin.ts`
- `src/test/*.playwright.ts`

## Plano AIOX

1. [x] @ux-design-expert define arquitetura de informacao da visita.
2. [x] @architect valida que fluxo nao muda contrato de dados indevidamente.
3. [x] @dev implementa rework visual e estados.
4. [x] @qa valida desktop/mobile e regressao de visita 1 a 7.

## Decisoes Assumidas em Yolo Mode

- A tela passa a exibir uma trilha fixa: contexto, periodo, metodologia, registros, evidencias, resumo e finalizacao.
- A visita 8 recebe execucao propria como acompanhamento mensal.
- O fluxo preserva os componentes existentes de V1 a V7 para reduzir risco.

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] Playwright/smoke da visita em desktop e mobile quando houver dev server.

## File List

- `docs/stories/story-CONS-14-fluxo-sequencial-visita-pmr.md`
- `src/pages/ConsultoriaVisitaExecucao.tsx`
- `src/features/consultoria/components/VisitExecutionViews.tsx`
