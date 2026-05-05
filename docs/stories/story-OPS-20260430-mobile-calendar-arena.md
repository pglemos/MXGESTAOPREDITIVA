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
- [x] Token OAuth da Agenda Central MX salvo no Supabase.
- [x] Google OAuth app publicado em produção, com necessidade de verificação formal indicada pelo Google.
- [x] Google Calendar API ativada no projeto OAuth da conta central.
- [x] Função `google-oauth-handler` redeployada sem verificação JWT externa para permitir callback OAuth público com validação interna por `state`.
- [x] Validação funcional: `google-calendar-merged` retornou `centralConnected: true` e `centralError: null`.
- [x] Correções para verificação OAuth: home pública, nome exato do app, link de privacidade visível e política separada em `/privacy`.
- [x] Playwright local: `/` exibia o nome publico do app e link para `/privacy`; `/privacy` descreve uso dos dados do Google Calendar. Substituido em 2026-05-01 por `MX PERFORMANCE` na story `story-OPS-20260501-browser-branding-title.md`.
- [x] Search Console: arquivo de verificação publicado e propriedade `https://mxperformance.vercel.app/` verificada.
- [x] Auditoria UX/UI da Agenda em Chrome MCP local: clique em dia seleciona o painel lateral sem abrir modal automaticamente, mês exibe `ABRIL DE 2026`, botões de navegação do calendário têm labels acessíveis e erro técnico do Google Calendar foi trocado por mensagem operacional.
- [x] Auditoria responsiva local em viewports 390x844, 768x1024 e 1440x900: sem overflow horizontal, CTAs do Google Calendar sem texto estourado e modal de agendamento funcional no mobile.
- [x] Google Calendar movido da Agenda para Configurações > Integrações de Agenda; Chrome MCP confirmou `/agenda` sem controles de conexão e `/configuracoes` com agenda pessoal + Agenda Central MX.
- [x] Filtro de período passou a controlar a grade visual da agenda: `Hoje` renderiza 1 dia, `Semana` e `Próx. Semana` renderizam 7 dias, `Mês`/`Todos` renderizam a grade mensal; validado por Chrome MCP.
- [x] Agenda passou a salvar e exibir Motivo da visita, Alvo e Produto em criação/edição/visualização de visita e evento/aula; campos validados em Chrome MCP mobile sem overflow.
- [x] Gates pós-auditoria: `npm run lint`, `npm test` e `npm run build`.
- [x] Follow-up 2026-05-05: verificado no Supabase remoto que a Agenda Central MX segue conectada, mas `José Roberto <joseroberto20161@gmail.com>` e `Synvollt <synvollt@gmail.com>` ainda não possuem token Google pessoal.
- [x] Follow-up 2026-05-05: sync pessoal passou a usar o usuário responsável/consultor do agendamento, e não apenas o admin autenticado que criou/editou a agenda.
- [x] Follow-up 2026-05-05: migration remota aplicada, Edge Functions `google-oauth-handler`, `google-calendar-sync` e `google-calendar-merged` redeployadas, e frontend publicado em produção Vercel.
- [x] Follow-up 2026-05-05: Synvollt validado em produção; Google OAuth abriu a verificação em duas etapas e o sistema salvou token pessoal para `synvollt@gmail.com`.
- [x] Follow-up 2026-05-05: criada tabela de espelhos por admin master e `google-calendar-sync` passou a replicar eventos da Agenda Central MX na agenda pessoal dos admins MX conectados.
- [x] Follow-up 2026-05-05: backfill Synvollt processou 53 eventos futuros, com 53 espelhos sincronizados e 0 erros; `google-calendar-merged` retornou `personalConnected: true`, `centralConnected: true`, `personalGoogleEmail: synvollt@gmail.com`, 59 eventos centrais e 53 pessoais no recorte ampliado.
- [x] Gates follow-up 2026-05-05: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- [ ] Verificação final de acesso aos dados Google: pendente de URL de vídeo YouTube demonstrando o uso do escopo `calendar.events`.

### Google Calendar Central

Data: 2026-04-30

Estado técnico:

- OAuth central implementado e disponível via `Agenda MX > Conectar Agenda Central`.
- Edge Function `google-oauth-handler` aceita `central: true`, valida que o login Google é `gestao@mxconsultoria.com.br` e salva o token criptografado como `provider = google_central`.
- Edge Functions de leitura/sync usam `google_central` como fallback quando `GOOGLE_CENTRAL_REFRESH_TOKEN` não existe.

Resultado operacional:

- Criado projeto Google Cloud `mx-performance-calendar-oauth` na organização `mxconsultoria.com.br`.
- Criado client OAuth web para o redirect `https://fbhcmzzgwjdgkctlfvbo.supabase.co/functions/v1/google-oauth-handler`.
- Secrets `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REDIRECT_URI` atualizados no Supabase.
- Usuários de teste adicionados: `gestao@mxconsultoria.com.br`, `danieljsvendas@gmail.com`, `joseroberto20161@gmail.com`, `gedson.freire.localiza@gmail.com`, `camarajoaoaugusto@gmail.com`, `marianedcs@gmail.com`.
- Escopos configurados: `userinfo.email` e `calendar.events`.
- Google Calendar API ativada.
- App OAuth publicado em produção. O Google passou a indicar que o app precisa de verificação formal antes de remover limites/avisos de app não verificado.
- OAuth central concluído com `gestao@mxconsultoria.com.br`; token criptografado salvo em `tokens_oauth_consultoria` como `provider = google_central`.
- Para atender a revisão do Google, a home pública `https://mxperformance.vercel.app/` passou a exibir o nome publico do app e link visível para a política em `https://mxperformance.vercel.app/privacy`. Em 2026-05-01, a marca user-facing foi atualizada para `MX PERFORMANCE` pela story `story-OPS-20260501-browser-branding-title.md`.
- A marca passou para a etapa de envio final. O bloqueio remanescente é externo ao código: o formulário do Google exige vídeo YouTube demonstrando o uso do escopo `calendar.events`; a conta logada retornou erro ao abrir YouTube/Studio nesta sessão.

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
- `src/App.tsx`
- `public/google1778f7798089a3f6.html`
- `src/main.tsx`
- `src/vite-env.d.ts`
- `src/index.css`
- `src/components/Layout.tsx`
- `src/components/molecules/FilterBar.tsx`
- `src/components/organisms/AgendaCalendar.tsx`
- `src/components/organisms/Modal.tsx`
- `src/components/organisms/VisitCard.tsx`
- `src/components/PWAUpdater.tsx`
- `src/features/agenda/components/GoogleCalendarStatus.tsx`
- `src/features/agenda/constants.ts`
- `src/features/consultoria/types.ts`
- `src/features/equipe/components/UserCreationModal.tsx`
- `src/features/ranking/components/StoreBattleView.tsx`
- `src/hooks/useAgendaAdmin.ts`
- `src/hooks/useGoogleCalendar.ts`
- `src/hooks/useNetworkPerformance.ts`
- `src/lib/schemas/consulting-client.schema.ts`
- `src/pages/AgendaAdmin.tsx`
- `src/pages/Checkin.tsx`
- `src/pages/Configuracoes.tsx`
- `src/pages/Equipe.tsx`
- `src/pages/Login.tsx`
- `src/pages/OAuthHome.tsx`
- `src/pages/PainelConsultor.tsx`
- `src/pages/Privacy.tsx`
- `src/pages/Ranking.tsx`
- `src/pages/SellerPerformance.tsx`
- `src/test/schemas/schemas.test.ts`
- `supabase/config.toml`
- `supabase/functions/_shared/google.ts`
- `supabase/functions/google-calendar-merged/index.ts`
- `supabase/functions/google-calendar-sync/index.ts`
- `supabase/functions/google-oauth-handler/index.ts`
- `supabase/migrations/20260427175213_add_must_change_password_to_users.sql`
- `supabase/migrations/20260427175235_update_handle_new_user_trigger.sql`
- `supabase/migrations/20260430000000_visits_google_central.sql`
- `supabase/migrations/20260430001000_google_oauth_state_purpose.sql`
- `supabase/migrations/20260501000000_agenda_visit_metadata.sql`
- `supabase/migrations/20260505090000_google_calendar_token_email.sql`
- `supabase/migrations/20260505102000_google_calendar_user_mirrors.sql`
