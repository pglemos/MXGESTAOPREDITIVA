-- Story 0.9 — Correlation ID FE → RPC → logs_auditoria/rpc_error_log
-- X-8 / GAP-09: observabilidade end-to-end
-- Pattern: FE envia header `x-correlation-id` (UUID v4) por request;
--   PostgREST expõe via current_setting('request.headers', true);
--   helpers SQL leem e gravam em logs.
-- Reference: docs/dev/observability.md

-- ============================================================
-- UP
-- ============================================================
BEGIN;

-- 1. Adicionar correlation_id em logs_auditoria
ALTER TABLE IF EXISTS public.logs_auditoria
  ADD COLUMN IF NOT EXISTS correlation_id text;

CREATE INDEX IF NOT EXISTS idx_logs_auditoria_correlation_id
  ON public.logs_auditoria(correlation_id)
  WHERE correlation_id IS NOT NULL;

-- 2. Adicionar correlation_id em rpc_error_log (Story 1.5)
ALTER TABLE IF EXISTS public.rpc_error_log
  ADD COLUMN IF NOT EXISTS correlation_id text;

CREATE INDEX IF NOT EXISTS idx_rpc_error_log_correlation_id
  ON public.rpc_error_log(correlation_id)
  WHERE correlation_id IS NOT NULL;

-- 3. Helper para extrair correlation_id do header da request PostgREST
CREATE OR REPLACE FUNCTION public.get_correlation_id()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_headers jsonb;
  v_correlation_id text;
BEGIN
  -- PostgREST expõe headers da request via current_setting('request.headers', true)
  -- Tenta extrair x-correlation-id; retorna NULL se setting ausente (chamada server-side)
  BEGIN
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
    v_correlation_id := v_headers->>'x-correlation-id';
  EXCEPTION
    WHEN others THEN
      v_correlation_id := NULL;
  END;

  -- Validação básica: deve ser string não-vazia até 64 chars (UUID v4 são 36)
  IF v_correlation_id IS NOT NULL AND (length(v_correlation_id) = 0 OR length(v_correlation_id) > 64) THEN
    v_correlation_id := NULL;
  END IF;

  RETURN v_correlation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_correlation_id() TO authenticated;

COMMENT ON FUNCTION public.get_correlation_id() IS
  'Story 0.9 — extrai x-correlation-id do header PostgREST. Retorna NULL se não enviado.';

-- 4. Refatorar log_rpc_error (Story 1.5) para capturar correlation_id automaticamente
CREATE OR REPLACE FUNCTION public.log_rpc_error(
  p_rpc_name text,
  p_sqlstate text,
  p_sqlerrm text,
  p_caller_id uuid DEFAULT auth.uid(),
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trace_id uuid;
BEGIN
  INSERT INTO public.rpc_error_log(rpc_name, sqlstate, sqlerrm, caller_id, payload, correlation_id)
  VALUES (p_rpc_name, p_sqlstate, p_sqlerrm, p_caller_id, p_payload, public.get_correlation_id())
  RETURNING trace_id INTO v_trace_id;
  RETURN v_trace_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_rpc_error(text, text, text, uuid, jsonb) TO authenticated;

-- 5. Helper opcional para devs gravarem manualmente em logs_auditoria com correlation
CREATE OR REPLACE FUNCTION public.append_audit_log(
  p_entity text,
  p_action text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.logs_auditoria(user_id, action, entity, details_json, correlation_id)
  VALUES (auth.uid(), p_action, p_entity, p_details, public.get_correlation_id());
END;
$$;

GRANT EXECUTE ON FUNCTION public.append_audit_log(text, text, jsonb) TO authenticated;

COMMIT;

-- ============================================================
-- DOWN
-- ============================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.append_audit_log(text, text, jsonb);
-- DROP FUNCTION IF EXISTS public.log_rpc_error(text, text, text, uuid, jsonb);
-- -- Recriar log_rpc_error versão Story 1.5 sem correlation_id
-- CREATE OR REPLACE FUNCTION public.log_rpc_error(
--   p_rpc_name text, p_sqlstate text, p_sqlerrm text,
--   p_caller_id uuid DEFAULT auth.uid(), p_payload jsonb DEFAULT '{}'::jsonb
-- ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
-- DECLARE v_trace_id uuid;
-- BEGIN
--   INSERT INTO public.rpc_error_log(rpc_name, sqlstate, sqlerrm, caller_id, payload)
--   VALUES (p_rpc_name, p_sqlstate, p_sqlerrm, p_caller_id, p_payload)
--   RETURNING trace_id INTO v_trace_id;
--   RETURN v_trace_id;
-- END $$;
-- DROP FUNCTION IF EXISTS public.get_correlation_id();
-- DROP INDEX IF EXISTS idx_logs_auditoria_correlation_id;
-- DROP INDEX IF EXISTS idx_rpc_error_log_correlation_id;
-- ALTER TABLE public.logs_auditoria DROP COLUMN IF EXISTS correlation_id;
-- ALTER TABLE public.rpc_error_log DROP COLUMN IF EXISTS correlation_id;
-- COMMIT;
