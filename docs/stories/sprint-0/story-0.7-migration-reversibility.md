# Story 0.7 — Migration Reversibility Test (UP→DOWN→UP em Branch Ephemeral)

**Status:** Ready
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 0
**Prioridade:** P0
**Severidade do débito:** Crítica
**Débito relacionado:** T-10 (qa-review §6) / X-11 (migration rollback ausente) / DB-016 / DB-006 / DB-013 / DB-017
**Esforço estimado:** 6h
**Owner sugerido:** @qa + @dev
**RACI:** R=@qa+@dev, A=Tech Lead, C=@architect, I=@data-engineer, @devops
**Created:** 2026-05-17

## Problem Statement
X-11 do qa-review (§5) classifica como **CRÍTICO**: DB-016 REVOKE sem `-- DOWN` testado significa que, em caso de produção quebrada, o restore via PITR tem RTO >15min. Sem este gate, todo deploy de migration P0 vira aposta. T-10 exige: cada migration crítica passa por `UP → DOWN → UP` em branch ephemeral do Supabase com resultado limpo.

## Business Value
Reduz RTO de incidentes em produção de >15min (PITR) para <2min (DOWN script validado). Pré-requisito explícito para qualquer deploy de DB-016/DB-006/DB-013/DB-017 em Sprint 1+.

## Acceptance Criteria
1. **AC1:** Given uma migração crítica nova ou alterada (label `migration:critical`), When o PR é aberto, Then um job CI cria branch ephemeral Supabase, executa UP, DOWN, UP novamente, e valida ausência de drift de schema; o check é bloqueante.
2. **AC2:** Given migrações críticas existentes (placeholder para DB-016/DB-006/DB-013/DB-017 que ainda serão escritas em Sprint 1), When um template `-- DOWN` é exigido pelo lint de migração, Then PRs sem bloco `-- DOWN` falham.
3. **AC3:** Given runbook em `docs/dev/migration-reversibility.md`, When um dev cria nova migration crítica, Then o passo de validação local via `supabase db reset` está descrito com comando exato.

## Scope IN
- Workflow CI `.github/workflows/migration-reversibility.yml`.
- Lint de migração: PR com migração marcada `critical` deve conter bloco `-- DOWN`.
- Helper script `scripts/migration-reversibility.sh` (Supabase branching API).
- Runbook `docs/dev/migration-reversibility.md`.
- Convenção de label `migration:critical` documentada.

## Scope OUT
- Validação para migrações não-críticas (advisory, não bloqueante).
- Script de canary rollout — escopo Sprint 1 (feature flag infra).
- Backfill de DOWN para migrações pré-existentes não-críticas — Sprint 2.
- Snapshot/restore via PITR — fora do escopo (capability Supabase nativa).

## Tasks
- [ ] Definir convenção `-- DOWN` em arquivos `.sql` de migração.
- [ ] Implementar `scripts/migration-reversibility.sh` usando Supabase branching API.
- [ ] Workflow CI roda apenas quando label `migration:critical` aplicado OU detecta arquivo em `supabase/migrations/` modificado.
- [ ] Lint script verifica presença de `-- DOWN` em migrações com label.
- [ ] Validar com 1 migration sintética simples UP/DOWN/UP.
- [ ] Documentar runbook em `docs/dev/migration-reversibility.md`.
- [ ] Adicionar como required check em branch protection (coordenar Story 0.4).

## Dependências
- **Bloqueada por:** Story 0.2 (token Supabase válido), Story 0.4 (branch protection).
- **Bloqueia:** todas migrações críticas de Sprint 1.

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Branching Supabase exige tier pago/custos | Alta | Confirmar com @devops; alternativa: container Postgres temporário em CI |
| Drift detection falsa-positiva | Média | Usar `supabase db diff` com schema dump determinístico |
| Runtime CI >10min trava merge | Média | Cache de extensions; rodar apenas em diff de `supabase/migrations/` |
| Esquecimento de marcar `migration:critical` | Alta | Hook de pré-merge: se path `supabase/migrations/` modificado E sem label → request label antes de merge |

## Testes Requeridos
- [ ] Migration sintética UP/DOWN/UP em branch ephemeral verde.
- [ ] PR com migração critical sem `-- DOWN` → vermelho.
- [ ] PR com migração critical e `-- DOWN` válido → verde.
- [ ] Drift detection acusa schema divergente após DOWN incompleto (sintético).
- [ ] Runtime CI <10min.

## Definition of Done
- [ ] ACs verdes
- [ ] Testes passando
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] `docs/dev/migration-reversibility.md` publicado
- [ ] CI required check ativo
- [ ] PR merged
- [ ] @qa gate PASS

## Rollback Plan
1. Remover required check de branch protection (mantém workflow advisory).
2. Migration que falhar UP→DOWN→UP volta como FAIL para @data-engineer reescrever DOWN.
3. RTO: <5min para desativar gate.
4. Se branching Supabase indisponível: fallback para container Postgres local (docker-compose) — documentado em runbook.

## Referências
- `docs/prd/technical-debt-assessment.md` §1 Sprint 0 item 0.10 (ADR rollback), §X-11
- `docs/reviews/qa-review.md` §5 X-11, §6 T-10

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10)
