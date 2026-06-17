-- MX Vendedor - Catalogo versionado de acoes de feedback
-- PRD EV-6.4: gerente seleciona acao padronizada e aciona o fluxo de rotina
-- ja consumido por devolutiva_acoes / Central de Execucao.

CREATE TABLE IF NOT EXISTS public.feedback_action_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_version integer NOT NULL,
  action_key text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  action_template text NOT NULL,
  suggested_time time NOT NULL DEFAULT '09:00'::time,
  flow_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (catalog_version, action_key),
  CONSTRAINT feedback_action_catalog_key_not_blank CHECK (btrim(action_key) <> ''),
  CONSTRAINT feedback_action_catalog_template_not_blank CHECK (btrim(action_template) <> '')
);

COMMENT ON TABLE public.feedback_action_catalog IS
  'Catalogo versionado de acoes selecionaveis em feedbacks; cada item preenche uma acao concreta para devolutiva_acoes.';
COMMENT ON COLUMN public.feedback_action_catalog.catalog_version IS
  'Versao do catalogo de acoes; permite evoluir fluxos sem reescrever historico.';
COMMENT ON COLUMN public.feedback_action_catalog.flow_metadata IS
  'Metadados do fluxo automatico: recorrencia, obrigatoriedade no fechamento e tom do alerta na Central.';

ALTER TABLE public.feedback_action_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedback_action_catalog_select_active ON public.feedback_action_catalog;
CREATE POLICY feedback_action_catalog_select_active
  ON public.feedback_action_catalog
  FOR SELECT
  TO authenticated
  USING (active = true);

INSERT INTO public.feedback_action_catalog (
  catalog_version,
  action_key,
  title,
  description,
  action_template,
  suggested_time,
  flow_metadata
)
VALUES
  (
    1,
    'retornos_qualificados_diarios',
    '3 retornos qualificados por dia',
    'Rotina diaria para recuperar clientes parados na cadencia.',
    '09:00 - {{sellerName}} deve executar 3 retornos qualificados por dia na semana {{weekReference}} e registrar o resultado no CRM.',
    '09:00'::time,
    '{"recorrencia":"diaria","obrigatoriaFechamento":true,"centralAlertTone":"error"}'::jsonb
  ),
  (
    1,
    'confirmacao_visita',
    'Confirmar visitas do dia seguinte',
    'Fluxo para reduzir furo entre agendamento e visita.',
    '08:30 - {{sellerName}} deve confirmar todas as visitas do dia seguinte na semana {{weekReference}} e reagendar quem nao responder.',
    '08:30'::time,
    '{"recorrencia":"diaria","obrigatoriaFechamento":true,"centralAlertTone":"error"}'::jsonb
  ),
  (
    1,
    'argumentacao_financiamento',
    'Treinar argumentacao de financiamento',
    'Fluxo para corrigir perda por proposta, taxa ou financiamento.',
    '10:00 - {{sellerName}} deve revisar 2 casos de financiamento da semana {{weekReference}} e praticar a argumentacao antes do proximo contato.',
    '10:00'::time,
    '{"recorrencia":"diaria","obrigatoriaFechamento":true,"centralAlertTone":"error"}'::jsonb
  ),
  (
    1,
    'retomar_clientes_parados',
    'Retomar clientes parados',
    'Fluxo para clientes sem avanco na etapa atual.',
    '11:00 - {{sellerName}} deve retomar clientes parados na semana {{weekReference}}, atualizar etapa e marcar proxima acao no CRM.',
    '11:00'::time,
    '{"recorrencia":"diaria","obrigatoriaFechamento":true,"centralAlertTone":"error"}'::jsonb
  )
ON CONFLICT (catalog_version, action_key)
DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  action_template = EXCLUDED.action_template,
  suggested_time = EXCLUDED.suggested_time,
  flow_metadata = EXCLUDED.flow_metadata,
  active = true,
  updated_at = now();

-- Rollback manual:
-- DELETE FROM public.feedback_action_catalog WHERE catalog_version = 1;
-- DROP POLICY IF EXISTS feedback_action_catalog_select_active ON public.feedback_action_catalog;
-- DROP TABLE IF EXISTS public.feedback_action_catalog;
