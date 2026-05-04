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
- [x] Form público exige foto/captura para avatar e valida campos obrigatórios antes do envio.
- [x] Pré-cadastro usa fluxo em etapas para reduzir fricção no mobile.
- [x] Visual do pré-cadastro segue a landing principal MX: topbar, grid, scanline, console dark, tipografia e microinterações.
- [x] Dados informados pelo link criam usuário/Auth pendente, vínculo de loja e senha provisória forte.
- [x] Login pendente permanece bloqueado até aprovação do Admin MX/MX Master.
- [x] Admin MX/MX Master recebe notificação de novo login pendente.
- [x] Aba de equipe da loja exibe pré-cadastros com foto, senha provisória e ações de aprovar/rejeitar restritas a Admin MX/MX Master.
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
- Iteração de aprovação: adicionada captura/anexo de foto, criação de Auth user inativo, senha provisória `Mx@123456!`, notificação para Admin MX/MX Master e edge function autenticada de aprovação/rejeição.
- Iteração visual: pré-cadastro refeito como wizard de 3 etapas, com visual alinhado à landing principal, console escuro, stepper, transições por etapa, microinterações em botões/cartões e validação por etapa.

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
- `supabase/functions/approve-store-registration/index.ts`
- `supabase/migrations/20260504100000_store_registration_profile.sql`
- `supabase/migrations/20260504110000_store_pre_registration_approval.sql`
