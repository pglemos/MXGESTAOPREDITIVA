# Story MX-7.1 - Schema de Score (3 tabelas + observação consultiva)

## Status

Draft

## Story

**As a** arquiteto de dados do MX Performance,
**I want** o schema persistente do motor MX Score em Supabase (`score_inputs`, `score_calculations`, `score_history`, `score_observations`),
**so that** o motor de cálculo automático (FR-SCORE) tenha base de dados consistente, auditável e tecnicamente impossível de violar (Consultor MX não altera nota — FR-SCORE-5).

## Executor Assignment

executor: "data-engineer"
quality_gate: "qa"
quality_gate_tools: ["supabase migration list", "psql migration verification", "npm run typecheck", "policy guard tests"]

## Epic Reference

- **Épico:** EPIC-MX-07 — Motor MX Score
- **Arquivo:** `docs/stories/epics/epic-mx-07-motor-score-2026-05-27.md`
- **PRD:** `docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md` §4.7 FR-SCORE-1 a 5 + §5.3 NFR-IA1

## Acceptance Criteria

- [ ] Nova migration em `supabase/migrations/20260527HHMMSS_score_engine_schema.sql` (timestamp sequencial após 20260527100000 de roles)
- [ ] Tabela `score_inputs`:
  - `id` (uuid PK), `scope_type` (enum: 'store'|'department'|'individual'|'process'), `scope_id` (uuid),
  - `metric_code` (text), `metric_value` (numeric), `dimension` (enum: 'resultado'|'processo'|'disciplina'),
  - `period` (date), `created_at`, `created_by` (uuid FK → profiles)
- [ ] Tabela `score_calculations`:
  - `id` (uuid PK), `scope_type`, `scope_id`,
  - `value` (numeric, CHECK between 0 and 100),
  - `band` (enum: 'elite'|'excellent'|'good'|'attention'|'critical'),
  - `dim_resultado` (numeric), `dim_processo` (numeric), `dim_disciplina` (numeric),
  - `calculation_version` (text — referência da regra que gerou),
  - `computed_at` (timestamptz), `period` (date)
- [ ] Tabela `score_history`:
  - `id` (uuid PK), `calculation_id` (uuid FK → score_calculations),
  - `snapshot_payload` (jsonb — cópia completa imutável),
  - `archived_at` (timestamptz default now())
  - **Imutável:** trigger BEFORE UPDATE/DELETE bloqueando alterações
- [ ] Tabela `score_observations`:
  - `id` (uuid PK), `calculation_id` (uuid FK → score_calculations),
  - `author_id` (uuid FK → profiles, CHECK role = 'consultant' ou 'master'),
  - `observation_text` (text), `created_at`
  - **Garantia:** Consultor MX só pode INSERT aqui; nunca UPDATE em `score_calculations`
- [ ] **Guard técnico (AC crítico):** Policy ou REVOKE garantindo que **nenhum role (incluindo consultant) pode UPDATE `score_calculations.value`**. Apenas service_role via RPC determinística pode escrever.
- [ ] RLS habilitada nas 4 tabelas com policy temporária permissiva e `-- TODO: consume EPIC-MX-02 roles when ready` documentado
- [ ] Function/RPC pública `get_score(scope_type, scope_id, period)` exposta para Frontend (read-only)
- [ ] Migration **reversível**
- [ ] Documentação SQL inline em cada tabela explicando dimensões R/P/D, faixas e princípio da automação
- [ ] Sem regressão em `npm run typecheck` após `supabase gen types typescript`

## Tasks / Subtasks

- [ ] Criar ENUM types: `score_scope_type`, `score_dimension`, `score_band`
- [ ] Implementar `score_inputs` com índice composto (`scope_type`, `scope_id`, `period`)
- [ ] Implementar `score_calculations` com unique constraint (`scope_type`, `scope_id`, `period`)
- [ ] Implementar `score_history` com trigger `prevent_update_delete`
- [ ] Implementar `score_observations` com CHECK em author role
- [ ] Implementar trigger pós-INSERT em `score_calculations` que arquiva em `score_history`
- [ ] Implementar guard de imutabilidade: REVOKE UPDATE em `score_calculations.value` de TODOS roles não-service
- [ ] Implementar RPC `get_score()` exposta para frontend
- [ ] Habilitar RLS + policies temporárias documentadas
- [ ] Escrever migration DOWN reversível
- [ ] Regenerar types TypeScript
- [ ] Testes: tentativa de UPDATE direto em `value` deve falhar; INSERT em observação por consultor deve funcionar; UPDATE em score_history deve falhar

## Dev Notes

### 🔍 Auditoria do estado atual (2026-05-27)

| Item | Estado encontrado |
|---|---|
| Tabelas `score_*` no schema | **Zero** — campo virgem, sem legado a preservar 🟢 |
| Coluna `mx_score?` em código | Presente em `WeeklyStoreReport.tsx` (linha 14) — possivelmente vem de view/RPC `dashboard_*` ou agregação ad-hoc |
| Componentes UI consumidores | `MXScoreCard` (`components/molecules/`), `MXScoreCompact` (`OwnerExecutiveCockpit.tsx`) — todos consomem `score: number` |
| Cálculo atual | Aparentemente **ad-hoc** (sem motor centralizado) — esta story cria o motor canônico |

**Implicação:** Schema novo não conflita com nada. Mas há uso atual de `mx_score` que precisa ser **alimentado** pelo novo motor após implantação. Story 7.9 (RPC `get_score()`) deve ser compatível com signature já consumida no frontend (`score: number`).

### Princípio inviolável (FR-SCORE-5)

> O score será **AUTOMÁTICO**. O consultor **NÃO altera a nota**. O consultor apenas comenta, contextualiza, recomenda. (`.docx` §259–§264)

Materialização técnica:
1. `score_observations` é a **única** porta de entrada para o consultor.
2. `score_calculations.value` é **NUNCA** atualizado por humano — apenas reprocessado via RPC determinística que faz INSERT de nova linha (não UPDATE).
3. `score_history` é imutável após criação.

### Faixas (FR-SCORE-2)

ENUM `score_band`:
- `elite` (90–100)
- `excellent` (80–89)
- `good` (70–79)
- `attention` (60–69)
- `critical` (<60)

Helper SQL para classificação:

```sql
CREATE OR REPLACE FUNCTION classify_score(v numeric) RETURNS score_band AS $$
  SELECT CASE
    WHEN v >= 90 THEN 'elite'::score_band
    WHEN v >= 80 THEN 'excellent'::score_band
    WHEN v >= 70 THEN 'good'::score_band
    WHEN v >= 60 THEN 'attention'::score_band
    ELSE 'critical'::score_band
  END;
$$ LANGUAGE sql IMMUTABLE;
```

### Camadas (FR-SCORE-3)

`scope_type` cobre as 4 camadas: `store`, `department`, `individual`, `process`. Agregações entre camadas são responsabilidade das Stories 7.5/7.6/7.7 (engine), não desta story.

### Dependência com EPIC-MX-02

Esta story **inicia antes** da Story 2.2 (RLS policies finais), portanto:
- RLS está **habilitada** mas com policy permissiva temporária (`USING (true)`)
- TODO explícito no SQL: substituir por policy baseada em `auth.uid() + role_code` quando 2.2 entregar
- Story 7.1 NÃO bloqueia em 2.1 para o schema, mas a policy final do score depende de roles canônicos.

### Convenção de migration

- Story 2.1 propôs `20260527100000_canonical_roles_schema.sql`
- Esta story usa `20260527110000_score_engine_schema.sql` (1h após para ordenação clara)

### NFR-IA1 — rule-based, sem LLM

O **schema é agnóstico ao algoritmo**. O motor (Stories 7.2–7.4) será rule-based determinístico. `calculation_version` rastreia qual versão de regras produziu cada cálculo — permite reprocessamento histórico se regras evoluírem.

## Testing

| Teste | Esperado |
|---|---|
| INSERT em `score_inputs` por qualquer role autenticado | ✅ permitido (policy permissiva temporária) |
| INSERT direto em `score_calculations` por user/consultant | ❌ negado (apenas service_role via RPC) |
| UPDATE em `score_calculations.value` por qualquer role | ❌ negado (REVOKE) |
| UPDATE em `score_history` | ❌ negado (trigger) |
| INSERT em `score_observations` por role=consultant | ✅ permitido |
| INSERT em `score_observations` por role=seller | ❌ negado (CHECK role) |
| Migration UP + DOWN + UP em branch | ✅ idempotente |
| `supabase gen types` produz types corretos | ✅ |

## Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| Escala 0–100 | PRD §4.7 FR-SCORE-1 ← `.docx` §242–§243 |
| 5 faixas | PRD §4.7 FR-SCORE-2 ← `.docx` §244–§249 |
| 4 camadas | PRD §4.7 FR-SCORE-3 ← `.docx` §250–§253 |
| Estrutura Resultado/Processo/Disciplina | PRD §4.7 FR-SCORE-4 ← `.docx` §254–§258 |
| AUTOMÁTICO + Consultor não altera | PRD §4.7 FR-SCORE-5 ← `.docx` §259–§264 |
| Rule-based 2026 | PRD §5.3 NFR-IA1 ← `.docx` §240, §356 |

## Estimate

L (large) — 4 tabelas + 3 ENUMs + triggers + RPC + RLS + testes de policy.

## Next Step

Após DoD: @qa `*qa-gate` e desbloqueio das stories 7.2/7.3/7.4 (regras de cálculo Resultado/Processo/Disciplina).
