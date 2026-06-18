-- Auditoria vendedor 2026-06-17 - snapshot historico do Funil
-- Cria persistencia auditavel para metricas agregadas do funil do vendedor.

BEGIN;

CREATE TABLE IF NOT EXISTS public.funnel_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  period_key text NOT NULL DEFAULT 'custom',
  meta integer,
  vendas_realizadas integer NOT NULL DEFAULT 0,
  vendas_faltantes integer,
  atingimento numeric(6,2),
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  channels jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'runtime_snapshot',
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT funnel_metrics_period_valid CHECK (period_end >= period_start),
  CONSTRAINT funnel_metrics_period_key_valid CHECK (char_length(trim(period_key)) BETWEEN 1 AND 32),
  CONSTRAINT funnel_metrics_meta_nonnegative CHECK (meta IS NULL OR meta >= 0),
  CONSTRAINT funnel_metrics_vendas_realizadas_nonnegative CHECK (vendas_realizadas >= 0),
  CONSTRAINT funnel_metrics_vendas_faltantes_nonnegative CHECK (vendas_faltantes IS NULL OR vendas_faltantes >= 0),
  CONSTRAINT funnel_metrics_atingimento_nonnegative CHECK (atingimento IS NULL OR atingimento >= 0),
  CONSTRAINT funnel_metrics_unique_period UNIQUE (seller_user_id, period_start, period_end, period_key)
);

COMMENT ON TABLE public.funnel_metrics IS 'Snapshots historicos do Funil de Vendas do vendedor por periodo e canal.';
COMMENT ON COLUMN public.funnel_metrics.channels IS 'Mapa JSONB por canal com total, ganhos, conversao e valor ganho.';
COMMENT ON COLUMN public.funnel_metrics.totals IS 'Totais agregados do funil no periodo selecionado.';

CREATE INDEX IF NOT EXISTS funnel_metrics_seller_period_idx
  ON public.funnel_metrics (seller_user_id, period_end DESC, period_start DESC);

CREATE INDEX IF NOT EXISTS funnel_metrics_loja_period_idx
  ON public.funnel_metrics (loja_id, period_end DESC, period_start DESC);

DROP TRIGGER IF EXISTS trg_funnel_metrics_updated_at ON public.funnel_metrics;
CREATE TRIGGER trg_funnel_metrics_updated_at
  BEFORE UPDATE ON public.funnel_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_touch_updated_at();

CREATE OR REPLACE FUNCTION public.mx_can_read_funnel_metrics(
  p_loja_id uuid,
  p_seller_user_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (
      p_seller_user_id = auth.uid()
      OR public.is_manager_of(p_loja_id)
      OR public.is_owner_of(p_loja_id)
      OR public.user_has_role(ARRAY['admin_mx', 'master', 'consultant'])
    );
$$;

COMMENT ON FUNCTION public.mx_can_read_funnel_metrics(uuid, uuid) IS
  'RLS helper para snapshots do funil: proprio vendedor, lideranca da loja ou perfis internos MX.';

ALTER TABLE public.funnel_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS funnel_metrics_select_scoped ON public.funnel_metrics;
CREATE POLICY funnel_metrics_select_scoped
  ON public.funnel_metrics
  FOR SELECT
  TO authenticated
  USING (public.mx_can_read_funnel_metrics(loja_id, seller_user_id));

DROP POLICY IF EXISTS funnel_metrics_insert_block_authenticated ON public.funnel_metrics;
CREATE POLICY funnel_metrics_insert_block_authenticated
  ON public.funnel_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS funnel_metrics_update_block_authenticated ON public.funnel_metrics;
CREATE POLICY funnel_metrics_update_block_authenticated
  ON public.funnel_metrics
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS funnel_metrics_delete_block_authenticated ON public.funnel_metrics;
CREATE POLICY funnel_metrics_delete_block_authenticated
  ON public.funnel_metrics
  FOR DELETE
  TO authenticated
  USING (false);

CREATE OR REPLACE FUNCTION public.upsert_funnel_metrics_snapshot(
  p_period_start date,
  p_period_end date,
  p_period_key text DEFAULT 'custom'
) RETURNS public.funnel_metrics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid := auth.uid();
  v_loja_id uuid;
  v_period_key text := lower(trim(coalesce(p_period_key, 'custom')));
  v_meta integer;
  v_vendas_realizadas integer := 0;
  v_vendas_faltantes integer;
  v_atingimento numeric(6,2);
  v_totals jsonb := '{}'::jsonb;
  v_channels jsonb := '{}'::jsonb;
  v_snapshot public.funnel_metrics;
BEGIN
  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.';
  END IF;

  IF p_period_start IS NULL OR p_period_end IS NULL OR p_period_end < p_period_start THEN
    RAISE EXCEPTION 'Periodo invalido para snapshot do funil.';
  END IF;

  IF char_length(v_period_key) = 0 OR char_length(v_period_key) > 32 THEN
    RAISE EXCEPTION 'Chave de periodo invalida.';
  END IF;

  SELECT vl.store_id
    INTO v_loja_id
  FROM public.vinculos_loja vl
  WHERE vl.user_id = v_seller_id
    AND vl.is_active = true
  ORDER BY
    CASE WHEN lower(vl.role) IN ('vendedor', 'seller') THEN 0 ELSE 1 END,
    vl.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_loja_id IS NULL THEN
    SELECT o.loja_id
      INTO v_loja_id
    FROM public.oportunidades o
    WHERE o.seller_user_id = v_seller_id
    ORDER BY o.created_at DESC
    LIMIT 1;
  END IF;

  IF v_loja_id IS NULL THEN
    RAISE EXCEPTION 'Loja ativa nao identificada para o vendedor.';
  END IF;

  IF to_regclass('public.regras_metas_loja') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'regras_metas_loja'
        AND column_name = 'monthly_goal'
    )
  THEN
    EXECUTE 'SELECT NULLIF(monthly_goal, 0)::integer FROM public.regras_metas_loja WHERE store_id = $1 LIMIT 1'
      INTO v_meta
      USING v_loja_id;
  END IF;

  WITH oportunidades_periodo AS (
    SELECT
      coalesce(o.canal::text, 'sem_canal') AS canal,
      o.etapa::text AS etapa,
      coalesce(o.valor_negociado, 0) AS valor_negociado
    FROM public.oportunidades o
    WHERE o.seller_user_id = v_seller_id
      AND o.loja_id = v_loja_id
      AND coalesce(o.closed_at, o.updated_at, o.created_at)::date BETWEEN p_period_start AND p_period_end
  ),
  canais AS (
    SELECT
      canal,
      count(*)::integer AS total,
      count(*) FILTER (WHERE etapa = 'ganho')::integer AS ganhos,
      coalesce(sum(valor_negociado) FILTER (WHERE etapa = 'ganho'), 0)::numeric(12,2) AS valor_ganho
    FROM oportunidades_periodo
    GROUP BY canal
  )
  SELECT
    count(*) FILTER (WHERE etapa = 'ganho')::integer,
    jsonb_build_object(
      'oportunidades_total', count(*)::integer,
      'ganhos', count(*) FILTER (WHERE etapa = 'ganho')::integer,
      'perdidos', count(*) FILTER (WHERE etapa = 'perdido')::integer,
      'valor_ganho', coalesce(sum(valor_negociado) FILTER (WHERE etapa = 'ganho'), 0)::numeric(12,2)
    ),
    coalesce(
      (
        SELECT jsonb_object_agg(
          canal,
          jsonb_build_object(
            'total', total,
            'ganhos', ganhos,
            'conversao', CASE WHEN total > 0 THEN round((ganhos::numeric / total::numeric) * 100, 2) ELSE 0 END,
            'valor_ganho', valor_ganho
          )
        )
        FROM canais
      ),
      '{}'::jsonb
    )
  INTO v_vendas_realizadas, v_totals, v_channels
  FROM oportunidades_periodo;

  v_vendas_faltantes := CASE
    WHEN v_meta IS NOT NULL THEN greatest(v_meta - v_vendas_realizadas, 0)
    ELSE NULL
  END;

  v_atingimento := CASE
    WHEN v_meta IS NOT NULL AND v_meta > 0 THEN round((v_vendas_realizadas::numeric / v_meta::numeric) * 100, 2)
    ELSE NULL
  END;

  INSERT INTO public.funnel_metrics (
    loja_id,
    seller_user_id,
    period_start,
    period_end,
    period_key,
    meta,
    vendas_realizadas,
    vendas_faltantes,
    atingimento,
    totals,
    channels,
    source,
    created_by,
    updated_by
  ) VALUES (
    v_loja_id,
    v_seller_id,
    p_period_start,
    p_period_end,
    v_period_key,
    v_meta,
    v_vendas_realizadas,
    v_vendas_faltantes,
    v_atingimento,
    v_totals,
    v_channels,
    'rpc_snapshot',
    v_seller_id,
    v_seller_id
  )
  ON CONFLICT (seller_user_id, period_start, period_end, period_key)
  DO UPDATE SET
    loja_id = EXCLUDED.loja_id,
    meta = EXCLUDED.meta,
    vendas_realizadas = EXCLUDED.vendas_realizadas,
    vendas_faltantes = EXCLUDED.vendas_faltantes,
    atingimento = EXCLUDED.atingimento,
    totals = EXCLUDED.totals,
    channels = EXCLUDED.channels,
    source = EXCLUDED.source,
    updated_by = EXCLUDED.updated_by,
    updated_at = now()
  RETURNING * INTO v_snapshot;

  RETURN v_snapshot;
END;
$$;

COMMENT ON FUNCTION public.upsert_funnel_metrics_snapshot(date, date, text) IS
  'Registra snapshot idempotente das metricas do Funil de Vendas do vendedor autenticado.';

GRANT SELECT ON public.funnel_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_funnel_metrics_snapshot(date, date, text) TO authenticated;

COMMIT;
