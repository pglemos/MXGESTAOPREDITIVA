# Arquivo de Migrations Legadas

Estas migrations foram arquivadas em `supabase/migrations_legacy/` porque deixaram de representar a cadeia oficial do projeto.

## Motivo

- Havia drift entre histórico local e remoto.
- Existiam timestamps duplicados e arquivos fora do padrão do Supabase CLI.
- Parte das tentativas de EPIC-09 a EPIC-12 estava implementada no código, mas não aplicada de forma consistente no Supabase live.

## Cadeia Ativa

A cadeia oficial ativa passa a ser:

- `20260407000000_role_matrix_dono_admin.sql`
- `20260407001000_canonical_domain_alignment.sql`
- `20260407002000_checkin_temporal_status.sql`
- `20260407003000_manager_daily_routine.sql`
- `20260407004000_morning_report_cron_1030.sql`
- `20260407005000_whatsapp_share_logs.sql`
- `20260407006000_weekly_feedback_official.sql`
- `20260407006100_feedback_seller_ack_guard.sql`
- `20260407160000_reconcile_epic09_12_end_to_end.sql`

## Regra

Nenhuma migration deste diretório deve voltar para `supabase/migrations/` sem nova reconciliação explícita.
