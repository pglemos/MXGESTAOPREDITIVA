# EPIC-MX-03 — Home Dono / Diretor

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 3 — UI executiva

---

## 1. Goal

Entregar a Home do Dono/Diretor como central de controle estratégica, orientada por alertas, prioridades e ações rápidas, reduzindo navegação e expondo a leitura executiva da loja em uma primeira tela.

---

## 2. Background

O PRD §4.2 FR-HOME-1 define a Home Dono/Diretor como experiência para quem precisa decidir, não operar. A tela deve exibir lucro bruto, margem, volume de vendas, estoque, MX Score, meta do mês, alertas críticos, score por departamento, agenda executiva, próximas ações e gargalos.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Home renderiza KPIs principais: lucro bruto, % margem, volume de vendas, estoque e MX Score |
| **AC-02** | Blocos executivos mostram meta do mês, alertas críticos, score por departamento, agenda executiva e próximas ações |
| **AC-03** | Experiência é alertas-driven: dono visualiza prioridades e ações rápidas sem navegação profunda |
| **AC-04** | Estados sem dados mostram "pendente" ou "não conectado" sem inventar números |
| **AC-05** | Layout desktop e mobile não tem overflow, texto cortado ou sobreposição |
| **AC-06** | Consome componentes do Design System e dados reais existentes quando disponíveis |
| **AC-07** | Acesso restrito a Master/Dono/Diretor conforme EPIC-MX-02 |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **3.1** | Shell executivo do dono | Estruturar container e primeira dobra da Home |
| **3.2** | KPIs executivos reais | Mapear DRE, vendas, estoque e score para cards |
| **3.3** | Alertas e prioridades | Integrar alertas críticos e ações rápidas |
| **3.4** | Score por departamento | Exibir cards por área com estado real/pendente |
| **3.5** | Agenda e próximas ações | Mostrar agenda executiva e pendências |
| **3.6** | Responsividade e browser audit | Validar desktop/mobile com dados reais |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-01 — Design System
- EPIC-MX-02 — Perfis & Permissões
- EPIC-MX-07 — Motor MX Score (parcial; UI pode exibir estado pendente)

**Bloqueia:**
- EPIC-MX-12 — Dashboard Executivo
- EPIC-MX-06 — Central MX, por ser a principal porta de entrada executiva

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| KPIs e blocos da Home Dono | PRD §4.2 FR-HOME-1 ← `.docx` §111–§129 |
| Alertas e ações rápidas | PRD §4.2 FR-HOME-1, PRD §4.6 FR-ALERT |
| Score por departamento | PRD §4.7 FR-SCORE-3 |
| Agenda executiva | PRD §4.10 FR-AGENDA |

---

## 7. Next Step

@sm `*draft` da story 3.1 (Shell executivo do dono).
