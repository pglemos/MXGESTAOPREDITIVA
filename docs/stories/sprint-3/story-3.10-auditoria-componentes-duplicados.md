# Story 3.10 — Auditoria componentes duplicados Radix vs shadcn

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P3
**Severidade do débito:** Baixa
**Débito relacionado:** **SYS-013** (componentes UI duplicados, `docs/reviews/architect-review.md` §SYS-013)
**Esforço estimado:** 16h (range 14-18h)
**Owner sugerido:** @ux-design-expert (lead) + @dev (FE impl)
**RACI:** R=@ux-design-expert, A=Design Lead, C=@dev, I=Tech Lead
**Created:** 2026-05-19
**Created by:** @sm (River)

---

## Problem Statement
Codebase tem componentes duplicados entre Radix UI primitives diretos e shadcn/ui wrappers (Dialog, Dropdown, Popover, Tooltip, Select), gerando 2 caminhos para mesmo padrão. Resultado: inconsistência de estilo, esforço duplicado em manutenção, dúvida do dev sobre qual usar.

## Business Value
Padronizar em **uma única abordagem** (shadcn/ui sobre Radix) reduz superfície de manutenção em ~40% nos componentes afetados. Onboarding mais simples ("sempre use shadcn"). Permite estilização consistente via tokens.

## Acceptance Criteria
1. **AC1 (auditoria documentada):** Given relatório `docs/reviews/components-audit.md`, When publicado, Then lista todos componentes duplicados com uso (paths, imports, count).
2. **AC2 (decisão arquitetural):** Given ADR registrado, When publicado, Then define **shadcn/ui como padrão** (ou contrário, se @ux-design-expert decidir) com rationale.
3. **AC3 (migração faseada):** Given lista de componentes a migrar, When PR é mergeado, Then ≥50% dos imports duplicados foram migrados para padrão escolhido (resto fica em backlog).
4. **AC4 (lint warning):** Given import do path descontinuado (ex: `@radix-ui/react-dialog` direto fora de `components/ui/`), When lint roda, Then **warning** orienta migração.
5. **AC5 (Storybook reflete decisão):** Given Storybook (story 3.9), When componente é documentado, Then apresenta APENAS variante canônica.

## Scope IN
- Auditoria automatizada (`scripts/audit-duplicate-components.js`) listando imports
- Relatório `docs/reviews/components-audit.md`
- ADR `docs/adr/0052-shadcn-vs-radix-direct.md`
- Migrar ≥50% dos call-sites para padrão canônico
- ESLint rule custom (warning) para imports descontinuados
- Atualizar Storybook para refletir padrão único

## Scope OUT
- ❌ Migrar 100% dos call-sites (backlog para Sprint 4+)
- ❌ Trocar Radix por outro headless lib
- ❌ Refactor visual de componentes (apenas consolidação)
- ❌ Adicionar novos componentes ao DS

## Tasks
- [ ] Script auditoria automatizada (2h)
- [ ] Rodar e gerar relatório `docs/reviews/components-audit.md` (1h)
- [ ] Workshop @ux-design-expert + @dev: decisão arquitetural (2h)
- [ ] ADR `0052-shadcn-vs-radix-direct.md` (1.5h)
- [ ] Migrar ≥50% call-sites (Dialog, Dropdown, Popover, Tooltip, Select) (6h)
- [ ] ESLint rule custom + integração (2h)
- [ ] Atualizar Storybook (story 3.9) (1h)
- [ ] CodeRabbit review
- [ ] @qa gate

## Dependências
**Bloqueada por:** Story 3.9 (Storybook necessário para refletir decisão)
**Bloqueia:** Stories futuras de cleanup DS

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Migração breaking change em modal crítico | Média | Alto | Migrar 1 componente por PR; smoke E2E |
| Decisão errada (escolher caminho que não escala) | Baixa | Alto | Workshop com 2+ stakeholders + ADR |
| Backlog 50% restante fica permanentemente | Alta | Médio | Lint warning + tracking issue em Sprint 4 |
| Custom ESLint rule lenta | Baixa | Baixo | Simple AST rule, benchmark |

## Testes Requeridos
- [ ] E2E smoke pages com modais/dropdowns migrados
- [ ] Visual regression Playwright das pages afetadas
- [ ] Lint rule: arquivo fixture com import descontinuado dispara warning

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] ADR-0052 publicado
- [ ] Auditoria publicada
- [ ] ≥50% call-sites migrados (mensurado)
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Migração quebra modal crítico:** revert PR daquele componente; manter outros migrados; fix isolado.
2. **ADR contestado pós-merge:** abrir RFC; manter decisão até reverter formalmente via novo ADR.

## Notas Técnicas
shadcn/ui é "copy-paste" então `components/ui/` é nosso ground truth. Radix é dep transitiva via shadcn. Política: imports de `@radix-ui/*` SOMENTE em `components/ui/`.

## Referências
- `docs/reviews/architect-review.md` §SYS-013
- Story 3.9 (DS maturity)
- ADR-0050 (pattern de decisão)

---

## Change Log
- 2026-05-19 | @sm (River) | Story criada — Sprint 3 SYS-013
- 2026-05-19 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 3 critical-path: pass
