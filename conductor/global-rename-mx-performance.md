# Plan: Global Rename to MX PERFORMANCE

## Objective
Rename the entire project from "MX PERFORMANCE" to "MX PERFORMANCE" to align with the new branding strategy. This includes code, documentation, configurations, and slugs.

## Key Files & Context
- `package.json`: Project name slug.
- `index.html`: Browser tab title.
- `README.md`, `product-guidelines.md`, `PRD_MX_Gestao_Preditiva_90D_atualizado.md`: Documentation.
- `src/**/*.tsx`: UI components and page titles.
- `supabase/functions/**/*.ts`: Edge Functions and email templates.
- `supabase/config.toml`: Supabase project ID.
- `scripts/*.ts`: Automation scripts.

## Implementation Steps

### 1. Branding Rename (Mixed Case & Uppercase)
Perform a global search and replace for all variations of "MX PERFORMANCE" and "MX PERFORMANCE".
- `MX PERFORMANCE` -> `MX PERFORMANCE`
- `MX PERFORMANCE` -> `MX PERFORMANCE`
- `MX PERFORMANCE` -> `MX PERFORMANCE`
- `MX PERFORMANCE` -> `MX PERFORMANCE`

### 2. Slug Rename
Perform a global search and replace for internal slugs.
- `mxperformance` -> `mxperformance`
- `mx-performance` -> `mx-performance`

### 3. Specific File Updates
- **`package.json`**: Ensure name is `mx-performance`.
- **`index.html`**: Ensure `<title>` is `MX PERFORMANCE`.
- **`supabase/config.toml`**: Ensure `project_id` is `mxperformance`.
- **Email Templates**: Update `from` addresses and footer text in Edge Functions.

### 4. Verification
- Run `npm run typecheck` to ensure no broken types.
- Run `npm run build` to verify the build process.
- Manually check `index.html` and `README.md`.

## Verification & Testing
- `git grep "MX Gestão"` (should return 0)
- `git grep "mxgestao"` (should return 0)
- Visual check of the production deploy.
