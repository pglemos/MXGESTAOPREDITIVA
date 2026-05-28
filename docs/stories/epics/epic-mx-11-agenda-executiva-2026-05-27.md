# EPIC-MX-11 — Agenda Executiva

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 4 — Integrações

---

## 1. Goal

Entregar Agenda Executiva integrada a Google Agenda e Outlook, apoiando rotina executiva, lembretes, reuniões, acompanhamento e notificações.

---

## 2. Background

O PRD §4.10 define integração obrigatória com Google Agenda e Outlook. O projeto já possui fundação Google Calendar em histórias anteriores; este épico amplia a visão para agenda executiva do produto e prepara Outlook.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Agenda executiva exibe compromissos, reuniões, lembretes e acompanhamentos |
| **AC-02** | Integração Google Agenda preserva regras de privacidade existentes |
| **AC-03** | Integração Outlook fica modelada e implementada conforme prioridade técnica |
| **AC-04** | Eventos podem se relacionar a loja, plano de ação, visita ou alerta |
| **AC-05** | Notificações respeitam perfil e escopo de acesso |
| **AC-06** | Estados sem integração orientam conexão sem bloquear uso do sistema |
| **AC-07** | Agenda aparece na Home Dono, Central MX e Dashboard Executivo |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **11.1** | Modelo de agenda executiva | Entidades, vínculos e permissões |
| **11.2** | Google Calendar executivo | Reutilizar fundação Google com visão executiva |
| **11.3** | Outlook Calendar foundation | OAuth, leitura e sincronização inicial |
| **11.4** | Agenda na Home Dono | Próximas reuniões e rituais |
| **11.5** | Agenda na Central MX | Eventos vinculados a ações e alertas |
| **11.6** | Notificações de agenda | Lembretes e acompanhamentos |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-02 — Perfis & Permissões
- Histórias Google Calendar existentes em `docs/stories/story-CONS-03-google-calendar-readonly-foundation.md`

**Bloqueia:**
- EPIC-MX-03 — Home Dono
- EPIC-MX-06 — Central MX
- EPIC-MX-12 — Dashboard Executivo

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Google + Outlook obrigatórios | PRD §4.10 FR-AGENDA ← `.docx` §304–§313 |
| Rotina, lembretes, reuniões, acompanhamento, notificações | PRD §4.10 |
| Privacidade Google existente | `docs/stories/story-CONS-03-google-calendar-readonly-foundation.md` |

---

## 7. Next Step

@sm `*draft` da story 11.1 (Modelo de agenda executiva).
