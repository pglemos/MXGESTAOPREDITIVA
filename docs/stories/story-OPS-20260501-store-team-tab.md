# Story OPS-20260501 - Equipe Dentro do Dashboard da Loja

## Status

Ready for Review

## Contexto

A gestão de equipe não deve existir como página independente. Tudo que é operacional de uma loja precisa ficar centralizado em `/lojas/:slug`, com a equipe tratada como aba do dashboard operacional daquela loja.

## Acceptance Criteria

- [x] `/lojas/:slug` possui aba `Equipe`.
- [x] A aba `Equipe` usa o CRUD completo de integrantes da loja.
- [x] Links de lista de lojas e navegação apontam para `/lojas/:slug?tab=equipe`.
- [x] A rota `/equipe` foi removida do router.
- [x] O arquivo de página independente `src/pages/Equipe.tsx` foi removido.
- [x] Testes que referenciavam `/equipe` foram atualizados para a nova aba.

## Dev Agent Record

### Debug Log

- Movida a experiência de equipe para `StoreTeamPanel`.
- Adicionada aba `Equipe` em `DashboardLoja`.
- Removidas rota, lazy import e navegação dedicada de `/equipe`.

### File List

- `docs/stories/story-OPS-20260501-store-team-tab.md`
- `docs/stories/story-OPS-20260501-store-team-admin-crud.md`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/features/lojas/components/StoreTeamPanel.tsx`
- `src/pages/DashboardLoja.tsx`
- `src/pages/Lojas.tsx`
- `src/test/navigation.playwright.ts`
- `src/test/e2e/smoke-flows.playwright.ts`
