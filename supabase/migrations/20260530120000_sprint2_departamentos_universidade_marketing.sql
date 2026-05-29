-- ============================================================================
-- Migration: 20260530120000_sprint2_departamentos_universidade_marketing.sql
-- Sprint:    2
-- Stories:   S2-T1 a S2-T5
-- PRD:       docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md §4.9, §4.11, §4.12
-- Fonte:     .docx §250–§360 + ata 2026-05-22 (deltas N4, N5, N11, N12, N14, N15)
-- Owner:     @aiox-master (Orion)
--
-- ESCOPO:
--   • Departamentos: checklist, biblioteca, fluxograma, kpi snapshot, RPC dashboard.
--   • Marketing: carteira_empresa, posicionamento_empresa, agenda_estrategica_marketing.
--   • Universidade MX: trilhas, aulas, certificacoes_emitidas.
--   • Cultura: cultura_resultado_registros.
--   • RH: indice_felicidade_respostas.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Departamentos — checklist, biblioteca, fluxograma, kpi snapshot
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departamento_checklist (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento_id uuid NOT NULL REFERENCES public.departamentos_mx(id) ON DELETE CASCADE,
  ordem           integer NOT NULL DEFAULT 0,
  titulo          text NOT NULL CHECK (length(trim(titulo)) > 0),
  descricao       text,
  obrigatorio     boolean NOT NULL DEFAULT true,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dep_checklist ON public.departamento_checklist(departamento_id, ordem);

CREATE TABLE IF NOT EXISTS public.departamento_biblioteca (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento_id uuid NOT NULL REFERENCES public.departamentos_mx(id) ON DELETE CASCADE,
  ordem           integer NOT NULL DEFAULT 0,
  titulo          text NOT NULL CHECK (length(trim(titulo)) > 0),
  categoria       text NOT NULL CHECK (categoria = ANY (ARRAY['regra','boa_pratica','exemplo','referencia'])),
  conteudo_md     text NOT NULL,
  url_externo     text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dep_biblioteca ON public.departamento_biblioteca(departamento_id, ordem);

CREATE TABLE IF NOT EXISTS public.departamento_fluxograma (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento_id uuid NOT NULL REFERENCES public.departamentos_mx(id) ON DELETE CASCADE,
  passo           integer NOT NULL,
  titulo          text NOT NULL CHECK (length(trim(titulo)) > 0),
  descricao       text,
  responsavel_papel text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (departamento_id, passo)
);

CREATE TABLE IF NOT EXISTS public.departamento_kpi_snapshot (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departamento_id uuid NOT NULL REFERENCES public.departamentos_mx(id) ON DELETE CASCADE,
  period          date NOT NULL,
  indicador_code  text NOT NULL,
  meta            numeric,
  realizado       numeric,
  ano_anterior    numeric,
  unidade         text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (departamento_id, period, indicador_code)
);
CREATE INDEX IF NOT EXISTS idx_dep_kpi_period
  ON public.departamento_kpi_snapshot(departamento_id, period DESC);

ALTER TABLE public.departamento_checklist        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departamento_biblioteca       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departamento_fluxograma       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departamento_kpi_snapshot     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dep_read_authenticated ON public.departamento_checklist;
CREATE POLICY dep_read_authenticated ON public.departamento_checklist
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS dep_read_authenticated ON public.departamento_biblioteca;
CREATE POLICY dep_read_authenticated ON public.departamento_biblioteca
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS dep_read_authenticated ON public.departamento_fluxograma;
CREATE POLICY dep_read_authenticated ON public.departamento_fluxograma
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS dep_read_authenticated ON public.departamento_kpi_snapshot;
CREATE POLICY dep_read_authenticated ON public.departamento_kpi_snapshot
  FOR SELECT TO authenticated USING (true);

-- RPC consolidar_dashboard_departamento
CREATE OR REPLACE FUNCTION public.consolidar_dashboard_departamento(
  p_loja_id uuid,
  p_code    text,
  p_period  date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dep   public.departamentos_mx;
  v_kpis  jsonb;
  v_check jsonb;
  v_biblio jsonb;
  v_fluxo jsonb;
BEGIN
  SELECT * INTO v_dep
  FROM public.departamentos_mx
  WHERE loja_id = p_loja_id AND code = p_code AND status = 'ativo'
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'indicador_code', indicador_code,
    'meta', meta,
    'realizado', realizado,
    'ano_anterior', ano_anterior,
    'unidade', unidade
  ) ORDER BY indicador_code), '[]'::jsonb)
  INTO v_kpis
  FROM public.departamento_kpi_snapshot
  WHERE departamento_id = v_dep.id AND period <= p_period
  ORDER BY period DESC;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id, 'ordem', ordem, 'titulo', titulo,
    'descricao', descricao, 'obrigatorio', obrigatorio
  ) ORDER BY ordem), '[]'::jsonb)
  INTO v_check
  FROM public.departamento_checklist
  WHERE departamento_id = v_dep.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id, 'ordem', ordem, 'titulo', titulo,
    'categoria', categoria, 'url_externo', url_externo
  ) ORDER BY ordem), '[]'::jsonb)
  INTO v_biblio
  FROM public.departamento_biblioteca
  WHERE departamento_id = v_dep.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'passo', passo, 'titulo', titulo,
    'descricao', descricao, 'responsavel_papel', responsavel_papel
  ) ORDER BY passo), '[]'::jsonb)
  INTO v_fluxo
  FROM public.departamento_fluxograma
  WHERE departamento_id = v_dep.id;

  RETURN jsonb_build_object(
    'found', true,
    'departamento', jsonb_build_object(
      'id', v_dep.id, 'code', v_dep.code, 'name', v_dep.name,
      'status', v_dep.status, 'responsible_id', v_dep.responsible_id
    ),
    'kpis', v_kpis,
    'checklist', v_check,
    'biblioteca', v_biblio,
    'fluxograma', v_fluxo,
    'period', p_period
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.consolidar_dashboard_departamento(uuid, text, date) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. Marketing — Carteira da Empresa (N5)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carteira_empresa (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id         uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  nome_cliente    text NOT NULL CHECK (length(trim(nome_cliente)) > 0),
  contato         text,
  canal           text CHECK (canal = ANY (ARRAY['whatsapp','email','telefone','outro'])),
  score           smallint CHECK (score IS NULL OR (score BETWEEN 0 AND 100)),
  fluxo_estado    text NOT NULL DEFAULT 'novo' CHECK (
    fluxo_estado = ANY (ARRAY['novo','contato_inicial','aquecimento','negociacao','convertido','perdido'])
  ),
  ultimo_contato  date,
  proximo_contato date,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_carteira_loja ON public.carteira_empresa(loja_id, fluxo_estado);
CREATE INDEX IF NOT EXISTS idx_carteira_score ON public.carteira_empresa(loja_id, score DESC NULLS LAST);

-- Posicionamento empresarial (N15)
CREATE TABLE IF NOT EXISTS public.posicionamento_empresa (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id         uuid NOT NULL UNIQUE REFERENCES public.lojas(id) ON DELETE CASCADE,
  missao          text,
  visao           text,
  valores         text,
  posicionamento  text,
  publico_alvo    text,
  diferenciais    text,
  updated_by      uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Agenda Estratégica Mensal Marketing (N14)
CREATE TABLE IF NOT EXISTS public.agenda_estrategica_marketing (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id         uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  mes_referencia  date NOT NULL,
  acao            text NOT NULL CHECK (length(trim(acao)) > 0),
  canais          text[] NOT NULL DEFAULT '{}'::text[],
  responsavel_id  uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  data_alvo       date,
  status          text NOT NULL DEFAULT 'planejado' CHECK (
    status = ANY (ARRAY['planejado','em_execucao','concluido','cancelado'])
  ),
  observacoes     text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agenda_mkt_loja_mes
  ON public.agenda_estrategica_marketing(loja_id, mes_referencia DESC);

ALTER TABLE public.carteira_empresa              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posicionamento_empresa        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_estrategica_marketing  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_read_auth ON public.carteira_empresa;
CREATE POLICY mkt_read_auth ON public.carteira_empresa
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS mkt_read_auth ON public.posicionamento_empresa;
CREATE POLICY mkt_read_auth ON public.posicionamento_empresa
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS mkt_read_auth ON public.agenda_estrategica_marketing;
CREATE POLICY mkt_read_auth ON public.agenda_estrategica_marketing
  FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 3. Universidade MX
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.universidade_trilhas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          text NOT NULL UNIQUE,
  titulo          text NOT NULL CHECK (length(trim(titulo)) > 0),
  publico_alvo    text NOT NULL CHECK (publico_alvo = ANY (
    ARRAY['vendedor','gerente','dono','marketing','rh','operacoes','geral']
  )),
  descricao       text,
  duracao_horas   numeric,
  ativo           boolean NOT NULL DEFAULT true,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.universidade_aulas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id       uuid REFERENCES public.universidade_trilhas(id) ON DELETE CASCADE,
  ordem           integer NOT NULL DEFAULT 0,
  tipo            text NOT NULL CHECK (tipo = ANY (
    ARRAY['biblioteca','aula_gravada','aula_ao_vivo','quiz','desafio']
  )),
  titulo          text NOT NULL CHECK (length(trim(titulo)) > 0),
  conteudo_md     text,
  url_video       text,
  data_ao_vivo    timestamptz,
  ativo           boolean NOT NULL DEFAULT true,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_universidade_aulas_trilha
  ON public.universidade_aulas(trilha_id, ordem);

CREATE TABLE IF NOT EXISTS public.universidade_certificacoes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id       uuid NOT NULL REFERENCES public.universidade_trilhas(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  emitida_em      timestamptz NOT NULL DEFAULT now(),
  pontuacao       smallint CHECK (pontuacao IS NULL OR (pontuacao BETWEEN 0 AND 100)),
  certificado_url text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (trilha_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_universidade_cert_user
  ON public.universidade_certificacoes(user_id, emitida_em DESC);

ALTER TABLE public.universidade_trilhas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universidade_aulas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universidade_certificacoes   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS univ_read_auth ON public.universidade_trilhas;
CREATE POLICY univ_read_auth ON public.universidade_trilhas
  FOR SELECT TO authenticated USING (ativo = true);
DROP POLICY IF EXISTS univ_read_auth ON public.universidade_aulas;
CREATE POLICY univ_read_auth ON public.universidade_aulas
  FOR SELECT TO authenticated USING (ativo = true);
DROP POLICY IF EXISTS univ_cert_read_self ON public.universidade_certificacoes;
CREATE POLICY univ_cert_read_self ON public.universidade_certificacoes
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.user_has_role(ARRAY['master','director','consultant','admin_mx']));

-- ----------------------------------------------------------------------------
-- 4. Cultura de Resultado (N11)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cultura_resultado_registros (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id         uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  tipo            text NOT NULL CHECK (tipo = ANY (
    ARRAY['repescagem','campanha','reconhecimento','feed_cultural']
  )),
  titulo          text NOT NULL CHECK (length(trim(titulo)) > 0),
  mensagem        text,
  alvo_role       text,
  data_referencia date NOT NULL DEFAULT CURRENT_DATE,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cultura_loja
  ON public.cultura_resultado_registros(loja_id, data_referencia DESC);

ALTER TABLE public.cultura_resultado_registros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cultura_read_auth ON public.cultura_resultado_registros;
CREATE POLICY cultura_read_auth ON public.cultura_resultado_registros
  FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 5. Índice de Felicidade RH (N12)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.indice_felicidade_respostas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id         uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ciclo           text NOT NULL,  -- ex.: '2026-05'
  nota_clima      smallint NOT NULL CHECK (nota_clima BETWEEN 0 AND 10),
  nota_lideranca  smallint CHECK (nota_lideranca IS NULL OR nota_lideranca BETWEEN 0 AND 10),
  nota_carreira   smallint CHECK (nota_carreira  IS NULL OR nota_carreira  BETWEEN 0 AND 10),
  comentario      text,
  anonimato       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_felicidade_loja_ciclo
  ON public.indice_felicidade_respostas(loja_id, ciclo);

ALTER TABLE public.indice_felicidade_respostas ENABLE ROW LEVEL SECURITY;
-- Respostas anônimas só para gestão; user vê só as próprias
DROP POLICY IF EXISTS felicidade_read_self_or_admin ON public.indice_felicidade_respostas;
CREATE POLICY felicidade_read_self_or_admin ON public.indice_felicidade_respostas
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.user_has_role(ARRAY['master','director','consultant','admin_mx'])
  );

-- View agregada (sem expor usuarios)
CREATE OR REPLACE VIEW public.indice_felicidade_agregado AS
SELECT
  loja_id,
  ciclo,
  ROUND(AVG(nota_clima)::numeric, 2)     AS media_clima,
  ROUND(AVG(nota_lideranca)::numeric, 2) AS media_lideranca,
  ROUND(AVG(nota_carreira)::numeric, 2)  AS media_carreira,
  COUNT(*)                               AS total_respostas
FROM public.indice_felicidade_respostas
GROUP BY loja_id, ciclo;

GRANT SELECT ON public.indice_felicidade_agregado TO authenticated;

COMMIT;
