# EPIC-MX-21 — Teste Comportamental + Banco de Talentos

**Data:** 2026-05-29
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/roadmap/roadmap-fechamento-gap-mx-2026-05-28.md` (ata 2026-05-28, delta N13)
**Wave:** Sprint 4 — Gestão de pessoas avançada

---

## 1. Goal

Aplicar um teste comportamental no onboarding de cada colaborador e construir um banco de "perfis vencedores" que sirva de referência para futuras contratações, conectando perfil comportamental com performance real.

---

## 2. Background

A ata de 2026-05-28 (delta N13) propôs teste comportamental no onboarding e um banco de talentos. Ao cruzar perfil comportamental com performance (EPIC-MX-07 score), a MX identifica os traços de quem performa bem e replica isso na contratação. Estende Pessoas (EPIC-MX-16) e o onboarding/Universidade MX (EPIC-MX-17).

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Teste comportamental aplicado no onboarding do colaborador |
| **AC-02** | Resultado do teste armazenado e vinculado ao colaborador |
| **AC-03** | Banco de talentos consolida perfis de alta performance ("perfis vencedores") |
| **AC-04** | Perfil comportamental cruzável com score de performance (EPIC-MX-07) |
| **AC-05** | Acesso a resultados restrito conforme EPIC-MX-02 (dado sensível — RH/Dono) |
| **AC-06** | Banco de talentos referenciável em futuras contratações |

---

## 4. Stories Planejadas

| Story | Título | Resumo | Executor | Quality Gate |
|---|---|---|---|---|
| **21.1** | Schema teste comportamental + banco de talentos | Questões, respostas, perfis e RLS; vínculo com score | @data-engineer | @dev |
| **21.2** | Aplicação de teste no onboarding | Fluxo de teste integrado ao onboarding (MX-17) | @dev | @architect |
| **21.3** | Banco de perfis vencedores | Consolidação de perfis de alta performance para contratação | @dev | @architect |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-02 — Perfis & Permissões (resultado é dado sensível)
- EPIC-MX-16 — Pessoas (colaborador)
- EPIC-MX-07 — Motor de Score (cruzamento perfil × performance)

**Relacionado a:**
- EPIC-MX-17 — Universidade MX (onboarding)

**Bloqueia:**
- Contratação orientada por perfil de performance

---

## 6. Compatibility Requirements

- [ ] APIs existentes inalteradas
- [ ] Schema novo, backward compatible (vincula a colaborador de MX-16 via FK)
- [ ] UI do teste segue design system (EPIC-MX-01)
- [ ] Performance adequada (teste assíncrono, sem bloquear onboarding)

---

## 7. Risk Mitigation

- **Primary Risk:** Uso indevido/discriminatório de resultado comportamental, ou exposição do dado sensível.
- **Mitigation:** RLS estrita (EPIC-MX-02); banco de talentos agrega padrões, não expõe resultado individual a perfis não autorizados; @dev valida policies no quality gate.
- **Rollback Plan:** Feature flag por loja; schema isolado, drop sem afetar onboarding.

---

## 8. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Teste Comportamental + Banco de Talentos | Roadmap 2026-05-28 §3 (delta N13) ← ata reunião 2026-05-28 |
| Aplicação no onboarding | Roadmap linha 176 |
| Banco de "perfis vencedores" | Roadmap linha 176 |
| Cruzamento com performance | EPIC-MX-07 |

---

## 9. Handoff to @sm

"Develop as 3 stories deste epic brownfield. Enhancement sobre sistema MX existente (React + Supabase). Integração: colaborador de MX-16, onboarding de MX-17, score de MX-07, RLS de MX-02. Resultado comportamental é dado sensível — toda story verifica RLS e uso ético (agregação, não exposição individual). Não regredir onboarding. Entregar teste + banco de talentos mantendo integridade."
