# Technical Debt Assessment - DRAFT
## Para Revisão dos Especialistas

### 1. Débitos de Sistema
- **[CRITICAL] Root Pollution:** Large number of legacy audit and script files in the root directory (`*.mjs`, `*.cjs`, `*.png`).
- **[HIGH] Unit Test Gap:** Strong E2E presence (Playwright) but missing unit tests for complex business calculations in `src/lib/calculations.ts`.
- **[MEDIUM] Ghost Directory:** `src/app` contains redundant logic and must be physically deleted.
- **[LOW] Dependency Drift:** Some devDependencies are slightly ahead/behind, needs lockfile cleanup.

### 2. Débitos de Database
- **[CRITICAL/HIGH] PII Exposure:** Manager and seller emails are stored plainly. RLS prevents unauthorized viewing, but they are not encrypted at rest.
- **[HIGH] Type Sync Debt:** `src/types/database.ts` is missing explicit types for the `store_sellers` (memberships) table.
- **[MEDIUM] N+1 Queries (Performance):** The frontend hook `useCheckinsByDateRange` and `PainelConsultor` fetch large volumes of data. Need composite indexes for `(store_id, reference_date)` and `(seller_user_id, reference_date)` on `daily_checkins`.
- **[MEDIUM] Legacy Ghost Tables:** Need to explicitly `DROP TABLE IF EXISTS` for unused legacy modules (`gamification`, `activities`, `inventory`).
- **[LOW] Service Role Bypass:** External cron jobs and scripts may bypass RLS.
- **[LOW] Large Table Partitioning:** `daily_checkins` will grow linearly; consider partitioning by year/month in the future.
⚠️ **PENDENTE: Revisão do @data-engineer**

### 3. Débitos de Frontend/UX
- **[CRITICAL] Login Page Chaos (`src/pages/Login.tsx`):** 39 token violations detected, extensive use of arbitrary values, standard tailwind classes bypassing `mx-` tokens.
- **[HIGH] Component Library Drift (`src/components/ui/`):** Shadcn UI components still use hardcoded pixel values and VW units.
- **[HIGH] Modal and Overlay Viewport Bounds:** Scattered use of `max-h-[80vh]`, `max-h-[90vh]` instead of semantic layout containers causing scroll-trapping/clipping.
- **[MEDIUM] Hardcoded Inline Styles in Print/Reporting Views:** Extensive use of `style={{ textAlign: 'left' }}` and fixed millimeter widths in print views. Hardcoded colors in Recharts tooltips.
⚠️ **PENDENTE: Revisão do @ux-design-expert**

### 4. Matriz Preliminar

| ID | Débito | Área | Impacto | Esforço | Prioridade |
|----|--------|------|---------|---------|------------|
| SYS-01 | Root Pollution | Sistema | Baixo | Simples | Média |
| SYS-02 | Unit Test Gap | Sistema | Alto | Médio | Alta |
| SYS-03 | Ghost Directory (`src/app`) | Sistema | Baixo | Simples | Baixa |
| SYS-04 | Dependency Drift | Sistema | Baixo | Simples | Baixa |
| DB-01 | PII Exposure (Plaintext emails) | Database | Crítico | Complexo | Alta |
| DB-02 | Type Sync Debt (`store_sellers`) | Database | Alto | Simples | Alta |
| DB-03 | N+1 Queries / Missing Indexes | Database | Alto | Médio | Alta |
| DB-04 | Legacy Ghost Tables | Database | Médio | Simples | Média |
| DB-05 | Service Role Bypass | Database | Médio | Médio | Média |
| DB-06 | Large Table Partitioning | Database | Baixo | Complexo | Baixa |
| UX-01 | Login Page Chaos | Frontend | Alto | Médio | Crítica |
| UX-02 | Component Library Drift | Frontend | Alto | Médio | Alta |
| UX-03 | Modal/Overlay Viewport Bounds | Frontend | Alto | Simples | Alta |
| UX-04 | Hardcoded Inline Styles / Tooltips| Frontend | Médio | Simples | Média |

### 5. Perguntas para Especialistas

**@data-engineer:**
1. A criptografia de PII em repouso (DB-01) deve ser tratada no nível do Postgres (ex: pg_crypto) ou via Supabase Vault?
2. Em relação a particionamento de tabelas (DB-06), qual o gatilho de volume (número de linhas) em que a performance começará a se degradar perceptivelmente?

**@ux-design-expert:**
1. O saneamento da biblioteca Shadcn/Radix (UX-02) deve ocorrer sobrescrevendo os arquivos originais ou criando wrappers com os `mx-` tokens?
2. Para resolver a questão do Chart Theming (UX-04), você possui um mapeamento de variáveis CSS sugerido (ex: `var(--color-status-success)`) para integrar ao Recharts?
