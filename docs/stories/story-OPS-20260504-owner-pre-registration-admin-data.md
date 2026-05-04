# Story OPS-20260504 - Dados administrativos no pré-cadastro de dono

## Status

Ready for Review

## Contexto

Quando o pré-cadastro público for preenchido por alguém que se declara dono ou sócio da loja, a MX precisa coletar dados administrativos da empresa para completar o cadastro da loja antes da liberação do login.

## Acceptance Criteria

- [x] Ao selecionar `Dono / Sócio`, o formulário público exige razão social, CNPJ, endereço completo e telefone administrativo.
- [x] A validação ocorre no frontend por etapa e também na Edge Function pública.
- [x] `pre_cadastros_loja` armazena os dados administrativos informados pelo dono.
- [x] `lojas` passa a armazenar `administrative_phone`.
- [x] Ao aprovar o login como dono, a Edge Function sincroniza razão social, CNPJ, endereço e telefone administrativo na loja.
- [x] A fila de pré-cadastros na aba de equipe exibe os dados administrativos para Admin MX/MX Master.
- [x] Gates de qualidade: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Dev Agent Record

### Debug Log

- Adicionados campos condicionais no wizard público de pré-cadastro para role `dono`.
- Criada migration `20260504140000_owner_pre_registration_admin_fields.sql`.
- Atualizadas Edge Functions `store-pre-registration` e `approve-store-registration` para validar, persistir e sincronizar os dados.
- Incluído telefone administrativo na edição de loja.
- Corrigida a ordenação local de notificações por prioridade para manter aprovações críticas acima de itens mais recentes de menor prioridade.

### File List

- `docs/stories/story-OPS-20260504-owner-pre-registration-admin-data.md`
- `docs/data/stores-schema.md`
- `src/features/admin/components/StoreEditModal.tsx`
- `src/features/lojas/components/StoreTeamPanel.tsx`
- `src/hooks/useNotifications.ts`
- `src/hooks/useNotifications.test.ts`
- `src/hooks/useTeam.ts`
- `src/index.css`
- `src/pages/StorePreRegistration.tsx`
- `src/types/database.ts`
- `supabase/functions/store-pre-registration/index.ts`
- `supabase/functions/approve-store-registration/index.ts`
- `supabase/migrations/20260504140000_owner_pre_registration_admin_fields.sql`
