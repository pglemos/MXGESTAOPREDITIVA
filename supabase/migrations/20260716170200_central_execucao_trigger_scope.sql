-- Uma alteracao apenas em observacoes nao deve recriar/reabrir a atividade da Central.
-- Mudancas estruturais do compromisso continuam sincronizadas.

BEGIN;

DROP TRIGGER IF EXISTS trg_central_sync_agendamento_action ON public.agendamentos;

CREATE TRIGGER trg_central_sync_agendamento_action
AFTER INSERT OR UPDATE OF data_hora, status, tipo, cliente_id, oportunidade_id
ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.trg_central_sync_agendamento_action();

COMMIT;
