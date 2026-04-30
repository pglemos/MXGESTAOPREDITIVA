# STORY-10 — Visão de Consultoria Multiloja

Status: Ready for Review

## Contexto

O EPIC-10 exige visão geral multi-loja da consultoria MX com KPIs executivos e disparo operacional de relatórios. O painel já existia localmente, mas o fechamento mensal ainda estava defasado em relação ao matinal e ao semanal.

## Escopo

- Consolidar `PainelConsultor` como visão multi-loja oficial.
- Subir `relatorio-mensal` para o mesmo padrão operacional de `dry_run`, `force`, timezone São Paulo e idempotência real.
- Disponibilizar helper de cron mensal.
- Permitir disparo manual do mensal a partir do painel.

## Fora De Escopo

- Definir nova taxonomia de KPIs.
- Redesenhar o dashboard.
- Configurar provedor de e-mail externo além de Resend.

## Critérios De Aceite

- [x] Painel dispara `matinal`, `semanal` e `mensal`.
- [x] `relatorio-mensal` suporta `dry_run`, `force` e `store_id`.
- [x] `relatorio-mensal` grava log coerente em `logs_reprocessamento`.
- [x] Helper de cron mensal existe no banco live.
- [x] Gates locais passam.

## Validação

- `relatorio-mensal` reescrito em `v2` no repo.
- Função auxiliar `configure_monthly_report_cron` criada no live pela migration de reconciliação.
- `PainelConsultor` expõe botão de disparo mensal.
- Cron `mx-monthly-report` ativo no live com agenda `30 13 1 * *`.
- `npm run validate:e2e:live` confirmou `dry_run` de `relatorio-mensal`, `relatorio-matinal` e `feedback-semanal` na sandbox `SANDBOX MX QA`.

## File List

- `docs/stories/story-consulting-overview-10/spec/spec.md`
- `docs/stories/story-consulting-overview-10/plan/implementation.yaml`
- `scripts/seed_live_sandbox.ts`
- `scripts/validate_live_end_to_end.ts`
- `src/pages/PainelConsultor.tsx`
- `supabase/functions/relatorio-mensal/index.ts`
- `supabase/migrations/20260407160000_reconcile_epic09_12_end_to_end.sql`
