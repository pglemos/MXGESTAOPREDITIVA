# Story OPS-20260501 - Metas por Aba da Loja

## Status

Ready for Review

## Contexto

Solicitação operacional: a página separada `/metas` não deve concentrar Meta Mensal de Vendas, objetivo nominal de sell-out, Matriz de Benchmarks (20/60/33) e taxas de conversão para auditoria. Esse conteúdo deve existir dentro de `/lojas/:slug`, em uma aba `Metas`, com criação, edição e exclusão permitidas apenas para Admin Master e Admin MX.

## Acceptance Criteria

- [x] `/lojas/:slug` possui aba `Metas`.
- [x] Aba `Metas` exibe Meta Mensal de Vendas, objetivo nominal de sell-out, Matriz de Benchmarks (20/60/33) e taxas oficiais de conversão.
- [x] Admin Master e Admin MX conseguem adicionar/salvar configuração de metas da loja.
- [x] Admin Master e Admin MX conseguem editar meta mensal e benchmarks.
- [x] Admin Master e Admin MX conseguem excluir a configuração de metas da loja.
- [x] Usuários fora de Admin Master/Admin MX não veem ações de edição/exclusão.
- [x] `/metas` e `/goal-management` deixam de renderizar página separada e redirecionam para `/lojas` ou `/lojas/:slug?tab=metas` quando recebem `id`.
- [x] Navegação não aponta mais para `/metas`.
- [x] Gates de qualidade: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Agent Record

### Debug Log

- Movida a experiência da antiga página de metas para componente embutido em `/lojas/:slug?tab=metas`.
- Rota legada `/metas?id=<store_id>` passa a redirecionar para a aba de metas da loja correspondente.
- RLS reforçada para escrita em `regras_metas_loja` e `benchmarks_loja` somente via `eh_administrador_mx()`.
- Gates locais passaram: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

### File List

- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/features/lojas/components/StoreGoalsPanel.tsx`
- `src/hooks/useGoals.ts`
- `src/pages/DashboardLoja.tsx`
- `src/pages/GoalManagement.tsx` (removido)
- `supabase/migrations/20260501002000_store_goals_admin_only.sql`
- `docs/stories/story-OPS-20260501-store-goals-tab.md`
