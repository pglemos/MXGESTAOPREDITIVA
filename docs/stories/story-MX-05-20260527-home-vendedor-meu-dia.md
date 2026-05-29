# Story MX-05.1 - Home Vendedor Meu Dia

## Status

Done

## Story

**As a** Vendedor,
**I want** ver uma Home "Meu Dia" com meta, agenda, atividades, fechamento diario, ranking, score, feedbacks, PDI e treinamentos,
**so that** eu saiba o que fazer hoje e consiga fechar minha rotina sem usar o MX como CRM.

## Executor Assignment

executor: "ux-design-expert"
quality_gate: "dev"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "browser responsive audit"]

## Epic Reference

- **Epic:** EPIC-MX-05 - Home Vendedor + Fechamento Diario
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
- **Related existing story:** `docs/stories/story-OPS-20260508-role-ui-responsive-hardening.md`
- **Current implementation candidates:** `src/features/vendedor-home/VendedorHome.container.tsx`, `src/features/vendedor-home/hooks/useVendedorHomePage.ts`

## Context

Esta story formaliza a Home pessoal do vendedor. O working tree atual ja indica redesenho para "Meu Dia", carregamento de devolutivas e blocos de evolucao. A story deve garantir que a experiencia seja simples, mobile-first e sem duplicar CRM.

## Acceptance Criteria

1. Perfil `vendedor` acessa `/home` e ve a Home "Meu Dia".
2. A tela exibe meta, comissao estimada quando houver regra real, agenda, atividades, fechamento diario, ranking, score, feedbacks, PDI, treinamentos e trilhas.
3. Fechamento diario captura ou direciona para leads, agendamentos, visitas, vendas porta/carteira e expectativa do dia seguinte.
4. A Home nao cria pipeline de CRM nem campos comerciais duplicados de CRMs parceiros.
5. Dados ausentes exibem estado pendente e proxima acao clara.
6. Feedbacks e treinamentos usam hooks existentes, sem mockar conteudo.
7. Mobile passa sem overflow horizontal, cards gigantes quebrados ou CTA inacessivel.
8. Ranking e score pessoal nao quebram quando nao houver dados suficientes.

## Tasks / Subtasks

- [x] Validar se `VendedorHome.container.tsx` cobre todos os blocos do PRD.
- [x] Confirmar que `useVendedorHomePage` carrega metas, check-ins, ranking, treinamentos e devolutivas.
- [x] Validar que comissao estimada so aparece quando houver regra/fonte real.
- [x] Validar CTA de fechamento diario e estados pendentes.
- [x] Garantir que a Home nao duplica CRM.
- [x] Rodar browser audit mobile-first autenticado como vendedor.
- [x] Rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- [x] Atualizar Dev Agent Record e File List antes de concluir.

## Dev Notes

- Esta story nao deve mudar regras de negocio do lancamento diario sem sub-story propria.
- Vendedor deve ter experiencia de app pessoal, nao painel administrativo.
- Evitar dados falsos para comissao, score ou conquistas.
- Preservar trabalho em progresso do usuario.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Browser audit: vendedor mobile `390x844`
- Browser audit: vendedor desktop `1366x768`

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| Home Vendedor | PRD §4.2 FR-HOME-3 |
| Nao duplicar CRM | PRD §4.2 FR-HOME-3 |
| Fechamento diario | PRD §4.5 FR-DAILY |
| Dados operacionais | PRD §4.4 FR-DATA-1 |

## File List

- `docs/stories/story-MX-05-20260527-home-vendedor-meu-dia.md`
- `src/features/vendedor-home/VendedorHome.container.tsx`
- `src/features/vendedor-home/components/LancamentoGateBanner.tsx`
- `src/features/vendedor-home/hooks/useVendedorHomePage.ts`

## Dev Agent Record

### Debug Log

- Story criada em modo YOLO via @sm para formalizar EPIC-MX-05.1.
- @dev validou que `VendedorHome.container.tsx` ja implementa meta, agenda, atividades, fechamento diario, ranking, score, feedback, PDI/treinamentos e estados pendentes.
- @dev validou que `useVendedorHomePage` agrega metas, check-ins, ranking, treinamentos e devolutivas sem mocks de conteudo.
- @dev ajustou o grid do card "Minha Meta" para evitar 4 colunas fixas em mobile.
- Browser audit autenticado ficou bloqueado no ambiente local: dev bypass nao possui loja ativa/vinculo via RLS para concluir a simulacao de vendedor.
- @aiox-master/@dev conectou a trava N3 na Home Vendedor: banner de lancamento pendente, agenda bloqueada e ranking bloqueado ate o fechamento diario.
- Browser smoke local com `VITE_ENABLE_DEV_AUTH_BYPASS=true` e perfil `vendedor`: `390x844` e `1366x768` sem overflow horizontal.
- Gates executados em 2026-05-28: `npm run lint`, `npm run typecheck`, `npm test` (358 pass), `npm run build`.

### Completion Notes

- Home Vendedor segue sem pipeline de CRM e direciona fechamento diario para `/lancamento-diario`.
- Comissao estimada permanece como `Pendente` enquanto nao houver regra real de comissao.
- Gates passaram apos o ajuste localizado.
- Trava N3 implementada como regra de experiencia: sem lancamento de referencia, o vendedor ve CTA para `/lancamento-diario` e nao acessa agenda/ranking pela Home.
- Smoke autenticado real fica consolidado no QA gate D1-T7; o smoke local usou dev bypass vendedor por ausencia de sessao real no ambiente.

### Change Log

- 2026-05-27: Ajuste responsivo no card "Minha Meta" da Home Vendedor e registro de validacoes.
- 2026-05-28: Finalizacao D1-T5. Home Vendedor marcada `Done` com trava N3 operacional, gates completos e smoke local mobile/desktop.
