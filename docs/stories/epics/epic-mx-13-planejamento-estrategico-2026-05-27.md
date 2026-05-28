# EPIC-MX-13 — Planejamento Estratégico

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 4 — UI consultiva

---

## 1. Goal

Entregar Planejamento Estratégico com 5 cards principais, tabela anual completa, visão Meta / Realizado / Ano Anterior e todos os indicadores do PDF cadastrados, sem excesso de gráficos.

---

## 2. Background

O PRD §4.12 define a estrutura aprovada para planejamento. O foco é leitura objetiva, acompanhamento anual e aderência aos indicadores do PDF, com cards e tabela como interface principal.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Tela possui 5 cards principais de planejamento |
| **AC-02** | Tabela anual completa apresenta Meta, Realizado e Ano Anterior |
| **AC-03** | Todos os indicadores do PDF ficam cadastrados/modelados |
| **AC-04** | UI evita excesso de gráficos |
| **AC-05** | Permite leitura por período e indicador |
| **AC-06** | Diferenças e evolução alimentam Central MX, alertas e Consultor IA |
| **AC-07** | Estados sem dados indicam indicador ou período pendente |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **13.1** | Modelo de indicadores planejados | Cadastro dos indicadores do PDF |
| **13.2** | 5 cards principais | Cards aprovados para leitura executiva |
| **13.3** | Tabela anual | Meta, Realizado e Ano Anterior |
| **13.4** | Filtros e períodos | Navegação por ano, mês e indicador |
| **13.5** | Integração com alertas e IA | Gerar sinais para Central MX |
| **13.6** | Responsividade e auditoria | Validar tabela em mobile/desktop |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-01 — Design System
- EPIC-MX-07 — Motor MX Score
- EPIC-MX-08 — Sistema de Alertas

**Bloqueia:**
- EPIC-MX-06 — Central MX
- EPIC-MX-14 — Consultor IA

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| 5 cards principais | PRD §4.12 FR-PLANEJ ← `.docx` §331–§337 |
| Tabela anual completa | PRD §4.12 |
| Meta / Realizado / Ano Anterior | PRD §4.12 |
| Sem excesso de gráficos | PRD §4.12 e NFR-V7 |

---

## 7. Next Step

@sm `*draft` da story 13.1 (Modelo de indicadores planejados).
