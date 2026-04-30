# Stores Schema — Epic MX Platform Evolution

**Data:** 2026-04-30
**Fonte:** `supabase/migrations/00000000000000_baseline_legacy_schema.sql`

## Tabela `public.stores`

| Coluna | Tipo | Default | Editavel pelo admin? | Observacao |
|---|---:|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | Nao | Identificador tecnico. |
| `name` | `text` | - | Sim | Nome exibido no app. |
| `manager_email` | `text` | `null` | Sim | Tambem sincroniza `store_delivery_rules`. |
| `active` | `boolean` | `true` | Sim | Arquiva/restaura sem excluir historico. |
| `created_at` | `timestamptz` | `now()` | Nao | Auditoria do registro. |
| `source_mode` | `text` | `native_app` | Nao | Controlado por migracoes/integrações. |
| `updated_at` | `timestamptz` | `now()` | Nao | Atualizado por trigger. |

## Whitelist de Edicao

Campos liberados no admin master:

- `name`
- `manager_email`
- `active`

Campos citados no draft original (`phone`, `address`, `cnpj`) nao existem no schema atual de `stores`, portanto nao foram adicionados na UI para evitar colunas inventadas.

## RLS

O baseline ja possui policy de `UPDATE` para `public.is_admin()`. A migration `20260430002000_mx_store_audit_log.sql` adiciona uma policy explicita para o escopo deste epic e cria auditoria por trigger.
