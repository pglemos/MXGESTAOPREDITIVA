# QA Review — Technical Debt Assessment
**Reviewer:** @qa (Quinn) | **Date:** 2026-05-16 | **Phase:** 7/10 — Brownfield Discovery
**Inputs:**
- `docs/prd/technical-debt-DRAFT.md` (56 débitos; @architect, FASE 4)
- `docs/reviews/db-specialist-review.md` (27 débitos DB; @data-engineer, FASE 5)
- `docs/reviews/ux-specialist-review.md` (28 débitos UX; @ux-design-expert, FASE 6)
- Refs: `docs/architecture/system-architecture-brownfield-2026-05-16.md`, `supabase/docs/DB-AUDIT.md`, `docs/frontend/frontend-spec.md`

> Esta revisão SUBSTITUI a versão prévia de 15-abr-2026. Recalibrada para os 73 débitos consolidados em 2026-05-16. É o **primeiro olhar independente** sobre o assessment combinado — desafiei dependências, sequencing e suficiência de testes, não validei cegamente.

---

## 1. Gate Status

**Veredito: APPROVED CONDICIONAL**

Justificativa: o assessment combinado (DB+UX+SYS = 73 débitos com 8 a 10 críticos, riscos cruzados X-1..X-10 bem caracterizados, vetor DB-016 reproduzível por análise estática) está **tecnicamente completo e internamente consistente**. As especialistas convergem sobre a sequência DB-014 → DB-006 parcial → DB-016, ambas independentemente recomendaram APPROVED viável-com-Sprint-0, e os deltas adicionados em FASE 5/6 (DB-020..027, UX-021..028) cobrem gaps que o DRAFT original não viu. **Porém** subsistem 10 lacunas relevantes (§2) e o assessment NÃO entrega ainda baseline de testes nem rollout plan formal — sem isso, qualquer Sprint 1 dispara X-2/X-5 sem rede de proteção. **Aprovo para FASE 8 sob a condição obrigatória de Sprint 0 (gates de teste/observabilidade/rollout) entrar no escopo do assessment final, com aceite verificável antes de qualquer P0 técnico tocar produção.**

### Sprint 0 obrigatória (condição de APPROVED)

| # | Item | Responsável | Esforço | Critério de aceite |
|---|------|-------------|---------|---------------------|
| 0.1 | Confirmar `.env` no histórico git (SYS-012). Se commitado: rotacionar SUPABASE_SERVICE_ROLE_KEY, POSTGRES_URL, GOOGLE_*, RESEND_API_KEY, SENTRY_DSN | @devops | 4h | `git log --all -p -- .env` limpo OU rotation evidence em `docs/security/rotation-log.md` |
| 0.2 | Inicializar Sentry no entrypoint (`src/main.tsx`) com release tag + source maps no build (SYS-017) | @dev | 3h | erro deliberado em staging chega no Sentry com stack trace de-minificado |
| 0.3 | Pipeline `supabase gen types typescript --linked` em CI + diff gate contra `src/types/database.generated.ts` (DB-014/UX-004) | @devops + @dev | 4h | PR que altera schema sem rerun de gen falha o check |
| 0.4 | Baseline RLS regression suite: 8 tabelas críticas × 5 roles = 40 cenários mínimos (pytest+supabase-py ou Deno test) | @qa + @dev | 12h | suite verde em main; 1 cenário "negativo" para DB-016 (POST direto retorna 403 esperado APÓS fix) |
| 0.5 | Baseline visual Playwright: 6 pages monolíticas + 4 charts críticos (`MXPerformanceLanding`, `DashboardLoja`, `AgendaAdmin`, `ConsultoriaClienteDetalhe`, `Ranking`, `GerenteFeedback`) | @qa + @ux | 8h | snapshots commited em `tests/visual/__snapshots__/`; pipeline grava artifact diff em PR |
| 0.6 | Baseline performance: p95 de `submit_checkin`, `compute_dre`, login flow, dashboard initial load (Lighthouse CI ou k6) | @qa | 6h | métricas em `docs/perf/baseline-2026-05-16.json`; threshold em CI (±20%) |
| 0.7 | Habilitar `pg_stat_statements` (DB-021) ANTES de Sprint 3 — sem isso DB-018 é especulativo | @data-engineer | 1h | extension instalada; query top-20 documentada |
| 0.8 | Auditoria de consumers diretos de `lancamentos_diarios`: listar TODOS scripts/automation/edge functions + 27 client SELECTs (pré-req DB-016) | @data-engineer + @dev | 6h | inventário em `docs/security/lancamentos-diarios-consumers.md` + plano de migração para RPCs |
| 0.9 | Feature flag infra: introduzir `feature_flags` table + helper `is_feature_enabled(key, user_id)` — DB-016 deploy precisa de canary | @data-engineer | 6h | flag `enforce_lancamentos_rls` togglable; rollout 1% → 10% → 100% |
| 0.10 | Definir ADR de rollback: migrations reversíveis para DB-016, DB-006, DB-013, DB-017 (UP + DOWN) | @architect | 4h | cada migration crítica tem `-- DOWN` validado em branch ephemeral |

**Total Sprint 0:** ~54h, ~1.5 sprint paralelo (devops + qa + dev). Bloqueante para Sprint 1.

---

## 2. Gaps Identificados

| # | Gap | Severidade | Owner sugerido | Recomendação |
|---|-----|-----------|----------------|---------------|
| GAP-01 | **CI/CD debt não enumerado.** Nenhum débito SYS/DB/UX cobre: branch protection rules, required checks, signing, secret scanning (gitleaks), SBOM, supply chain (Renovate/Dependabot), provenance, staging gate before prod | Alta | @devops | Adicionar 4-6 débitos novos (SYS-018..023) — mínimo: gitleaks pre-commit, Dependabot, branch protection, staging deploy mandatory before prod |
| GAP-02 | **Disaster Recovery além de RTO/RPO.** DB-020 cita "documentar RTO/RPO" mas não há débito para *runbook de restore*, *DR drill semestral*, *failover de domínio*, *backup de configs Supabase* (RLS, edge functions, secrets). PITR sozinho não cobre operacional | Alta | @data-engineer + @devops | Novo débito DR-001: runbook restore end-to-end testado; backup de schema/RLS export (`supabase db dump --schema-only`) versionado |
| GAP-03 | **Threat model formal ausente.** Riscos cruzados X-1..X-10 são *empíricos*, não derivam de threat model STRIDE/PASTA. Não há análise de: insider threat (admin malicioso), supply chain (npm typosquat), session hijack pós-login, CSRF em RPCs, replay de OAuth state | Média | @architect + @qa | ADR de threat model (4-6h); pode ficar para Sprint 4, mas mencionar explicitamente que está fora do escopo atual |
| GAP-04 | **Security headers / CSP / SRI ausentes do assessment.** Apenas CORS (DB-009) é citado. Não há débito para: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, Subresource Integrity nas tags `<script>`/`<link>` Google Fonts (UX-019 cita CDN sem SRI) | Alta | @devops + @dev | Novo débito SYS-024: configurar headers via Vercel/Netlify `_headers` ou middleware; CSP report-only primeiro |
| GAP-05 | **Test infrastructure subdimensionada.** SYS-009 menciona 62 arquivos `testsprite_tests/` paralelos a `e2e/` mas nenhum débito cobre: estratégia de fixtures, seed data reprodutível, MSW para mock de Supabase, contract tests (Pact) entre edge functions e RPCs, mutation testing, flake quarantine. Sem isso, Sprint 0 item 0.4 fica frágil | Alta | @qa + @dev | Novo débito QA-001: consolidar `testsprite_tests/` vs `e2e/` (ADR + migration); fixture factories; MSW handlers para Supabase JS client |
| GAP-06 | **Onboarding / dev experience.** Nenhum débito cobre: README de "como subir local em <30min", devcontainer/docker-compose para Supabase local, seeds para dev, scripts npm de DX (`db:reset`, `db:seed`, `qa:rls`, `qa:visual`) | Média | @architect + @devops | Novo débito DX-001: bootstrap script + README modernizado + seed scripts |
| GAP-07 | **ADRs históricos ausentes.** Múltiplos débitos pedem ADRs novos (UX-013, UX-014, UX-023, GAP-03) mas não há registro de decisões passadas (Vite vs Next, Supabase vs próprio backend, RLS strategy, atomic design). Para brownfield = perda de contexto institucional | Baixa | @architect | Backfill mínimo: 5-7 ADRs retroativos cobrindo decisões âncora (formato Nygard) |
| GAP-08 | **LGPD além de DB.** Database cobre consentimento (DB-012), backups (DB-013), trigger (DB-027), pgaudit (DB-022). FE não cobre: banner de cookies, política de privacidade dinâmica, opt-out de telemetria, exportar meus dados (UI), revogar consentimento (UI) | Média | @ux + @pm | Novo débito UX-029: UI de privacidade (banner + central de privacidade) |
| GAP-09 | **Observabilidade FE fragmentada.** UX-026 cobre web vitals; SYS-017 cobre Sentry; mas falta: structured frontend logs (correlation ID), session replay (Sentry Replay), real user monitoring (RUM), business metrics (events em PostHog/Amplitude) | Média | @ux + @devops | Estender UX-026 ou criar UX-030 — pelo menos correlation ID nas chamadas RPC para amarrar com `logs_auditoria` server-side |
| GAP-10 | **Mobile/responsive testing matrix.** Frontend-spec menciona mobile-first mas nenhum débito cobre: device matrix (iOS Safari, Android Chrome, tablets), viewport testing automatizado (Playwright projects por viewport), gesture testing (swipe, long-press), notch/safe-area | Média | @qa + @ux | Novo débito QA-002: device matrix CI (3 viewports × 4 rotas críticas) |

**4 gaps de severidade Alta** (GAP-01, 02, 04, 05) — qualquer um sozinho justifica APPROVED CONDICIONAL e não APPROVED puro.

---

## 3. Riscos Cruzados Validados

Avaliação independente dos 10 riscos do DRAFT + 4 novos riscos QA identifica:

| Risco | Áreas Afetadas | Probabilidade | Impacto | Avaliação QA | Mitigação adicional |
|-------|----------------|---------------|---------|--------------|--------------------|
| X-1 (drift tipos PT-BR↔EN) | DB+FE+SYS | ALTA | CRÍTICO | **Concordo crítica.** Blast radius 58 arquivos confirmado por UX-spec. | Sprint 0 item 0.3 + smoke test pós-gen |
| X-2 (bypass RLS PostgREST) | DB+FE | ALTA (vetor demonstrado) | CRÍTICO | **Concordo crítica.** UX-spec §6 cita 27 SELECTs diretos no client — vetor mais amplo que o DRAFT admitia | **Item 0.8 obrigatório.** Sem inventário de consumers, REVOKE quebra produção. |
| X-3 (vazamento secrets) | SYS+DB | MÉDIA-ALTA | CRÍTICO | **Concordo crítica** mas falta validação do histórico git (item 0.1) — pode já ter vazado | Treat as compromised: rotacionar TODAS as keys por default |
| X-4 (page monolítica + realtime leak) | FE+SYS | MÉDIA | ALTO | **Concordo alta.** Recomendo memory profiler em CI (`chrome-devtools-mcp` perf trace) | Adicionar item 0.5 estendido: heap snapshot baseline |
| X-5 (gate 09:45 sem D-in-D) | DB+FE | ALTA | ALTO | **Concordo alta.** Confirmo dependência de DB-016. **Adicional QA:** CHECK constraint `submitted_at::time >= '09:45'` proposta por @data-engineer é correta, MAS atenção a timezone — `now() AT TIME ZONE 'America/Sao_Paulo'` deve ser explícito | E2E com manipulação de relógio mandatório antes de fechar X-5 |
| X-6 (LGPD multi-camada) | DB+SYS+Compliance | MÉDIA | ALTO | **Concordo alta.** GAP-08 estende. Trigger DB-027 + UI privacidade são complementares | Auditoria jurídica externa antes de deploy final |
| X-7 (DS não enforce-ável) | FE+SYS | MÉDIA | MÉDIO | **Concordo média.** UX-006 (AST-driven) destrava | OK como está |
| X-8 (observabilidade ~nula) | SYS+DB | ALTA | ALTO | **Subir para CRÍTICA.** Sem observabilidade, postmortem do PRÓPRIO rollout do hardening é impossível. Item 0.2 mitiga parcial | Sentry + structured logs ANTES de Sprint 1 |
| X-9 (forms grandes sem validação) | FE+DB | MÉDIA | MÉDIO | Concordo média | OK |
| X-10 (PWA + bundles + cold start) | FE | BAIXA-MÉDIA | MÉDIO | Concordo média | OK |
| **X-11 (novo) — Migration rollback ausente** | DB+SYS | MÉDIA | CRÍTICO | DB-016 REVOKE sem `-- DOWN` testado = se quebra produção, restore via PITR (>15min RTO assumido) | Item 0.10 mandatório |
| **X-12 (novo) — Concurrent admin sessions** | DB+FE | BAIXA | ALTO | 2 admins editando mesma loja simultaneamente — sem optimistic locking nem `updated_at` check em RPCs | Auditoria de RPCs admin pós-Sprint 1 |
| **X-13 (novo) — Edge function cold start + KV throttle (DB-008)** | DB+SYS | MÉDIA | MÉDIO | Rate limit via KV externa (Upstash) adiciona latência + falha cascade se KV cair | Fallback: rejeitar OR permitir? Decisão produto |
| **X-14 (novo) — Sprint 0 não tem dono claro** | Process | ALTA | ALTO | Sem RACI explícito, Sprint 0 pode ser pulado e ir direto Sprint 1 | FASE 10 (@pm) deve criar story bloqueante de Sprint 0 PRIMEIRO |

---

## 4. Dependências Validadas

### 4.1 DB-016 REVOKE → migrar 27 SELECTs primeiro

**Verdict: CONFIRMADO — sequenciamento procede, MAS o DRAFT subestimou o blast radius.**

- @data-engineer §4.1 demonstrou que `lancamentos_diarios` aceita INSERT/UPDATE/DELETE direto via PostgREST (vetor de ataque concreto exibido).
- @ux-spec §6 reforçou que existem **27 ocorrências de `.from('lancamentos_diarios')`** no client (`useRanking`, `useNetworkHierarchy`, `useNetworkPerformance`, `useCheckins`).
- **Pegadinha QA:** o DRAFT e @data-engineer focam em REVOKE de INSERT/UPDATE/DELETE, mas a policy SELECT atual é `USING(true)` — qualquer authenticated lê TUDO. Migrar SELECTs para um modelo `tem_papel_loja(...)` muda o resultado de queries existentes. **27 queries vão começar a retornar subsets menores** → relatórios podem mostrar zero, ranking pode sumir.
- **Decisão técnica recomendada:**
  1. Sprint 0 item 0.8: inventário completo (queries + roles esperadas).
  2. Criar RPCs `get_lancamentos_for_seller`, `get_lancamentos_for_store_summary`, `get_lancamentos_for_network` com `SECURITY DEFINER` e escopo correto por role.
  3. Migrar os 27 client-side SELECTs para RPCs (Sprint 1A, paralelo a outros itens).
  4. **Somente depois** rodar REVOKE INSERT/UPDATE/DELETE + nova policy SELECT.
  5. Canary rollout via feature flag (item 0.9): toggle `enforce_lancamentos_rls` ligado em 1% → 10% → 100% em 7 dias.
- **Pré-req cego:** DB-014 (types gerados) — sem isso a migração das 27 queries acontece às cegas.

### 4.2 `database.types.ts` gen → 58 arquivos blast radius

**Verdict: ORDEM VIÁVEL com plano @ux §4.4, MAS risco residual existe.**

- Plano @ux (gen como `database.generated.ts` separado, não substitui `database.ts` manual) é correto e minimiza risco.
- **Risco residual:** o tipo manual `src/types/database.ts` (610 LOC) e o gerado vão divergir em propriedades nullable, defaults, enums. Bugs subtis (ex: `phone: string | null` no gerado vs `phone: string` manual) só aparecem em runtime se TypeScript não pega.
- **Mitigação QA:**
  1. Após gen, rodar `tsc --noEmit` com `strict: true` mesmo nos testes (corrigir SYS-007 simultaneamente — testes fora do tsc principal).
  2. Adicionar script `pnpm types:diff` que compara shape de cada Row type manual vs gerado e falha CI se divergir.
  3. Migrar feature-por-feature em PR pequenos (max 5 arquivos), nunca em massa.

### 4.3 Outras dependências críticas

| Bloqueador | Bloqueado | Tipo | Mitigação |
|------------|-----------|------|-----------|
| DB-006 (helpers EN→PT-BR) | DB-016 (REVOKE/repolicy) | Refactor de RLS depende de helpers estáveis | Sprint 1: DB-006 parcial (helpers PT-BR criados, EN deprecated mas ainda existem) → Sprint 2: drop EN |
| DB-021 (pg_stat_statements) | DB-018 (indexes IDX-001..006) | Sem dados, índices são chute | Sprint 0 item 0.7 |
| Item 0.4 (RLS test suite) | DB-016, DB-019, DB-002 | Regression suite é critério de aceite | Sprint 0 obrigatório |
| Item 0.9 (feature flag infra) | DB-016 REVOKE | Sem canary, rollout é all-or-nothing | Sprint 0 obrigatório |
| Sentry init (item 0.2) | Tudo de Sprint 1 | Sem observabilidade, postmortem impossível | Sprint 0 obrigatório |
| DB-014 (types gen) | UX-001, UX-002, UX-004, X-1 | Refactors FE em god-hooks/pages precisam de tipos confiáveis | Sprint 0 item 0.3 |
| UX-025 (error boundaries) | UX-001 (decomposição pages) | Decomposição sem error boundary deixa cliente branco se section quebrar | Adicionar boundaries DURANTE decomposição |
| GAP-05 (test infra) | Itens 0.4, 0.5 de Sprint 0 | Fixture/MSW sem padrão → suites flaky | Resolver GAP-05 antes de fechar Sprint 0 |
| GAP-01 (CI/CD debt) | Itens 0.3, 0.5, 0.6, 0.9 | Sem branch protection, gates não bloqueiam de fato | Sprint 0 estendido |

**Dependência invertida detectada no DRAFT §5:** SYS-005 (`@supabase/supabase-js` em devDependencies) está marcada P0 mas é trivial (0.5h), enquanto DB-014 (gen types) que destrava 58 arquivos é P0 também — recomendo @architect renumerar prioridades no assessment final por *desbloqueio* não por severidade.

---

## 5. Testes Requeridos (pré-resolução)

### 5.1 Testes obrigatórios ANTES de tocar em P0

| # | Teste | Cobertura | Ferramenta | Esforço | Responsável | Bloqueia |
|---|-------|-----------|------------|---------|-------------|----------|
| T-01 | RLS regression matrix: 8 tabelas críticas × 5 roles = 40 cenários (SELECT+INSERT+UPDATE+DELETE = 160 assertions mínimas) | DB-016, DB-019, DB-013 | pytest + supabase-py OU Deno test | 12h | @qa+@dev | Sprint 1 inteira |
| T-02 | RBAC matrix: 27 ROUTE_ACCESS_RULES × 5 roles = 135 cenários client + 135 cenários hook-level | UX-016, X-2 | Playwright + custom test helpers | 16h | @qa | UX-016 |
| T-03 | Smoke test "POST direto deve retornar 403": `lancamentos_diarios`, `role_assignments_audit`, `store_meta_rules_history`, `usuarios`, `vendedores_loja`, `migration_backup_*` | DB-016, DB-019, DB-013 | Deno test (edge fn) ou curl-based | 4h | @qa | DB-016, DB-019, DB-013 |
| T-04 | Gate 09:45 E2E com mock de Date: 09:44 fail, 09:45 pass, 09:46 pass, edge case timezone DST | DB-001, X-5 | Playwright + `page.clock.install()` (Playwright 1.59+) | 6h | @qa | X-5 closure |
| T-05 | Memory leak detection: navegar 10x para DashboardLoja, RotinaGerente, Notificacoes → heap snapshot delta deve estar < 5MB | UX-010, X-4 | Playwright + `chrome-devtools-mcp` perf trace | 8h | @qa | UX-010 |
| T-06 | Visual regression baseline: 6 pages monolíticas + 4 charts (UX-001 ordem) | UX-001, UX-005 | Playwright + pixelmatch (5% threshold inicial) | 8h | @qa+@ux | UX-001 começar |
| T-07 | Performance baseline: p95 `submit_checkin` <500ms, dashboard initial load <2s LCP, `compute_dre` <3s | UX-001, UX-026, DB-018 | k6 (backend) + Lighthouse CI (frontend) | 6h | @qa | DB-018, UX-001 |
| T-08 | A11y baseline: axe-core nas 10 rotas críticas, 0 violations Critical/Serious | UX-007, UX-024 | `@axe-core/playwright` | 6h | @qa+@ux | UX-007 |
| T-09 | Contract test edge function `submit_checkin` → schema JSON em/out validado por Zod compartilhado client/server | DB-001, DB-002 | Vitest + zod parse | 4h | @qa+@dev | Sprint 2 |
| T-10 | Migration reversibility test: cada migration crítica (DB-016, DB-006, DB-013, DB-017) tem branch ephemeral onde UP→DOWN→UP roda limpo | X-11 | Supabase branching + CI script | 6h | @qa+@dev | DB-016 deploy |
| T-11 | OAuth state PKCE replay test: tentar reusar `state` deve falhar | DB-010 | Edge fn integration test | 2h | @qa | DB-010 |
| T-12 | Rate limit edge fn `store-pre-registration`: 100 req/min de mesmo IP retorna 429 | DB-008 | k6 burst test | 2h | @qa | DB-008 |

**Total tests baseline:** ~80h. Pode rodar em paralelo a Sprint 0 (itens 0.4 e 0.5 cobrem T-01, T-03, T-06).

### 5.2 Suites de regressão a manter durante Sprint 1+

- Smoke test diário em staging: login → checkin → submit → dashboard → logout
- Visual diff em PR para qualquer arquivo em `src/pages/` ou `src/features/*/sections/`
- RLS regression em PR para qualquer arquivo em `supabase/migrations/` ou `supabase/sql/`
- Bundle size check em PR (UX-020/UX-027): fail se chunk principal > 500kb
- A11y check em PR para qualquer mudança em `src/components/ui/`
- Type drift check: `supabase gen types` em CI cron diário; falha se diff vs `database.generated.ts` commitado

### 5.3 Métricas de sucesso pós-resolução (KPIs/SLOs)

| Métrica | Baseline (a medir) | Target Sprint 1 | Target Sprint 3 |
|---------|---------------------|------------------|------------------|
| Tabelas multi-tenant com `USING(true)` sem REVOKE | 5+ (auditar) | 0 | 0 |
| RPCs `SECURITY DEFINER` sem `SET search_path` | 12 (DB-AUDIT) | 0 | 0 |
| Coverage `database.types.ts` gerado | 0% (não existe) | 100% (CI gate) | 100% |
| Skeleton coverage por rota | 16.6% (7/42) | 50% | 90% |
| WCAG AA violations Critical+Serious (top 10 rotas) | a medir | -50% | 0 |
| p95 `submit_checkin` | a medir | mesmo OU melhor | -20% |
| LCP dashboard inicial | a medir | mesmo OU melhor | <2s |
| Memory delta após 10 navegações (leak proxy) | a medir | <10MB | <5MB |
| Páginas >500 LOC | 15 | 12 | 5 |
| Hooks >300 LOC | 10 | 7 | 3 |
| Forms migrados para RHF | 0/30 | 5/30 (piloto+auth) | 20/30 |
| Sentry events com source maps | 0 | 100% | 100% |
| Tempo médio postmortem (TTR) | n/a | medido | <2h |
| Edge functions com structured logging | 0/15 | 5/15 | 15/15 |

---

## 6. Feature Flags & Rollout Strategy

Tabela essencial para mitigar riscos de regressão em produção. **Sem feature flag infra (Sprint 0 item 0.9), NENHUM débito crítico pode ir para Sprint 1.**

| Débito | Feature flag? | Rollout | Rollback plan | Janela canary sugerida |
|--------|---------------|---------|----------------|------------------------|
| DB-016 (REVOKE + repolicy `lancamentos_diarios`) | **SIM (mandatório)** `enforce_lancamentos_rls` | Canary 1% → 10% → 25% → 100% em 7 dias | `SET enforce_lancamentos_rls = false` + REGRANT em <2min via runbook | 7 dias min |
| DB-019 (RLS em audit tables) | NÃO (read-only impact) | Direto após T-03 verde | `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` em <30s | Imediato após T-03 |
| DB-013 (DROP backups) | NÃO mas EXPORT obrigatório PRIMEIRO | Export → 24h waiting → DROP | Restaurar do export S3 (RTO ~30min) | 24h export hold |
| DB-001 (validar `vendedores_loja.is_active`) | **SIM** `strict_seller_validation` | 10% → 100% em 48h | DROP da nova versão da função; old version retida | 48h |
| DB-002 (wrap SQLERRM) | NÃO (apenas backend, nenhum impact contract) | Direto após T-09 | Reverter migration | Imediato |
| DB-006 (drop helpers EN) | **SIM** `use_ptbr_helpers_only` | Por subsystem (auth → store → checkins) | Helpers EN mantidos até flag 100% por 14 dias | 14 dias por subsystem |
| DB-017 (`SET search_path`) | NÃO (defesa interna, sem mudança de contract) | Direto após T-01 | Reverter migrations individuais | Imediato |
| DB-008 (rate limit) | **SIM** `enforce_store_preregistration_rate_limit` | 50% sample primeiro → 100% após 24h | Toggle off | 24h |
| UX-001 (decomposição pages) | NÃO mas `pageLazyLoadV2` flag por page | Page-by-page; versão antiga retida em `pages/_legacy/` por 30 dias | URL param `?legacy=true` força versão antiga | 30 dias por page |
| UX-002 (split hooks) | NÃO (mecânico, shim mantém API) | Direto após testes existentes | Reverter PR | Imediato |
| UX-004 (gen types) | NÃO (build-time) | Direto após items 0.3 verde | Reverter para `database.ts` manual | Imediato |
| UX-009 (RHF migration) | NÃO mas por form | Form-by-form | Reverter PR | Imediato |
| UX-014 (decisão PWA) | **SIM** `pwa_real_mode` | Beta opt-in primeiro | Voltar para `selfDestroying` | Indefinido (decisão produto) |

**Política geral:** todo P0 com impacto em produção (DB-016, DB-001, DB-006, DB-008) → feature flag + canary. Todo P0 backend-only sem mudança de contract → direto após gate de teste. Todo P1/P2 refactor → mecânica via PR pequeno, sem flag.

---

## 7. Análise de Observabilidade

**Estado atual:** **CRÍTICO (X-8 deve subir de Alta para Crítica).**

- **Sentry:** DSN existe (`SENTRY_DSN` no env, SYS-017) mas inicialização NÃO confirmada no código FE. Edge functions também sem confirmação. Resultado: erros em produção são invisíveis ou só aparecem em logs Supabase brutos.
- **Structured logs:** `EXCEPTION WHEN others ... SQLERRM` (DB-002) vaza interna E não é parseável; edge functions provavelmente fazem `console.log` ad-hoc; nenhum correlation ID amarrando request FE → RPC → trigger.
- **Métricas:** sem RUM (web vitals, UX-026), sem APM (p95/p99 por RPC), sem dashboard de health.
- **Audit trail:** existe `logs_auditoria` e `logs_acesso_sensivel` (positivo) mas dependentes dos helpers EN/PT-BR mistos (X-6) — risco de gaps.
- **Triggers:** 60 triggers no schema (DB-AUDIT) sem dashboard de "qual disparou quando" — debugging cego.

**Gaps de observabilidade não enumerados nos débitos atuais (relacionado a GAP-09):**
1. Correlation ID (trace ID) propagado FE → edge function → RPC → trigger → log
2. Structured JSON logs em todas edge functions (substituir `console.log`)
3. RUM / web vitals (UX-026 cobre web vitals mas não envia para backend)
4. Session replay para erros (Sentry Replay)
5. Business metrics (PostHog ou Amplitude): quantos checkins/dia, drop-off por step
6. SLO dashboard (Datadog, Grafana, ou Supabase observability)
7. Alerting (PagerDuty?): p95 `submit_checkin` >1s, RLS deny rate >5%, error rate >2%

**Recomendação:** consolidar SYS-017 + UX-026 + GAP-09 em um epic "Observabilidade Foundation" — esforço estimado adicional ~40h.

---

## 8. Análise de CI/CD

**Estado atual:** **NÃO ENUMERADO** (GAP-01). É uma cegueira do assessment.

Inferências a partir do `package.json`, presença de `playwright.config.ts`, ausência de `.github/workflows/` evidenciado:

| Componente CI/CD | Status (a validar) | Risco |
|------------------|---------------------|-------|
| Branch protection main | desconhecido | Alto |
| Required checks (typecheck, lint, test) | desconhecido | Alto |
| Secret scanning (gitleaks) | provavelmente ausente | Alto (X-3) |
| SBOM / dependency provenance | ausente | Médio |
| Dependabot / Renovate | desconhecido | Médio |
| Staging deploy gate antes de prod | desconhecido | Alto |
| Migration dry-run em PR | provavelmente ausente | Alto |
| RLS regression CI | ausente (criar T-01) | Crítico |
| Visual regression CI | ausente (criar T-06) | Alto |
| A11y CI | ausente (criar T-08) | Alto |
| Bundle size budget CI | ausente (UX-020/UX-027) | Médio |

**Recomendação:** @devops deve receber pedido formal em FASE 8 para adicionar 4-6 débitos SYS novos cobrindo CI/CD. Mínimo absoluto antes de Sprint 1: branch protection + 5 required checks + gitleaks pré-commit.

---

## 9. Compliance & Threat Model

### 9.1 LGPD (parcialmente coberto)

- DB-012 (consent + erasure), DB-013 (backups PII), DB-022 (pgaudit), DB-027 (trigger anonimização) → **DB-side OK**
- FE-side: ausente (GAP-08). Sem banner, sem central de privacidade, sem opt-out telemetria
- Process-side: ausente. Sem DPIA documentado, sem registro de tratamento (ROPA), sem contrato com Supabase como sub-processador documentado

### 9.2 SOC2 / ISO 27001 (não declarado como meta)

Se for meta futura: DB-020 (RTO/RPO), DB-022 (pgaudit), DB-025 (advisors) são pré-requisitos. Adicionais necessários: change management formal, access reviews trimestrais, vendor risk assessments.

### 9.3 Threat model (GAP-03)

Não existe ADR. Riscos cruzados X-1..X-10 são empíricos. **Vetores não cobertos:**
- Insider threat (admin malicioso com acesso a `usuarios` cross-tenant)
- Supply chain (npm typosquatting; sem SBOM)
- Session hijack pós-login (cookie security flags?)
- CSRF em RPCs `SECURITY DEFINER` (sem SameSite confirmado)
- Replay attack em edge functions (DB-010 cobre OAuth PKCE mas não outras)

### 9.4 Security headers (GAP-04)

CSP, HSTS, X-Frame-Options, Permissions-Policy ausentes do assessment. SRI nas tags `<link>` Google Fonts ausente (UX-019). **Risco real:** XSS via dependência comprometida sem CSP = full takeover de sessão.

---

## 10. Recomendações Finais

### 10.1 Para @architect (FASE 8 — finalização)

1. **Incorporar Sprint 0 como bloco obrigatório no assessment final** (§1 deste review), antes de Sprint 1 técnica.
2. **Adicionar débitos GAP-01 a GAP-10** (10 novos itens) à matriz. Esforço adicional estimado: ~80h.
3. **Renumerar prioridades P0 por desbloqueio**, não só por severidade (DB-014 destrava 58 arquivos = maior prioridade que SYS-005 trivial 0.5h).
4. **Promover X-8 (observabilidade) de Alta para Crítica.** Sem ela, postmortem do próprio rollout do hardening fica cego.
5. **Adicionar X-11..X-14** ao mapa de riscos cruzados.
6. **Confirmar resolução de discordância @data-engineer §10 Q1**: DB-026 (postgres superuser scripts) é DB ou SYS? Resposta: tratar como cross (DB-026 + cross-ref a SYS-005/X-3).
7. **Aceitar a recomendação de canary/feature flag em §6** como política não-opcional para débitos críticos.
8. **Reconciliar UX-026 vs SYS-017:** consolidar em epic "Observabilidade Foundation" ou cross-reference explícita.

### 10.2 Para @analyst (FASE 9 — relatório executivo)

Ângulos para destacar a stakeholders não-técnicos:

1. **Risco de imagem:** vetor DB-016 é "vendedor mal-intencionado registra check-ins falsos para inflar ranking/comissões". Quantificar prejuízo financeiro potencial (premiações, comissionamento).
2. **Risco regulatório (LGPD):** ANPD pode aplicar até 2% do faturamento se backups com PII vazarem. Cite DB-013 e timeline desde 2026-05-03.
3. **Risco operacional:** 15 pages monolíticas + 10 god-hooks = 28k LOC concentradas. Cada feature nova arrasta regressão. Pitch: "investir 6 sprints agora previne 2 anos de débito".
4. **Comparativo de mercado:** Supabase Advisors não rodado, WCAG AA não atingido, sem observabilidade — todos são tabela-rasa em SaaS sério. Vender Sprint 0 + Sprint 1 como "maturidade enterprise".
5. **Quick-wins visíveis:** lista os <8h items que entregam valor imediato (UX-020, UX-015, DB-021, DB-025) para mostrar momentum cedo.
6. **Não vender só problemas:** os pontos fortes do código (`RoleSwitch`, ROUTE_ACCESS_RULES, `pgcrypto` em uso, RPC `submit_checkin` bem estruturada) precisam aparecer para credibilidade.

### 10.3 Para @pm (FASE 10 — epic/stories)

Critérios para slicing de stories:

1. **Cada story crítica DEVE ter:**
   - Testes T-01..T-12 relevantes citados como pré-req
   - Feature flag (se aplicável tabela §6)
   - Rollback plan (DOWN migration validada)
   - Critério de aceite mensurável (KPI da §5.3)
   - Owner único (não "team")
2. **Sprint 0 deve ser 1 epic isolado** (`EPIC-HARDENING-FOUNDATION`) com aceite verificável antes de qualquer Sprint 1 começar. Story bloqueante.
3. **DB-016 deve ser fatiado em mínimo 4 stories:**
   - Story A: inventário consumers + RPCs novas (sem deploy)
   - Story B: migrar 27 client SELECTs para RPCs (atrás de feature flag desligada)
   - Story C: REVOKE + repolicy em staging
   - Story D: canary rollout produção 1%→100%
4. **UX-001 deve ser fatiado por page** (6 stories), nunca como "decomposição genérica".
5. **Definition of Done padrão:**
   - Testes T-relacionados verdes
   - Visual diff manual aprovado se UX
   - Migration UP+DOWN validada se DB
   - Documentação atualizada (`docs/architecture/` ou `docs/runbooks/`)
   - Feature flag toggle documentado se aplicável
   - Sentry events emergiram em staging (validar instrumentação)
6. **Estimativas:** somar 25% overhead sobre estimativas DB+UX para cobrir Sprint 0 + testes + rollout. **~95h DB + ~520h UX + ~80h gaps + ~80h tests + ~54h Sprint 0 = ~830h totais** (vs 615h estimados pelos especialistas isolados).

---

## 11. Anexos

### A. Matriz de testes RBAC (5 roles × 27 rules) — high-level

5 roles: `administrador_mx`, `administrador_loja`, `gestor`, `vendedor`, `consultor`
27 ROUTE_ACCESS_RULES (`src/lib/routeAccess.ts`) × 5 roles = **135 cenários**

| Categoria | Rotas | Cenários | Esforço |
|-----------|-------|----------|---------|
| Auth (login, recover, signup) | 3 | 15 | 4h |
| Dashboard por role | 5 | 25 | 6h |
| Checkin flow | 2 | 10 | 3h |
| Agenda (admin/gerente/vendedor) | 4 | 20 | 5h |
| Consultoria (cliente/empresa) | 3 | 15 | 4h |
| Ranking/Performance | 3 | 15 | 4h |
| Notificações | 2 | 10 | 2h |
| Admin (lojas, vendedores, metas, papéis) | 5 | 25 | 6h |
| **Total** | **27** | **135** | **34h** |

**Híbrido com T-02 (16h):** total ~50h se rodar isolado. Em CI: rotular como "@rbac-matrix" e rodar só em PR que toca `routeAccess.ts`, hooks, ou `<RoleSwitch>`.

### B. Snapshots de regressão visual recomendados (prioridade)

Ordem para Sprint 0 item 0.5 e T-06:

| # | Rota/Componente | Viewport | Razão |
|---|-----------------|----------|-------|
| 1 | `MXPerformanceLanding` | 1440×900, 768×1024, 375×812 | Primeiro alvo de decomposição (UX-001) |
| 2 | `DashboardLoja` (gestor) | 1440×900, 375×812 | Página mais usada + realtime |
| 3 | `DashboardLoja` (vendedor) | 1440×900, 375×812 | Role com permissões restritas |
| 4 | `AgendaAdmin` (admin_mx) | 1440×900 | God-hook depende `useAgendaAdmin` |
| 5 | `ConsultoriaClienteDetalhe` | 1440×900 | Charts com hex hardcoded |
| 6 | `Ranking` (gestor) | 1440×900, 375×812 | Decomposição candidato Sprint 1 |
| 7 | `GerenteFeedback` | 1440×900 | Decomposição candidato Sprint 1 |
| 8 | `Checkin` (vendedor) | 375×812 | Form crítico + piloto RHF |
| 9 | Chart "Vendas vs Conversão" (ConsultoriaClienteDetalhe) | 1440×900 | UX-005 baseline antes de tokenizar |
| 10 | Chart "Margem" | 1440×900 | UX-005 |
| 11 | `<RoleSwitch>` em todas variações de role | 1440×900 | UX-016 visual contract |
| 12 | `TabNav` vs `TabNavPill` lado a lado | 1440×900 | UX-012 unificação |

**Política de threshold:** 5% pixel diff inicial; reduzir para 1% após Sprint 1 estabilizar.

### C. Resumo final

- **73 débitos consolidados** (17 SYS + 27 DB + 28 UX + 10 GAP propostos pela QA) cobrindo 5 camadas (Sistema, DB, UX, Process/CI-CD, Compliance)
- **~830h esforço total** (incluindo Sprint 0 + testes + gaps QA)
- **10-12 débitos críticos** (depende de severidade final escolhida por @architect na FASE 8)
- **14 riscos cruzados** (X-1..X-14)
- **12 testes baseline** (T-01..T-12) totalizando ~80h
- **10 itens Sprint 0** totalizando ~54h
- **Veredito gate:** **APPROVED CONDICIONAL** — pode ir para FASE 8 (@architect consolidar) DESDE QUE Sprint 0 seja explicitamente incorporada ao assessment final como bloco bloqueante de Sprint 1.

---

**Fim da revisão @qa (FASE 7).**
**Próximo passo:** @architect (FASE 8) consolida feedback de DB + UX + QA em `docs/prd/technical-debt-assessment.md` (FINAL), incorporando Sprint 0 obrigatória e os 10 gaps QA.
