# Stores Schema — Epic MX Platform Evolution

**Data:** 2026-04-30
**Fonte:** `supabase/migrations/00000000000000_baseline_legacy_schema.sql`

## Tabela `public.stores`

| Coluna | Tipo | Default | Editavel pelo admin? | Observacao |
|---|---:|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | Nao | Identificador tecnico. |
| `name` | `text` | - | Sim | Nome exibido no app. |
| `manager_email` | `text` | `null` | Sim | Tambem sincroniza `store_delivery_rules`. |
| `legal_name` | `text` | `null` | Sim | Razao social cadastral da loja. |
| `cnpj` | `text` | `null` | Sim | CNPJ cadastral da loja. |
| `address` | `text` | `null` | Sim | Endereco completo da loja. |
| `partners` | `jsonb` | `[]` | Sim | Lista de socios com `name`, `document`, `phone` e `email`. |
| `active` | `boolean` | `true` | Sim | Arquiva/restaura sem excluir historico. |
| `created_at` | `timestamptz` | `now()` | Nao | Auditoria do registro. |
| `source_mode` | `text` | `native_app` | Nao | Controlado por migracoes/integrações. |
| `updated_at` | `timestamptz` | `now()` | Nao | Atualizado por trigger. |

## Whitelist de Edicao

Campos liberados no admin master:

- `name`
- `manager_email`
- `legal_name`
- `cnpj`
- `address`
- `partners`
- `active`

Campos cadastrais de loja foram adicionados pela story `OPS-20260504` para suportar governanca de endereco, CNPJ, razao social, socios e link de pre-cadastro por loja.

## Tabela `public.pre_cadastros_loja`

| Coluna | Tipo | Observacao |
|---|---:|---|
| `id` | `uuid` | Identificador tecnico. |
| `store_id` | `uuid` | Loja vinculada ao link publico. |
| `store_name_snapshot` | `text` | Nome da loja no momento do envio. |
| `full_name` | `text` | Nome completo informado. |
| `email` | `text` | E-mail informado. |
| `phone` | `text` | Telefone/WhatsApp informado. |
| `role` | `text` | `dono`, `gerente` ou `vendedor`. |
| `segment` | `text` | Segmento informado. |
| `store_tenure` | `text` | Tempo na loja. |
| `market_experience` | `text` | Experiencia de mercado. |
| `notes` | `text` | Observacoes opcionais. |
| `status` | `text` | `pending`, `reviewed`, `synced` ou `rejected`. |
| `submitted_at` | `timestamptz` | Data/hora do envio. |

## RLS

O baseline ja possui policy de `UPDATE` para `public.is_admin()`. A migration `20260430002000_mx_store_audit_log.sql` adiciona uma policy explicita para o escopo deste epic e cria auditoria por trigger.
