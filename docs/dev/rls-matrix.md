# RLS Regression Matrix — Runbook

> Story 0.5 — T-01 (qa-review §5). Rede de proteção mandatória para mudanças em policies / RPCs.

## Objetivo

Detectar regressão de RLS antes do merge: **8 tabelas críticas × 5 roles × 4 ops = 160 assertions mínimas**.

| Tabela | Status |
|---|---|
| `public.lancamentos_diarios` | ATIVO |
| `public.usuarios` | ATIVO |
| `public.vendedores_loja` | ATIVO |
| `public.vinculos_loja` | ATIVO |
| `public.lojas` | ATIVO |
| `public.metas` | ATIVO |
| `public.logs_auditoria` | ATIVO |
| `public.role_assignments_audit` | CONDICIONAL (Story 1.8) |
| `public.feature_flags` | XFAIL (Sprint 1) |

Roles cobertos: `admin`, `dono`, `gerente`, `vendedor`, `anon`.

## Como rodar localmente

```bash
# 1. Subir Supabase local
supabase start

# 2. Aplicar migrations
supabase db reset --no-seed

# 3. Garantir pgTAP
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -c "CREATE EXTENSION IF NOT EXISTS pgtap;"

# 4. Rodar suite
export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
bash scripts/run_rls_matrix.sh
```

Saída esperada: `ok N - <descrição>` por assertion. Falha = `not ok`.

## Estrutura

```
supabase/tests/rls-matrix/
├── setup.sql                       # fixtures determinísticas (UUIDs fixos)
├── _helpers.sql                    # rls_matrix.assume(uuid), visible_count(...)
├── lancamentos_diarios.test.sql    # 20 assertions
├── usuarios.test.sql               # 20
├── vendedores_loja.test.sql        # 20
├── vinculos_loja.test.sql          # 20
├── lojas.test.sql                  # 20
├── metas.test.sql                  # 20
├── logs_auditoria.test.sql         # 20
├── role_assignments_audit.test.sql # 20 (xfail-aware)
├── feature_flags.test.sql          # 20 (xfail enquanto ausente)
└── runner.sql                      # \i de todos
```

Cada test file usa `BEGIN ... ROLLBACK` global + `SAVEPOINT` por role — isolamento garantido, **zero resíduo no DB**.

## Como adicionar uma tabela à matriz

1. Criar `supabase/tests/rls-matrix/<tabela>.test.sql` seguindo o padrão dos arquivos existentes.
2. Plan(20) — 5 roles × 4 ops.
3. Para cada role: `rls_matrix.assume(<uuid>)` + SELECT/INSERT/UPDATE/DELETE.
4. Adicionar `\i` em `runner.sql`.
5. Documentar nova linha na tabela acima.

## Como interpretar falhas

- `not ok N - <descrição>`: assertion falhou — descrição indica role + op + tabela. Ex.: `not ok 7 - vendedor: UPDATE em loja alheia bloqueado por RLS (0 rows)`.
- **0 rows esperado vs N affected:** policy USING/WITH CHECK afrouxou indevidamente — investigar última migration em policies.
- **`throws_ok` que não disparou:** role anon permite operação que deveria estar bloqueada — `REVOKE` ou policy `TO anon` faltando.

## Xfails conhecidos

| Cenário | Motivo | Story de remoção |
|---|---|---|
| `dono/gerente: DELETE em lancamentos_diarios/metas/vendedores_loja` | DB-022 `USING(true)` em policies de DELETE | Sprint 1 — DB-022 |
| `role_assignments_audit` | Tabela criada em Story 1.8 | Story 1.8 |
| `feature_flags` | Tabela ainda não migrada | Sprint 1 |

## Integração CI

Workflow: `.github/workflows/rls-matrix.yml` — roda em PR que toca `supabase/migrations/**` ou a própria suite. Timeout 10min. Required check ativado em branch protection (coordenado com Story 0.4).

## Não fazer

- ❌ Não usar `service_role` nos testes (RLS é bypassado e o teste perde sentido).
- ❌ Não deixar `INSERT/UPDATE` sem `ROLLBACK TO SAVEPOINT` — quebra isolamento entre roles.
- ❌ Não remover o `BEGIN ... ROLLBACK` global — é a única garantia de zero resíduo.
