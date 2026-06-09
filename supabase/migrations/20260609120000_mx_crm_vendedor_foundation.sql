-- ============================================================================
-- Migration: 20260609120000_mx_crm_vendedor_foundation.sql
-- Epic:      EPIC-MX-CRM-VENDEDOR (CRM do Vendedor — telas Carteira/Funil/Central)
-- Fonte:     docs/qa-mockups-vs-sistema-vendedor.md + design 2026-06-09
--
-- ESCOPO: fundação de dados do CRM operado MANUALMENTE pelo vendedor.
--   Modelo: cliente 1—N oportunidades; agendamentos e atendimentos por cliente.
--   Habilita: Fechamento (cadastro de cliente), Carteira de Clientes, Funil de
--   Vendas do vendedor, Central de Execução, Leads e Relatórios.
--   - Escopo por vendedor: RLS = dono das próprias linhas (seller_user_id);
--     gerente/dono da loja leem; admin_mx/master leem.
--   - FKs canônicas: public.lojas(id), public.usuarios(id) (pós-rename 2026-04-30).
--   - Etapas do funil: 6 do mockup + 'perdido' (estado terminal de perda).
--   - Aditivo e reversível (bloco DOWN comentado ao final).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. ENUMs
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.crm_canal AS ENUM ('carteira', 'internet', 'showroom', 'porta');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_cliente_status AS ENUM ('oportunidade', 'ativo', 'pos_venda', 'aguardando_contato', 'inativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_relacionamento AS ENUM ('excelente', 'bom', 'neutro', 'ruim', 'critico');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_etapa_funil AS ENUM ('prospeccao', 'qualificacao', 'apresentacao', 'negociacao', 'fechamento', 'ganho', 'perdido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_financiamento AS ENUM ('aprovado', 'reprovado', 'nao_aplica', 'pendente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_agendamento_tipo AS ENUM ('visita', 'retorno', 'test_drive', 'entrega', 'negociacao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_agendamento_status AS ENUM ('confirmado', 'aguardando', 'compareceu', 'nao_compareceu');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- Helper: trigger de updated_at (idempotente, escopo CRM)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 1. clientes — carteira do vendedor (a pessoa/lead)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id         uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_user_id  uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nome            text NOT NULL,
  telefone        text,
  empresa         text,                                   -- razão/loja do cliente (mockup carteira)
  canal_origem    public.crm_canal,
  status          public.crm_cliente_status NOT NULL DEFAULT 'aguardando_contato',
  relacionamento  public.crm_relacionamento NOT NULL DEFAULT 'neutro',
  ultima_interacao date,
  proxima_acao    text,
  proxima_acao_em date,
  potencial_negocio numeric(12,2) NOT NULL DEFAULT 0,     -- potencial agregado (mockup carteira)
  observacoes     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.clientes IS 'Carteira de clientes/leads do vendedor (cadastro manual). Escopo por seller_user_id.';

CREATE INDEX IF NOT EXISTS idx_clientes_seller        ON public.clientes(seller_user_id, status);
CREATE INDEX IF NOT EXISTS idx_clientes_loja          ON public.clientes(loja_id);
CREATE INDEX IF NOT EXISTS idx_clientes_proxima_acao  ON public.clientes(seller_user_id, proxima_acao_em);

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON public.clientes;
CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 2. oportunidades — negociações por cliente (etapas do funil)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.oportunidades (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id        uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  loja_id           uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_user_id    uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  veiculo_interesse text,
  valor_negociado   numeric(12,2) NOT NULL DEFAULT 0,
  etapa             public.crm_etapa_funil NOT NULL DEFAULT 'prospeccao',
  canal             public.crm_canal,
  sinal             numeric(12,2) NOT NULL DEFAULT 0,
  financiamento     public.crm_financiamento NOT NULL DEFAULT 'nao_aplica',
  carro_avaliado    boolean NOT NULL DEFAULT false,
  motivo_perda      text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  closed_at         timestamptz
);
COMMENT ON TABLE public.oportunidades IS 'Negociações/oportunidades por cliente. etapa = funil (6 do mockup + perdido).';

CREATE INDEX IF NOT EXISTS idx_oportunidades_seller   ON public.oportunidades(seller_user_id, etapa);
CREATE INDEX IF NOT EXISTS idx_oportunidades_cliente  ON public.oportunidades(cliente_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_loja     ON public.oportunidades(loja_id, etapa);

DROP TRIGGER IF EXISTS trg_oportunidades_updated_at ON public.oportunidades;
CREATE TRIGGER trg_oportunidades_updated_at BEFORE UPDATE ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 3. agendamentos — agenda do dia por cliente (Central de Execução)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
  oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  loja_id         uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_user_id  uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  data_hora       timestamptz NOT NULL,
  canal           public.crm_canal,
  tipo            public.crm_agendamento_tipo NOT NULL DEFAULT 'visita',
  status          public.crm_agendamento_status NOT NULL DEFAULT 'aguardando',
  proxima_acao    text,
  observacoes     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.agendamentos IS 'Agendamentos do vendedor por cliente/oportunidade. Base da Central de Execução.';

CREATE INDEX IF NOT EXISTS idx_agendamentos_seller_data ON public.agendamentos(seller_user_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente     ON public.agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_loja        ON public.agendamentos(loja_id, data_hora);

DROP TRIGGER IF EXISTS trg_agendamentos_updated_at ON public.agendamentos;
CREATE TRIGGER trg_agendamentos_updated_at BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 4. atendimentos — registro de atendimento por canal (Fechamento/Atividades)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atendimentos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  loja_id         uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  seller_user_id  uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  data            date NOT NULL DEFAULT CURRENT_DATE,
  canal           public.crm_canal NOT NULL,
  observacoes     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.atendimentos IS 'Atendimentos por canal (showroom/carteira/internet). Alimenta contadores do Fechamento e Atividades Hoje.';

CREATE INDEX IF NOT EXISTS idx_atendimentos_seller_data ON public.atendimentos(seller_user_id, data);
CREATE INDEX IF NOT EXISTS idx_atendimentos_loja_data   ON public.atendimentos(loja_id, data);

-- ----------------------------------------------------------------------------
-- 5. RLS — vendedor é dono das próprias linhas; gestão da loja lê; admin lê
-- ----------------------------------------------------------------------------
ALTER TABLE public.clientes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos  ENABLE ROW LEVEL SECURITY;

-- clientes
DROP POLICY IF EXISTS clientes_seller_rw ON public.clientes;
CREATE POLICY clientes_seller_rw ON public.clientes FOR ALL TO authenticated
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());
DROP POLICY IF EXISTS clientes_store_read ON public.clientes;
CREATE POLICY clientes_store_read ON public.clientes FOR SELECT TO authenticated
  USING (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id) OR public.user_has_role(ARRAY['admin_mx','master','consultant']));

-- oportunidades
DROP POLICY IF EXISTS oportunidades_seller_rw ON public.oportunidades;
CREATE POLICY oportunidades_seller_rw ON public.oportunidades FOR ALL TO authenticated
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());
DROP POLICY IF EXISTS oportunidades_store_read ON public.oportunidades;
CREATE POLICY oportunidades_store_read ON public.oportunidades FOR SELECT TO authenticated
  USING (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id) OR public.user_has_role(ARRAY['admin_mx','master','consultant']));

-- agendamentos
DROP POLICY IF EXISTS agendamentos_seller_rw ON public.agendamentos;
CREATE POLICY agendamentos_seller_rw ON public.agendamentos FOR ALL TO authenticated
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());
DROP POLICY IF EXISTS agendamentos_store_read ON public.agendamentos;
CREATE POLICY agendamentos_store_read ON public.agendamentos FOR SELECT TO authenticated
  USING (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id) OR public.user_has_role(ARRAY['admin_mx','master','consultant']));

-- atendimentos
DROP POLICY IF EXISTS atendimentos_seller_rw ON public.atendimentos;
CREATE POLICY atendimentos_seller_rw ON public.atendimentos FOR ALL TO authenticated
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());
DROP POLICY IF EXISTS atendimentos_store_read ON public.atendimentos;
CREATE POLICY atendimentos_store_read ON public.atendimentos FOR SELECT TO authenticated
  USING (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id) OR public.user_has_role(ARRAY['admin_mx','master','consultant']));

COMMIT;

-- ============================================================================
-- DOWN (reversão manual)
-- ============================================================================
-- BEGIN;
--   DROP TABLE IF EXISTS public.atendimentos;
--   DROP TABLE IF EXISTS public.agendamentos;
--   DROP TABLE IF EXISTS public.oportunidades;
--   DROP TABLE IF EXISTS public.clientes;
--   DROP FUNCTION IF EXISTS public.crm_touch_updated_at();
--   DROP TYPE IF EXISTS public.crm_agendamento_status;
--   DROP TYPE IF EXISTS public.crm_agendamento_tipo;
--   DROP TYPE IF EXISTS public.crm_financiamento;
--   DROP TYPE IF EXISTS public.crm_etapa_funil;
--   DROP TYPE IF EXISTS public.crm_relacionamento;
--   DROP TYPE IF EXISTS public.crm_cliente_status;
--   DROP TYPE IF EXISTS public.crm_canal;
-- COMMIT;
