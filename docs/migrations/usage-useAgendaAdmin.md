# Migração — `useAgendaAdmin` (shim → sub-hooks)

**Story origem:** [2.7](../stories/sprint-2/story-2.7-split-useAgendaAdmin.md)
**Pattern:** [ADR-0051](../adr/0051-god-hook-split-pattern.md)
**Status do shim:** `@deprecated` — remover quando `consumer_count == 0`.

---

## Sub-hooks disponíveis

| Sub-hook | Path | Quando usar |
|----------|------|-------------|
| `useAgendaEvents`  | `@/hooks/agenda/useAgendaEvents`  | Precisa de visitas/eventos/clientes/consultores/produtos (lista crua) e `refetch`. |
| `useAgendaFilters` | `@/hooks/agenda/useAgendaFilters` | Precisa de filtros `dateFilter/statusFilter/consultantFilter` e URL sync, OU listas já filtradas. |
| `useAgendaView`    | `@/hooks/agenda/useAgendaView`    | Precisa de `calendarDays`, `visitsByDate`, `metrics`, navegação de mês. |
| `useAgendaCRUD`    | `@/hooks/agenda/useAgendaCRUD`    | Precisa de mutations (create/update/delete) de visitas e/ou eventos. |

Helpers (sem hooks, importar diretamente):
- `buildSaoPauloDateTime`, `getCentralSyncError`, `syncVisitToGoogle` em `@/hooks/agenda/googleSync` (ou via barrel `@/hooks/agenda`).

---

## Mapa de consumers atual

| Consumer | File | API consumida | Sub-hooks alvo | Status | PR |
|----------|------|---------------|---------------|--------|----|
| `AgendaAdmin` (page) | `src/pages/AgendaAdmin.tsx` | Tudo (return inteiro do hook + `AgendaScheduleEvent`, `AgendaVisit`, `buildSaoPauloDateTime`) | `Events` + `Filters` + `View` + `CRUD` (provavelmente todos) | shim (não migrado) | — |
| `useConsultingClientBySlug` | `src/hooks/useConsultingClientBySlug.ts` | `getCentralSyncError`, `syncVisitToGoogle` (helpers, não o hook) | direto de `@/hooks/agenda/googleSync` | shim (helpers) | — |
| `ConsultoriaClienteDetalhe` | `src/pages/ConsultoriaClienteDetalhe.tsx` | `buildSaoPauloDateTime` (helper) | direto de `@/hooks/agenda/googleSync` | shim (helper) | — |

**Total consumers:** 3 (1 hook completo + 2 só helpers).

---

## Plano de migração

### Fase A — helpers (baixíssimo risco)
1. PR-A1: `useConsultingClientBySlug` importa `getCentralSyncError` e `syncVisitToGoogle` de `@/hooks/agenda/googleSync`.
2. PR-A2: `ConsultoriaClienteDetalhe` importa `buildSaoPauloDateTime` de `@/hooks/agenda/googleSync`.

Após A1+A2: shim ainda mantém os re-exports de helpers até a Fase B remover.

### Fase B — page `AgendaAdmin`
Migrar `src/pages/AgendaAdmin.tsx` em **1 PR dedicado**, substituindo:

```ts
const { ...everything } = useAgendaAdmin()
```

por:

```ts
const events = useAgendaEvents()
const [calendarMonth, setCalendarMonth] = useState(...)
const filters = useAgendaFilters({ ...events, calendarMonth, setCalendarMonth })
const view = useAgendaView({ ...filters, dateFilter: filters.dateFilter, calendarMonth, setCalendarMonth })
const crud = useAgendaCRUD({ visits: events.visits, refetch: events.refetch, canViewAllAgendas: events.canViewAllAgendas })
```

> Como `AgendaAdmin` consome praticamente tudo, a migração será composição-1-a-1. O benefício de performance vem da decomposição da page (Story 2.6) que poderá importar sub-hooks específicos por sub-componente.

### Fase C — delete shim
Quando `grep -rn 'useAgendaAdmin\\|from.*hooks/useAgendaAdmin' src/` retornar 0 ocorrências:

1. Deletar `src/hooks/useAgendaAdmin.ts`.
2. Remover re-export do `index` de hooks (se existir).
3. Atualizar este doc com status `removed`.

---

## Checklist de prontidão para Fase C

- [ ] PR-A1 (`useConsultingClientBySlug`) merged
- [ ] PR-A2 (`ConsultoriaClienteDetalhe`) merged
- [ ] PR-B (`AgendaAdmin` page) merged
- [ ] `npm run typecheck` verde sem o shim (após delete local)
- [ ] `npm run build` verde
- [ ] Smoke E2E agenda OK

---

## Histórico

| Data | Evento |
|------|--------|
| 2026-05-18 | Shim criado (Story 2.7). Consumers inventariados: 3. |
