# STORY-09 — Painel de PDI Completo

Status: Ready for Review

## Contexto

O EPIC-09 exige trazer o PDI metodológico completo para dentro do produto, com radar de competências, horizontes de 6/12/24 meses, cinco ações mandatórias, revisão mensal e PDF final. O código já consumia esse modelo, mas o Supabase live ainda não estava reconciliado.

## Escopo

- Aplicar `PDI 2.0` no live com colunas de radar, horizontes e ações mandatórias.
- Criar `pdi_reviews` para revisão mensal navegável.
- Permitir criação e revisão por `admin` e `gerente`.
- Permitir leitura e ciência por `vendedor`.
- Manter impressão do PDI em PDF via `PDIPrint`.

## Fora De Escopo

- Alterar a matriz oficial de papéis.
- Criar workflow externo de assinatura.
- Automatizar revisão mensal por cron.

## Critérios De Aceite

- [x] `pdis` suporta o modelo metodológico completo.
- [x] `pdi_reviews` existe no live com RLS compatível.
- [x] `GerentePDI` cria e revisa PDI sem depender de schema legado.
- [x] `VendedorFeedback` e `PDIPrint` leem o PDI completo.
- [x] Gates locais passam.

## Validação

- Migration `20260407160000_reconcile_epic09_12_end_to_end.sql` aplicada no live.
- Migration `20260407161000_pdi_legacy_compatibility.sql` aplicada no live para sombra legada `objective/action`.
- `pdi_reviews` criado e validado no banco live.
- `pdis` agora expõe `meta_6m`, `meta_12m`, `meta_24m`, `comp_*` e `action_*`.
- `npm run validate:e2e:live` validou login real de `gerente` e `vendedor`, criação de revisão mensal e leitura do PDI por papel na loja sandbox `SANDBOX MX QA`.

## File List

- `docs/stories/story-pdi-complete-09/spec/spec.md`
- `docs/stories/story-pdi-complete-09/plan/implementation.yaml`
- `scripts/seed_live_sandbox.ts`
- `scripts/validate_live_end_to_end.ts`
- `src/hooks/useData.ts`
- `src/pages/GerentePDI.tsx`
- `src/pages/PDIPrint.tsx`
- `src/pages/VendedorFeedback.tsx`
- `src/types/database.ts`
- `supabase/migrations/20260407160000_reconcile_epic09_12_end_to_end.sql`
- `supabase/migrations/20260407161000_pdi_legacy_compatibility.sql`
