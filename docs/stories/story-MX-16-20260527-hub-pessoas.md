# Story MX-16.1 - Hub Pessoas

## Status

InProgress

## Story

**As a** gerente, RH, dono ou vendedor,
**I want** uma area Pessoas que organize usuarios, permissoes, feedbacks, PDIs e treinamentos conforme meu perfil,
**so that** desenvolvimento humano fique conectado a performance, disciplina e execucao.

## Executor Assignment

executor: "ux-design-expert"
quality_gate: "dev"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "browser responsive audit"]

## Epic Reference

- **Epic:** EPIC-MX-16 - Pessoas
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
- **Dependencies:** EPIC-MX-02, EPIC-MX-05, EPIC-MX-17
- **Related stories:** `docs/stories/story-DEV-24-reposicionar-treinamentos-desenvolvimento.md`, `docs/stories/story-DEV-27-feedback-pdi-recomendacao-conteudo.md`
- **Current implementation candidates:** existentes de PDI, feedbacks, treinamentos e usuarios

## Context

Esta story entrega o shell/hub Pessoas, reunindo caminhos para usuarios, permissoes, feedbacks, PDIs e treinamentos. A profundidade de cada submodulo pode permanecer nas telas existentes; o objetivo inicial e organizar acesso por perfil sem duplicar fluxos ja implementados.

## Acceptance Criteria

1. Area Pessoas aparece para perfis autorizados conforme escopo.
2. Hub apresenta entradas para usuarios, permissoes, feedbacks, PDIs e treinamentos.
3. Master/Dono acessa gestao de usuarios e permissoes conforme EPIC-MX-02.
4. Gerente acessa feedbacks, PDIs e treinamentos da equipe.
5. Vendedor acessa somente seus proprios feedbacks, PDIs e treinamentos.
6. RH acessa visao apropriada de treinamentos, PDIs e clima/desenvolvimento quando existir dado.
7. Estados pendentes nao inventam progresso, nota ou treinamento.
8. Desktop e mobile passam sem overflow horizontal.

## Tasks / Subtasks

- [x] Mapear telas/rotas existentes de usuarios, feedbacks, PDIs e treinamentos.
- [x] Definir shell do Hub Pessoas e navegacao por perfil.
- [x] Reutilizar componentes/rotas existentes sempre que possivel.
- [x] Implementar estados pendentes para submodulos incompletos.
- [x] Validar permissao Master/Dono/Gerente/RH/Vendedor.
- [x] Garantir que vendedor veja apenas os proprios itens.
- [ ] Rodar browser audit desktop/mobile.
- [x] Rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- [x] Atualizar Dev Agent Record e File List antes de concluir.

## Dev Notes

- Nao duplicar a gestao de permissoes do EPIC-MX-02.
- Nao duplicar biblioteca/trilhas da Universidade MX; apenas apontar para elas.
- Priorizar leitura operacional e continuidade de desenvolvimento, nao RH burocratico.
- Se houver rotas legadas, criar atalhos claros antes de refatorar profundamente.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Browser audit: desktop `1366x768`
- Browser audit: mobile `390x844`
- Teste de visibilidade por perfil

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| Area Pessoas | PRD §4.1 FR-MENU |
| Usuarios, permissoes, feedbacks, PDIs e treinamentos | PRD §4.1 |
| Perfis RH/Gerente/Vendedor | PRD §3 |
| Treinamentos e trilhas do vendedor | PRD §4.2 FR-HOME-3 |

## File List

- `docs/stories/story-MX-16-20260527-hub-pessoas.md`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/lib/auth/routeAccess.ts`
- `src/pages/GerenteFeedback.tsx`
- `src/pages/GerentePDI.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/VendedorFeedback.tsx`
- `src/pages/VendedorPDI.tsx`
- `src/pages/VendedorTreinamentos.tsx`
- `src/pages/Configuracoes.tsx`
- `src/features/configuracoes/components/tabs/EquipeUsuariosTab.tsx`

## Dev Agent Record

### Debug Log

- Story criada em modo YOLO via @sm para formalizar EPIC-MX-16.1.
- 2026-05-27: Reconciliei a story com a implementação existente: `/devolutivas`, `/pdi`, `/treinamentos`, `/configuracoes?aba=equipe-usuarios` e alias `/equipe` já cobrem usuários, feedbacks, PDIs, treinamentos e equipe por perfil.
- 2026-05-27: `RoleSwitch` em `src/App.tsx` garante superfícies diferentes para vendedor, gerente, dono e perfis internos nas rotas de feedback, PDI e treinamentos.
- 2026-05-27: `src/lib/auth/routeAccess.ts` mantém `/team` e `/equipe` protegidos por capability `manage_team`; `/pdi`, `/devolutivas` e `/treinamentos` são acessíveis a `USER_ROLES` com escopo controlado pelos hooks/telas.
- 2026-05-27: O menu em `src/components/Layout.tsx` organiza a área como `Gestão de Gente` para gerente e `Evolução` para vendedor, preservando rotas existentes.
- 2026-05-27: Gates executados no lote MX: `npm run lint` passou com warnings preexistentes, `npm run typecheck` passou, `npm test` passou com 329 testes e `npm run build` passou.
- 2026-05-27: Browser audit autenticado ficou pendente porque o bypass local não possui loja/vínculo ativo suficiente para abrir as áreas autenticadas por RLS sem fallback manual.

### Completion Notes

- Hub Pessoas foi reconciliado como composição de rotas existentes, não como nova rota paralela, para evitar duplicar fluxos de PDI, devolutivas, treinamentos e equipe.
- Ainda falta auditoria visual autenticada desktop/mobile com sessão real ou seed local de loja/membership.

### Change Log

- 2026-05-27: Story atualizada de `Draft` para `InProgress` com mapeamento, evidência de rotas e gates de qualidade.
