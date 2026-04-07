# STORY-05 — Relatorio Matinal Oficial

Status: Ready for Review

## Contexto

O EPIC-05 exige engine do matinal, template HTML oficial, anexo exportavel, CTA de WhatsApp, log de envio e agendamento às 10:30. A funcao existente ja apontava para esse fluxo, mas precisava usar o schema canonico com fallback controlado enquanto `store_sellers` ainda esta vazio no Supabase live.

## Escopo

- Consolidar engine da Edge Function `relatorio-matinal`.
- Usar fuso `America/Sao_Paulo` para data de referencia e envio.
- Usar `store_sellers` como fonte primaria e `memberships` como fallback temporario.
- Usar `store_meta_rules.monthly_goal` e `include_venda_loja_in_store_total`.
- Gerar payload, HTML, CSV e texto de WhatsApp coerentes com o painel.
- Adicionar `dry_run`, `force` e filtro `store_id` para validacao operacional.
- Registrar log sem bloquear reenvio quando o e-mail nao foi enviado.

## Fora De Escopo

- Configurar provedor Resend quando a chave `RESEND_API_KEY` nao existir.
- Criar automacao externa de WhatsApp.
- Reescrever feedback semanal ou relatorio mensal.

## Criterios De Aceite

- [x] Engine gera payload consistente para loja com dados validos.
- [x] HTML contem cabecalho, meta, vendas, projecao, atingimento, sem registro, cards por vendedor e CTA WhatsApp.
- [x] CSV exportavel acompanha o matinal quando houver envio.
- [x] Logs de envio ficam salvos em `reprocess_logs`.
- [x] Dry-run permite validar sem enviar e-mail nem gravar log.
- [x] Funcao e deploy live sao validados.
- [x] Agendamento 10:30 BRT e validado ou registrado como bloqueado por dependencia externa.
- [x] Gates locais passam.

## Validacao

- Edge Function `relatorio-matinal` deployada no projeto `fbhcmzzgwjdgkctlfvbo`, versao 2, em 2026-04-07.
- Dry-run live retornou `200`, processou 8 lojas e nao gravou logs em `reprocess_logs`.
- Cron live `mx-morning-report-1030` criado e ativo com schedule `30 13 * * *`, equivalente a 10:30 em `America/Sao_Paulo`.
- Migration `20260407004000_morning_report_cron_1030.sql` aplicada no Supabase live e reparada com `supabase migration repair --status applied 20260407004000`.
- Limite operacional: `RESEND_API_KEY` nao existe nos secrets remotos e as 8 lojas retornaram `0` destinatarios matinais no dry-run. O envio real esta tecnicamente preparado, mas depende dessas configuracoes operacionais.

## Gates

- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou, 26 testes.
- `npm run build`: passou.
- `git diff --check`: passou.

## File List

- `docs/stories/story-morning-report-05/spec/spec.md`
- `docs/stories/story-morning-report-05/plan/implementation.yaml`
- `supabase/functions/relatorio-matinal/index.ts`
- `supabase/migrations/20260407004000_morning_report_cron_1030.sql`
