# Epic Set: MX Platform Evolution — Q2 2026

**Epic Set ID:** EPIC-MX-EVOL-Q2
**Status:** PLANNING
**Owner:** @pm (Morgan) → orquestrado por @aiox-master (Orion)
**Solicitado por:** synvollt@gmail.com
**Data de criação:** 2026-04-30

---

## Resumo Executivo

Conjunto de 6 épicos derivados de uma lista de 7 tarefas operacionais solicitadas pelo product owner.
Tarefa originalmente numerada como #6 ("exibir nome do módulo de vendas") foi **descartada** após validação.

A entrega está particionada em duas ondas:

- **Onda A — Imediata** (Épicos 1–5): independente de credenciais externas, pode iniciar agora.
- **Onda B — Bloqueada** (Épico 6): requer onboarding na Meta WhatsApp Cloud API antes de iniciar implementação.

---

## Stack & Contexto

| Item | Valor |
|------|-------|
| Framework | React 19 + TypeScript + Vite 6 |
| Backend | Supabase (Postgres + Edge Functions Deno) |
| Estilização | Tailwind v4 + Design Tokens MX |
| Hosting | Vercel |
| Roles ativos | admin, dono, gerente, vendedor |
| Quality Gates | `npm run lint`, `npm run typecheck`, `bun test` |
| URL produção | https://mxperformance.vercel.app |

---

## Mapa dos Épicos

| # | Épico | Onda | Estimativa | Bloqueia | Status |
|---|-------|------|-----------|----------|--------|
| 1 | [Auth Hardening — Senha Padrão & Troca Obrigatória](./epic-1-auth-hardening.md) | A | 1d | Épico 2 | Draft |
| 2 | [User Provisioning — 4 Colaboradores MX](./epic-2-user-provisioning.md) | A | 1d | — | Draft (depende de E1) |
| 3 | [Admin Master — Edição de Lojas](./epic-3-store-edit-admin.md) | A | 2-3d | — | Draft |
| 4 | [Ranking UX — Toggle Ocultar Nome da Loja](./epic-4-ranking-ux.md) | A | 0,5d | — | Draft |
| 5 | [Agenda — Filtros & Visualizações](./epic-5-agenda-filters.md) | A | 2d | — | Draft |
| 6 | [Cadastro Self-Service de Quadro (Email + WhatsApp)](./epic-6-staff-self-service.md) | B | 8-10d | — | Placeholder (bloqueado por Meta onboarding) |

**Total Onda A:** 6,5–7,5 dias úteis
**Total Onda B:** 8–10 dias úteis (após desbloqueio)

---

## Sequência de Execução Recomendada

```
Sprint 1 (semana 1):
  ├─ Épico 1 (auth)         ← pré-requisito
  ├─ Épico 2 (provisioning) ← depende do E1
  ├─ Épico 4 (ranking)      ← pode rodar paralelo
  └─ Épico 5 (agenda)       ← pode rodar paralelo

Sprint 2 (semana 2):
  └─ Épico 3 (store edit)

Sprint 3+ (após onboarding Meta):
  └─ Épico 6 (self-service)
```

---

## Onboarding Meta WhatsApp Cloud API (Pré-requisito do Épico 6)

Itens que o product owner deve providenciar antes de iniciar o Épico 6:

- [ ] Conta Meta Business verificada
- [ ] App em developers.facebook.com com produto WhatsApp habilitado
- [ ] Número de telefone dedicado cadastrado na Meta
- [ ] Display Name aprovado pela Meta
- [ ] Verificação fiscal (CNPJ) concluída
- [ ] Template `staff_update_link` aprovado (categoria UTILITY)
- [ ] System User Token de longa duração gerado
- [ ] Variáveis adicionadas ao Vercel + Supabase secrets:
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_BUSINESS_ACCOUNT_ID`
  - `WHATSAPP_ACCESS_TOKEN`
  - `WHATSAPP_VERIFY_TOKEN`
  - `WHATSAPP_TEMPLATE_STAFF_UPDATE`

---

## Quality Gates Globais

Toda story deve passar antes de ser marcada como Done:

- [ ] `npm run typecheck` zero erros novos
- [ ] `npm run lint` zero novas violações
- [ ] `bun test` testes do escopo passam
- [ ] @qa code review aprovado (PASS ou CONCERNS documentado)
- [ ] @devops realiza push (autoridade exclusiva)

---

## Fluxo de Trabalho

Cada épico segue o **Story Development Cycle (SDC)** padrão AIOX:

```
@sm *draft → @po *validate → @dev *develop → @qa *qa-gate → @devops *push
```

---

**Última atualização:** 2026-04-30 — Orion (Master Orchestrator)
