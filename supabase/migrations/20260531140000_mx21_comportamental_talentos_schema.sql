-- ============================================================================
-- Migration: 20260531140000_mx21_comportamental_talentos_schema.sql
-- Story:     MX-21.1 — Schema Teste Comportamental + Banco de Talentos
-- Epic:      EPIC-MX-21 (Teste Comportamental + Banco de Talentos)
-- Fonte:     docs/roadmap/roadmap-fechamento-gap-mx-2026-05-28.md (delta N13)
--
-- ESCOPO: teste comportamental no onboarding + banco de talentos agregado.
--   - Resultado individual é SENSÍVEL: RLS restrita (RH/Dono) + o próprio usuário.
--   - Banco de talentos guarda PADRÃO AGREGADO (não expõe resultado individual).
--   - Vínculo com performance via usuario_id (cruzável com score_* / MX-07).
--   - FKs para public.usuarios(id) e public.lojas(id).
--   - Aditivo e reversível (bloco DOWN ao final).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. ENUMs
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.comportamental_status AS ENUM ('pendente', 'em_andamento', 'concluido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 1. comportamental_questoes — banco de questões do teste
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comportamental_questoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texto       text NOT NULL,
  dimensao    text NOT NULL,                            -- ex.: 'disciplina','colaboracao','resiliencia'
  ordem       integer NOT NULL DEFAULT 0,
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.comportamental_questoes IS 'MX-21.1: questões do teste comportamental (catálogo).';

-- ----------------------------------------------------------------------------
-- 2. comportamental_sessoes — uma aplicação de teste por colaborador
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comportamental_sessoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  loja_id       uuid REFERENCES public.lojas(id) ON DELETE SET NULL,
  status        public.comportamental_status NOT NULL DEFAULT 'pendente',
  iniciado_em   timestamptz,
  concluido_em  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comportamental_sessoes_usuario ON public.comportamental_sessoes (usuario_id);
COMMENT ON TABLE public.comportamental_sessoes IS 'MX-21.1: sessão de teste no onboarding (status pendente não bloqueia onboarding).';

-- ----------------------------------------------------------------------------
-- 3. comportamental_respostas — respostas individuais (SENSÍVEL)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comportamental_respostas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id     uuid NOT NULL REFERENCES public.comportamental_sessoes(id) ON DELETE CASCADE,
  questao_id    uuid NOT NULL REFERENCES public.comportamental_questoes(id) ON DELETE CASCADE,
  valor         integer NOT NULL CHECK (valor BETWEEN 1 AND 5),
  respondido_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sessao_id, questao_id)
);

-- ----------------------------------------------------------------------------
-- 4. comportamental_perfis — perfil resultante por colaborador (SENSÍVEL)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comportamental_perfis (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  sessao_id   uuid REFERENCES public.comportamental_sessoes(id) ON DELETE SET NULL,
  perfil      jsonb NOT NULL DEFAULT '{}'::jsonb,        -- pontuação por dimensão
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.comportamental_perfis IS 'MX-21.1: perfil comportamental por colaborador. Cruzável com score (MX-07) via usuario_id.';

-- ----------------------------------------------------------------------------
-- 5. banco_talentos — perfis vencedores AGREGADOS (não individual)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.banco_talentos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id          uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  cargo            text,
  perfil_agregado  jsonb NOT NULL DEFAULT '{}'::jsonb,   -- padrão dos high performers (agregado)
  descricao        text,
  baseado_em_score boolean NOT NULL DEFAULT true,
  amostra_n        integer NOT NULL DEFAULT 0 CHECK (amostra_n >= 0),
  created_at       timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.banco_talentos IS 'MX-21.1: perfil vencedor AGREGADO para contratação. Nunca expõe resultado individual.';

-- ----------------------------------------------------------------------------
-- 6. RLS — dado individual sensível; banco agregado para RH/Dono
-- ----------------------------------------------------------------------------
ALTER TABLE public.comportamental_questoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comportamental_sessoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comportamental_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comportamental_perfis    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_talentos           ENABLE ROW LEVEL SECURITY;

-- Questões: leitura para autenticados; escrita admin/hr
DROP POLICY IF EXISTS comp_questoes_read ON public.comportamental_questoes;
CREATE POLICY comp_questoes_read ON public.comportamental_questoes
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS comp_questoes_write ON public.comportamental_questoes;
CREATE POLICY comp_questoes_write ON public.comportamental_questoes
  FOR ALL TO authenticated
  USING (public.user_has_role(ARRAY['admin_mx','hr','master']))
  WITH CHECK (public.user_has_role(ARRAY['admin_mx','hr','master']));

-- Sessões: o próprio usuário OU rh/master/director
DROP POLICY IF EXISTS comp_sessoes_rw ON public.comportamental_sessoes;
CREATE POLICY comp_sessoes_rw ON public.comportamental_sessoes
  FOR ALL TO authenticated
  USING (usuario_id = auth.uid() OR public.user_has_role(ARRAY['master','director','hr','admin_mx']))
  WITH CHECK (usuario_id = auth.uid() OR public.user_has_role(ARRAY['master','director','hr','admin_mx']));

-- Respostas: via sessão do próprio usuário OU rh/master/director
DROP POLICY IF EXISTS comp_respostas_rw ON public.comportamental_respostas;
CREATE POLICY comp_respostas_rw ON public.comportamental_respostas
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.comportamental_sessoes s
    WHERE s.id = sessao_id
      AND (s.usuario_id = auth.uid() OR public.user_has_role(ARRAY['master','director','hr','admin_mx']))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.comportamental_sessoes s
    WHERE s.id = sessao_id
      AND (s.usuario_id = auth.uid() OR public.user_has_role(ARRAY['master','director','hr','admin_mx']))
  ));

-- Perfis individuais: o próprio usuário OU rh/master/director
DROP POLICY IF EXISTS comp_perfis_read ON public.comportamental_perfis;
CREATE POLICY comp_perfis_read ON public.comportamental_perfis
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR public.user_has_role(ARRAY['master','director','hr','admin_mx']));
DROP POLICY IF EXISTS comp_perfis_write ON public.comportamental_perfis;
CREATE POLICY comp_perfis_write ON public.comportamental_perfis
  FOR ALL TO authenticated
  USING (public.user_has_role(ARRAY['master','director','hr','admin_mx']))
  WITH CHECK (public.user_has_role(ARRAY['master','director','hr','admin_mx']));

-- Banco de talentos (agregado): somente RH/Dono
DROP POLICY IF EXISTS banco_talentos_rw ON public.banco_talentos;
CREATE POLICY banco_talentos_rw ON public.banco_talentos
  FOR ALL TO authenticated
  USING (public.user_has_role(ARRAY['master','director','hr','admin_mx']))
  WITH CHECK (public.user_has_role(ARRAY['master','director','hr','admin_mx']));

COMMIT;

-- ============================================================================
-- DOWN (rollback manual):
--   BEGIN;
--   DROP POLICY IF EXISTS banco_talentos_rw    ON public.banco_talentos;
--   DROP POLICY IF EXISTS comp_perfis_write    ON public.comportamental_perfis;
--   DROP POLICY IF EXISTS comp_perfis_read     ON public.comportamental_perfis;
--   DROP POLICY IF EXISTS comp_respostas_rw    ON public.comportamental_respostas;
--   DROP POLICY IF EXISTS comp_sessoes_rw      ON public.comportamental_sessoes;
--   DROP POLICY IF EXISTS comp_questoes_write  ON public.comportamental_questoes;
--   DROP POLICY IF EXISTS comp_questoes_read   ON public.comportamental_questoes;
--   DROP TABLE IF EXISTS public.banco_talentos;
--   DROP TABLE IF EXISTS public.comportamental_perfis;
--   DROP TABLE IF EXISTS public.comportamental_respostas;
--   DROP TABLE IF EXISTS public.comportamental_sessoes;
--   DROP TABLE IF EXISTS public.comportamental_questoes;
--   DROP TYPE  IF EXISTS public.comportamental_status;
--   COMMIT;
-- ============================================================================
