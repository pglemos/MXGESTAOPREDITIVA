# Story 3.8 — `lint-tokens.js` AST-driven anti-drift

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 3
**Prioridade:** P2
**Severidade do débito:** Média
**Débito relacionado:** **UX-006** (drift de tokens, `docs/reviews/ux-specialist-review.md` §4.6)
**Esforço estimado:** 8h (range 6-10h)
**Owner sugerido:** @dev (FE / DX)
**RACI:** R=@dev, A=Tech Lead, C=@ux-design-expert, I=stakeholders
**Created:** 2026-05-19
**Created by:** @sm (River)

---

## Problem Statement
O script atual de validação de tokens é regex-based e gera **falsos positivos/negativos** (per `ux-specialist-review.md` §4.6). Hex dentro de comentários ou strings de teste falsamente disparam erro; hex em template strings escapam detecção. Resultado: time desabilita validação ou ignora warnings, permitindo drift de design system.

## Business Value
Substituir regex por análise AST (TypeScript Compiler API + PostCSS AST) elimina falsos positivos/negativos. CI confiável → time confia → enforcement real anti-drift. Próximas adições de tokens (spacing, radius, shadow) plug-in sobre mesmo framework.

## Acceptance Criteria
1. **AC1 (AST-driven):** Given novo `scripts/lint-tokens.js`, When analisa `.ts/.tsx`, Then usa `ts-morph` ou TS Compiler API (não regex). Para CSS/SCSS usa PostCSS AST.
2. **AC2 (zero falsos positivos):** Given hex em comentário ou string literal de teste, When lint roda, Then **não dispara** alerta.
3. **AC3 (detecta template strings):** Given `` `color: ${'#ff5500'}` ``, When lint roda, Then **detecta** e reporta.
4. **AC4 (allowlist por path):** Given paths legados pendentes de migração, When configurados em `tokens.allowlist.json`, Then lint ignora apenas esses paths com warning explícito.
5. **AC5 (CI integration):** Given PR introduz hex novo fora de allowlist, When CI roda, Then **falha** com mensagem clara (arquivo, linha, sugestão de token).

## Scope IN
- Reescrever `scripts/lint-tokens.js` em modo AST
- Suportar TS/TSX via `ts-morph` ou `typescript` compiler API
- Suportar CSS/SCSS via PostCSS AST
- Allowlist `tokens.allowlist.json` versionada
- Mensagens de erro com sugestão de token (`#ff5500` → `chart.series.1`)
- Integração CI (job npm script + GitHub Action)
- Documentação de uso em `docs/contributing/lint-tokens.md`

## Scope OUT
- ❌ Detectar drift de spacing/radius (futuro plug-in — esta story foca cores)
- ❌ Auto-fix (apenas reporta nesta story)
- ❌ Lint runtime (apenas build-time)

## Tasks
- [ ] Spike: comparar `ts-morph` vs TS Compiler API puro (1h)
- [ ] Implementar parser TS/TSX (2h)
- [ ] Implementar parser CSS/SCSS (1.5h)
- [ ] Allowlist + config schema (1h)
- [ ] Mensagens com sugestão de token (1h)
- [ ] Integração CI + npm script (1h)
- [ ] Docs `docs/contributing/lint-tokens.md` (0.5h)
- [ ] CodeRabbit review
- [ ] @qa gate

## Dependências
**Bloqueada por:** Story 3.7 (paleta canônica definida — necessária para gerar sugestões de mapping)
**Bloqueia:** Story 3.9 (DS maturity inclui enforcement)

## Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|:--:|:--:|-----------|
| `ts-morph` lento em monorepo grande | Média | Médio | Benchmark; cache por arquivo (mtime) |
| Sugestão de token errada confunde dev | Média | Baixo | Sugestão tem "?" + link para Storybook |
| Allowlist vira backdoor permanente | Alta | Médio | Allowlist tem campo `expires_at` obrigatório |
| Falsos negativos em template literals complexas | Baixa | Médio | Test fixtures cobrindo edge cases |

## Testes Requeridos
- [ ] Unit: 10+ fixtures (hex em comentário, string, template, JSX attr, styled)
- [ ] Integration: rodar sobre `src/` real e validar zero falsos positivos
- [ ] CI smoke: introduzir hex propositalmente e validar falha

## Definition of Done
- [ ] ACs 1-5 verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Docs publicados
- [ ] CI ativo bloqueando hex novo
- [ ] PR merged (@devops push)
- [ ] @qa gate PASS

## Rollback Plan
1. **Lint causa falsos positivos em massa:** desabilitar job CI temporariamente; manter script local; fix em hotfix.
2. **Performance >2min:** habilitar cache; se persistir, restringir a paths changed (`git diff`).

## Notas Técnicas
`ts-morph` simplifica AST traversal. Alternativa: `@typescript-eslint/parser` + ESLint custom rule (mais idiomático, considerar no spike).

## Referências
- `docs/reviews/ux-specialist-review.md` §4.6 (UX-006)
- Story 3.7 (paleta canônica)
- TS Compiler API docs

---

## Change Log
- 2026-05-19 | @sm (River) | Story criada — Sprint 3 UX-006
- 2026-05-19 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 3 critical-path: pass
