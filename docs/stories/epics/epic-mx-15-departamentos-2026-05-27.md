# EPIC-MX-15 — Departamentos

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 5 — Expansão por área

---

## 1. Goal

Entregar a área Departamentos com visão por Comercial, Marketing, Produto, Financeiro, RH e Operações, conectando score, indicadores, alertas e planos de ação por área.

---

## 2. Background

O PRD §4.1 FR-MENU define Departamentos como uma das seis áreas principais. O PRD §3 define perfis específicos para Marketing, Produto, Financeiro/Administrativo, RH e Operações.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Departamentos lista Comercial, Marketing, Produto, Financeiro, RH e Operações |
| **AC-02** | Cada departamento possui score, indicadores, alertas e plano de ação |
| **AC-03** | Permissões respeitam perfil de cada departamento |
| **AC-04** | Estados pendentes indicam dados ainda não conectados |
| **AC-05** | Dono/Diretor tem visão consolidada por departamento |
| **AC-06** | Departamento pode abrir detalhe sem perder contexto da loja |
| **AC-07** | UI mantém padrão simples, moderno e orientado a ação |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **15.1** | Modelo de departamentos | Entidades e relação com loja/perfil |
| **15.2** | Dashboard por departamento | Score, indicadores e alertas |
| **15.3** | Comercial | Indicadores de funil e vendas |
| **15.4** | Marketing | Leads, campanhas e canais |
| **15.5** | Produto | Estoque, giro e margem |
| **15.6** | Financeiro | DRE, margem e fluxo |
| **15.7** | RH e Operações | Treinamentos, PDIs, preparação e entrega |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-02 — Perfis & Permissões
- EPIC-MX-07 — Motor MX Score
- EPIC-MX-08 — Sistema de Alertas
- EPIC-MX-09 — Plano de Ação

**Bloqueia:**
- Visão departamental da Central MX e Dashboard Executivo

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Área Departamentos e subáreas | PRD §4.1 FR-MENU ← `.docx` §75–§109 |
| Perfis departamentais | PRD §3 ← `.docx` §35–§74 |
| Score por departamento | PRD §4.7 FR-SCORE-3 |

---

## 7. Next Step

@sm `*draft` da story 15.1 (Modelo de departamentos).
