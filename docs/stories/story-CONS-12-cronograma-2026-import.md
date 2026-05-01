# Story CONS-12: Importar Cronograma 2026 MX e tornar Agenda editavel

**Status:** Concluida
**Origem:** Arquivos `_CRONOGRAMA 2026 MX ESCOLA DE NEGOCIOS`
**Data:** 2026-04-30

## Contexto

O material fonte contem:

- `AGENDA`: visitas de clientes com data, hora, duracao, modalidade, consultores, alvo, objetivo e ID Google.
- `CRM`: lista de clientes, produto, consultor, modalidade, alvo e motivo.
- `OBJETIVO_VISITA`: objetivos/checklists/evidencias oficiais do PMR sem viagem.
- `EVENTOS PRESENCIAIS`, `EVENTOS ONLINE` e `AULAS`: eventos/aulas com data, hora, carga, publico, responsavel, valor e ID Google.

O sistema ja possui `consulting_clients`, `consulting_visits` e templates PMR. Falta persistencia nativa para eventos/aulas do cronograma e importacao idempotente com auditoria.

## Acceptance Criteria

- [x] Criar staging/auditoria de importacao para preservar linhas brutas e problemas.
- [x] Criar entidade nativa de eventos/aulas editavel por admin MX/admin master.
- [x] Importador CLI le a planilha e grava clientes, visitas, objetivos PMR, eventos e aulas.
- [x] Importador e idempotente por chave de origem/ID Google.
- [x] Agenda exibe visitas, eventos online, eventos presenciais e aulas.
- [x] Admin pode criar, editar e excluir eventos/aulas pela Agenda.
- [x] Admin pode editar dados principais de visitas pela Agenda.
- [x] Importacao aplicada no ambiente live.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` passam.
- [x] E2E/smoke valida que Agenda renderiza itens importados.

## File List

- `docs/stories/story-CONS-12-cronograma-2026-import.md`
- `supabase/migrations/20260430172000_consulting_schedule_events_import.sql`
- `supabase/migrations/20260430173000_consulting_import_upsert_constraints.sql`
- `supabase/migrations/20260430174000_allow_duplicate_google_event_ids.sql`
- `scripts/import_cronograma_2026_mx.ts`
- `src/hooks/useAgendaAdmin.ts`
- `src/pages/AgendaAdmin.tsx`
- `src/components/organisms/VisitCard.tsx`
