# EPIC-MX-20 — Organograma + Plano de Carreira

**Data:** 2026-05-29
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/roadmap/roadmap-fechamento-gap-mx-2026-05-28.md` (ata 2026-05-28, delta N8)
**Wave:** Sprint 4 — Gestão de pessoas avançada

---

## 1. Goal

Dar à empresa uma visão hierárquica visual da estrutura (organograma) e um plano de carreira por cargo, deixando claro para cada colaborador o caminho de evolução e para o Dono a estrutura organizacional real.

---

## 2. Background

A ata de 2026-05-28 (delta N8) apontou ausência de organograma e plano de carreira na MX. Estende a área Pessoas (EPIC-MX-16) usando cargos já existentes e conecta com PDIs e Universidade MX (EPIC-MX-17) para trilhas de evolução.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Organograma exibe a estrutura hierárquica da empresa de forma visual |
| **AC-02** | Cada cargo possui um plano de carreira (próximos níveis, requisitos) |
| **AC-03** | Colaborador visualiza seu cargo atual e o caminho de evolução |
| **AC-04** | Master/Dono edita estrutura e cargos conforme EPIC-MX-02 |
| **AC-05** | Organograma reflete cargos e pessoas reais (sem duplicar cadastro de MX-16) |
| **AC-06** | Plano de carreira conecta com PDIs/trilhas (EPIC-MX-16/MX-17) quando disponível |

---

## 4. Stories Planejadas

| Story | Título | Resumo | Executor | Quality Gate |
|---|---|---|---|---|
| **20.1** | Schema organograma + cargos/carreira | Estrutura hierárquica, níveis de cargo, requisitos por nível, RLS | @data-engineer | @dev |
| **20.2** | Organograma visual | Componente de árvore hierárquica navegável | @ux-design-expert | @dev |
| **20.3** | Plano de carreira por cargo | Trilha de evolução e requisitos por cargo | @dev | @architect |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-02 — Perfis & Permissões
- EPIC-MX-16 — Pessoas (cargos e pessoas reais)

**Relacionado a:**
- EPIC-MX-17 — Universidade MX (trilhas vinculadas ao plano de carreira)

**Bloqueia:**
- Clareza de evolução por colaborador
- PDIs ancorados em trilha de carreira

---

## 6. Compatibility Requirements

- [ ] APIs existentes inalteradas
- [ ] Schema novo referencia cargos de MX-16 sem alterá-los (backward compatible)
- [ ] UI segue design system (EPIC-MX-01)
- [ ] Performance do organograma adequada a estruturas grandes (lazy/virtualização)

---

## 7. Risk Mitigation

- **Primary Risk:** Duplicação do cadastro de cargos/pessoas já existente em MX-16.
- **Mitigation:** Story 20.1 referencia entidades de Pessoas; @dev valida no quality gate ausência de duplicação (IDS: REUSE > CREATE).
- **Rollback Plan:** Feature flag por loja; schema aditivo com FKs para entidades existentes.

---

## 8. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Organograma + Plano de Carreira | Roadmap 2026-05-28 §3 (delta N8) ← ata reunião 2026-05-28 |
| Estrutura hierárquica visual | Roadmap linha 173 |
| Plano de carreira por cargo | Roadmap linha 173 |
| Cargos e pessoas reais | EPIC-MX-16 |

---

## 9. Handoff to @sm

"Develop as 3 stories deste epic brownfield. Enhancement sobre sistema MX existente (React + Supabase). Integração: cargos/pessoas de MX-16, perfis/RLS de MX-02, trilhas de MX-17. Reusar entidades de Pessoas (não duplicar). Toda story verifica não-regressão de MX-16. Entregar visão organizacional + caminho de carreira mantendo integridade."
