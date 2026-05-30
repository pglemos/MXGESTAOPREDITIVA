# Story MX-21.1 - Schema Teste Comportamental + Banco de Talentos

## Status

✅ **Done** — migration aplicada em produção (`fbhcmzzgwjdgkctlfvbo`) em 2026-05-29 via `supabase db push` (linked). Tabelas `comportamental_questoes/sessoes/respostas/perfis` + `banco_talentos` confirmadas no schema remoto; types regenerados; `tsc --noEmit` limpo.

## File List

- `supabase/migrations/20260531140000_mx21_comportamental_talentos_schema.sql` (criado) — tabelas `comportamental_questoes/sessoes/respostas/perfis` (SENSÍVEL, RLS próprio-usuário OU hr/master/director) + `banco_talentos` (agregado), ENUM, DOWN documentado.

## Story

**As a** arquiteto de dados do MX Performance,
**I want** um schema para teste comportamental (questões, respostas, perfil resultante) e banco de talentos, vinculável ao score de performance,
**so that** seja possível cruzar perfil comportamental com performance protegendo o dado sensível.

## Executor Assignment

executor: "data-engineer"
quality_gate: "dev"
quality_gate_tools: ["supabase migration list", "psql migration verification", "RLS test suite", "npm run typecheck"]

## Epic Reference

- **Épico:** EPIC-MX-21 — Teste Comportamental + Banco de Talentos
- **Arquivo:** `docs/stories/epics/epic-mx-21-teste-comportamental-banco-talentos-2026-05-29.md`
- **Fonte:** roadmap 2026-05-28 (delta N13)

## Acceptance Criteria

- [ ] **Given** ausência de schema, **when** migration roda, **then** existem `comportamental_questoes`, `comportamental_respostas` (colaborador_id FK), `comportamental_perfis` e `banco_talentos` (perfil agregado).
- [ ] **Given** resultado individual sensível, **when** perfil não autorizado consulta, **then** RLS bloqueia (RH/Dono conforme MX-02).
- [ ] **Given** vínculo com score (MX-07), **when** consultado, **then** perfil é cruzável com performance via FK.
- [ ] Migration reversível e registrada; FK para colaborador de MX-16.

## Scope

**IN:** DDL das tabelas, RLS, vínculo a colaborador (MX-16) e score (MX-07), types TS.
**OUT:** Fluxo de aplicação (21.2), consolidação de perfis vencedores (21.3).

## Dependencies

- **Bloqueado por:** EPIC-MX-02, EPIC-MX-16, EPIC-MX-07.
- **Bloqueia:** Stories 21.2 e 21.3.

## Complexity

**M** (5 pts) — schema com dado sensível + vínculo a score.

## Business Value

Base para contratação orientada a perfil de alta performance.

## Risks

- **Uso indevido/discriminatório do dado** → RLS estrita + agregação no banco de talentos; @dev valida policies no gate.

## Definition of Done

- [ ] Migration aplicada e reversível.
- [ ] RLS testada por perfil.
- [ ] FK para MX-16/MX-07 íntegras.
- [ ] Typecheck verde; sem regressão.
