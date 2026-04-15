-- Migration: CONS-02: CRM de Consultoria - Agenda, Visitas e DRE
-- Amplia o contexto de consultoria com ferramentas de acompanhamento metodológico e financeiro.

-- Tabelas Auxiliares (Checklists da Metodologia)
CREATE TABLE IF NOT EXISTS public.consulting_methodology_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_number integer NOT NULL,
    objective text NOT NULL,
    target text,
    duration text,
    evidence_required text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Visitas (Agenda e Execução)
CREATE TABLE IF NOT EXISTS public.consulting_visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
    visit_number integer NOT NULL,
    scheduled_at timestamptz NOT NULL,
    duration_hours numeric DEFAULT 3,
    modality text NOT NULL DEFAULT 'Presencial', -- Presencial, Online
    status text NOT NULL DEFAULT 'agendada', -- Agendada, Concluída, Cancelada, Em Andamento
    consultant_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    auxiliary_consultant_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    objective text,
    checklist_data jsonb DEFAULT '[]'::jsonb, -- [{ task: string, completed: boolean }]
    feedback_client text,
    executive_summary text,
    google_event_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de DRE / Financeiro do Cliente
CREATE TABLE IF NOT EXISTS public.consulting_financials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
    reference_date date NOT NULL, -- Primeiro dia do mês
    revenue numeric DEFAULT 0,
    fixed_expenses numeric DEFAULT 0,
    marketing_expenses numeric DEFAULT 0,
    investments numeric DEFAULT 0,
    financing numeric DEFAULT 0,
    net_profit numeric DEFAULT 0,
    roi numeric DEFAULT 0,
    conversion_rate numeric DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(client_id, reference_date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS consulting_visits_client_idx ON public.consulting_visits (client_id);
CREATE INDEX IF NOT EXISTS consulting_visits_scheduled_at_idx ON public.consulting_visits (scheduled_at);
CREATE INDEX IF NOT EXISTS consulting_financials_client_date_idx ON public.consulting_financials (client_id, reference_date);

-- Triggers de atualização
DROP TRIGGER IF EXISTS update_consulting_visits_updated_at ON public.consulting_visits;
CREATE TRIGGER update_consulting_visits_updated_at BEFORE UPDATE ON public.consulting_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

DROP TRIGGER IF EXISTS update_consulting_financials_updated_at ON public.consulting_financials;
CREATE TRIGGER update_consulting_financials_updated_at BEFORE UPDATE ON public.consulting_financials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_canonical();

-- RLS
ALTER TABLE public.consulting_methodology_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_financials ENABLE ROW LEVEL SECURITY;

-- Consultoria e Admin podem ver tudo relacionado ao cliente que possuem acesso
DROP POLICY IF EXISTS consulting_visits_select ON public.consulting_visits;
CREATE POLICY consulting_visits_select ON public.consulting_visits FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_visits_write ON public.consulting_visits;
CREATE POLICY consulting_visits_write ON public.consulting_visits FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_financials_select ON public.consulting_financials;
CREATE POLICY consulting_financials_select ON public.consulting_financials FOR SELECT TO authenticated USING (public.can_access_consulting_client(client_id));

DROP POLICY IF EXISTS consulting_financials_write ON public.consulting_financials;
CREATE POLICY consulting_financials_write ON public.consulting_financials FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS consulting_methodology_select ON public.consulting_methodology_steps;
CREATE POLICY consulting_methodology_select ON public.consulting_methodology_steps FOR SELECT TO authenticated USING (true);

-- Seed básico da metodologia (Visitas 1 a 7)
INSERT INTO public.consulting_methodology_steps (visit_number, objective, target, duration, evidence_required)
VALUES 
(1, 'Diagnóstico e Treinamento Método Vendedor Profissional - Fase 1', 'Todos', '1 dia', 'Formulários preenchidos e dados enviados'),
(2, 'Planejamento Estratégico e Metodologia Multicanal', 'Todos', '1 dia', 'Validação do Planejamento no Sistema'),
(3, 'Rotina do Gerente e do Vendedor, Feedback Estruturado', 'Vendedor e Gerente', '3 horas', 'Rotina implementada no sistema'),
(4, 'Feedback Estruturado e Cultura de Resultado', 'Vendedor e Gerente', '3 horas', 'Feedbacks registrados'),
(5, 'Revisão dos Processos Críticos', 'Gerente e Sócios', '3 horas', 'Processos ajustados'),
(6, 'Plano de Desenvolvimento Individual (PDI)', 'Vendedor e Gerente', '3 horas', 'Todos os PDIs no sistema'),
(7, 'Análise das Implementações e Plano Trimestral', 'Todos', '3 horas', 'Relatório final e novo plano aprovado')
ON CONFLICT DO NOTHING;
