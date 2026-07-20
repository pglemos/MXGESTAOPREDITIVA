-- ==========================================================================
-- Owner consultant requests
-- Base44 parity adapted to the canonical MX consulting and store scopes.
-- ==========================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.solicitacoes_consultoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clientes_consultoria(id) ON DELETE SET NULL,
  consultant_user_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  request_type text NOT NULL CHECK (request_type IN (
    'duvida',
    'analise',
    'decisao',
    'revisao_acao',
    'agendamento',
    'informacao',
    'urgente'
  )),
  subject text NOT NULL CHECK (char_length(btrim(subject)) BETWEEN 3 AND 180),
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 3 AND 5000),
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  context_type text NOT NULL DEFAULT 'geral',
  context_id text,
  context_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_analise', 'respondida', 'encerrada', 'cancelada')),
  responded_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_consultoria_store_status
  ON public.solicitacoes_consultoria(store_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_consultoria_client_id
  ON public.solicitacoes_consultoria(client_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_consultoria_consultant_user_id
  ON public.solicitacoes_consultoria(consultant_user_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_consultoria_consultant
  ON public.solicitacoes_consultoria(consultant_user_id, status, created_at DESC)
  WHERE consultant_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_solicitacoes_consultoria_created_by
  ON public.solicitacoes_consultoria(created_by, created_at DESC);

COMMENT ON TABLE public.solicitacoes_consultoria IS
  'Solicitações contextuais do ambiente Dono para a consultoria MX, vinculadas à loja, cliente, consultor e usuário autor.';
COMMENT ON COLUMN public.solicitacoes_consultoria.context_snapshot IS
  'Snapshot imutável do contexto que originou a solicitação: tela, indicador, decisão, período e valores relevantes.';

CREATE OR REPLACE FUNCTION public.validate_consulting_request_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.client_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.clientes_consultoria
    WHERE clientes_consultoria.id = NEW.client_id
      AND clientes_consultoria.primary_store_id = NEW.store_id
  ) THEN
    RAISE EXCEPTION 'O cliente da consultoria não pertence à loja informada.';
  END IF;

  IF NEW.consultant_user_id IS NOT NULL THEN
    IF NEW.client_id IS NULL OR NOT EXISTS (
      SELECT 1
      FROM public.atribuicoes_consultoria assignment
      WHERE assignment.client_id = NEW.client_id
        AND assignment.user_id = NEW.consultant_user_id
        AND assignment.active = true
    ) THEN
      RAISE EXCEPTION 'O consultor informado não possui vínculo ativo com o cliente.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_consulting_request_scope ON public.solicitacoes_consultoria;
CREATE TRIGGER trg_validate_consulting_request_scope
  BEFORE INSERT OR UPDATE OF store_id, client_id, consultant_user_id
  ON public.solicitacoes_consultoria
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_consulting_request_scope();

DROP TRIGGER IF EXISTS trg_solicitacoes_consultoria_updated_at ON public.solicitacoes_consultoria;
CREATE TRIGGER trg_solicitacoes_consultoria_updated_at
  BEFORE UPDATE ON public.solicitacoes_consultoria
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.solicitacoes_consultoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS solicitacoes_consultoria_select ON public.solicitacoes_consultoria;
CREATE POLICY solicitacoes_consultoria_select
  ON public.solicitacoes_consultoria
  FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR consultant_user_id = (SELECT auth.uid())
    OR public.eh_area_interna_mx((SELECT auth.uid()))
    OR public.user_is_master_loja(store_id, (SELECT auth.uid()))
    OR public.tem_papel_loja(store_id, ARRAY['dono'], (SELECT auth.uid()))
    OR public.is_owner_of(store_id)
  );

DROP POLICY IF EXISTS solicitacoes_consultoria_insert ON public.solicitacoes_consultoria;
CREATE POLICY solicitacoes_consultoria_insert
  ON public.solicitacoes_consultoria
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (
      public.eh_area_interna_mx((SELECT auth.uid()))
      OR public.user_is_master_loja(store_id, (SELECT auth.uid()))
      OR public.tem_papel_loja(store_id, ARRAY['dono'], (SELECT auth.uid()))
      OR public.is_owner_of(store_id)
      OR (
        consultant_user_id = (SELECT auth.uid())
        AND client_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.atribuicoes_consultoria assignment
          WHERE assignment.client_id = solicitacoes_consultoria.client_id
            AND assignment.user_id = (SELECT auth.uid())
            AND assignment.active = true
        )
      )
    )
  );

DROP POLICY IF EXISTS solicitacoes_consultoria_update ON public.solicitacoes_consultoria;
CREATE POLICY solicitacoes_consultoria_update
  ON public.solicitacoes_consultoria
  FOR UPDATE
  TO authenticated
  USING (
    consultant_user_id = (SELECT auth.uid())
    OR public.eh_area_interna_mx((SELECT auth.uid()))
  )
  WITH CHECK (
    consultant_user_id = (SELECT auth.uid())
    OR public.eh_area_interna_mx((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS solicitacoes_consultoria_cancel_own ON public.solicitacoes_consultoria;
DROP POLICY IF EXISTS solicitacoes_consultoria_delete_internal ON public.solicitacoes_consultoria;
CREATE POLICY solicitacoes_consultoria_delete_internal
  ON public.solicitacoes_consultoria
  FOR DELETE
  TO authenticated
  USING (public.eh_area_interna_mx((SELECT auth.uid())));

GRANT SELECT, INSERT, UPDATE ON public.solicitacoes_consultoria TO authenticated;

COMMIT;
