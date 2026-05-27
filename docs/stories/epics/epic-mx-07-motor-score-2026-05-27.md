# EPIC-MX-07 — Motor MX Score

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 1 — Foundation (Top-3)

---

## 1. Goal

Construir o **motor automático de cálculo do MX Score** — o "cérebro consultivo" do produto. Score 0–100 em 5 faixas, agregado em 4 camadas (loja, departamento, individual, processos), estruturado em 3 dimensões (Resultado, Processo, Disciplina), totalmente automático sem intervenção humana.

> Sem esse motor, **nem a Central MX (FR-CENTRAL) nem o Sistema de Alertas (FR-ALERT) podem operar consultivamente**.

---

## 2. Background

O `.docx` (§241–§264) e o PRD §4.7 definem o MX Score como pilar do produto:

- **Escala:** 0–100
- **Classificação:** Elite (90–100) / Excelente (80–89) / Bom (70–79) / Atenção (60–69) / Crítico (<60)
- **Camadas:** Score da loja · Score por departamento · Score individual · Score de processos
- **Estrutura:** Resultado · Processo · Disciplina
- **Princípio inviolável:** O score é **AUTOMÁTICO**. O consultor NÃO altera a nota — apenas comenta, contextualiza, recomenda (`.docx` §259–§264).

**Restrição NFR-IA1:** Em 2026, regras fixas inteligentes — **sem IA contextual avançada**. O motor é rule-based determinístico.

---

## 3. Acceptance Criteria (do épico)

| AC | Critério |
|---|---|
| **AC-01** | Schema persistente em Supabase com 4 tabelas: `score_inputs`, `score_calculations`, `score_history`, `score_observations` |
| **AC-02** | Engine de cálculo determinístico (regras fixas, rule-based, sem LLM) implementado em camada de serviço |
| **AC-03** | Agregação correta nas 4 camadas (loja ← depto ← individual ← processos) com testes de propriedade |
| **AC-04** | Dimensões Resultado/Processo/Disciplina computadas e ponderadas conforme regras documentadas |
| **AC-05** | Classificação em 5 faixas (Elite/Excelente/Bom/Atenção/Crítico) com badges (consome `StatusBadge` do EPIC-MX-01) |
| **AC-06** | API/RPC exposta para consumo por UI (Home Dono, Gerente, Central MX) |
| **AC-07** | Garantia técnica de imutabilidade: nenhum endpoint permite `UPDATE` direto do valor final do score (apenas via reprocessamento determinístico) |
| **AC-08** | Camada de observação consultiva separada: Consultor MX grava observação **vinculada** ao score sem alterá-lo |
| **AC-09** | Job/trigger de reprocessamento automático ao mudar `score_inputs` |
| **AC-10** | Backfill histórico para lojas existentes (snapshot atual) |

---

## 4. Stories Planejadas (a serem detalhadas por @sm)

| Story | Título | Resumo |
|---|---|---|
| **7.1** | Schema de score (3 tabelas) | Migration: `score_inputs`, `score_calculations`, `score_history` |
| **7.2** | Regras de cálculo — Resultado | Pesos e fórmulas dos indicadores de Resultado |
| **7.3** | Regras de cálculo — Processo | Pesos e fórmulas de Processo |
| **7.4** | Regras de cálculo — Disciplina | Pesos e fórmulas de Disciplina |
| **7.5** | Agregação Camada Individual → Departamento | Função de roll-up com testes |
| **7.6** | Agregação Camada Departamento → Loja | Função de roll-up com testes |
| **7.7** | Score de Processos | Camada transversal (qualidade do funil, fechamento diário) |
| **7.8** | Classificação em faixas + badge | Helper + integração com `StatusBadge` |
| **7.9** | API/RPC de leitura | Endpoints para Home Dono/Gerente/Central |
| **7.10** | Guard de imutabilidade | Policy + testes garantindo sem `UPDATE` direto |
| **7.11** | Observação consultiva (Consultor MX) | Tabela `score_observations` linkada ao score |
| **7.12** | Trigger de reprocessamento | Recalcular ao mudar inputs |
| **7.13** | Backfill histórico | Job único para snapshots iniciais |

---

## 5. Dependencies

**Bloqueado por:**
- ⚠️ Parcial: EPIC-MX-02 (Perfis) para AC-08 (restrição Consultor MX). Pode iniciar 7.1–7.10 em paralelo a EPIC-MX-02.
- ⚠️ Parcial: EPIC-MX-01 (DS) para AC-05 visual (`StatusBadge`). Engine puro 7.1–7.7 não bloqueia.

**Bloqueia:**
- EPIC-MX-06 (Central MX — cérebro depende do motor)
- EPIC-MX-08 (Sistema de Alertas — alertas reagem a score)
- EPIC-MX-13 (Planejamento Estratégico — usa score histórico)
- EPIC-MX-14 (Consultor IA — interpreta deltas de score)

---

## 6. Article IV — Rastreabilidade (No Invention)

| Item | Fonte |
|---|---|
| Escala 0–100 | PRD §4.7 FR-SCORE-1 ← `.docx` §242–§243 |
| 5 faixas (Elite/Excelente/Bom/Atenção/Crítico) | PRD §4.7 FR-SCORE-2 ← `.docx` §244–§249 |
| 4 camadas | PRD §4.7 FR-SCORE-3 ← `.docx` §250–§253 |
| Estrutura Resultado/Processo/Disciplina | PRD §4.7 FR-SCORE-4 ← `.docx` §254–§258 |
| Score AUTOMÁTICO + Consultor não altera | PRD §4.7 FR-SCORE-5 ← `.docx` §259–§264 |
| Restrição rule-based 2026 | PRD §5.3 NFR-IA1 ← `.docx` §240 |

---

## 7. Risks & Mitigation

| Risco | Mitigação |
|---|---|
| Fórmulas de ponderação não definidas no `.docx` | Stories 7.2/7.3/7.4 incluem elicitação rápida com stakeholder antes do code |
| Disciplina depende de Fechamento Diário (EPIC-MX-05) | 7.4 pode usar mock até EPIC-MX-05 entregar; teste de integração no fim |
| Tentação de "Consultor altera nota" | AC-07 + Story 7.10 (guard técnico) torna isso impossível |
| Performance no roll-up com muitas lojas | Story 7.12 já prevê recalc incremental, não full-table |

---

## 8. Next Step

@sm `*draft` da story 7.1 (Schema de score) — fundação técnica de todo o épico.
