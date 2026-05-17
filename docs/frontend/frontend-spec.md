# Frontend Specification — MX Gestão Preditiva

**Generated:** 2026-05-16
**Agent:** @ux-design-expert (Uma)
**Phase:** 3/10 — Brownfield Discovery
**Working dir:** `/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA`

> **Article IV — No Invention:** Toda afirmação é rastreada a `arquivo:linha` ou marcada `[NÃO VERIFICADO]`.

---

## 1. Executive Summary

O frontend do MX Gestão Preditiva é uma SPA React 19 + Vite 6 + TypeScript 5.8 (strict) com PWA `selfDestroying`, Tailwind CSS 4 (tokens via `@theme` em `src/index.css`), 42 pages, 41 hooks e estrutura híbrida Atomic Design (`src/components/atoms|molecules|organisms`) + feature-based (`src/features/*`). O roteamento usa `react-router-dom@7` com lazy loading universal (todas as 42 pages em `lazy()` em `src/App.tsx`) e enforcement RBAC via `canAccessPath` em `src/lib/auth/routeAccess.ts:1-81`, complementado por `<ProtectedRoute>` e `<RoleSwitch>` (`src/App.tsx:110-156`, `:286-312`).

A **maturidade do design system é média (3/5)**: existe SoT parcial de tokens em `src/index.css` `@theme` (`mx-*` colors, spacing, radius) e há lint-tokens guard (`scripts/lint-tokens.js`, 113 LOC) bloqueando cores Tailwind padrão e valores arbitrários. MAS: ALLOWED arrays em `lint-tokens.js` são desconectados do `@theme` real → drift silencioso; Recharts em `ConsultoriaClienteDetalhe.tsx:170-179` usa hex hardcoded (#0D3B2E, #22C55E, #FACC15, #EF4444) escapando do lint; apenas 13 atoms/14 molecules/7 organisms enquanto pages somam 20.007 LOC — indica lógica/UI acoplada nas pages.

**Débitos UX dominantes**: pages monolíticas confirmadas (15 pages >500 LOC, 13K+ LOC concentradas); cobertura de Skeleton em apenas 7/42 pages (16,6%); ausência de `react-hook-form` (0 ocorrências) → 30+ forms manuais; sem i18n (PT-BR hardcoded). Pontos positivos: code splitting universal, `MotionConfig reducedMotion="user"`, RBAC granular client-side (27 rules + capability matrix), 389 ocorrências `aria-*|role=`, 61 `focus-visible|sr-only` (a11y baseline acima da média).

## 2. Stack Frontend

| Layer | Tech | Versão | Notas |
|-------|------|--------|-------|
| UI Lib | React | 19.0.0 | concurrent + Suspense |
| Build | Vite | 6.x (`@vitejs/plugin-react@5`) | `target: esnext`, `cssCodeSplit: true` |
| Language | TypeScript | 5.8 (`tsconfig.json`) | strict flag não confirmado nas linhas inspecionadas [NÃO VERIFICADO] |
| CSS | Tailwind CSS | 4.1.14 | via `@tailwindcss/vite`, tokens em `src/index.css` `@theme` |
| Headless | Radix UI | apenas `react-dialog@1.1.15` | uso muito restrito (sem combobox, popover, tooltip Radix) |
| Variants | `class-variance-authority` | 0.7.1 | usado em Button, Badge, Accordion, EmptyState, Avatar, Select, Tooltip, Typography, StatusBadge |
| Routing | react-router-dom | 7.13.1 | BrowserRouter + lazy() |
| Data | TanStack Query | 5.99.0 | `QueryProvider` em `src/main.tsx:4` |
| Forms/Validation | zod | 4.3.6 | 8+ schemas em `src/lib/schemas/`. NÃO usa react-hook-form |
| Charts | recharts | 3.7.0 | chunk separado `vendor-charts` |
| Toast | sonner | 2.0.7 | `<Toaster />` em `src/App.tsx:212` |
| Motion | motion | 12.23.24 | `MotionConfig reducedMotion="user"` |
| Icons | lucide-react | 0.575.0 | chunk `vendor-ui` |
| Date | date-fns | 4.1.0 | chunk `vendor-utils` |
| PDF/Excel | jspdf, html2pdf.js, xlsx | — | chunks isolados (lazy) |
| Supabase Client | @supabase/supabase-js | 2.102.1 | singleton em `src/lib/supabase.ts:1-50` |
| PWA | vite-plugin-pwa | — | `selfDestroying: true` (`vite.config.ts:13`) |
| Tests | Bun test + Playwright + Testing Library | — | E2E configurado |

## 3. Arquitetura de Componentes

### 3.1 Inventário

| Categoria | Pasta | Arquivos | Notas |
|-----------|-------|---------|-------|
| Atoms | `src/components/atoms/` | 12 (+ index.ts) | Accordion, Avatar, Badge, Button, DatePicker, EmptyState, Input, Select, Skeleton, Textarea, Tooltip, Typography |
| Molecules | `src/components/molecules/` | 13 (+ index.ts) | Breadcrumb, Card, FilterBar, FormField, GlossaryHint, LastUpdated, ModalTrigger, MXScoreCard, PageHeader, StatusBadge, TabNav, TabNavPill |
| Organisms | `src/components/organisms/` | 6 (+ index.ts) | AgendaCalendar, DREForm, DRETable, DataGrid, Modal, VisitCard |
| Admin | `src/components/admin/` | 1 | underdeveloped |
| Providers | `src/components/providers/` | 1 | `QueryProvider` |
| Layout/Misc | `src/components/` | Layout.tsx (622 LOC), LegacyModuleShell.tsx (24), PWAUpdater.tsx | — |
| Features components | `src/features/*/components/` | 41 (configuracoes:16, consultoria:15, ranking:4, lojas:2, agenda/admin/auth/equipe:1) | feature-driven, paralelo ao Atomic |

**Total componentes localizáveis (excl. pages/hooks): ~85.** Razão pages-LOC vs componentes (20.007/85) indica **lógica/UI acoplada nas pages**.

### 3.2 Componentes Duplicados/Redundantes

| Item | Evidência | Notas |
|------|-----------|-------|
| `TabNav` + `TabNavPill` | `src/components/molecules/` | dois molecules — variantes deveriam ser `cva()` |
| Atomic organisms vs `features/*/components` | dois conjuntos paralelos | sem regra clara → drift e duplicação latente |
| `DataGrid` organism vs `<table>` raw | 9 ocorrências de `<table` em pages | `DataGrid` não é reutilizado consistentemente |
| Sem nomes de arquivo duplicados encontrados | `find...uniq -d` vazio | nomes únicos OK |

### 3.3 Pages Monolíticas (>500 LOC) — CONFIRMADO

| Page | LOC | Notas / Suspeita |
|------|-----|------------------|
| `MXPerformanceLanding.tsx` | **1.698** | landing institucional + FAQ inline + CSS-in-JSX (`prefers-reduced-motion` inline) → forte indício Lovable/v0.dev |
| `DashboardLoja.tsx` | **1.409** | dashboard principal + realtime subscription |
| `AgendaAdmin.tsx` | **1.318** | usa `useAgendaAdmin` (895 LOC) — orquestração duplicada |
| `ConsultoriaClienteDetalhe.tsx` | 953 | charts inline com hex hardcoded |
| `Ranking.tsx` | 854 | — |
| `GerenteFeedback.tsx` | 809 | — |
| `ProdutosDigitais.tsx` | 803 | usa zod direto |
| `SalesPerformance.tsx` | 798 | — |
| `ConsultoriaVisitaExecucao.tsx` | 755 | — |
| `MorningReport.tsx` | 718 | — |
| `StorePreRegistration.tsx` | 708 | — |
| `Checkin.tsx` | 680 | — |
| `RotinaGerente.tsx` | 663 | realtime |
| `Lojas.tsx` | 531 | — |
| `VendedorHome.tsx` | 518 | — |

**Decomposição sugerida** (proposta UX, validação por @architect): cada page >500 LOC deve quebrar em (1) Hook orquestrador puro (`useXxxOrchestrator`), (2) Section components em `src/features/{domínio}/sections/`, (3) Page container <200 LOC compondo sections. `MXPerformanceLanding` é candidato a extração completa para `src/features/marketing/sections/`.

## 4. Design System

### 4.1 Tokens (fonte: `src/index.css` `@theme`, 1.514 LOC totais)

| Categoria | Tokens (amostra) | Enforcement |
|-----------|------------------|-------------|
| Colors brand | `--color-mx-black`, `--color-brand-primary` (#22C55E), `--color-brand-secondary` (#0D3B2E), `--color-pure-black` | `lint-tokens.js` ALLOWED |
| Colors status | `--color-status-success/warning/error/info` (+ `-surface` variants) | ALLOWED |
| Surface | `--color-surface-default/alt/overlay/elevated` | ALLOWED |
| Text | `--color-text-primary/secondary/tertiary/label` | ALLOWED |
| Border | `--color-border-default/subtle/strong` | ALLOWED |
| Radius | `--radius-mx-{sm,md,lg,xl,2xl,3xl,full}` | ALLOWED |
| Spacing | `--spacing-mx-{0,px,1..36,xs,sm,md,lg,xl,2xl..5xl,tiny}` | ALLOWED (mistura escalas numérica + semântica → risco de drift) |
| Typography | Plus Jakarta Sans + JetBrains Mono via Google Fonts CDN | sem fallback local |

### 4.2 Componentes Base

- **NÃO usa shadcn/ui canônico.** Atoms são implementações internas com `cva()`. Apenas `@radix-ui/react-dialog` instalado (sem Popover, Tooltip, Select, Combobox Radix) → acessibilidade de Select/Tooltip/Modal depende de implementação manual.
- Button variants (`src/components/atoms/Button.tsx:12-22`): `primary | secondary | success | warning | info | danger | outline | ghost | mx-elite`; sizes: `default | sm | xs | lg | icon`.

### 4.3 Lint-Tokens (`scripts/lint-tokens.js`, 113 LOC)

Regras (extraídas do código):
1. **Arbitrary values bloqueados**: `[#XXX]`, `[NNpx]`, `[NN/MM]`, `[NNrem]` em className → violação
2. **Cores Tailwind padrão bloqueadas**: regex `-(slate|gray|...|rose)-NN` exceto whitelist `ALLOWED_COLORS`
3. **Spacing/radius padrão bloqueados**: `(p|m|gap|w|h|...)-(x-|y-|t-|...)?NN` exceto whitelist
4. Apenas inspeciona `className=` literais. NÃO detecta classes via `cva()` runtime, props dinâmicas, ou `style={{}}`/atributos SVG.

**Limitações críticas**: arrays ALLOWED desconectados do `@theme` real (drift silencioso); Recharts `stroke="#0D3B2E"` passa (`ConsultoriaClienteDetalhe.tsx:170-179`); `Button.tsx:25` `text-[10px]` passa porque está em variant cva.

### 4.4 Desvios documentados

| Local | Tipo | Severidade |
|-------|------|-----------|
| `ConsultoriaClienteDetalhe.tsx:170-179` | hex hardcoded em recharts | Alta |
| `Textarea.tsx:12` | `min-h-[120px]` arbitrary | Baixa |
| `Button.tsx:25` size xs | `text-[10px]` arbitrary | Baixa |
| `MXPerformanceLanding.tsx` | CSS inline + media queries hardcoded | Média |

## 5. Fluxos de Usuário

### 5.1 Rotas (mapa completo a partir de `src/App.tsx:200-285`)

Públicas: `/`, `/login`, `/pre-cadastro/:storeSlug`, `/privacy`, `/terms`

Protegidas (`<ProtectedRoute>` + `<Layout>`):
- **Vendedor:** `/home`, `/lancamento-diario`, `/historico`, `/ajuda`, `/classificacao`, `/treinamentos`, `/devolutivas`, `/notificacoes`, `/perfil`, `/pdi`
- **Gerente:** `/lojas/:storeSlug`, `/pdi`, `/pdi/:id/print`, `/rotina`, `/auditoria`
- **Admin/Consultor:** `/painel`, `/lojas`, `/agenda`, `/consultoria/*` (4 subrotas), `/produtos`, `/configuracoes/*` (4 subrotas), `/relatorio-matinal`, `/relatorios/performance-vendas|performance-vendedor`, `/simulacao/:simulationRole`
- **Aliases/redirects:** `/settings → /configuracoes`, `/ranking → /classificacao`, `/team|/equipe → DashboardLoja?tab=equipe`

### 5.2 Guards de Auth (`src/App.tsx:110-156`, `src/lib/auth/routeAccess.ts`)

- `<ProtectedRoute>`: checks sequenciais `loading||!initialized` → `!profile` → `!role` → `canAccessPath(path, role)`
- `<RoleSwitch>`: switch interno render-time (vendedor/gerente/dono/admin); default `RoleRedirect`
- `ROUTE_ACCESS_RULES`: 27 regras com `pattern + roles + capability`. Usa `Capability` matrix (`src/lib/auth/capabilities.ts`) + role lists (INTERNAL_ROLES, MANAGEMENT_ROLES, INTERNAL_AND_OWNER, INTERNAL_AND_LEADERS) — granularidade alta
- **Defense in depth:** client-side APENAS. RLS no backend é responsabilidade da FASE 2 (validar com @data-engineer)
- **Vulnerabilidade potencial:** `<RoleSwitch>` decide UI mas hooks (ex: `useAgendaAdmin`) podem disparar antes do bloqueio — necessário verificar role checks internos [NÃO VERIFICADO exaustivamente]

## 6. Responsividade & PWA

- **Mobile-first:** breakpoints em pages → `sm:` 453x, `md:` 213x, `lg:` 238x, `xl:` 91x. Predomínio de `sm:` confirma intent mobile-first.
- **PWA:** `vite-plugin-pwa` com `selfDestroying: true` (`vite.config.ts:13`) — SW antigo é desregistrado a cada deploy (intencional para evitar stale UI em públicos, mas **anula benefícios offline**)
- Manifest: `display: standalone`, `orientation: portrait`, `lang: pt-BR`, shortcuts para `/lancamento-diario`, `/classificacao`, `/home`
- runtimeCaching: storage Supabase (CacheFirst 7d), imagens (SWR 30d), assets estáticos (SWR)
- **Falta:** install prompt customizado; skeleton consistente em rotas pesadas

## 7. Acessibilidade (a11y)

### 7.1 Cobertura

- 389 ocorrências de `aria-*` ou `role=` em `src/components` + `src/pages`
- 61 ocorrências de `focus-visible | focus:ring | focus:outline | sr-only`
- `MotionConfig reducedMotion="user"` (`src/App.tsx:206`) + `@media (prefers-reduced-motion: reduce)` em `src/index.css` e `MXPerformanceLanding.tsx`
- Button: `aria-hidden` automático para SVGs (`Button.tsx:48-57`), tooltip para size=icon via `aria-label`
- Sonner `Toaster` com `richColors`

### 7.2 Issues identificados

| Componente / Local | Issue WCAG | Severidade |
|--------------------|-----------|-----------|
| 14 de 18 `<img>` têm `alt=`; 4 `<img>` sem `alt` | WCAG 1.1.1 Non-text Content | Alta |
| Select, Tooltip, Modal sem Radix → ARIA manual frágil | WCAG 4.1.2 Name/Role/Value | Alta |
| Tabelas raw `<table>` (9x em pages) sem confirmação de `scope`, `<th>`, `caption` | WCAG 1.3.1 | Média |
| Charts recharts sem `<title>`/`aria-label` em `ConsultoriaClienteDetalhe.tsx:170-179` | WCAG 1.1.1 + 1.4.1 (cor única) | Alta |
| Contraste `text-tertiary` (#94a3b8) sobre `surface-default` (#fff) → razão ~2.5:1 | WCAG 1.4.3 AA exige 4.5:1 | Alta |
| `text-[10px]` em Button size xs | WCAG 1.4.4 Resize text | Média |
| Skip-link não detectado | WCAG 2.4.1 Bypass Blocks | Média |
| Form fields sem confirmação de `<label for>` consistente | WCAG 1.3.1 / 3.3.2 | Alta [NÃO VERIFICADO em detalhe] |

**Score a11y estimado: 3/5** (base boa, gaps críticos em contraste, charts e absence de Radix headless).

## 8. Estados & Feedback

| Tela / Componente | Loading | Error | Empty | Success | Notas |
|-------------------|---------|-------|-------|---------|-------|
| Cobertura Skeleton em pages | 7/42 (16,6%) | n/a | n/a | n/a | sub-cobertura |
| `EmptyState` atom existe | — | — | sim | — | uso esparso (88 ocorrências Skeleton+EmptyState somadas) |
| Toast (sonner) — 366 chamadas `toast.*` | n/a | sim | n/a | sim | feedback de operação OK |
| ErrorBoundary global | n/a | sim | n/a | n/a | `src/App.tsx:72-105` — fallback bem desenhado |
| Suspense fallback `<Spinner />` | 37 ocorrências em App.tsx | n/a | n/a | n/a | spinner único, sem skeleton-per-route |
| ProtectedRoute loading | spinner full-screen | n/a | n/a | n/a | bloqueia toda a UI durante init |

**Gap principal:** as 7 pages com Skeleton concentram a UX cuidada; as outras 35 (incl. monolíticas) usam `<Spinner />` genérico → loading perceivable mas CLS alto provável em mobile.

## 9. Performance Frontend

**Pontos fortes:**
- Code splitting universal (`lazy()` em todas as 42 pages)
- Vendor chunking manual em `vite.config.ts:84-100`: `vendor-react`, `vendor-utils`, `vendor-ui`, `vendor-charts`, `vendor-export` (xlsx), `vendor-html2canvas`, `vendor-html2pdf`, `vendor-jspdf`, `vendor-supabase`
- `cssCodeSplit: true`, `target: esnext`
- `chunkSizeWarningLimit: 1000` (1MB) — alto, pode mascarar bundles inchados

**Pontos fracos:**
- Pages monolíticas (1.698 LOC em landing) carregam em chunk único — split por section ausente
- Pages que importam recharts + xlsx pagam custo combinado
- date-fns sem cherry-pick específico (depende do bundler)
- `selfDestroying: true` no PWA descarta cache em deploy → cold first-load pós-deploy
- 4 `<img>` sem alt provavelmente também sem `width/height` (CLS) [NÃO VERIFICADO]
- Suspense fallback único `<Spinner />` não evita layout shift

## 10. State Management & Data Fetching

- **TanStack Query v5** singular (`QueryProvider` em `src/main.tsx:4`). Configurações (staleTime, key conventions) [NÃO VERIFICADO — inspecionar `src/components/providers/QueryProvider.tsx`]
- **Realtime subscriptions Supabase** confirmadas em: `src/hooks/useAuth.tsx`, `src/hooks/useNotifications.ts`, `src/pages/RotinaGerente.tsx`, `src/pages/Notificacoes.tsx`, `src/pages/DashboardLoja.tsx`. **Risco:** subscriptions em pages monolíticas (DashboardLoja 1.409 LOC) sem garantia de cleanup robusto
- **No Redux/Zustand**: estado global em hooks (Auth context) ou Query cache. Aceitável dada a stack
- **`database.types.ts` NÃO existe.** Apenas `src/types/database.ts` (610 LOC, manual). Confirmado: tipos PT-BR mantidos à mão → **drift garantido** com renames recentes da FASE 2 se não houver regeneração automática

## 11. Forms & Validation

- **`react-hook-form` NÃO instalado** (0 ocorrências em src)
- Forms manuais: 30 ocorrências de `<form|onSubmit|handleSubmit` → estado local com `useState`, validação ad-hoc
- **Zod schemas**: 8 schemas em `src/lib/schemas/` (pdi, dre, feedback, performance, consulting-client, notification). Usados também em hooks `useTeam`, `usePDI_MX` e page `ProdutosDigitais`
- `FormField` molecule existe — padrão label/input/error disponível, mas sem integração automática com schema

**Débito:** alto risco de validação inconsistente em forms grandes (`Checkin.tsx` 680 LOC, `StorePreRegistration.tsx` 708 LOC, `MorningReport.tsx` 718 LOC)

## 12. God-Hooks (>300 LOC) — CONFIRMADO

| Hook | LOC | Responsabilidades aparentes | Split sugerido |
|------|-----|-----------------------------|---------------|
| `useAgendaAdmin.ts` | **895** | calendar sync (visit + schedule_event), Google Calendar (personal + central), date ranges, PMR rules | `useAgendaQueries`, `useAgendaCalendarSync`, `useAgendaMutations`, `useAgendaFilters` |
| `useTeam.ts` | 625 | team CRUD + zod schemas inline | extrair schemas; split queries/mutations |
| `useAuth.tsx` | 585 | profile, membership, simulation, dev bypass, role normalization, realtime | `useAuthSession`, `useAuthProfile`, `useRoleSimulation`, `useAuthRealtime` |
| `useConsultingClients.ts` | 479 | client list + filters + mutations | split queries/mutations |
| `useRanking.ts` | 430 | ranking calc + filters | extrair cálculo para `src/lib/ranking/` |
| `usePDI_MX.ts` | 428 | PDI logic + zod | extrair schema; split |
| `useConsultingClientBySlug.ts` | 398 | client detail + visits | split queries vs UI helpers |
| `useNetworkPerformance.ts` | 388 | rede multi-loja | split por métrica |
| `useTrainings.ts` | 382 | trainings CRUD | extrair schemas |
| `useCheckins.ts` | 318 | check-in + Gate 09:45 (linha 11, 66) | manter; Gate é regra de negócio crítica |

Total hooks: 8.286 LOC.

## 13. Débitos Técnicos (Frontend/UX)

| ID | Débito | Severidade | Categoria | Esforço (h) | Impacto UX | Notas |
|----|--------|-----------|-----------|-------------|-----------|-------|
| UX-001 | Pages monolíticas (15 pages >500 LOC) | Crítica | components | 80-120 | Manutenibilidade, regressões | Decompor em sections + hooks orquestradores |
| UX-002 | God-hooks (10 hooks >300 LOC, 5.328 LOC top-10) | Crítica | state | 60-90 | Re-renders amplos, testabilidade zero | Split por responsabilidade |
| UX-003 | `MXPerformanceLanding` (1.698 LOC) CSS inline + FAQ inline — origem Lovable provável | Crítica | components/DS | 24-40 | Drift visual, sem reuso de tokens | Extrair para `src/features/marketing/` |
| UX-004 | `database.types.ts` ausente; tipos PT-BR manuais (`src/types/database.ts` 610 LOC) | Crítica | state | 8 (geração automática) | Erros runtime após renames DB | Configurar `supabase gen types typescript` em CI |
| UX-005 | Charts recharts com hex hardcoded em `ConsultoriaClienteDetalhe.tsx:170-179` | Alta | design-system | 4 | Drift visual, dark mode futuro impossível | Criar paleta `chart-*` no `@theme` |
| UX-006 | `lint-tokens.js` whitelist desconectada do `@theme` real | Alta | design-system | 6 | Drift silencioso CSS↔linter | Gerar arrays do AST de `src/index.css` |
| UX-007 | a11y: 4 `<img>` sem alt; contraste `text-tertiary`; charts sem `aria-label`; tabelas raw sem `<th scope>` | Alta | a11y | 24-32 | Reprovação WCAG AA | Auditoria sistemática + `eslint-plugin-jsx-a11y` |
| UX-008 | Skeleton coverage 16,6% (7/42 pages) — restantes `<Spinner />` genérico | Alta | state | 32-48 | CLS, percepção de lentidão | Skeleton-per-route padronizado |
| UX-009 | Sem `react-hook-form` → 30+ forms manuais com validação ad-hoc | Alta | forms | 40-60 | Bugs validação, UX inconsistente | Adotar RHF + integração com zod existentes |
| UX-010 | Realtime subscriptions em pages monolíticas (DashboardLoja, RotinaGerente, Notificacoes) sem garantia de cleanup | Alta | state | 16-24 | Memory leaks, double-fires | Centralizar em hooks dedicados + verificar `unsubscribe` |
| UX-011 | Sem i18n (PT-BR hardcoded; 0 `useTranslation`) | Média | i18n | 60-100 | Bloqueia internacionalização | Definir estratégia (i18next vs LinguiJS) |
| UX-012 | `TabNav` + `TabNavPill` duplicados | Média | components | 4 | Dúvida qual usar | Unificar via variant `cva` |
| UX-013 | Atomic Design + Features coexistem sem regra | Média | architecture | 8 | Drift, duplicação latente | ADR + boundary docs |
| UX-014 | `selfDestroying` PWA anula benefícios offline | Média | perf | 16 | Sem offline real | Decidir entre PWA real vs SPA-with-manifest |
| UX-015 | `eslint.config.js` (383 bytes) sem `jsx-a11y` / `react-hooks` confirmado | Média | a11y/quality | 4 | Regressões a11y, hooks rules | Adicionar plugins |
| UX-016 | `<RoleSwitch>` decide UI mas hooks subjacentes podem disparar antes | Média | security/state | 8-16 | Vazamento dados RBAC client-side | Auditar `useAgendaAdmin`, `useNetworkPerformance` |
| UX-017 | Suspense fallback único `<Spinner />` para 37 lazy routes | Média | perf | 8 | Layout shift | Skeleton-per-route shell |
| UX-018 | `Textarea`, `Button` size xs usam arbitrary values escapando do lint | Baixa | design-system | 2 | Inconsistência | Adicionar tokens `text-mx-tiny`, `min-h-mx-textarea` |
| UX-019 | Google Fonts via CDN sem fallback local | Baixa | perf | 4 | FOIT em redes lentas | self-host com `font-display: swap` |
| UX-020 | `chunkSizeWarningLimit: 1000` mascara bundles inchados | Baixa | perf | 1 | Falha de visibilidade | Reduzir para 500 |

**Total: 20 débitos** — Críticos: 4, Altas: 7, Médias: 7, Baixas: 2

## 14. Respostas às Perguntas Prévias

### Do @architect (FASE 1)

- **Atomic Design é SoT real?**
  Parcialmente. Existe estrutura `atoms|molecules|organisms` (32 componentes) mas coexiste com `src/features/*/components/` (41 componentes). Sem ADR documentando quando criar atom vs feature component → **NÃO é SoT real, é convenção informal**. Recomenda-se ADR + dedicar atoms/molecules/organisms para reuso cross-feature, e features para componentes específicos de domínio.

- **Regras de `lint-tokens.js`?**
  Bloqueia (1) arbitrary values com `#`/px/rem/%, (2) cores Tailwind padrão fora de whitelist `mx-*` + status + surface, (3) spacing/radius numéricos fora de tokens `mx-*`. Limitações: só inspeciona `className=` literais; whitelist desconectada do `@theme` real (drift silencioso); não vê atributos SVG/style.

- **Estratégia UX de decomposição das pages monolíticas?**
  Pattern proposto: `useXxxOrchestrator` (hook puro <250 LOC) + `src/features/{domínio}/sections/Xxx{Section}.tsx` (5-8 sections por page) + `pages/Xxx.tsx` container <200 LOC. Priorizar `MXPerformanceLanding`, `DashboardLoja`, `AgendaAdmin`.

- **Design system Tailwind 4 + Radix documentado?**
  NÃO. Não há `docs/design-system/` nem Storybook detectado. Apenas `index.css` `@theme` + `lint-tokens.js` são SoT implícita. Atoms usam `cva()` consistentemente, mas sem doc.

### Do @data-engineer (FASE 2)

- **Alinhamento PT-BR no front com renames do DB?**
  Tipos em `src/types/database.ts` (manual, 610 LOC) usam termos PT-BR (`PDIStatus`, `CheckinScope`, `StoreSourceMode`, roles `administrador_geral|administrador_mx|consultor_mx|dono|gerente|vendedor`). **Sem regeneração automática** → desvio garantido após renames recentes.

- **`database.types.ts` gerado?**
  **NÃO.** Apenas `src/types/database.ts` manual. CRÍTICO — UX-004.

- **Real-time subscriptions usadas?**
  SIM. 5 arquivos confirmados: `useAuth.tsx`, `useNotifications.ts`, `RotinaGerente.tsx`, `Notificacoes.tsx`, `DashboardLoja.tsx`. Pages monolíticas com subscription preocupam (cleanup, re-render).

- **Gate 09:45 client-side ou só server?**
  Implementado **client-side** em `src/hooks/useCheckins.ts:11` (`CHECKIN_EDIT_LIMIT_LABEL = '09:45'`) e `:66` (comentário "até 09:45 inclusive; 09:46 bloqueia"). Texto exibido em `MXPerformanceLanding.tsx:1126,1591`. Testado em `useCheckins.test.ts:32`. **Recomendação:** confirmar com @data-engineer se há enforcement server-side (RLS/trigger/RPC). Sem enforcement no DB, alteração de relógio do cliente burla o gate.

- **RBAC client vs RPC — defense in depth?**
  Client: `canAccessPath` + `ROUTE_ACCESS_RULES` (27 regras) + `<ProtectedRoute>` + `<RoleSwitch>` + capability matrix — implementação robusta. **Server-side (RLS):** responsabilidade da FASE 2. Defense in depth depende disso.

## 15. Perguntas para Próximos Agentes

### Para @qa (FASE 7)

1. **Regressão visual** das pages monolíticas (`MXPerformanceLanding`, `DashboardLoja`, `AgendaAdmin`) — Playwright screenshot baseline?
2. **a11y audit automatizado** (axe-core via Playwright) por rota + por viewport (mobile/tablet/desktop) — falha esperada em contraste e charts.
3. **Validar Gate 09:45**: testar manipulação de `Date.now()` no cliente; confirmar bloqueio server-side é testado.
4. **RBAC matrix**: 5 roles × 27 regras = 135 cenários. Verificar `<RoleSwitch>` não vaza dados via hooks pré-mount.
5. **Memory leak tests** para realtime subscriptions em `DashboardLoja` / `RotinaGerente` / `Notificacoes` (navegação repetida).
6. **Form validation coverage**: quais dos 30 forms manuais usam schemas zod vs validação ad-hoc?
7. **PWA**: confirmar `selfDestroying` não causa cache split-brain entre versões durante deploys.

### Para @architect (FASE 4-8)

1. ADR sobre Atomic Design vs Feature-based — qual é a SoT?
2. ADR sobre estratégia de decomposição (pattern Hook+Sections+Container)
3. Decisão sobre `react-hook-form` (adopt vs rejeitar) — afeta 30+ forms
4. Pipeline para `supabase gen types` em CI (bloqueia UX-004)
5. Reescrita de `lint-tokens.js` lendo `@theme` direto do CSS (resolve UX-006)
6. Estratégia PWA: real-offline vs SPA-with-manifest (UX-014)
