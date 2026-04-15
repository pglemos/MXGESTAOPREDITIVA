# System Architecture — MX Performance

**Status:** ACTIVE  
**Version:** 2.0  
**Responsible:** @architect (Aria)  
**Audit Date:** April 15, 2026  
**Approval:** Orion (Master Orchestrator)  

---

## 1. Tech Stack

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Frontend | React | 19.x |
| Build | Vite | 6.2.x |
| Linguagem | TypeScript | 5.8.x |
| Roteamento | React Router DOM | 7.13.x |
| Estilo | Tailwind CSS | 4.1.x (CSS-first, sem config file) |
| Animacao | Motion (ex-Framer Motion) | 12.x |
| Graficos | Recharts | 3.7.x |
| Icones | Lucide React | 0.575.x |
| Validacao | Zod | 4.3.x |
| Toasts | Sonner | 2.x |
| Variantes | CVA (class-variance-authority) | 0.7.x |
| Utilitarios | clsx + tailwind-merge | 2.1.x / 3.5.x |
| Datas | date-fns | 4.1.x |
| Excel | xlsx | 0.18.x |
| UI Primitives | Radix UI (11 pacotes) | — |
| Backend | Supabase (Postgres + Auth + Storage) | JS SDK 2.102.x |
| Edge Functions | Deno Runtime (Supabase) | — |
| Email | Resend | 6.10.x |
| Testes Unit | Bun test | 1.3.x |
| Testes E2E | Playwright | 1.58.x |
| CI | GitHub Actions | — |
| Deploy | Vercel | — |

---

## 2. Estrutura de Diretorios

```
/
  src/
    App.tsx                    # Router + Auth + ErrorBoundary
    main.tsx                   # ReactDOM entrypoint
    index.css                  # Design system tokens (Tailwind 4 @theme, ~140 tokens)
    components/
      Layout.tsx               # Shell: sidebar + header + outlet
      LegacyModuleShell.tsx    # Wrapper legado
      auth-provider.tsx        # Auth provider duplicado (legacy)
      atoms/                   # 6: Badge, Button, Input, Skeleton, Textarea, Typography
      molecules/               # 3: Card, FormField, MXScoreCard
      organisms/               # 1: DataGrid
      admin/                   # 1: AdminNetworkView
    features/
      consultoria/             # GoogleCalendarView + types
      feedback/                # WeeklyStoreReport, PrintableFeedback
      pdi/                     # WizardPDI
    hooks/                     # 16 hooks de negocio
    lib/
      calculations.ts          # Motor de calculos (critico)
      export.ts                # Exportacao Excel
      supabase.ts              # Client singleton
      utils.ts                 # cn(), camelCase, snakeCase
      migration-validator.ts   # Validacao dados legados
      api/                     # stores.ts, manager.ts
      automation/              # 13 modulos: scheduler, engines, templates, XLSX, WhatsApp
      services/                # checkin-service.ts
      validation/              # checkin-validator.ts, legacy-normalizer.ts
    pages/                     # 38 paginas (lazy-loaded)
    types/                     # database.ts (519 linhas), index.ts, postgres.d.ts
    test/                      # setup.ts, e2e/, security/, atoms/
    benchmarks/                # find_optimization.test.ts
  supabase/
    functions/                 # 6 Edge Functions + _shared/ (9 modulos)
    migrations/                # 40 migrations versionadas
  scripts/                    # 85+ scripts operacionais/debug/migration
  docs/                       # PRD, stories, reviews, reports, architecture
```

---

## 3. Padroes Core

### 3.1 Design System
- **Atomic Design** com hierarquia rigida: Atoms -> Molecules -> Organisms.
- **Tailwind v4 CSS-first**: tokens definidos via `@theme` em `index.css`. Sem `tailwind.config.js`.
- **CVA** para gerenciamento de variantes (Button: 8 variantes x 4 sizes).
- **cn()** (clsx + tailwind-merge) para composicao de classes.
- **Fontes**: Plus Jakarta Sans (UI) + JetBrains Mono (numeros).

### 3.2 Gerenciamento de Estado
- **React Context** via `AuthProvider` (sem Redux/Zustand).
- Cada hook faz queries diretas ao Supabase com `useState`/`useEffect` locais.
- `useAuth()` (367 linhas): bootstrap de sessao, normalizacao de roles, zero trust, multi-store switching.

### 3.3 Camada de API
- **Supabase Client Singleton** — unico `createClient()` em `supabase.ts`.
- Queries diretas via `supabase.from('table').select()/.insert()/.update()/.rpc()`.
- `lib/api/`: wrappers para queries multi-tabela (governanca, rotina gerente).
- `lib/services/`: logica de dominio (checkin-service).
- Edge Functions para automacoes server-side (relatorios, OAuth, WhatsApp).

### 3.4 Roteamento
- **React Router v7** com `BrowserRouter`.
- **34 Route elements**: 3 publicas + 31 protegidas.
- **Lazy loading**: todas as 38 paginas via `React.lazy()` + `Suspense`.
- **Role-based**: `<ProtectedRoute>` + `<RoleRedirect>` + `<RoleSwitch>`.
- **4 roles**: admin, dono, gerente, vendedor (aliases legados normalizados).

### 3.5 Modelagem Temporal
- Check-in opera em D-1 (producao declarada = dia anterior).
- Agendamentos operam em D-0 (agenda do dia corrente).
- Deadline 09:30 BRT, lock 09:45 BRT.

---

## 4. Bundle e Performance

### 4.1 Manual Chunks (vite.config.ts)

| Chunk | Modulos | Proposito |
|-------|---------|-----------|
| `vendor-react` | react, react-dom, react-router-dom | Core framework |
| `vendor-utils` | date-fns, clsx, tailwind-merge | Utilitarios |
| `vendor-ui` | lucide-react, motion, sonner | UI runtime |
| `vendor-charts` | recharts | Graficos |
| `vendor-export` | xlsx | Exportacao Excel |
| `vendor-supabase` | @supabase/supabase-js | Backend client |

### 4.2 Configuracoes de Build
- Target: `esnext`
- Minifier: `esbuild`
- CSS Code Split: enabled
- Chunk size warning: 1000 KB
- HMR: habilitado (desativavel via `DISABLE_HMR=true`)

---

## 5. Edge Functions

| Funcao | Trigger | Proposito |
|--------|---------|-----------|
| `relatorio-matinal` | pg_cron 08:30 BRT + manual | Relatorio matinal diario |
| `relatorio-mensal` | pg_cron dia 1 10:30 BRT + manual | Fechamento mensal |
| `feedback-semanal` | pg_cron segunda 12:30 BRT + manual | Feedback semanal |
| `send-individual-feedback` | manual (gerente) | Envio feedback individual por email |
| `google-oauth-handler` | OAuth callback | Conexao Google Calendar |
| `google-calendar-events` | consulta de eventos | Busca eventos com refresh token |

**_shared/** (9 modulos): schemas (Zod), google, crypto, email, store, supabase-client, format, response, cors.

---

## 6. Testes

### 6.1 Testes Unitarios (12 arquivos, 63 tests)

| Categoria | Arquivos |
|-----------|----------|
| Motor de calculos | `calculations.test.ts` |
| Utilitarios | `utils.test.ts`, `supabase.test.ts` |
| Relatorios | `morning-report.test.ts` |
| Validacao | `legacy-normalizer.test.ts`, `checkin-validator.test.ts` |
| Hooks | `useStoreSales.test.ts`, `useNotifications.test.ts`, `useCheckins.test.ts` |
| Componentes | `MXScoreCard.test.ts`, `Button.test.tsx` |
| Benchmarks | `find_optimization.test.ts` |

### 6.2 Testes E2E (2 arquivos)
- `smoke-flows.playwright.ts` — Fluxos de smoke
- `RLS-Isolation.playwright.ts` — Teste de isolamento RLS

### 6.3 Runner
- Unit: `bun test`
- E2E: `playwright test`
- Quality gates: `npm run lint` (tsc + token lint) -> `npm run typecheck` -> `npm test`

---

## 7. Metricas do Sistema

| Metrica | Valor |
|---------|-------|
| Paginas | 38 (lazy-loaded) |
| Hooks | 16 source files |
| Componentes | 15 source files |
| Features | 5 modulos |
| Lib modules | 21 source files |
| Edge Functions | 6 (+ 9 shared helpers) |
| Migrations | 40 arquivos SQL |
| Testes unitarios | 12 arquivos, 63 tests |
| Testes E2E | 2 arquivos |
| Scripts operacionais | 85+ |
| Type definitions | 3 arquivos (database.ts = 519 linhas) |
| Rotas | 34 Route elements |
| Roles | 4 (admin, dono, gerente, vendedor) |
| Design tokens | ~140 (Tailwind 4 @theme) |
| Radix primitives | 11 pacotes instalados |
| Banco de dados | 57 tabelas + 4 views |

---

## 8. System-Level Technical Debt

### SYS-01 — TypeScript Strict Mode Desativado
- **Severidade:** HIGH
- `tsconfig.json` nao habilita `strict: true` explicitamente.
- Permite `any` implicito, null checks ausentes, e coercao implicita.

### SYS-02 — Radix UI Parcialmente Usado
- **Severidade:** MEDIUM
- 11 pacotes `@radix-ui/*` instalados como dependencies.
- Nao esta claro se todos sao efetivamente importados no codigo.
- Candidatos a remocao se nao utilizados (reduz bundle).

### SYS-03 — auth-provider.tsx Duplicado
- **Severidade:** LOW
- `src/components/auth-provider.tsx` convive com `src/hooks/useAuth.tsx`.
- Possivel redundancia legada.

### SYS-04 — Scripts Raiz (85+)
- **Severidade:** LOW
- `scripts/` acumulou 85+ scripts operacionais sem indexacao clara.

### SYS-05 — Tailwind v4 Migration Incompleta
- **Severidade:** MEDIUM
- Tailwind v4 em uso com CSS-first config.
- Algumas areas podem ainda usar padroes do Tailwind v3.

### SYS-06 — Sem Teste de Regressao Visual
- **Severidade:** LOW
- Nao ha testes de regressao visual automatizados.

---

## 9. Configuracoes de Infraestrutura

| Config | Valor |
|--------|-------|
| Deploy | Vercel (SPA rewrite) |
| Repo | `pglemos/MXGESTAOPREDITIVA` |
| Branch | `main` |
| URL producao | `mxperformance.vercel.app` |
| Node engine | >= 20.0.0 |
| Module type | ESM |
| Path alias | `@/* -> ./src/*` |
| TypeScript target | ES2022 |
| TypeScript JSX | react-jsx |
