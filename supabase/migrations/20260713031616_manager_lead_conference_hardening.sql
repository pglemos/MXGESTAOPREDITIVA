-- Endurece a conferencia gerencial sem reescrever a migration ja aplicada.
-- A RPC permanece como unico caminho autenticado de escrita e valida o escopo internamente.

BEGIN;

CREATE OR REPLACE FUNCTION public.save_manager_lead_conference(
  p_store_id uuid,
  p_period_type text,
  p_period_start date,
  p_period_end date,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_conference_id uuid;
  v_total_mx integer;
  v_total_official integer;
  v_divergent_sellers integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Sessao invalida.' USING ERRCODE = '28000';
  END IF;

  IF p_period_type NOT IN ('current_week', 'previous_week', 'current_month', 'previous_month', 'custom') THEN
    RAISE EXCEPTION 'Tipo de periodo invalido.' USING ERRCODE = '22023';
  END IF;

  IF p_period_start IS NULL OR p_period_end IS NULL OR p_period_end < p_period_start THEN
    RAISE EXCEPTION 'Periodo invalido.' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Informe ao menos um vendedor.' USING ERRCODE = '22023';
  END IF;

  IF NOT (
    public.eh_area_interna_mx()
    OR public.tem_papel_loja(p_store_id, ARRAY['dono', 'gerente'])
  ) THEN
    RAISE EXCEPTION 'Perfil sem permissao para conferir leads desta unidade.'
      USING ERRCODE = '42501';
  END IF;

  WITH normalized AS (
    SELECT *
    FROM jsonb_to_recordset(p_items) AS item(
      seller_user_id uuid,
      internet_mx integer,
      internet_official integer,
      carteira_mx integer,
      carteira_official integer
    )
  )
  SELECT
    COALESCE(SUM(internet_mx + carteira_mx), 0)::integer,
    COALESCE(SUM(internet_official + carteira_official), 0)::integer,
    COUNT(*) FILTER (
      WHERE (internet_official - internet_mx) <> 0
         OR (carteira_official - carteira_mx) <> 0
    )::integer
  INTO v_total_mx, v_total_official, v_divergent_sellers
  FROM normalized;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_items) AS item(
      seller_user_id uuid,
      internet_mx integer,
      internet_official integer,
      carteira_mx integer,
      carteira_official integer
    )
    WHERE seller_user_id IS NULL
      OR internet_mx IS NULL OR internet_mx < 0
      OR internet_official IS NULL OR internet_official < 0
      OR carteira_mx IS NULL OR carteira_mx < 0
      OR carteira_official IS NULL OR carteira_official < 0
  ) THEN
    RAISE EXCEPTION 'Volumes de leads invalidos.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_items) AS item(seller_user_id uuid)
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.vendedores_loja seller
      WHERE seller.store_id = p_store_id
        AND seller.seller_user_id = item.seller_user_id
        AND seller.is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'Vendedor fora do escopo da unidade.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.manager_lead_conferences (
    store_id,
    manager_user_id,
    period_type,
    period_start,
    period_end,
    total_mx,
    total_official,
    total_difference,
    divergent_sellers
  ) VALUES (
    p_store_id,
    (SELECT auth.uid()),
    p_period_type,
    p_period_start,
    p_period_end,
    v_total_mx,
    v_total_official,
    v_total_official - v_total_mx,
    v_divergent_sellers
  )
  RETURNING id INTO v_conference_id;

  INSERT INTO public.manager_lead_conference_items (
    conference_id,
    seller_user_id,
    internet_mx,
    internet_official,
    carteira_mx,
    carteira_official,
    internet_difference,
    carteira_difference,
    total_difference
  )
  SELECT
    v_conference_id,
    item.seller_user_id,
    item.internet_mx,
    item.internet_official,
    item.carteira_mx,
    item.carteira_official,
    item.internet_official - item.internet_mx,
    item.carteira_official - item.carteira_mx,
    (item.internet_official - item.internet_mx) + (item.carteira_official - item.carteira_mx)
  FROM jsonb_to_recordset(p_items) AS item(
    seller_user_id uuid,
    internet_mx integer,
    internet_official integer,
    carteira_mx integer,
    carteira_official integer
  );

  RETURN v_conference_id;
END;
$$;

REVOKE ALL ON TABLE public.manager_lead_conferences FROM anon;
REVOKE ALL ON TABLE public.manager_lead_conference_items FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.manager_lead_conferences FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.manager_lead_conference_items FROM authenticated;
GRANT SELECT ON TABLE public.manager_lead_conferences TO authenticated;
GRANT SELECT ON TABLE public.manager_lead_conference_items TO authenticated;
REVOKE ALL ON FUNCTION public.save_manager_lead_conference(uuid, text, date, date, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_manager_lead_conference(uuid, text, date, date, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_manager_lead_conference(uuid, text, date, date, jsonb) TO authenticated;

COMMENT ON FUNCTION public.save_manager_lead_conference(uuid, text, date, date, jsonb) IS
  'Persiste atomicamente uma conferencia de leads como unico caminho autenticado de escrita, com autorizacao validada internamente.';

COMMIT;
