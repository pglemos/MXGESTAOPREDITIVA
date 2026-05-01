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
- [x] Perfis fora de Admin Master/Admin MX não veem ações de edição/exclusão completa.
- [x] Gates de qualidade: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

## Dev Agent Record

### Debug Log

- Adicionado CRUD administrativo em `useTeam` para atualizar cadastro, vínculo e vigência.
- Tela `Equipe` passou a expor edição completa e exclusão para Admin Master/Admin MX.
- Mantida criação existente via `UserCreationModal`, com botões de criação controlados por papel autorizado.

### File List

- `docs/stories/story-OPS-20260501-store-team-admin-crud.md`
- `src/hooks/useTeam.ts`
- `src/pages/Equipe.tsx`
