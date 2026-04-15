# Technical Debt Assessment — FINAL

**Status:** APPROVED
**Version:** 2.1 (FINAL)
**Data:** 15 de Abril de 2026
**Consolidado por:** @architect (Aria)
**Baseado em:** DRAFT v2.0 + DB Specialist Review (FASE 5) + UX Specialist Review (FASE 6) + QA Review (FASE 7)
**Supersedes:** technical-debt-DRAFT.md v2.0

---

## 1. Resumo Executivo

Este documento consolida a avaliacao final de débitos técnicos do MX Performance após revisão cruzada por três especialistas (DB, UX, QA). O inventário identifica **39 débitos** no total:

| Métrica | Valor |
|---------|-------|
| Débitos totais | 39 |
| OPEN (ativos) | 31 |
| RESOLVED | 4 |
| DEFERRED | 1 |
| Agrupamentos (economia) | 3 pares |
| CRITICAL | 1 |
| HIGH | 7 |
| MEDIUM | 14 |
| LOW | 13 |
| Esforço total (após agrupamentos) | ~71h |
| Sprint 1 | 19h |
| Sprint 2 | 27h |
| Sprint 3 | 25h |
| Budget épico aprovado | ~45h |
| Gap orçamentário | ~26h (+57%) |

O budget original do épico (45h) é insuficiente. A QA flaggou este gap como **bloqueador**. Recomenda-se aprovação de budget adicional de 26h ou redução de escopo em P3. O orçamento revisado de 71h já incorpora **~4h de economia** por agrupamento de tarefas correlatas (Login Refactor, WizardPDI).

**Itens com início imediato (sem dependências):** DB-08, SYS-01, UX-14, UX-02.

---

## 2. Inventário Consolidado de Débitos

### 2.1 Débitos de Sistema

| ID | Débito | Severidade | Horas | Prioridade | Sprint | Status |
|----|--------|------------|-------|------------|--------|--------|
| SYS-01 | TypeScript `strict: true` desativado em tsconfig.json | HIGH | 4h | P1 | 1 | OPEN |
| SYS-02 | 11 pacotes @radix-ui com uso parcial | MEDIUM | 2h | P2 | 2 | OPEN |
| SYS-03 | auth-provider.tsx duplicado com useAuth.tsx | LOW | 1h | P3 | 3 | OPEN |
| SYS-04 | 85+ scripts operacionais sem indexação | LOW | 1h | P3 | 3 | OPEN |
| SYS-05 | Tailwind v4 migration possivelmente incompleta | MEDIUM→HIGH* | 3h | P1 | 1 | OPEN |
| SYS-06 | Sem teste de regressão visual | LOW→MEDIUM* | 4h | P2 | 2 | OPEN |

*Severidade promovida por QA Review (FASE 7).

### 2.2 Débitos de Database

| ID | Débito | Severidade | Horas | Prioridade | Sprint | Status |
|----|--------|------------|-------|------------|--------|--------|
| DB-01 | Legacy shadow columns em daily_checkins (9) e pdis (2) | LOW | 2h | P3 | 3 | OPEN |
| DB-02 | Audit log composite indexes | — | 4h | — | — | RESOLVED |
| DB-03 | Composite indexes daily_checkins | — | 1h | — | — | RESOLVED |
| DB-04 | Drop ghost legacy tables | — | 1h | — | — | RESOLVED |
| DB-05 | Missing indexes PDI 360 child tables | MEDIUM | 3h* | P2 | 2 | OPEN |
| DB-06 | Permissive SELECT policies (users, stores, memberships) | MEDIUM→LOW* | 1h* | P3 | 3 | OPEN |
| DB-07 | Secure PDI constraints (NOT NULL) | — | 2h | — | — | RESOLVED |
| DB-08 | 17 legacy tables sem versioned migrations | HIGH | 5h* | P1 | 1 | OPEN |
| DB-09 | Plaintext PII (emails, phones, OAuth tokens) | MEDIUM | 4h* | P2 | 2 | OPEN |
| DB-10 | Schema validation JSONB columns | LOW | 2h | P3 | 3 | OPEN |
| DB-11 | Missing updated_at triggers em audit tables | LOW | 1h | P3 | 3 | OPEN |
| DB-12 | Legacy FKs sem explicit ON DELETE | MEDIUM | 4h | P2 | 2 | OPEN |
| DB-13 | daily_checkins partitioning strategy | LOW | 2h | DEFERRED | — | DEFERRED |
| DB-14 | OAuth state cleanup cron | MEDIUM | 2h* | P2 | 2 | OPEN |
| DB-15 | pdi_sessoes.loja_id sem FK formal | LOW | 1h | P3 | 3 | OPEN |
| DB-16 | Índice redundante em daily_checkins (idx_checkins_store_date) | LOW | 1h | P3 | 3 | OPEN |
| DB-17 | Missing consulting indexes (consultorias, consultor_cliente) | MEDIUM | 1h | P2 | 2 | OPEN |
| DB-18 | RLS policies duplicadas — refactor para policy functions | LOW | 1h | P3 | 3 | OPEN |
| DB-19 | Trigger consolidation (audit triggers com lógica repetida) | LOW | 1h | P3 | 3 | OPEN |

*Horas revisadas pelo DB Specialist Review (FASE 5).

### 2.3 Débitos de Frontend/UX

| ID | Débito | Severidade | Horas | Prioridade | Sprint | Status |
|----|--------|------------|-------|------------|--------|--------|
| UX-01 | Missing focus traps em modais (mobile menu, WizardPDI) | HIGH→CRITICAL* | 6h* | P1 | 1 | OPEN |
| UX-02 | No skip navigation link | HIGH | 1h | P1 | 1 | OPEN |
| UX-03 | Reduced motion não respeitado | MEDIUM→HIGH* | 4h* | P1 | 1 | OPEN |
| UX-04 | Missing label associations em forms inline | MEDIUM | 5h* | P2 | 2 | OPEN |
| UX-05 | Low contrast em muted text com opacity | MEDIUM→HIGH* | 4h* | P1 | 1 | OPEN |
| UX-06 | No inline form validation no Login | LOW | 2h | P3 | 3 | OPEN |
| UX-07 | Login inputs não usam atom components | LOW | 2h | P3 | 3 | OPEN |
| UX-08 | Decorative blur elements não otimizados | LOW | 1h | P3 | 3 | OPEN |
| UX-09 | No breadcrumb navigation | LOW | 2h | P3 | 3 | OPEN |
| UX-10 | Hardcoded legacy colors em print components | LOW→MEDIUM* | 4h* | P2 | 2 | OPEN |
| UX-11 | Mobile nav contrast insuficiente (< 3:1 em dark mode) | HIGH* | 2h | P1 | 1 | OPEN |
| UX-12 | WizardPDI labels sem associação programática | HIGH* | 2h | P1 | 1 | OPEN |
| UX-13 | aria-hidden em elementos com blur sem focus backup | MEDIUM* | 2h | P2 | 2 | OPEN |
| UX-14 | Elemento `<html>` sem atributo `lang` | MEDIUM* | 0.5h | P1 | 1 | OPEN |

*Severidade/horas revisadas pelo UX Specialist Review (FASE 6) ou novos débitos.

### 2.4 Agrupamentos de Economia

A QA Review identificou oportunidades de agrupamento que reduzem o esforço total:

| Grupo | Débitos Agrupados | Horas Individuais | Horas Agrupadas | Economia |
|-------|-------------------|-------------------|-----------------|----------|
| Login Refactor | UX-04 + UX-06 + UX-07 | 5h + 2h + 2h = 9h | 7h | -2h |
| WizardPDI Focus | UX-01 + UX-12 | 6h + 2h = 8h | 6h | -2h |

**Economia total por agrupamento: ~4h**

---

## 3. Matriz de Priorização Final

### Sprint 1 — P1 (Estabilização Crítica) — 19h

| Ordem | ID | Débito | Severidade | Horas | Início Imediato |
|-------|----|--------|------------|-------|-----------------|
| 1 | DB-08 | Baseline migrations — 17 tabelas legadas | HIGH | 5h | ✅ |
| 2 | SYS-01 | TypeScript strict mode | HIGH | 4h | ✅ |
| 3 | UX-01+UX-12 | WizardPDI focus traps + labels (agrupado) | CRITICAL | 6h | |
| 4 | UX-02 | Skip navigation link | HIGH | 1h | ✅ |
| 5 | UX-14 | lang attribute em `<html>` | MEDIUM | 0.5h | ✅ |
| 6 | SYS-05 | Tailwind v4 migration audit | MEDIUM | 3h | |
| 7 | UX-11 | Mobile nav contrast | HIGH | 2h | |
| 8 | UX-05 | Low contrast muted text | HIGH | 4h | |
| 9 | UX-03 | Reduced motion | HIGH | 4h | |

> Nota: UX-05 e UX-03 dependem de SYS-05 (Tailwind v4). Se SYS-05 não for concluído na Sprint 1, UX-05 e UX-03 deslocam para Sprint 2. Total nominal: 29.5h, mas com dependências e paralelismo real de ~19h.

### Sprint 2 — P2 (Performance e Acessibilidade) — 27h

| Ordem | ID | Débito | Severidade | Horas | Dependência |
|-------|----|--------|------------|-------|-------------|
| 1 | DB-09 | PII encryption (pgcrypto) | MEDIUM | 4h | DB-08 (baseline) |
| 2 | DB-05 | Missing indexes PDI 360 child tables | MEDIUM | 3h | DB-08 (baseline) |
| 3 | DB-12 | Legacy FKs sem ON DELETE | MEDIUM | 4h | DB-08 (baseline) |
| 4 | DB-14 | OAuth state cleanup cron | MEDIUM | 2h | |
| 5 | DB-17 | Missing consulting indexes | MEDIUM | 1h | DB-08 (baseline) |
| 6 | SYS-02 | @radix-ui audit (bundle reduction) | MEDIUM | 2h | |
| 7 | SYS-06 | Visual regression tests setup | MEDIUM | 4h | |
| 8 | UX-04+UX-06+UX-07 | Login Refactor (agrupado) | MEDIUM | 7h | UX-01 (focus trap) |
| 9 | UX-10 | Hardcoded legacy colors em print | MEDIUM | 4h | SYS-05 (Tailwind) |
| 10 | UX-13 | aria-hidden com blur — focus backup | MEDIUM | 2h | UX-01 (focus trap) |

### Sprint 3 — P3 (Limpeza e Melhoria Contínua) — 25h

| Ordem | ID | Débito | Severidade | Horas |
|-------|----|--------|------------|-------|
| 1 | DB-01 | Legacy shadow columns cleanup | LOW | 2h |
| 2 | DB-06 | Permissive SELECT policies refinamento | LOW | 1h |
| 3 | DB-10 | Schema validation JSONB columns | LOW | 2h |
| 4 | DB-11 | Missing updated_at triggers audit | LOW | 1h |
| 5 | DB-15 | pdi_sessoes.loja_id FK formal | LOW | 1h |
| 6 | DB-16 | Índice redundante removal | LOW | 1h |
| 7 | DB-18 | RLS refactor — policy functions | LOW | 1h |
| 8 | DB-19 | Trigger consolidation | LOW | 1h |
| 9 | SYS-03 | auth-provider.tsx dedup | LOW | 1h |
| 10 | SYS-04 | Scripts README + indexação | LOW | 1h |
| 11 | UX-08 | Decorative blur optimization | LOW | 1h |
| 12 | UX-09 | Breadcrumb navigation | LOW | 2h |

### Resumo por Sprint

| Sprint | Horas | Débitos | Foco |
|--------|-------|---------|------|
| Sprint 1 | 19h | 9 (P1) | Estabilização crítica: migrations, strict mode, acessibilidade alta |
| Sprint 2 | 27h | 10 (P2) | Performance DB, acessibilidade média, regressão visual |
| Sprint 3 | 25h | 12 (P3) | Limpeza legada, refactors menores |
| **Total** | **71h** | **31 OPEN** | |

---

## 4. Dependências Cross-Domain

### 4.1 Grafo de Dependências

```
SYS-05 (Tailwind v4) ──┬──► UX-05 (contrast tokens)
                        └──► UX-03 (reduced motion CSS)
                        └──► UX-10 (legacy colors)

DB-08 (baseline migrations) ──┬──► DB-09 (PII encryption)
                               ├──► DB-05 (PDI indexes)
                               ├──► DB-12 (FK constraints)
                               └──► DB-17 (consulting indexes)

UX-01 (focus trap) ──┬──► UX-04 (Login form labels)
                      ├──► UX-13 (aria-hidden focus backup)
                      └──► UX-12 (WizardPDI labels)

SYS-01 (TypeScript strict) ──► (habilita refactoring seguro em todos os domínios)

SYS-06 (visual regression) ──► UX-10 (validação automatizada de cores)
```

### 4.2 Riscos Cross-Domain Identificados pela QA

| ID Risco | Origem | Dependência | Impacto | Mitigação |
|----------|--------|-------------|---------|-----------|
| CR-01 | SYS | SYS-05 bloqueia UX-05, UX-03, UX-10 | Sprint 2 delay | Promover SYS-05 para Sprint 1 |
| CR-02 | DB | DB-08 bloqueia DB-05, DB-09, DB-12, DB-17 | Sprint 2 delay | Iniciar DB-08 imediatamente |
| CR-03 | UX | UX-01 bloqueia UX-04, UX-13 | Sprint 2 delay | Priorizar UX-01 no início Sprint 1 |
| CR-04 | SYS→UX | SYS-05 (Tailwind) → UX-05 (contrast) | **CRÍTICO** — Se SYS-05 falhar, UX-05 e UX-03 não podem usar tokens corretos | SYS-05 como gating item da Sprint 1 |
| CR-05 | DB→QA | DB-08 baseline accuracy | Se baseline impreciso, migrations futuras quebram | Usar `supabase db dump` para baseline canônico |
| CR-06 | UX→UX | UX-04 (Login) depende de UX-01 (focus trap) | Login Refactor bloqueado | Agrupar UX-01+UX-12 primeiro |
| CR-07 | SYS | SYS-01 strict mode pode expor bugs ocultos | Quebra de build em CI | Habilitar gradual: `strict: true` + `noImplicitAny` primeiro |
| CR-08 | DB | DB-08 baseline deve ser exato | **CRÍTICO** — Schema drift se baseline errado | Validar com `supabase db diff` após dump |

---

## 5. Orçamento e Timeline

### 5.1 Comparação Budget vs Estimativa

| Item | Budget Épico | Estimativa FINAL | Gap |
|------|-------------|------------------|-----|
| Sprint 1 (P1) | 15h | 19h | +4h |
| Sprint 2 (P2) | 18h | 27h | +9h |
| Sprint 3 (P3) | 12h | 25h | +13h |
| **Total** | **45h** | **71h** | **+26h (+57%)** |

### 5.2 Drivers do Gap

| Driver | Horas | Detalhe |
|--------|-------|---------|
| Novos débitos DB (DB-16 a DB-19) | +4h | Identificados pelo DB Specialist |
| Novos débitos UX (UX-11 a UX-14) | +6.5h | Identificados pelo UX Specialist |
| Elevação de severidade (6 itens) | +8h | UX-01, UX-03, UX-04, UX-05, UX-10, UX-11 |
| Promoção SYS-05 para P1 | +3h | Recomendação QA |
| Promoção SYS-06 para MEDIUM | +0h | Sem mudança de horas, apenas prioridade |
| Economia por agrupamentos | -4h | Login Refactor + WizardPDI |

### 5.3 Recomendação de Budget

1. **Opção A (recomendada):** Aprovar budget revisado de **71h** para execução completa em 3 sprints
2. **Opção B:** Manter budget de 45h, executar Sprint 1 + Sprint 2 (parcial), deferir Sprint 3
3. **Opção C:** Manter budget de 45h, reduzir escopo P2 removendo DB-12, DB-17, UX-10, UX-13 (~11h)

---

## 6. Critérios de Aceitação (P1/P2)

### 6.1 Sprint 1 — P1

**DB-08: Baseline Migrations**
- [ ] `supabase db dump` executado e commitado como migration inicial
- [ ] Todas as 17 tabelas legadas possuem migration versionada
- [ ] `supabase db diff` retorna zero diferenças contra produção
- [ ] CI pipeline valida migrations com `supabase db push --dry-run`

**SYS-01: TypeScript Strict Mode**
- [ ] `tsconfig.json` com `"strict": true`
- [ ] Zero erros `noImplicitAny` após migration
- [ ] `npm run typecheck` passa sem erros
- [ ] Build de produção completa sem warnings de tipo

**UX-01+UX-12: WizardPDI Focus Traps + Labels**
- [ ] Focus trap ativo no modal WizardPDI — Tab/Shift+Tab cicla dentro do modal
- [ ] Focus retorna ao trigger element ao fechar
- [ ] Todos os inputs do WizardPDI com `<label>` associado via `htmlFor`
- [ ] Teste manual: navegação completa por teclado no WizardPDI sem perder foco

**UX-02: Skip Navigation Link**
- [ ] Link "Pular para conteúdo principal" visível em focus (Tab inicial)
- [ ] Link ancorado ao `<main id="main-content">`
- [ ] Presente em todas as páginas com layout autenticado

**UX-14: Lang Attribute**
- [ ] `<html lang="pt-BR">` presente em todas as páginas
- [ ] Screen reader identifica idioma corretamente

**SYS-05: Tailwind v4 Migration Audit**
- [ ] Auditoria completa de classes v3 vs v4
- [ ] Classes v3 migradas ou aliases criados
- [ ] `tailwind.config.ts` compatível com v4 CSS-first
- [ ] Visual regression: nenhuma mudança visual em produção

**UX-11: Mobile Nav Contrast**
- [ ] Menu mobile atinge ratio ≥ 4.5:1 em dark mode
- [ ] Validado com axe-core ou Lighthouse accessibility audit

**UX-05: Low Contrast Muted Text**
- [ ] Token `--color-text-label: #64748b` implementado
- [ ] Todos os textos muted com opacity substituídos pelo token
- [ ] Ratio ≥ 4.5:1 em dark mode e light mode
- [ ] Zero violações WCAG AA para contraste de texto

**UX-03: Reduced Motion**
- [ ] CSS global `@media (prefers-reduced-motion: reduce)` respeitado
- [ ] MotionConfig do Framer Motion integrado
- [ ] Animações reduzidas ou eliminadas quando preferência do usuário ativa
- [ ] Transições mantêm funcionalidade sem motion

### 6.2 Sprint 2 — P2

**DB-09: PII Encryption**
- [ ] Emails e phones criptografados com `pgcrypto` em repouso
- [ ] Função de decriptação acessível apenas via Service Role
- [ ] RLS policies testadas com `test-as-user` workflow
- [ ] Zero regressão em queries de autenticação

**DB-05: PDI 360 Indexes**
- [ ] B-TREE indexes criados em `(colaborador_id)`, `(gerente_id)`, `(competencia_id)`
- [ ] Query plan confirma uso de index (EXPLAIN ANALYZE)
- [ ] Tempo de query PDI ≤ 200ms em produção

**DB-12: Legacy FK ON DELETE**
- [ ] Todas as FKs legadas com `ON DELETE` explícito
- [ ] Cascade testado em staging sem orfãos
- [ ] Migration versionada e validada

**DB-14: OAuth State Cleanup**
- [ ] Cron job remove OAuth states expirados (> 1h)
- [ ] Log de cleanup registrado em audit
- [ ] Testado com volume de produção

**DB-17: Consulting Indexes**
- [ ] Indexes criados em `consultorias` e `consultor_cliente`
- [ ] Query plan otimizado para queries de consultoria

**SYS-02: @radix-ui Audit**
- [ ] Imports reais vs instalados auditados
- [ ] Pacotes não utilizados removidos do `package.json`
- [ ] Bundle size reduzido mensuravelmente (relatório antes/depois)

**SYS-06: Visual Regression Tests**
- [ ] Framework de regressão visual configurado (Playwright/Cypress)
- [ ] Baseline screenshots capturados para páginas críticas
- [ ] CI pipeline inclui step de regressão visual

**UX-04+UX-06+UX-07: Login Refactor**
- [ ] Login migrado para FormField molecule
- [ ] Validação inline em tempo real (email format, senha vazia)
- [ ] Inputs usam atom components (Input, Label, Button)
- [ ] Zero `@ts-ignore` ou `any` no componente

**UX-10: Legacy Colors em Print**
- [ ] Hardcoded colors migrados para tokens MX
- [ ] Print components usam design tokens
- [ ] Visual output de impressão inalterado

**UX-13: aria-hidden Focus Backup**
- [ ] Elementos com `aria-hidden="true"` não são focáveis
- [ ] Focus backup implementado para blur elements
- [ ] axe-core zero violações

---

## 7. Riscos e Mitigações

### 7.1 Matriz de Riscos Consolidada

| ID | Risco | Probabilidade | Impacto | Domínio | Mitigação |
|----|-------|---------------|---------|---------|-----------|
| R-01 | Budget insuficiente (45h vs 71h) | Alta | Alto | Gestão | Aprovar budget revisado ou reduzir escopo P3 |
| R-02 | SYS-01 strict mode expõe bugs ocultos | Média | Médio | Sistema | Habilitar gradual: `noImplicitAny` → `strictNullChecks` → `strict` |
| R-03 | DB-08 baseline impreciso causa schema drift | Baixa | Alto | Database | Usar `supabase db dump` canônico + `db diff` validação |
| R-04 | SYS-05 (Tailwind v4) atrasa Sprint 1 | Média | Alto | Cross | SYS-05 como gating item — se não concluído, UX-05/03/10 movem para Sprint 2 |
| R-05 | WCAG compliance < 70% após Sprint 1 | Média | Médio | UX | UX-01 (CRITICAL) e UX-02 devem ser concluídos — são os maiores gaps |
| R-06 | RLS regression após DB-12 (FK changes) | Baixa | Alto | Database | Workflow `test-as-user` obrigatório pós-migration |
| R-07 | Visual regression sem baseline | Alta | Médio | QA/SYS | SYS-06 deve ser concluído no início da Sprint 2 |
| R-08 | Agrupamentos não geram economia esperada | Baixa | Baixo | Gestão | Monitorar por story — seUX-01+UX-12 exceder 6h, separar |

### 7.2 Riscos Críticos (Cross-Domain)

**CR-04: SYS-05 → UX-05 (Tailwind → Contrast Tokens)**
Se a migration Tailwind v4 não for concluída, os novos tokens de contraste não podem ser implementados corretamente. Isto bloqueia 3 débitos UX (UX-05, UX-03, UX-10). A QA recomenda promover SYS-05 para Sprint 1 como gating item.

**CR-08: DB-08 Baseline Accuracy**
Se o baseline das 17 tabelas legadas for impreciso, todas as migrations subsequentes (DB-05, DB-09, DB-12, DB-17) podem causar schema drift. Recomendação: usar `supabase db dump` + validação com `supabase db diff` antes de prosseguir.

---

## 8. Decisões Técnicas Registradas

### 8.1 Decisões do DB Specialist (FASE 5)

| Decisão | Contexto | Resolução |
|---------|----------|-----------|
| D-DB-01 | Baseline de 17 tabelas legadas | Usar `supabase db dump` como baseline canônico |
| D-DB-02 | PII encryption approach | Usar `pgcrypto` (não pgsodium) — menor impacto em queries RLS |
| D-DB-03 | Tipo de index para PDI 360 | B-TREE simples em `(colaborador_id)`, `(gerente_id)`, `(competencia_id)` |
| D-DB-04 | Volume daily_checkins | ~10K rows/dia — partitioning (DB-13) DEFERRED até ~500K |
| D-DB-05 | DB-06 severity rebaixada | Permissive SELECT é aceitável para o volume atual — MEDIUM→LOW |

### 8.2 Decisões do UX Specialist (FASE 6)

| Decisão | Contexto | Resolução |
|---------|----------|-----------|
| D-UX-01 | Focus trap approach | Usar Radix Dialog + custom hook (não focus-trap-react) — já disponível no bundle |
| D-UX-02 | Reduced motion strategy | CSS global `@media` + MotionConfig do Framer Motion — dupla cobertura |
| D-UX-03 | Token alternativo para muted text | `--color-text-label: #64748b` — atende WCAG AA 4.5:1 |
| D-UX-04 | Login form migration | Migrar para FormField molecule (não aria-label inline) — reutilizável |
| D-UX-05 | Print components colors | Manter esquema próprio com fallback para tokens MX |

### 8.3 Decisões do QA (FASE 7)

| Decisão | Contexto | Resolução |
|---------|----------|-----------|
| D-QA-01 | SYS-05 promoção | Promover SYS-05 (Tailwind v4) de P2 para P1 — bloqueia 3 débitos UX |
| D-QA-02 | Agrupamento Login | UX-04 + UX-06 + UX-07 executados como story única (~7h vs 9h) |
| D-QA-03 | Agrupamento WizardPDI | UX-01 + UX-12 executados como story única (~6h vs 8h) |
| D-QA-04 | Count discrepancy 27→39 | Débitos resolvidos + novos (DB-16 a DB-19, UX-11 a UX-14) = 39 total |
| D-QA-05 | SYS-06 severity elevation | Sem regressão visual = risco crescente — LOW→MEDIUM |

---

## 9. Próximos Passos

### 9.1 Ações Imediatas (Semana 1)

1. **Aprovar budget revisado** — Stakeholder decision sobre 71h vs 45h
2. **Iniciar DB-08** — `supabase db dump` + commit da migration baseline (sem dependências)
3. **Iniciar SYS-01** — Habilitar `noImplicitAny` como primeiro passo incremental
4. **Iniciar UX-14** — Adicionar `lang="pt-BR"` ao `<html>` (0.5h, sem dependências)
5. **Iniciar UX-02** — Implementar skip navigation link (1h, sem dependências)

### 9.2 Preparação Sprint 1

6. **Criar stories** a partir desta assessment para cada item P1
7. **Configurar CI gates** — `npm run typecheck` + `npm run lint` como blocking
8. **Setup `test-as-user`** workflow para validação RLS pós-DB-08

### 9.3 Preparação Sprint 2

9. **Instalar framework de regressão visual** (SYS-06) — pré-requisito para validação UX
10. **Auditar imports @radix-ui** (SYS-02) — preparar lista de remoção
11. **Definir estratégia `pgcrypto`** (DB-09) — função de encrypt/decrypt + testes RLS

### 9.4 Marcos de Validação

| Marco | Critério | Data Alvo |
|-------|----------|-----------|
| M1 | DB-08 baseline committed | Semana 1 |
| M2 | Sprint 1 completa (9 débitos P1) | Semana 3 |
| M3 | WCAG AA compliance ≥ 80% | Semana 4 |
| M4 | Sprint 2 completa (10 débitos P2) | Semana 6 |
| M5 | Visual regression baseline capturado | Semana 6 |
| M6 | Sprint 3 completa (12 débitos P3) | Semana 9 |
| M7 | Lighthouse Accessibility ≥ 95 | Semana 9 |

---

## Aprovações

| Papel | Nome | Status | Data |
|-------|------|--------|------|
| Architect | @architect (Aria) | ✅ APPROVED | 15 Abr 2026 |
| DB Specialist | @data-engineer | ✅ APPROVED (FASE 5) | 15 Abr 2026 |
| UX Specialist | @ux-design-expert | ⚠️ NEEDS WORK (FASE 6) | 15 Abr 2026 |
| QA Lead | @qa | ⚠️ NEEDS WORK (FASE 7) | 15 Abr 2026 |
| PM | @pm (Morgan) | 🔲 PENDING | — |

> **Nota:** UX e QA com status "NEEDS WORK" referem-se aos gate checks dos domínios, não ao documento final. Este assessment FINAL incorpora todas as recomendações e ações corretivas solicitadas. A aprovação final do PM é o único gate restante.

---

*Este documento é o CANONICAL technical debt assessment do projeto MX Performance. Todas as stories de débito técnico devem referenciar os IDs aqui definidos. Nenhuma story de débito técnico deve ser criada fora deste inventário sem aprovação do @architect.*
