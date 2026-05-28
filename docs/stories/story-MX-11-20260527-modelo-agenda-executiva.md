# Story MX-11.1 - Modelo de agenda executiva

## Status

Ready for Review

## Story

**As a** dono, diretor ou gestor autorizado,
**I want** uma agenda executiva que relacione compromissos, reunioes, lembretes e acompanhamentos a loja, plano de acao, visita ou alerta,
**so that** a rotina executiva fique conectada ao que o MX detecta e recomenda.

## Executor Assignment

executor: "data-engineer"
quality_gate: "architect"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "integration privacy review"]

## Epic Reference

- **Epic:** EPIC-MX-11 - Agenda Executiva
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
- **Related existing story:** `docs/stories/story-CONS-03-google-calendar-readonly-foundation.md`
- **Dependencies:** EPIC-MX-02
- **Consumers:** Home Dono, Central MX, Dashboard Executivo

## Context

Esta story modela a agenda executiva antes de ampliar integracoes. O projeto ja possui fundacao Google Calendar readonly para consultoria; aqui o modelo precisa ser produto, com vinculos executivos e privacidade preservada. Outlook fica previsto no contrato, mas a conexao tecnica pode vir em story posterior.

## Acceptance Criteria

1. Existe modelo para compromisso, reuniao, lembrete e acompanhamento executivo.
2. Evento pode se relacionar a loja, plano de acao, visita, alerta ou responsavel.
3. O contrato diferencia origem manual, Google Calendar e Outlook.
4. Estados de integracao suportam conectado, pendente, erro e desconectado.
5. Regras de privacidade existentes de Google Calendar sao preservadas.
6. Permissoes respeitam perfil, loja e escopo do evento.
7. O modelo permite exibir agenda na Home Dono, Central MX e Dashboard Executivo.
8. Estados sem integracao orientam conexao sem bloquear uso manual.

## Tasks / Subtasks

- [x] Auditar implementacao Google Calendar readonly existente.
- [x] Definir entidades de agenda executiva e vinculos com loja/alerta/plano/visita.
- [x] Modelar origem manual, Google e Outlook.
- [x] Modelar estado de integracao e erro operacional.
- [x] Aplicar RLS por perfil, loja e responsavel.
- [x] Criar fixtures de eventos executivos sem dados sensiveis.
- [x] Documentar fronteira entre esta story e integracoes Google/Outlook posteriores.
- [x] Rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- [x] Atualizar Dev Agent Record e File List antes de concluir.

## Dev Notes

- Nao reimplementar OAuth Google nesta story se a fundacao ja existir.
- Nao criar dependencia obrigatoria de Outlook para uso manual da agenda.
- Eventos importados devem evitar expor detalhes privados alem do escopo permitido.
- Agenda executiva deve alimentar a rotina, nao substituir calendario pessoal.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Teste de permissao por perfil/loja
- Teste de evento vinculado a plano/alerta/visita
- Teste de estado sem integracao

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| Google + Outlook | PRD §4.10 FR-AGENDA |
| Reunioes, lembretes, acompanhamentos | PRD §4.10 |
| Privacidade Google existente | `docs/stories/story-CONS-03-google-calendar-readonly-foundation.md` |

## File List

- `docs/stories/story-MX-11-20260527-modelo-agenda-executiva.md`
- `docs/stories/story-CONS-03-google-calendar-readonly-foundation.md`
- `src/lib/mx-executive-foundation.ts`
- `src/lib/mx-executive-foundation.test.ts`
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`
- `src/features/agenda-admin/AgendaAdmin.container.tsx`
- `src/features/agenda/components/GoogleCalendarStatus.tsx`
- `src/hooks/useGoogleCalendar.ts`
- `src/hooks/useAgendaAdmin.ts`
- `src/hooks/agenda/types.ts`
- `supabase/migrations/20260413120000_consulting_google_calendar.sql`
- `supabase/migrations/20260506100000_agenda_consultoria_admin_master_scope.sql`
- `supabase/migrations/20260527190000_executive_agenda_schema.sql`

## Dev Agent Record

### Debug Log

- Story criada em modo YOLO via @sm para formalizar EPIC-MX-11.1.
- 2026-05-27: Auditada a fundação existente de Google Calendar registrada em `story-CONS-03-google-calendar-readonly-foundation.md`, incluindo tokens/configuração, leitura, sync e revisão de privacidade.
- 2026-05-27: `AgendaView` no cockpit do dono já oferece visão executiva com compromissos, prioridades, lembretes e CTA de sincronização Google, usando fixtures sem dados sensíveis.
- 2026-05-27: `AgendaAdmin` e hooks de agenda já possuem eventos de consultoria, filtros, status e Google sync; isso ainda não é um modelo executivo generalizado para dono/diretor.
- 2026-05-27: Outlook fica apenas como contrato previsto; não há integração técnica encontrada nesta passagem.
- 2026-05-27: Gates executados no lote MX: `npm run lint` passou com warnings preexistentes, `npm run typecheck` passou, `npm test` passou com 329 testes e `npm run build` passou.
- 2026-05-27: Criada migration `20260527190000_executive_agenda_schema.sql` com `eventos_agenda_executiva`, tipos de evento, origem manual/Google/Outlook, status de integração, vínculos com loja, responsável, plano de ação, visita e alerta, além de RLS por loja/responsável/criador.
- 2026-05-27: Adicionada cobertura unitária em `mx-executive-foundation.test.ts` para vínculos executivos, estados de integração sem bloqueio de uso manual e redaction de detalhes privados importados de calendário.

### Completion Notes

- Existe base Google Calendar e UI executiva; a entidade persistente específica de Agenda Executiva foi adicionada para o produto.
- A fronteira atual é: Google já existe para consultoria/agenda MX; Outlook entra como contrato/modelo nesta story, sem OAuth ou sync técnico obrigatório.
- O modelo preserva uso manual quando integração estiver pendente, com erro ou desconectada.
- A privacidade de calendário importado fica protegida pelo contrato de exibição sanitizada e pelo `private_payload` documentado para consumo restrito.

### Change Log

- 2026-05-27: Story atualizada de `Draft` para `InProgress` com evidência de agenda existente e pendências do modelo executivo.
- 2026-05-27: Story movida para `Ready for Review` após criação do schema persistente, RLS e cobertura unitária.
