# STORY-03 — Painel Da Loja E Ranking Oficial

Status: Ready for Review

## Contexto

Com schema canonico e check-in temporal corrigidos, o painel da loja precisa usar as fontes oficiais: `regras_metas_loja`, `store_sellers`, `daily_checkins.reference_date` e `users.is_venda_loja`. O ranking nao pode contaminar meta individual com `VENDA LOJA` quando a regra da loja desabilita isso.

## Escopo

- Ajustar equipe/status para usar vigencia operacional em `store_sellers`.
- Ajustar status de check-in usando `seller_user_id` e `reference_date`.
- Ajustar ranking oficial para usar vendedores ativos da vigencia.
- Aplicar regra `include_venda_loja_in_individual_goal`.
- Ajustar dashboard da loja para usar meta em `regras_metas_loja`.
- Aplicar regra `include_venda_loja_in_store_total` no total da loja.

## Fora De Escopo

- Notificacao automatica de sem registro.
- Novo layout completo do painel.
- Filtros avancados por periodo.
- Reescrita do matinal/semanal.

## Criterios De Aceite

- [x] `useTeam` usa `store_sellers` como fonte primaria da equipe.
- [x] Status check-in usa `reference_date` e `seller_user_id`.
- [x] `useRanking` usa `store_sellers` e meta de `regras_metas_loja`.
- [x] `VENDA LOJA` nao contamina meta individual quando `include_venda_loja_in_individual_goal=false`.
- [x] Dashboard usa `regras_metas_loja.monthly_goal`.
- [x] Dashboard respeita `include_venda_loja_in_store_total`.
- [x] Gates locais passam.

## Validacao

- Queries live validadas via Supabase JS:
  - `store_sellers -> users`.
  - `store_sellers -> stores`.
  - `regras_metas_loja`.
  - `daily_checkins` com campos canonicos.
- `useTeam` mantem fallback para `memberships` quando a loja ainda nao tem vigencia configurada.

## Gates

- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou, 26 testes.
- `npm run build`: passou.
- `git diff --check`: passou.

## File List

- `docs/stories/story-store-dashboard-ranking-03/spec/spec.md`
- `docs/stories/story-store-dashboard-ranking-03/plan/implementation.yaml`
- `src/hooks/useTeam.ts`
- `src/hooks/useRanking.ts`
- `src/hooks/useGoals.ts`
- `src/pages/DashboardLoja.tsx`
