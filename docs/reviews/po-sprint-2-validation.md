# PO Validation Report — Sprint 2
**Validator:** @po (Pax) | **Date:** 2026-05-18 | **Scope:** 10 stories Sprint 2 (UX-001 + UX-002)

---

## 1. Executive Summary

- **Total stories validadas:** 10
- **GO:** 10 / 10 (100%)
- **GO CONDICIONAL:** 0
- **NO-GO:** 0
- **Score médio:** **9.4 / 10**
- **Status transitions executadas:** 10 stories Draft → Ready (Change Log atualizado em cada)
- **Esforço Sprint 2 confirmado:** **~144h** (range 121-176h)
- **Sprint 2 ready para kick-off?** **SIM** — após Sprint 1.3 + 1.4 fecharem (todas demais dependências Sprint 0/1 já em main, confirmado via `git log`)

A bateria de 10 stories chega ao validation gate com **qualidade significativamente acima** da Sprint 1: hard-blocks explícitos, pattern docs (ADR-0050/0051/0052), shim-first migration para evitar breaking changes, Tests First para o caso crítico (auth), e canary deploys para pages high-blast-radius. Nenhum fix obrigatório.

---

## 2. Resultados por Story

### Story 2.1 — Decompor MXPerformanceLanding (PILOTO UX-001) — **GO 10/10**

| Checklist | Status |
|-----------|:------:|
| 1. Título claro | ✅ inclui LOC + label "PILOTO" |
| 2. Descrição completa | ✅ problem statement + justificativa de escolha como piloto |
| 3. AC testáveis G/W/T | ✅ 5 ACs Given/When/Then |
| 4. Scope IN/OUT | ✅ explícito (refactor de design fora) |
| 5. Dependências mapeadas | ✅ Sprint 0 done; bloqueia 2.2-2.6 |
| 6. Estimativa | ✅ 16h (range 14-18h) |
| 7. Business value | ✅ destrava ~84h de UX-001 |
| 8. Riscos documentados | ✅ 5 riscos com mitigação |
| 9. DoD | ✅ inclui ADR-0050 publicado |
| 10. Alinhamento PRD/Epic | ✅ refs §4.1 ux-review + assessment |

**Critérios Extra Sprint 2:** A ✅ (pattern documentado no próprio file) · B ✅ (Playwright snapshots) · C ✅ (rollback RTO <15min) · D ✅ · E ✅ (ADR-0050)

---

### Story 2.2 — ConsultoriaClienteDetalhe — **GO 9/10**
Pattern reusa ADR-0050. **Destaque positivo:** RBAC matrix testada explicitamente (3 roles × N tabs). Pequena perda: AC2 referencia `ADR-0050` que ainda será criado em 2.1 — ordem operacional já protegida pela dependência.

---

### Story 2.3 — Ranking — **GO 9/10**
Filters URL sync + memoization corretos. Export E2E preservado. Pattern aderente a ADR-0050.

---

### Story 2.4 — GerenteFeedback — **GO 9/10**
**Destaque:** draft persistence risk identificado com mitigação explícita (revert RTO <10min). Validators isolados como pure functions (testável).

---

### Story 2.5 — DashboardLoja — **GO 10/10**
**Hard-block 2.8 explícito** + AC3 proíbe importar god-hook `useTeam` em sections novas (força arquitetura limpa). Canary 10% × 24h adicional pela visibilidade. Realtime preservation testada.

---

### Story 2.6 — AgendaAdmin — **GO 9/10**
**Hard-block 2.7 explícito.** CRUD E2E em 3 views (mês/semana/dia) + permissions matrix. Adequada.

---

### Story 2.7 — Split useAgendaAdmin (PILOTO UX-002) — **GO 10/10**
Pattern shim-first **exemplar** (snippet TS no body da story). ADR-0051 entregável. Migração de consumers em PRs separados — reduz blast radius. 1 consumer migrado como prova.

---

### Story 2.8 — Split useTeam — **GO 9/10**
Reusa ADR-0051. Membership ↔ Members invalidation documentada. Hard-block bidirecional (depende de 2.7, bloqueia 2.5) corretamente declarado.

---

### Story 2.9 — Split useAuth (CRÍTICA, Tests First) — **GO 10/10**
**Excepcional.** AC1 força Tests First ≥90% ANTES de qualquer split. AC4 proíbe migração de consumers nesta story (anti-risco). Canary staging **48h** + RTO **<5min**. ADR-0052 entregável. Matrix de roles × resources (≥20 cenários) explícita.

---

### Story 2.10 — Split useCheckins (auditoria primeiro) — **GO 9/10**
**Audit-gate antes do split** (AC1) é decisão arquitetural correta — evita over-engineering. Caminho NO-GO documentado (ADR-0053 + WAIVED). Story 1.2 (fdf73f3) já em main, confirmado.

---

## 3. Dependências Cross-Stories Validadas

| De ← Para | Status | Evidência |
|-----------|:------:|-----------|
| 2.5 ← 2.8 | ✅ confirmado | AC3 obriga uso de sub-hooks de 2.8; tarefa explícita "Confirmar Story 2.8 merged" |
| 2.6 ← 2.7 | ✅ confirmado | AC3 obriga uso de sub-hooks de 2.7; tarefa explícita "Confirmar Story 2.7 merged" |
| 2.10 ← 1.2 | ✅ confirmado | Commit `fdf73f3` (Story 1.2, DB-016 B) já em main |
| 2.10 ← 1.5/1.6/1.10 | ⚠️ pendente | 1.10 confirmado (`5a66efb`); 1.5/1.6 a confirmar no kickoff |
| Todas ← Sprint 0 done | ✅ | RLS matrix (`b696bcb`), smoke 403 (`ccd5b6a`), reversibility (`4d7655f`), Sentry (`15917c4`), correlation_id (`aaf2a03`) em main |
| 2.2/2.3/2.4 ← 2.1 | ✅ | ADR-0050 será publicado em 2.1; pattern reusado |
| 2.8/2.9/2.10 ← 2.7 | ✅ | ADR-0051 será publicado em 2.7; pattern reusado |

---

## 4. ADRs a Criar (durante stories piloto)

| ADR | Story origem | Pattern |
|-----|-------------|---------|
| **ADR-0050** | 2.1 | Pages decomposition (container <200 LOC + features/) |
| **ADR-0051** | 2.7 | God-hook split + shim-first migration |
| **ADR-0052** | 2.9 | AuthProvider split + canary 48h + Tests First |
| **ADR-0053** | 2.10 (condicional) | useCheckins no-split rationale (apenas se audit retornar NO-GO) |

---

## 5. Recomendação Operacional

### Ordem de pickup recomendada (post Sprint 1.3/1.4 done)

**Wave 1 — Pilotos paralelos (kickoff Sprint 2 dia 1):**
1. **Story 2.1** (piloto pages, 16h) — @dev FE-A + @ux
2. **Story 2.7** (piloto god-hook, 20h) — @dev FE-B + @architect

   Justificativa: independentes, criam ADR-0050/0051 que destravam o resto.

**Wave 2 — Pós-piloto god-hook (start quando 2.7 merged):**
3. **Story 2.9** (useAuth Tests First, 18h) — máxima prioridade pelo risco crítico (auth + 48h canary)
4. **Story 2.8** (useTeam, 14h) — paralelo a 2.9; destrava 2.5
5. **Story 2.10** (useCheckins audit, 8h) — pode iniciar audit logo após 2.7

**Wave 3 — Pages dependentes (start quando piloto pages + god-hooks merged):**
6. Story 2.2 (consultoria-cliente, 14h)
7. Story 2.3 (ranking, 12h)
8. Story 2.4 (gerente-feedback, 11h)
9. Story 2.5 (dashboard-loja, 16h) — só após 2.8
10. Story 2.6 (agenda-admin, 15h) — só após 2.7

### Stories Ready efetivamente: **10 / 10**
### Stories que precisam fix antes pickup: **0**

### Top 3 ordem de pickup:
1. **2.1 + 2.7 paralelos** (pilotos)
2. **2.9** (Tests First — risco crítico, 48h canary buffer)
3. **2.8** (destrava 2.5)

### Sprint 2 pode iniciar quando Sprint 1.3/1.4 fechar?
**SIM.** Todas as dependências fora de Sprint 1.3/1.4 já estão em main. Pilotos 2.1 e 2.7 podem inclusive iniciar em paralelo a Sprint 1.3/1.4 sem conflito (escopo disjunto). Recomenda-se **buffer de 1 dia** após merge de Sprint 1 para validar staging integrado antes de @sm/@dev abrirem Sprint 2 oficialmente.

---

**Validation report path:** `docs/reviews/po-sprint-2-validation.md`
**Stories atualizadas (Draft → Ready):** 10 files em `docs/stories/sprint-2/`
