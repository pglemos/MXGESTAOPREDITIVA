# EPIC-MX-14 — Consultor IA (rules-based 2026)

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 4 — Inteligência consultiva

---

## 1. Goal

Implementar Consultor IA rules-based para interpretar dados, sugerir ações, identificar gargalos e recomendar melhorias, sem IA preditiva avançada ou LLM obrigatório em 2026.

---

## 2. Background

O PRD §4.14 define a função do Consultor IA. A restrição explícita para 2026 é usar regras e contexto simples. Exemplo do PRD: "Seu estoque acima de 90 dias aumentou 18%."

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Consultor IA interpreta score, alertas, benchmarking, planejamento e planos de ação |
| **AC-02** | Recomendações são determinísticas e rastreáveis a regras |
| **AC-03** | Não depende de LLM ou IA preditiva avançada |
| **AC-04** | Cada recomendação mostra dado de origem e ação sugerida |
| **AC-05** | Perfis veem recomendações adequadas ao seu escopo |
| **AC-06** | Consultor MX pode contextualizar sem alterar score automático |
| **AC-07** | Recomendações podem gerar plano de ação |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **14.1** | Catálogo de regras consultivas | Regras iniciais por indicador e perfil |
| **14.2** | Engine rules-based | Interpretar dados e gerar recomendações |
| **14.3** | UI do Consultor IA | Cards de leitura e ação sugerida |
| **14.4** | Ação a partir da recomendação | Criar plano de ação originado no consultor |
| **14.5** | Contexto do Consultor MX | Observações qualitativas vinculadas |
| **14.6** | Auditoria e explicabilidade | Mostrar origem, regra e dado usado |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-07 — Motor MX Score
- EPIC-MX-08 — Sistema de Alertas
- EPIC-MX-09 — Plano de Ação
- EPIC-MX-10 — Benchmarking
- EPIC-MX-13 — Planejamento Estratégico

**Bloqueia:**
- EPIC-MX-06 — Central MX completa

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Interpretar dados e sugerir ações | PRD §4.14 FR-IA ← `.docx` §349–§356 |
| Exemplo estoque 90 dias | PRD §4.14 |
| Regras e contexto simples | PRD §4.14, PRD §5.3 NFR-IA2 |
| Consultor não altera score | PRD §4.7 FR-SCORE-5 |

---

## 7. Next Step

@sm `*draft` da story 14.1 (Catálogo de regras consultivas).
