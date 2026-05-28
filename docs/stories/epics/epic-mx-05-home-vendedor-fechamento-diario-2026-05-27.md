# EPIC-MX-05 — Home Vendedor + Fechamento Diário

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 3 — UI operacional

---

## 1. Goal

Entregar a Home do Vendedor como app pessoal de performance, com rotina simples, fechamento diário rápido e foco em meta, agenda, funil, ranking, feedbacks, PDI e treinamentos.

---

## 2. Background

O PRD §4.2 FR-HOME-3 define que o vendedor NÃO usa CRM dentro do MX. O MX não deve duplicar preenchimentos comerciais de CRMs parceiros. A Home deve orientar o vendedor no dia, capturar o fechamento diário e alimentar funil, disciplina, dados operacionais e desenvolvimento.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Home exibe Meu Dia, meta, comissão estimada, agenda, fechar meu dia, ranking, score pessoal, treinamentos e feedbacks |
| **AC-02** | Fechamento diário captura leads, agendamentos, visitas, vendas porta/carteira e expectativa do dia seguinte |
| **AC-03** | Fluxo é rápido, com poucos cliques e linguagem operacional |
| **AC-04** | Não duplica CRM: não cria cadastro pesado de oportunidades ou pipeline comercial paralelo |
| **AC-05** | Dados alimentam funil, disciplina, score individual e ranking |
| **AC-06** | Estados pendentes orientam o vendedor a fechar o dia |
| **AC-07** | Layout mobile-first sem overflow ou ações inacessíveis |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **5.1** | Home Meu Dia | Primeira tela pessoal do vendedor |
| **5.2** | Card de meta e comissão estimada | Mostrar meta, realizado e estimativa sem inventar regra |
| **5.3** | Agenda do dia | Exibir compromissos e pendências |
| **5.4** | Fechamento diário rápido | Capturar dados de FR-DAILY |
| **5.5** | Ranking e score pessoal | Exibir posição e evolução |
| **5.6** | Feedbacks, PDI e treinamentos | Integrar desenvolvimento pessoal |
| **5.7** | Mobile audit | Validar fluxo vendedor em mobile |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-01 — Design System
- EPIC-MX-02 — Perfis & Permissões

**Bloqueia:**
- EPIC-MX-04 — Home Gerente, por disciplina e agenda da equipe
- EPIC-MX-07 — Dimensão Disciplina do score
- EPIC-MX-08 — Alertas sobre rotina e funil

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Home Vendedor | PRD §4.2 FR-HOME-3 ← `.docx` §151–§171 |
| Não duplicar CRM | PRD §4.2 FR-HOME-3 ← `.docx` §170–§171 |
| Fechamento diário | PRD §4.5 FR-DAILY ← `.docx` §208–§222 |
| Dados operacionais | PRD §4.4 FR-DATA-1 |

---

## 7. Next Step

@sm `*draft` da story 5.1 (Home Meu Dia).
