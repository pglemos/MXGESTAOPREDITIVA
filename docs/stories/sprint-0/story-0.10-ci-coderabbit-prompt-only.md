# Story 0.10 — CI CodeRabbit `--prompt-only` Obrigatório

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 0
**Prioridade:** P0
**Severidade do débito:** Alta
**Débito relacionado:** CI / Governança (rule `.claude/rules/coderabbit-integration.md`)
**Esforço estimado:** 4h
**Owner sugerido:** @devops
**RACI:** R=@devops, A=Tech Lead, C=@qa, I=todos contribuidores
**Created:** 2026-05-17

## File List
- `.coderabbit.yaml` (config global + path_instructions específicos)
- `.github/workflows/coderabbit-review.yml` (CI gate)
- `docs/dev/coderabbit-ci.md` (runbook)

## Change Log (Implementação)
- 2026-05-18 | @aiox-master (Orion) | Status: Ready → InReview | Config + workflow + runbook criados. Pendente: configurar secret CODERABBIT_API_KEY no GitHub Actions.

## Problem Statement
A rule `.claude/rules/coderabbit-integration.md` e a workflow-execution exigem self-healing CodeRabbit em dev phase, mas não há gate de CI que rejeite PR com CRITICAL/HIGH pendentes. Sem isso, devs (humanos ou agentes) podem ignorar o feedback. Sprint 0 fecha esse loop antes de Sprint 1 escalar volume de mudanças.

## Business Value
Reduz tempo de revisão humana ao filtrar PRs com issues triviais; alinha 100% dos PRs com padrão CodeRabbit; reforça gate de qualidade combinado com types diff (0.1), gitleaks (0.4), RLS suite (0.5), smoke 403 (0.6), migration reversibility (0.7).

## Acceptance Criteria
1. **AC1:** Given um PR aberto, When o workflow `coderabbit-review.yml` roda CodeRabbit em modo `--prompt-only`, Then o resultado é publicado como comentário no PR e o check falha vermelho se houver issues CRITICAL ou HIGH.
2. **AC2:** Given PR com apenas issues LOW/INFO, When o workflow roda, Then o check passa verde com comentário informativo.
3. **AC3:** Given a documentação `docs/dev/coderabbit-ci.md`, When um dev recebe falha, Then o runbook orienta como rodar localmente (`coderabbit --prompt-only -t uncommitted`) e re-submeter.

## Scope IN
- Workflow `.github/workflows/coderabbit-review.yml` rodando em `pull_request`.
- Wrapper script que parseia output e falha se severity ≥ HIGH.
- Comentário automático no PR com resumo dos achados.
- Documentação `docs/dev/coderabbit-ci.md`.
- Required check em branch protection (após Story 0.4 ativa).

## Scope OUT
- Auto-fix loop em CI (apenas em dev local, conforme rule).
- Integração com Slack/Teams para notificação (Sprint 1+).
- CodeRabbit Pro features pagas que não estejam já contratadas.

## Tasks
- [ ] Confirmar com @devops que CodeRabbit CLI está disponível em runner (ou usar action oficial se existir).
- [ ] Implementar workflow `coderabbit-review.yml` com `--prompt-only -t pr`.
- [ ] Parser de severity que retorna exit code 1 em CRITICAL/HIGH.
- [ ] Comentário no PR com `gh pr comment` ou action.
- [ ] PR sintético com violação HIGH → confirmar falha vermelha.
- [ ] PR limpo → confirmar verde.
- [ ] Documentar runbook em `docs/dev/coderabbit-ci.md`.
- [ ] Adicionar como required check (coordenar Story 0.4).

## Dependências
- **Bloqueada por:** Story 0.4 (branch protection).
- **Bloqueia:** Sprint 1 — todos PRs entram já sob esse gate.

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Falsos-positivos CodeRabbit travam PRs legítimos | Alta | Permitir override via label `coderabbit-waiver` + nota obrigatória + revisão @qa |
| Latência CodeRabbit aumenta tempo de PR | Média | Rodar em paralelo com outros checks; cache se aplicável |
| CodeRabbit API quota | Média | Monitorar uso; planejamento de upgrade se necessário |
| Diferença entre CLI local (WSL) e CI | Média | Documentar comando idêntico em runbook |

## Testes Requeridos
- [ ] PR sintético com violação HIGH → vermelho.
- [ ] PR limpo → verde.
- [ ] PR com label `coderabbit-waiver` → permitido com note documentada.
- [ ] Comentário publicado em PR com resumo.
- [ ] Runbook testado por dev externo (clareza).

## Definition of Done
- [ ] ACs verdes
- [ ] Testes passando
- [ ] CodeRabbit sem CRITICAL/HIGH no próprio PR (dogfooding)
- [ ] `docs/dev/coderabbit-ci.md` publicado
- [ ] CI required check ativo
- [ ] PR merged
- [ ] @qa gate PASS

## Rollback Plan
1. Remover required check em branch protection (workflow continua advisory).
2. Em emergência: `gh workflow disable coderabbit-review.yml`.
3. RTO: <5min.
4. CodeRabbit dev-local (rule existente) continua valendo mesmo sem gate CI.

## Referências
- `.claude/rules/coderabbit-integration.md`
- `.claude/rules/workflow-execution.md` (self-healing CodeRabbit em dev phase)
- `docs/prd/technical-debt-assessment.md` §SYS / §1
- `docs/reviews/qa-review.md` §2 GAP-01, §11

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10)
