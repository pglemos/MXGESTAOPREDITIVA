-- ============================================================================
-- Migration: 20260609170000_vendedor_perfil.sql
-- Epic: EPIC-MX-CRM-VENDEDOR — tela "Meu Perfil" do vendedor
-- ESCOPO: perfil editável do vendedor:
--   - Rotina/horário de trabalho (entrada, almoço, saída, dias) → alimenta a
--     "Rotina do Dia" na Central de Execução e o lembrete "Fechar o dia".
--   - Objetivos (curto/médio/longo prazo).
--   - Oportunidades de carreira (interesse, pretensão, cargos/cidades).
--   1 linha por vendedor (UNIQUE seller_user_id). RLS: dono edita; gestão lê.
--   Aditivo e reversível.
-- ============================================================================

BEGIN;

DO $$ BEGIN
  CREATE TYPE public.carreira_interesse AS ENUM ('nao', 'confidencial', 'disponivel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.vendedor_perfil (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id      uuid NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  loja_id             uuid REFERENCES public.lojas(id) ON DELETE SET NULL,
  -- Rotina / horário de trabalho
  hora_entrada        time,
  hora_almoco_inicio  time,
  hora_almoco_fim     time,
  hora_saida          time,
  dias_trabalho       text[] NOT NULL DEFAULT ARRAY['seg','ter','qua','qui','sex']::text[],
  fechar_dia_notificacao_ativa boolean NOT NULL DEFAULT true,
  fechar_dia_notificacao_hora time,
  -- Objetivos
  objetivo_curto      text,
  objetivo_medio      text,
  objetivo_longo      text,
  -- Carreira
  carreira_interesse  public.carreira_interesse NOT NULL DEFAULT 'nao',
  pretensao_min       numeric(12,2),
  pretensao_max       numeric(12,2),
  cargos_interesse    text,
  cidades_interesse   text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.vendedor_perfil IS 'Perfil editável do vendedor: rotina/horário, objetivos e carreira. Rotina alimenta a Central de Execução e o lembrete Fechar o dia.';
COMMENT ON COLUMN public.vendedor_perfil.fechar_dia_notificacao_ativa IS 'Indica se o vendedor quer receber lembrete operacional para Fechar o dia.';
COMMENT ON COLUMN public.vendedor_perfil.fechar_dia_notificacao_hora IS 'Horário local preferido para o lembrete Fechar o dia; quando vazio, usa hora_saida.';

CREATE INDEX IF NOT EXISTS idx_vendedor_perfil_loja ON public.vendedor_perfil(loja_id);

DROP TRIGGER IF EXISTS trg_vendedor_perfil_updated_at ON public.vendedor_perfil;
CREATE TRIGGER trg_vendedor_perfil_updated_at BEFORE UPDATE ON public.vendedor_perfil
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

ALTER TABLE public.vendedor_perfil ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vendedor_perfil_seller_rw ON public.vendedor_perfil;
CREATE POLICY vendedor_perfil_seller_rw ON public.vendedor_perfil FOR ALL TO authenticated
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());

DROP POLICY IF EXISTS vendedor_perfil_store_read ON public.vendedor_perfil;
CREATE POLICY vendedor_perfil_store_read ON public.vendedor_perfil FOR SELECT TO authenticated
  USING (
    (loja_id IS NOT NULL AND (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id)))
    OR public.user_has_role(ARRAY['admin_mx','master','consultant'])
  );

-- Recarrega o schema cache do PostgREST para expor a nova tabela imediatamente
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================================
-- DOWN
-- ============================================================================
-- BEGIN;
--   DROP TABLE IF EXISTS public.vendedor_perfil;
--   DROP TYPE IF EXISTS public.carreira_interesse;
-- COMMIT;
