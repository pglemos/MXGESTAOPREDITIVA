CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.opcoes_agenda_consultoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'ativo',
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT opcoes_agenda_consultoria_kind_check
    CHECK (kind = ANY (ARRAY['visit_reason', 'target_audience'])),
  CONSTRAINT opcoes_agenda_consultoria_status_check
    CHECK (status = ANY (ARRAY['ativo', 'arquivado'])),
  CONSTRAINT opcoes_agenda_consultoria_label_not_blank
    CHECK (length(btrim(label)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS opcoes_agenda_consultoria_kind_label_uidx
  ON public.opcoes_agenda_consultoria (kind, lower(btrim(label)));

CREATE INDEX IF NOT EXISTS opcoes_agenda_consultoria_kind_status_order_idx
  ON public.opcoes_agenda_consultoria (kind, status, sort_order, label);

DROP TRIGGER IF EXISTS update_opcoes_agenda_consultoria_updated_at ON public.opcoes_agenda_consultoria;
CREATE TRIGGER update_opcoes_agenda_consultoria_updated_at
BEFORE UPDATE ON public.opcoes_agenda_consultoria
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

ALTER TABLE public.opcoes_agenda_consultoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS opcoes_agenda_consultoria_select ON public.opcoes_agenda_consultoria;
CREATE POLICY opcoes_agenda_consultoria_select
ON public.opcoes_agenda_consultoria
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS opcoes_agenda_consultoria_write_admin ON public.opcoes_agenda_consultoria;
CREATE POLICY opcoes_agenda_consultoria_write_admin
ON public.opcoes_agenda_consultoria
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

INSERT INTO public.opcoes_agenda_consultoria (kind, label, sort_order)
VALUES
  ('visit_reason', 'Onboarding', 10),
  ('visit_reason', 'Diagnóstico e Treinamento Método Vendedor Profissional - Fase 1', 20),
  ('visit_reason', 'Planejamento Estratégico, Metodologia de Vendas por Multicanal, Acompanhamento Diário de Vendas, Gestão á Vista e Treinamento MVP - Fase 2', 30),
  ('visit_reason', 'Rotina do Gerente e do Vendedor, Feedback Estruturado', 40),
  ('visit_reason', 'Cultura de Resultado e Treinamento MVP - Fase 3', 50),
  ('visit_reason', 'Plano de Desenvolvimento Individual (PDI)', 60),
  ('visit_reason', 'Posicionamento de Marketing, Estratégia de Conteúdo e Tráfego Pago', 70),
  ('visit_reason', 'Análise das Implementações e Plano de Ação Trimestral', 80),
  ('visit_reason', 'Acompanhamento', 90),
  ('visit_reason', 'Modelo de Negócio', 100),
  ('visit_reason', 'Planejamento Estratégico', 110),
  ('visit_reason', 'Maximização de Receitas', 120),
  ('visit_reason', 'Eficiência em Custos', 130),
  ('visit_reason', 'Treinamento Vendedores', 140),
  ('visit_reason', 'Resultados e Plano de Ação', 150),
  ('visit_reason', 'Treinamento Venda Aprovada (Financiamento)', 160),
  ('visit_reason', 'Visita 1: Diagnóstico e Treinamento Método Vendedor Profissional', 170),
  ('visit_reason', 'Visita 2: Planejamento Estratégico, Metodologia de Vendas por Multicanal, Acompanhamento Diário de Vendas, Gestão á Vista e Treinamento MVP', 180),
  ('visit_reason', 'Visita 3: Rotina do Gerente e do Vendedor, Feedback Estruturado', 190),
  ('visit_reason', 'Visita 4: Cultura de Resultado e Treinamento MVP', 200),
  ('visit_reason', 'Visita 5: Plano de Desenvolvimento Individual (PDI)', 210),
  ('visit_reason', 'Visita 6 Online: Posicionamento de Marketing, Estratégia de Conteúdo e Tráfego Pago', 220),
  ('visit_reason', 'Visita 7: Análise das Implementações e Plano de Ação Trimestral', 230),
  ('visit_reason', 'Agenda bloqueada', 240),
  ('visit_reason', 'Evento MX', 250),
  ('visit_reason', 'Gestão dos Indicadores', 260),
  ('visit_reason', 'Acompanhar financiamento (receita adicional)', 270),
  ('visit_reason', 'Agenda bloqueada (treinamento)', 280),
  ('visit_reason', 'Treinamento Vendedores / Rotina Gerente e vendedor', 290),
  ('visit_reason', 'Processo Seletivo Gerente Comercial', 300),
  ('visit_reason', 'Rotina Comercial do Gerente', 310),
  ('visit_reason', 'Prospecção', 320),
  ('visit_reason', 'Planejamento Estratégico, Metodologia de Vendas por Multicanal, Treinamento Método Vendedor Profissional, Acompanhamento Diário de Vendas e Gestão á Vista', 330),
  ('visit_reason', 'Revisão dos Processos Críticos', 340),
  ('target_audience', 'Proprietário', 10),
  ('target_audience', 'Vendedor', 20),
  ('target_audience', 'Gerente', 30),
  ('target_audience', 'Todos', 40),
  ('target_audience', 'Vendedor e Gerente', 50),
  ('target_audience', 'Proprietário e Gerente', 60),
  ('target_audience', 'Proprietário e Marketing', 70)
ON CONFLICT (kind, lower(btrim(label))) DO UPDATE
SET sort_order = EXCLUDED.sort_order,
    status = 'ativo';

COMMENT ON TABLE public.opcoes_agenda_consultoria
  IS 'Catálogo editável de assuntos/motivos e alvos usados nos selects da Agenda MX e visitas de consultoria.';

NOTIFY pgrst, 'reload schema';
