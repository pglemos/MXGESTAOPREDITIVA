-- MX Performance — correções de runtime e auditoria explícita da Agenda D+1.
-- A regra textual da especificação prevalece: 09:31 consolida snapshot; mutações tardias são auditadas.

BEGIN;

CREATE TABLE IF NOT EXISTS public.d1_contact_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.agendamentos(id) ON DELETE RESTRICT,
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE RESTRICT,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  manager_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  action_type text NOT NULL CHECK (action_type IN (
    'whatsapp_opened','phone_opened','confirmation_changed','seller_notified'
  )),
  previous_confirmation_status text,
  new_confirmation_status text,
  message_preview text,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_d1_contact_audit_appointment
  ON public.d1_contact_audit(appointment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_d1_contact_audit_store
  ON public.d1_contact_audit(store_id, created_at DESC);

ALTER TABLE public.d1_contact_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS d1_contact_audit_select ON public.d1_contact_audit;
CREATE POLICY d1_contact_audit_select ON public.d1_contact_audit
FOR SELECT TO authenticated USING (
  seller_user_id = (SELECT auth.uid())
  OR manager_user_id = (SELECT auth.uid())
  OR public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id)
  OR public.is_owner_of(store_id)
);

CREATE OR REPLACE FUNCTION public.record_d1_contact_action(
  p_appointment_id uuid,
  p_action_type text,
  p_message_preview text DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.d1_contact_audit
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  appointment_row public.agendamentos;
  inserted public.d1_contact_audit;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória.' USING ERRCODE = '42501';
  END IF;

  IF p_action_type NOT IN ('whatsapp_opened','phone_opened','confirmation_changed','seller_notified') THEN
    RAISE EXCEPTION 'Ação D+1 inválida.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO appointment_row
  FROM public.agendamentos
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.eh_administrador_mx(caller_id)
     AND NOT public.is_manager_of(appointment_row.loja_id)
     AND NOT public.is_owner_of(appointment_row.loja_id) THEN
    RAISE EXCEPTION 'Usuário sem permissão para atuar neste agendamento.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.d1_contact_audit (
    appointment_id, store_id, seller_user_id, manager_user_id,
    action_type, previous_confirmation_status, new_confirmation_status,
    message_preview, note, metadata
  ) VALUES (
    appointment_row.id, appointment_row.loja_id, appointment_row.seller_user_id, caller_id,
    p_action_type, appointment_row.confirmation_status, appointment_row.confirmation_status,
    p_message_preview, p_note, COALESCE(p_metadata,'{}'::jsonb)
  ) RETURNING * INTO inserted;

  UPDATE public.agendamentos
  SET last_contact_at = now(), updated_at = now(), updated_by = caller_id
  WHERE id = appointment_row.id;

  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.record_d1_contact_action(uuid,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_d1_contact_action(uuid,text,text,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_d1_confirmation(
  p_appointment_id uuid,
  p_confirmation_status text,
  p_note text DEFAULT NULL
)
RETURNS public.agendamentos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  appointment_row public.agendamentos;
  updated_row public.agendamentos;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória.' USING ERRCODE = '42501';
  END IF;

  IF p_confirmation_status NOT IN ('pendente','whatsapp_aberto','confirmado','sem_resposta','solicitou_reagendamento','cancelou','outro') THEN
    RAISE EXCEPTION 'Status de confirmação inválido.' USING ERRCODE = '22023';
  END IF;

  IF p_confirmation_status = 'outro' AND NULLIF(BTRIM(p_note),'') IS NULL THEN
    RAISE EXCEPTION 'Informe uma observação para o status Outro.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO appointment_row
  FROM public.agendamentos
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.eh_administrador_mx(caller_id)
     AND NOT public.is_manager_of(appointment_row.loja_id)
     AND NOT public.is_owner_of(appointment_row.loja_id) THEN
    RAISE EXCEPTION 'Usuário sem permissão para confirmar este agendamento.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.agendamentos
  SET confirmation_status = p_confirmation_status,
      confirmation_note = NULLIF(BTRIM(p_note),''),
      last_contact_at = now(),
      confirmed_at = CASE WHEN p_confirmation_status = 'confirmado' THEN now() ELSE confirmed_at END,
      confirmed_by = caller_id,
      updated_at = now(),
      updated_by = caller_id
  WHERE id = appointment_row.id
  RETURNING * INTO updated_row;

  INSERT INTO public.d1_contact_audit (
    appointment_id, store_id, seller_user_id, manager_user_id,
    action_type, previous_confirmation_status, new_confirmation_status, note, metadata
  ) VALUES (
    appointment_row.id, appointment_row.loja_id, appointment_row.seller_user_id, caller_id,
    'confirmation_changed', appointment_row.confirmation_status, p_confirmation_status,
    NULLIF(BTRIM(p_note),''),
    jsonb_build_object(
      'appointment_at', appointment_row.data_hora,
      'seller_notification_required', p_confirmation_status = 'solicitou_reagendamento'
    )
  );

  IF p_confirmation_status = 'solicitou_reagendamento' THEN
    INSERT INTO public.d1_contact_audit (
      appointment_id, store_id, seller_user_id, manager_user_id,
      action_type, previous_confirmation_status, new_confirmation_status, note, metadata
    ) VALUES (
      appointment_row.id, appointment_row.loja_id, appointment_row.seller_user_id, caller_id,
      'seller_notified', appointment_row.confirmation_status, p_confirmation_status,
      'Vendedor deve tratar o pedido de reagendamento; a data oficial não foi alterada.',
      jsonb_build_object('automatic_notice_record',true)
    );
  END IF;

  RETURN updated_row;
END;
$$;

REVOKE ALL ON FUNCTION public.update_d1_confirmation(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_d1_confirmation(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.consolidate_d1_snapshot(
  p_reference_date date DEFAULT NULL,
  p_store_id uuid DEFAULT NULL,
  p_force boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  local_now timestamp := timezone('America/Sao_Paulo', now());
  target_reference_date date := COALESCE(p_reference_date, local_now::date - 1);
  caller_id uuid := auth.uid();
  closing_row record;
  batch_id uuid;
  next_version integer;
  informed_count integer;
  detailed_count integer;
  valid_count integer;
  discipline numeric(6,2);
  created_batches integer := 0;
BEGIN
  IF NOT p_force AND local_now::time < time '09:31:00' THEN
    RETURN jsonb_build_object('status','skipped_before_0931','reference_date',target_reference_date);
  END IF;

  IF caller_id IS NOT NULL AND p_store_id IS NULL
     AND NOT public.eh_administrador_mx(caller_id) THEN
    RAISE EXCEPTION 'Informe a loja para consolidar o D+1.' USING ERRCODE = '42501';
  END IF;

  IF caller_id IS NOT NULL AND p_store_id IS NOT NULL
     AND NOT public.eh_administrador_mx(caller_id)
     AND NOT public.is_manager_of(p_store_id)
     AND NOT public.is_owner_of(p_store_id) THEN
    RAISE EXCEPTION 'Usuário sem permissão para consolidar o D+1 desta loja.' USING ERRCODE = '42501';
  END IF;

  FOR closing_row IN
    SELECT ld.*
    FROM public.lancamentos_diarios ld
    WHERE ld.metric_scope = 'daily'
      AND ld.reference_date = target_reference_date
      AND (p_store_id IS NULL OR ld.store_id = p_store_id)
      AND (
        ld.submission_status = 'on_time'
        OR EXISTS (
          SELECT 1
          FROM public.solicitacoes_correcao_lancamento scr
          WHERE scr.checkin_id = ld.id AND scr.status = 'approved'
        )
      )
  LOOP
    SELECT COALESCE(MAX(version),0) + 1
    INTO next_version
    FROM public.d1_snapshot_batches
    WHERE closing_id = closing_row.id;

    informed_count := CASE
      WHEN COALESCE(closing_row.agd_cart_today,0) <> 0 OR COALESCE(closing_row.agd_net_today,0) <> 0
        THEN COALESCE(closing_row.agd_cart_today,0) + COALESCE(closing_row.agd_net_today,0)
      ELSE COALESCE(closing_row.agd_cart,0) + COALESCE(closing_row.agd_net,0)
    END;

    SELECT
      COUNT(*) FILTER (
        WHERE a.cliente_id IS NOT NULL
          AND a.canal::text IN ('carteira','internet')
      )::integer,
      COUNT(*) FILTER (
        WHERE a.cliente_id IS NOT NULL
          AND a.canal::text IN ('carteira','internet')
          AND a.modalidade IS NOT NULL
      )::integer
    INTO detailed_count, valid_count
    FROM public.agendamentos a
    WHERE a.loja_id = closing_row.store_id
      AND a.seller_user_id = closing_row.seller_user_id
      AND (timezone('America/Sao_Paulo', a.data_hora))::date = target_reference_date + 1
      AND (a.fechamento_id = closing_row.id OR a.fechamento_id IS NULL);

    discipline := CASE
      WHEN informed_count > 0 THEN LEAST(100, 70 + (30.0 * LEAST(valid_count, informed_count) / informed_count))
      ELSE 70
    END;

    INSERT INTO public.d1_snapshot_batches (
      closing_id, store_id, seller_user_id, reference_date, agenda_date, version,
      appointments_informed, appointments_detailed, appointments_valid,
      discipline_score, source_hash, consolidated_by
    ) VALUES (
      closing_row.id, closing_row.store_id, closing_row.seller_user_id,
      target_reference_date, target_reference_date + 1, next_version,
      informed_count, detailed_count, valid_count, discipline,
      md5(concat_ws('|', closing_row.id::text, next_version::text, target_reference_date::text,
        informed_count::text, detailed_count::text, valid_count::text)),
      caller_id
    ) RETURNING id INTO batch_id;

    INSERT INTO public.d1_snapshot_items (
      batch_id, appointment_id, client_id, opportunity_id, store_id, seller_user_id,
      appointment_at, channel, appointment_type, modality, confirmation_status,
      client_name, phone, vehicle, last_contact_at, source_updated_at,
      valid_for_discipline, valid_for_forecast
    )
    SELECT
      batch_id, a.id, a.cliente_id, a.oportunidade_id, a.loja_id, a.seller_user_id,
      a.data_hora, a.canal::text, a.tipo::text, a.modalidade::text, a.confirmation_status,
      c.nome, c.telefone, o.veiculo_interesse, a.last_contact_at, a.updated_at,
      (a.cliente_id IS NOT NULL AND a.canal::text IN ('carteira','internet') AND a.modalidade IS NOT NULL),
      (a.cliente_id IS NOT NULL AND a.confirmation_status = 'confirmado' AND a.modalidade IS NOT NULL)
    FROM public.agendamentos a
    LEFT JOIN public.clientes c ON c.id = a.cliente_id
    LEFT JOIN public.oportunidades o ON o.id = a.oportunidade_id
    WHERE a.loja_id = closing_row.store_id
      AND a.seller_user_id = closing_row.seller_user_id
      AND (timezone('America/Sao_Paulo', a.data_hora))::date = target_reference_date + 1
      AND (a.fechamento_id = closing_row.id OR a.fechamento_id IS NULL);

    created_batches := created_batches + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'status','ok',
    'reference_date',target_reference_date,
    'created_batches',created_batches,
    'consolidated_at',now()
  );
EXCEPTION WHEN others THEN
  PERFORM public.log_rpc_error(
    'consolidate_d1_snapshot', SQLSTATE, SQLERRM, caller_id,
    jsonb_build_object('reference_date',target_reference_date,'store_id',p_store_id)
  );
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.consolidate_d1_snapshot(date,uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consolidate_d1_snapshot(date,uuid,boolean) TO authenticated, service_role;

COMMIT;
