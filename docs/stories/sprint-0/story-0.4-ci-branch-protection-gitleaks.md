# Story 0.4 — CI Branch Protection + Gitleaks (Secret Scanning)

**Status:** InReview (prep done — aguarda execução do script com admin GitHub)

## File List (Implementação prep)
- `.github/workflows/gitleaks.yml` (workflow secret scanning ativo em PR+push main)
- `.gitleaks.toml` (config com allowlists para docs/test/example + regras Supabase/Sentry)
- `scripts/setup-branch-protection.sh` (gh CLI script — exige admin)
- `docs/runbooks/sprint-0-story-0.4-branch-protection.md` (runbook completo)

## Change Log (Implementação)
- 2026-05-21 | @aiox-master (Orion) | Status: Ready → InReview | Workflow gitleaks + config + script gh + runbook prontos. Aplicação branch protection aguarda `./scripts/setup-branch-protection.sh` executado por admin com gh autenticado.

**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 0
**Prioridade:** P0
**Severidade do débito:** Alta
**Débito relacionado:** CI-001 / GAP-01 (qa-review §2)
**Esforço estimado:** 6h
**Owner sugerido:** @devops
**RACI:** R=@devops, A=Tech Lead, C=@qa, I=todos contribuidores
**Created:** 2026-05-17

## Problem Statement
GAP-01 (qa-review §2) aponta CI sem branch protection ativa e sem secret scanning automatizado, o que torna ineficazes os gates de Sprint 0/1 (types diff, RLS suite, CodeRabbit): qualquer dev com push direto à `main` contorna toda a rede. Sem secret scanning, repete-se o vetor SYS-012.

## Business Value
Transforma os gates de "esperança" em "obrigatório". Reduz superfície de SYS-012 recidiva a zero. Padrão de mercado mínimo para SaaS sério (vinculado §11 do qa-review).

## Acceptance Criteria
1. **AC1:** Given a branch `main`, When um PR é aberto, Then merge é bloqueado até que checks obrigatórios (`lint`, `typecheck`, `test`, `db-types-diff`, `gitleaks`, `coderabbit`) estejam verdes E ao menos 1 review approve.
2. **AC2:** Given um PR sintético que adiciona uma string parecida com `eyJhbGciOi...` (JWT) ou `sk_live_...`, When gitleaks roda em CI, Then o check falha vermelho com indicação clara do arquivo+linha.
3. **AC3:** Given `git push origin main` direto (sem PR), When um dev tenta, Then o push é rejeitado pelo GitHub com mensagem de branch protection.

## Scope IN
- Ativar branch protection em `main` via `gh api` ou UI documentada: require PR, require status checks, require 1 approval, dismiss stale, restrict force-push.
- Workflow `.github/workflows/gitleaks.yml` com `gitleaks/gitleaks-action@v2`.
- `.gitleaks.toml` minimalista (sem allowlists ruidosos).
- Documentação `docs/dev/ci-branch-protection.md`.

## Scope OUT
- Status checks de `db-types-diff` (Story 0.1) e `coderabbit` (Story 0.10) são incluídos como required apenas após suas respectivas stories estarem DONE.
- TruffleHog em paralelo (decisão pós-Sprint 0).
- Bypass de emergency para admins → backlog (avaliar trade-off).

## Tasks
- [ ] Definir lista final de required checks (alinhar com @qa).
- [ ] Aplicar branch protection via `gh api -X PUT repos/:owner/:repo/branches/main/protection -F ...`.
- [ ] Criar workflow `gitleaks.yml` rodando em `pull_request` e `push`.
- [ ] Adicionar `.gitleaks.toml` (configuração base).
- [ ] PR sintético com fake secret → confirmar bloqueio.
- [ ] Tentar push direto à `main` → confirmar rejeição.
- [ ] Documentar regras em `docs/dev/ci-branch-protection.md`.

## Dependências
- **Bloqueada por:** Story 0.2 (rotação concluída para evitar gitleaks bloquear histórico legacy se varredura full-history).
- **Bloqueia:** todo merge subsequente; outras stories Sprint 0 já entram sob essas regras.

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Gitleaks bloquear histórico legacy | Alta | Rodar apenas em diff (`--no-git` ou `git diff main..HEAD`) primeiro; full-history em job separado opcional |
| Branch protection prender hotfix urgente | Média | Documentar break-glass via admin override + post-mortem obrigatório |
| Falso-positivo em fixtures de teste | Média | `.gitleaks.toml` allowlist mínimo para `tests/fixtures/**` com prefixo `test_` |

## Testes Requeridos
- [ ] PR sintético com fake JWT → gitleaks falha vermelho.
- [ ] PR limpo → gitleaks passa verde.
- [ ] Push direto à `main` → rejeitado.
- [ ] PR sem 1 approval → merge bloqueado.
- [ ] PR sem `lint`/`typecheck` verdes → merge bloqueado.

## Definition of Done
- [ ] ACs verdes
- [ ] Testes passando (incluindo PR sintético)
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] `docs/dev/ci-branch-protection.md` publicado com runbook de break-glass
- [ ] PR merged
- [ ] @qa gate PASS

## Rollback Plan
1. Desativar required checks via `gh api -X PUT .../branches/main/protection -F required_status_checks=null`.
2. Manter branch protection (PR + approval) ativa mesmo no rollback parcial.
3. RTO: <5min.
4. Se gitleaks bloquear PRs legítimos em massa: desabilitar workflow temporariamente via `gh workflow disable gitleaks.yml` enquanto refina allowlist.

## Referências
- `docs/prd/technical-debt-assessment.md` §SYS (CI) / §1
- `docs/reviews/qa-review.md` §2 GAP-01, §11

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10)
