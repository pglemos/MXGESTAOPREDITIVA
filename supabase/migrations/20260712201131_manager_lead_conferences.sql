-- Conferencia auditavel de volumes oficiais de leads por periodo e vendedor.
-- A operacao e append-only: o fechamento diario original nao e sobrescrito.
-- Rollback seguro (enquanto sem consumidores):
--   DROP TABLE IF EXISTS public.manager_lead_conference_items;
--   DROP TABLE IF EXISTS public.manager_lead_conferences;

BEGIN;

CREATE TABLE public.manager_lead_conferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE RESTRICT,
  manager_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  period_type text NOT NULL CHECK (period_type IN ('current_week', 'previous_week', 'current_month', 'previous_month', 'custom')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_mx integer NOT NULL CHECK (total_mx >= 0),
  total_official integer NOT NULL CHECK (total_official >= 0),
  total_difference integer NOT NULL,
  divergent_sellers integer NOT NULL CHECK (divergent_sellers >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT manager_lead_conferences_period_check CHECK (period_end >= period_start)
);

CREATE TABLE public.manager_lead_conference_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid NOT NULL REFERENCES public.manager_lead_conferences(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  internet_mx integer NOT NULL CHECK (internet_mx >= 0),
  internet_official integer NOT NULL CHECK (internet_official >= 0),
  carteira_mx integer NOT NULL CHECK (carteira_mx >= 0),
  carteira_official integer NOT NULL CHECK (carteira_official >= 0),
  internet_difference integer NOT NULL,
  carteira_difference integer NOT NULL,
  total_difference integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT manager_lead_conference_items_unique_seller UNIQUE (conference_id, seller_user_id)
);

CREATE INDEX manager_lead_conferences_store_period_idx
  ON public.manager_lead_conferences (store_id, period_start DESC, period_end DESC);

CREATE INDEX manager_lead_conferences_created_at_idx
  ON public.manager_lead_conferences (created_at DESC);

CREATE INDEX manager_lead_conference_items_seller_idx
  ON public.manager_lead_conference_items (seller_user_id, created_at DESC);

ALTER TABLE public.manager_lead_conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_lead_conference_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY manager_lead_conferences_select
  ON public.manager_lead_conferences
  FOR SELECT
  TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
  );

CREATE POLICY manager_lead_conferences_insert
  ON public.manager_lead_conferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    manager_user_id = (SELECT auth.uid())
    AND (
      public.eh_area_interna_mx()
      OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
    )
  );

CREATE POLICY manager_lead_conference_items_select
  ON public.manager_lead_conference_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.manager_lead_conferences conference
      WHERE conference.id = manager_lead_conference_items.conference_id
        AND (
          public.eh_area_interna_mx()
          OR public.tem_papel_loja(conference.store_id, ARRAY['dono', 'gerente'])
        )
    )
  );

CREATE POLICY manager_lead_conference_items_insert
  ON public.manager_lead_conference_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.manager_lead_conferences conference
      WHERE conference.id = manager_lead_conference_items.conference_id
        AND conference.manager_user_id = (SELECT auth.uid())
        AND (
          public.eh_area_interna_mx()
          OR public.tem_papel_loja(conference.store_id, ARRAY['dono', 'gerente'])
        )
        AND EXISTS (
          SELECT 1
          FROM public.vendedores_loja seller
          WHERE seller.store_id = conference.store_id
            AND seller.seller_user_id = manager_lead_conference_items.seller_user_id
            AND seller.is_active = true
        )
    )
  );

CREATE OR REPLACE FUNCTION public.save_manager_lead_conference(
  p_store_id uuid,
  p_period_type text,
  p_period_start date,
  p_period_end date,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
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
      WHERE (internet_official - internet_mx) + (carteira_official - carteira_mx) <> 0
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
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.manager_lead_conferences FROM authenticated;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.manager_lead_conference_items FROM authenticated;
GRANT SELECT, INSERT ON TABLE public.manager_lead_conferences TO authenticated;
GRANT SELECT, INSERT ON TABLE public.manager_lead_conference_items TO authenticated;
REVOKE ALL ON FUNCTION public.save_manager_lead_conference(uuid, text, date, date, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_manager_lead_conference(uuid, text, date, date, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_manager_lead_conference(uuid, text, date, date, jsonb) TO authenticated;

COMMENT ON TABLE public.manager_lead_conferences IS
  'Cabecalho append-only da conferencia gerencial de leads oficiais por periodo.';
COMMENT ON TABLE public.manager_lead_conference_items IS
  'Comparacao auditavel MX versus CRM oficial por vendedor e canal.';
COMMENT ON COLUMN public.manager_lead_conference_items.total_difference IS
  'Total oficial menos total registrado no MX para o vendedor.';
COMMENT ON FUNCTION public.save_manager_lead_conference(uuid, text, date, date, jsonb) IS
  'Persiste atomicamente uma conferencia de leads e seus itens sob RLS do usuario autenticado.';

COMMIT;
