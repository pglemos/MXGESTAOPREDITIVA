# Story 1.9 — Mover `@supabase/supabase-js` para `dependencies` (SYS-005)

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 1
**Prioridade:** P0
**Severidade do débito:** Alta
**Débito relacionado:** SYS-005 (dependency misclassification)

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10) | Sprint 1 critical-path: PASS (rollback trivial git revert, bloqueada por Sprint 0 0.6 + 0.10, CI gate permanente novo)
- 2026-05-17 | @aiox-master (Orion) | Status: Ready → InReview | Implementação executada: `@supabase/supabase-js@^2.102.1` movido de `devDependencies` → `dependencies` + `npm install` reinstalado
**Esforço estimado:** 2h
**Owner sugerido:** @dev
**RACI:** R=@dev, A=Tech Lead, C=@devops, I=@qa
**Created:** 2026-05-17

## Problem Statement
Assessment SYS-005: `@supabase/supabase-js` está em `devDependencies` no `package.json`, mas é usado em runtime de produção. Em builds que respeitam separação dev/prod (e.g., `npm ci --omit=dev`), a aplicação quebra. Risco latente — atualmente compensado pelo build pipeline incluir devDeps, mas qualquer mudança de pipeline ou deploy alternativo expõe.

## Business Value
Elimina bug latente em deploy. Custo trivial (2h), risco evitado alto (incident de produção em troca de pipeline).

## Acceptance Criteria
1. **AC1:** Given `package.json`, When inspecionado, Then `@supabase/supabase-js` está em `dependencies` e removido de `devDependencies`.
2. **AC2:** Given lockfile, When regenerado, Then resolve corretamente (sem duplicação).
3. **AC3:** Given build com `npm ci --omit=dev`, When executado em CI, Then aplicação starta e smoke test (story 0.6) passa.
4. **AC4:** Given outras dependências runtime potencialmente mal-classificadas, When auditadas, Then lista anexada ao PR (sem mover além de supabase-js neste escopo).
5. **AC5:** Given CI, When PR é aberto, Then job verifica `npm ci --omit=dev && npm run build && npm run smoke` (novo gate permanente).

## Scope IN
- Mover `@supabase/supabase-js` para `dependencies`.
- Regenerar lockfile.
- Auditoria leve de outros pacotes runtime em devDependencies (lista, sem fix).
- Job CI `omit-dev-build-smoke` (gate permanente).
- Atualização breve no `README` ou `CONTRIBUTING.md` documentando o gate.

## Scope OUT
- Mover outras dependências (criar issues separadas se encontradas).
- Refator do `package.json` (escopo amplo).
- Migração de package manager.

## Tasks
- [ ] Editar `package.json`.
- [ ] Regenerar lockfile (`npm install` ou equivalente).
- [ ] Auditoria leve de outros pacotes (listar como anexo).
- [ ] Adicionar job CI `omit-dev-build-smoke`.
- [ ] Atualizar doc de contribuição.
- [ ] CodeRabbit + @qa gate.

## Dependências
- **Bloqueada por:** Sprint 0 done (especialmente 0.6 smoke tests, 0.10 CI CodeRabbit).
- **Bloqueia:** —

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Lockfile conflitos com PRs abertos | Baixa | Comunicar squad; merge rápido |
| Outras deps mal classificadas quebram CI novo | Média | Auditoria leve antes; corrigir incrementalmente em issues separadas |
| `npm ci --omit=dev` falha por outra razão | Baixa | Job CI bloqueia merge se falhar — escopo desta story corrige supabase-js apenas |

## Testes Requeridos
- [ ] CI: `npm ci --omit=dev` succeeds
- [ ] CI: build production roda
- [ ] Smoke test (story 0.6) passa em build prod
- [ ] Local: dev workflow inalterado

## Definition of Done
- [ ] ACs verdes
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Job CI `omit-dev-build-smoke` verde e mandatório
- [ ] Auditoria de outras deps anexada (sem fix neste PR)
- [ ] @qa gate PASS
- [ ] PR merged (@devops push)

## Rollback Plan
1. **Lockfile causa conflito:** `git revert` do PR; resolver conflito em PR isolado.
2. **CI novo bloqueia merges legítimos:** marcar job como warning temporariamente; corrigir; re-promover a mandatório.
3. **Outra dep quebra build prod:** abrir hotfix movendo a dep crítica; este PR ainda válido.
4. RTO: <10min para revert; CI gate permite degradação controlada via `continue-on-error` temporário.

## Notas Técnicas
- Verificar ferramentas que assumem supabase-js só em dev (storybook, vitest config) — geralmente OK, mas conferir.
- Job CI: `runs-on: ubuntu-latest` + `npm ci --omit=dev` + `npm run build` + `npm run smoke`.

## Verificação Estática (2026-05-17)
✅ **Confirmado** em `package.json`: `@supabase/supabase-js@^2.102.1` em `devDependencies` (ausente de `dependencies`).
✅ **Vite bundla mesmo assim** — `vite.config.ts:95` define chunk `vendor-supabase`. Client bundle FUNCIONA em produção.

⚠️ **Severidade rebaixada Crítica → Média** — risco real apenas em:
- Scripts server-side (`scripts/*.ts`) executados após `npm install --production`
- Docker/Vercel builds com `--omit=dev` se houver import server-side de supabase-js (a confirmar)

Patch (~5min):
```bash
npm uninstall @supabase/supabase-js && npm install @supabase/supabase-js@^2.102.1
```

## Referências
- `docs/reviews/sprint-1-quick-verifications.md` §1 (evidência completa)
- `docs/prd/technical-debt-assessment.md` §SYS-005
- Story 0.6 (smoke tests)
- Story 0.10 (CI CodeRabbit)
