# UX Specialist Review
**Reviewer:** @ux-design-expert (Uma) | **Date:** 2026-05-16 | **Phase:** 6/10
**DRAFT revisado:** `docs/prd/technical-debt-DRAFT.md` (Generated 2026-05-16)
**Inputs cruzados:** `docs/frontend/frontend-spec.md`, `docs/reviews/db-specialist-review.md`

> Esta revisão SUBSTITUI versão prévia v2.0 (15-abr-2026). Recalibrada para a estrutura UX-001..UX-020 do novo DRAFT e respondendo as 7 perguntas do @architect (DRAFT §7).

---

## 1. Executive Summary

- **Validados:** 20/20 confirmados (severidades ajustadas em 3, esforço refinado em todos)
- **Adicionados:** 8 novos débitos (UX-021..UX-028) cobrindo dark mode, motion preferences, i18n roadmap, focus traps, skeleton screens detalhados, error boundaries, web vitals, bundle analyzer
- **Total final UX:** **28 débitos** (4 Crítica · 9 Alta · 11 Média · 4 Baixa)
- **Esforço total UX:** **520-720h** (range alto reflete decomposição + a11y + i18n)
- **Maturidade design system:** 2/5 (atual) → 4/5 (após plano)
- **Recomendação Gate QA (FASE 7):** **APPROVED viável** condicionado a Sprint 0 (P0 hardening tooling: gerar `database.types.ts`, lint a11y, focus traps), SEM a qual gate deve ser **NEEDS WORK**.

---

## 2. Validação dos 20 Débitos

| ID | Status | Sev orig→final | Esforço(h) | Impacto UX | Design Review? | Justificativa |
|----|--------|----------------|-----------|------------|----------------|---------------|
| UX-001 | ✅ Confirmado | Crítica→Crítica | 100 (mid) | Funcional + manutenibilidade | SIM | 6 pages ≥809 LOC confirmadas (`MXPerformanceLanding` 1698, `DashboardLoja` 1409, `AgendaAdmin` 1318, `ConsultoriaClienteDetalhe` 953, `Ranking` 854, `GerenteFeedback` 809). Estratégia incremental viável — ver §4.1 |
| UX-002 | ✅ Confirmado | Crítica→Crítica | 75 | Funcional (re-renders) | NÃO | `useAgendaAdmin.ts` 895 LOC, `useAuth.tsx` 585, `useCheckins.ts` 318 confirmados. Split por responsabilidade — ver §4.2 |
| UX-003 | ✅ Confirmado | Crítica→Crítica | 32 | Visual + DS | SIM (baseline) | Landing isolada, primeiro candidato de migração (sem dependências internas de hooks da app) |
| UX-004 | ✅ Confirmado | Crítica→Crítica | 12 (gen) + 24 (migrate) | Funcional (drift) | NÃO | 58 arquivos importam `src/types/database` — blast radius alto. Ver §4.4 |
| UX-005 | ✅ Confirmado | Alta→Alta | 6 | Visual (futuro dark) | SIM (baseline) | `ConsultoriaClienteDetalhe.tsx:170-179` confirma 5+ hex literais. Ver §4.3 |
| UX-006 | ✅ Confirmado | Alta→Alta | 8 | Drift silencioso | NÃO | Whitelist gera AST: 1-shot tool |
| UX-007 | ✅ Confirmado | Alta→Alta | 32 | a11y (compliance) | SIM | WCAG AA é mandatório — ver §9 |
| UX-008 | ✅ Confirmado | Alta→Alta | 40 | Perf percebida (CLS) | SIM | 7/42 pages com skeleton; padrão por route |
| UX-009 | ✅ Confirmado | Alta→Alta | 50 | Funcional + UX | NÃO | 30+ forms; ver §8 (plano faseado) |
| UX-010 | ⬆️ Elevado | Alta→**Crítica** | 24 | Funcional (memory leak) | NÃO | Realtime em pages monolíticas + cross-link com X-5 (gate 09:45) eleva severidade |
| UX-011 | ✅ Confirmado | Média→Média | 80 (mid) | Bloqueio expansão | NÃO | Adiar P3 — sem urgência de mercado declarada |
| UX-012 | ✅ Confirmado | Média→Média | 4 | DS coerência | SIM (visual diff) | Quick-win |
| UX-013 | ✅ Confirmado | Média→Média | 8 | Drift arquitetural | NÃO | ADR + boundary lint |
| UX-014 | ✅ Confirmado | Média→Média | 16 | Offline + cold start | SIM (UX decision) | Decisão produto: PWA real ou SPA-manifest |
| UX-015 | ✅ Confirmado | Média→Média | 4 | Quality gate | NÃO | Quick-win |
| UX-016 | ⬆️ Elevado | Média→**Alta** | 12 | Segurança (RBAC bypass) | NÃO | Conexão direta com DB-016/X-2. Confirma db-review §4.1 — eleva |
| UX-017 | ✅ Confirmado | Média→Média | 8 | Perf percebida (CLS) | SIM | Compor com UX-008 |
| UX-018 | ✅ Confirmado | Baixa→Baixa | 2 | DS coerência | NÃO | Quick-win |
| UX-019 | ✅ Confirmado | Baixa→Baixa | 4 | FOIT | NÃO | self-host + `font-display: swap` |
| UX-020 | ✅ Confirmado | Baixa→Baixa | 1 | Visibilidade perf | NÃO | Reduzir para 500kb |

**Total revisado:** 4 Crítica · 7 Alta · 7 Média · 2 Baixa = 20 débitos (3 ajustes de severidade: UX-010 ↑, UX-016 ↑). **Esforço:** ~440h (mid).

---

## 3. Débitos Adicionados (UX-021..UX-028)

| ID | Débito | Severidade | Categoria | Esforço(h) | Impacto | Evidência |
|----|--------|-----------|-----------|-----------|---------|-----------|
| UX-021 | **Dark mode strategy ausente** — sem `dark:` variants, sem token semântico `bg/fg/border`, charts com hex hardcoded inviabilizam | Média | design-system | 24 | Bloqueia feature comum | Nenhuma classe `dark:` em `src/components`; charts UX-005 |
| UX-022 | **Motion preferences além de MotionConfig** — animações Tailwind (`animate-pulse`, `transition-*`) não respeitam `prefers-reduced-motion` automaticamente em todos pontos | Média | a11y | 6 | a11y (vestibular) | Adicionar `motion-reduce:` utilitários + audit |
| UX-023 | **i18n roadmap (decisão arquitetural)** — sem ADR de provider (i18next vs LinguiJS vs Format.js), sem string externalization pipeline | Média | i18n | 8 (ADR) | Bloqueia UX-011 | Pré-requisito de UX-011 |
| UX-024 | **Focus trap em modais/drawers** — Radix Dialog não está em uso (apenas 1 primitive instalado); modais custom sem focus trap garantido | Alta | a11y | 8 | a11y crítica (WCAG 2.1.2) | Sobreposto com UX-007 mas merece ID próprio para tracking |
| UX-025 | **Error boundaries ausentes por rota** — 1 erro derruba sub-árvore inteira; sem fallback graceful | Alta | resilience | 12 | UX em produção | Adicionar `<RouteErrorBoundary>` por lazy route |
| UX-026 | **Web Vitals não monitorados** — sem `reportWebVitals` ou integração Sentry/Posthog; sem baseline LCP/INP/CLS | Média | perf/observability | 6 | Sem visibilidade perf real | Integra com SYS-017 (Sentry init) |
| UX-027 | **Bundle analyzer não rodado** — `rollup-plugin-visualizer` ausente; chunks 1MB tolerados (UX-020) sem visibilidade | Média | perf | 2 | Otimização cega | Quick-win combo com UX-020 |
| UX-028 | **Skeleton screens detalhados (specs por feature)** — UX-008 cobre coverage; falta padrão de skeleton fidelidade (match real layout) | Baixa | design-system | 16 | Polish | Padrão `<Skeleton variant="card-checkin">` etc. |

**Subtotal adicionados:** 0 Crítica · 2 Alta · 5 Média · 1 Baixa = **8 débitos**. **Esforço:** ~82h.

**Total final UX:** **28 débitos** · **~520h** (mid range, exclui UX-011 i18n que pode ser P3 a 100h).

---

## 4. Análise das Propostas Críticas

### 4.1 UX-001 — Decomposição de Pages Monolíticas

**Estratégia incremental viável: SIM.**

**Ordem de ataque proposta:**
1. **`MXPerformanceLanding.tsx` (1698 LOC)** — PRIMEIRO. Razões: (a) landing pública, sem hooks compartilhados com app autenticado → blast radius isolado; (b) origem Lovable clara; (c) baseline visual fácil (Playwright screenshot single route).
2. **`ConsultoriaClienteDetalhe.tsx` (953 LOC)** — feature recente, ainda morna na cabeça do time; charts hardcoded (UX-005) podem ser corrigidos junto.
3. **`Ranking.tsx` (854 LOC)** — usa `useRanking.ts` (já hook dedicado) → decomposição mecânica em sections.
4. **`GerenteFeedback.tsx` (809 LOC)** — fluxo bem delimitado.
5. **`DashboardLoja.tsx` (1409 LOC)** — DEIXAR POR ÚLTIMO entre dashboards: tem realtime subs (X-4), múltiplos hooks, alta visibilidade. Migrar APÓS UX-002 (god-hooks split).
6. **`AgendaAdmin.tsx` (1318 LOC)** — depende do split de `useAgendaAdmin.ts` (895 LOC) primeiro.

**Padrão de extração:**
```
pages/Foo.tsx (container <200 LOC, orquestra)
└── features/foo/
    ├── hooks/useFooOrchestrator.ts   (compõe sub-hooks)
    ├── sections/FooHeader.tsx
    ├── sections/FooStats.tsx
    ├── sections/FooTable.tsx
    └── components/...
```

**Regression risk + mitigação:**
- Risco visual: ALTO (sem baseline atual). Mitigação: snapshot Playwright PRÉ-refactor (`pnpm playwright test --update-snapshots`) → diff PÓS.
- Risco funcional: MÉDIO. Mitigação: extrair sem mudar lógica (pure move + import update), validar com E2E existentes.
- Tooling: `react-error-boundary` (UX-025) por section para conter falhas durante migração.

### 4.2 UX-002 — Split de God-Hooks

**Ordem de split (por hook, priorização por risco):**

| Hook | LOC | Sub-hooks propostos | Estratégia |
|------|-----|---------------------|------------|
| `useAgendaAdmin.ts` | 895 | `useAgendaQuery`, `useAgendaMutations`, `useAgendaFilters`, `useAgendaRealtime` | Extract → criar shim que re-exporta → migrar consumers → DELETE original |
| `useAuth.tsx` (Provider) | 585 | `useAuthSession`, `useAuthProfile`, `useAuthRoles`, `<AuthProvider>` slim | Mais delicado: provider central. Refactor com TESTS FIRST (já existe `useCheckins.test.ts` como padrão) |
| `useCheckins.ts` | 318 | `useCheckinsList`, `useCheckinsSubmit`, `useCheckinsFilters` | JÁ tem teste — refactor seguro. Piloto recomendado |
| `useTeam.ts` (~625 declarado DRAFT) | - | A confirmar | Aguardar análise antes de split |

**Estratégia geral:**
```
1. Criar sub-hooks em arquivo separado
2. Hook original importa e re-exporta API pública (shim)
3. Testes passam (mesmo API)
4. Migrar consumers para sub-hooks específicos (commits granulares)
5. Quando 0 consumers do original → DELETE
```

**Piloto:** `useCheckins.ts` (menor + JÁ testado em `useCheckins.test.ts`).

### 4.3 UX-005 — Charts com hex hardcoded

**Mapeamento hex → token semântico:**

| Hex atual | Uso | Token proposto |
|-----------|-----|----------------|
| `#E5E7EB` | CartesianGrid stroke | `--color-chart-grid` (= `border` / `gray-200`) |
| `#6B7280` | Axis ticks | `--color-chart-axis` (= `text-tertiary`) |
| `#0D3B2E` | Line "Vendas" | `--color-chart-primary` (= brand-mx-dark) |
| `#22C55E` | Line "Conversão" / "right axis" | `--color-chart-success` |
| `#FACC15` | Line "Margem" | `--color-chart-warning` |
| `#EF4444` | Line "Estoque" | `--color-chart-danger` |

**Risco regressão visual:** BAIXO se token mapeia para o mesmo hex. MÉDIO se aproveitamos para alinhar com paleta semântica existente.

**Ferramenta de baseline:** Playwright screenshots por chart (`tests/visual/charts/*.spec.ts`) ANTES + diff PÓS via `pixelmatch`.

**Esforço por chart:** ~20min substituição mecânica + 1h baseline/diff total. Restante para padronizar paleta `chart-*` no `@theme`.

### 4.4 UX-004 — Gerar `database.types.ts`

**Comando:**
```bash
supabase gen types typescript --linked --schema public > src/types/database.generated.ts
```

**Blast radius:** **58 arquivos** importam `@/types/database` (confirmado via grep). Riscos:
- Nomes de tabelas PT-BR vs EN (DB-006/X-1) → types gerados refletirão estado ATUAL do DB (PT-BR). Código que ainda chama nome EN antigo: type error EXPLÍCITO (era silencioso antes).
- `src/types/database.ts` (610 LOC manual) compete com gerado.

**Plano faseado:**
1. **Sprint 0 (P0):** gerar como `database.generated.ts` (arquivo separado), NÃO substituir `database.ts` ainda.
2. Adicionar CI step `pnpm typecheck` rodando com generated → lista TODOS os erros (mapeamento PT-BR↔EN).
3. **Sprint 1:** corrigir batch por feature (checkins, agenda, ranking…).
4. **Sprint 2:** quando typecheck limpo → renomear `database.generated.ts` → `database.ts` (deletar manual).
5. CI bloqueia drift: `supabase gen types` no GitHub Action, falha se diff vs commit.

**Segurança:** SIM, seguro fazer EM PARALELO com refactors UX, desde que `database.ts` manual permaneça enquanto migra-se gradual. Pré-requisito de X-1 resolvido.

---

## 5. Respostas às 7 Perguntas do @architect (DRAFT §7)

**Q1. Os 20 débitos UX estão completos?**
Quase. Adicionei 8 (UX-021..028) — total 28. Dark mode, motion, i18n ADR, focus trap, error boundaries, web vitals, bundle analyzer, skeleton specs.

**Q2. Débitos faltantes?**
Cobertos em §3: UX-021 (dark mode), UX-022 (motion além MotionConfig), UX-023 (i18n ADR pré-UX-011), UX-026 (web vitals), UX-027 (bundle analyzer).

**Q3. Estimar horas considerando refatoração + design review + visual regression baseline?**
~520h mid (range 440-720h). Inclui: refatoração (210h), a11y (50h), forms RHF (50h), DS hardening (30h), perf/PWA (40h), i18n (80h opcional P3), design review reviews (~30h distribuídos), baselines visuais (~30h).

**Q4. Decomposição viável e ordem?**
SIM. Ordem detalhada em §4.1: Landing → ConsultoriaClienteDetalhe → Ranking → GerenteFeedback → DashboardLoja (depende UX-002) → AgendaAdmin (depende useAgendaAdmin split).

**Q5. Charts sem regressão visual?**
SIM viável. Ferramenta: Playwright + pixelmatch. Mapeamento detalhado em §4.3.

**Q6. Quick-wins vs grandes refatorações?**
Quick-wins (<8h cada, top 5):
1. UX-020 — chunkSizeWarningLimit (1h)
2. UX-018 — text-mx-tiny tokens (2h)
3. UX-015 — eslint plugins jsx-a11y (4h)
4. UX-012 — TabNav unificar (4h)
5. UX-019 — self-host fonts (4h)

Grandes (>40h): UX-001, UX-002, UX-008, UX-009.

**Q7. `react-hook-form` adoption strategy?**
Estratégia greenfield-first em §8. Piloto recomendado: **`Checkin.tsx`** (form crítico, tem teste, pequeno).

**Q8. RBAC client gap (UX-016)?**
Confirmado em §6 (X-2). Hooks suspeitos: `useAgendaAdmin`, `useNetworkPerformance`, `useNetworkHierarchy`, `useRanking` — todos fazem `.from('lancamentos_diarios')` ou similares ANTES de qualquer gate de role (apenas filtros `eq('store_id', …)`). Combinado com DB-016 (USING true): RBAC client é única defesa = NÃO É defesa.

---

## 6. Avaliação dos Riscos Cruzados

**X-1 — Drift de tipos PT-BR↔EN.** CONFIRMADO crítico. 58 arquivos consumidores. Plano em §4.4. Bloqueador de Sprint 1.

**X-2 — Bypass RBAC efetivo.** CONFIRMADO crítico. Cross-evidência: DB-016 (USING true) + UX-016 (hooks pré-gate) + 27 ocorrências `.from('lancamentos_diarios')` no client. **Recomendação:** REVOKE em `lancamentos_diarios` DEVE ser precedido por migrar SELECTs em `useRanking`, `useNetworkHierarchy`, `useNetworkPerformance`, `useCheckins` para RPCs com `SECURITY DEFINER` controlado. Sem isso: produção quebra.

**X-4 — Pages monolíticas + god-hooks + realtime leak.** CONFIRMADO alto. Mitigação: error boundaries (UX-025) por section durante decomposição.

**X-5 — Gate 09:45 sem defesa em profundidade.** CONFIRMADO alto. db-review (§4.1) demonstra repro. UX-side: `useCheckins.ts:11,66` gate client + nenhum INSERT direto detectado (só SELECTs) → INSERT bypass exige PostgREST raw. Mitigar via DB-016 fix.

**X-7 — DS não enforce-ável.** CONFIRMADO médio. UX-006 (lint-tokens AST gen) é alavanca chave.

---

## 7. Priorização UX

### Quick-Wins (Sprint 1, P0/P1) — ~25h, alto impacto
1. **UX-020** (1h) — chunkSizeWarningLimit 500kb
2. **UX-015** (4h) — eslint jsx-a11y + react-hooks (gate de regressão)
3. **UX-027** (2h) — bundle analyzer plugin
4. **UX-018** (2h) — tokens mx-tiny/mx-textarea
5. **UX-006** (8h) — lint-tokens AST-driven (destrava DS)
6. **UX-012** (4h) — unificar TabNav
7. **UX-004** (12h gen) — gerar database.types.ts (gate de toda Sprint 1)
8. **UX-022** (6h) — motion-reduce audit

### Grandes Refatorações (Sprint 2-3, P1-P2)
- **UX-001** (100h) — decomposição pages: sprint dedicada (3 sub-sprints)
- **UX-002** (75h) — god-hooks split: paralelo com UX-001
- **UX-007 + UX-024** (40h combo) — a11y WCAG AA + focus traps
- **UX-008 + UX-017 + UX-028** (60h combo) — skeleton system completo
- **UX-009** (50h) — react-hook-form migration (§8)
- **UX-005 + UX-021** (30h combo) — charts tokenizados + dark mode foundation
- **UX-025** (12h) — error boundaries por rota
- **UX-026** (6h) — web vitals + Sentry init (cross com SYS-017)

### Backlog UX (P3) — adiar com clareza
- **UX-011 + UX-023** (88h) — i18n: aguardar decisão de produto (mercado-alvo)
- **UX-013** (8h) — ADR Atomic vs Features
- **UX-014** (16h) — decisão PWA real vs SPA-manifest
- **UX-019** (4h) — self-host fonts

---

## 8. Plano de Introdução de react-hook-form + zod (UX-009)

**Estratégia greenfield-first (sem big-bang):**

1. **Adoção mandatória para forms NOVOS:** ADR + lint rule (`no-restricted-imports` para inputs sem RHF context).
2. **Adapter pattern:** `<Form>` wrapper que aceita zod schema → `useForm` interno → propaga `register/errors` via context.
3. **Migração faseada de 30+ forms existentes (ordem por criticidade):**

| Fase | Forms | Critério |
|------|-------|----------|
| Piloto | `Checkin.tsx` (form crítico, testado) | Estabelece pattern |
| Sprint 2 | Forms de Auth (Login, Cadastro, RecoverPassword) | RPCs já existem; validação E.164/email (cross DB-003/007) |
| Sprint 3 | Forms admin (CriarLoja, AdminVendedores, CriarMeta) | Validação complexa |
| Sprint 4 | Wizards (WizardPDI, OnboardingWizard) | Multi-step — usar `useFieldArray` |
| Sprint 5+ | Restante | Migração mecânica |

**Esforço total:** 50h (piloto 8h + 42h restante distribuído).

**Schemas zod:** já existem alguns em `src/lib/schemas/` (validar). Reaproveitar onde possível.

---

## 9. Plano de Acessibilidade (WCAG 2.1 AA)

**Baseline audit:** `axe-core` via Playwright (`@axe-core/playwright`) por rota crítica. Esforço: 4h setup + 4h baseline.

**Issues prioritários (UX-007 + UX-024):**
1. **Focus traps** (UX-024): Implementar Radix Dialog OR `focus-trap-react` em todos modais/drawers.
2. **Imagens sem alt:** 4 confirmados; varredura `<img>` sem `alt=` via eslint-plugin-jsx-a11y.
3. **Contraste:** `text-tertiary` em backgrounds claros falha 4.5:1 — recalcular token.
4. **Charts sem aria-label:** Recharts requer `<title>` + `<desc>` ou wrapper com `aria-label` descritivo + tabela alternativa para screen readers.
5. **Tabelas raw sem `<th scope>`:** auditar `<table>` direto (não-shadcn).
6. **Keyboard navigation:** Skip nav link (`#main-content`), focus visible ring em todos interactive (review tokens).
7. **ARIA live regions:** notificações/toasts sem `aria-live="polite"`.

**Critérios de aceite por componente:**
- Score axe-core: 0 violations Critical/Serious por rota.
- Manual keyboard-only test: navegar fluxo crítico (login → check-in → submit) sem mouse.
- VoiceOver/NVDA smoke: nomes acessíveis em todos botões.

**Esforço total a11y:** 40h (UX-007 + UX-024 + audit + setup).

---

## 10. Questões para Outros Agentes

### @data-engineer
1. Confirmar: existe RPC `get_lancamentos_diarios_for_seller` ou similar que possa substituir os 27 SELECTs diretos no client antes do REVOKE? Se não, precisamos criar (DB-side).
2. Após DB-014 (gen types), pode validar que migrations PT-BR não geram colisões de nome com tipos manuais (ex: `Usuario` vs `Profile`)?
3. Schema `chart_*` color tokens (UX-005/021) afeta tabelas? (Resposta esperada: NÃO — pure FE).

### @qa (FASE 7)
1. **Test gate UX antes de Sprint 1:**
   - axe-core baseline para 10 rotas críticas.
   - Playwright visual snapshots para `MXPerformanceLanding`, `ConsultoriaClienteDetalhe`, charts.
   - Memory leak detection: realtime subs (suite atual cobre?).
2. **Risco de regressão UX-001:** ordem proposta em §4.1 tem riscos? Especialmente DashboardLoja por último (depende UX-002).
3. **Contract tests entre forms e RPCs:** alinhados com plano RHF (§8)?

### @architect (FASE 8)
1. Upgrades UX-010 (Alta→Crítica) e UX-016 (Média→Alta) batem com framework de priorização?
2. UX-026 (web vitals) duplica SYS-017 (Sentry init)? Sugiro consolidar ou cross-referenciar.
3. Esforço total UX ~520h cabe em 1 epic ou precisa fatiar (Hardening UX + Decomposição + a11y + Forms)?

---

**Fim da revisão @ux-design-expert (FASE 6).**
**Recomendação para o gate QA (FASE 7):** **APPROVED viável** condicionado a Sprint 0 de pré-requisitos (UX-004 gen types + UX-015 lint a11y + UX-024 focus traps). Sem Sprint 0, gate deve ser **NEEDS WORK** — drift de tipos + a11y bloqueante combinados com X-2 (RBAC) elevam risco a inaceitável.
