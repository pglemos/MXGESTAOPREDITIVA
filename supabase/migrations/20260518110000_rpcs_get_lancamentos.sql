-- Story 1.1 — RPCs SECURITY DEFINER para leitura de lancamentos_diarios
-- Pré-requisito DB-016 canary: consumers migram para essas RPCs antes do REVOKE
-- Pattern: SECURITY DEFINER + search_path + check de policy SELECT atual + wrap SQLERRM (Story 1.5)
--
-- Equivalência à policy SELECT atual (20260430190000_fundacao):
--   USING (
--     public.eh_area_interna_mx()
--     OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
--     OR seller_user_id = auth.uid()
--   )
--
-- Família:
--   1. get_lancamentos_por_loja_periodo       (ranking, performance — por loja)
--   2. get_lancamentos_por_vendedor_periodo   (checkins individuais — por vendedor)
--   3. get_lancamento_por_dia                 (lookup único — seller+store+date+scope)
--   4. get_lancamentos_rede_periodo           (admin MX global — ranking global)
--   5. get_lancamentos_referencia_dia         (today checkins — global por data)

-- =====================================================
-- Helper: verifica acesso de leitura a uma loja específica
-- (replica policy SELECT)
-- =====================================================
CREATE OR REPLACE FUNCTION public.pode_ler_lancamentos_loja(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.eh_area_interna_mx()
    OR public.tem_papel_loja(p_store_id, ARRAY['dono', 'gerente'])
$$;

GRANT EXECUTE ON FUNCTION public.pode_ler_lancamentos_loja(uuid) TO authenticated;

-- =====================================================
-- 1. get_lancamentos_por_loja_periodo
-- Caso de uso: ranking, performance loja em intervalo
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_lancamentos_por_loja_periodo(
  p_store_id uuid,
  p_start_date date,
  p_end_date date,
  p_scope text DEFAULT 'daily'
)
RETURNS SETOF public.lancamentos_diarios
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.pode_ler_lancamentos_loja(p_store_id)
     AND NOT EXISTS (
       SELECT 1 FROM public.lancamentos_diarios
        WHERE store_id = p_store_id
          AND seller_user_id = v_caller_id
       LIMIT 1
     ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
    SELECT *
      FROM public.lancamentos_diarios
     WHERE store_id = p_store_id
       AND metric_scope = p_scope
       AND reference_date BETWEEN p_start_date AND p_end_date
       AND (
         public.pode_ler_lancamentos_loja(p_store_id)
         OR seller_user_id = v_caller_id
       )
     ORDER BY reference_date DESC, seller_user_id;
EXCEPTION
  WHEN others THEN
    PERFORM public.log_rpc_error(
      'get_lancamentos_por_loja_periodo',
      SQLSTATE, SQLERRM,
      v_caller_id,
      jsonb_build_object('store_id', p_store_id, 'start', p_start_date, 'end', p_end_date, 'scope', p_scope)
    );
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lancamentos_por_loja_periodo(uuid, date, date, text) TO authenticated;

-- =====================================================
-- 2. get_lancamentos_por_vendedor_periodo
-- Caso de uso: useCheckins (lista checkins do próprio vendedor)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_lancamentos_por_vendedor_periodo(
  p_seller_id uuid,
  p_store_id uuid,
  p_start_date date,
  p_end_date date,
  p_scope text DEFAULT 'daily'
)
RETURNS SETOF public.lancamentos_diarios
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  IF v_caller_id <> p_seller_id
     AND NOT public.pode_ler_lancamentos_loja(p_store_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
    SELECT *
      FROM public.lancamentos_diarios
     WHERE seller_user_id = p_seller_id
       AND store_id = p_store_id
       AND metric_scope = p_scope
       AND reference_date BETWEEN p_start_date AND p_end_date
     ORDER BY reference_date DESC;
EXCEPTION
  WHEN others THEN
    PERFORM public.log_rpc_error(
      'get_lancamentos_por_vendedor_periodo',
      SQLSTATE, SQLERRM,
      v_caller_id,
      jsonb_build_object('seller_id', p_seller_id, 'store_id', p_store_id, 'start', p_start_date, 'end', p_end_date, 'scope', p_scope)
    );
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lancamentos_por_vendedor_periodo(uuid, uuid, date, date, text) TO authenticated;

-- =====================================================
-- 3. get_lancamento_por_dia
-- Caso de uso: lookup único (form de edição, dashboard hoje)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_lancamento_por_dia(
  p_seller_id uuid,
  p_store_id uuid,
  p_reference_date date,
  p_scope text DEFAULT 'daily'
)
RETURNS public.lancamentos_diarios
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_row public.lancamentos_diarios;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  IF v_caller_id <> p_seller_id
     AND NOT public.pode_ler_lancamentos_loja(p_store_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0001';
  END IF;

  SELECT *
    INTO v_row
    FROM public.lancamentos_diarios
   WHERE seller_user_id = p_seller_id
     AND store_id = p_store_id
     AND reference_date = p_reference_date
     AND metric_scope = p_scope
   LIMIT 1;

  RETURN v_row;
EXCEPTION
  WHEN others THEN
    PERFORM public.log_rpc_error(
      'get_lancamento_por_dia',
      SQLSTATE, SQLERRM,
      v_caller_id,
      jsonb_build_object('seller_id', p_seller_id, 'store_id', p_store_id, 'date', p_reference_date, 'scope', p_scope)
    );
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lancamento_por_dia(uuid, uuid, date, text) TO authenticated;

-- =====================================================
-- 4. get_lancamentos_rede_periodo
-- Caso de uso: ranking global / admin MX
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_lancamentos_rede_periodo(
  p_start_date date,
  p_end_date date,
  p_scope text DEFAULT 'daily'
)
RETURNS SETOF public.lancamentos_diarios
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.eh_area_interna_mx() THEN
    RAISE EXCEPTION 'forbidden_global_read' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
    SELECT *
      FROM public.lancamentos_diarios
     WHERE metric_scope = p_scope
       AND reference_date BETWEEN p_start_date AND p_end_date
     ORDER BY reference_date DESC, store_id, seller_user_id;
EXCEPTION
  WHEN others THEN
    PERFORM public.log_rpc_error(
      'get_lancamentos_rede_periodo',
      SQLSTATE, SQLERRM,
      v_caller_id,
      jsonb_build_object('start', p_start_date, 'end', p_end_date, 'scope', p_scope)
    );
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lancamentos_rede_periodo(date, date, text) TO authenticated;

-- =====================================================
-- 5. get_lancamentos_referencia_dia
-- Caso de uso: useNetworkHierarchy "today checkins" (admin MX scope)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_lancamentos_referencia_dia(
  p_reference_date date,
  p_scope text DEFAULT 'daily'
)
RETURNS SETOF public.lancamentos_diarios
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.eh_area_interna_mx() THEN
    RAISE EXCEPTION 'forbidden_global_read' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
    SELECT *
      FROM public.lancamentos_diarios
     WHERE metric_scope = p_scope
       AND reference_date = p_reference_date
     ORDER BY store_id, seller_user_id;
EXCEPTION
  WHEN others THEN
    PERFORM public.log_rpc_error(
      'get_lancamentos_referencia_dia',
      SQLSTATE, SQLERRM,
      v_caller_id,
      jsonb_build_object('date', p_reference_date, 'scope', p_scope)
    );
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lancamentos_referencia_dia(date, text) TO authenticated;

-- =====================================================
-- Notas para Story 1.2 (migrar consumers)
-- =====================================================
-- Mapeamento sugerido:
--   useRanking.ts                  → get_lancamentos_por_loja_periodo + get_lancamentos_rede_periodo + get_lancamentos_referencia_dia
--   useCheckins.ts                 → get_lancamentos_por_vendedor_periodo + get_lancamento_por_dia
--   useTeam.ts                     → get_lancamentos_por_loja_periodo
--   usePerformance.ts              → get_lancamentos_por_loja_periodo + get_lancamentos_referencia_dia
--   useNetworkHierarchy.ts         → get_lancamentos_referencia_dia
--   pages/MorningReport.tsx        → get_lancamentos_por_loja_periodo + get_lancamentos_referencia_dia
--   pages/PainelConsultor.tsx      → get_lancamentos_rede_periodo (admin)
--   pages/AiDiagnostics.tsx        → get_lancamentos_por_loja_periodo
--   pages/GerenteFeedback.tsx      → get_lancamentos_por_loja_periodo
--   lib/automation/*               → get_lancamentos_rede_periodo (admin scope)
--
-- Story 1.2 chama atrás de feature flag `enforce_lancamentos_rls`; quando flag OFF mantém PostgREST direto.
-- Story 1.3 faz REVOKE de write em lancamentos_diarios; SELECT direct continua até DB-022 (USING(true) → tem_papel_loja).

-- =====================================================
-- DOWN (rollback emergencial)
-- =====================================================
-- DROP FUNCTION IF EXISTS public.get_lancamentos_por_loja_periodo(uuid, date, date, text);
-- DROP FUNCTION IF EXISTS public.get_lancamentos_por_vendedor_periodo(uuid, uuid, date, date, text);
-- DROP FUNCTION IF EXISTS public.get_lancamento_por_dia(uuid, uuid, date, text);
-- DROP FUNCTION IF EXISTS public.get_lancamentos_rede_periodo(date, date, text);
-- DROP FUNCTION IF EXISTS public.get_lancamentos_referencia_dia(date, text);
-- DROP FUNCTION IF EXISTS public.pode_ler_lancamentos_loja(uuid);
