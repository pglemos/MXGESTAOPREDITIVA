# Story OPS-20260501 - CRUD Admin da Equipe da Loja

## Status

Ready for Review

## Contexto

Administradores MX precisam gerenciar todos os integrantes da equipe de uma loja sem depender de SQL manual. O fluxo de equipe já criava usuários e editava vigência, mas não oferecia edição completa de cadastro, papel, vínculo operacional e exclusão/remocao da loja.

## Acceptance Criteria

- [x] `administrador_geral` e `administrador_mx` conseguem criar integrante para uma loja.
- [x] `administrador_geral` e `administrador_mx` conseguem editar nome, e-mail, telefone, papel, loja, status de usuário e vigência.
- [x] `administrador_geral` e `administrador_mx` conseguem excluir/remover integrante da equipe da loja.
- [x] Exclusão remove o vínculo da loja, encerra vigência operacional e desativa o usuário quando não restar outro vínculo.
- [x] Dono e gerente conseguem gerir integrantes da própria loja por edge function com validação de escopo.
- [x] Criação de vendedor grava também `vendedores_loja` com vigência, status operacional, carência e venda loja.
- [x] A aba `/lojas/:slug?tab=equipe` apresenta campos e ações em lista administrativa responsiva.
- [x] Gates de qualidade: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

## Dev Agent Record

### Debug Log

- Adicionado CRUD administrativo em `useTeam` para atualizar cadastro, vínculo e vigência.
- O CRUD foi movido para `StoreTeamPanel` dentro do dashboard `/lojas/:slug?tab=equipe`.
- Mantida criação existente via `UserCreationModal`, com botões de criação controlados por papel autorizado.
- Correção 2026-05-03: `UserCreationModal` agora expõe telefone, papel, loja, início/fim de vigência, status operacional, venda loja e carência.
- Correção 2026-05-03: `register-user` grava `is_venda_loja` e cria vigência em `vendedores_loja` para vendedores.
- Correção 2026-05-03: adicionada `manage-store-team` para edição/remoção por dono e gerente no escopo da loja.
- Correção 2026-05-03: validado em navegador local com `admin@mxgestaopreditiva.com.br` em `/lojas/acertt?tab=equipe`, desktop e mobile sem erros de console.

### File List

- `docs/stories/story-OPS-20260501-store-team-admin-crud.md`
- `src/components/molecules/PageHeader.tsx`
- `src/features/equipe/components/UserCreationModal.tsx`
- `src/hooks/useTeam.ts`
- `src/features/lojas/components/StoreTeamPanel.tsx`
- `src/pages/DashboardLoja.tsx`
- `supabase/functions/register-user/index.ts`
- `supabase/functions/manage-store-team/index.ts`
