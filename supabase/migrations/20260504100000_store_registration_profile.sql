-- Story OPS-20260504 - Store profile fields and public pre-registration intake.

ALTER TABLE public.lojas
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS partners jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.lojas
  DROP CONSTRAINT IF EXISTS lojas_partners_array_check;

ALTER TABLE public.lojas
  ADD CONSTRAINT lojas_partners_array_check
  CHECK (jsonb_typeof(partners) = 'array');

COMMENT ON COLUMN public.lojas.legal_name IS 'Razao social cadastral da loja.';
COMMENT ON COLUMN public.lojas.cnpj IS 'CNPJ cadastral da loja.';
COMMENT ON COLUMN public.lojas.address IS 'Endereco completo cadastral da loja.';
COMMENT ON COLUMN public.lojas.partners IS 'Lista JSON de socios da loja: name, document, phone e email quando disponiveis.';

CREATE TABLE IF NOT EXISTS public.pre_cadastros_loja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  store_name_snapshot text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL CHECK (role IN ('dono', 'gerente', 'vendedor')),
  segment text NOT NULL,
  store_tenure text NOT NULL,
  market_experience text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'synced', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  reviewed_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS pre_cadastros_loja_store_status_idx
  ON public.pre_cadastros_loja(store_id, status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS pre_cadastros_loja_email_idx
  ON public.pre_cadastros_loja(lower(email));

ALTER TABLE public.pre_cadastros_loja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pre_cadastros_loja_select_scoped ON public.pre_cadastros_loja;
CREATE POLICY pre_cadastros_loja_select_scoped
  ON public.pre_cadastros_loja
  FOR SELECT
  TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
  );

DROP POLICY IF EXISTS pre_cadastros_loja_update_scoped ON public.pre_cadastros_loja;
CREATE POLICY pre_cadastros_loja_update_scoped
  ON public.pre_cadastros_loja
  FOR UPDATE
  TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
  )
  WITH CHECK (
    public.eh_area_interna_mx()
    OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
  );

GRANT SELECT, UPDATE ON public.pre_cadastros_loja TO authenticated;

COMMENT ON TABLE public.pre_cadastros_loja IS 'Pré-cadastros públicos enviados pelo link específico de cada loja antes da sincronização com usuários/vínculos.';
