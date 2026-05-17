# Technical Debt Assessment — FINAL

**Projeto:** MX Gestão Preditiva
**Data:** 2026-05-16 (refinado 2026-05-17)
**Status:** APPROVED CONDICIONAL (gate QA — Sprint 0 obrigatória)
**Versão:** 3.1 (refinamentos pós-verificação estática)
**Phase:** 8/10 — Brownfield Discovery
**Consolidador:** @architect (Aria) + refinamentos @aiox-master (Orion)
**Inputs:** DRAFT @architect (FASE 4) · review @data-engineer (FASE 5) · review @ux-design-expert (FASE 6) · gate @qa (FASE 7) · 4 verificações estáticas pós-discovery

> **Changelog v3.1 (2026-05-17):**
> - SYS-012 ✅ resolvido (falso positivo — `.env` nunca commitado; ver `docs/reviews/sprint-1-quick-verifications.md`)
> - SYS-005 severidade Crítica → Média (Vite bundla via `vendor-supabase`)
> - DB-016 severidade Crítica → Alta (escopo NARROW — bypass business rules, não data breach; ver `docs/reviews/db016-vector-analysis.md`)
> - DB-028 🆕 adicionado (inconsistência policy ↔ RPC; ver `docs/reviews/submit-checkin-rpc-audit.md`)
> - Story 0.8 ✅ pré-executada — inventário em `docs/reviews/lancamentos-diarios-consumers-inventory.md`
> - Story 1.2 esforço 20h → 26h (13 consumers vs 3 estimados; +33% SELECTs)

---

## 0. Executive Summary

- **Total de débitos consolidados:** **73** (Sistema 17 · DB 27 · UX 28 · GAPs/Process 10 — GAP-01..GAP-10 promovidos a débitos rastreáveis nas seções P-### e CI-###).
- **Riscos cruzados:** **14** (X-1..X-14). X-8 promovido de Alta a **CRÍTICA** (mandato QA §10.1).
- **Distribuição final por severidade:**
  - **Críticos:** 11 (SYS: 2 · DB: 5 · UX: 4) — DB-008 e DB-018 elevadas; UX-010 e UX-016 elevadas.
  - **Altos:** 24 (SYS: 2 · DB: 9 · UX: 9 · GAP/Process: 4)
  - **Médios:** 27 (SYS: 8 · DB: 8 · UX: 7 · GAP/Process: 4)
  - **Baixos:** 11 (SYS: 5 · DB: 3 · UX: 3 · GAP/Process: 0)
- **Esforço total estimado:** **~830 h** (range 760-960 h, ~13-17 semanas com 3-4 devs).
  - Sprint 0 (bloqueante): 54 h
  - DB: ~95-100 h
  - UX: ~520 h (mid; range 440-720 h, exclui UX-011 i18n P3)
  - GAPs/Process: ~80 h
  - Testes baseline (T-01..T-12): ~80 h (parcial em Sprint 0)
- **Recomendação:** **Sprint 0** (hardening obrigatório) → **Sprint 1** (P0 segurança+tipos) → **Sprint 2** (P1 governança+a11y) → **Sprint 3** (P2 perf+LGPD+decomposição) → **Backlog P3** (i18n, PWA real).
- **Tema dominante:** origem **Lovable/v0.dev** + crescimento orgânico de schema (89 ativas + 38 legacy, rename EN→PT-BR parcial) + **defense-in-depth fraca** (RBAC client robusto, server `USING(true)`) + tooling de tipos não automatizado + observabilidade quase nula.
- **Risco se não agir:**
  1. **DB-016 (vetor confirmado):** qualquer JWT `authenticated` pode `POST /rest/v1/lancamentos_diarios` bypassando todas validações do `submit_checkin` — inflar ranking/comissões, dados falsos sem trilha.
  2. **DB-013 (PII viva):** backups `migration_backup_*_20260503` sem RLS, expostos desde 2026-05-03 — LGPD Art. 46 (ANPD até 2% faturamento).
  3. **X-1 + X-8:** drift silencioso de tipos sem observabilidade = postmortem cego, regressões invisíveis até clientes reclamarem.

---

## 1. Sprint 0 — Gates Bloqueantes (CONDICIONAL APPROVAL)

**Mandato QA (gate FASE 7 §1).** Pré-requisito absoluto para qualquer Sprint 1. Sem itens 0.1-0.10 verdes, P0 técnico não toca produção.

| # | Item | Owner | Esforço (h) | Critério de Aceite |
|---|------|-------|------------|--------------------|
| 0.1 | Confirmar `.env` no histórico git (SYS-012). Se commitado: rotacionar `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_URL`, `GOOGLE_*`, `RESEND_API_KEY`, `SENTRY_DSN` | @devops | 4 | `git log --all -p -- .env` limpo OU `docs/security/rotation-log.md` com evidência |
| 0.2 | Inicializar Sentry no entrypoint (`src/main.tsx`) com release tag + source maps no build (SYS-017) | @dev | 3 | Erro deliberado em staging chega no Sentry com stack trace de-minificado |
| 0.3 | Pipeline `supabase gen types typescript --linked` em CI + diff gate contra `src/types/database.generated.ts` (DB-014 / UX-004) | @devops + @dev | 4 | PR que altera schema sem rerun gera falha de check |
| 0.4 | Baseline RLS regression suite: 8 tabelas críticas × 5 roles = 40 cenários (160 assertions) | @qa + @dev | 12 | Suite verde em `main`; cenário negativo para DB-016 (POST direto → 403 após fix) |
| 0.5 | Baseline visual Playwright: 6 pages monolíticas + 4 charts (lista §12.B) | @qa + @ux | 8 | Snapshots em `tests/visual/__snapshots__/`; pipeline anexa diff artifact em PR |
| 0.6 | Baseline performance: p95 `submit_checkin`, `compute_dre`, login flow, dashboard initial load | @qa | 6 | Métricas em `docs/perf/baseline-2026-05-16.json`; threshold CI ±20% |
| 0.7 | Habilitar `pg_stat_statements` (DB-021) — pré-req real para DB-018 não ser chute | @data-engineer | 1 | Extension instalada; query top-20 documentada |
| 0.8 | Auditoria de consumers de `lancamentos_diarios`: scripts + automation + edge functions + **27 client SELECTs** confirmados (pré-req DB-016) | @data-engineer + @dev | 6 | Inventário em `docs/security/lancamentos-diarios-consumers.md` + plano migração para RPCs |
| 0.9 | Feature flag infra: tabela `feature_flags` + helper `is_feature_enabled(key, user_id)` (canary DB-016) | @data-engineer | 6 | Flag `enforce_lancamentos_rls` togglable; suporte rollout 1% → 10% → 100% |
| 0.10 | ADR de rollback: migrations reversíveis para DB-016, DB-006, DB-013, DB-017 (UP + DOWN) | @architect | 4 | Cada migration crítica com `-- DOWN` validado em branch ephemeral |

**Total Sprint 0: ~54 h (~1.5 sprint paralelo: devops + qa + dev + data).**

---

## 2. Inventário Consolidado de Débitos

### 2.1 Sistema (FASE 1, validado por @architect; 17 débitos)

| ID | Débito | Severidade | Categoria | Esforço (h) | Prioridade | Owner |
|----|--------|-----------|-----------|-------------|------------|-------|
| SYS-001 | Três lockfiles (`package-lock.json`, `bun.lock`, `deno.lock`) | Alta | dependencies | 2 | P1 | @devops |
| SYS-002 | Stack documentos redundante (`jspdf`+`html2pdf.js`+`xlsx`+`exceljs`) | Média | dependencies | 4 | P2 | @dev |
| SYS-003 | Pages monolíticas (15 ≥500 LOC, top 6 ≥809 LOC) | Alta | coupling | (= UX-001, 100) | P2 | @dev + @ux |
| SYS-004 | God-hooks (10 ≥300 LOC, top `useAgendaAdmin` 895 LOC) | Média | coupling | (= UX-002, 75) | P2 | @dev |
| SYS-005 | `@supabase/supabase-js` em **devDependencies** sendo runtime-critical | ~~**Crítica**~~ → **Média** (verificado 2026-05-17: Vite bundla via `vendor-supabase`; risco apenas server-side) | config | 0.5 | P1 | @devops |
| SYS-006 | Atomic Design parcial: `components/` mistura `atoms/molecules/organisms` com `admin/`, `providers/` | Baixa | patterns | 4 | P3 | @ux |
| SYS-007 | Testes excluídos do `tsc --noEmit` principal | Média | tests | 2 | P1 | @dev |
| SYS-008 | 89 migrations + 38 legacy sem schema consolidado em `docs/architecture/` | Média | docs | 4 | P2 | @data-engineer |
| SYS-009 | 62 arquivos `testsprite_tests/` paralelos a `e2e/` (Playwright) — duplicação | Baixa | tests | (= QA-001, 8) | P3 | @qa |
| SYS-010 | `@types/node ^25.3.1` vs `engines.node >=20 <25` | Baixa | dependencies | 1 | P3 | @devops |
| SYS-011 | Playwright dessincronizado (runtime 1.59.1 vs `@playwright/test` 1.58.2) | Baixa | dependencies | 1 | P3 | @devops |
| SYS-012 | ~~`.env` no working tree~~ — **VERIFICADO 2026-05-17: nunca commitado, gitignore cobre, edge functions + scripts sem secrets hardcoded** | ~~**Crítica**~~ → ✅ **Resolvido** (falso positivo) | config | ~~4~~ 1 (residual: gitleaks + key custody doc) | ~~P0~~ P2 | @devops |
| SYS-013 | 1 único primitive `@radix-ui/react-dialog` listado — auditar deps fantasma | Média | dependencies | 4 | P2 | @ux |
| SYS-014 | `whatsapp-service/` no monorepo sem workspace declarado | Média | structure | 6 | P2 | @devops |
| SYS-015 | `scratch/`, `tmp/`, `output/`, `node-compile-cache/` no working tree | Baixa | structure | 1 | P3 | @devops |
| SYS-016 | Coexistem `docs/architecture.md`, `docs/brownfield-architecture.md` e `docs/architecture/` pasta | Baixa | docs | 2 | P3 | @architect |
| SYS-017 | `SENTRY_DSN` em env mas init não confirmado no código | Média→**Alta** (X-8) | observability | 3 (Sprint 0 item 0.2) | P0 | @dev |

**Subtotal SYS:** 2 Crítica · 2 Alta (após X-8) · 7 Média · 6 Baixa = 17 débitos.

### 2.2 Database (FASE 2 + revisão @data-engineer FASE 5; 27 débitos, severidades ajustadas)

| ID | Débito | Severidade | Categoria | Esforço (h) | Prioridade | Owner |
|----|--------|-----------|-----------|-------------|------------|-------|
| DB-001 | `submit_checkin` não valida `vendedores_loja.is_active` | Crítica | rpc | 1 | P0 | @data-engineer |
| DB-002 | `EXCEPTION WHEN others ... SQLERRM` em todas RPCs novas vaza interna | Crítica | rpc/security | 3 | P0 | @data-engineer |
| DB-003 | `update_my_profile` aceita `phone/avatar_url` sem validar formato | Média | rpc/validation | 1 | P2 | @data-engineer |
| DB-004 | `complete_password_change` confia que client trocou senha antes | Baixa | rpc/doc | 0.5 | P3 | @data-engineer |
| DB-005 | Falta UNIQUE constraint em `lojas.cnpj` | Alta | constraint | 1 | P1 | @data-engineer |
| DB-006 | Coexistência de helpers EN (`is_admin`, `is_member_of`) e PT-BR (`eh_administrador_mx`, `tem_papel_loja`) | Alta | refactor | 12 | P0 (parcial) → P1 (drop) | @data-engineer |
| DB-007 | `admin_create_store` aceita `manager_email` sem validar formato | Média | rpc/validation | 0.5 | P2 | @data-engineer |
| DB-008 | `store-pre-registration` público sem rate limit/captcha | Alta→**Crítica** | edge/security | 6 | P1 | @data-engineer + @devops |
| DB-009 | CORS `Allow-Origin: *` em todas edge functions | Média | edge/cors | 1 | P1 | @data-engineer |
| DB-010 | Confirmar validação `state` PKCE no `google-oauth-handler` em todos paths | Baixa | edge/oauth | 1 | P3 | @data-engineer |
| DB-011 | `compute_dre` overloaded em 2 nomes (rename incompleto) | Alta | refactor/migration | 3 | P1 | @data-engineer |
| DB-012 | Sem tabela de consentimento LGPD nem rotina de right-to-erasure | Média→**Alta** | compliance | 24 | P2 (epic LGPD) | @data-engineer + @pm |
| DB-013 | Tabelas `migration_backup_*_20260503` SEM RLS contendo PII viva | Crítica | rls/cleanup | 2 | P0 | @data-engineer |
| DB-014 | Ausência confirmada de `database.types.ts` gerado por Supabase CLI | Alta | tooling | 2 (Sprint 0 item 0.3) | P0 (desbloqueio) | @data-engineer + @devops |
| DB-015 | 21 FKs sem `ON DELETE` explícito (default RESTRICT) | Média | data-integrity | 5 | P2 | @data-engineer |
| DB-016 | `lancamentos_diarios` aceita writes direct-POST sem REVOKE — vetor **confirmado mas escopo NARROW** (verificação 2026-05-17): bypass gate 09:45 + backdate dentro janela ativa; **NÃO** permite cross-tenant leak nem impersonation (policy `pode_lancar_checkin` cobre essas) | ~~Crítica~~ → **Alta** | rls / business rule | 4 | P0 (canary após Sprint 0) | @data-engineer + @dev |
| DB-017 | 12 RPCs `SECURITY DEFINER` SEM `SET search_path` (CVE-2018-1058) | Alta | security | 4 | P0 | @data-engineer |
| DB-018 | Indexes faltantes IDX-001..IDX-006 (vide SCHEMA.md §4) | Baixa→**Média** | performance | 4 | P2 (após DB-021) | @data-engineer |
| DB-019 | `role_assignments_audit` e `store_meta_rules_history` sem RLS | Baixa→**Alta** | rls | 2 | P0 | @data-engineer |
| DB-020 | Sem estratégia documentada de backup/RTO/RPO + drill | Alta | backup/dr | 6 | P2 | @data-engineer + @devops |
| DB-021 | `pg_stat_statements` não habilitado | Média | observability | 1 (Sprint 0 item 0.7) | P0 | @data-engineer |
| DB-022 | `pgaudit` não instalado | Média | security/compliance | 2 | P2 (epic LGPD) | @data-engineer |
| DB-023 | Connection pooling (Supavisor) não validado/documentado | Alta | performance/config | 4 | P2 | @data-engineer + @devops |
| DB-024 | Auto-vacuum/analyze sem tuning para hot tables | Média | performance | 3 | P2 | @data-engineer |
| DB-025 | Supabase Advisors (security + performance) não rodados | Baixa | tooling | 1 | P3 | @data-engineer |
| DB-026 | Scripts admin com `postgres@3.4.8` usando `POSTGRES_URL` superuser direto | Alta | security/scripts | 8 | P1 | @data-engineer + @devops |
| DB-027 | Trigger `check_orphan_users_after_membership_deletion` sem clareza anonimização vs hard-delete (LGPD Art. 16) | Média | compliance | 4 | P2 (epic LGPD) | @data-engineer |
| DB-028 🆕 | **Inconsistência policy ↔ RPC** — mesma regra "pode lançar checkin" em DOIS lugares com critérios divergentes: policy via `pode_lancar_checkin()` valida `vendedores_loja.is_active`; RPC `submit_checkin` valida só `vinculos_loja.is_active`. RPC é MAIS PERMISSIVO; policy é MAIS RÍGIDA em alguns checks (verificação 2026-05-17) | **Alta** | architecture / consistency | 4-6 | P1 (Sprint 1 ou início Sprint 2) | @data-engineer + @architect |

**Subtotal DB:** 5 Crítica · 10 Alta · 8 Média · 3 Baixa = 28 débitos · ~99-106 h. Ordem técnica revisada: DB-014 → DB-006 parcial → DB-019 → DB-013 → DB-002 → DB-001 → DB-028 (centralizar validação) → DB-016 (canary) → DB-017.

### 2.3 Frontend/UX (FASE 3 + revisão @ux-design-expert FASE 6; 28 débitos)

| ID | Débito | Severidade | Categoria | Esforço (h) | Impacto UX | Prioridade | Owner |
|----|--------|-----------|-----------|-------------|-----------|------------|-------|
| UX-001 | Pages monolíticas (15 ≥500 LOC) | Crítica | components | 100 | Manutenibilidade | P2 (6 stories, ordem §7.2) | @ux + @dev |
| UX-002 | God-hooks (10 ≥300 LOC) | Crítica | state | 75 | Re-renders, testabilidade | P2 (paralelo UX-001) | @dev |
| UX-003 | `MXPerformanceLanding` 1698 LOC CSS inline (origem Lovable) | Crítica | components/DS | 32 | Drift visual | P2 (piloto decomp.) | @ux |
| UX-004 | `database.types.ts` ausente; tipos PT-BR manuais (610 LOC) | Crítica | state | 12 gen + 24 migrate | Erros runtime após renames | P0 (Sprint 0 item 0.3) | @dev |
| UX-005 | Charts recharts hex hardcoded em `ConsultoriaClienteDetalhe.tsx:170-179` | Alta | design-system | 6 | Drift visual, dark mode | P2 (combo UX-021) | @ux |
| UX-006 | `lint-tokens.js` whitelist desconectada do `@theme` real | Alta | design-system | 8 | Drift silencioso CSS↔linter | P1 (AST-driven destrava DS) | @ux + @dev |
| UX-007 | a11y: imgs sem alt, contraste `text-tertiary`, charts sem aria, tabelas raw sem `<th scope>` | Alta | a11y | 32 | Reprovação WCAG AA | P1 | @ux |
| UX-008 | Skeleton coverage 16.6% (7/42 pages) | Alta | state | 40 | CLS, percepção lentidão | P2 (combo UX-017, UX-028) | @ux |
| UX-009 | Sem `react-hook-form` → 30+ forms manuais | Alta | forms | 50 | UX inconsistente | P2 (greenfield-first §7.4) | @dev + @ux |
| UX-010 | Realtime subs em pages monolíticas sem garantia de cleanup | Alta→**Crítica** | state | 24 | Memory leaks, double-fires | P1 | @dev |
| UX-011 | Sem i18n (PT-BR hardcoded; 0 `useTranslation`) | Média | i18n | 80 | Bloqueio expansão | P3 (aguarda produto) | @ux |
| UX-012 | `TabNav` + `TabNavPill` duplicados | Média | components | 4 | DS coerência | P2 (quick-win) | @ux |
| UX-013 | Atomic Design + Features coexistem sem ADR | Média | architecture | 8 | Drift latente | P3 | @architect + @ux |
| UX-014 | `selfDestroying` PWA anula offline | Média | perf | 16 | Sem offline real | P3 (decisão produto) | @ux + @pm |
| UX-015 | `eslint.config.js` sem `jsx-a11y` / `react-hooks` confirmado | Média | a11y/quality | 4 | Regressões a11y | P1 (quick-win) | @dev |
| UX-016 | `<RoleSwitch>` decide UI mas hooks podem disparar queries antes | Média→**Alta** | security/state | 12 | Vazamento dados RBAC | P0 (cross DB-016) | @dev |
| UX-017 | Suspense fallback único `<Spinner />` para 37 lazy routes | Média | perf | 8 | Layout shift | P2 (combo UX-008) | @ux |
| UX-018 | `Textarea`, `Button` size xs com arbitrary values | Baixa | design-system | 2 | Inconsistência | P3 (quick-win) | @ux |
| UX-019 | Google Fonts via CDN sem fallback local + sem SRI (cross GAP-04) | Baixa | perf/security | 4 | FOIT + XSS surface | P3 | @ux + @devops |
| UX-020 | `chunkSizeWarningLimit: 1000` mascara bundles inchados | Baixa | perf | 1 | Falha visibilidade | P1 (quick-win) | @dev |
| UX-021 | Dark mode strategy ausente (sem `dark:` variants, sem tokens semânticos) | Média | design-system | 24 | Bloqueia feature comum | P3 | @ux |
| UX-022 | Motion preferences além de `MotionConfig` (animações Tailwind sem `motion-reduce:`) | Média | a11y | 6 | a11y vestibular | P1 (Sprint 0 piloto) | @ux |
| UX-023 | ADR de provider i18n (i18next vs LinguiJS vs Format.js) | Média | i18n | 8 | Pré-req UX-011 | P3 | @architect + @ux |
| UX-024 | Focus trap em modais/drawers (Radix Dialog não em uso; modais custom sem trap) | Alta | a11y | 8 | WCAG 2.1.2 crítico | P1 (combo UX-007) | @ux + @dev |
| UX-025 | Error boundaries ausentes por rota | Alta | resilience | 12 | UX em produção | P2 (durante UX-001) | @dev |
| UX-026 | Web Vitals não monitorados (sem `reportWebVitals`, sem RUM) | Média | perf/observability | 6 | Sem visibilidade perf real | P1 (combo SYS-017) | @dev |
| UX-027 | Bundle analyzer não rodado (`rollup-plugin-visualizer` ausente) | Média | perf | 2 | Otimização cega | P1 (quick-win + UX-020) | @dev |
| UX-028 | Skeleton screens detalhados (specs fidelidade por feature) | Baixa | design-system | 16 | Polish | P2 (combo UX-008) | @ux |

**Subtotal UX:** 4 Crítica · 9 Alta · 7 Média · 3 Baixa (UX-018, UX-019, UX-028 baixas) = 28 débitos · ~520 h mid.

### 2.4 GAPs (FASE 7 @qa — promovidos a débitos formais; 10 itens)

| ID | Débito | Severidade | Categoria | Esforço (h) | Prioridade | Owner |
|----|--------|-----------|-----------|-------------|------------|-------|
| CI-001 (ex GAP-01) | CI/CD debt: branch protection, required checks, gitleaks, SBOM, Renovate/Dependabot, signing, staging gate | **Alta** | ci/cd | 16 | P0 (Sprint 0 estendido) | @devops |
| DR-001 (ex GAP-02) | DR runbook + drill semestral + backup configs Supabase (RLS export, edge functions, secrets) | **Alta** | backup/dr | 12 | P2 (epic Foundation) | @data-engineer + @devops |
| SEC-001 (ex GAP-03) | Threat model formal (STRIDE/PASTA) — ADR | Média | security | 6 | P3 | @architect + @qa |
| SEC-002 (ex GAP-04) | Security headers: CSP, HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy, SRI Google Fonts | **Alta** | security | 8 | P1 | @devops + @dev |
| QA-001 (ex GAP-05) | Test infrastructure: consolidar `testsprite_tests/` vs `e2e/`, MSW handlers Supabase, fixture factories, contract tests, mutation testing, flake quarantine | **Alta** | tests | 24 | P0 (parcial em Sprint 0) | @qa + @dev |
| DX-001 (ex GAP-06) | Onboarding/DX: README "subir local <30min", devcontainer/docker-compose, seeds, scripts `db:reset/qa:rls/qa:visual` | Média | dx | 8 | P3 | @architect + @devops |
| ADR-001 (ex GAP-07) | Backfill 5-7 ADRs históricos (Vite vs Next, Supabase, RLS strategy, Atomic Design) | Baixa→Média | docs | 6 | P3 | @architect |
| UX-029 (ex GAP-08) | UI privacidade LGPD (banner cookies, central privacidade, opt-out telemetria, exportar meus dados, revogar consentimento) | Média | compliance/ux | 16 | P2 (epic LGPD) | @ux + @pm |
| UX-030 (ex GAP-09) | Observabilidade FE: correlation ID propagado FE→edge→RPC→trigger, Sentry Replay, structured logs, business metrics | Média | observability | 12 | P1 (combo SYS-017 + UX-026) | @dev + @devops |
| QA-002 (ex GAP-10) | Mobile/responsive testing matrix (3 viewports × 4 rotas críticas em CI) | Média | tests | 8 | P2 | @qa + @ux |

**Subtotal GAPs:** 0 Crítica · 4 Alta · 4 Média · 1 Baixa-Média · 1 Baixa = 10 débitos · ~116 h (inclui 24 h QA-001 que rebate em Sprint 0 itens 0.4-0.5).

**TOTAL GERAL: 17 SYS + 27 DB + 28 UX + 10 GAPs = 73 débitos.**

---

## 3. Matriz de Priorização Final

Critérios consolidados (mandato QA §10.1 Recomendação 3): **Severidade × Risco operacional × Desbloqueio × Esforço**.
Reordenação chave: **DB-014 sobe acima de SYS-005** porque destrava 58 arquivos vs trivial 0.5 h.

| Rank | ID | Débito | Sev | Esforço | Sprint | Notas |
|------|----|--------|-----|---------|--------|-------|
| 1 | DB-014 | gen `database.types.ts` + CI gate | Crítica | 2 + 4 | 0 | Pré-req cego para 58 arquivos e DB-006/DB-011/DB-016 |
| 2 | SYS-012 | `.env` confirmar/rotacionar | Crítica | 4 | 0 (0.1) | Treat as compromised |
| 3 | SYS-017 | Sentry init + source maps | Alta→Crítica (X-8) | 3 | 0 (0.2) | Sem postmortem possível |
| 4 | CI-001 | Branch protection + gitleaks + checks | Alta | 16 | 0 | Sem gates, todo Sprint 1 é teatro |
| 5 | DB-021 | `pg_stat_statements` | Média | 1 | 0 (0.7) | DB-018 sem dados é chute |
| 6 | DB-013 | DROP backups PII (export antes) | Crítica | 2 | 1 | LGPD; 24 h export hold |
| 7 | DB-019 | RLS em `role_assignments_audit`, `store_meta_rules_history` | Alta | 2 | 1 | Direto após T-03 verde |
| 8 | DB-002 | Wrap SQLERRM + log em `logs_auditoria` | Crítica | 3 | 1 | Pré-req DB-008 |
| 9 | DB-001 | `submit_checkin` valida `vendedores_loja.is_active` | Crítica | 1 | 1 | Feature flag `strict_seller_validation` |
| 10 | DB-006 parcial | Helpers PT-BR estáveis (EN coexistem) | Alta | 4 | 1 | Pré-req DB-016 repolicy |
| 11 | DB-016 | REVOKE + repolicy `lancamentos_diarios` + canary | Crítica | 4 | 1 (canary 7d) | Fatiado em 4 stories (§7.1) |
| 12 | DB-017 | `SET search_path` nas 12 RPCs SECURITY DEFINER | Alta | 4 | 1 | Direto após T-01 |
| 13 | UX-004 | gen types blast radius 58 arquivos | Crítica | 12 + 24 | 1 | Plano §4.4 do UX-spec |
| 14 | UX-016 | `<RoleSwitch>` + hooks pré-mount | Alta | 12 | 1 | Cross DB-016 |
| 15 | UX-010 | Realtime subs cleanup centralizado | Crítica | 24 | 1 | Memory leak X-4 |
| 16 | SYS-005 | `@supabase/supabase-js` → dependencies | Crítica | 0.5 | 1 | Trivial mas crítico |
| 17 | UX-020 + UX-027 | chunkSizeWarningLimit + bundle analyzer | Baixa+Média | 3 | 1 | Quick-win combo |
| 18 | UX-015 | eslint jsx-a11y + react-hooks | Média | 4 | 1 | Gate regressão |
| 19 | UX-006 | lint-tokens AST-driven | Alta | 8 | 1 | Destrava DS |
| 20 | UX-012 | unificar TabNav | Média | 4 | 1 | Quick-win |
| 21 | DB-008 | Rate limit + reCAPTCHA `store-pre-registration` | Crítica | 6 | 2 | Pré-req DB-002 |
| 22 | DB-026 | Migrar scripts `postgres@` para Edge Function admin | Alta | 8 | 2 | Cross SYS-005/X-3 |
| 23 | DB-006 final | DROP helpers EN + refactor remanescente | Alta | 8 | 2 | Após DB-016 estabilizado |
| 24 | DB-011 | Resolver overload `compute_dre` com flag | Alta | 3 | 2 | Grace period |
| 25 | SEC-002 | Security headers (CSP/HSTS/SRI) | Alta | 8 | 2 | CSP report-only primeiro |
| 26 | UX-007 + UX-024 | a11y WCAG AA + focus traps | Alta | 32 + 8 | 2 | Combo a11y |
| 27 | UX-022 | motion-reduce audit | Média | 6 | 1-2 | a11y vestibular |
| 28 | UX-026 + UX-030 | Web Vitals + correlation ID FE | Média | 6 + 12 | 1-2 | Combo SYS-017 |

(Top 28 listados; ranks 29-73 seguem o sequenciamento de §4 — Sprint 2 e 3.)

---

## 4. Plano de Resolução por Sprint

### Sprint 0 — Hardening Foundation (CONDICIONAL, ~54 h + 16 h CI-001 = ~70 h)

Detalhes em §1. Aceite verificável antes de qualquer Sprint 1.

### Sprint 1 — P0 Crítico (~120 h)

**Objetivo:** fechar vetor DB-016, eliminar drift de tipos, ativar gates de qualidade.

1. **DB-013** (2 h) — Export → 24h hold → DROP backups PII.
2. **DB-019** (2 h) — RLS em audit tables.
3. **DB-002** (3 h) — Wrap SQLERRM em todas RPCs.
4. **DB-001** (1 h) — Validar `vendedores_loja.is_active` no `submit_checkin` (feature flag `strict_seller_validation`).
5. **DB-006 parcial** (4 h) — Helpers PT-BR estáveis.
6. **UX-004** (12 + 24 h) — gen types em arquivo separado + migrar 58 arquivos feature-by-feature.
7. **DB-016** Story A (6 h) — Inventário (do item 0.8) + criar RPCs `get_lancamentos_for_seller/store_summary/network`.
8. **DB-016** Story B (8 h) — Migrar 27 client SELECTs para RPCs (flag desligada).
9. **DB-016** Story C (4 h) — REVOKE + repolicy em staging.
10. **DB-016** Story D (4 h + 7d janela) — Canary produção 1% → 10% → 25% → 100%.
11. **DB-017** (4 h) — `SET search_path` nas 12 RPCs.
12. **UX-016** (12 h) — Auditar hooks pré-mount + bloquear queries pré-role.
13. **UX-010** (24 h) — Centralizar realtime subs em hooks dedicados (cleanup garantido).
14. **SYS-005** (0.5 h) — Mover `@supabase/supabase-js` para `dependencies`.
15. **UX-020 + UX-027** (3 h) — chunkSizeWarningLimit 500 kb + bundle analyzer.
16. **UX-015** (4 h) — eslint jsx-a11y + react-hooks.
17. **UX-006** (8 h) — lint-tokens AST-driven.
18. **UX-012** (4 h) — unificar TabNav.

### Sprint 2 — P1 Governança, a11y, Forms (~200 h)

1. **DB-008** (6 h), **DB-026** (8 h), **DB-006 final** (8 h), **DB-011** (3 h), **DB-005** (1 h), **DB-009** (1 h), **DB-022** (2 h).
2. **SEC-002** (8 h) — Security headers + CSP report-only.
3. **UX-007 + UX-024** (40 h) — a11y + focus traps.
4. **UX-022** (6 h) — motion-reduce.
5. **UX-026 + UX-030** (18 h) — Web Vitals + correlation ID + Sentry Replay.
6. **UX-009** (50 h) — RHF migration (piloto `Checkin.tsx` + Auth forms).
7. **UX-025** (12 h) — Error boundaries por rota.
8. **DB-020** (6 h) — Documentar RTO/RPO + drill.
9. **QA-001** (parcial restante, 16 h) — MSW + fixture factories.
10. **QA-002** (8 h) — Mobile/responsive matrix.
11. **DR-001** (12 h) — Runbook restore + backup configs.

### Sprint 3 — P2 Decomposição, LGPD, Performance (~280 h)

1. **UX-001** decomposição pages (100 h em 6 stories) — Ordem §7.2.
2. **UX-002** god-hooks split (75 h) — Piloto `useCheckins.ts`.
3. **UX-008 + UX-017 + UX-028** (60 h) — Skeleton system completo.
4. **UX-005 + UX-021** (30 h) — Charts tokenizados + dark mode foundation.
5. **DB-012 + DB-027 + UX-029** (44 h) — Epic LGPD (consent + erasure + UI privacidade + trigger anonimização).
6. **DB-023** (4 h), **DB-024** (3 h), **DB-018** (4 h), **DB-015** (5 h).
7. **DB-003** (1 h), **DB-007** (0.5 h), **DB-004** (0.5 h), **DB-010** (1 h), **DB-025** (1 h).
8. **SYS-002** (4 h), **SYS-007** (2 h), **SYS-008** (4 h), **SYS-013** (4 h), **SYS-014** (6 h), **SYS-017 follow-up** (cobrado em Sprint 0).

### Backlog P3 (~120 h)

UX-011 + UX-023 (i18n, 88 h), UX-013 (8 h), UX-014 (16 h), UX-018 (2 h), UX-019 (4 h), UX-021 (já em S3), SYS-006/010/011/015/016, DB-004/010/025, SEC-001 (6 h), DX-001 (8 h), ADR-001 (6 h).

---

## 5. Riscos Cruzados (Consolidado — 14 riscos)

| # | Risco | Severidade Agregada | Áreas | Débitos | Mitigação | Sprint |
|---|-------|---------------------|-------|---------|-----------|--------|
| X-1 | Drift tipos PT-BR↔EN após renames | **CRÍTICA** | DB+FE+SYS | DB-006, DB-011, DB-014, UX-004, SYS-007 | DB-014 → gen types → migrate faseado (58 arquivos) | 0+1 |
| X-2 | Bypass efetivo de RLS via PostgREST | **CRÍTICA** | DB+FE | DB-016, DB-019, UX-016, SYS-005 | Inventário (0.8) → RPCs → flag-off → REVOKE → canary | 0→1 |
| X-3 | Vazamento potencial secrets em deploy | **CRÍTICA** | SYS+DB | SYS-005, SYS-012, DB-009, DB-008, DB-026 | Verificar histórico + rotacionar tudo | 0 |
| X-4 | Pages monolíticas + god-hooks + realtime leak | ALTA | FE+SYS | UX-001, UX-002, UX-010, SYS-003, SYS-004 | Centralizar realtime + error boundaries durante decomp. | 1+3 |
| X-5 | Gate 09:45 sem defesa em profundidade real | ALTA | DB+FE | DB-001, DB-016, UX-010, SYS-007 | Server enforcement via DB-016 + CHECK constraint timezone-aware | 1 |
| X-6 | LGPD multi-camada exposta | ALTA | DB+SYS+FE+Compliance | DB-012, DB-013, DB-006, DB-022, DB-027, UX-029, SYS-017 | Epic LGPD coordenado | 2-3 |
| X-7 | Design system não enforce-ável | MÉDIA | FE+SYS | UX-005, UX-006, UX-012, UX-013, UX-018, SYS-006 | AST-driven whitelist + paleta chart-* + ADR | 1-2 |
| X-8 | Observabilidade quase nula | **CRÍTICA** (promovida) | SYS+DB+FE | SYS-017, DB-002, UX-026, UX-030 | Sentry + correlation ID + structured logs ANTES de Sprint 1 | 0+1 |
| X-9 | Forms grandes sem validação consistente | MÉDIA | FE+DB | UX-009, DB-003, DB-007 | RHF + schemas zod compartilhados | 2 |
| X-10 | PWA `selfDestroying` + bundles + cold start | MÉDIA | FE | UX-014, UX-019, UX-020, UX-017 | Decisão produto + analyzer + fallback fonts | 3 |
| X-11 | Migration rollback ausente (DB-016 sem `-- DOWN`) | **CRÍTICA** | DB+SYS | DB-016, DB-006, DB-013, DB-017 | ADR de rollback (Sprint 0 item 0.10) | 0 |
| X-12 | Concurrent admin sessions (sem optimistic locking) | ALTA | DB+FE | RPCs admin | Auditoria pós-Sprint 1 (`updated_at` check) | 2 |
| X-13 | Edge fn cold start + KV throttle (DB-008) | MÉDIA | DB+SYS | DB-008 | Fallback policy + monitoring KV externa | 2 |
| X-14 | Sprint 0 sem dono claro | ALTA (process) | Process | — | FASE 10 (@pm) cria story bloqueante `EPIC-HARDENING-FOUNDATION` com RACI | 0 |

---

## 6. Dependências Críticas Entre Débitos

```
Sprint 0 (gates):
  SYS-012 (.env verify) ──┐
  SYS-017 (Sentry init) ──┤
  DB-014 (gen types) ─────┼──→ Pré-req para Sprint 1
  CI-001 (branch prot.) ──┤
  T-01..T-08 baselines ───┤
  Item 0.8 (inventário) ──┤
  Item 0.9 (feature flag) ┘

Sprint 1 (DB-016 fatiado):
  Inventário (0.8) ──→ RPCs novas (Story A)
                         ↓
                    Migrar 27 SELECTs flag-off (Story B)
                         ↓
                    REVOKE staging (Story C)
                         ↓
                    Canary 1%→10%→25%→100% (Story D, 7 dias)

Outras dependências:
  DB-006 parcial ──→ DB-016 (repolicy precisa helpers PT-BR)
  DB-021 ──→ DB-018 (sem stats, índices são chute)
  DB-013 ──→ DB-022 (limpar backups antes de pgaudit)
  DB-026 ──→ DB-016 REVOKE (scripts admin fazem INSERT direto hoje)
  DB-022 + DB-027 ──→ DB-012 (pré-reqs do erasure workflow)
  UX-025 ──→ UX-001 (boundaries DURANTE decomposição)
  QA-001 ──→ T-01, T-05, T-06 (fixture/MSW pré-req)
```

| Bloqueador | Bloqueado | Tipo | Mitigação |
|------------|-----------|------|-----------|
| DB-014 | DB-006, DB-011, DB-016, UX-001, UX-002 | Tipos | Sprint 0 item 0.3 |
| DB-006 parcial | DB-016 | RLS refactor | Sprint 1 item 1.5 antes do REVOKE |
| Item 0.8 | DB-016 Story C | Operacional | Sprint 0 bloqueante |
| Item 0.9 | DB-016 Story D | Rollout | Sprint 0 bloqueante |
| SYS-017 | Sprint 1 inteira | Observabilidade | Sprint 0 item 0.2 |
| QA-001 | Itens 0.4, 0.5 | Test infra | Sprint 0 estendido |
| CI-001 | Itens 0.3, 0.5, 0.6, 0.9 | Sem gates, teatro | Sprint 0 estendido |

---

## 7. Estratégia de Rollout

### 7.1 DB-016 Canary (mandato QA §6, fatiado em 4 stories)

- **T+0 (Sprint 0):** Inventário consumers (item 0.8) — `docs/security/lancamentos-diarios-consumers.md`.
- **T+1 (Sprint 1, Story A):** Publicar RPCs `get_lancamentos_for_seller`, `get_lancamentos_for_store_summary`, `get_lancamentos_for_network` (`SECURITY DEFINER`, escopo por role).
- **T+2 (Story B):** Migrar 27 client SELECTs para RPCs atrás de feature flag `enforce_lancamentos_rls` (off).
- **T+3 (Story C):** REVOKE INSERT/UPDATE/DELETE em staging + nova policy SELECT `tem_papel_loja(...)` + T-01 verde.
- **T+4 (Story D, dia 1):** Flag on 1% (canary). Monitorar Sentry + RLS deny rate <5%.
- **T+5 (dia 2-3):** 10%. Validar métricas (T-07 p95 mesmo ou melhor).
- **T+6 (dia 4-5):** 25%.
- **T+7 (dia 6-7):** 100%. Rollback plan: `SET enforce_lancamentos_rls = false` + REGRANT em <2 min via runbook.

### 7.2 Pages Monolíticas (UX-001, ordem @ux §4.1)

1. `MXPerformanceLanding` (landing isolada, baseline visual fácil) — piloto.
2. `ConsultoriaClienteDetalhe` (charts UX-005 combinado).
3. `Ranking` (já tem `useRanking.ts` dedicado).
4. `GerenteFeedback` (fluxo delimitado).
5. `DashboardLoja` (depois de UX-002, tem realtime X-4).
6. `AgendaAdmin` (depois de split de `useAgendaAdmin.ts`).

Padrão: `pages/Foo.tsx` <200 LOC + `features/foo/hooks/useFooOrchestrator.ts` + `sections/*` + `components/*`. Error boundary (UX-025) por section. Snapshot Playwright pré/pós (5% threshold inicial).

### 7.3 God-Hooks (UX-002, ordem @ux §4.2)

| Hook | LOC | Sub-hooks |
|------|-----|-----------|
| `useCheckins.ts` (piloto) | 318 | `useCheckinsList`, `useCheckinsSubmit`, `useCheckinsFilters` |
| `useAuth.tsx` | 585 | `useAuthSession`, `useAuthProfile`, `useAuthRoles`, slim Provider |
| `useAgendaAdmin.ts` | 895 | `useAgendaQuery`, `useAgendaMutations`, `useAgendaFilters`, `useAgendaRealtime` |
| `useTeam.ts` (~625) | — | A confirmar |

Estratégia shim: criar sub-hooks → original re-exporta API pública → migrar consumers em PRs pequenos → DELETE quando 0 consumers.

### 7.4 react-hook-form (UX-009, ordem @ux §8)

Greenfield-first + ADR + lint rule. Migração faseada:
1. Piloto: `Checkin.tsx` (testado em `useCheckins.test.ts`).
2. Sprint 2: Auth forms (Login, Cadastro, RecoverPassword) — usa schemas E.164/email do DB-003/007.
3. Sprint 3: Admin forms (CriarLoja, AdminVendedores, CriarMeta).
4. Sprint 4: Wizards (`WizardPDI`, `OnboardingWizard`) com `useFieldArray`.
5. Sprint 5+: restante mecânico.

---

## 8. Critérios de Sucesso (Quality Gates pós-resolução)

### 8.1 Sprint 0 done quando:
- RLS regression matrix verde (T-01: 8 tabelas × 5 roles).
- Smoke 403 verde (T-03) para todas tabelas hardened.
- Migration reversibility verde (T-10) em branch ephemeral.
- `database.generated.ts` gerado e CI checa drift (item 0.3).
- `.env` confirmado out-of-git (item 0.1).
- Sentry recebe erros com source maps (item 0.2).
- Inventário consumers `lancamentos_diarios` publicado (item 0.8).
- Feature flag infra ativa (item 0.9).
- Branch protection + gitleaks ativos (CI-001 mínimo).

### 8.2 Sprint 1 done quando:
- 0 tabelas multi-tenant com `USING(true)` sem REVOKE.
- 0 RPCs `SECURITY DEFINER` sem `SET search_path`.
- 100% coverage `database.types.ts` gerado em CI.
- DB-016 canary 100% sem regressão p95.
- UX-016 hooks bloqueiam queries pré-role (T-02 verde).
- 0 realtime subs sem cleanup (UX-010 — T-05 <5 MB delta).

### 8.3 Sprint 2 done quando:
- 0 WCAG AA Critical/Serious nas 10 rotas top (T-08).
- Security headers ativos (CSP report-only → enforced).
- Forms migrados RHF: 5/30 (piloto + Auth).
- Edge fn `store-pre-registration` com rate limit (T-12).
- Edge functions com structured logs: 5/15.

### 8.4 Sprint 3 done quando:
- Pages >500 LOC: ≤5 (de 15).
- Hooks >300 LOC: ≤3 (de 10).
- Forms RHF: 20/30.
- LCP dashboard inicial <2s.
- LGPD MVP: banner + central + erasure RPC + pgaudit.

### 8.5 KPIs/SLOs pós-resolução

Vide §5.3 do `qa-review.md` (14 métricas, baseline a medir em Sprint 0).

---

## 9. Riscos Residuais Aceitos

| Risco | Aceito por | Motivo | Revisão em |
|-------|-----------|--------|------------|
| UX-011 i18n adiado P3 | @pm + @ux | Sem mercado-alvo declarado | Q4 2026 ou demanda de produto |
| UX-014 PWA real adiado P3 | @pm + @ux | Decisão produto pendente | Q3 2026 |
| SEC-001 threat model formal P3 | @architect | Riscos empíricos X-1..X-14 cobrem 80% | Após Sprint 3 |
| DB-018 IDX-004..006 condicional a `pg_stat_statements` evidence | @data-engineer | Sem dados, criar índices é chute | Após DB-021 medir 30 dias |
| Concurrent admin sessions (X-12) | @architect | Baixa probabilidade hoje (poucos admins) | Sprint 4 |

---

## 10. Esforço & Timeline

| Sprint | Esforço (h) | Duração (sem) | Recursos | Bloqueante de |
|--------|------------|---------------|----------|---------------|
| Sprint 0 | ~70 (54 + 16 CI-001) | 1.5 | @devops + @qa + @dev + @data | Sprint 1 inteira |
| Sprint 1 (P0) | ~120 | 2-3 | full stack (3-4 devs) | Produção segura |
| Sprint 2 (P1) | ~200 | 4-5 | full stack + @ux | a11y + LGPD-prep |
| Sprint 3 (P2) | ~280 | 6-8 | UX-focused + @data | Decomposição + LGPD |
| Backlog P3 | ~120 | flexível | conforme prioridade | — |
| Testes baseline (T-01..T-12) | ~80 | paralelo Sprint 0+1 | @qa + @dev | Quality gates |
| **TOTAL** | **~830** | **13-17 sem** | **3-4 devs** | — |

> Overhead de 25% sobre estimativas isoladas DB+UX (mandato QA §10.3) já embutido — cobre testes, rollout, Sprint 0, gaps.

---

## 11. Recomendações Operacionais

- **Feature flags obrigatórias** (mandato QA §6): DB-016, DB-001, DB-006, DB-008, UX-014. Sem infra (Sprint 0 item 0.9), nenhum P0 vai para Sprint 1.
- **Canary rollout** mandatório para DB-016 (janela 7 dias 1%→100%).
- **Backups + DR drill** antes de Sprint 1 (item 0.10) e drill semestral (DR-001).
- **Observabilidade primeiro** (X-8 promovido a CRÍTICA): Sentry init (0.2) + correlation ID (UX-030) ANTES de qualquer mudança que possa quebrar.
- **Communication plan:**
  - Aprovação stakeholders: relatório executivo @analyst (FASE 9) cobre quantificação financeira (DB-016 = comissões fraudadas; DB-013 = ANPD 2% faturamento).
  - Status diário durante DB-016 canary (Slack #hardening).
  - Retro pós-Sprint 0 + pós-Sprint 1 obrigatórias.
- **Política de definition-of-done** padrão (mandato QA §10.3): testes T-relacionados verdes + visual diff aprovado + migration UP+DOWN validada + Sentry events em staging + feature flag documentado.
- **RACI explícito em FASE 10:** Sprint 0 deve ser 1 epic isolado (`EPIC-HARDENING-FOUNDATION`) com story bloqueante; DB-016 fatiado em 4 stories (A/B/C/D); UX-001 fatiado por page (6 stories).

---

## 12. Anexos

### A. Referências aos documentos de origem

- `docs/architecture/system-architecture-brownfield-2026-05-16.md` (FASE 1, @architect)
- `supabase/docs/SCHEMA.md` + `supabase/docs/DB-AUDIT.md` (FASE 2, @data-engineer)
- `docs/frontend/frontend-spec.md` (FASE 3, @ux-design-expert)
- `docs/prd/technical-debt-DRAFT.md` (FASE 4, @architect — consolidação inicial)
- `docs/reviews/db-specialist-review.md` (FASE 5, @data-engineer — 27 débitos, vetor DB-016 confirmado, Sprint 1/2/3 DB)
- `docs/reviews/ux-specialist-review.md` (FASE 6, @ux-design-expert — 28 débitos, planos decomp/split/RHF)
- `docs/reviews/qa-review.md` (FASE 7, @qa — Gate APPROVED CONDICIONAL, Sprint 0, GAP-01..GAP-10, X-11..X-14)

### B. Snapshots visuais recomendados (Sprint 0 item 0.5)

1. `MXPerformanceLanding` (1440×900, 768×1024, 375×812)
2. `DashboardLoja` gestor (1440×900, 375×812)
3. `DashboardLoja` vendedor (1440×900, 375×812)
4. `AgendaAdmin` admin_mx (1440×900)
5. `ConsultoriaClienteDetalhe` (1440×900) — UX-005 baseline
6. `Ranking` gestor (1440×900, 375×812)
7. `GerenteFeedback` (1440×900)
8. `Checkin` vendedor (375×812) — piloto RHF
9. Chart "Vendas vs Conversão" (1440×900) — UX-005
10. Chart "Margem" (1440×900) — UX-005
11. `<RoleSwitch>` em todas variações de role (1440×900) — UX-016 contract
12. `TabNav` vs `TabNavPill` lado a lado (1440×900) — UX-012

### C. Glossário de IDs

- **SYS-001 a SYS-017** — Sistema (@architect, FASE 1)
- **DB-001 a DB-027** — Database (@data-engineer, FASE 2+5)
- **UX-001 a UX-028** — Frontend/UX (@ux-design-expert, FASE 3+6)
- **CI-001, DR-001, SEC-001, SEC-002, QA-001, QA-002, DX-001, ADR-001, UX-029, UX-030** — Gaps (@qa, FASE 7)
- **X-1 a X-14** — Riscos cruzados (X-1..X-10 @architect FASE 4; X-11..X-14 @qa FASE 7)
- **T-01 a T-12** — Testes baseline (@qa FASE 7, §5)

### D. Convenções deste assessment final

- Article IV (No Invention): todos os 73 débitos vêm dos 7 documentos input. Renumerações e consolidações de IDs (GAPs → CI-001/DR-001/etc.) preservam rastreabilidade.
- Severidades respeitam ajustes dos especialistas (DB-008↑, DB-012↑, DB-018↑, DB-019↑, UX-010↑, UX-016↑, SYS-017↑ via X-8).
- Esforço total ~830 h inclui overhead de 25% (mandato QA §10.3).
- Estimativas DB faixa 95-100 h, UX faixa 440-720 h (mid 520 h) — range absorve quick-wins paralelizáveis.

---

**Fim do Technical Debt Assessment FINAL (FASE 8).**
**Próximos passos:**
- **FASE 9** (@analyst): `TECHNICAL-DEBT-REPORT.md` executivo com quantificação financeira, comparativo de mercado, quick-wins visíveis.
- **FASE 10** (@pm): Epic `EPIC-HARDENING-FOUNDATION` (Sprint 0 bloqueante) + 4 stories de DB-016 + 6 stories de UX-001 + RACI por story (mandato QA §10.3).
