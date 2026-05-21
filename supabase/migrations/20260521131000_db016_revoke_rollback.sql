-- Story 1.3/1.4 — DB-016 ROLLBACK migration
-- Restaura permissões pré-REVOKE em lancamentos_diarios caso o canary falhe.
-- Aplicar APENAS via runbook docs/runbooks/sprint-1-story-1.3-1.4-db016-canary.md
-- Trigger: error rate >0.5% por 5min OU p95 latency >2x baseline OU smoke 403 vermelho

BEGIN;

-- 1) Gate admin
DO $$
BEGIN
  IF NOT public.eh_administrador_mx() THEN
    RAISE EXCEPTION 'Apenas admin MX pode reverter DB-016 REVOKE';
  END IF;
END $$;

-- 2) Audit log
INSERT INTO public.logs_auditoria (user_id, action, entity, details_json)
VALUES (
  auth.uid(),
  'ROLLBACK_DB016',
  'lancamentos_diarios',
  jsonb_build_object(
    'reason', 'Canary failure — restore direct writes',
    'story', '1.3/1.4 rollback',
    'restored_at', now()
  )
);

-- 3) Restaurar GRANTs de escrita (policies RLS ainda validam pode_lancar_checkin)
GRANT INSERT, UPDATE, DELETE ON public.lancamentos_diarios TO authenticated;

COMMIT;
