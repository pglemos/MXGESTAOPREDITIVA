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
- [ ] Mobile browser regression.
- [ ] PWA installability check.

## File List

- `docs/stories/story-APP-30-app-readiness-mobile-pwa.md`
- `docs/app-readiness/mobile-pwa-readiness.md`
- `docs/app-readiness/apple-google-submission-checklist.md`
- `vite.config.ts`
