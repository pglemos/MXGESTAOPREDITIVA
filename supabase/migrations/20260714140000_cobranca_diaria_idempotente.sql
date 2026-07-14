-- Fixture autorizada MX-MGR-20260713 (cobrança) — achado em 2026-07-14.
-- A primeira tentativa de idempotência (checagem client-side via SELECT
-- antes do INSERT em notificacoes) não funciona: a policy de SELECT em
-- notificacoes só libera recipient_id = auth.uid(), então o gerente nunca
-- consegue enxergar as próprias cobranças enviadas para revalidar
-- duplicidade. RPC SECURITY DEFINER resolve isso sem alargar a policy de
-- SELECT geral da tabela (mesmo padrão já usado nas RPCs de regularização).
--
-- Escopo: só "cobrança" (type routine/checkin, cada envio pro mesmo
-- destinatário no mesmo dia calendário). Não afeta nenhum outro tipo de
-- notificação, que segue passando pelo INSERT direto existente.

CREATE OR REPLACE FUNCTION public.enviar_cobranca_diaria(
  p_recipient_id uuid,
  p_store_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_priority text DEFAULT 'high',
  p_link text DEFAULT null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_existing_id uuid;
  v_new_id uuid;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não autenticado.');
  END IF;

  IF p_type NOT IN ('routine', 'checkin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tipo de cobrança inválido.');
  END IF;

  IF p_store_id IS NULL OR NOT (
    public.eh_administrador_mx(v_caller)
    OR public.is_manager_of(p_store_id)
    OR public.is_owner_of(p_store_id)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  SELECT id INTO v_existing_id
  FROM public.notificacoes
  WHERE recipient_id = p_recipient_id
    AND sender_id = v_caller
    AND type = p_type
    AND created_at >= date_trunc('day', now())
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'id', v_existing_id);
  END IF;

  INSERT INTO public.notificacoes (recipient_id, sender_id, store_id, title, message, type, priority, link, target_type, read)
  VALUES (p_recipient_id, v_caller, p_store_id, p_title, p_message, p_type, p_priority, p_link, 'all', false)
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'id', v_new_id);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.enviar_cobranca_diaria(uuid, uuid, text, text, text, text, text) TO authenticated;

-- Down:
-- DROP FUNCTION IF EXISTS public.enviar_cobranca_diaria(uuid, uuid, text, text, text, text, text);
