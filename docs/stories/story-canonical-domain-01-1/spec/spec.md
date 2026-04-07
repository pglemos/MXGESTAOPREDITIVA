# STORY-01.1 — Alinhar Schema Canonico MX

Status: Ready for Review

## Contexto

O plano operacional `v1.3` e o backlog `v1.2` congelam o EPIC-01 como base obrigatoria antes de check-in, ranking, matinal, semanal, reprocessamento e PDI. O Supabase live ainda mantem parte do schema antigo de `daily_checkins` (`user_id`, `date`, `leads`, `agd_cart`, etc.) e nao possui tabelas canonicas como `store_sellers`, `store_benchmarks`, `store_delivery_rules`, `store_meta_rules`, `reprocess_logs` e `raw_imports`.

## Decisao

Aplicar uma migration incremental e idempotente que cria a camada canonica sem remover as colunas antigas. A compatibilidade sera feita por trigger de sincronizacao em `daily_checkins`, permitindo que codigo novo use `seller_user_id`, `reference_date`, `submitted_at` e campos `*_prev_day` enquanto dados legados continuam legiveis.

## Escopo

- Criar/ajustar colunas canonicas em `stores`, `users` e `daily_checkins`.
- Criar `store_sellers` como camada de vigencia operacional.
- Criar `store_benchmarks` com benchmark 20/60/33 por loja.
- Criar `store_delivery_rules` com destinatarios por loja.
- Criar `store_meta_rules` como fonte unica de meta mensal da loja.
- Criar `reprocess_logs` e `raw_imports` para reparo administrativo.
- Criar views operacionais de `sem registro` e producao diaria.
- Backfill a partir de `memberships`, `benchmarks`, `goals`, `stores.manager_email` e `daily_checkins` legado.
- Aplicar RLS usando a matriz oficial de papeis: admin global, dono/gerente por loja, vendedor proprio.

## Fora de Escopo

- Drop de colunas antigas de `daily_checkins`.
- Reescrita visual completa do check-in.
- Deploy de Edge Functions.
- Criacao de usuarios reais `dono`, `gerente` ou `vendedor` em producao.

## Criterios De Aceite

- [x] Migration validada com `BEGIN ... ROLLBACK` no Supabase live.
- [x] Migration aplicada no Supabase live em transacao controlada.
- [x] Historico de migration marcado como aplicado sem rodar `supabase db push` geral.
- [x] Tabelas canonicas existem no banco live.
- [x] Campos canonicos de `daily_checkins` existem e sao preenchidos por trigger/backfill.
- [x] RLS existe para tabelas canonicas.
- [x] Tipos do frontend representam as novas tabelas.
- [x] `useMyCheckins` usa `seller_user_id` e `reference_date`, nao `user_id` e `date`.
- [x] Gates locais passam: `npm run lint`, `npm run typecheck`, `npm test`.

## Validacao Supabase Live

- Project ref: `fbhcmzzgwjdgkctlfvbo`.
- Migration aplicada: `20260407001000_canonical_domain_alignment.sql`.
- Historico reparado com `supabase migration repair --status applied 20260407001000`.
- Tabelas confirmadas: `store_sellers`, `store_benchmarks`, `store_delivery_rules`, `store_meta_rules`, `reprocess_logs`, `raw_imports`.
- Views confirmadas: `view_sem_registro`, `view_store_daily_production`.
- Backfill confirmado:
  - `stores`: 8.
  - `store_benchmarks`: 8.
  - `store_delivery_rules`: 8.
  - `store_meta_rules`: 8.
  - `store_sellers`: 0, porque nao ha membership real de vendedor no banco atual.
  - `daily_checkins`: 0, porque a tabela live esta sem check-ins persistidos.
- Trigger `sync_daily_checkins_canonical` validada em transacao com rollback: insert canonico preencheu tambem `user_id`, `date`, `leads`, `agd_cart` e `visitas`.
- RLS validado em transacao com rollback:
  - `admin`: acesso global a regras canonicas.
  - `dono`: acesso somente a loja vinculada.
  - `gerente`: acesso somente a loja vinculada.
  - `vendedor`: acesso ao proprio check-in e propria vigencia.

## Gates

- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou, 22 testes.
- `npm run build`: passou.
- `git diff --check`: passou.

## Observacoes

- `supabase db push` geral continua bloqueado ate reconciliar o historico antigo de migrations remotas/locais.
- Esta story nao criou usuarios reais em producao; validacoes de `dono`, `gerente` e `vendedor` foram transacionais e revertidas.

## File List

- `docs/stories/story-canonical-domain-01-1/spec/spec.md`
- `docs/stories/story-canonical-domain-01-1/plan/implementation.yaml`
- `supabase/migrations/20260407001000_canonical_domain_alignment.sql`
- `src/types/database.ts`
- `src/hooks/useCheckins.ts`
