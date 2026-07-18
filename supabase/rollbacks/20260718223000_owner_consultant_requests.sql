-- ============================================================
-- DOWN
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS solicitacoes_consultoria_delete_internal ON public.solicitacoes_consultoria;
DROP POLICY IF EXISTS solicitacoes_consultoria_cancel_own ON public.solicitacoes_consultoria;
DROP POLICY IF EXISTS solicitacoes_consultoria_update ON public.solicitacoes_consultoria;
DROP POLICY IF EXISTS solicitacoes_consultoria_insert ON public.solicitacoes_consultoria;
DROP POLICY IF EXISTS solicitacoes_consultoria_select ON public.solicitacoes_consultoria;

DROP TRIGGER IF EXISTS trg_solicitacoes_consultoria_updated_at ON public.solicitacoes_consultoria;
DROP TRIGGER IF EXISTS trg_validate_consulting_request_scope ON public.solicitacoes_consultoria;
DROP FUNCTION IF EXISTS public.validate_consulting_request_scope();
DROP TABLE IF EXISTS public.solicitacoes_consultoria;

COMMIT;
