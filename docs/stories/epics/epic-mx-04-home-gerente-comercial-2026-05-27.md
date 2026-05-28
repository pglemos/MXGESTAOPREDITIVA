# EPIC-MX-04 — Home Gerente Comercial

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 3 — UI operacional

---

## 1. Goal

Entregar a Home do Gerente Comercial como central operacional da equipe, com foco em cobrança, acompanhamento, execução diária e leitura rápida de gargalos comerciais.

---

## 2. Background

O PRD §4.2 FR-HOME-2 define a Home Gerente como painel de gestão da equipe comercial. Deve exibir meta, realizado, projeção, agendamentos de hoje, conversão, MX Score, equipe, funil comercial, alertas, agenda operacional, ranking e engajamento.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Home exibe meta, realizado, projeção, agendamentos hoje, conversão e MX Score |
| **AC-02** | Blocos de equipe, funil, alertas, agenda, ranking e engajamento ficam visíveis sem navegação profunda |
| **AC-03** | Gerente consegue identificar quem cobrar e qual indicador atacar |
| **AC-04** | Funil usa dados reais de leads, agendamentos, visitas e vendas |
| **AC-05** | Estados sem dados orientam ação sem mascarar ausência de fonte |
| **AC-06** | Layout responsivo validado para desktop e mobile |
| **AC-07** | Acesso restrito a Gerente Comercial e perfis superiores autorizados |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **4.1** | Shell operacional do gerente | Estruturar primeira dobra e navegação gerencial |
| **4.2** | KPIs de ritmo comercial | Meta, realizado, projeção, agenda e conversão |
| **4.3** | Desempenho da equipe | Ranking e tabela operacional por vendedor |
| **4.4** | Funil comercial do gerente | Visualizar gargalos por etapa do funil |
| **4.5** | Alertas e cobrança diária | Priorizar ações de cobrança e acompanhamento |
| **4.6** | Responsividade e browser audit | Validar fluxo gerente em desktop/mobile |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-01 — Design System
- EPIC-MX-02 — Perfis & Permissões
- EPIC-MX-05 — Fechamento Diário, para disciplina e dados operacionais completos

**Bloqueia:**
- EPIC-MX-06 — Central MX
- EPIC-MX-12 — Dashboard Executivo

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Indicadores e blocos do gerente | PRD §4.2 FR-HOME-2 ← `.docx` §130–§150 |
| Dados operacionais diários | PRD §4.4 FR-DATA-1 |
| Fechamento e disciplina | PRD §4.5 FR-DAILY |
| Alertas | PRD §4.6 FR-ALERT |

---

## 7. Next Step

@sm `*draft` da story 4.1 (Shell operacional do gerente).
