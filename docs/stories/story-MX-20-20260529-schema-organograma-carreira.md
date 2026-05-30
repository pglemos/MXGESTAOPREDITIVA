# Story MX-20.1 - Schema Organograma + Cargos/Carreira

## Status

✅ **Done** — migration aplicada em produção (`fbhcmzzgwjdgkctlfvbo`) em 2026-05-29 via `supabase db push` (linked). Tabelas `organograma_nos` (com trigger anti-ciclo) e `carreira_niveis` confirmadas no schema remoto; types regenerados; `tsc --noEmit` limpo.

## File List

- `supabase/migrations/20260531130000_mx20_organograma_carreira_schema.sql` (criado) — tabelas `organograma_nos` (self-FK + trigger anti-ciclo), `carreira_niveis`, RLS, DOWN documentado.

## Story

**As a** arquiteto de dados do MX Performance,
**I want** um schema para estrutura hierárquica (organograma) e trilha de carreira por cargo (níveis e requisitos),
**so that** organograma e plano de carreira reflitam cargos/pessoas reais sem duplicar o cadastro de MX-16.

## Executor Assignment

executor: "data-engineer"
quality_gate: "dev"
quality_gate_tools: ["supabase migration list", "psql migration verification", "RLS test suite", "npm run typecheck"]

## Epic Reference

- **Épico:** EPIC-MX-20 — Organograma + Plano de Carreira
- **Arquivo:** `docs/stories/epics/epic-mx-20-organograma-plano-carreira-2026-05-29.md`
- **Fonte:** roadmap 2026-05-28 (delta N8)

## Acceptance Criteria

- [ ] **Given** ausência de schema, **when** migration roda, **then** existem `organograma_nos` (cargo/pessoa, parent_id self-FK, loja_id) e `carreira_niveis` (cargo, nivel, requisitos, proximo_nivel).
- [ ] **Given** cargos existentes em MX-16, **when** o organograma referencia, **then** usa FK (não duplica cargo/pessoa).
- [ ] **Given** hierarquia, **when** consultada, **then** a relação parent/child é íntegra (sem ciclo).
- [ ] RLS conforme EPIC-MX-02; migration reversível e registrada.

## Scope

**IN:** DDL das tabelas, self-FK hierárquica, constraint anti-ciclo, RLS, types TS.
**OUT:** Organograma visual (20.2), UI de carreira (20.3).

## Dependencies

- **Bloqueado por:** EPIC-MX-02, EPIC-MX-16 (cargos/pessoas).
- **Bloqueia:** Stories 20.2 e 20.3.

## Complexity

**M** (5 pts) — modelo hierárquico self-referencing com integridade.

## Business Value

Fundação de dados para visão organizacional e evolução de carreira.

## Risks

- **Duplicação de cargos/pessoas** → FK para MX-16 (IDS REUSE); @dev valida no gate.
- **Ciclos na hierarquia** → constraint/validação anti-ciclo.

## Definition of Done

- [ ] Migration aplicada e reversível.
- [ ] FK para MX-16 sem duplicação.
- [ ] Anti-ciclo testado.
- [ ] Typecheck verde; sem regressão em MX-16.
