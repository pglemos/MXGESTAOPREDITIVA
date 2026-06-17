-- MX Vendedor - Acoes de feedback rastreaveis na Central de Execucao
-- PRD EV-6.3 / EV-3.4: feedback do gestor gera tarefa recorrente ate conclusao.

CREATE TABLE IF NOT EXISTS public.devolutiva_acoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devolutiva_id uuid NOT NULL REFERENCES public.devolutivas(id) ON DELETE CASCADE,
  store_id uuid NOT NULL,
  seller_id uuid NOT NULL REFERENCES public.usuarios(id),
  manager_id uuid NOT NULL REFERENCES public.usuarios(id),
  action_text text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  recorrencia text NOT NULL DEFAULT 'diaria',
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  horario_sugerido time NOT NULL DEFAULT '09:00'::time,
  obrigatoria_fechamento boolean NOT NULL DEFAULT false,
  concluida_at timestamptz,
  concluida_por uuid REFERENCES public.usuarios(id),
  justificativa text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT devolutiva_acoes_action_text_not_blank CHECK (btrim(action_text) <> ''),
  CONSTRAINT devolutiva_acoes_status_check CHECK (status IN ('pendente', 'concluida', 'justificada', 'cancelada')),
  CONSTRAINT devolutiva_acoes_recorrencia_check CHECK (recorrencia IN ('diaria', 'unica'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_devolutiva_acoes_devolutiva
  ON public.devolutiva_acoes (devolutiva_id);

CREATE INDEX IF NOT EXISTS idx_devolutiva_acoes_seller_status
  ON public.devolutiva_acoes (seller_id, status, data_inicio);

COMMENT ON TABLE public.devolutiva_acoes IS
  'Acoes rastreaveis originadas de devolutivas do gestor para consumo na Central de Execucao e futura trava de Fechamento.';
COMMENT ON COLUMN public.devolutiva_acoes.devolutiva_id IS
  'Vinculo com a devolutiva original que gerou a tarefa.';
COMMENT ON COLUMN public.devolutiva_acoes.obrigatoria_fechamento IS
  'Quando true, a acao pendente pode bloquear o Fechamento Diario ate conclusao ou justificativa (EV-1.4).';

ALTER TABLE public.devolutiva_acoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS devolutiva_acoes_select_own ON public.devolutiva_acoes;
CREATE POLICY devolutiva_acoes_select_own
  ON public.devolutiva_acoes
  FOR SELECT
  TO authenticated
  USING (
    seller_id = auth.uid()
    OR manager_id = auth.uid()
  );

DROP POLICY IF EXISTS devolutiva_acoes_insert_manager ON public.devolutiva_acoes;
CREATE POLICY devolutiva_acoes_insert_manager
  ON public.devolutiva_acoes
  FOR INSERT
  TO authenticated
  WITH CHECK (manager_id = auth.uid());

DROP POLICY IF EXISTS devolutiva_acoes_update_manager ON public.devolutiva_acoes;
CREATE POLICY devolutiva_acoes_update_manager
  ON public.devolutiva_acoes
  FOR UPDATE
  TO authenticated
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

DROP POLICY IF EXISTS devolutiva_acoes_update_own_pending ON public.devolutiva_acoes;
CREATE POLICY devolutiva_acoes_update_own_pending
  ON public.devolutiva_acoes
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid() AND status = 'pendente')
  WITH CHECK (seller_id = auth.uid());

-- Rollback manual:
-- DROP POLICY IF EXISTS devolutiva_acoes_update_own_pending ON public.devolutiva_acoes;
-- DROP POLICY IF EXISTS devolutiva_acoes_update_manager ON public.devolutiva_acoes;
-- DROP POLICY IF EXISTS devolutiva_acoes_insert_manager ON public.devolutiva_acoes;
-- DROP POLICY IF EXISTS devolutiva_acoes_select_own ON public.devolutiva_acoes;
-- DROP TABLE IF EXISTS public.devolutiva_acoes;
