# Contrato Supabase do redesign interno MX

Projeto: `fbhcmzzgwjdgkctlfvbo` (`MX GESTAO PREDITIVA`)
Região: `sa-east-1`

## Resultado

- Nenhuma migration criada.
- Nenhuma tabela, coluna, view, função, trigger, RLS ou Edge Function alterada.
- Nenhum payload de query, mutation ou RPC alterado.
- O novo pacote `@mx/ui` não contém import de `@/lib/supabase`.
- A autorização de navegação continua usando `canAccessPath`.

## Gate

Qualquer necessidade futura de DDL ou mudança de política deve ser tratada em entrega separada, com migration, teste de autorização e advisors de segurança.
