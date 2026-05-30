# Story MX-19.1 - Schema de Remuneração + Benchmark de Mercado

## Status

✅ **Done** — migration aplicada em produção (`fbhcmzzgwjdgkctlfvbo`) em 2026-05-29 via `supabase db push` (linked). Tabelas `remuneracao_planos` e `remuneracao_benchmark` confirmadas no schema remoto; types regenerados (`npm run gen:db-types`); `tsc --noEmit` limpo.

## File List

- `supabase/migrations/20260531120000_mx19_remuneracao_schema.sql` (criado) — tabelas `remuneracao_planos`, `remuneracao_benchmark`, RLS master/director/hr, ENUM, trigger updated_at, DOWN documentado.

## Story

**As a** arquiteto de dados do MX Performance,
**I want** um schema para planos de remuneração por cargo e faixas de benchmark de mercado parametrizadas por região, tamanho de loja e meta,
**so that** o sistema possa classificar cada cargo como abaixo/dentro/acima da média protegendo o dado salarial com RLS estrita.

## Executor Assignment

executor: "data-engineer"
quality_gate: "dev"
quality_gate_tools: ["supabase migration list", "psql migration verification", "RLS test suite", "npm run typecheck"]

## Epic Reference

- **Épico:** EPIC-MX-19 — Sistema de Remuneração Inteligente
- **Arquivo:** `docs/stories/epics/epic-mx-19-remuneracao-inteligente-2026-05-29.md`
- **Fonte:** `docs/roadmap/roadmap-fechamento-gap-mx-2026-05-28.md` (delta N7)

## Acceptance Criteria

- [ ] **Given** ausência de schema de remuneração, **when** a migration roda, **then** existem tabelas `remuneracao_planos` (cargo, fixo, variável, benefícios, loja_id) e `remuneracao_benchmark` (cargo, região, faixa_tamanho, meta, faixa_min, faixa_mediana, faixa_max, fonte, data_referencia).
- [ ] **Given** dado salarial sensível, **when** um perfil não autorizado consulta, **then** RLS bloqueia (apenas master/director/hr conforme EPIC-MX-02).
- [ ] **Given** benchmark de mercado, **when** atualizado, **then** versão anterior é auditável (fonte + data_referencia preservadas).
- [ ] Migration reversível (DOWN script) e registrada em `supabase_migrations.schema_migrations`.
- [ ] FKs referenciam entidades existentes (cargos de MX-16, loja) sem duplicá-las.
- [ ] Comentários SQL inline em cada coluna.

## Scope

**IN:** DDL das 2 tabelas, RLS policies, índices, seed mínimo de benchmark de exemplo, types TS gerados.
**OUT:** UI de cadastro (19.2), cálculo de comparativo (19.3), integração com benchmarking agregado de MX-10.

## Dependencies

- **Bloqueado por:** EPIC-MX-02 (roles/RLS), EPIC-MX-16 (cargos).
- **Bloqueia:** Stories 19.2 e 19.3.

## Complexity

**M** (5 pts) — schema novo com RLS sensível, sem alterar tabelas existentes.

## Business Value

Base de dados para decisão de retenção/custo de pessoal orientada a mercado.

## Risks

- **Vazamento de dado salarial** → mitigado por RLS estrita + quality gate @dev valida policies.
- **Duplicação de cargos** → FK para MX-16 (IDS REUSE).

## Definition of Done

- [ ] Migration aplicada e reversível verificada.
- [ ] RLS testada por perfil (autorizado vê, não-autorizado bloqueado).
- [ ] Types TS atualizados; `npm run typecheck` verde.
- [ ] Sem regressão em tabelas de Pessoas (MX-16).
