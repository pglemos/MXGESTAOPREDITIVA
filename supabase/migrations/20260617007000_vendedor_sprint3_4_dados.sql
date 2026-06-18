-- Auditoria vendedor 2026-06-17 - Sprint 3/4
-- - adiciona trilha de auditoria updated_by em tabelas operacionais do vendedor
-- - cria seller_product_categories para modelar dominio/categoria por vendedor

BEGIN;

CREATE OR REPLACE FUNCTION public.mx_set_updated_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_by = COALESCE(auth.uid(), NEW.updated_by);
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'clientes',
    'oportunidades',
    'agendamentos',
    'atendimentos',
    'vendedor_perfil',
    'cadencia_fluxos',
    'cadencia_estado_cliente',
    'pdi_sessoes',
    'pdi_metas',
    'pdi_plano_acao',
    'aulas_ao_vivo',
    'aula_provas',
    'aula_presencas',
    'devolutivas',
    'devolutiva_acoes',
    'execution_actions'
  ]
  LOOP
    EXECUTE format(
      'ALTER TABLE IF EXISTS public.%I ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL',
      table_name
    );

    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_by ON public.%I', table_name, table_name);
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_by BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.mx_set_updated_by()',
        table_name,
        table_name
      );
    END IF;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.seller_product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  category_key text NOT NULL,
  category_label text NOT NULL,
  proficiency text NOT NULL DEFAULT 'em_desenvolvimento'
    CHECK (proficiency = ANY (ARRAY['iniciante', 'em_desenvolvimento', 'domina', 'especialista'])),
  monthly_goal integer NOT NULL DEFAULT 0 CHECK (monthly_goal >= 0),
  monthly_sales integer NOT NULL DEFAULT 0 CHECK (monthly_sales >= 0),
  notes text,
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, store_id, category_key)
);

COMMENT ON TABLE public.seller_product_categories IS
  'Categorias/produtos dominados pelo vendedor para perfil, treinamentos, PDI e funil.';

CREATE INDEX IF NOT EXISTS seller_product_categories_seller_idx
  ON public.seller_product_categories (seller_id, store_id);

CREATE INDEX IF NOT EXISTS seller_product_categories_store_idx
  ON public.seller_product_categories (store_id, category_key);

DROP TRIGGER IF EXISTS trg_seller_product_categories_updated_at ON public.seller_product_categories;
CREATE TRIGGER trg_seller_product_categories_updated_at
BEFORE UPDATE ON public.seller_product_categories
FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

DROP TRIGGER IF EXISTS trg_seller_product_categories_updated_by ON public.seller_product_categories;
CREATE TRIGGER trg_seller_product_categories_updated_by
BEFORE UPDATE ON public.seller_product_categories
FOR EACH ROW EXECUTE FUNCTION public.mx_set_updated_by();

ALTER TABLE public.seller_product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seller_product_categories_seller_rw ON public.seller_product_categories;
CREATE POLICY seller_product_categories_seller_rw
ON public.seller_product_categories
FOR ALL
TO authenticated
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS seller_product_categories_store_read ON public.seller_product_categories;
CREATE POLICY seller_product_categories_store_read
ON public.seller_product_categories
FOR SELECT
TO authenticated
USING (
  store_id IS NOT NULL
  AND (
    public.is_manager_of(store_id)
    OR public.is_owner_of(store_id)
    OR public.user_has_role(ARRAY['admin_mx', 'master', 'consultant'])
  )
);

DROP POLICY IF EXISTS seller_product_categories_internal_write ON public.seller_product_categories;
CREATE POLICY seller_product_categories_internal_write
ON public.seller_product_categories
FOR ALL
TO authenticated
USING (public.user_has_role(ARRAY['admin_mx', 'master', 'consultant']))
WITH CHECK (public.user_has_role(ARRAY['admin_mx', 'master', 'consultant']));

COMMIT;
