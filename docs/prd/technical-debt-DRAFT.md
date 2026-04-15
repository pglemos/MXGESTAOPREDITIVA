# Technical Debt Assessment — DRAFT

**Status:** DRAFT — Para Revisao dos Especialistas  
**Version:** 2.0  
**Data:** April 15, 2026  
**Consolidado por:** @architect (Aria)  
**Fontes:** system-architecture.md v2.0, DB-AUDIT.md v2.0, frontend-spec.md v1.0  

---

## 1. Debitos de Sistema (validado por @architect)

| ID | Debito | Severidade | Horas | Prioridade |
|----|--------|-----------|-------|------------|
| SYS-01 | TypeScript strict mode desativado em tsconfig.json | HIGH | 4h | P1 |
| SYS-02 | 11 pacotes @radix-ui instalados com uso parcial | MEDIUM | 2h | P2 |
| SYS-03 | auth-provider.tsx duplicado com useAuth.tsx | LOW | 1h | P3 |
| SYS-04 | 85+ scripts operacionais sem indexacao | LOW | 1h | P3 |
| SYS-05 | Tailwind v4 migration possivelmente incompleta | MEDIUM | 3h | P2 |
| SYS-06 | Sem teste de regressao visual | LOW | 4h | P3 |

### Detalhes

**SYS-01:** `tsconfig.json` nao habilita `strict: true`. Permite `any` implicito, null checks ausentes e coercao implicita. Impacto: bugs silenciosos em runtime, refactoring inseguro.

**SYS-02:** 11 pacotes `@radix-ui/*` instalados (dialog, tabs, select, switch, checkbox, avatar, dropdown-menu, tooltip, progress, scroll-area, label). Necessario auditar imports reais vs instalados para reduzir bundle.

**SYS-03:** `src/components/auth-provider.tsx` convive com `src/hooks/useAuth.tsx`. Possivel redundancia legada a confirmar.

**SYS-04:** Diretorio `scripts/` com 85+ arquivos sem README ou indexacao. Dificulta manutencao.

**SYS-05:** Tailwind v4 em uso CSS-first, mas algumas areas podem usar padroes do v3. Necessario audit de classes.

**SYS-06:** Nenhum teste de regressao visual automatizado. Mudancas de UI dependem de revisao manual.

---

## 2. Debitos de Database (validado por @data-engineer)

| ID | Debito | Severidade | Horas | Prioridade | Status |
|----|--------|-----------|-------|------------|--------|
| DB-01 | Legacy shadow columns em daily_checkins (9) e pdis (2) | LOW | 2h | P3 | OPEN |
| DB-02 | Audit log composite indexes | DONE | 4h | — | RESOLVED |
| DB-03 | Composite indexes daily_checkins | DONE | 1h | — | RESOLVED |
| DB-04 | Drop ghost legacy tables | DONE | 1h | — | RESOLVED |
| DB-05 | Missing indexes PDI 360 child tables | MEDIUM | 4h | P2 | OPEN |
| DB-06 | Permissive SELECT policies (users, stores, memberships) | MEDIUM | 3h | P2 | OPEN |
| DB-07 | Secure PDI constraints (NOT NULL) | DONE | 2h | — | RESOLVED |
| DB-08 | 17 legacy tables sem versioned migrations | HIGH | 6h | P1 | OPEN |
| DB-09 | Plaintext PII (emails, phones, OAuth tokens) | MEDIUM | 3h | P2 | OPEN |
| DB-10 | Schema validation JSONB columns | LOW | 2h | P3 | OPEN |
| DB-11 | Missing updated_at triggers em audit tables | LOW | 1h | P3 | OPEN |
| DB-12 | Legacy FKs sem explicit ON DELETE | MEDIUM | 4h | P2 | OPEN |
| DB-13 | daily_checkins partitioning strategy | LOW | 2h | P3 | DEFERRED |
| DB-14 | OAuth state cleanup cron | MEDIUM | 3h | P2 | OPEN |
| DB-15 | pdi_sessoes.loja_id sem FK formal | LOW | 1h | P3 | OPEN |

### Perguntas para @data-engineer:

1. DB-08: Qual estrategia recomendada para baseline de migrations das 17 tabelas legadas? `CREATE TABLE IF NOT EXISTS` gerado do schema vivo? Ou `supabase db dump`?
2. DB-06: As permissive SELECT policies foram decisao consciente de performance. Qual o threshold para reverter? Quantos usuarios simultaneos justificam manter?
3. DB-09: Para PII encryption, recomenda `pgsodium` (Supabase Vault) ou `pgcrypto`? Qual o impacto nas queries RLS?
4. DB-05: Os indexes em `(colaborador_id)`, `(gerente_id)` e `(competencia_id)` devem ser B-TREE simples ou partial indexes filtrando por status?
5. DB-13: Qual o volume atual de daily_checkins e taxa de crescimento mensal?

---

## 3. Debitos de Frontend/UX (validado por @ux-design-expert)

| ID | Debito | Severidade | Horas | Prioridade |
|----|--------|-----------|-------|------------|
| UX-01 | Missing focus traps em modais (mobile menu, WizardPDI) | HIGH | 4h | P1 |
| UX-02 | No skip navigation link | HIGH | 1h | P1 |
| UX-03 | Reduced motion nao respeitado | MEDIUM | 2h | P2 |
| UX-04 | Missing label associations em forms inline | MEDIUM | 3h | P2 |
| UX-05 | Low contrast em muted text com opacity | MEDIUM | 2h | P2 |
| UX-06 | No inline form validation no Login | LOW | 2h | P3 |
| UX-07 | Login inputs nao usam atom components | LOW | 2h | P3 |
| UX-08 | Decorative blur elements nao otimizados | LOW | 1h | P3 |
| UX-09 | No breadcrumb navigation | LOW | 2h | P3 |
| UX-10 | Hardcoded legacy colors em print components | LOW | 2h | P3 |

### Perguntas para @ux-design-expert:

1. UX-01: Recomenda `focus-trap-react` ou hook custom? Qual abordagem minimiza bundle?
2. UX-03: Deve-se usar CSS `@media (prefers-reduced-motion: reduce)` global ou hook React com `useReducedMotion()` do Motion?
3. UX-05: Qual token alternativo para `text-text-tertiary opacity-40` que atenda WCAG AA 4.5:1?
4. UX-04: Login page deve migrar para FormField molecule ou receber aria-label inline?
5. UX-10: Os print components (PrintableFeedback, WeeklyStoreReport) devem usar tokens MX ou manter esquema proprio?

---

## 4. Matriz Preliminar de Priorizacao

| ID | Area | Severidade | Horas | Prioridade | Sprint |
|----|------|-----------|-------|------------|--------|
| SYS-01 | Sistema | HIGH | 4h | P1 | 1 |
| DB-08 | Database | HIGH | 6h | P1 | 1 |
| UX-01 | Frontend | HIGH | 4h | P1 | 1 |
| UX-02 | Frontend | HIGH | 1h | P1 | 1 |
| DB-05 | Database | MEDIUM | 4h | P2 | 2 |
| DB-06 | Database | MEDIUM | 3h | P2 | 2 |
| DB-09 | Database | MEDIUM | 3h | P2 | 2 |
| DB-12 | Database | MEDIUM | 4h | P2 | 2 |
| DB-14 | Database | MEDIUM | 3h | P2 | 2 |
| SYS-02 | Sistema | MEDIUM | 2h | P2 | 2 |
| SYS-05 | Sistema | MEDIUM | 3h | P2 | 2 |
| UX-03 | Frontend | MEDIUM | 2h | P2 | 2 |
| UX-04 | Frontend | MEDIUM | 3h | P2 | 2 |
| UX-05 | Frontend | MEDIUM | 2h | P2 | 2 |
| DB-01 | Database | LOW | 2h | P3 | 3 |
| DB-10 | Database | LOW | 2h | P3 | 3 |
| DB-11 | Database | LOW | 1h | P3 | 3 |
| DB-15 | Database | LOW | 1h | P3 | 3 |
| SYS-03 | Sistema | LOW | 1h | P3 | 3 |
| SYS-04 | Sistema | LOW | 1h | P3 | 3 |
| SYS-06 | Sistema | LOW | 4h | P3 | 3 |
| UX-06 | Frontend | LOW | 2h | P3 | 3 |
| UX-07 | Frontend | LOW | 2h | P3 | 3 |
| UX-08 | Frontend | LOW | 1h | P3 | 3 |
| UX-09 | Frontend | LOW | 2h | P3 | 3 |
| UX-10 | Frontend | LOW | 2h | P3 | 3 |
| DB-13 | Database | LOW | 2h | DEFERRED | — |

### Resumo

| Metrica | Valor |
|---------|-------|
| Total debitos | 27 (22 OPEN + 3 RESOLVED + 1 DEFERRED + 1 DUPLICATE) |
| HIGH | 4 (SYS-01, DB-08, UX-01, UX-02) |
| MEDIUM | 9 |
| LOW | 13 |
| Esforco total OPEN | ~61h |
| Sprint 1 (P1) | 15h |
| Sprint 2 (P2) | 28h |
| Sprint 3 (P3) | 18h |

---

## 5. Perguntas para Especialistas

### Para @data-engineer:
1. Estrategia de baseline para 17 tabelas legadas sem migration?
2. Threshold para reverter permissive SELECT policies?
3. PII encryption: pgsodium vs pgcrypto?
4. Tipo de index para PDI 360 child tables?
5. Volume atual de daily_checkins e crescimento?

### Para @ux-design-expert:
1. Focus trap: lib ou hook custom?
2. Reduced motion: CSS global ou hook React?
3. Token alternativo para muted text com WCAG AA?
4. Login: migrar para FormField ou aria-label inline?
5. Print components: tokens MX ou esquema proprio?

---

## Notas

- 3 debitos DB foram resolvidos nesta sessao (DB-02, DB-03, DB-04, DB-07 via migrations aplicadas em abril 2026)
- DB-13 (partitioning) deferido ate daily_checkins atingir ~500K rows
- SYS-03 (auth-provider duplicado) depende de confirmacao se e realmente legacy ou se tem uso ativo
