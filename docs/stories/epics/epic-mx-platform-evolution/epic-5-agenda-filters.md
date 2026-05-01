# Epic 5: Agenda — Filtros por Admin & Visualizações Temporais

**Epic ID:** EPIC-MX-EVOL-05
**Status:** Implementado
**Onda:** A (Imediata)
**Estimativa:** 2 dias úteis
**Owner:** @pm (Morgan)
**Implementação:** @dev (Dex) + @ux-design-expert (Uma)
**Origem:** Tarefa original #3

---

## Objetivo

Adicionar à página de Agenda ([https://mxperformance.vercel.app/agenda](https://mxperformance.vercel.app/agenda))
dois novos filtros que melhoram a navegação para o admin master:

1. **Filtro por admin/consultor MX** — selecionar um consultor específico para ver apenas a agenda dele, ou "Todos"
2. **Visualizações temporais pré-configuradas** — Hoje | Esta Semana | Próxima Semana | Este Mês | Todos

---

## Contexto Técnico

| Item | Localização | Estado atual |
|------|-------------|-------------|
| Página de Agenda | [src/pages/AgendaAdmin.tsx](../../../../src/pages/AgendaAdmin.tsx) | Filtro por consultor, status e período implementados |
| Hook de dados | [src/hooks/useAgendaAdmin.ts](../../../../src/hooks/useAgendaAdmin.ts) | Filtra por `consultant_id`/`auxiliary_consultant_id`, status e janelas temporais |
| Teste E2E | [src/test/agenda-filters.playwright.ts](../../../../src/test/agenda-filters.playwright.ts) | Cobre consultor específico, Todos, Hoje, Semana, Próx. Semana, Mês e Todos |
| Modelo de dado | Tabela `consulting_visits` | Usa `consultant_id` e `auxiliary_consultant_id` para agenda do admin/consultor MX |

Schema validado em `docs/data/consulting-visits-schema.md`.

---

## Stories

### Story 5.1: Auditar schema de visitas e identificar campo de consultor

**Critérios de Aceitação:**

- [x] Query Supabase: `SELECT column_name FROM information_schema.columns WHERE table_name = 'consulting_visits'`
- [x] Documentado em `docs/data/consulting-visits-schema.md` qual coluna identifica o consultor responsável
- [x] Confirmar que `users` tem flag/role para identificar quem é "admin/consultor MX" (provavelmente `role = admin`)

### Story 5.2: Backend — Filtro por consultor no `useAgendaAdmin`

**Critérios de Aceitação:**

- [x] Hook gerencia filtro opcional `consultantFilter?: string | 'todos'`
- [x] Retorna lista de consultores ativos (`consultants: Array<{id, name}>`) para popular o dropdown
- [x] Filtragem aplicada na memoização `filteredVisits` (atual em linha 224)
- [x] Mantém compatibilidade com filtros de cliente e status existentes

### Story 5.3: Backend — Suporte a janelas temporais

**Critérios de Aceitação:**

- [x] Hook aceita range temporal equivalente: `hoje | semana | proxima_semana | mes | todos`
- [x] Filtragem por `visit_date` usando `date-fns` (já no package.json):
  - `today`: `startOfDay(now)` ↔ `endOfDay(now)`
  - `this_week`: `startOfWeek(now, { weekStartsOn: 1 })` ↔ `endOfWeek(...)`
  - `next_week`: `startOfWeek(addWeeks(now, 1))` ↔ `endOfWeek(...)`
  - `this_month`: `startOfMonth(now)` ↔ `endOfMonth(now)`
  - `all`: sem filtro

### Story 5.4: Frontend — UI dos novos filtros

**Critérios de Aceitação:**

- [x] Dropdown/Combobox "Consultor" no header da agenda com opções: "Todos" + lista de consultores
- [x] Tabs ou Toggle Group com 5 opções temporais (Hoje | Semana | Próx. Semana | Mês | Todos)
- [x] Estado dos filtros persistido em URL search params (`?consultant=xxx&range=semana`) para deep-linking
- [x] Mobile responsivo (collapse em select nativo se largura < 768px)
- [x] Segue design tokens MX (atoms/molecules existentes)

### Story 5.5: Métricas e contadores reagem aos filtros

**Critérios de Aceitação:**

- [x] Cards de métrica (total, agendadas, em andamento, etc — atual em linha 311-317) recalculam com base nos filtros aplicados
- [x] Indicador visual de "filtros ativos" (badge com contador)
- [x] Botão "Limpar filtros" que reseta para `consultant = 'todos', range = 'todos'`

---

## Definition of Done

- [x] Todas as ACs das 5 stories marcadas
- [x] `npm run typecheck` + `npm run lint` + `bun test` passam
- [x] @ux-design-expert aprova UX
- [x] @qa aprova (PASS)
- [x] Teste E2E dedicado cobre filtros isolados e combinados
- [x] @devops realiza push

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Tabela `consulting_visits` não tem campo de consultor explícito | Story 5.1 audita; pode exigir migration adicional para criar `consultant_id` |
| Performance com janela "all" se houver milhares de visitas | Paginar lista; limit + scroll infinito ou data range padrão `this_month` |
| URL search params conflitam com filtros já existentes (cliente/status) | Combinar todos os filtros em um único contrato de URL |
