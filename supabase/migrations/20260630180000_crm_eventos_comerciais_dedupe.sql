-- ============================================================================
-- Migration: 20260630180000_crm_eventos_comerciais_dedupe.sql
-- Epic:      EPIC-MX-CRM-VENDEDOR — Base Única (porte de specs Base44)
--
-- ESCOPO:
--   1. telefone_normalizado em clientes (dígitos apenas) + índice de apoio
--      para dedupe por telefone no createCliente (app-level; sem UNIQUE
--      hard-constraint pois não há garantia de ausência de duplicatas
--      históricas em produção — dedupe fica na aplicação).
--   2. Tabela eventos_comerciais: histórico versionado de fatos comerciais
--      (oportunidade_registrada, cliente_qualificado, agendamento_criado,
--      atendimento_comercial_realizado, venda_realizada, etc.), fonte para
--      o Funil de Vendas e para auditoria de coerência venda/atendimento.
--   Aditivo e reversível (bloco DOWN comentado ao final).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. telefone_normalizado em clientes
-- ----------------------------------------------------------------------------
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS telefone_normalizado text
  GENERATED ALWAYS AS (NULLIF(regexp_replace(coalesce(telefone, ''), '\D', '', 'g'), '')) STORED;

CREATE INDEX IF NOT EXISTS idx_clientes_seller_telefone_normalizado
  ON public.clientes(seller_user_id, telefone_normalizado)
  WHERE telefone_normalizado IS NOT NULL;

COMMENT ON COLUMN public.clientes.telefone_normalizado IS
  'Telefone somente dígitos, gerado automaticamente. Usado para dedupe de cliente por vendedor antes de criar novo registro.';

-- ----------------------------------------------------------------------------
-- 2. eventos_comerciais
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.crm_evento_tipo AS ENUM (
    'oportunidade_registrada',
    'cliente_qualificado',
    'agendamento_criado',
    'atendimento_comercial_realizado',
    'venda_realizada',
    'proposta_enviada',
    'retorno_realizado',
    'entrega_realizada',
    'garantia_registrada',
    'pos_venda_realizado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_evento_modalidade AS ENUM ('visita_loja', 'atendimento_externo', 'videochamada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.eventos_comerciais (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  agendamento_id  uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  loja_id         uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_user_id  uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo_evento     public.crm_evento_tipo NOT NULL,
  canal           public.crm_canal,
  modalidade      public.crm_evento_modalidade,
  data_evento     timestamptz NOT NULL DEFAULT now(),
  origem_modulo   text NOT NULL DEFAULT 'crm',
  observacao      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.eventos_comerciais IS
  'Histórico versionado de fatos comerciais reais (base para Funil de Vendas e auditoria de coerência venda/atendimento). Nunca editado após criado.';

CREATE INDEX IF NOT EXISTS idx_eventos_comerciais_seller_tipo_data
  ON public.eventos_comerciais(seller_user_id, tipo_evento, data_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_comerciais_cliente
  ON public.eventos_comerciais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_eventos_comerciais_oportunidade
  ON public.eventos_comerciais(oportunidade_id);
CREATE INDEX IF NOT EXISTS idx_eventos_comerciais_loja_canal
  ON public.eventos_comerciais(loja_id, canal, tipo_evento);

ALTER TABLE public.eventos_comerciais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS eventos_comerciais_seller_rw ON public.eventos_comerciais;
CREATE POLICY eventos_comerciais_seller_rw ON public.eventos_comerciais FOR ALL TO authenticated
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());

DROP POLICY IF EXISTS eventos_comerciais_store_read ON public.eventos_comerciais;
CREATE POLICY eventos_comerciais_store_read ON public.eventos_comerciais FOR SELECT TO authenticated
  USING (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id) OR public.user_has_role(ARRAY['admin_mx','master','consultant']));

COMMIT;

-- ============================================================================
-- DOWN (reversão manual)
-- ============================================================================
-- BEGIN;
--   DROP TABLE IF EXISTS public.eventos_comerciais;
--   DROP TYPE IF EXISTS public.crm_evento_modalidade;
--   DROP TYPE IF EXISTS public.crm_evento_tipo;
--   DROP INDEX IF EXISTS public.idx_clientes_seller_telefone_normalizado;
--   ALTER TABLE public.clientes DROP COLUMN IF EXISTS telefone_normalizado;
-- COMMIT;
