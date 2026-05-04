# Story OPS-20260504 - Cadastro cadastral da loja e pré-cadastro público

## Status

Ready for Review

## Contexto

Cada loja precisa ter dados cadastrais completos no sistema e um link específico para enviar ao dono, gerente e vendedores. O link deve permitir pré-cadastro sem login, mantendo os dados recebidos visíveis para conferência antes da sincronização operacional.

## Acceptance Criteria

- [x] Loja armazena endereço, CNPJ, razão social e lista de sócios com contato.
- [x] Admin MX consegue editar os dados cadastrais e múltiplos sócios na loja.
- [x] Cada loja exibe link próprio de pré-cadastro baseado no slug da loja.
- [x] Link público `/pre-cadastro/:storeSlug` renderiza landing page MX premium com logo/design system.
- [x] Form público coleta nome completo, e-mail, telefone, loja, segmento, função, tempo na loja e experiência de mercado.
- [x] Dados informados pelo link são persistidos como pré-cadastros pendentes, sem criar usuário automaticamente.
- [x] Aba de equipe da loja exibe os pré-cadastros recebidos para conferência.
- [x] Gates de qualidade: `npm run lint`, `npm run typecheck`, `npm test`.

## Dev Agent Record

### Debug Log

- Criada migration para campos cadastrais em `lojas` e tabela `pre_cadastros_loja`.
- Criada edge function pública `store-pre-registration` com leitura por slug e submissão validada.
- Adicionado link de pré-cadastro na lista/modal de lojas e painel de pré-cadastros na aba equipe.
- Criada página pública premium para pré-cadastro com identidade visual MX.
- Validação local concluída com `npm run typecheck`, `npm run lint`, `npm test` e `npm run build`.
- Verificação visual local em `http://localhost:3001/pre-cadastro/acertt` com screenshots desktop/mobile; página carregando a loja real pela edge function remota.
- Refinamento visual: removido ícone decorativo genérico, adicionadas microinterações via Motion, controle segmentado de função, painel de progresso e estados de foco/hover.
- Migration aplicada no Supabase remoto `fbhcmzzgwjdgkctlfvbo` via `npx supabase db push`.
- Edge function `store-pre-registration` publicada via `npx supabase functions deploy store-pre-registration`.
- Integração remota validada com GET para `store_slug=acertt` e POST controlado; registro temporário de validação removido via `supabase db query --linked`.

### File List

- `docs/stories/story-OPS-20260504-store-registration-profile.md`
- `docs/data/stores-schema.md`
- `src/App.tsx`
- `src/features/admin/components/StoreEditModal.tsx`
- `src/features/lojas/components/StoreTeamPanel.tsx`
- `src/hooks/useTeam.ts`
- `src/index.css`
- `src/pages/Lojas.tsx`
- `src/pages/StorePreRegistration.tsx`
- `src/types/database.ts`
- `supabase/config.toml`
- `supabase/functions/store-pre-registration/index.ts`
- `supabase/migrations/20260504100000_store_registration_profile.sql`
