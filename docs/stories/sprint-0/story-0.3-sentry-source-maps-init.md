# Story 0.3 — Sentry Init + Source Maps (FE + Edge Functions)

**Status:** InReview
**Epic:** EPIC-HARDENING-FOUNDATION
**Sprint:** 0
**Prioridade:** P0
**Severidade do débito:** Alta (X-8 promovido a Crítica)
**Débito relacionado:** SYS-017 / X-8 (observabilidade ~nula)
**Esforço estimado:** 3h
**Owner sugerido:** @dev
**RACI:** R=@dev, A=Tech Lead, C=@devops, I=squad
**Created:** 2026-05-17

## File List
- `src/main.tsx` (initSentry call)
- `src/lib/observability/sentry.ts` (FE helper)
- `src/lib/observability/index.ts` (barrel export atualizado)
- `supabase/functions/_shared/sentry.ts` (Deno helper)
- `vite.config.ts` (sentryVitePlugin + sourcemap upload + delete)
- `.env.example` (VITE_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT, etc.)
- `package.json` (deps @sentry/react@latest, @sentry/vite-plugin@latest)
- `docs/dev/sentry-setup.md` (runbook completo de setup operacional)

## Change Log (Implementação)
- 2026-05-18 | @aiox-master (Orion) | Status: Ready → InReview | Código FE + Edge + build pipeline prontos. Pendente operacional: criar projeto Sentry e configurar DSN no Vercel + Supabase Dashboard. Runbook em docs/dev/sentry-setup.md.

## Problem Statement
O assessment FINAL §SYS-017 confirma `SENTRY_DSN` configurado em env mas **inicialização não confirmada no código** (FE em `src/main.tsx` e edge functions). Risco cruzado X-8 (qa-review §10) eleva isso à Crítica: sem Sentry ativo + source maps, o próprio rollout do hardening fica cego — postmortems impossíveis, regressões só descobertas via reclamação de cliente.

## Business Value
Habilita postmortem objetivo do rollout de Sprint 1 (DB-016, DB-006, etc.); reduz MTTR de incidentes invisíveis de "dias" para "minutos"; pré-requisito para qualquer decisão data-driven em produção.

## Acceptance Criteria
1. **AC1:** Given um erro deliberado disparado em staging (`throw new Error('sentry-smoke-test')`), When 30s passam, Then o evento aparece no projeto Sentry com **stack trace de-minificado** (source maps aplicados) e tag `release` correta.
2. **AC2:** Given build de produção, When ele é gerado, Then source maps são uploadados para Sentry via `sentry-cli releases files upload-sourcemaps` (ou plugin Vite oficial) e **não** ficam servidos publicamente em `/assets/*.map`.
3. **AC3:** Given uma edge function dispara um erro não-tratado, When o evento sobe ao Sentry, Then ele tem `environment` (staging/prod) e `release` taggeados.

## Scope IN
- Inicialização Sentry SDK em `src/main.tsx` com `init({ dsn, environment, release, tracesSampleRate: 0.1, replaysSessionSampleRate: 0 })`.
- Plugin `@sentry/vite-plugin` (ou equivalente) configurado em `vite.config.ts`.
- Source maps gerados em build e uploadados; remoção dos `.map` do output público.
- Helper `initSentryForEdge()` para edge functions Deno (`supabase/functions/_shared/sentry.ts`).
- Smoke test de erro deliberado em rota oculta `/__sentry-smoke`.

## Scope OUT
- Session Replay, Performance Monitoring p99 detalhado → UX-030/Sprint 3.
- Alertas/notificações Slack → Sprint 1.
- Configuração de "issue ownership rules" no Sentry dashboard → backlog.

## Tasks
- [ ] Instalar `@sentry/react` + `@sentry/vite-plugin`.
- [ ] Init em `src/main.tsx` com guarda `if (import.meta.env.PROD || env === staging)`.
- [ ] Configurar Vite plugin com `authToken`, `org`, `project`, `release: process.env.VITE_RELEASE`.
- [ ] Garantir build remove `.map` do `dist/assets/` público.
- [ ] Helper edge functions: `Sentry.init({ dsn, environment, release })` em `_shared/sentry.ts`.
- [ ] Wrappear handlers de edge functions críticas para capturar erros.
- [ ] Smoke test rota `/__sentry-smoke` (apenas staging).
- [ ] Validar evento em Sentry dashboard.

## Dependências
- **Bloqueada por:** Story 0.2 (SENTRY_DSN rotacionado se exposto).
- **Bloqueia:** Story 0.9 (correlation ID consome contexto Sentry), Sprint 1 inteira (X-8).

## Riscos & Mitigações
| Risco | Sev | Mitigação |
|---|---|---|
| Source maps vazam código fonte se publicados | Alta | Pós-upload, deletar `.map` do `dist/` antes do deploy |
| Sentry quota estourada em staging | Média | `tracesSampleRate: 0.1`, `beforeSend` filtrando ruído |
| Init quebra FE em dev | Baixa | Guarda por env; testar `npm run dev` |

## Testes Requeridos
- [ ] Smoke test `/__sentry-smoke` em staging → evento visível em Sentry com stack de-minificado.
- [ ] Smoke test em edge function (erro deliberado) → evento visível.
- [ ] `dist/assets/*.map` ausentes pós-build.
- [ ] `npm run dev` sem regressão.
- [ ] `npm run typecheck` e `npm run lint` verdes.

## Definition of Done
- [ ] ACs verdes
- [ ] Testes passando
- [ ] CodeRabbit sem CRITICAL/HIGH
- [ ] Docs atualizadas (`docs/dev/observability.md` com runbook Sentry)
- [ ] PR merged
- [ ] @qa gate PASS

## Rollback Plan
1. `SENTRY_DSN=""` em Vercel envs → SDK no-op via guarda.
2. Reverter PR via `git revert` se init causar crash de boot.
3. RTO esperado: <5min (env var) ou <15min (revert+redeploy).

## Referências
- `docs/prd/technical-debt-assessment.md` §SYS-017, §1 Sprint 0 item 0.2
- `docs/reviews/qa-review.md` §10 (X-8 promovido a Crítica), §1 item 0.2

## Change Log
- 2026-05-17 | @po (Pax) | Status: Draft → Ready | Validation: GO (10/10)
