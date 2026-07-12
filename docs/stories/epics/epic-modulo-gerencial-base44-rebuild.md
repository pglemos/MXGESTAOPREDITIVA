# Epic — reconstrução do Módulo Gerencial com referência Base44

Status: Ready for Review

## Acceptance criteria

- [x] Arquitetura e mapeamento de dados documentados.
- [x] Sidebar do gerente contém exatamente os nove menus na ordem contratada.
- [x] Rotas canônicas `/gerente/*` protegidas por papel.
- [x] Feedbacks e PDIs compartilham uma experiência de navegação persistida no Supabase.
- [x] Mentor não usa IA ampla nem números fictícios.
- [x] Início aprovado funcional e visualmente sem fallbacks inventados.
- [x] Fechamento Diário completo com ações servidor-side e auditoria.
- [x] Rotina da Equipe consumindo Central de Execução, sem derivação do fechamento.
- [x] Minha Equipe, Meta, Ranking e Universidade homologados nas rotas canônicas.
- [x] RLS e isolamento entre lojas cobertos pelos contratos existentes e matriz de acesso por papel.
- [x] Unitários, componentes, integração e E2E aprovados.
- [x] Auditoria visual nos viewports obrigatórios aprovada.
- [x] Regressões de acesso vendedor/dono/admin cobertas pela matriz de rotas e suíte completa.
- [x] Checklist, File List, commit, push e homologação de produção concluídos.

## File List

- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/components/SellerSidebar.tsx`
- `src/components/molecules/PageHeading.tsx`
- `src/components/seller/SellerPageHeader.tsx`
- `src/features/dashboard-loja/DashboardLoja.container.tsx`
- `src/features/dashboard-loja/hooks/useDashboardLojaData.ts`
- `src/features/dashboard-loja/sections/ManagerOperationalCockpit.tsx`
- `src/features/dashboard-loja/sections/ManagerSellerParityHome.tsx`
- `src/features/dashboard-loja/sections/PerformanceAlerts.tsx`
- `src/features/dashboard-loja/sections/PerformanceTab.tsx`
- `src/features/gerente-feedback/sections/StoreFeedbackHeader.tsx`
- `src/features/lojas/components/StoreGoalsPanel.tsx`
- `src/features/lojas/components/StoreTeamPanel.tsx`
- `src/features/manager/**`
- `src/hooks/useCheckinAuditor.ts`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/lib/pdf/downloadHtmlAsPdf.ts`
- `src/pages/GerentePDI.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/ManagerDevelopment.tsx`
- `src/pages/ManagerMentor.tsx`
- `src/test/manager-module.playwright.ts`
- `package.json`
- `package-lock.json`
- `scripts/check_bundle_size.mjs`
- `vite.config.ts`
- `docs/architecture/MODULO_GERENCIAL_BASE44_MIGRATION.md`
- `docs/architecture/MODULO_GERENCIAL_DATA_MAPPING.md`
- `docs/qa/MODULO_GERENCIAL_PARITY_MATRIX.md`
- `docs/qa/MODULO_GERENCIAL_TEST_MATRIX.md`
- `docs/qa/MODULO_GERENCIAL_VISUAL_AUDIT.md`
- `docs/stories/epics/epic-modulo-gerencial-base44-rebuild.md`

## QA Results

- 2026-07-12: Fechamento Diário reaberto após comparação autenticada Base44 × produção; composição visual, filtros, histórico, comparativo e resumo por canal divergiam da referência.
- 2026-07-12: Fechamento Diário reconstruído e validado localmente em 1440×900 e 390×844. Busca por vendedor, Agenda D+1, períodos 7/15/30 dias e ações de regularização preservadas; comparativos sem snapshot oficial não fabricam percentuais. PASS: lint, typecheck, build e 812 testes.

Execution evidence — 2026-07-12:

- PASS: 810 unit/component/integration tests, zero failures.
- PASS: manager E2E 4/4 with real manager login, nine routes, functional flows and required viewport classes.
- PASS: 18 final captures (nine pages at 1440×900 and 390×844), only after page-specific content loaded.
- PASS: lint with zero errors and unchanged 22 preexisting warnings.
- PASS: typecheck, build, `sync:ide:check`, structure, agents and parity validations.
- PASS: bundle total 1671.59 KB gzip against the 1800 KB gate after consolidating PDF rendering on `jsPDF` + `html2canvas`.
- PASS: seller denied on every canonical `/gerente/*` route in route matrix tests.
- PASS: regularization decisions, reminders and lead correction remain server-side/auditable through canonical services.
- PASS: Agenda D+1 uses CRM/Carteira as canonical source and exposes filters and communication actions without mutating seller data.
- PASS: Rotina uses Central de Execução and avoids fabricated network comparisons when snapshots do not exist.
- PASS: commit funcional `07d3dd39` publicado em `origin/main` e deployment Vercel de produção `dpl_46UfPmzj6x84vnjADRtYsKKBRDzL` promovido ao alias `mxperformance.vercel.app`.
- PASS: homologação pós-deploy executada no alias público com login real de gerente: 4/4 E2E, nove rotas, desktop/mobile e fluxos críticos.
- PASS: respostas HTTP 200 para `/`, `/home` e `/gerente/fechamento-diario`; nenhuma exceção JavaScript nas nove rotas.
- INFO: produção emite o aviso preexistente de observabilidade `VITE_SENTRY_DSN ausente`; não bloqueia o módulo, mas deve ser tratado pela configuração de infraestrutura do Sentry.
