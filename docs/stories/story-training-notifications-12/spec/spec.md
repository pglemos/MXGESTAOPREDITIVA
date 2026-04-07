# STORY-12 — Treinamentos e Notificações Operacionais

Status: Ready for Review

## Contexto

O EPIC-12 exige inbox operacional por usuário, broadcasts rastreáveis e prescrição tática de treinamentos com base em gargalo. O frontend já assumia esse contrato, mas o live ainda usava o schema reduzido de `notifications`.

## Escopo

- Consolidar `notifications` como inbox por usuário.
- Criar `broadcast_id` e `sender_id`.
- Criar RPC `send_broadcast_notification`.
- Manter `notification_reads` como compatibilidade transitória.
- Permitir fan-out operacional em matinal, semanal, rotina e central de mensagens.

## Fora De Escopo

- Push notification móvel.
- Websocket dedicado para notificações.
- Centro de preferências por usuário.

## Critérios De Aceite

- [x] `notifications` possui colunas canônicas do app.
- [x] `send_broadcast_notification` existe no live.
- [x] `useNotifications` e `useSystemBroadcasts` operam sobre `recipient_id` e `broadcast_id`.
- [x] matinal e semanal conseguem inserir notificações no schema final.
- [x] Gates locais passam.

## Validação

- Migration `20260407160000_reconcile_epic09_12_end_to_end.sql` aplicada no live.
- Migration `20260407162000_training_progress_rls.sql` aplicada no live para liberar leitura por `gerente`, `dono` e leitura própria do `vendedor`.
- `notifications` agora contém `recipient_id`, `store_id`, `type`, `priority`, `link`, `read`, `created_at`, `sender_id` e `broadcast_id`.
- RPC `send_broadcast_notification` validada no banco live.
- `npm run validate:e2e:live` confirmou inbox do vendedor, bloqueio de criação de feedback pelo vendedor, leitura de progresso de treinamento e broadcast rastreável na sandbox.

## File List

- `docs/stories/story-training-notifications-12/spec/spec.md`
- `docs/stories/story-training-notifications-12/plan/implementation.yaml`
- `scripts/seed_live_sandbox.ts`
- `scripts/validate_live_end_to_end.ts`
- `src/hooks/useData.ts`
- `src/pages/ConsultorNotificacoes.tsx`
- `src/pages/Notificacoes.tsx`
- `src/pages/RotinaGerente.tsx`
- `src/types/database.ts`
- `supabase/functions/feedback-semanal/index.ts`
- `supabase/functions/relatorio-matinal/index.ts`
- `supabase/migrations/20260407160000_reconcile_epic09_12_end_to_end.sql`
- `supabase/migrations/20260407162000_training_progress_rls.sql`
