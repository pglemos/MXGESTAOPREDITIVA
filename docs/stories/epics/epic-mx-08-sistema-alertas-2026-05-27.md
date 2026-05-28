# EPIC-MX-08 — Sistema de Alertas

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 3 — Fundação consultiva

---

## 1. Goal

Implementar o sistema de alertas rules-based do MX Performance, com tipos, estrutura obrigatória e canais definidos, transformando dados em orientação prática.

---

## 2. Background

O PRD §4.6 define quatro tipos de alerta: Crítico, Atenção, Positivo e Consultivo. Cada alerta precisa ter problema, impacto, recomendação e ação rápida. Para 2026, os alertas usam regras fixas inteligentes, sem IA contextual avançada.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Alertas suportam tipos Crítico, Atenção, Positivo e Consultivo |
| **AC-02** | Cada alerta armazena problema, impacto, recomendação e ação rápida |
| **AC-03** | Engine rules-based gera alertas a partir de score, funil, disciplina e metas |
| **AC-04** | Canais sistema, push e WhatsApp ficam modelados |
| **AC-05** | Alertas têm ciclo de vida: aberto, visto, resolvido, arquivado |
| **AC-06** | UI consome `AlertCard` do Design System |
| **AC-07** | Sem uso de LLM ou IA preditiva avançada em 2026 |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **8.1** | Schema de alertas | Tabelas, tipos e canais |
| **8.2** | Engine rules-based | Regras iniciais determinísticas |
| **8.3** | Ciclo de vida de alerta | Marcar visto, resolver, arquivar |
| **8.4** | Alertas no sistema | Feed e cards por perfil |
| **8.5** | Canal push/WhatsApp | Preparar filas/canais sem envio duplicado |
| **8.6** | Auditoria e testes | Validar estrutura obrigatória e permissões |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-01 — `AlertCard`
- EPIC-MX-07 — Motor MX Score

**Bloqueia:**
- EPIC-MX-03 — Home Dono
- EPIC-MX-04 — Home Gerente
- EPIC-MX-06 — Central MX
- EPIC-MX-14 — Consultor IA

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Tipos de alerta | PRD §4.6 FR-ALERT-1 ← `.docx` §223–§240 |
| Estrutura obrigatória | PRD §4.6 FR-ALERT-2 |
| Canais | PRD §4.6 FR-ALERT-3 |
| Rules-based 2026 | PRD §4.6 FR-ALERT-4, PRD §5.3 NFR-IA1 |

---

## 7. Next Step

@sm `*draft` da story 8.1 (Schema de alertas).
