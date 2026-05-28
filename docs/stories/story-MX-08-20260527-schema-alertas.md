# Story MX-08.1 - Schema de alertas

## Status

Ready for Review

## Story

**As a** gestor autorizado do MX Performance,
**I want** que os alertas tenham modelo persistente com tipo, estrutura obrigatoria, canais e ciclo de vida,
**so that** a Central MX, as Homes e o Consultor IA possam orientar a operacao com sinais rastreaveis.

## Executor Assignment

executor: "data-engineer"
quality_gate: "dev"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "migration review"]

## Epic Reference

- **Epic:** EPIC-MX-08 - Sistema de Alertas
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md`
- **Dependencies:** EPIC-MX-01, EPIC-MX-07
- **Consumers:** Home Dono, Home Gerente, Central MX, Consultor IA

## Context

Esta story cria a fundacao de dados dos alertas rules-based. A engine de regras fica para story posterior; aqui o objetivo e garantir que todo alerta consiga armazenar problema, impacto, recomendacao, acao rapida, tipo, canal, escopo e status sem depender de LLM.

## Acceptance Criteria

1. Existe modelo persistente para alertas com tipos `critico`, `atencao`, `positivo` e `consultivo`.
2. Todo alerta armazena problema, impacto, recomendacao e acao rapida.
3. Alertas suportam escopo por loja, departamento, indicador, vendedor/responsavel quando aplicavel.
4. Canais `sistema`, `push` e `whatsapp` ficam modelados sem obrigar envio real nesta story.
5. Status suportam `aberto`, `visto`, `resolvido` e `arquivado`.
6. Regras de permissao impedem vazamento entre lojas e perfis nao autorizados.
7. Seed ou fixtures criam exemplos seguros para UI e testes.
8. Nenhum campo sugere uso obrigatorio de LLM ou IA preditiva em 2026.

## Tasks / Subtasks

- [x] Mapear tabelas/enums existentes antes de criar nova migracao.
- [x] Criar schema de alertas com campos obrigatorios do PRD.
- [x] Modelar canais e status de ciclo de vida.
- [x] Relacionar alertas a loja, departamento, indicador e pessoa quando existir fonte.
- [x] Criar RLS/policies conforme EPIC-MX-02.
- [x] Criar fixtures ou seed de alertas anonimos para consumo da UI.
- [x] Adicionar testes de permissao e estrutura obrigatoria.
- [x] Rodar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- [x] Atualizar Dev Agent Record e File List antes de concluir.

## Dev Notes

- Nao implementar engine de geracao nesta story.
- Nao enviar push/WhatsApp nesta story; apenas modelar canal e estado.
- O `AlertCard` do Design System deve conseguir consumir os campos definidos aqui.
- Se ja existir estrutura de notificacoes, preferir extensao compativel em vez de duplicar tabelas.

## Testing

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Teste de RLS por loja/perfil
- Teste de obrigatoriedade de problema, impacto, recomendacao e acao rapida

## Article IV - Rastreabilidade

| Item | Fonte |
|---|---|
| Tipos de alerta | PRD §4.6 FR-ALERT-1 |
| Estrutura obrigatoria | PRD §4.6 FR-ALERT-2 |
| Canais | PRD §4.6 FR-ALERT-3 |
| Rules-based 2026 | PRD §4.6 FR-ALERT-4, PRD §5.3 NFR-IA1 |

## File List

- `docs/stories/story-MX-08-20260527-schema-alertas.md`
- `src/lib/mx-executive-foundation.ts`
- `src/lib/mx-executive-foundation.test.ts`
- `supabase/migrations/20260527140000_alerts_engine_schema.sql`
- `supabase/migrations/20260527170000_executive_schema_rls_hardening.sql`
- `src/features/dashboard-loja/sections/PerformanceAlerts.tsx`
- `src/features/dashboard-loja/sections/OwnerExecutiveCockpit.tsx`

## Dev Agent Record

### Debug Log

- Story criada em modo YOLO via @sm para formalizar EPIC-MX-08.1.
- 2026-05-27: Encontrada migration existente `20260527140000_alerts_engine_schema.sql` com enums `alert_type`, `alert_status`, `alert_channel`, tabela `alerts`, tabela `alert_channels` e RPCs `ack_alert`, `resolve_alert`, `dismiss_alert`.
- 2026-05-27: A migration cobre problema, impacto, recomendação, ação rápida, status, canais sistema/push/WhatsApp e origem por `rule_version`.
- 2026-05-27: A UI já possui contrato derivado `OwnerPerformanceAlert` e geração rules-based em `PerformanceAlerts.tsx`, consumida por Home Dono, Home Gerente e Central MX.
- 2026-05-27: Antes do hardening, `alerts_read` e `alert_channels_read` usavam `USING (true)`, incompatível com o critério de não vazar dados entre lojas/perfis se a tabela receber alertas multi-loja.
- 2026-05-27: Gates executados no lote MX: `npm run lint` passou com warnings preexistentes, `npm run typecheck` passou, `npm test` passou com 329 testes e `npm run build` passou.
- 2026-05-27: Criada migration incremental `20260527170000_executive_schema_rls_hardening.sql` com helper `can_access_mx_scope` e policies restritas para `alerts` e `alert_channels`.
- 2026-05-27: Adicionada cobertura unitária em `mx-executive-foundation.test.ts` para fixtures anônimas, estrutura obrigatória problema/impacto/recomendação/ação rápida/canais e leitura escopada por loja/responsável/área interna.

### Completion Notes

- Schema base existe, RLS foi endurecida por migration incremental e fixtures/testes específicos foram fechados.
- A migration original foi preservada; o ajuste de segurança entrou como migration incremental para manter rastreabilidade e rollback claros.

### Change Log

- 2026-05-27: Story atualizada de `Draft` para `InProgress` com evidência da migration existente e pendências reais de RLS/testes.
- 2026-05-27: Story movida para `Ready for Review` após cobertura de fixtures, permissões e estrutura obrigatória.
