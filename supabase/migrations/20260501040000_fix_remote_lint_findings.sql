-- Corrige achados do Supabase db lint remoto apos a padronizacao de nomes em portugues.

CREATE OR REPLACE FUNCTION public.reject_correction_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
BEGIN
  SELECT * INTO v_request
  FROM public.solicitacoes_correcao_lancamento
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitacao nao encontrada ou ja processada.';
  END IF;

  IF NOT (public.eh_administrador_mx(auth.uid()) OR public.is_manager_of(v_request.store_id)) THEN
    RAISE EXCEPTION 'Permissao negada.';
  END IF;

  UPDATE public.solicitacoes_correcao_lancamento
  SET status = 'rejected',
      auditor_id = auth.uid(),
      reviewed_at = now()
  WHERE id = request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_pdi_action_evidence(p_action_id uuid, p_approval_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM p_approval_payload;

    UPDATE public.pdi_plano_acao
    SET status = 'concluido',
        aprovado_por = auth.uid(),
        data_aprovacao = now(),
        updated_at = now()
    WHERE id = p_action_id;
END;
$$;
