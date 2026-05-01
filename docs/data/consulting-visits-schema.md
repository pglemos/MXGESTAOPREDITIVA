# Consulting Visits Schema — Agenda Filters

**Data:** 2026-04-30
**Fonte:** `supabase/migrations/00000000000000_baseline_legacy_schema.sql`

## Colunas relevantes

| Coluna | Tipo | Uso na agenda |
|---|---:|---|
| `id` | `uuid` | Identificador da visita. |
| `client_id` | `uuid` | Relacao com `consulting_clients`. |
| `visit_number` | `integer` | Etapa 1-7 da consultoria. |
| `scheduled_at` | `timestamptz` | Base dos filtros Hoje/Semana/Proxima Semana/Mes/Todos. |
| `duration_hours` | `numeric` | Duracao exibida nos cards. |
| `modality` | `text` | Presencial/Online. |
| `status` | `text` | Filtro de status. |
| `consultant_id` | `uuid` | Consultor responsavel. |
| `auxiliary_consultant_id` | `uuid` | Consultor auxiliar. |
| `objective` | `text` | Objetivo da visita. |
| `google_event_id` | `text` | Sincronizacao Google Calendar por consultor. |
| `google_event_id_central` | `text` | Sincronizacao Google Calendar central. |

## Campo de consultor

O filtro por consultor usa:

- `consultant_id` para visitas em que o admin/consultor e responsavel.
- `auxiliary_consultant_id` para visitas em que ele atua como auxiliar.

A lista de consultores vem de `public.users` com `role = 'admin'` e `active = true`.
