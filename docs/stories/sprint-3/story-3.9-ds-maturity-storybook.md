# Story 3.9 — DS maturity 3/5 → 4/5 (tokens canônicos + Storybook)

**Status:** Draft
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P2
**Severidade do débito:** Média
**Débito relacionado:** **UX-018** (maturity DS 3/5, `docs/reviews/ux-specialist-review.md` §4.18)
**Esforço estimado:** 24h (range 20-28h)
**Owner sugerido:** @ux-design-expert (lead) + @dev (FE impl)
**RACI:** R=@ux-design-expert, A=Design Lead, C=@dev, I=stakeholders
**Created:** 2026-05-19
**Created by:** @sm (River)

---

## Problem Statement
Design System em maturity 3/5 (per `ux-specialist-review.md` §4.18): tokens parciais, sem Storybook isolado, sem docs de uso, sem versionamento explícito. Resultado: componentes reinventados, drift visual, onboarding lento. Próximo nível (4/5) requer **tokens canônicos**, **Storybook publicado**, **changelog do DS**.

## Business Value
DS 4/5 reduz custo de novas features em 30%+ (componentes prontos), elimina decisões de UI redundantes em PR, e permite auditoria de cobertura. Storybook publicado = single source of truth para devs e designers.

## Acceptance Criteria
1. **AC1 (tokens canônicos):** Given catálogo de tokens, When publicado, Then cobre `color`, `spacing`, `typography`, `radius`, `shadow`, `motion` (pelo menos 5 categorias).
2. **AC2 (Storybook publicado):** Given Storybook 8.x, When CI roda, Then build sobe artifact em URL acessível (preview por PR via Vercel/Netlify).
3. **AC3 (cobertura ≥80%):** Given componentes em `src/components/ui/`, When auditoria roda, Then **≥80%** têm pelo menos 1 story documentada (variants, states, a11y).
4. **AC4 (DS changelog):** Given mudanças em tokens/componentes, When PR é mergeado, Then `CHANGELOG-DS.md` é atualizado (manual ou via Changesets).
5. **AC5 (matrix 4/5):** Given matrix de maturity DS (anexo), When auditoria final roda, Then score **≥4/5** documentado em `docs/design-system/maturity.md`.

## Scope IN
- Definir tokens canônicos em `src/tokens/` (color, spacing, typography, radius, shadow, motion)
- Setup Storybook 8.x com Vite builder
- Stories para componentes principais (Button, Input, Card, Modal, Table, Toast, Tabs, ≥80% cobertura)
- Tema dark/light no Storybook (toggle)
- `CHANGELOG-DS.md` template + primeira entrada
- Matrix de maturity documentada em `docs/design-system/maturity.md`
- Deploy preview Storybook por PR
- Docs de contribuição `docs/design-system/contributing.md`

## Scope OUT
- ❌ Atingir maturity 5/5 (requer governance formal, futuro)
- ❌ Migrar para outro design framework (mantém Radix+Tailwind)
- ❌ Visual regression Chromatic (consideração futura)
- ❌ Component generator CLI

## Tasks
- [ ] Auditoria de tokens existentes (2h)
- [ ] Workshop tokens canônicos com @ux-design-expert (3h)
- [ ] Implementar `src/tokens/{color,spacing,type,radius,shadow,motion}.ts` (4h)
- [ ] Setup Storybook 8.x + addons essenciais (a11y, viewport, themes) (3h)
- [ ] Stories Button + Input + Card + Modal (3h)
- [ ] Stories Table + Toast + Tabs + restante (3h)
- [ ] Toggle dark/light global (1h)
- [ ] CI build + deploy preview (Vercel) (2h)
- [ ] `CHANGELOG-DS.md` + maturity doc (1h)
- [ ] Docs contributing (1h)
- [ ] Cobertura review @ux-design-expert
- [ ] CodeRabbit review
- [ ] @qa gate

## Dependências
**Bloqueada por:** Story 3.7 (paleta canônica integra tokens color)
**Bloqueia:** Story 3.10 (auditoria duplicados depende de Storybook)

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| Setup Storybook conflita com Vite app | Média | Médio | Storybook 8 + Vite builder oficial |
| Cobertura 80% inflada (stories triviais) | Média | Médio | Review @ux-design-expert valida qualidade |
| Tokens breaking change quebram pages | Alta | Alto | Tokens novos coexistem com legados; migração faseada |
| Deploy preview lento em CI | Média | Baixo | Cache deps; Vercel preview otimizado |

## Testes Requeridos
- [ ] Storybook build sem erro
- [ ] Lint: tokens consumidos (zero hex direto em components)
- [ ] A11y addon: 0 violations em stories de componentes core
- [ ] Visual: Storybook renderiza em dark/light sem regressão

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] Storybook acessível em URL pública
- [ ] Cobertura ≥80% confirmada
- [ ] Maturity matrix 4/5 documentada e revisada
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Storybook quebra build CI:** isolar job em workflow separado (não-bloqueante) até estabilizar.
2. **Tokens canônicos causam regressão visual:** revert tokens-pages-binding; manter Storybook standalone; migração faseada.

## Notas Técnicas
Storybook 8 + Vite builder. Tokens em TS para tree-shaking. CSS vars geradas via build step. Considerar Style Dictionary para multi-output (web/email/etc) — fora de escopo agora.

## Referências
- `docs/reviews/ux-specialist-review.md` §4.18 (UX-018)
- Story 3.7 (paleta)
- Storybook 8 docs

---

## Change Log
- 2026-05-19 | @sm (River) | Story criada — Sprint 3 UX-018
