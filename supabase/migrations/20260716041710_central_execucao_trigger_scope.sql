-- Reconstruida a partir de supabase_migrations.schema_migrations (producao).
-- Nao havia arquivo local para esta migration ja aplicada em prod; texto abaixo e fiel ao que rodou.

BEGIN;

DROP TRIGGER IF EXISTS trg_central_sync_agendamento_action ON public.agendamentos;

CREATE TRIGGER trg_central_sync_agendamento_action
AFTER INSERT OR UPDATE OF data_hora, status, tipo, cliente_id, oportunidade_id
ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.trg_central_sync_agendamento_action();

COMMIT;
