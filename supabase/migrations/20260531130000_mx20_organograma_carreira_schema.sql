-- ============================================================================
-- Migration: 20260531130000_mx20_organograma_carreira_schema.sql
-- Story:     MX-20.1 — Schema Organograma + Cargos/Carreira
-- Epic:      EPIC-MX-20 (Organograma + Plano de Carreira)
-- Fonte:     docs/roadmap/roadmap-fechamento-gap-mx-2026-05-28.md (delta N8)
--
-- ESCOPO: estrutura hierárquica (organograma) e trilha de carreira por cargo.
--   - organograma_nos: self-FK (parent_id) + guarda anti-ciclo via trigger.
--   - carreira_niveis: níveis e requisitos por cargo (complementa pdi_niveis_cargo
--     existente, que é genérico por nota; aqui é por cargo + próximo cargo).
--   - FKs para public.lojas(id) e public.usuarios(id) (não duplica Pessoas/MX-16).
--   - Aditivo e reversível (bloco DOWN ao final).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. organograma_nos — nós da estrutura hierárquica (por loja)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organograma_nos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id     uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  usuario_id  uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,  -- nullable: cargo pode estar vago
  cargo       text NOT NULL,
  parent_id   uuid REFERENCES public.organograma_nos(id) ON DELETE SET NULL,
  ordem       integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (parent_id IS NULL OR parent_id <> id)         -- impede auto-referência direta
);

COMMENT ON TABLE  public.organograma_nos IS 'MX-20.1: nós do organograma. Referencia usuarios/lojas existentes (não duplica MX-16).';
COMMENT ON COLUMN public.organograma_nos.usuario_id IS 'FK para Pessoas (MX-16); NULL quando o cargo está vago.';

CREATE INDEX IF NOT EXISTS idx_organograma_nos_loja   ON public.organograma_nos (loja_id);
CREATE INDEX IF NOT EXISTS idx_organograma_nos_parent ON public.organograma_nos (parent_id);

-- ----------------------------------------------------------------------------
-- 2. Guarda anti-ciclo — impede que um nó vire ancestral de si mesmo
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_organograma_no_cycle()
RETURNS trigger LANGUAGE plpgsql AS $fn$
DECLARE
  ancestor uuid := NEW.parent_id;
  guard    integer := 0;
BEGIN
  WHILE ancestor IS NOT NULL AND guard < 1000 LOOP
    IF ancestor = NEW.id THEN
      RAISE EXCEPTION 'Ciclo detectado no organograma: nó % não pode ser descendente de si mesmo', NEW.id;
    END IF;
    SELECT parent_id INTO ancestor FROM public.organograma_nos WHERE id = ancestor;
    guard := guard + 1;
  END LOOP;
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_organograma_no_cycle ON public.organograma_nos;
CREATE TRIGGER trg_organograma_no_cycle
  BEFORE INSERT OR UPDATE OF parent_id ON public.organograma_nos
  FOR EACH ROW EXECUTE FUNCTION public.tg_organograma_no_cycle();

-- ----------------------------------------------------------------------------
-- 3. carreira_niveis — trilha de carreira por cargo
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carreira_niveis (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo         text NOT NULL,
  nivel         integer NOT NULL CHECK (nivel >= 0),
  nome          text NOT NULL,
  requisitos    text,
  proximo_cargo text,                                   -- cargo destino na evolução (texto, sem tabela cargos)
  trilha_mx17   uuid,                                   -- vínculo opcional a trilha Universidade MX (degradação graciosa)
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cargo, nivel)
);

COMMENT ON TABLE  public.carreira_niveis IS 'MX-20.1: níveis e requisitos por cargo. Complementa pdi_niveis_cargo (genérico por nota).';
COMMENT ON COLUMN public.carreira_niveis.trilha_mx17 IS 'Vínculo opcional a trilha de Universidade MX (EPIC-MX-17); NULL = sem trilha.';

CREATE INDEX IF NOT EXISTS idx_carreira_niveis_cargo ON public.carreira_niveis (cargo);

-- ----------------------------------------------------------------------------
-- 4. RLS — organograma legível por autenticados; edição por master/director
-- ----------------------------------------------------------------------------
ALTER TABLE public.organograma_nos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carreira_niveis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organograma_read ON public.organograma_nos;
CREATE POLICY organograma_read
  ON public.organograma_nos
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS organograma_write ON public.organograma_nos;
CREATE POLICY organograma_write
  ON public.organograma_nos
  FOR ALL TO authenticated
  USING (public.user_has_role(ARRAY['master','director','admin_mx']))
  WITH CHECK (public.user_has_role(ARRAY['master','director','admin_mx']));

DROP POLICY IF EXISTS carreira_read ON public.carreira_niveis;
CREATE POLICY carreira_read
  ON public.carreira_niveis
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS carreira_write ON public.carreira_niveis;
CREATE POLICY carreira_write
  ON public.carreira_niveis
  FOR ALL TO authenticated
  USING (public.user_has_role(ARRAY['master','director','hr','admin_mx']))
  WITH CHECK (public.user_has_role(ARRAY['master','director','hr','admin_mx']));

COMMIT;

-- ============================================================================
-- DOWN (rollback manual):
--   BEGIN;
--   DROP POLICY IF EXISTS carreira_write    ON public.carreira_niveis;
--   DROP POLICY IF EXISTS carreira_read     ON public.carreira_niveis;
--   DROP POLICY IF EXISTS organograma_write ON public.organograma_nos;
--   DROP POLICY IF EXISTS organograma_read  ON public.organograma_nos;
--   DROP TRIGGER IF EXISTS trg_organograma_no_cycle ON public.organograma_nos;
--   DROP FUNCTION IF EXISTS public.tg_organograma_no_cycle();
--   DROP TABLE IF EXISTS public.carreira_niveis;
--   DROP TABLE IF EXISTS public.organograma_nos;
--   COMMIT;
-- ============================================================================
