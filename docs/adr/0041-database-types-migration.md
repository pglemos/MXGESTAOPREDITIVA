# ADR-0041 — Migração faseada de database types (hand-written → Supabase generated)

**Status:** Accepted
**Date:** 2026-05-17
**Story:** 0.1 (Sprint 0)
**Débito:** DB-014, X-1
**Decisor:** @architect (Aria) + @data-engineer (Dara)

## Contexto

`src/types/database.ts` foi escrito à mão (610 LOC) durante o desenvolvimento inicial.
58 arquivos importam dele via `@/types/database`. Não há types autogerados via Supabase CLI,
o que gera:

- **Drift PT-BR ↔ EN** (X-1): nomes de colunas/tabelas divergem entre código e schema real
- **Bugs de runtime** ao alterar schema sem atualizar o type manual
- **Bloqueio** de refactors seguros nas god-hooks/pages de Sprint 1/2
- **Impossibilidade** de CI validar contrato schema↔código

## Decisão

Adotar **migração faseada com coexistência temporária** de dois arquivos:

1. `src/types/database.generated.ts` — gerado por `supabase gen types typescript --linked`, fonte da verdade
2. `src/types/database.ts` — legacy, mantido até último consumer migrar

Migração progressiva por feature/domínio, não em big-bang.

## Alternativas consideradas

| Opção | Pros | Contras | Veredito |
|-------|------|---------|----------|
| **A. Big-bang rewrite** (substituir database.ts em 1 PR) | Limpo, rápido | Blast radius 58 arquivos, risco alto regressão, bloqueia Sprint 1 | REJEITADA |
| **B. Coexistência faseada** | Risco contido, validação por feature, CI gate desde dia 1 | 2 arquivos por algumas semanas, possível confusão sobre qual usar | **ESCOLHIDA** |
| **C. Manter só hand-written + ferramenta de diff** | Zero churn | Não resolve drift, exige manutenção dupla manual | REJEITADA |

## Plano de migração

### Fase 0 (esta story — 0.1) ✅
- Gerar `database.generated.ts` baseline
- CI gate impede drift (db-types-diff.yml)
- Documentar workflow

### Fase 1 (Sprint 1)
Ordem de migração dos 58 consumers, por domínio:

| Ordem | Domínio | Consumers aprox | Story |
|-------|---------|-----------------|-------|
| 1 | `lancamentos` (god-hook) | ~15 | Story 1.2 |
| 2 | `consultoria` / planejamento | ~12 | Story 1.3 |
| 3 | `auth` / roles / RLS | ~8 | Story 1.4 |
| 4 | `metricas` / PMR | ~10 | Story 1.5 |
| 5 | restantes (UI, helpers) | ~13 | Story 1.6 |

Cada story migra UM domínio: substitui import `@/types/database` por `@/types/database.generated`,
ajusta nomes de colunas se houver drift, roda `npm run typecheck` + suites afetadas.

### Fase 2 (fim de Sprint 1 ou início Sprint 2)
- Quando contador de imports `from '@/types/database'` chegar a 0:
  ```bash
  grep -r "from '@/types/database'" src/ | grep -v generated | wc -l
  # deve retornar 0
  ```
- Deletar `src/types/database.ts`
- Renomear `database.generated.ts` → `database.ts` (opcional, se preferir nome curto)
- Atualizar ADR para status **Superseded** ou **Closed**

## Consequências

### Positivas
- CI bloqueia merges que quebrem contrato schema↔código (desde já)
- Migração sem big-bang reduz risco de regressão
- Cada PR de migração é pequeno, revisável, testável isoladamente
- Novos features podem usar types corretos imediatamente

### Negativas
- 2 arquivos coexistem por ~2 sprints — risco de dev importar do errado
- Mitigação: ESLint rule futura banindo `@/types/database` em arquivos novos (opcional Story 1.7)
- Espaço em disco: +6 MB no repo (aceitável)

### Neutras
- `verify:db-types` deve rodar em pre-commit hook futuro (não obrigatório agora)

## Critério para deletar `database.ts` legacy

**TODOS** os seguintes devem ser verdade:
1. `grep -r "from '@/types/database'" src/ | grep -v generated` retorna vazio
2. `npm run typecheck` passa verde
3. Suite e2e completa passa verde
4. @qa gate PASS em PR de remoção

## Referências

- DB-014 — `docs/prd/technical-debt-assessment.md`
- X-1 — `docs/reviews/qa-review.md`
- Story 0.1 — `docs/stories/sprint-0/story-0.1-generate-database-types.md`
- Workflow — `docs/dev/database-types-workflow.md`
