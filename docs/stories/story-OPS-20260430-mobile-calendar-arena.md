# Story OPS-20260430: Mobile PWA, Agenda Google e Arena de Lojas

## Status

Ready for Review

## Contexto

Solicitação operacional em YOLO mode para fechar as ondas de melhoria do sistema MX Performance:

- Mobile PWA responsiva, com prioridade mínima para Lançamento Diário.
- Login com controle de mostrar/ocultar senha.
- Renomeação user-facing de Checkin para Lançamento Diário.
- Arena admin com comparação completa de lojas, além da comparação de vendedores.
- Google Calendar funcionando no sistema com agenda pessoal do admin + Agenda Central MX.

## Acceptance Criteria

- [x] Login permite mostrar/ocultar senha sem alterar o fluxo de autenticação.
- [x] Textos user-facing usam "Lançamento Diário" no lugar de "Checkin" onde aplicável.
- [x] PWA gera manifest/service worker em build de produção.
- [x] Fluxo mobile de Lançamento Diário mantém layout responsivo e não conflita com bottom bar.
- [x] Ranking admin inclui Arena de Lojas com seleção de duas lojas e indicadores completos.
- [x] Agenda admin exibe status Google Calendar pessoal + central.
- [x] Criação, alteração de status e exclusão de visitas disparam sync com Google Calendar.
- [x] Agenda Central MX pode ser conectada via OAuth central, validando o e-mail esperado.
- [x] Migrações e Edge Functions do Supabase foram aplicadas/deployadas.
- [x] Gates locais passaram: lint, typecheck, tests, build e validação manual Playwright.

## QA

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test`
- [x] `npm run build`
- [x] Playwright manual: login eye toggle, redirect mobile de `/checkin`, manifest PWA de produção.
- [x] Produção Vercel Ready em `https://mxperformance.vercel.app` após push na `main`.
- [x] Auditoria mobile em produção com login real de QA nos papéis `vendedor`, `gerente`, `dono` e `admin`.
- [x] 35 rotas mobile autenticadas carregadas sem erro fatal e sem overflow horizontal.
- [x] Supabase: migrações `20260430000000` e `20260430001000` aplicadas no remoto.
- [x] Supabase: funções `google-calendar-sync`, `google-calendar-merged` e `google-oauth-handler` redeployadas.
- [x] Admin José criado também no e-mail solicitado `joseroberto20161@gmail.com`.
- [ ] Token OAuth da Agenda Central MX salvo no Supabase.

### Google Calendar Central

Data: 2026-04-30

Estado técnico:

- OAuth central implementado e disponível via `Agenda MX > Conectar Agenda Central`.
- Edge Function `google-oauth-handler` aceita `central: true`, valida que o login Google é `gestao@mxconsultoria.com.br` e salva o token criptografado como `provider = google_central`.
- Edge Functions de leitura/sync usam `google_central` como fallback quando `GOOGLE_CENTRAL_REFRESH_TOKEN` não existe.

Bloqueio operacional encontrado:

- Tentativa real de OAuth com `gestao@mxconsultoria.com.br` chegou no Google, mas foi bloqueada porque o OAuth app `fbhcmzzgwjdgkctlfvbo.supabase.co` está em modo de teste e a conta central não está aprovada como tester.
- Ação necessária fora do repositório: adicionar `gestao@mxconsultoria.com.br` como test user no OAuth consent screen do Google Cloud, ou publicar/verificar o app OAuth. Depois disso, qualquer admin pode clicar em `Conectar Agenda Central` e concluir a vinculação.

### Produção Mobile Audit

Data: 2026-04-30

Rotas validadas no viewport Pixel 5:

- `vendedor`: `/home`, `/checkin`, `/historico`, `/ranking`, `/treinamentos`, `/feedback`, `/notificacoes`, `/perfil`
- `gerente`: `/loja`, `/equipe`, `/metas`, `/pdi`, `/rotina`, `/ranking`, `/treinamentos`, `/feedback`, `/notificacoes`, `/perfil`
- `dono`: `/lojas`, `/loja`, `/equipe`, `/metas`, `/pdi`, `/ranking`, `/feedback`, `/notificacoes`, `/perfil`
- `admin`: `/painel`, `/lojas`, `/agenda`, `/ranking`, `/consultoria`, `/consultoria/clientes`, `/configuracoes`, `/perfil`

Resultado: 35/35 rotas com `overflow = 0`, sem erro fatal de renderização.

## File List

- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/vite-env.d.ts`
- `src/index.css`
- `src/components/Layout.tsx`
- `src/components/PWAUpdater.tsx`
- `src/features/agenda/components/GoogleCalendarStatus.tsx`
- `src/features/consultoria/types.ts`
- `src/features/equipe/components/UserCreationModal.tsx`
- `src/features/ranking/components/StoreBattleView.tsx`
- `src/hooks/useAgendaAdmin.ts`
- `src/hooks/useGoogleCalendar.ts`
- `src/hooks/useNetworkPerformance.ts`
- `src/pages/AgendaAdmin.tsx`
- `src/pages/Checkin.tsx`
- `src/pages/Equipe.tsx`
- `src/pages/Login.tsx`
- `src/pages/PainelConsultor.tsx`
- `src/pages/Ranking.tsx`
- `src/pages/SellerPerformance.tsx`
- `src/test/schemas/schemas.test.ts`
- `supabase/functions/_shared/google.ts`
- `supabase/functions/google-calendar-merged/index.ts`
- `supabase/functions/google-calendar-sync/index.ts`
- `supabase/functions/google-oauth-handler/index.ts`
- `supabase/migrations/20260427175213_add_must_change_password_to_users.sql`
- `supabase/migrations/20260427175235_update_handle_new_user_trigger.sql`
- `supabase/migrations/20260430000000_visits_google_central.sql`
- `supabase/migrations/20260430001000_google_oauth_state_purpose.sql`
