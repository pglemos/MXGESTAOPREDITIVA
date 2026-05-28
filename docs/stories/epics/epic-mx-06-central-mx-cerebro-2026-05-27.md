# EPIC-MX-06 — Central MX (Cérebro)

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 4 — UI integradora

---

## 1. Goal

Construir a Central MX como núcleo consultivo do sistema, integrando score, alertas, benchmarking, plano de ação, indicadores, agenda e Consultor IA rules-based.

---

## 2. Background

O PRD §4.13 define a Central MX como o cérebro do sistema. Ela deve conectar diagnóstico, recomendação e execução, sem virar BI tradicional ou ERP. A Central MX deve orientar decisão e acompanhamento.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Central MX agrega score, alertas, benchmarking, planos de ação, indicadores, agenda e Consultor IA |
| **AC-02** | Usuário entende problema, impacto, recomendação e ação rápida |
| **AC-03** | UI prioriza cards/status e evita excesso de gráficos |
| **AC-04** | Cada bloco abre visão detalhada sem perder contexto |
| **AC-05** | Estados sem dados mostram fontes pendentes |
| **AC-06** | Permissões respeitam perfil e escopo de loja |
| **AC-07** | Central funciona em desktop e mobile sem sobreposição |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **6.1** | Shell da Central MX | Estrutura integradora e navegação interna |
| **6.2** | Painel de diagnóstico | Score, alertas e gargalos prioritários |
| **6.3** | Plano de ação integrado | Ações derivadas de alertas, score e consultor |
| **6.4** | Benchmarking integrado | Comparativos por região/porte/segmento |
| **6.5** | Agenda e próximos rituais | Integração com rotina executiva |
| **6.6** | Consultor IA rules-based | Recomendações determinísticas |
| **6.7** | Responsividade e auditoria | Browser audit multi-role |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-07 — Motor MX Score
- EPIC-MX-08 — Sistema de Alertas
- EPIC-MX-09 — Plano de Ação
- EPIC-MX-10 — Benchmarking
- EPIC-MX-11 — Agenda Executiva
- EPIC-MX-14 — Consultor IA

**Bloqueia:**
- Experiência consultiva completa do produto

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Central MX como cérebro | PRD §4.13 FR-CENTRAL ← `.docx` §338–§348 |
| Score | PRD §4.7 FR-SCORE |
| Alertas | PRD §4.6 FR-ALERT |
| Plano de ação | PRD §4.8 FR-PLAN |
| Benchmarking | PRD §4.9 FR-BENCH |
| Agenda | PRD §4.10 FR-AGENDA |
| Consultor IA | PRD §4.14 FR-IA |

---

## 7. Next Step

@sm `*draft` da story 6.1 (Shell da Central MX).
