# Story OPS-20260503 - Hardening E2E Admin Master MX

## Status

Ready for Review

## Contexto

A auditoria live `E2E_ADMIN_MASTER_20260503010521` validou o ciclo completo do `administrador_geral`, mas encontrou bloqueios corrigíveis em contratos de upsert, disparo real de e-mail e download PDF de ROI. Esta story rastreia a correção no repo e no ambiente live sem registrar senha, token ou chave Resend em artefatos.

## Acceptance Criteria

- [x] `vendedores_loja` possui unicidade funcional em `store_id,seller_user_id` e o upsert de equipe passa sem fallback.
- [x] `lancamentos_diarios` possui unicidade funcional em `seller_user_id,store_id,reference_date,metric_scope` e o upsert de check-in passa sem fallback.
- [x] Funções SQL de importação usam conflito por `seller_user_id,store_id,reference_date,metric_scope`.
- [x] Download PDF de ROI e relatório de visita usa fluxo confiável por blob e anchor download.
- [x] Edge Functions de relatórios, visita e devolutiva individual usam provider selecionável e retornam erro de envio de forma rastreável.
- [x] Provider live alterado para Gmail API com `EMAIL_PROVIDER=gmail` e `GMAIL_FROM_EMAIL=gestao@mxconsultoria.com.br`.
- [x] Credenciais OAuth Gmail configuradas no live para a conta `gestao@mxconsultoria.com.br`, sem registrar secrets em artefatos.
- [x] Runner E2E Admin Master está versionado em `scripts/validate_admin_master_full_e2e.mjs` com script npm.
- [x] Gates locais passam: `npm run lint`, `npm run typecheck`, `npm test`.
- [x] Rollout live aplicado: migration, deploy das funções, `RESEND_FROM_EMAIL`, deploy Vercel e nova auditoria E2E sem `FAIL`.
- [x] Auditoria final sem `WARN` nos itens corrigíveis apos OAuth Gmail.

## Dev Agent Record

### Debug Log

- Auditoria anterior confirmou falha de constraint em `vendedores_loja` e `lancamentos_diarios`.
- Auditoria anterior confirmou timeout no download PDF de ROI via `html2pdf.save()`.
- Auditoria anterior confirmou envio real bloqueado por configuração Resend inválida/ausente em funções live.
- Migration `20260503020000_admin_master_e2e_hardening` aplicada no projeto live.
- Edge Functions publicadas: `relatorio-matinal`, `feedback-semanal`, `relatorio-mensal`, `send-visit-report`.
- Frontend publicado em produção: deployment Vercel `dpl_GfCNrvzKzpNobdjbaQJ4qGQdvYJU`, alias `https://mxperformance.vercel.app`.
- Auditoria final `E2E_ADMIN_MASTER_20260503023622`: 51 `PASS`, 4 `WARN`, 0 `FAIL`, 0 `BLOCKED`.
- Os 4 `WARN` da auditoria anterior eram exclusivamente envios por provider de e-mail ausente; o provider agora foi alterado para Gmail API.
- Provider de e-mail alterado de Resend para Gmail API em 2026-05-03.
- Secrets live aplicados: `EMAIL_PROVIDER`, `GMAIL_FROM_EMAIL`, `RESEND_FROM_EMAIL`.
- Funções republicadas após Gmail provider: `relatorio-matinal` v15, `feedback-semanal` v15, `relatorio-mensal` v14, `send-visit-report` v9, `send-individual-feedback` v10.
- Gmail API habilitada no projeto Google Cloud `mx-performance-calendar-oauth`.
- OAuth Gmail configurado via consentimento da conta `gestao@mxconsultoria.com.br` com escopo minimo `gmail.send`.
- Secrets OAuth Gmail aplicados no Supabase live: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, sem registrar valores.
- Auditoria final `E2E_ADMIN_MASTER_20260503042149`: 55 `PASS`, 0 `WARN`, 0 `FAIL`, 0 `BLOCKED`.
- Envios live por Gmail confirmados: `relatorio-matinal`, `feedback-semanal`, `relatorio-mensal` e `send-visit-report`.
- Varredura de artefatos finais nao encontrou senha, client secret ou codigo OAuth.

### File List

- `docs/stories/story-OPS-20260503-admin-master-e2e-hardening.md`
- `docs/audit/admin-master-full-e2e-20260503023622.md`
- `docs/audit/admin-master-full-e2e-20260503042149.md`
- `output/e2e-admin-master-full-20260503023622/`
- `output/e2e-admin-master-full-20260503042149/`
- `package.json`
- `package-lock.json`
- `scripts/validate_admin_master_full_e2e.mjs`
- `src/hooks/useCheckins.ts`
- `src/lib/pdf/downloadHtmlAsPdf.ts`
- `src/pages/ConsultoriaClienteDetalhe.tsx`
- `src/pages/ConsultoriaVisitaExecucao.tsx`
- `src/types/html2pdf.d.ts`
- `supabase/functions/_shared/email.ts`
- `supabase/functions/send-individual-feedback/index.ts`
- `supabase/functions/send-visit-report/index.ts`
- `supabase/migrations/00000000000000_baseline_legacy_schema.sql`
- `supabase/migrations/20260430190000_fundacao_portugues_permissoes_evidencias.sql`
- `supabase/migrations/20260430230000_fund02_nomenclatura_secundaria_portugues.sql`
- `supabase/migrations/20260503020000_admin_master_e2e_hardening.sql`
