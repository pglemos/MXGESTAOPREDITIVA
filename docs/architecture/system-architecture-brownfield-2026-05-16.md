# System Architecture — MX Gestão Preditiva (Brownfield Discovery)

**Generated:** 2026-05-16
**Agent:** @architect (Aria)
**Phase:** 1/10 — Brownfield Discovery
**Note:** Documento de discovery brownfield. Coexiste com `system-architecture.md` (v2.0 ACTIVE) — este foca em débitos sistêmicos identificados na auditoria desta fase.

---

## 1. Executive Summary

O **MX Gestão Preditiva** (nome interno do `package.json`: `mx-performance`) é uma plataforma SPA operacional da MX Consultoria, voltada a gestão preditiva de varejo, visitas de consultoria, ranking de lojas, PDI, feedbacks e sincronização com Google Workspace (Calendar/Drive). É um PWA (com `selfDestroying: true` no SW para evitar builds stale em links públicos) construído como aplicação cliente single-page com backend serverless via Supabase Edge Functions.

A stack principal é **React 19 + Vite 6 + TypeScript 5.8 (strict)** no front-end, **Tailwind 4** para estilo (com lint customizado de tokens), **TanStack Query v5** para data layer, **Supabase** (Postgres + Auth + Edge Functions Deno) como backend, **Vercel** para deploy. O sistema integra Google OAuth/Calendar/Drive, WhatsApp (módulo `whatsapp-service` separado), Resend (email) e n8n (webhooks).

Estado geral: codebase ativo, branch `main` limpa, último commit `fix: harden role-based UX flows`. Cobertura de testes presente mas concentrada em libs/hooks (43 arquivos `.test.*`); E2E com Playwright; documentação rica (24 subpastas em `docs/`). Sinais de migração de Lovable (presença de páginas grandes monolíticas — `MXPerformanceLanding.tsx` com 1.698 linhas). 89 migrações Supabase ativas + 38 arquivadas em `migrations_legacy/` indicam evolução de schema significativa.

## 2. Stack Tecnológico

| Layer | Tech | Versão | Status |
|-------|------|--------|--------|
| Runtime Node | Node | >=20 <25 (engines) | OK |
| Package manager | Bun (bun.lock) + npm (package-lock.json) | bun 1.3.10 (types) | Atenção — dois locks coexistem |
| Framework UI | React | ^19.0.0 | Atual |
| Build | Vite | ^6.2.0 | Atual |
| Language | TypeScript | ~5.8.2 | Atual |
| Router | react-router-dom | ^7.13.1 | Atual (v7) |
| Estilo | Tailwind CSS | ^4.1.14 (via `@tailwindcss/vite`) | Atual (v4) |
| Data fetching | @tanstack/react-query | ^5.99.0 | Atual |
| Backend DB | Supabase (postgres driver `postgres@^3.4.8`) | client 2.102.1 | OK |
| Validação | zod | ^4.3.6 | Atual |
| Charts | recharts | ^3.7.0 | OK |
| Animação | motion | ^12.23.24 | OK |
| Ícones | lucide-react | ^0.575.0 | OK |
| Forms/notif | sonner | ^2.0.7 | OK |
| PDF/Export | jspdf 4, html2pdf.js 0.14, xlsx 0.18.5, exceljs 4.4 | mix | Stack PDF redundante |
| Test runner | bun test + @testing-library/react 16 + happy-dom 20 | — | OK |
| E2E | Playwright 1.59/1.58 | — | OK |
| Edge Functions | Deno (`supabase/functions`, `deno.lock`) | — | OK |
| PWA | vite-plugin-pwa + workbox-window | 1.2.0 / 7.4.0 | OK |
| Deploy | Vercel | 50.40.0 (CLI) | OK |
| Email | resend | ^6.10.0 | OK |
| Scheduler | node-cron | ^4.2.1 | OK |

## 3. Estrutura do Projeto

```
/
├── src/                        # SPA React
│   ├── App.tsx, main.tsx       # entrypoints
│   ├── pages/         (42)     # rotas top-level
│   ├── features/      (10)     # módulos de domínio (admin, agenda, auth, consultoria, equipe,
│   │                           #   feedback, lojas, pdi, ranking, configuracoes)
│   ├── components/             # atoms/molecules/organisms + admin + providers
│   ├── hooks/         (41)     # camada de domínio/state
│   ├── lib/                    # core: api, auth, supabase, calc, schemas, services, pdf, ui,
│   │                           #   automation, agenda, consultoria
│   ├── benchmarks/             # performance benchmarks
│   ├── test/                   # setup de testes
│   └── types/
├── supabase/
│   ├── migrations/    (89)     # SQL migrations ativas (timestamps 2024–2026)
│   ├── migrations_legacy/(38)  # arquivadas
│   ├── functions/     (15)     # Edge Functions Deno
│   ├── templates/, docs/, config.toml, seed_consulting.sql
├── api/                        # endpoints serverless (1: store-pre-registration)
├── scripts/           (44)     # operações ad-hoc: seeds, validações, sync, fix
├── docs/              (24)     # PRD, architecture, stories, qa, frontend-spec, audits etc.
├── e2e/                        # Playwright specs
├── testsprite_tests/  (62)     # tests gerados/integração externa
├── whatsapp-service/           # microserviço separado (Node), excluído de tsc
├── conductor/                  # diretório de orquestração
├── .aiox-core/, .claude/       # framework AIOX + rules
├── public/, dist/, output/, tmp/, .vercel/
├── vite.config.ts, tsconfig.json, vercel.json, package.json
```

**Aliases:** `@/*` → `src/*` (configurado em `tsconfig.json` e `vite.config.ts`).
**Total de arquivos TS/TSX em `src/`:** 284.

## 4. Dependências

### Production (chave)
| Pacote | Versão | Status |
|--------|--------|--------|
| react / react-dom | ^19.0.0 | Atual |
| react-router-dom | ^7.13.1 | Atual |
| @tanstack/react-query | ^5.99.0 | Atual |
| @tailwindcss/vite / tailwindcss | ^4.1.14 | Atual |
| @radix-ui/react-dialog | ^1.1.15 | OK (apenas 1 primitive Radix — atípico) |
| zod | ^4.3.6 | Atual |
| recharts | ^3.7.0 | Atual |
| motion | ^12.23.24 | Atual |
| postgres | ^3.4.8 | Driver direto além do Supabase client |
| html2pdf.js / jspdf / xlsx | mix | Ver SYS-002 |
| uuid | ^13.0.0 | Atual |

### Development (chave)
| Pacote | Versão | Status |
|--------|--------|--------|
| typescript | ~5.8.2 | Atual |
| vite | ^6.2.0 | Atual |
| @supabase/supabase-js | ^2.102.1 (em devDependencies!) | Ver SYS-005 |
| @types/node | ^25.3.1 | Bleeding-edge (Node 25 ainda não LTS) |
| @playwright/test / playwright | 1.58 / 1.59 | Versões dessincronizadas |
| happy-dom | ^20.8.9 | OK |
| bun-types | ^1.3.10 | OK |
| exceljs | ^4.4.0 | OK |
| vercel (CLI) | ^50.40.0 | OK |

### Atenção (desatualizadas / vulneráveis / inconsistentes)
- `@supabase/supabase-js` está em **devDependencies** mas é runtime-critical → bug latente em produção (SYS-005).
- Stack de PDF/Export sobreposta: `jspdf` + `html2pdf.js` + `xlsx` + `exceljs` coexistem (SYS-002).
- Apenas 1 primitive `@radix-ui` listado — `src/components/ui/` provavelmente depende de outros (deps fantasma) — [NÃO VERIFICADO em arquivos].
- `package-lock.json` (npm) **e** `bun.lock` **e** `deno.lock` coexistem → ambiguidade de install (SYS-001).
- `@types/node ^25` aponta para Node ainda não LTS, enquanto `engines.node` é `>=20 <25` — inconsistência (SYS-010).
- Versões dessincronizadas: `playwright 1.59` vs `@playwright/test 1.58` (SYS-011).

## 5. Pontos de Integração

| Integração | Onde | Notas |
|-----------|------|-------|
| **Supabase** | `src/lib/supabase.ts`, 89 migrações, 15 Edge Functions | Postgres + Auth + Storage + Edge (Deno) |
| **Google Calendar/Drive/OAuth** | Edge functions `google-oauth-handler`, `google-calendar-*`, `google-drive-files` | Tokens encriptados (`GOOGLE_TOKEN_ENCRYPTION_SECRET`) |
| **WhatsApp** | `whatsapp-service/` (microserviço Node separado, `.wwebjs_auth`) | Fora do build principal |
| **Email (Resend)** | `resend` + edge functions | `feedback-semanal`, `relatorio-matinal`, `relatorio-mensal`, `send-individual-feedback`, `send-visit-report` |
| **Vercel** | `vercel.json`, `.vercel/`, scripts `deploy` | Framework Vite, output `dist/` |
| **n8n** | `N8N_API_KEY`, `N8N_WEBHOOK_URL` | Webhooks de automação |
| **Sentry** | `SENTRY_DSN` env | [NÃO VERIFICADO se inicializado em runtime] |
| **AI providers** | DeepSeek, OpenRouter, Anthropic, OpenAI, EXA, Context7, ClickUp, GitHub, Railway, Vercel | `.env`; uso em scripts/automation [NÃO VERIFICADO em runtime do app] |
| **PWA / Service Worker** | `vite-plugin-pwa` com `selfDestroying: true` | Decisão deliberada (comentário em `vite.config.ts:12`) |
| **Postgres direto** | `postgres@3.4.8` | Driver pg-style além do Supabase client (provável para scripts/migrations) |

**Edge Functions (15):** `approve-store-registration`, `feedback-semanal`, `google-calendar-events`, `google-calendar-merged`, `google-calendar-sync`, `google-drive-files`, `google-oauth-handler`, `manage-store-team`, `register-user`, `relatorio-matinal`, `relatorio-mensal`, `send-individual-feedback`, `send-visit-report`, `store-pre-registration`, `_shared`.

## 6. Padrões de Código

- **Atomic Design** em `src/components/` (atoms/molecules/organisms) — parcialmente adotado: convive com `admin/` e `providers/` (SYS-006).
- **Feature-first** em `src/features/` (10 domínios) — organização forte por bounded context.
- **Hooks como camada de domínio** — 41 hooks centralizando React Query + lógica de negócio (`useConsultingClients`, `useFeedbacks`, `useDRE` etc.).
- **TypeScript strict** ativo (`strict`, `noImplicitAny`, `strictNullChecks`).
- **Lint customizado** (`scripts/lint-tokens.js`) para tokens Tailwind — design system enforcement.
- **Naming:** PascalCase para componentes/pages, camelCase para hooks/utils, kebab-case para migrations. Português nos nomes de domínio.
- **Manual chunking** explícito em Vite para vendor splits (react/utils/ui/charts/export/pdf/supabase).
- **Page-as-monolith** anti-pattern: vários pages > 800 LOC (SYS-003).
- **Imports absolutos** com alias `@/*` (alinhado à Constitution Article VI).

## 7. Configurações

- **Env vars** (nomes apenas, ~30 vars): AI keys (DeepSeek/OpenRouter/Anthropic/OpenAI/EXA/Context7), Supabase (server + `VITE_` prefix), Google OAuth/Calendar/Drive + encryption secret, E2E credenciais, GitHub/ClickUp/n8n/Sentry/Railway/Vercel tokens, `NODE_ENV`, `AIOX_VERSION`.
- **Build:** `vite build` → `dist/`, target esnext, esbuild minify, manual chunks, `chunkSizeWarningLimit: 1000`.
- **Deploy:** Vercel SPA com rewrite `/(.*) → /index.html`, cache-control no-store em `/pre-cadastro/*` e `/sw.js`.
- **PWA:** `selfDestroying: true` (SW antigo causava stale em links públicos). Workbox: supabase storage (CacheFirst 7d), images (SWR 30d), assets (SWR).
- **TS exclude:** `supabase/functions`, `whatsapp-service`, todos os `*.test.*` e `src/test/**` — testes fora do typecheck principal (SYS-007).
- **Husky:** presente (`.husky/`) — hooks de git ativos [NÃO VERIFICADO conteúdo].

## 8. Débitos Técnicos Identificados (Sistema)

| ID | Débito | Severidade | Categoria | Notas |
|----|--------|-----------|-----------|-------|
| SYS-001 | Três lockfiles coexistindo (`package-lock.json`, `bun.lock`, `deno.lock`) | Alta | dependencies | `deno.lock` é legítimo (edge functions); npm+bun gera ambiguidade. `bunfig.toml` sugere bun como canônico |
| SYS-002 | Stack de documentos redundante: `jspdf` + `html2pdf.js` + `xlsx` + `exceljs` | Média | dependencies | Cada vendor chunk em `vite.config.ts` confirma uso. Consolidar |
| SYS-003 | Pages monolíticas: `MXPerformanceLanding.tsx` (1.698 LOC), `DashboardLoja.tsx` (1.409), `AgendaAdmin.tsx` (1.318), `ConsultoriaClienteDetalhe.tsx` (953), `Ranking.tsx` (854), `GerenteFeedback.tsx` (809) | Alta | coupling | Decompor em features/hooks/componentes. Sinal de origem Lovable/v0 |
| SYS-004 | Hook `useAgendaAdmin.ts` (895 LOC) e `lib/consultoria/pmr-engine.ts` (842 LOC) excedem limite saudável | Média | coupling | God-objects de lógica |
| SYS-005 | `@supabase/supabase-js` em **devDependencies** sendo runtime-critical | **Crítica** | config | Mover para `dependencies`. Risco real em deploy sem dev deps |
| SYS-006 | Atomic Design parcial: `src/components/` mistura `atoms/molecules/organisms` com `admin/` e `providers/` | Baixa | patterns | Padronizar ou documentar exceções |
| SYS-007 | Testes excluídos do `tsc --noEmit` principal | Média | tests | Type errors silenciosos em testes. Adicionar `tsconfig.test.json` |
| SYS-008 | 89 migrations + 38 legacy sem schema consolidado em `docs/architecture/` | Média | docs | FASE 2 cobrirá; hoje não há SoT |
| SYS-009 | 62 arquivos `testsprite_tests/` paralelos a `e2e/` (Playwright nativo) | Baixa | tests | Possível duplicação de cobertura E2E |
| SYS-010 | `@types/node ^25.3.1` aponta para versão Node ainda não LTS; `engines.node` é `>=20 <25` | Baixa | dependencies | Inconsistência: `<25` exclui v25 mas `@types/node` é v25 |
| SYS-011 | Playwright dessincronizado: runtime `1.59.1` vs `@playwright/test 1.58.2` | Baixa | dependencies | Alinhar |
| SYS-012 | `.env` no working tree (modo `-rw-------`) | **Crítica** (a confirmar) | config | Verificar se está em `.gitignore` e nunca foi commitado. Se commitado, rotacionar TODAS as keys |
| SYS-013 | 1 único primitive `@radix-ui/react-dialog` listado; `src/components/ui/` provavelmente usa mais | Média | dependencies | Auditar deps fantasma |
| SYS-014 | `whatsapp-service/` no monorepo sem workspace declarado | Média | structure | Considerar bun/npm workspaces ou extrair |
| SYS-015 | `scratch/`, `tmp/`, `output/`, `node-compile-cache/` no working tree | Baixa | structure | Verificar `.gitignore` |
| SYS-016 | Coexistem `docs/architecture.md` (arquivo), `docs/brownfield-architecture.md` e `docs/architecture/` (pasta) | Baixa | docs | Risco de confusão |
| SYS-017 | `SENTRY_DSN` em env mas inicialização não confirmada no código | Média | observability | Auditar setup de error tracking [NÃO VERIFICADO] |

**Resumo de severidade:** 2 Crítica · 2 Alta · 8 Média · 5 Baixa = **17 débitos sistêmicos**.

## 9. Perguntas para Especialistas

### Para @data-engineer (FASE 2):
1. Existe schema canônico consolidado das 89+38 migrações? Há `types/database.types.ts` gerado via `supabase gen types`?
2. RLS está implementado em todas as tabelas multi-tenant (lojas, consultoria)? Há policies auditadas?
3. As 15 Edge Functions usam `SUPABASE_SERVICE_ROLE_KEY` com segurança? Bypass de RLS controlado?
4. Driver `postgres@3.4.8` em paralelo ao Supabase client — quais módulos o consomem e por quê?
5. Há índices alinhados com `useDRE`, `useRanking`, `useConsultingMetrics`, `pmr-engine.ts`?
6. Quais RPCs existem (vide `submit_checkin_rpc`, `auth_self_service_rpcs`, `admin_store_lifecycle_rpcs`) e qual a superfície de ataque?
7. Soft-delete padronizado (vide `vinculos_loja_soft_close`)?

### Para @ux-design-expert (FASE 3):
1. Atomic Design em `src/components/` é SoT ou há componentes ad-hoc nas pages monolíticas?
2. Como o `lint-tokens.js` opera — quais tokens Tailwind 4 são proibidos hardcoded?
3. PWA `selfDestroying: true` impacta UX offline. Estratégia é online-only?
4. Há design system documentado em `docs/design-system/`? Mapeamento Tailwind 4 + Radix completo?
5. Estratégia UX-aware para decompor pages monolíticas (1.698 LOC em `MXPerformanceLanding`)?
6. `motion` (Framer Motion v12) — padrão consistente ou uso ad-hoc?
7. Acessibilidade: custom components em `atoms/molecules/organisms` seguem WAI-ARIA?

## 10. Próximas Fases

- **FASE 2 — @data-engineer (Dara):** DB audit → `docs/architecture/SCHEMA.md` + `docs/architecture/DB-AUDIT.md`. Foco: migrações, RLS, RPCs, Edge Functions, types gerados.
- **FASE 3 — @ux-design-expert (Uma):** Frontend spec → `docs/architecture/frontend-spec.md`. Foco: Atomic Design real, design tokens, decomposição de pages monolíticas.
- **FASE 4 — @architect:** Consolidar débitos em `technical-debt-DRAFT.md`.
- **FASES 5–10:** Reviews cruzados, QA gate, finalização e geração de epic + stories.
