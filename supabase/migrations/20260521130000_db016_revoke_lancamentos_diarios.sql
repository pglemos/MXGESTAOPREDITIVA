-- Story 1.3/1.4 — DB-016 REVOKE de write direto em lancamentos_diarios
-- ============================================================================
-- ATENCAO: Esta migration NAO deve ser aplicada automaticamente em prod.
-- Aplicar APENAS apos:
--   1. Feature flag VITE_FLAG_LANCAMENTOS_VIA_RPC=true em staging por 24h sem erros
--   2. Smoke 403 verde em staging (story 0.6)
--   3. RLS regression matrix verde (story 0.5)
--   4. Janela operacional 7 dias disponivel para canary (10% -> 25% -> 100%)
--   5. Canary fase C (1%) por 24h sem SLO breach
-- Rollback: aplicar migration 20260521130500_db016_revoke_rollback.sql
-- ============================================================================

BEGIN;

-- 1) Validar que executor e admin MX (defesa em profundidade)
DO $$
BEGIN
  IF NOT public.eh_administrador_mx() THEN
    RAISE EXCEPTION 'DB-016 REVOKE: apenas admin MX pode aplicar (caller=%, role=%)',
      auth.uid(), current_user;
  END IF;
END $$;

-- 2) Log no audit antes do REVOKE (rastreabilidade obrigatoria)
INSERT INTO public.logs_auditoria (user_id, action, entity, details_json)
VALUES (
  auth.uid(),
  'REVOKE_DIRECT_WRITE',
  'lancamentos_diarios',
  jsonb_build_object(
    'reason', 'DB-016 hardening — fechar bypass de regra via POST direto PostgREST',
    'story', '1.3/1.4',
    'canary_stage', current_setting('app.db016_canary_stage', true),
    'migration_ts', '20260521130000',
    'executor', auth.uid()
  )
);

-- 3) REVOKE writes: clientes authenticated/anon so escrevem via submit_checkin RPC
--    SELECT permanece (policy_select via tem_papel_loja segue ativa)
REVOKE INSERT, UPDATE, DELETE ON public.lancamentos_diarios FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.lancamentos_diarios FROM anon;

-- 4) GRANT explicito de SELECT (idempotente; mantem policy_select via tem_papel_loja)
GRANT SELECT ON public.lancamentos_diarios TO authenticated;

-- 5) GRANT EXECUTE na RPC canonica (idempotente; reforca canal unico de escrita)
GRANT EXECUTE ON FUNCTION public.submit_checkin(jsonb) TO authenticated;

-- 6) Comentario de tabela registra o hardening
COMMENT ON TABLE public.lancamentos_diarios IS
  'DB-016 (Story 1.3/1.4): writes apenas via RPC submit_checkin. INSERT/UPDATE/DELETE direto REVOGADO de authenticated/anon em 2026-05-21.';

COMMIT;
