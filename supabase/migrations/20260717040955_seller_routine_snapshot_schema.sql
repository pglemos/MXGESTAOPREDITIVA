-- Migration registrada no Supabase de produção como seller_routine_snapshot_schema.
-- Mantém GitHub e ledger remoto reproduzíveis.

BEGIN;

ALTER TABLE public.prospecting_schedule
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS seller_user_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE;

ALTER TABLE public.seller_routine_snapshots
  ADD COLUMN IF NOT EXISTS score_denominator numeric(6,2),
  ADD COLUMN IF NOT EXISTS source_hash text;

CREATE INDEX IF NOT EXISTS idx_prospecting_schedule_store_seller
  ON public.prospecting_schedule(store_id,seller_user_id,dia_semana,semana_mes)
  WHERE ativo=true;
CREATE INDEX IF NOT EXISTS idx_seller_routine_snapshots_source_hash
  ON public.seller_routine_snapshots(seller_user_id,reference_date,source_hash);

CREATE TABLE IF NOT EXISTS public.seller_day_eligibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  reference_date date NOT NULL,
  version integer NOT NULL CHECK (version>=1),
  is_eligible boolean NOT NULL,
  reason text NOT NULL,
  source text NOT NULL DEFAULT 'operational',
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,seller_user_id,reference_date,version)
);

CREATE TABLE IF NOT EXISTS public.seller_routine_block_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  reference_date date NOT NULL,
  block_key text NOT NULL CHECK (block_key IN ('acesso','pendencias','plano_ataque','prospeccao','atualizacao','fechamento')),
  version integer NOT NULL CHECK (version>=1),
  diagnostic_status text NOT NULL CHECK (diagnostic_status IN ('normal','zero_legitimo','sem_base','sem_planejamento','erro_geracao','nao_aplicavel')),
  reason text,
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id,seller_user_id,reference_date,block_key,version)
);

CREATE INDEX IF NOT EXISTS idx_seller_day_eligibility_lookup
  ON public.seller_day_eligibility(store_id,seller_user_id,reference_date,version DESC);
CREATE INDEX IF NOT EXISTS idx_seller_routine_diagnostics_lookup
  ON public.seller_routine_block_diagnostics(store_id,seller_user_id,reference_date,block_key,version DESC);

ALTER TABLE public.seller_day_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_routine_block_diagnostics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seller_day_eligibility_select ON public.seller_day_eligibility;
CREATE POLICY seller_day_eligibility_select ON public.seller_day_eligibility
FOR SELECT TO authenticated USING (
  seller_user_id=(SELECT auth.uid()) OR public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id) OR public.is_owner_of(store_id)
);
DROP POLICY IF EXISTS seller_day_eligibility_insert ON public.seller_day_eligibility;
CREATE POLICY seller_day_eligibility_insert ON public.seller_day_eligibility
FOR INSERT TO authenticated WITH CHECK (
  public.eh_administrador_mx((SELECT auth.uid())) OR public.is_manager_of(store_id) OR public.is_owner_of(store_id)
);

DROP POLICY IF EXISTS seller_routine_diagnostics_select ON public.seller_routine_block_diagnostics;
CREATE POLICY seller_routine_diagnostics_select ON public.seller_routine_block_diagnostics
FOR SELECT TO authenticated USING (
  seller_user_id=(SELECT auth.uid()) OR public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id) OR public.is_owner_of(store_id)
);
DROP POLICY IF EXISTS seller_routine_diagnostics_insert ON public.seller_routine_block_diagnostics;
CREATE POLICY seller_routine_diagnostics_insert ON public.seller_routine_block_diagnostics
FOR INSERT TO authenticated WITH CHECK (
  public.eh_administrador_mx((SELECT auth.uid())) OR public.is_manager_of(store_id) OR public.is_owner_of(store_id)
);

COMMIT;
