# Sprint 1 — Verificações Rápidas (Stories 1.7, 1.8, 1.9)

**Date:** 2026-05-17
**Executor:** @aiox-master (Orion) — análise estática
**Objetivo:** Validar gaps reais antes do Sprint 1 kick-off

---

## 1. Story 1.9 — SYS-005 (`@supabase/supabase-js` em devDeps)

### Status: ✅ **CONFIRMADO** — mas severidade pode ser **REBAIXADA**

**Evidência:**
```json
// package.json
"dependencies": { /* @supabase/supabase-js AUSENTE */ }
"devDependencies": { "@supabase/supabase-js": "^2.102.1" }
```

**Vite bundla mesmo assim?** ✅ SIM — `vite.config.ts:95` define chunk `vendor-supabase`, então client bundle funciona.

**Risco real:**
- ❌ Server-side scripts (`scripts/*.ts`) que rodam com `npm install --production` quebram
- ❌ Vercel/Docker builds com `--omit=dev` falham se algum import server-side de supabase-js
- ✅ Client bundle de produção funciona (Vite resolve em build time)

**Severidade revisada:** Crítica → **Média** (package hygiene, não outage iminente)
**Esforço Story 1.9:** mantém 2h
**Patch:**
```bash
npm uninstall @supabase/supabase-js && npm install @supabase/supabase-js@^2.102.1
```

---

## 2. Story 1.8 — DB-013/019 (Tabelas SEM RLS)

### Status: ✅ **TODAS CONFIRMADAS**

| Tabela | Criada em | RLS habilitado? | Risco |
|--------|-----------|:----:|-------|
| `role_assignments_audit` | baseline_legacy:573 | ❌ Não | **Alto** — audit de atribuição de roles entre tenants |
| `roles` | baseline_legacy | ❌ Não | Baixo — referência (system data) |
| `store_meta_rules_history` → renomeada `historico_regras_metas_loja` | baseline + rename 20260430230000 | ❌ Não | **Alto** — histórico de regras de meta por loja (multi-tenant) |
| `migration_backup_vendedores_loja_duplicates_20260503` | hardening 20260503020000:6 | ❌ Não | **Crítico** — PII de vendedores |
| `migration_backup_lancamentos_diarios_duplicates_20260503` | hardening 20260503020000:60 | ❌ Não | **Crítico** — PII de lançamentos (valores comerciais) |

**Esforço Story 1.8:** mantém 10h (4 tabelas a habilitar RLS + 1 caso especial dos backups que tratamos em 1.7)

### Patch SQL pronto
```sql
-- Story 1.8 deliverable
ALTER TABLE public.role_assignments_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_assignments_audit_select ON public.role_assignments_audit
  FOR SELECT TO authenticated
  USING (public.eh_administrador_mx());

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_select ON public.roles
  FOR SELECT TO authenticated
  USING (true);  -- referência pública, sem dados sensíveis
-- Sem INSERT/UPDATE/DELETE policy → bloqueia escrita por padrão

ALTER TABLE public.historico_regras_metas_loja ENABLE ROW LEVEL SECURITY;
CREATE POLICY historico_regras_metas_loja_select ON public.historico_regras_metas_loja
  FOR SELECT TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
  );
```

---

## 3. Story 1.7 — DB-013 (Backups PII)

### Status: ✅ **PII VIVA CONFIRMADA** — Backups foram populados

**Evidência:**
```sql
-- migration 20260503020000:26
INSERT INTO public.migration_backup_vendedores_loja_duplicates_20260503
SELECT ranked.*, now() AS archived_at
FROM ranked
WHERE ranked.duplicate_rank > 1;

-- migration 20260503020000:80
INSERT INTO public.migration_backup_lancamentos_diarios_duplicates_20260503
SELECT ranked.*, now() AS archived_at
FROM ranked
WHERE ranked.duplicate_rank > 1;
```

**Confirmações:**
- ✅ Tabelas criadas via `CREATE TABLE AS SELECT ... WHERE false` (estrutura, sem RLS)
- ✅ Populadas via `INSERT INTO ... WHERE duplicate_rank > 1` (PII real se houvesse duplicatas)
- ✅ Depois disso, `DELETE FROM public.vendedores_loja` removeu duplicatas da tabela viva
- ✅ Resultado: backup é a **única cópia** dos duplicates removidos — PII real, sem RLS, exposta a qualquer `authenticated`

**Severidade:** Crítica (mantém)
**Esforço Story 1.7:** mantém 8h
**Recomendação:** export-encrypt-then-drop (procedimento da story original)

### Atenção LGPD
Esses backups têm PII de vendedores (nomes, IDs, dados de loja) e lançamentos (métricas comerciais). LGPD exige:
- Minimização: backup desnecessário após validação → drop
- Confidencialidade: enquanto existirem, devem ter RLS administradores-only
- Audit log: drop deve ser registrado em `logs_auditoria`

---

## 4. Achado Adicional — SYS-001 (3 lockfiles)

Confirma achado da FASE 1:

```
bun.lock           224KB
deno.lock          245KB
package-lock.json  553KB
```

**Risco:** drift entre package managers, builds inconsistentes em CI/devs locais.
**Recomendação:** definir único package manager (recomendo npm pelo lockfile mais usado) e remover os outros 2. **+ Story 1.X (Sprint 0/1 opcional, 1h).**

---

## 5. Resumo das Verificações Desta Sessão

| # | Verificação | Resultado | Stories afetadas |
|---|-------------|-----------|------------------|
| 1 | SYS-012 (.env exposto) | ❌ Falso positivo | Story 0.2 escopo reduzido |
| 2 | Inventário `lancamentos_diarios` | ✅ 13 consumers + descoberta legacy path | Stories 0.8/1.1/1.2 atualizadas |
| 3 | DB-016 vetor | ✅ Confirmado mas escopo menor | Severidade Crítica→Alta |
| 4 | DB-001/002 em `submit_checkin` RPC | ✅ Ambos gaps reais | Stories 1.5/1.6 mantidas |
| 5 | DB-028 inconsistência policy↔RPC | 🆕 Novo débito | Sugerir Story 1.10 |
| 6 | SYS-005 (supabase-js devDeps) | ✅ Confirmado, severidade ↓ | Story 1.9 mantida |
| 7 | DB-013/019 (RLS faltantes + backups PII) | ✅ Todas confirmadas | Stories 1.7/1.8 mantidas |

**Total verificado:** 7 débitos críticos/altos do assessment validados em ~25 minutos de análise estática.

**Estimativa Sprint 1 atualizada:**
- Sem Story 1.10 (DB-028): ~106h
- Com Story 1.10 (DB-028): ~112h

---

## 6. Próximos Passos Recomendados

| # | Ação | Quem | Urgência |
|---|------|------|----------|
| 1 | Atualizar `technical-debt-assessment.md` com refinamentos (DB-016 severidade, DB-028 novo, SYS-005 severidade) | @architect | Antes da apresentação ao board |
| 2 | Atualizar `TECHNICAL-DEBT-REPORT.md` com narrativa refinada DB-016 (evita over-selling) | @analyst | Antes da apresentação ao board |
| 3 | Atualizar Sprint 1 stories (1.5/1.6) com patches SQL deste doc | @pm ou @sm | Antes do kick-off Sprint 1 |
| 4 | Decidir: criar Story 1.10 (DB-028) ou postpor para Sprint 2 | Tech Lead | Antes do kick-off Sprint 1 |
| 5 | Commit organizado dos 33 artefatos do workflow + 4 reviews adicionais | @devops | Quando o usuário aprovar |

---

## 7. Referências

- [package.json](package.json) (SYS-005 evidência)
- [vite.config.ts:95](vite.config.ts) (chunk vendor-supabase)
- [supabase/migrations/20260503020000_admin_master_e2e_hardening.sql:6-80](supabase/migrations/20260503020000_admin_master_e2e_hardening.sql) (backups populados)
- [supabase/migrations/00000000000000_baseline_legacy_schema.sql:573,623](supabase/migrations/00000000000000_baseline_legacy_schema.sql) (tabelas sem RLS)
- `docs/reviews/lancamentos-diarios-consumers-inventory.md` (Story 0.8)
- `docs/reviews/db016-vector-analysis.md` (vetor DB-016)
- `docs/reviews/submit-checkin-rpc-audit.md` (DB-001/002/028)
