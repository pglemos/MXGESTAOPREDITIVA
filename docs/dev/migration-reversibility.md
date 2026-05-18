# Migration Reversibility — Runbook

**Story:** 0.7 / T-10 / X-11
**Template:** `supabase/migrations/_templates/template_reversible_migration.sql`
**Lint:** `scripts/check_migration_reversibility.mjs`
**CI:** `.github/workflows/migration-reversibility.yml`

---

## Por que importa

X-11 (qa-review §5) classifica como **CRÍTICO**: sem `-- DOWN` testado, RTO em incidente vai de <2min (script DOWN) para >15min (PITR + manual recovery). Toda migration crítica (RLS, RPC, schema multi-tenant) DEVE ter bloco DOWN validado UP→DOWN→UP em CI antes do merge.

---

## Workflow para criar nova migration

### 1. Copiar template

```bash
cp supabase/migrations/_templates/template_reversible_migration.sql \
   supabase/migrations/$(date +%Y%m%d%H%M%S)_<slug>.sql
```

### 2. Implementar UP + DOWN

- UP dentro de `BEGIN; ... COMMIT;`
- DOWN no comentário ao fim do arquivo
- Idempotência obrigatória (`IF EXISTS`, `OR REPLACE`)
- `search_path` explícito em SECURITY DEFINER

### 3. Validar localmente

```bash
# Lint (DOWN bloco presente?)
node scripts/check_migration_reversibility.mjs

# UP local
supabase db reset

# DOWN manual (copiar bloco do comentário)
psql "$DATABASE_URL" -f /tmp/down.sql

# UP de novo + diff schema (idempotência)
supabase db reset
```

### 4. Abrir PR

- Workflow `Migration Reversibility Check` roda automaticamente
- Se migration é **crítica** (toca RLS, RPC, schema multi-tenant), adicionar label `migration:critical` no PR para ativar gate UP→DOWN→UP em branch ephemeral

---

## Labels do PR

| Label | Efeito |
|-------|--------|
| (sem label) | Apenas lint DOWN bloco roda |
| `migration:critical` | Gate UP→DOWN→UP ephemeral roda (~5min); falha se schema diverge após ciclo |

---

## Stories que se beneficiam (Sprint 1+)

- DB-016 (REVOKE em `lancamentos_diarios`) — gate obrigatório, rollback de canary depende de DOWN testado
- DB-006 (renames PT-BR EN coexistem) — drop EN exige DOWN
- DB-013 (drop migration_backup_*) — irreversível, DOWN documenta "no-op"
- DB-017 (Sentry source maps) — apenas FE, mas docs DOWN exige rollback de schema se houver

---

## Falhas comuns

### "Migration sem bloco DOWN documentado"
Adicione comentário ao final:
```sql
-- ============================================================
-- DOWN
-- ============================================================
-- DROP FUNCTION IF EXISTS public.<func>(...);
-- DROP POLICY IF EXISTS <policy> ON public.<tabela>;
```

### "Schema diverge após UP→DOWN→UP"
Migration não é idempotente. Use:
- `CREATE TABLE IF NOT EXISTS`
- `CREATE OR REPLACE FUNCTION`
- `DROP POLICY IF EXISTS ... ; CREATE POLICY ...`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`

### "DOWN script falha em produção"
Antes de qualquer migration crítica:
1. Validar UP→DOWN→UP local (passos acima)
2. Aplicar em staging Supabase
3. Executar smoke tests (Story 0.6) + RLS matrix (Story 0.5) verde
4. Só então merge para `main`

---

## Migrations existentes (compliance)

Migrations criadas nesta sessão já têm bloco DOWN:
- ✅ `20260517120000_rpc_error_log_wrap_sqlerrm.sql` (Story 1.5)
- ✅ `20260517130000_submit_checkin_validate_vendedor.sql` (Story 1.6)
- ✅ `20260518100000_rls_tabelas_faltantes.sql` (Story 1.8)
- ✅ `20260518110000_rpcs_get_lancamentos.sql` (Story 1.1)
- ✅ `20260518120000_checkin_validation_kit.sql` (Story 1.10)

Migrations legacy (`00000000000000_baseline_legacy_schema.sql`, `_archived/*`) ficam fora do lint via exclude.

---

## Referências

- `supabase/migrations/_templates/template_reversible_migration.sql`
- `scripts/check_migration_reversibility.mjs`
- `.github/workflows/migration-reversibility.yml`
- `docs/reviews/qa-review.md` §5 (T-10, X-11)
- Story 0.7: `docs/stories/sprint-0/story-0.7-migration-reversibility.md`
