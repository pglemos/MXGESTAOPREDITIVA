# Runbook — DB-016 Canary REVOKE (Stories 1.3 + 1.4)

**Owner:** @data-engineer + @devops
**Duração:** 7 dias produção (não comprimível)
**Risco:** ALTO — toca em `lancamentos_diarios`, tabela transacional mais crítica

---

## Pré-requisitos (checklist bloqueante)

- [ ] Stories 1.1/1.2/1.5/1.6/1.10 merged em `main`
- [ ] Feature flag `VITE_FLAG_LANCAMENTOS_VIA_RPC` configurada no Vercel (production)
- [ ] Smoke tests 403 verde em staging por 24h
- [ ] RLS regression matrix (Story 0.5) verde
- [ ] Sentry FE + Edge Functions ativos (Story 0.3) — dashboard de error rate disponível
- [ ] Correlation ID FE→RPC ativo (Story 0.9)
- [ ] Snapshot Supabase PITR confirmado
- [ ] SQL manual `supabase/migrations/_archived/20260521130000_db016_revoke_lancamentos_diarios.sql` em `main`
- [ ] SQL manual de rollback `supabase/migrations/_archived/20260521131000_db016_revoke_rollback.sql` em `main`
- [ ] Script `scripts/db016-canary-controller.sh` testado em staging
- [ ] Janela operacional de 7 dias contínuos sem deploy concorrente
- [ ] @devops disponível para on-call durante D1-D7
- [ ] Comunicação prévia para stakeholders (e-mail + Slack)

---

## Timeline 7 dias

### Day 1 — Canary 1%

**08h** — Ativar flag para 1% dos usuários (rollout determinístico via hash do user_id):

```bash
./scripts/db016-canary-controller.sh stage 1
```

Verifica:
- ✅ Vercel env var `VITE_FLAG_LANCAMENTOS_VIA_RPC_PERCENTAGE=1`
- ✅ Trigger redeploy (manual ou automático)
- ✅ Smoke test 403 passa

**Monitorar 24h:**
- Sentry error rate < 0.5% (baseline)
- Web Vitals (LCP, INP) dentro de threshold "Good"
- Logs `rpc_error_log` sem spike
- `logs_auditoria` registra checkins normalmente

**Se RED → execute imediatamente:**
```bash
./scripts/db016-canary-controller.sh rollback
```

---

### Day 2-3 — Canary 10%

Se Day 1 verde após 24h:
```bash
./scripts/db016-canary-controller.sh stage 10
```

Monitorar 48h. Mesmos critérios de health.

---

### Day 4-5 — Canary 25%

```bash
./scripts/db016-canary-controller.sh stage 25
```

Monitorar 24h.

---

### Day 6 — Canary 100% (flag full)

```bash
./scripts/db016-canary-controller.sh stage 100
```

Todos os usuários usando RPC. Verificar que **nenhum POST direto** está chegando em `lancamentos_diarios`:

```sql
-- Query Supabase dashboard
SELECT count(*) FROM postgrest.audit_log
WHERE table_name = 'lancamentos_diarios'
  AND action IN ('INSERT', 'UPDATE')
  AND created_at > now() - interval '24 hours';
-- Esperado: 0 (todos vão por submit_checkin RPC)
```

Monitorar 24h.

---

### Day 7 — Aplicar REVOKE

Se Day 6 verde:
```bash
./scripts/db016-canary-controller.sh revoke
```

Isso aplica o SQL manual arquivado `20260521130000_db016_revoke_lancamentos_diarios.sql` que:
- REVOKE INSERT/UPDATE/DELETE de `authenticated` em `lancamentos_diarios`
- Mantém SELECT (policy via `tem_papel_loja`)
- Mantém GRANT EXECUTE em `submit_checkin` RPC

Monitorar 24h pós-REVOKE.

---

## Métricas de health (validar em cada stage)

| Métrica | Verde | Amarelo | Vermelho |
|---------|-------|---------|----------|
| Error rate Sentry | <0.5% | 0.5-1% | >1% |
| p95 latency RPC | <1.2x baseline | 1.2-1.5x | >1.5x |
| Smoke 403 | PASS | — | FAIL |
| `rpc_error_log` spike | <10/h | 10-50/h | >50/h |
| Reclamações cliente | 0 | 1-2 | 3+ |

**Triggers de rollback automático:**
- Error rate >1% por 5min consecutivos
- p95 latency >2x baseline por 10min
- Smoke 403 vermelho
- Receber qualquer notificação de bug crítico de cliente

---

## Comunicação

- **Pré-D1**: e-mail stakeholders + Slack #engineering
- **D1, D2, D4, D6, D7**: status update no Slack (verde/amarelo/vermelho)
- **Post-D7**: postmortem + atualização do assessment FINAL (DB-016 fechado)

---

## Rollback completo (qualquer dia)

```bash
./scripts/db016-canary-controller.sh rollback
```

Sequência interna:
1. Vercel: flag → 0% (todos voltam ao path PostgREST direto)
2. Se REVOKE já aplicado: aplica migration rollback
3. Health check pós-rollback
4. Postmortem obrigatório em 48h

---

## Referências

- `supabase/migrations/_archived/20260521130000_db016_revoke_lancamentos_diarios.sql`
- `supabase/migrations/_archived/20260521131000_db016_revoke_rollback.sql`
- `scripts/db016-canary-controller.sh`
- `docs/reviews/db016-vector-analysis.md`
- `docs/reviews/qa-review.md` §4.1
- Stories 1.3 + 1.4 (`docs/stories/sprint-1/`)
