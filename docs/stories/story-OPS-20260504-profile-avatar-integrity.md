# Story OPS-20260504 - Avatar de perfil integrado

## Status

Ready for Review

## Contexto

O sistema precisa mostrar a foto de perfil real para vendedor, gerente, dono, Admin MX e MX Master em todos os pontos principais, e permitir que o próprio usuário atualize o avatar nas configurações/perfil.

## Acceptance Criteria

- [x] `/perfil` permite anexar ou capturar foto JPG/PNG/WebP e grava `usuarios.avatar_url`.
- [x] `Configurações > Perfil` usa o mesmo bucket, validação e gravação de avatar de `/perfil`.
- [x] Supabase possui bucket público `perfis_usuario` com limite de 5MB e policies para cada usuário editar apenas sua pasta.
- [x] Header, equipe da loja, usuários em configurações, rankings, batalha, live floor, ficha de performance, treinamentos, PDI, rotina e relatório matinal renderizam `avatar_url` quando disponível.
- [x] Pré-cadastro aprovado continua preenchendo `usuarios.avatar_url`.
- [x] Gates de qualidade: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Agent Record

### Debug Log

- Auditoria inicial encontrou dois buckets divergentes para perfil: `avatars` em `Configurações > Perfil` e `perfis_usuario` em `/perfil`.
- Criado helper único `src/lib/avatar.ts` para validação, upload e fallback visual.
- As duas telas de perfil passaram a gravar no bucket `perfis_usuario` com path por usuário.
- Ranking e views operacionais passaram a selecionar e renderizar `usuarios.avatar_url`.
- Adicionada migration `20260504130000_profile_avatar_storage.sql` para bucket/policies.

### File List

- `docs/stories/story-OPS-20260504-profile-avatar-integrity.md`
- `src/components/Layout.tsx`
- `src/features/configuracoes/components/tabs/EquipeUsuariosTab.tsx`
- `src/features/configuracoes/components/tabs/PerfilTab.tsx`
- `src/features/lojas/components/StoreTeamPanel.tsx`
- `src/features/ranking/components/BattleView.tsx`
- `src/features/ranking/components/LiveFloor.tsx`
- `src/features/ranking/components/SellerProfileModal.tsx`
- `src/hooks/useCheckinAuditor.ts`
- `src/hooks/usePDI_MX.ts`
- `src/hooks/usePerformance.ts`
- `src/hooks/useRanking.ts`
- `src/lib/avatar.ts`
- `src/lib/avatar.test.ts`
- `src/lib/schemas/performance.schema.ts`
- `src/pages/DashboardLoja.tsx`
- `src/pages/GerentePDI.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/MorningReport.tsx`
- `src/pages/Perfil.tsx`
- `src/pages/Ranking.tsx`
- `src/pages/RotinaGerente.tsx`
- `src/pages/SellerPerformance.tsx`
- `src/types/database.ts`
- `supabase/migrations/20260504130000_profile_avatar_storage.sql`
