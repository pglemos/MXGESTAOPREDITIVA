# Story 0.2 — Verify & Rotate Env Secrets

**Status:** Ready (escopo AC1 ✅ executado — falta AC2/AC3 reduzidas)
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 0
**Prioridade:** P1 (rebaixada após verificação estática)
**Severidade do débito:** Crítica → ✅ **Falso positivo no AC1**; restante é higiene operacional
**Débito relacionado:** SYS-012 (`.env` no working tree — confirmado NÃO commitado)
**Esforço estimado:** 4h → **~1h** (AC1 já feito; AC2/AC3 reduzidas)
**Owner sugerido:** @devops
**RACI:** R=@devops, A=Tech Lead, C=@dev, I=stakeholders (janela coordenada)
**Created:** 2026-05-17

## Problem Statement
O assessment FINAL §SYS-012 (Crítica) reporta `.env` presente no working tree em modo `-rw-------` mas sem confirmação se foi commitado ao histórico do git. Se sim, segredos potencialmente vazados incluem `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_URL`, `GOOGLE_*`, `RESEND_API_KEY`, `SENTRY_DSN` — comprometendo RLS bypass, banco direto, integrações OAuth e canais de notificação.

## Business Value
Elimina o vetor mais crítico de comprometimento total da plataforma: um service-role key vazado permite bypass completo de RLS (DB-016 etc.) e acesso direto ao banco. Custo de uma fuga: incidente de notificação LGPD, perda de confiança, retrabalho de credenciais sob pressão.

## Acceptance Criteria
1. **AC1:** Given o repositório auditado, When `git log --all -p -- .env` é executado, Then o resultado é vazio (.env nunca commitado) OU evidência completa de rotação está em `docs/security/rotation-log.md`.
2. **AC2:** Given `.env` ainda existe no working tree, When `cat .gitignore` é inspecionado, Then `.env` e variantes (`.env.local`, `.env.*.local`) estão explicitamente ignorados.
3. **AC3:** Given um secret foi rotacionado, When os ambientes (local, staging, prod, Vercel, GitHub Actions) são verificados, Then todos consomem a nova credencial e o velho secret está revogado/invalidado no provedor (Supabase dashboard, Google Cloud Console, Resend, Sentry).

## Scope IN
- Auditoria de `git log --all -p -- .env` (e variantes).
- Se commitado: rotação coordenada de SUPABASE_SERVICE_ROLE_KEY, POSTGRES_URL (reset DB password), GOOGLE_CLIENT_SECRET, RESEND_API_KEY, SENTRY_DSN.
- Atualização em Vercel envs (preview+prod), GitHub Actions secrets, `.env.local` de cada dev.
- Documentação `docs/security/rotation-log.md`.

## Scope OUT
- Migração para secret manager (Doppler/1Password/Vault) → Sprint 2.
- BFG/git-filter-repo para remover do histórico → decisão pós-auditoria, possível Sprint 1.
- Rotação preventiva de secrets sem evidência de exposure (fora do escopo definido).

## Tasks
- [ ] Rodar `git log --all -p -- .env .env.local .env.*` e capturar evidência.
- [ ] Garantir `.env*` em `.gitignore` (commit se faltar).
- [ ] Se commitado: notificar stakeholders e abrir janela de manutenção.
- [ ] Rotacionar cada secret na ordem (SUPABASE service-role primeiro).
- [ ] Atualizar Vercel + GitHub Actions + devs locais.
- [ ] Validar app saudável pós-rotação (smoke FE+RPC).
- [ ] Documentar em `docs/security/rotation-log.md` com data/hora/responsável.

## Dependências
- **Bloqueia:** Story 0.1 (Supabase CLI linked precisa de token válido), Story 0.3 (Sentry DSN), Story 0.4 (gitleaks pode bloquear merges após).

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Quebra de integração durante rotação | Alta | Janela coordenada + rollback documentado por integração |
| Edge functions com env hardcoded perdem acesso | Alta | Validar env via `supabase functions secrets list` antes |
| Dev local fica fora do ar | Média | Comunicar nova credencial via canal seguro pré-rotação |

## Testes Requeridos
- [ ] Auditoria `git log --all -p -- .env` executada e evidência arquivada.
- [ ] Smoke FE pós-rotação: login + 1 RPC crítica.
- [ ] Smoke edge function pós-rotação.
- [ ] Sentry recebe evento (valida SENTRY_DSN novo).
- [ ] Tentativa com credencial antiga retorna 401/403 (valida revogação).

## Definition of Done
- [ ] ACs verdes
- [ ] Testes passando
- [ ] CodeRabbit sem CRITICAL/HIGH no PR de `.gitignore`/rotation-log
- [ ] `docs/security/rotation-log.md` publicado
- [ ] PR merged
- [ ] @qa gate PASS

## Rollback Plan
1. Se rotação quebrar produção: rotacionar **de volta** para a credencial anterior usando snapshot do provedor (Supabase keeps previous keys 24h).
2. Restaurar Vercel/GitHub envs do snapshot pré-rotação.
3. RTO esperado: <15min se snapshot pronto, senão ~30min.
4. Caso credencial antiga já tenha sido revogada irreversivelmente, gerar nova e repetir propagação.

## Verificação Estática (2026-05-17 — AC1 EXECUTADO)
✅ **SYS-012 REFUTADO** — `.env` **NUNCA foi commitado**:
- `git log --all -p -- .env` → ZERO commits
- `git ls-files` → apenas `.env.example` (placeholders)
- `.gitignore` linhas 10/17/18/19 → `.env*`, `.env`, `.env.local`, `.env.*.local` cobertos
- Working tree `.env` mode `-rw-------` (0600), permissões corretas

✅ **Edge Functions sem secrets hardcoded** — todas usam `Deno.env.get()` (15 funções auditadas).
✅ **Scripts admin sem keys literais** — todos usam `process.env.*` (20 scripts auditados).
✅ **Bonus:** `scripts/validate_admin_master_full_e2e.mjs:118` tem `.replace(SUPABASE_SERVICE_ROLE_KEY, '[REDACTED]')` em logs.

### AC1 ✅ — Resolvido (não há leak, não há rotação obrigatória)
### AC2/AC3 → escopo reduzido a:
- ⚠️ Adicionar gitleaks pre-commit (Story 0.4 cobre)
- ⚠️ Documentar key custody policy (~30min)
- ⚠️ Rotação quarterly como rotina operacional (runbook futuro)

## Referências
- `docs/reviews/sprint-1-quick-verifications.md` §5 (verificação completa)
- `docs/prd/technical-debt-assessment.md` §SYS-012, §1 Sprint 0 item 0.1
- `docs/reviews/qa-review.md` §1 item 0.1

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10)
- 2026-05-17 | @aiox-master (Orion) | AC1 verificado | SYS-012 = falso positivo; severidade rebaixada P0→P1; esforço 4h→1h
