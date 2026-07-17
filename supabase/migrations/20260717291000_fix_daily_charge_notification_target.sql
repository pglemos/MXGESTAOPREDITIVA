BEGIN;

-- Follow-up to the reviewed closing hardening.
-- `notificacoes_target_type_check` accepts all/store/role. Direct notifications
-- are consumed by recipient_id and use target_type='all' throughout the app.

CREATE OR REPLACE FUNCTION public.enviar_cobranca_diaria(
  p_recipient_id uuid,
  p_store_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_priority text DEFAULT 'high'::text,
  p_link text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_existing_id uuid;
  v_new_id uuid;
  v_business_date date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_charge_lock_key bigint;
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

  IF NOT public.tem_papel_loja(p_store_id, ARRAY['vendedor'], p_recipient_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Destinatário não pertence à equipe de vendedores desta loja.');
  END IF;

  v_charge_lock_key := hashtextextended(
    concat_ws(
      '|',
      'enviar_cobranca_diaria',
      v_caller::text,
      p_recipient_id::text,
      p_store_id::text,
      p_type,
      v_business_date::text
    ),
    0
  );
  PERFORM pg_advisory_xact_lock(v_charge_lock_key);

  SELECT id INTO v_existing_id
  FROM public.notificacoes
  WHERE recipient_id = p_recipient_id
    AND sender_id = v_caller
    AND store_id = p_store_id
    AND type = p_type
    AND created_at >= (v_business_date::timestamp AT TIME ZONE 'America/Sao_Paulo')
    AND created_at < ((v_business_date + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'id', v_existing_id);
  END IF;

  INSERT INTO public.notificacoes (
    recipient_id, sender_id, store_id, title, message, type, priority, link, target_type, read
  ) VALUES (
    p_recipient_id, v_caller, p_store_id, p_title, p_message, p_type, p_priority, p_link, 'all', false
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'id', v_new_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.enviar_cobranca_diaria(uuid,uuid,text,text,text,text,text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enviar_cobranca_diaria(uuid,uuid,text,text,text,text,text)
  TO authenticated, service_role;

-- DOWN
-- Reapply the previous definition only with incident approval. It restores the
-- invalid target_type='user' and makes legitimate daily charges fail at insert.

COMMIT;
