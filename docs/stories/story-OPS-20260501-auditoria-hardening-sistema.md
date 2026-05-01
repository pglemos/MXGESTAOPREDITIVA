# Story OPS-20260501 - Auditoria e Hardening Completo do Sistema

## Status

Ready for Review

## Contexto

Auditoria completa do sistema MX apontou inconsistencias de schema em testes E2E, permissividade em superficies legadas do Supabase, senhas temporarias fracas, observabilidade hardcoded, falhas menores de acessibilidade e rota legada `/ranking` quebrada.

## Acceptance Criteria

- [x] E2E usa tabelas canonicas em portugues (`usuarios`, `vendedores_loja`, `clientes_consultoria`, `visitas_consultoria`).
- [x] Criacao de usuarios exige senha forte no client e na Edge Function.
- [x] Configuracao local Supabase exige senha minima forte e troca segura.
- [x] Edge Functions criticas exigem autenticacao/autorizacao por role, loja ou consultor vinculado.
- [x] Policies legadas abertas sao removidas/bloqueadas por migration aplicada no remoto.
- [x] `/configuracoes` remove status hardcoded, corrige contraste/acessibilidade e persiste aparencia.
- [x] Rota legada `/ranking` redireciona para `/classificacao`.
- [x] `robots.txt` valido existe para SEO.
- [x] Gates: `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`.
- [x] Validacao Chrome MCP em `/configuracoes` desktop/mobile, sem console errors e Lighthouse 100/100/100 em mobile snapshot.
- [x] Supabase remoto atualizado com migration e Edge Functions alteradas.

## Dev Agent Record

### Debug Log

- Corrigido drift E2E de tabelas legacy/ingles para schema canonico em portugues.
- Removido fallback client-side de senha provisoria e centralizada politica forte em `src/lib/auth/passwordPolicy.ts`.
- `register-user` agora rejeita senha ausente/fraca antes de criar auth user.
- Adicionado `_shared/auth.ts` para Edge Functions validarem JWT, role, loja e vinculo de consultoria.
- Reports automaticos aceitam cron apenas com `x-mx-cron-secret`; execucao manual exige admin MX.
- `send-individual-feedback` valida permissao de loja antes de envio.
- `send-visit-report` valida admin ou consultor vinculado a visita.
- Migration `20260501030000_harden_legacy_open_policies.sql` aplicada no remoto via `npx supabase db push --linked`.
- Functions publicadas no Supabase: `register-user`, `relatorio-matinal`, `feedback-semanal`, `relatorio-mensal`, `send-individual-feedback`, `send-visit-report`.
- Chrome MCP percorreu as 12 abas de `/configuracoes` em desktop e mobile sem overflow horizontal e sem console errors.
- Lighthouse snapshot mobile final de `/configuracoes`: Accessibility 100, Best Practices 100, SEO 100.
- Playwright completo: 171 passed, 2 skipped.

### File List

- `docs/stories/story-OPS-20260501-auditoria-hardening-sistema.md`
- `public/robots.txt`
- `src/App.tsx`
- `src/index.css`
- `src/lib/auth/constants.ts`
- `src/lib/auth/passwordPolicy.ts`
- `src/hooks/useTeam.ts`
- `src/pages/AgendaAdmin.tsx`
- `src/pages/Configuracoes.tsx`
- `src/pages/Perfil.tsx`
- `src/features/auth/components/ForcePasswordChange.tsx`
- `src/features/equipe/components/UserCreationModal.tsx`
- `src/features/configuracoes/components/ConfigTabsNav.tsx`
- `src/features/configuracoes/components/CreateStoreModal.tsx`
- `src/features/configuracoes/components/EditUserModal.tsx`
- `src/features/configuracoes/components/tabs/AparenciaTab.tsx`
- `src/features/configuracoes/components/tabs/BroadcastsTab.tsx`
- `src/features/configuracoes/components/tabs/EquipeUsuariosTab.tsx`
- `src/features/configuracoes/components/tabs/IntegracoesTab.tsx`
- `src/features/configuracoes/components/tabs/LojasRedeTab.tsx`
- `src/features/configuracoes/components/tabs/OperacionalLojaTab.tsx`
- `src/features/configuracoes/components/tabs/PerfilTab.tsx`
- `src/features/configuracoes/components/tabs/SegurancaTab.tsx`
- `src/features/configuracoes/components/tabs/SistemaMxTab.tsx`
- `src/test/agenda-filters.playwright.ts`
- `src/test/auth-first-login.playwright.ts`
- `src/test/e2e-helpers/supabase-admin.ts`
- `supabase/config.toml`
- `supabase/functions/_shared/auth.ts`
- `supabase/functions/feedback-semanal/index.ts`
- `supabase/functions/register-user/index.ts`
- `supabase/functions/relatorio-matinal/index.ts`
- `supabase/functions/relatorio-mensal/index.ts`
- `supabase/functions/send-individual-feedback/index.ts`
- `supabase/functions/send-visit-report/index.ts`
- `supabase/migrations/20260501030000_harden_legacy_open_policies.sql`
