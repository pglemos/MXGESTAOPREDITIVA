# Technical Debt Assessment — DRAFT
## Para Revisão dos Especialistas

**Generated:** 2026-05-16
**Agent:** @architect (Aria) — Consolidação Inicial
**Phase:** 4/10 — Brownfield Discovery
**Status:** DRAFT — Aguardando revisão de @data-engineer (FASE 5), @ux-design-expert (FASE 6), @qa (FASE 7)

> Substitui versão prévia (v2.0 / 15-abr-2026). Este DRAFT consolida as FASES 1-3 da brownfield-discovery rodada em 2026-05-16.

---

## 0. Executive Summary do DRAFT

- **Total de débitos consolidados:** 56 (SYS: 17 · DB: 19 · UX: 20)
- **Distribuição por severidade:**
  - Críticos: **10** (SYS: 2 · DB: 4 · UX: 4)
  - Altos: **15** (SYS: 2 · DB: 6 · UX: 7)
  - Médios: **20** (SYS: 8 · DB: 5 · UX: 7)
  - Baixos: **11** (SYS: 5 · DB: 4 · UX: 2)
- **Áreas mais críticas:**
  1. **Segurança multi-tenant (DB+SYS):** RLS `USING(true)` em tabelas multi-tenant críticas (`lancamentos_diarios`, `usuarios`, `vendedores_loja`) sem REVOKE explícito + backups com PII sem RLS + `.env` no working tree
  2. **Drift de tipos (SYS+DB+UX):** ausência de `database.types.ts` gerado + 30+ renames PT-BR + `@supabase/supabase-js` em devDependencies
  3. **Acoplamento de UI (UX+SYS):** 15 pages monolíticas (20.007 LOC concentradas) + 10 god-hooks (8.286 LOC) + realtime subs em pages monolíticas
- **Tema recorrente:** origem **Lovable/v0.dev** (CSS inline, pages monolíticas, FAQ inline), crescimento orgânico de schema (89 ativas + 38 legacy, rename incompleto EN→PT-BR), defense in depth fraca (RBAC client robusto mas server com `USING true`), tooling de tipos não automatizado.
- **Risco agregado:** **ALTO**. Plataforma operacional ativa em produção com dois vetores críticos abertos simultaneamente: (a) bypass de RLS via PostgREST direto em check-ins (DB-016), (b) leak silencioso de tipos PT-BR↔EN após renames recentes (DB-014/UX-004).

---

## 1. Débitos de Sistema (FASE 1 — @architect)

Validado por @architect (auto-review)

| ID | Débito | Severidade | Categoria | Notas |
|----|--------|-----------|-----------|-------|
| SYS-001 | Três lockfiles coexistindo (`package-lock.json`, `bun.lock`, `deno.lock`) | Alta | dependencies | `deno.lock` é legítimo (edge functions); npm+bun gera ambiguidade. `bunfig.toml` sugere bun como canônico |
| SYS-002 | Stack de documentos redundante: `jspdf` + `html2pdf.js` + `xlsx` + `exceljs` | Média | dependencies | Cada vendor chunk em `vite.config.ts` confirma uso. Consolidar |
| SYS-003 | Pages monolíticas: `MXPerformanceLanding.tsx` (1.698 LOC), `DashboardLoja.tsx` (1.409), `AgendaAdmin.tsx` (1.318), `ConsultoriaClienteDetalhe.tsx` (953), `Ranking.tsx` (854), `GerenteFeedback.tsx` (809) | Alta | coupling | Decompor em features/hooks/componentes. Sinal de origem Lovable/v0 |
| SYS-004 | Hook `useAgendaAdmin.ts` (895 LOC) e `lib/consultoria/pmr-engine.ts` (842 LOC) excedem limite saudável | Média | coupling | God-objects de lógica |
| SYS-005 | `@supabase/supabase-js` em **devDependencies** sendo runtime-critical | **Crítica** | config | Mover para `dependencies`. Risco real em deploy sem dev deps |
| SYS-006 | Atomic Design parcial: `src/components/` mistura `atoms/molecules/organisms` com `admin/` e `providers/` | Baixa | patterns | Padronizar ou documentar exceções |
| SYS-007 | Testes excluídos do `tsc --noEmit` principal | Média | tests | Type errors silenciosos em testes. Adicionar `tsconfig.test.json` |
| SYS-008 | 89 migrations + 38 legacy sem schema consolidado em `docs/architecture/` | Média | docs | FASE 2 cobriu; resta consolidar referências |
| SYS-009 | 62 arquivos `testsprite_tests/` paralelos a `e2e/` (Playwright nativo) | Baixa | tests | Possível duplicação de cobertura E2E |
| SYS-010 | `@types/node ^25.3.1` aponta para Node ainda não LTS; `engines.node` é `>=20 <25` | Baixa | dependencies | Inconsistência |
| SYS-011 | Playwright dessincronizado: runtime `1.59.1` vs `@playwright/test 1.58.2` | Baixa | dependencies | Alinhar |
| SYS-012 | `.env` no working tree (modo `-rw-------`) | **Crítica** (a confirmar) | config | Verificar `.gitignore` e histórico. Se commitado, rotacionar TODAS as keys |
| SYS-013 | 1 único primitive `@radix-ui/react-dialog` listado; `src/components/ui/` provavelmente usa mais | Média | dependencies | Auditar deps fantasma |
| SYS-014 | `whatsapp-service/` no monorepo sem workspace declarado | Média | structure | Considerar bun/npm workspaces ou extrair |
| SYS-015 | `scratch/`, `tmp/`, `output/`, `node-compile-cache/` no working tree | Baixa | structure | Verificar `.gitignore` |
| SYS-016 | Coexistem `docs/architecture.md` (arquivo), `docs/brownfield-architecture.md` e `docs/architecture/` (pasta) | Baixa | docs | Risco de confusão |
| SYS-017 | `SENTRY_DSN` em env mas inicialização não confirmada no código | Média | observability | Auditar setup de error tracking |

**Subtotal SYS:** 2 Crítica · 2 Alta · 8 Média · 5 Baixa = **17 débitos sistêmicos**.

---

## 2. Débitos de Database (FASE 2 — @data-engineer)

PENDENTE: Revisão final do @data-engineer na FASE 5

| ID | Débito | Severidade | Categoria | Esforço (h) | Notas |
|----|--------|-----------|-----------|-------------|-------|
| DB-001 | `submit_checkin` não valida `vendedores_loja.is_active` | Crítica | rpc | 1 | Vendedor encerrado mas com vínculo ativo lança check-in |
| DB-002 | `EXCEPTION WHEN others ... SQLERRM` em todas RPCs novas vaza estrutura interna | Crítica | rpc/security | 2 | Substituir por mensagem genérica + log em `logs_auditoria` |
| DB-013 | Tabelas `migration_backup_*_20260503` SEM RLS contendo PII histórica | Crítica | rls/cleanup | 1 | Validar e DROP |
| DB-016 | `lancamentos_diarios` com `USING(true)` sem REVOKE explícito | Crítica | rls | 2 | Confirmar GRANT e endurecer policy/REVOKE |
| DB-005 | Falta UNIQUE constraint em `lojas.cnpj` | Alta | constraint | 0.5 | Adicionar `UNIQUE NULLS NOT DISTINCT` |
| DB-006 | Coexistência de helpers EN (`is_admin`, `is_member_of`) e PT-BR (`eh_administrador_mx`, `tem_papel_loja`) | Alta | refactor | 8 | Plano de deprecação, atualizar policies, drop legados |
| DB-008 | `store-pre-registration` público sem rate limit/captcha | Alta | edge/security | 4 | Adicionar throttle por IP + reCAPTCHA |
| DB-011 | `compute_dre` overloaded em 2 nomes de tabela (rename incompleto) | Alta | refactor/migration | 2 | Dropar versão antiga após confirmação |
| DB-014 | Ausência confirmada de `database.types.ts` gerado por Supabase CLI | Alta | tooling | 1 | Adicionar `supabase gen types typescript --linked` ao pipeline |
| DB-017 | 12 RPCs `SECURITY DEFINER` SEM `SET search_path` (CVE-2018-1058 family) | Alta | security | 3 | Listar e corrigir |
| DB-003 | `update_my_profile` aceita `phone/avatar_url` sem validar formato | Média | rpc/validation | 1 | Regex E.164 e URL |
| DB-007 | `admin_create_store` aceita `manager_email` sem validar formato | Média | rpc/validation | 0.5 | Regex de email |
| DB-009 | CORS `Allow-Origin: *` em todas edge functions | Média | edge/cors | 1 | Restringir em prod ao domínio do app |
| DB-012 | Sem tabela de consentimento LGPD nem rotina de right-to-erasure | Média | compliance | 16 | Levantar requisitos jurídicos e desenhar |
| DB-015 | 21 FKs sem `ON DELETE` explícito (default RESTRICT) | Média | data-integrity | 3 | Auditar e definir CASCADE/SET NULL caso a caso |
| DB-004 | `complete_password_change` confia que client trocou senha antes | Baixa | rpc/doc | 0.5 | Documentar contrato no JSDoc do client |
| DB-010 | Confirmar validação de `state` PKCE no `google-oauth-handler` em todos paths | Baixa | edge/oauth | 1 | Code review |
| DB-018 | Indexes faltantes IDX-001..IDX-006 (vide SCHEMA.md §4) | Baixa | performance | 3 | Validar com EXPLAIN antes de criar |
| DB-019 | `role_assignments_audit` e `store_meta_rules_history` sem RLS | Baixa→Alta | rls | 1 | Habilitar RLS com policy admin-only / por store_id |

**Subtotal DB:** 4 Crítica · 6 Alta · 5 Média · 4 Baixa = **19 débitos**. Esforço total estimado: ~50h.

---

## 3. Débitos de Frontend/UX (FASE 3 — @ux-design-expert)

PENDENTE: Revisão final do @ux-design-expert na FASE 6

| ID | Débito | Severidade | Categoria | Esforço (h) | Impacto UX | Notas |
|----|--------|-----------|-----------|-------------|-----------|-------|
| UX-001 | Pages monolíticas (15 pages >500 LOC) | Crítica | components | 80-120 | Manutenibilidade, regressões | Decompor em sections + hooks orquestradores |
| UX-002 | God-hooks (10 hooks >300 LOC, 5.328 LOC top-10) | Crítica | state | 60-90 | Re-renders amplos, testabilidade zero | Split por responsabilidade |
| UX-003 | `MXPerformanceLanding` (1.698 LOC) CSS inline + FAQ inline — origem Lovable provável | Crítica | components/DS | 24-40 | Drift visual, sem reuso de tokens | Extrair para `src/features/marketing/` |
| UX-004 | `database.types.ts` ausente; tipos PT-BR manuais (`src/types/database.ts` 610 LOC) | Crítica | state | 8 | Erros runtime após renames DB | Configurar `supabase gen types typescript` em CI |
| UX-005 | Charts recharts com hex hardcoded em `ConsultoriaClienteDetalhe.tsx:170-179` | Alta | design-system | 4 | Drift visual, dark mode futuro impossível | Criar paleta `chart-*` no `@theme` |
| UX-006 | `lint-tokens.js` whitelist desconectada do `@theme` real | Alta | design-system | 6 | Drift silencioso CSS↔linter | Gerar arrays do AST de `src/index.css` |
| UX-007 | a11y: 4 `<img>` sem alt; contraste `text-tertiary`; charts sem `aria-label`; tabelas raw sem `<th scope>` | Alta | a11y | 24-32 | Reprovação WCAG AA | Auditoria sistemática + `eslint-plugin-jsx-a11y` |
| UX-008 | Skeleton coverage 16,6% (7/42 pages) | Alta | state | 32-48 | CLS, percepção de lentidão | Skeleton-per-route padronizado |
| UX-009 | Sem `react-hook-form` → 30+ forms manuais com validação ad-hoc | Alta | forms | 40-60 | Bugs validação, UX inconsistente | Adotar RHF + integração com zod existentes |
| UX-010 | Realtime subscriptions em pages monolíticas (DashboardLoja, RotinaGerente, Notificacoes) sem garantia de cleanup | Alta | state | 16-24 | Memory leaks, double-fires | Centralizar em hooks dedicados |
| UX-011 | Sem i18n (PT-BR hardcoded; 0 `useTranslation`) | Média | i18n | 60-100 | Bloqueia internacionalização | Definir estratégia (i18next vs LinguiJS) |
| UX-012 | `TabNav` + `TabNavPill` duplicados | Média | components | 4 | Dúvida qual usar | Unificar via variant `cva` |
| UX-013 | Atomic Design + Features coexistem sem regra | Média | architecture | 8 | Drift, duplicação latente | ADR + boundary docs |
| UX-014 | `selfDestroying` PWA anula benefícios offline | Média | perf | 16 | Sem offline real | Decidir PWA real vs SPA-with-manifest |
| UX-015 | `eslint.config.js` sem `jsx-a11y` / `react-hooks` confirmado | Média | a11y/quality | 4 | Regressões a11y, hooks rules | Adicionar plugins |
| UX-016 | `<RoleSwitch>` decide UI mas hooks subjacentes podem disparar antes | Média | security/state | 8-16 | Vazamento dados RBAC client-side | Auditar `useAgendaAdmin`, `useNetworkPerformance` |
| UX-017 | Suspense fallback único `<Spinner />` para 37 lazy routes | Média | perf | 8 | Layout shift | Skeleton-per-route shell |
| UX-018 | `Textarea`, `Button` size xs usam arbitrary values escapando do lint | Baixa | design-system | 2 | Inconsistência | Adicionar tokens `text-mx-tiny`, `min-h-mx-textarea` |
| UX-019 | Google Fonts via CDN sem fallback local | Baixa | perf | 4 | FOIT em redes lentas | self-host com `font-display: swap` |
| UX-020 | `chunkSizeWarningLimit: 1000` mascara bundles inchados | Baixa | perf | 1 | Falha de visibilidade | Reduzir para 500 |

**Subtotal UX:** 4 Crítica · 7 Alta · 7 Média · 2 Baixa = **20 débitos**. Esforço estimado: 399-577h.

---

## 4. Riscos Cruzados (cross-camada) — Contribuição Única do Consolidador

Esta seção identifica débitos que se **reforçam mutuamente** entre camadas e não foram vistos isoladamente pelos especialistas.

| # | Risco Cruzado | Débitos Envolvidos | Camadas | Severidade Agregada |
|---|---------------|--------------------|---------|---------------------|
| **X-1** | **Drift de tipos PT-BR↔EN após renames** — DB renomeou 30+ tabelas (EN→PT-BR), helpers EN e PT-BR coexistem, sem `database.types.ts` gerado, tipos manuais em `src/types/database.ts` (610 LOC), testes fora do `tsc --noEmit` principal. Resultado: erros silenciosos em runtime quando código continua chamando nomes EN antigos | DB-006, DB-011, DB-014, UX-004, SYS-007, SYS-008 | DB + FE + SYS | **CRÍTICA** |
| **X-2** | **Bypass efetivo de RLS via PostgREST** — `lancamentos_diarios`, `usuarios`, `vendedores_loja` com `USING(true)` sem REVOKE confirmado + RBAC client-side robusto mas server gate frágil + `<RoleSwitch>` decide UI mas hooks (`useAgendaAdmin`) podem disparar queries antes do bloqueio | DB-016, DB-019, UX-016, SYS-005 | DB + FE | **CRÍTICA** |
| **X-3** | **Vazamento potencial de secrets em deploy** — `.env` no working tree + `@supabase/supabase-js` em devDependencies + CORS wildcard + scripts admin (`postgres@3.4.8`) usando POSTGRES_URL direto bypassando RLS | SYS-005, SYS-012, DB-009, DB-008 | SYS + DB | **CRÍTICA** |
| **X-4** | **Pages monolíticas + god-hooks + realtime leak** — Pages 1.698 LOC com realtime subscriptions + hook `useAgendaAdmin` 895 LOC + sem cleanup garantido + Suspense fallback único = memory leak provável + re-render amplo cascateando | UX-001, UX-002, UX-010, SYS-003, SYS-004 | FE + SYS | **ALTA** |
| **X-5** | **Gate 09:45 sem defesa em profundidade real** — Gate é client-side (`useCheckins.ts:11,66`), `submit_checkin` valida janela SE chamada, mas tabela `lancamentos_diarios` aceita INSERT direto via PostgREST por RLS `USING(true)`. Manipulação de relógio do cliente OU INSERT direto burla gate | DB-001, DB-016, UX-010, SYS-007 | DB + FE | **ALTA** |
| **X-6** | **LGPD multi-camada exposta** — PII em backups sem RLS + sem consentimento + sem right-to-erasure + frontend sem audit trail de quem viu dados + `logs_acesso_sensivel` existe mas dependente de helpers EN/PT-BR mistos | DB-012, DB-013, DB-006, SYS-017 | DB + SYS + Compliance | **ALTA** |
| **X-7** | **Design system não enforce-ável** — `lint-tokens.js` whitelist desconectada do `@theme` + charts hex hardcoded + atoms duplicados (`TabNav`/`TabNavPill`) + sem ADR Atomic vs Features + componentes feature-specific competindo com organisms | UX-005, UX-006, UX-012, UX-013, UX-018, SYS-006 | FE + SYS | **MÉDIA** |
| **X-8** | **Observabilidade quase nula** — SENTRY_DSN existe mas init não confirmado + `EXCEPTION WHEN others SQLERRM` vaza estrutura + edge functions sem telemetria estruturada + sem audit visível dos 60 triggers | SYS-017, DB-002 | SYS + DB | **ALTA** |
| **X-9** | **Forms grandes sem validação consistente** — 30+ forms manuais sem `react-hook-form` + RPCs aceitam phone/email/avatar sem validar formato (DB-003, DB-007) + zod existe mas não conectado em forms = bug surface dupla (client OK, server OK, meio falha) | UX-009, DB-003, DB-007 | FE + DB | **MÉDIA** |
| **X-10** | **PWA `selfDestroying` + cold start + bundles grandes** — Cache descartado a cada deploy + chunks de 1MB tolerados + Google Fonts CDN sem fallback + Suspense fallback único = cold first-load lento e CLS perceptível pós-deploy | UX-014, UX-019, UX-020, UX-017 | FE | MÉDIA |

---

## 5. Matriz Preliminar de Priorização

Critérios: **Risco × Impacto × Custo de não-resolver** (estimativas em horas)

| Rank | ID | Débito | Severidade | Categoria | Esforço (h) | Prioridade |
|------|----|--------|-----------|-----------|-------------|------------|
| 1 | DB-016 | `lancamentos_diarios` USING(true) sem REVOKE | Crítica | rls | 2 | **P0 — Imediato** |
| 2 | DB-013 | Backups com PII sem RLS | Crítica | rls/cleanup | 1 | **P0 — Imediato** |
| 3 | DB-001 | `submit_checkin` não valida `vendedores_loja.is_active` | Crítica | rpc | 1 | **P0 — Imediato** |
| 4 | DB-002 | `EXCEPTION WHEN others SQLERRM` em RPCs novas | Crítica | rpc/security | 2 | **P0 — Imediato** |
| 5 | SYS-012 | `.env` no working tree (verificar gitignore + commit history) | Crítica | config | 2 [ESTIMAR] | **P0 — Imediato** |
| 6 | SYS-005 | `@supabase/supabase-js` em devDependencies | Crítica | config | 0.5 [ESTIMAR] | **P0 — Imediato** |
| 7 | UX-004 / DB-014 | `database.types.ts` gerado em CI | Crítica | tooling | 8 | **P0 — Imediato** |
| 8 | DB-019 | `role_assignments_audit` / `store_meta_rules_history` sem RLS | Baixa→Alta | rls | 1 | **P0 — Imediato** |
| 9 | DB-017 | 12 RPCs SECURITY DEFINER sem `SET search_path` | Alta | security | 3 | **P1 — Sprint** |
| 10 | DB-008 | `store-pre-registration` sem rate limit | Alta | edge/security | 4 | **P1 — Sprint** |
| 11 | UX-016 | `<RoleSwitch>` + hooks pré-mount (bypass RBAC) | Média | security | 8-16 | **P1 — Sprint** |
| 12 | DB-006 | Helpers EN ↔ PT-BR coexistem | Alta | refactor | 8 | **P1 — Sprint** |
| 13 | DB-011 | `compute_dre` overloaded | Alta | refactor | 2 | **P1 — Sprint** |
| 14 | DB-005 | `lojas.cnpj` sem UNIQUE | Alta | constraint | 0.5 | **P1 — Sprint** |
| 15 | UX-007 | a11y crítico (alt, contraste, charts, tabelas) | Alta | a11y | 24-32 | **P1 — Sprint** |
| 16 | UX-010 | Realtime subscriptions sem cleanup | Alta | state | 16-24 | **P1 — Sprint** |
| 17 | UX-003 / SYS-003 | `MXPerformanceLanding` decompor (piloto Lovable) | Crítica | coupling | 24-40 | **P2 — Roadmap** |
| 18 | UX-001 / SYS-003 | Demais pages monolíticas (14 restantes) | Crítica | coupling | 56-80 | **P2 — Roadmap** |
| 19 | UX-002 / SYS-004 | God-hooks split | Crítica/Média | state | 60-90 | **P2 — Roadmap** |
| 20 | UX-008 | Skeleton coverage | Alta | state | 32-48 | **P2 — Roadmap** |
| 21 | UX-009 | Adoção `react-hook-form` | Alta | forms | 40-60 | **P2 — Roadmap** |

**Resumo P0 (imediato):** 8 itens, ~17.5h — todos podem ser resolvidos em uma sprint de hardening focada em segurança e tooling.

---

## 6. Padrões Sistêmicos Identificados

### 6.1 Origem Lovable/v0.dev
**Evidências:** `MXPerformanceLanding.tsx` (1.698 LOC com CSS inline + FAQ inline + media queries hardcoded), apenas 1 primitive Radix instalado (atípico para projeto que usa Tooltip/Select/Modal), pages com tudo embutido em vez de composição. **Impacto:** drift visual, sem reuso de tokens, dark mode futuro inviável. **Recomendação:** strategy de extração progressiva — começar por landing, depois dashboard principal, depois agenda.

### 6.2 Crescimento orgânico de schema
**Evidências:** 89 migrations ativas + 38 legacy + `_archived/`, renames PT-BR aplicados parcialmente (helpers EN coexistem com PT-BR — DB-006), `compute_dre` overloaded em 2 nomes (DB-011), backups deixados sem cleanup (DB-013), 30+ renames de tabelas em maio/2026. **Impacto:** drift garantido FE↔BE, dificuldade de onboarding, regressões silenciosas. **Recomendação:** sprint de cleanup + automação `supabase gen types` + ADR de naming convention.

### 6.3 Defense in depth fraca
**Evidências:** RBAC client-side robusto (27 rules, capability matrix, `canAccessPath`) MAS server-side com `USING(true)` em tabelas multi-tenant críticas, gate 09:45 client-side sem REVOKE confirmado, `<RoleSwitch>` decide UI render-time mas hooks disparam queries antes (UX-016), CORS wildcard, edge function pública sem rate limit. **Impacto:** atacante autenticado pode bypass via PostgREST direto. **Recomendação:** auditoria GRANT/REVOKE completa + endurecer policies das top-8 tabelas críticas.

### 6.4 Falta de design system maduro
**Evidências:** tokens em `@theme` mas whitelist `lint-tokens.js` desconectada → drift silencioso; 13 atoms + 14 molecules + 7 organisms convivendo com 41 components feature-specific sem ADR; `TabNav`/`TabNavPill` duplicados; charts hex hardcoded. **Recomendação:** ADR boundary + gerar whitelist do AST + paleta `chart-*` no theme.

### 6.5 Acoplamento alto
**Evidências:** 20.007 LOC concentradas em 15 pages, 8.286 LOC em 10 hooks, realtime subscriptions DENTRO de pages monolíticas (DashboardLoja 1.409 + realtime), Suspense fallback único genérico. **Impacto:** re-renders cascateando, memory leaks prováveis, testabilidade próxima de zero. **Recomendação:** pattern `useXxxOrchestrator` + sections + container <200 LOC.

### 6.6 Observabilidade ausente/dúbia
**Evidências:** `SENTRY_DSN` no env mas init não confirmado (SYS-017), `EXCEPTION WHEN others SQLERRM` vaza interna (DB-002), sem evidência de structured logging em Edge Functions, 60 triggers sem dashboard. **Impacto:** debugging de produção difícil, postmortems incompletos.

### 6.7 Tooling fragmentado
**Evidências:** 3 lockfiles, Playwright dessincronizado, `@types/node` vs `engines.node` inconsistente, `whatsapp-service/` sem workspace, scripts admin com `postgres` direto, testes fora do `tsc`. **Impacto:** builds não-reprodutíveis, surprise breaks.

---

## 7. Perguntas para Especialistas (FASES 5-7)

### Para @data-engineer (FASE 5)

1. **Validar inventário:** Os 19 débitos DB estão completos? Severidades corretas?
2. **Adicionar débitos faltantes:** Backup strategy/RTO/RPO declarado? Auto-vacuum/analyze tuning? Connection pooling (pgBouncer/Supavisor)? `pg_stat_statements` habilitado?
3. **Estimar horas** por débito com sua expertise (SYS-005/012 ainda como estimativa cega minha)
4. **Confirmar reprodutibilidade de DB-016:** a vulnerabilidade de bypass RLS via PostgREST direto em `lancamentos_diarios` é REAL? Pode mostrar repro (`curl` autenticado fazendo INSERT)?
5. **Confirmar PII em backups (DB-013):** `migration_backup_*_20260503` ainda contém dados vivos? Pode dropar com segurança ou precisa export-then-drop?
6. **Priorização técnica:** ordem de resolução considerando **dependências entre migrations** (ex: migrar helpers EN→PT-BR antes de revogar GRANT em `lancamentos_diarios`?)
7. **Tooling de validação:** `pgaudit` instalado? `supabase advisors` (security + performance) já rodado? `pg_repack` necessário para tabelas históricas?
8. **Edge Functions:** rate limiting via Supabase Auth ou middleware próprio? Logs estruturados?

### Para @ux-design-expert (FASE 6)

1. **Validar inventário:** Os 20 débitos UX estão completos? Severidades corretas?
2. **Adicionar débitos faltantes:** Dark mode strategy explícita? Motion preferences além de `MotionConfig`? i18n roadmap (espanhol/inglês)? Bundle analyzer rodado?
3. **Estimar horas** considerando refatoração + design review + visual regression baseline
4. **Decomposição viável:** as 15 pages monolíticas têm caminho de migração incremental? Pode propor ordem (ex: `MXPerformanceLanding` primeiro por ser landing isolada)?
5. **Charts sem regressão visual:** trocar hex hardcoded por tokens é viável sem mudar percepção? Há baseline visual (Playwright screenshots)?
6. **Quick-wins vs grandes refatorações:** quais débitos UX entregam valor em <8h vs precisam de epic dedicada?
7. **`react-hook-form` adoption strategy:** plano de migração incremental para 30+ forms sem big-bang? Forms candidatos a piloto (Checkin.tsx)?
8. **RBAC client gap (UX-016):** confirmar quais hooks disparam queries antes do gate? Há reprodução?

### Para @qa (FASE 7)

1. **Gaps de cobertura:** áreas não cobertas que merecem débito? (observabilidade detalhada, perf benchmarks, contract tests entre edge functions e RPCs, i18n, mobile testing matrix)
2. **Riscos de regressão:** ordem proposta na §5 tem riscos? Ex: revogar GRANT em `lancamentos_diarios` quebra consumidores existentes (scripts, automation)?
3. **Dependências invertidas:** algum P0 depende de um P1/P2? Ex: gerar `database.types.ts` ANTES de mexer em RLS para evitar quebras silenciosas
4. **Pré-requisitos de teste:** que testes precisam EXISTIR antes de mexer em código?
   - Regression suite para 27 ROUTE_ACCESS_RULES × 5 roles = 135 cenários
   - RLS test matrix por tabela (especialmente `lancamentos_diarios`)
   - Gate 09:45 com manipulação de relógio (timezone America/Sao_Paulo)
   - Memory leak detection para realtime subs
5. **Quality gate:** PASS / CONCERNS / FAIL / WAIVED — baseado no DRAFT consolidado?
6. **Métricas de sucesso pós-resolução:** KPIs/SLOs/baselines? (0 violações `USING(true)` em tabelas multi-tenant, 100% types gerados em CI, score WCAG AA por rota, p95 latency edge functions)
7. **Feature flags / canary:** quais débitos exigem rollout gradual (REVOKE em `lancamentos_diarios` poderia quebrar usuários ativos)?

---

## 8. Próximos Passos (após validação)

- **FASE 5:** @data-engineer revisa seção 2 + responde §7 → `db-specialist-review.md`
- **FASE 6:** @ux-design-expert revisa seção 3 + responde §7 → `ux-specialist-review.md`
- **FASE 7:** @qa avalia gaps cross-camada + gate APPROVED/NEEDS WORK → `qa-review.md`
- **FASE 8:** @architect (eu) consolido feedback em `technical-debt-assessment.md` (FINAL)
- **FASE 9:** @analyst gera relatório executivo (`TECHNICAL-DEBT-REPORT.md`)
- **FASE 10:** @pm cria epic + stories prontas para desenvolvimento

---

## 9. Anexos

### A. Mapeamento de IDs por camada
- **SYS-001 a SYS-017** → Sistema (@architect, FASE 1)
- **DB-001 a DB-019** → Database (@data-engineer, FASE 2)
- **UX-001 a UX-020** → Frontend/UX (@ux-design-expert, FASE 3)

### B. Documentos de referência (inputs deste DRAFT)
- `docs/architecture/system-architecture-brownfield-2026-05-16.md` (FASE 1)
- `supabase/docs/SCHEMA.md` (FASE 2)
- `supabase/docs/DB-AUDIT.md` (FASE 2)
- `docs/frontend/frontend-spec.md` (FASE 3)

### C. Convenções deste DRAFT
- Toda entrada nas tabelas das §§1-3 vem **diretamente** dos documentos de input (Article IV — No Invention)
- Riscos cruzados (§4) são **contribuição única do consolidador** (combinam débitos já identificados)
- Estimativas marcadas `[ESTIMAR]` aguardam especialista da fase correspondente
- Severidades respeitam classificação dos especialistas originais
