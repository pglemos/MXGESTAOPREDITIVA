# Mobile/PWA Readiness - MX Performance

**Status:** Operational checklist  
**Epic:** EPIC-MX-CONS-DEV-20260515  
**Wave:** 5 - Personalizacao por loja e app readiness  
**Rule:** This file must not contain credentials, tokens, certificates or private demo passwords.

## Scope

This readiness package validates the app as a mobile-first PWA candidate before any native wrapper or store submission. Store submission remains a separate @devops activity.

## Critical Mobile Flows

| Flow | Role | Route | Readiness |
|---|---|---|---|
| Login/logout | all roles | `/login` | Required |
| Daily launch | vendedor | `/lancamento-diario` | Required |
| Seller home and discipline | vendedor | `/home` | Required |
| Notifications | vendedor/gerente/dono/admin MX | `/notificacoes` | Required |
| Desenvolvimento library | vendedor/gerente | `/treinamentos` | Required |
| Manager routine | gerente/admin MX | `/rotina` | Required |
| Owner dashboard | dono/admin MX | `/lojas` | Required |
| PMR agenda and visit execution | admin/admin master MX | `/agenda`, `/consultoria/clientes` | Required |

## Viewport Matrix

| Viewport | Width x Height | Required checks |
|---|---:|---|
| Small mobile | 390 x 844 | no horizontal overflow, primary actions visible, cards stack correctly |
| Large mobile | 430 x 932 | forms usable with touch controls |
| Tablet | 768 x 1024 | navigation and tables readable |
| Desktop | 1440 x 900 | dense admin views remain usable |

## PWA Manifest Review

| Item | Current value | Status |
|---|---|---|
| `name` | MX PERFORMANCE | OK |
| `short_name` | MX PERFORMANCE | OK |
| `display` | standalone | OK |
| `orientation` | portrait | OK for vendedor flow |
| `theme_color` | `#0D3B2E` | OK |
| shortcuts | `/lancamento-diario`, `/classificacao`, `/home` | OK |
| icons | `mx-logo.png`, `favicon.svg` | Needs visual QA for store-grade sizes |
| service worker | `selfDestroying: true` | Review before installability gate |

## PWA Risk Notes

- `selfDestroying: true` intentionally unregisters the legacy service worker to avoid stale public links. Before app-store or installable-PWA positioning, @devops/@qa must decide whether to re-enable a production service worker or keep the PWA as install-light.
- Supabase/API responses must not be cached as app shell data.
- Public pre-registration routes must remain protected from stale-cache behavior.

## QA Evidence Required

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Browser smoke for unauthenticated protected-route redirect
- Authenticated smoke by role in a controlled environment
- Mobile screenshots for vendedor, gerente and dono flows

## Go/No-Go

- **GO for internal beta:** after build passes and authenticated mobile smoke passes.
- **NO-GO for store submission:** until service worker/installability, store-grade icons/screenshots, privacy policy and demo accounts are ready.
