# EPIC-MX-18 — Configurações

**Data:** 2026-05-27
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — em handoff de @aiox-master
**PRD fonte:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
**Wave:** 5 — Administração

---

## 1. Goal

Entregar Configurações para empresa, usuários, integrações e notificações, garantindo setup simples, seguro e compatível com operação por loja e perfil.

---

## 2. Background

O PRD §4.1 define Configurações como uma das seis áreas principais. O sistema precisa suportar setup de empresa, usuários, integrações e notificações sem transformar a operação em ERP.

---

## 3. Acceptance Criteria

| AC | Critério |
|---|---|
| **AC-01** | Configurações reúne empresa, usuários, integrações e notificações |
| **AC-02** | Apenas perfis autorizados acessam configurações sensíveis |
| **AC-03** | Integrações incluem agenda, notificações e futuras fontes estratégicas |
| **AC-04** | Notificações configuram canais sistema, push e WhatsApp quando disponíveis |
| **AC-05** | Configurações por loja respeitam múltiplos Masters conforme ADR-MX-003 |
| **AC-06** | UI separa setup essencial de opções avançadas |
| **AC-07** | Auditoria registra mudanças críticas |

---

## 4. Stories Planejadas

| Story | Título | Resumo |
|---|---|---|
| **18.1** | Hub Configurações | Navegação e permissões |
| **18.2** | Empresa e lojas | Dados de empresa, loja e responsáveis |
| **18.3** | Usuários e acessos | Atalhos administrativos para EPIC-MX-16 |
| **18.4** | Integrações | Agenda, notificações e conectores |
| **18.5** | Preferências de notificação | Sistema, push, WhatsApp |
| **18.6** | Auditoria de configuração | Log de mudanças críticas |

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-02 — Perfis & Permissões
- ADR-MX-003 — múltiplos Masters por loja

**Bloqueia:**
- Configuração completa de Agenda Executiva
- Canais do Sistema de Alertas

---

## 6. Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Área Configurações | PRD §4.1 FR-MENU ← `.docx` §75–§109 |
| Empresa, usuários, integrações, notificações | PRD §4.1 |
| Canais de alerta | PRD §4.6 FR-ALERT-3 |

---

## 7. Next Step

@sm `*draft` da story 18.1 (Hub Configurações).
