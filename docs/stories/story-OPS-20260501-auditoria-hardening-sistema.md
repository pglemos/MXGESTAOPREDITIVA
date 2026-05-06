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
- Vercel auditado: projeto `mxperformance` com deploy de producao `READY`; removida variavel publica insegura `VITE_SUPABASE_SERVICE_ROLE_KEY`.
- Configuracao Vercel alinhada para `framework=vite`, `buildCommand=npm run build`, `outputDirectory=dist`.
- Variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` ampliadas para `production`, `preview` e `development` na Vercel.
- URLs de Edge Functions centralizadas em `getSupabaseFunctionUrl`, com fallback para `VITE_PUBLIC_SUPABASE_URL` em preview/development.
- Supabase remoto auditado: projeto `MX GESTAO PREDITIVA` `ACTIVE_HEALTHY`, Edge Functions `ACTIVE`, migrations sincronizadas ate `20260501030000` antes da nova correcao.
- Migration `20260501040000_fix_remote_lint_findings.sql` aplicada no remoto para corrigir `reject_correction_request` apos renomeacao canonica e limpar alerta de lint em `approve_pdi_action_evidence`.
- Supabase `db lint --linked`: No schema errors found.
- Chrome MCP percorreu as 12 abas de `/configuracoes` em desktop e mobile sem overflow horizontal e sem console errors.
- Lighthouse snapshot mobile final de `/configuracoes`: Accessibility 100, Best Practices 100, SEO 100.
- Gates locais em 2026-05-01: `npm run lint`, `npm run typecheck`, `npm test` (195 passed), `npm run build`, `npm run test:e2e` (171 passed, 2 skipped).
- Hardening adicional em modo yolo em 2026-05-06: matriz central `ROUTE_ACCESS_RULES` aplicada no `ProtectedRoute`.
- `normalizeRole` nao rebaixa mais roles desconhecidas para `vendedor`; perfil invalido passa a bloquear sessao.
- Check-in diario passou a usar calendario/horario `America/Sao_Paulo` para referencia, atraso e limite de edicao.
- `saveCheckin` bloqueia data futura/dia corrente e exige escopo `adjustment` para referencias retroativas.
- Acknowledgements de devolutiva e PDI agora validam destinatario/papel no hook antes da mutacao.
- Testes adicionados para matriz de rotas, normalizacao de roles e regras temporais de check-in.
- `RoleSwitch` de check-in/historico preserva renderizacao da pagina para perfis internos, mantendo o bloqueio explicito do componente.
- `PageHeader` ajustado para nao comprimir o H1 do painel em viewports desktop medios durante E2E.
- Visual regression de check-in autentica como vendedor via bypass local de desenvolvimento, em vez de capturar painel admin.
- Gates locais em 2026-05-06: `npm run typecheck`, `npm run lint`, `npm test` (223 passed), `npm run build`, `npm run test:e2e` (173 passed, 2 skipped).
- Nenhuma chave, token ou segredo foi rotacionado ou alterado.
- Hardening adicional em 2026-05-06: login deixou de persistir ultimo e-mail em `localStorage` e passou a mascarar falhas brutas do Auth.
- `RoleSwitch` agora redireciona perfis internos quando a variante admin nao for declarada, evitando renderizacao vazia.
- Produtos digitais passam a rejeitar URL externa sem HTTPS, mantendo apenas URL do proprio sistema ou HTTPS.
- PDI passou a validar status permitido, payload de review e erro de mutacao antes de invalidar cache.
- `register-user` passou a validar escopo de loja para dono/gerente e fazer rollback de auth/profile/vinculos em falhas parciais.
- Gates do segundo lote em 2026-05-06: `npm run typecheck`, `npm run lint`, `npm test` (223 passed), `npm run build`, E2E focado smoke/navegacao Chromium (17 passed).
- Header global passou a focar campo de busca existente ou navegar para busca contextual; sino de notificacoes navega para `/notificacoes`.
- Aba Segurança remove promessa funcional de 2FA e descreve claramente que o recurso nao esta habilitado.
- Gates do terceiro lote em 2026-05-06: `npm run typecheck`, E2E navegacao Chromium (15 passed).
- Dev bypass por `localStorage` passou a ser aceito apenas em build DEV rodando em localhost/127.0.0.1/::1.
- Perfil interno sem vinculo de loja nao recebe mais fallback automatico para a primeira loja ativa.
- Ficha de performance de vendedor tipou a tabela sem `Column<any>` e mostra estado claro quando `sellerId` da query nao existe.
- Gates do quarto lote em 2026-05-06: `npm run typecheck`, testes focados auth/check-in (14 passed), E2E smoke/navegacao Chromium (17 passed).
- Equipe global em `useTeam` ficou restrita a admin MX e agora lista apenas papeis operacionais vinculados a loja, sem usuarios internos/sem vinculo como vendedores.
- Alteracao de vigencia exige admin/dono/gerente, loja escopada e alvo vendedor; remocao de equipe remove vinculo da loja sem desativar automaticamente o login.
- Cadastro de usuario via hook deixou de duplicar escrita direta de vigencia quando a Edge Function ja executa a mutacao.
- Arquivamento de loja substitui exclusao fisica no hook admin, e criacao de loja nao inicializa mais meta operacional com zero.
- Links de pre-cadastro passaram a usar helper publico centralizado, com fallback canonico quando `window.location.origin` nao e confiavel.
- Gates do quinto lote em 2026-05-06: `npm run typecheck`, `npm run lint`, testes focados utils/auth/check-in (35 passed), E2E smoke/navegacao Chromium (17 passed).
- Auditoria deixou de simular logs/delays e removeu rotulos de "Deep Learning/IA", assumindo explicitamente heuristica MX 20/60/33 sobre dados reais.
- Auditoria admin passou a consultar janela real limitada de 90 dias/1000 lancamentos, evitando carga client-side ampla de 5000 registros.
- Textos de Sistema MX e Integracoes foram alinhados para "Auditoria de Funil", sem prometer IA preditiva onde ha heuristica operacional.
- Painel Consultor reduziu payload de check-ins para colunas usadas, tipou as linhas de rede e valida sessao antes de disparar relatorios.
- Gates do sexto lote em 2026-05-06: `npm run typecheck`, `npm run lint`, testes focados utils/auth/check-in (35 passed), E2E smoke/navegacao Chromium (17 passed).
- Ranking de loja deixou de persistir cache em `localStorage`; `refetch` agora busca dados atuais diretamente.
- Preferencias de Aparencia passaram a usar chaves de `localStorage` escopadas por usuario, removendo a chave global antiga quando salva.
- Produtos Digitais ganharam audiencia formal para Admin Master, Admin MX e Consultor MX, com migration de constraint para `produtos_digitais.target_roles`.
- `register-user` removeu `deno-lint-ignore-file no-explicit-any` e tipou o client de rollback como `SupabaseClient`.
- Gates do setimo lote em 2026-05-06: `npm run typecheck`, `npm run lint`, testes focados utils/auth/check-in (35 passed), E2E smoke/navegacao Chromium (17 passed).
- Exportacao PDF passou a carregar `html2pdf.js` por import dinamico, isolando PDF em chunk assíncrono usado apenas na exportacao.
- PWA deixou de precachear chunks pesados de PDF, charts e XLSX; build local reduziu precache para 6401.93 KiB.
- Gates do oitavo lote em 2026-05-06: `npm run typecheck`, `npm run build`, `npm test` (224 passed).
- Migration `20260506120000_expand_produtos_digitais_audience.sql` aplicada no Supabase remoto via `npx supabase db push --linked`.
- Supabase `db lint --linked`: No schema errors found.
- Logo MX otimizado de 1080x1350/~165 KiB para 512x512/~47 KiB em `public` e `src/assets`, alinhando favicon/PWA/imports do app.
- `useTeam`, `useAllSellers`, `Lojas` e `DataGrid` reduziram casts `any` em equipe/lojas e fallback generico de celula.
- Build apos otimizacao do logo reduziu `mx-logo` para 48.35 kB e PWA precache para 6165.94 KiB.
- Gates do nono lote em 2026-05-06: `npm run typecheck`, testes focados utils/auth/check-in (35 passed), `npm run build`, `npm run lint`, `npm test` (224 passed), E2E smoke/navegacao Chromium (17 passed).
- Lojas da Rede passou a comunicar arquivamento/inativacao, alinhado ao hook que nao faz exclusao fisica.
- Equipe/usuarios, criacao de usuario e broadcasts reduziram `any` simples com tipos `TeamMember`, `RegisterUserInput`, `Store` e `Notification`.
- Gates do decimo lote em 2026-05-06: `npm run typecheck`, `npm run lint`, testes focados utils/auth/check-in (35 passed).
- Matinal Rede passou a tipar lojas/metas/check-ins/vinculos do Supabase sem `any` e reporta falha por toast em vez de `console.error`.
- PDI 360 passou a expor contratos tipados para sessoes e bundle de impressao, removendo `any` das telas de gerente, vendedor e print.
- Clientes da Consultoria e Reprocessamento reduziram casts genericos em grid, modulos, audit trail e tratamento de erros.
- Gates do decimo primeiro lote em 2026-05-06: `npm run typecheck`, `npm run lint`, testes focados utils/auth/check-in (35 passed), `npm test` (224 passed), `npm run build`, E2E smoke/navegacao Chromium (18 passed).

### File List

- `docs/stories/story-OPS-20260501-auditoria-hardening-sistema.md`
- `.env.example`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `public/robots.txt`
- `public/mx-logo.png`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/components/organisms/DataGrid.tsx`
- `src/pages/Login.tsx`
- `src/assets/mx-logo.png`
- `src/pages/ProdutosDigitais.tsx`
- `src/pages/SellerPerformance.tsx`
- `src/components/molecules/PageHeader.tsx`
- `src/index.css`
- `src/lib/auth/constants.ts`
- `src/lib/auth/passwordPolicy.ts`
- `src/lib/auth/roles.ts`
- `src/lib/auth/roles.test.ts`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/hooks/useAuth.tsx`
- `src/hooks/useBroadcasts.ts`
- `src/hooks/useCheckins.ts`
- `src/hooks/useCheckins.test.ts`
- `src/hooks/useFeedbacks.ts`
- `src/hooks/usePDI.ts`
- `src/hooks/useRanking.ts`
- `e2e/visual/helpers.ts`
- `e2e/visual/checkin.spec.ts`
- `e2e/visual/__screenshots__/checkin.spec.ts-snapshots/checkin-default-visual-desktop-darwin.png`
- `e2e/visual/__screenshots__/checkin.spec.ts-snapshots/checkin-default-visual-mobile-darwin.png`
- `e2e/visual/__screenshots__/checkin.spec.ts-snapshots/checkin-default-visual-tablet-darwin.png`
- `e2e/visual/__screenshots__/checkin.spec.ts-snapshots/checkin-filled-visual-desktop-darwin.png`
- `e2e/visual/__screenshots__/checkin.spec.ts-snapshots/checkin-filled-visual-mobile-darwin.png`
- `e2e/visual/__screenshots__/checkin.spec.ts-snapshots/checkin-filled-visual-tablet-darwin.png`
- `src/hooks/useTeam.ts`
- `src/lib/utils.ts`
- `src/lib/utils.test.ts`
- `src/lib/pdf/downloadHtmlAsPdf.ts`
- `src/pages/Lojas.tsx`
- `src/hooks/useConsultingAgenda.ts`
- `src/pages/AgendaAdmin.tsx`
- `src/pages/AiDiagnostics.tsx`
- `src/pages/Configuracoes.tsx`
- `src/pages/PainelConsultor.tsx`
- `src/pages/Perfil.tsx`
- `src/pages/ConsultoriaClientes.tsx`
- `src/pages/GerentePDI.tsx`
- `src/pages/MorningReport.tsx`
- `src/pages/PDIPrint.tsx`
- `src/pages/Reprocessamento.tsx`
- `src/pages/RotinaGerente.tsx`
- `src/pages/VendedorFeedback.tsx`
- `src/pages/VendedorPDI.tsx`
- `src/lib/supabase.ts`
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
- `src/features/configuracoes/tabRegistry.ts`
- `src/features/configuracoes/components/tabs/SistemaMxTab.tsx`
- `src/features/admin/components/StoreEditModal.tsx`
- `src/features/lojas/components/StoreTeamPanel.tsx`
- `src/hooks/useConsultingClients.ts`
- `src/hooks/usePDI_MX.ts`
- `src/types/database.ts`
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
- `supabase/migrations/20260501040000_fix_remote_lint_findings.sql`
- `supabase/migrations/20260506120000_expand_produtos_digitais_audience.sql`
