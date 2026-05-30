# EPIC-MX-19 — Sistema de Remuneração Inteligente

**Data:** 2026-05-29
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/roadmap/roadmap-fechamento-gap-mx-2026-05-28.md` (ata 2026-05-28, delta N7)
**Wave:** Sprint 4 — Gestão de pessoas avançada

---

## 1. Goal

Permitir que o Dono/RH cadastre o plano de remuneração atual da empresa e compare cada cargo contra a média de mercado (abaixo / dentro / acima), parametrizada por região, tamanho da loja e meta, transformando remuneração em decisão data-driven.

---

## 2. Background

A ata de 2026-05-28 (delta N7) identificou que a MX não cobre remuneração. O Dono precisa saber se paga abaixo, dentro ou acima do mercado para reter talento e dimensionar custo. Estende a área Pessoas (EPIC-MX-16) e alimenta o motor de score/benchmarking (EPIC-MX-07, EPIC-MX-10).

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Dono/RH cadastra o plano de remuneração atual por cargo (fixo, variável, benefícios) |
| **AC-02** | Sistema classifica cada cargo como abaixo / dentro / acima da média de mercado |
| **AC-03** | Comparativo parametrizável por região, tamanho da loja e meta |
| **AC-04** | Acesso restrito conforme EPIC-MX-02 (dado sensível — apenas Dono/Master/RH) |
| **AC-05** | Dados de mercado versionados e auditáveis (fonte e data do benchmark) |
| **AC-06** | UI evita exposição indevida de salários individuais a perfis não autorizados |

---

## 4. Stories Planejadas

| Story | Título | Resumo | Executor | Quality Gate |
|---|---|---|---|---|
| **19.1** | Schema remuneração + benchmark de mercado | Tabelas de planos, faixas salariais e parâmetros (região/tamanho/meta) com RLS | @data-engineer | @dev |
| **19.2** | Cadastro do plano de remuneração atual | UI de entrada por cargo (fixo/variável/benefícios) | @dev | @architect |
| **19.3** | Comparativo de mercado | Cálculo e visualização abaixo/dentro/acima da média | @dev | @architect |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-02 — Perfis & Permissões (dado salarial sensível, RLS estrita)
- EPIC-MX-16 — Pessoas (cargos e estrutura de pessoas)
- EPIC-MX-10 — Benchmarking (agregações de mercado por região/tamanho)

**Bloqueia:**
- Decisões de retenção e dimensionamento de custo de pessoal

---

## 6. Compatibility Requirements

- [ ] APIs existentes inalteradas
- [ ] Schema novo, backward compatible (sem alterar tabelas de Pessoas existentes)
- [ ] UI segue design system (EPIC-MX-01)
- [ ] Impacto de performance mínimo (cálculo de comparativo sob demanda)

---

## 7. Risk Mitigation

- **Primary Risk:** Vazamento de dados salariais a perfis não autorizados.
- **Mitigation:** RLS estrita por perfil (EPIC-MX-02); story 19.1 valida policies com @dev como quality gate.
- **Rollback Plan:** Feature flag por loja; schema isolado permite drop sem afetar Pessoas.

---

## 8. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Sistema de Remuneração Inteligente | Roadmap 2026-05-28 §3 (delta N7) ← ata reunião 2026-05-28 |
| Comparativo abaixo/dentro/acima da média | Roadmap linha 170 |
| Parâmetros região/tamanho/meta | Roadmap linha 170 |
| Restrição de acesso por perfil | EPIC-MX-02 |

---

## 9. Handoff to @sm

"Develop as 3 stories deste epic brownfield. Enhancement sobre sistema MX existente (React + Supabase). Integração: área Pessoas (MX-16), perfis/RLS (MX-02), benchmarking (MX-10). Dado salarial é sensível — toda story deve verificar RLS e não regredir Pessoas. Manter integridade do sistema enquanto entrega remuneração data-driven."
