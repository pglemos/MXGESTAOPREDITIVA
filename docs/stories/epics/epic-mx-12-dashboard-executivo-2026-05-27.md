# EPIC-MX-12 — Dashboard Executivo

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 4 — UI executiva

---

## 1. Goal

Entregar Dashboard Executivo com KPIs e blocos de decisão, evitando BI tradicional e priorizando cards, status, alertas e observação consultiva.

---

## 2. Background

O PRD §4.11 define KPIs principais: lucro bruto, % margem, volume de vendas, estoque e MX Score. Blocos: meta do mês, alertas, score departamentos, gargalos, benchmark, evolução, agenda e observação consultiva.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Dashboard exibe KPIs principais definidos em FR-DASH |
| **AC-02** | Blocos de meta, alertas, score, gargalos, benchmark, evolução, agenda e observação consultiva estão disponíveis |
| **AC-03** | Design evita excesso de gráficos e usa cards/status |
| **AC-04** | Dados estratégicos indicam fonte e data de atualização |
| **AC-05** | Estados pendentes são explícitos |
| **AC-06** | Filtros de período/loja não quebram layout |
| **AC-07** | Acesso restrito a perfis executivos/autorizados |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **12.1** | Shell do Dashboard Executivo | Estrutura, filtros e layout |
| **12.2** | KPIs financeiros e comerciais | Lucro, margem, vendas, estoque e score |
| **12.3** | Blocos consultivos | Alertas, gargalos e observação |
| **12.4** | Benchmark e evolução | Comparação e tendência sem excesso visual |
| **12.5** | Agenda executiva no dashboard | Próximos rituais e reuniões |
| **12.6** | Responsividade e auditoria | Browser audit desktop/mobile |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-01 — Design System
- EPIC-MX-07 — Motor MX Score
- EPIC-MX-08 — Sistema de Alertas
- EPIC-MX-10 — Benchmarking
- EPIC-MX-11 — Agenda Executiva

**Bloqueia:**
- Experiência executiva completa para Dono/Diretor

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| KPIs principais | PRD §4.11 FR-DASH ← `.docx` §314–§330 |
| Blocos do Dashboard | PRD §4.11 FR-DASH |
| Poucos gráficos | PRD §5.2 NFR-V7 |

---

## 7. Next Step

@sm `*draft` da story 12.1 (Shell do Dashboard Executivo).
