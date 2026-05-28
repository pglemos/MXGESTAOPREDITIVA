# EPIC-MX-09 — Plano de Ação

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 3 — Fundação consultiva

---

## 1. Goal

Transformar problemas detectados pelo MX em execução prática, por meio de plano de ação estruturado, rastreável, priorizado e com validação de eficácia.

---

## 2. Background

O PRD §4.8 define a estrutura de cada ação: departamento, indicador, problema, ação, como, responsável, prazo, status, eficácia, origem e prioridade. As origens válidas são alertas, score, consultor e manual.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Plano de ação armazena todos os campos obrigatórios do FR-PLAN-1 |
| **AC-02** | Origens válidas são alerta, score, consultor e manual |
| **AC-03** | Status suportam pendente, em andamento, atrasado, concluído e validando eficácia |
| **AC-04** | Ações podem ser vinculadas a loja, departamento, indicador e responsável |
| **AC-05** | Atraso é calculado por prazo e status |
| **AC-06** | UI permite acompanhar execução sem virar project manager genérico |
| **AC-07** | Histórico preserva mudanças críticas de status e eficácia |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **9.1** | Schema de plano de ação | Tabelas, enums e relacionamentos |
| **9.2** | CRUD operacional de ações | Criar, editar, concluir e validar eficácia |
| **9.3** | Ações derivadas de alerta | Criar ação a partir de alerta |
| **9.4** | Ações derivadas de score | Vincular ação a indicador/score |
| **9.5** | Painel de execução | Prioridades, responsáveis e atrasos |
| **9.6** | Auditoria e histórico | Log de alterações relevantes |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-02 — Perfis & Permissões
- EPIC-MX-08 — Sistema de Alertas
- EPIC-MX-07 — Motor MX Score

**Bloqueia:**
- EPIC-MX-06 — Central MX
- EPIC-MX-03 — Home Dono, para próximas ações

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Estrutura de ação | PRD §4.8 FR-PLAN-1 ← `.docx` §265–§290 |
| Origens válidas | PRD §4.8 FR-PLAN-2 |
| Status válidos | PRD §4.8 FR-PLAN-3 |
| Objetivo execução prática | PRD §4.8 |

---

## 7. Next Step

@sm `*draft` da story 9.1 (Schema de plano de ação).
