# STORY-07 — Feedback Semanal Oficial

Status: Ready for Review

## Contexto

O EPIC-07 exige feedback semanal oficial às segundas 12:30, consolidando a semana anterior por loja e vendedor, com diagnostico por benchmark MX, envio por e-mail, link de relatorio completo, sugestoes, destinatarios e logs. O backlog define janela semanal, benchmark 20/60/33, metas aproximadas, comparacao com media da equipe e cron oficial.

## Escopo

- Consolidar dados de segunda a domingo da semana anterior em `America/Sao_Paulo`.
- Usar `store_sellers` como fonte primaria de vendedores e `memberships` como fallback temporario.
- Calcular leads, agendamentos, visitas, vendas, conversoes, media da equipe, meta semanal estimada e gargalo principal por vendedor.
- Persistir snapshot em `relatorios_devolutivas_semanais`.
- Gerar HTML e CSV para e-mail semanal.
- Suportar `dry_run`, `force` e filtro `store_id` na Edge Function.
- Agendar cron `mx-weekly-feedback-1230` para segunda 12:30 BRT.
- Registrar logs em `logs_reprocessamento` sem marcar como concluido quando e-mail nao foi enviado.

## Fora De Escopo

- Criar usuarios reais de dono, gerente e vendedor em producao.
- Configurar `RESEND_API_KEY` quando o secret remoto nao existir.
- Automatizar WhatsApp.
- Implementar PDI mensal.

## Criterios De Aceite

- [x] Consolidado semanal usa semana anterior fechada.
- [x] Diagnostico usa benchmark MX 20/60/33 ou benchmark configurado por loja.
- [x] Relatorio semanal persiste snapshot por loja/semana.
- [x] E-mail semanal tem HTML, CSV, link do relatorio completo e sugestoes por vendedor.
- [x] Dry-run valida sem enviar e-mail nem gravar log.
- [x] Cron segunda 12:30 BRT e criado/validado no Supabase live.
- [x] Gates locais passam.

## Validacao

- Migration `20260407006000_weekly_feedback_official.sql` aplicada no Supabase live e reparada com `supabase migration repair --status applied 20260407006000`.
- Edge Function `feedback-semanal` deployada no projeto `fbhcmzzgwjdgkctlfvbo`.
- Dry-run live retornou `200`, processou 8 lojas e usou periodo `2026-03-30` a `2026-04-05` sem gravar `relatorios_devolutivas_semanais` nem `logs_reprocessamento`.
- Cron live `mx-weekly-feedback-1230` criado e ativo com schedule `30 15 * * 1`, equivalente a segunda 12:30 em `America/Sao_Paulo`.
- RLS de `relatorios_devolutivas_semanais` validado com transacao e `ROLLBACK`: dono ve relatorio da loja, vendedor nao ve relatorio semanal.
- Limite operacional: `RESEND_API_KEY` ainda nao existe nos secrets remotos e as lojas retornaram `0` destinatarios semanais no dry-run.

## Gates

- `npm run lint`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou, 26 testes.
- `npm run build`: passou.
- `git diff --check`: passou.

## File List

- `docs/stories/story-weekly-feedback-07/spec/spec.md`
- `docs/stories/story-weekly-feedback-07/plan/implementation.yaml`
- `supabase/functions/feedback-semanal/index.ts`
- `supabase/migrations/20260407006000_weekly_feedback_official.sql`
- `supabase/migrations/20260407006100_feedback_seller_ack_guard.sql`
- `src/types/database.ts`
- `src/hooks/useData.ts`
- `src/hooks/useGoals.ts`
