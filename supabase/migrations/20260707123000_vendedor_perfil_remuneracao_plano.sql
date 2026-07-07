-- Link seller profile to the compensation plan configured by owner/manager.
BEGIN;

ALTER TABLE public.vendedor_perfil
  ADD COLUMN IF NOT EXISTS remuneracao_plano_id uuid
  REFERENCES public.remuneracao_planos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vendedor_perfil_remuneracao_plano
  ON public.vendedor_perfil(remuneracao_plano_id);

NOTIFY pgrst, 'reload schema';

COMMIT;

