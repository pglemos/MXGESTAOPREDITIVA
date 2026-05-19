# Story 3.11 — ESLint plugin a11y (`jsx-a11y`)

**Status:** Draft
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P2
**Severidade do débito:** Média
**Débito relacionado:** **UX-015** (a11y não auditável, `docs/reviews/ux-specialist-review.md` §4.15)
**Esforço estimado:** 4h (range 3-5h)
**Owner sugerido:** @dev (FE / DX)
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-19
**Created by:** @sm (River)

---

## Problem Statement
Codebase **não tem** plugin `eslint-plugin-jsx-a11y` ativo (per `ux-specialist-review.md` §4.15). Resultado: erros básicos (alt faltando, role inválido, click em div sem keyboard handler, label sem htmlFor) passam sem detecção. WCAG 2.1 AA exige enforcement automatizado mínimo.

## Business Value
Plugin barato (4h) que captura ~30% dos defeitos a11y antes de chegar em produção. Quick win com ROI altíssimo. Setup acompanhado de fix dos issues existentes detectados.

## Acceptance Criteria
1. **AC1 (plugin instalado):** Given `eslint-plugin-jsx-a11y` no `package.json`, When `npm install` roda, Then plugin disponível.
2. **AC2 (config recomendada):** Given `.eslintrc` estende `plugin:jsx-a11y/recommended`, When lint roda, Then regras `recommended` ativas (≥30 rules).
3. **AC3 (baseline limpo):** Given lint roda em `src/`, When PR é mergeado, Then **0 errors** (warnings podem persistir como tracking).
4. **AC4 (CI enforcement):** Given PR introduz novo violation, When CI roda, Then **falha**.
5. **AC5 (override documentado):** Given regras desabilitadas (se houver), When configuradas, Then justificadas em comentário inline + ADR mini.

## Scope IN
- Instalar `eslint-plugin-jsx-a11y`
- Estender `plugin:jsx-a11y/recommended` em `.eslintrc`
- Fix de todos errors detectados (baseline limpo)
- Configurar como error (não warning) no CI
- Doc curto em `docs/contributing/a11y.md`

## Scope OUT
- ❌ Audit WCAG 2.1 AA completo (story 3.12 + futuro)
- ❌ Testes manuais com screen reader
- ❌ Plugin de teste runtime (axe-core CI — futura story)
- ❌ Focus traps (story 3.12)

## Tasks
- [ ] Instalar plugin + setup config (0.5h)
- [ ] Rodar lint, gerar baseline de violations (0.5h)
- [ ] Fix errors (2h)
- [ ] CI enforcement (0.5h)
- [ ] Doc `docs/contributing/a11y.md` (0.5h)
- [ ] CodeRabbit review
- [ ] @qa gate

## Dependências
**Bloqueada por:** —
**Bloqueia:** Story 3.12 (focus traps), futuras stories a11y

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Baseline tem >50 violations | Alta | Médio | Triagem; fix críticos; resto vira warning + tracking |
| Regra `no-noninteractive-element-interactions` falsos positivos | Média | Baixo | Override pontual com justificativa |
| Plugin lento em monorepo | Baixa | Baixo | Cache eslint padrão |

## Testes Requeridos
- [ ] CI lint passa sem errors
- [ ] Fixture: arquivo com `<img />` sem alt dispara error

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Baseline limpo
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Baseline impossível em 4h:** mergear plugin como warning (não error); criar story de cleanup; voltar a error depois.

## Notas Técnicas
`jsx-a11y/recommended` é um bom default. Avaliar futuramente `strict` para componentes core.

## Referências
- `docs/reviews/ux-specialist-review.md` §4.15 (UX-015)
- `eslint-plugin-jsx-a11y` docs

---

## Change Log
- 2026-05-19 | @sm (River) | Story criada — Sprint 3 UX-015
