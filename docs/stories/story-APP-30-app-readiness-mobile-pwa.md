# Story APP-30 - App Readiness Mobile e PWA

**Status:** Implemented - readiness documental e PWA shortcuts ajustados  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Onda:** 5 - Personalizacao por loja e app readiness  
**Owner:** @pm  
**Story:** @sm  
**Implementacao sugerida:** @devops + @qa + @dev  
**Quality Gate:** @qa  
**Prioridade:** High

## Contexto

A reuniao citou que app mobile facilita a rotina do vendedor e que Apple e Google possuem prazo de validacao. O repositorio usa Vite e possui `vite-plugin-pwa`, entao a primeira etapa e readiness mobile/PWA antes de qualquer empacotamento nativo.

## User Story

Como admin MX,  
quero validar que os fluxos principais estao prontos para mobile/app,  
para submeter ou preparar distribuicao sem levar problemas basicos de UX, seguranca e operacao.

## Acceptance Criteria

- [x] Checklist de readiness contempla login, vendedor, gerente, dono e admin/admin master MX.
- [x] Fluxos criticos mobile sao listados: check-in diario, notificacoes, treinamentos/desenvolvimento, agenda/visita e dashboard dono.
- [x] PWA possui manifest, nome, tema e shortcuts revisados; icones e instalabilidade ficam como QA visual.
- [x] Validacao inclui breakpoints mobile reais e tablet/desktop.
- [x] Dados sensiveis e RLS sao revisados antes de submissao como gate.
- [x] Plano diferencia PWA, wrapper nativo e submissao Apple/Google.

## Regras de Negocio

- Submissao em loja nao deve ocorrer antes de QA passar nos fluxos principais.
- Prazos citados na reuniao sao referencia de planejamento, nao garantia operacional.
- DevOps conduz publicacao/PR/deploy conforme Constitution.

## Arquivos Provaveis

- `vite.config.ts`
- `package.json`
- `public`
- `src/components/Layout.tsx`
- `src/pages/Checkin.tsx`
- `src/pages/VendedorHome.tsx`
- `src/pages/VendedorTreinamentos.tsx`
- `src/pages/GerenteTreinamentos.tsx`
- `src/pages/PainelConsultor.tsx`
- `docs/`

## Gates

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [x] Mobile browser regression.
- [ ] PWA installability check.

## Dev Log - 2026-06-18

- Corrigida responsividade dos fluxos vendedor em `/home`, `/vendedor/terminal-mx`, `/carteira-clientes`, `/relatorios-vendedor`, `/devolutivas`, `/perfil` e `/vendedor/configuracoes`.
- Validacao local com Playwright/dev-bypass em 1366x768, 768x1024, 390x844 e 360x740 retornou `[]` para overflow horizontal real fora de containers com scroll intencional.
- Gates executados: `npm run lint`, `npm run typecheck`, `npm test`.
- Sidebar premium do vendedor alinhado para `Fechamento Diário`, `Funil de Vendas`, `Feedback`, `Treinamento` e `Meu Perfil`; redirects e shortcut PWA apontam para `/terminal-mx`.
- Restaurado `Meu Dia` no sidebar do vendedor com ícone e rota `/home`; login padrão do vendedor voltou para `/home`, mantendo `Fechamento Diário` em `/terminal-mx`.

## File List

- `docs/stories/story-APP-30-app-readiness-mobile-pwa.md`
- `docs/app-readiness/mobile-pwa-readiness.md`
- `docs/app-readiness/apple-google-submission-checklist.md`
- `vite.config.ts`
- `src/components/Layout.tsx`
- `src/features/checkin/Checkin.container.tsx`
- `src/features/checkin/sections/CheckinForm.tsx`
- `src/features/crm/CarteiraClientes.container.tsx`
- `src/features/crm/CentralExecucao.container.tsx`
- `src/features/crm/MeuPerfilVendedor.container.tsx`
- `src/features/crm/RelatoriosVendedor.container.tsx`
- `src/features/ranking/sections/GlobalRankingHeader.tsx`
- `src/features/ranking/sections/StoreRankingHeader.tsx`
- `src/pages/VendedorFeedback.tsx`
- `src/App.tsx`
- `src/components/SellerSidebar.tsx`
- `src/features/checkin/hooks/useCheckinPage.ts`
- `src/features/checkin/sections/CheckinAdjustmentTab.tsx`
- `src/features/configuracoes/components/tabs/OperacionalLojaTab.tsx`
- `src/features/consultoria/components/ConsultingDailyTrackingView.tsx`
- `src/features/dashboard-loja/sections/KpisSection.tsx`
- `src/features/landing/data/faq-items.ts`
- `src/features/landing/sections/CTASection.tsx`
- `src/features/landing/sections/FooterSection.tsx`
- `src/features/landing/sections/HeroSection.tsx`
- `src/features/landing/sections/ModulosSection.tsx`
- `src/features/landing/sections/SistemaSection.tsx`
- `src/features/remuneracao/MinhaRemuneracaoPage.tsx`
- `src/hooks/checkins/useCheckinsSubmit.ts`
- `src/lib/auth/postLoginRedirect.ts`
- `src/lib/auth/postLoginRedirect.test.ts`
- `src/lib/auth/routeAccess.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/lib/calculations.ts`
- `src/lib/central-mx-engine.ts`
- `src/lib/consultoria/pmr-engine.ts`
- `src/lib/services/checkin-service.ts`
- `src/pages/MorningReport.tsx`
- `src/pages/OperationalSettings.tsx`
- `src/pages/Simulacao.tsx`
