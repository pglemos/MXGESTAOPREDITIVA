# Story OPS-20260516 - Hardening Final Dos 168 Achados Multi-Role

## Status

Ready for Review

## Contexto

Continuação do `EPIC-OPS-20260507-MULTI-ROLE-HARDENING` para fechar os 168 achados residuais em Admin MX, dono, gerente e vendedor.

Restrições: sem agentes nativos de background do Codex para trabalho AIOX, sem rotação de secrets reais e sem alterar regra de negócio fora dos artefatos existentes.

## Acceptance Criteria

- [x] Segurança/rotas: capabilities são a fonte de decisão para rotas sensíveis e acesso negado usa estado 403 explícito.
- [x] Navegação global: menus e atalhos respeitam `routeAccess`, sem fallback para rota não autorizada.
- [x] Admin MX/lojas/equipe: arquivamento encerra vínculos ativos, restore é explícito, erros de clipboard/refresh/query são visíveis.
- [x] Dashboard/dono/gerente: loja inválida e ausência de loja têm estado acionável, sem fallback silencioso.
- [x] Feedback semanal: criação/listagem usam contrato comum, semana selecionável e validações obrigatórias.
- [x] PDI: escopo por capability, datas protegidas, empty states e bundle validado.
- [x] Vendedor/check-in/home: timezone, janelas de edição, erro visível, saída suja e WhatsApp protegidos.
- [x] Ranking/LiveFloor: erros propagados, anonimização não busca nome real, modal acessível e sem métricas fake.
- [x] QA/TestSprite/E2E: legados quarentenados, credenciais removidas e smoke por papel documentado.
- [x] Docs/readiness/performance: NO-GO residual documentado com owner, artefatos gerados fora da fonte e build sem alerta novo.

## Checklist Dos 168 Achados

- [x] Achados 1-18: Segurança, Auth e Rotas.
- [x] Achados 19-27: Layout e navegação global.
- [x] Achados 28-62: Admin MX, lojas e equipe.
- [x] Achados 63-75: Dashboard, dono e gerente.
- [x] Achados 76-89: Feedback semanal.
- [x] Achados 90-106: PDI gerente, dono e vendedor.
- [x] Achados 107-130: Vendedor, check-in e home.
- [x] Achados 131-153: Ranking, LiveFloor e modal de vendedor.
- [x] Achados 154-157: QA, TestSprite e E2E.
- [x] Achados 158-168: Docs, readiness, performance e artefatos.

## Gates

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test` passou com 276 testes.
- [x] `npm run build`
- [x] `deno check --node-modules-dir=auto supabase/functions/*/index.ts`
- [x] `npm run test:e2e -- --project=chromium --reporter=line --timeout=60000` passou com 16 executados e 64 skips por ausência de env autenticado/local service role.
- [x] `npm run validate:agents` passou com 0 erros e 121 warnings conhecidos de dependências AIOX.

## Dev Agent Record

### Debug Log

- Story criada para rastrear a correção final dos 168 achados.
- Capabilities receberam aliases públicos camelCase e `manage_team/view_ranking`; `view_products` deixou de incluir vendedor.
- `routeAccess` passou a aceitar regra por capability e a rota protegida retorna 403 autenticado em vez de redirecionamento silencioso.
- Navegação global e mobile passou a filtrar itens por `canAccessPath`; gerente sem loja não cai mais em `/lojas`.
- Simulação exige loja ativa selecionada por vínculo/contexto, sem fallback por nome de loja e sem mascarar `must_change_password`.
- Lojas usam `try/finally` no carregamento, validação de criação, arquivamento via fluxo que encerra vínculos e disciplina 0% para lojas vazias.
- Check-in centralizou motivos/limites, adicionou erro carregável, protegeu histórico contra falhas e bloqueou lançamento diário depois de 09:45.
- Ranking passou a expor erro, usar referência canônica, não buscar loja real quando anonimização está ativa e guardar privacidade por sessão/usuário.
- LiveFloor e SellerProfileModal receberam empty state, meta diária por calendário operacional, foco preso e alternativa textual para radar.
- PDI gerente/vendedor recebeu datas protegidas, refresh com `try/finally`, labels mais específicos, empty states e remoção de botão dentro de link.
- Feedback recebeu WhatsApp com `noopener,noreferrer`, parse de datas protegido, validação local no fluxo de loja e labels/ids adicionais.
- TestSprite legado foi mantido em quarentena e teve placeholders/credenciais literais substituídos por marcadores não secretos.
- Documentos de auditoria e recuperação tiveram senhas temporárias redigidas.
- Artefato técnico `src/lib/calculations.test.ts.orig` foi removido do source tree.
- `npm run typecheck` passou.
- `npm run lint` passou.
- `npm test` passou com 274 testes.
- `npm run build` passou sem alerta de chunk acima de 1000 kB.
- `deno check --node-modules-dir=auto supabase/functions/*/index.ts` passou.
- `npm run validate:agents` passou com 0 erros e 121 warnings existentes.
- Corrigido bloqueio técnico do runner Playwright: a porta padrão `3001` estava ocupada por outro projeto e o config reutilizava servidor local arbitrário.
- `playwright.config.ts` passou a usar porta padrão `3107` e só reutiliza servidor quando `PLAYWRIGHT_REUSE_SERVER=1`.
- `npx playwright test src/test/navigation.playwright.ts --project=chromium --reporter=line --timeout=30000` passou com 4 executados e 11 skips esperados sem env autenticado.
- `npm run test:e2e -- --project=chromium --reporter=line --timeout=60000` passou com 16 executados e 64 skips por ausência de env autenticado/local service role.
- Gates reexecutados após ajuste do Playwright: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `deno check --node-modules-dir=auto supabase/functions/*/index.ts` e `npm run validate:agents` passaram.
- Auditoria residual de 168 achados revalidada: rotas sensíveis legadas `/settings`, `/team`, `/simulacao`, `/produtos`, `/configuracoes` e `/pdi/:id/print` agora carregam capability explícita.
- Alias `/team` deixou de enviar gerente sem loja para `/lojas`; gerente com loja vai para aba de equipe da própria loja e falta de escopo retorna 403.
- Painel de equipe passou a usar `canManageTeam`, confirmação destrutiva em `alertdialog`, clipboard defensivo, PII de pré-cadastro redigida até expansão e senha temporária fora de toast.
- Criação/edição de loja recebeu RPCs de ciclo de vida `admin_update_store`, `admin_archive_store` e `admin_restore_store`, com encerramento explícito de vínculos ativos no arquivamento.
- Dashboard deixou de alterar `activeStoreId` por visualização, passou a validar limites de meta/benchmark, tratar realtime/refresh com erro e usar terminologia de arquivamento.
- Feedback Admin passou a usar o hook comum `createFeedback`, semana selecionável e busca de check-ins da semana escolhida.
- PDI passou a validar bundle com Zod antes da RPC e exibir erro parcial quando recomendações automáticas falham.
- Edge Functions de relatórios/Google/pré-cadastro tiveram casts `as any` removidos dos arquivos tocados; os adaptadores Supabase agora ficam isolados em tipos estruturais.
- Helper E2E não usa mais e-mail operacional padrão; testes autenticados exigem `E2E_AUTH_EMAIL`/`E2E_AUTH_PASSWORD` ou pulam explicitamente.
- Documentação histórica e artefatos de auditoria tiveram e-mails operacionais e senhas temporárias redigidos sem rotação de secrets reais.
- Artefatos gerados `playwright-report/`, `test-results/` e `deno.lock` foram removidos do workspace e adicionados à política de ignore local.
- Revisão pré-commit fechada: `submit_checkin` agora reforça no servidor que registro diário é apenas para vendedor, próprio usuário e até 09:45 BRT.
- Revisão pré-commit fechada: alteração de semana em devolutiva Admin/loja recalcula os totais do funil antes do salvamento.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `deno check --node-modules-dir=auto supabase/functions/*/index.ts`, `npm run validate:agents` e `npm run test:e2e -- --project=chromium --reporter=line --timeout=60000` passaram na validação final.

### File List

- `docs/stories/story-OPS-20260516-168-achados-final-hardening.md`
- `.gitignore`
- `docs/audit/mx-team-access-2026-04-30.md`
- `docs/audit/mx-team-provisioning-log-2026-04-30.md`
- `docs/audit/mx-team-provisioning-log-2026-05-11-dryrun.md`
- `docs/audit/mx-team-provisioning-log-2026-05-11.md`
- `docs/audit/admin-master-access-2026-05-02.md`
- `docs/audit/admin-master-full-e2e-20260503010521.md`
- `docs/audit/admin-master-full-e2e-20260503023622.md`
- `docs/audit/admin-master-full-e2e-20260503042149.md`
- `docs/audit/admin-master-full-e2e-20260503052018.md`
- `docs/audit/synvollt-admin-master-e2e-2026-05-02.md`
- `docs/stories/epics/epic-mx-platform-evolution/`
- `docs/stories/story-CONS-02-client-structure-and-assignments.md`
- `docs/stories/story-OPS-20260430-mobile-calendar-arena.md`
- `docs/stories/story-OPS-20260504-store-registration-profile.md`
- `docs/stories/story-QA-20260515-e2e-suite-stabilization.md`
- `docs/stories/story-manager-routine-04/spec/spec.md`
- `docs/stories/story-whatsapp-message-06/spec/spec.md`
- `docs/stories/story-OPS-20260514-admin-master-password-recovery.md`
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/features/lojas/components/StoreTeamPanel.tsx`
- `src/features/pdi/WizardPDI.tsx`
- `src/features/ranking/components/LiveFloor.tsx`
- `src/features/ranking/components/SellerProfileModal.tsx`
- `src/hooks/useFeedbackReports.ts`
- `src/hooks/useFeedbacks.ts`
- `src/hooks/useAuth.tsx`
- `src/hooks/useCheckins.ts`
- `src/hooks/useCheckins.test.ts`
- `src/hooks/usePDI_MX.ts`
- `src/hooks/useRanking.ts`
- `src/hooks/useTeam.ts`
- `src/lib/auth/capabilities.ts`
- `src/lib/auth/capabilities.test.ts`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/lib/calculations.test.ts.orig`
- `src/pages/Checkin.tsx`
- `src/pages/GerenteFeedback.tsx`
- `src/pages/GerentePDI.tsx`
- `src/pages/Lojas.tsx`
- `src/pages/Ranking.tsx`
- `src/pages/VendedorHome.tsx`
- `src/pages/VendedorPDI.tsx`
- `src/test/e2e-helpers/auth.ts`
- `src/test/auth-password-recovery.playwright.ts`
- `supabase/functions/_shared/drive-upload.ts`
- `supabase/functions/approve-store-registration/index.ts`
- `supabase/functions/feedback-semanal/index.ts`
- `supabase/functions/google-drive-files/index.ts`
- `supabase/functions/relatorio-matinal/index.ts`
- `supabase/functions/relatorio-mensal/index.ts`
- `supabase/migrations/20260516132000_admin_store_lifecycle_rpcs.sql`
- `testsprite_tests/`
- `playwright.config.ts`
