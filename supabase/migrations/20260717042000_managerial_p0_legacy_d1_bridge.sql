-- Compatibility bridge while the current Base44-compatible Agenda D+1 UI is migrated
-- to the explicit RPCs. New writes become canonical immediately; no parallel business base.

BEGIN;

ALTER TABLE public.execution_actions
  ALTER COLUMN activity_type SET DEFAULT 'comercial';

CREATE OR REPLACE FUNCTION public.bridge_d1_audit_to_canonical()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_row public.agendamentos;
  previous_status text;
  canonical_status text;
  canonical_action text;
  local_today date := (timezone('America/Sao_Paulo', NEW.created_at))::date;
BEGIN
  IF NEW.tipo_alteracao NOT IN (
    'agenda_d1_whatsapp',
    'agenda_d1_telefone',
    'agenda_d1_confirmacao'
  ) OR NEW.cliente_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT a.*
  INTO appointment_row
  FROM public.agendamentos a
  WHERE a.cliente_id::text = NEW.cliente_id
    AND (NEW.fechamento_id IS NULL OR a.fechamento_id = NEW.fechamento_id)
    AND (timezone('America/Sao_Paulo', a.data_hora))::date
        BETWEEN local_today - 1 AND local_today + 7
    AND (
      public.eh_administrador_mx(NEW.usuario_id)
      OR public.is_manager_of(a.loja_id)
      OR public.is_owner_of(a.loja_id)
    )
  ORDER BY
    CASE WHEN (timezone('America/Sao_Paulo', a.data_hora))::date = local_today + 1 THEN 0 ELSE 1 END,
    ABS(EXTRACT(EPOCH FROM (a.data_hora - NEW.created_at))),
    a.updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  previous_status := appointment_row.confirmation_status;
  canonical_status := previous_status;

  IF NEW.tipo_alteracao = 'agenda_d1_whatsapp' THEN
    canonical_action := 'whatsapp_opened';
    IF previous_status = 'pendente' THEN
      canonical_status := 'whatsapp_aberto';
    END IF;
  ELSIF NEW.tipo_alteracao = 'agenda_d1_telefone' THEN
    canonical_action := 'phone_opened';
  ELSE
    canonical_action := 'confirmation_changed';
    canonical_status := CASE
      WHEN lower(COALESCE(NEW.valor_novo,'')) LIKE 'confirmado%' THEN 'confirmado'
      WHEN lower(COALESCE(NEW.valor_novo,'')) LIKE 'sem resposta%' THEN 'sem_resposta'
      WHEN lower(COALESCE(NEW.valor_novo,'')) LIKE 'solicitou reagendamento%' THEN 'solicitou_reagendamento'
      WHEN lower(COALESCE(NEW.valor_novo,'')) LIKE 'cancelou%' THEN 'cancelou'
      ELSE 'outro'
    END;
  END IF;

  UPDATE public.agendamentos
  SET confirmation_status = canonical_status,
      confirmation_note = CASE
        WHEN NEW.tipo_alteracao = 'agenda_d1_confirmacao' THEN NULLIF(BTRIM(NEW.valor_novo),'')
        ELSE confirmation_note
      END,
      last_contact_at = now(),
      confirmed_at = CASE WHEN canonical_status = 'confirmado' THEN now() ELSE confirmed_at END,
      confirmed_by = CASE WHEN NEW.tipo_alteracao = 'agenda_d1_confirmacao' THEN NEW.usuario_id ELSE confirmed_by END,
      updated_at = now(),
      updated_by = NEW.usuario_id
  WHERE id = appointment_row.id;

  INSERT INTO public.d1_contact_audit (
    appointment_id,
    store_id,
    seller_user_id,
    manager_user_id,
    action_type,
    previous_confirmation_status,
    new_confirmation_status,
    message_preview,
    note,
    metadata
  ) VALUES (
    appointment_row.id,
    appointment_row.loja_id,
    appointment_row.seller_user_id,
    NEW.usuario_id,
    canonical_action,
    previous_status,
    canonical_status,
    CASE WHEN NEW.tipo_alteracao = 'agenda_d1_whatsapp' THEN NEW.valor_novo ELSE NULL END,
    CASE WHEN NEW.tipo_alteracao = 'agenda_d1_confirmacao' THEN NEW.valor_novo ELSE NULL END,
    jsonb_build_object(
      'legacy_audit_id', NEW.id,
      'legacy_change_type', NEW.tipo_alteracao,
      'compatibility_bridge', true
    )
  );

  -- Solicitar reagendamento nunca altera data_hora. A agenda oficial permanece intacta.
  IF canonical_status = 'solicitou_reagendamento' THEN
    INSERT INTO public.d1_contact_audit (
      appointment_id, store_id, seller_user_id, manager_user_id,
      action_type, previous_confirmation_status, new_confirmation_status,
      note, metadata
    ) VALUES (
      appointment_row.id, appointment_row.loja_id, appointment_row.seller_user_id,
      NEW.usuario_id, 'seller_notified', previous_status, canonical_status,
      'Aviso ao vendedor solicitado; a data oficial não foi alterada.',
      jsonb_build_object('legacy_audit_id',NEW.id,'compatibility_bridge',true)
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN others THEN
  PERFORM public.log_rpc_error(
    'bridge_d1_audit_to_canonical',
    SQLSTATE,
    SQLERRM,
    NEW.usuario_id,
    jsonb_build_object('legacy_audit_id',NEW.id,'cliente_id',NEW.cliente_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bridge_d1_audit_to_canonical ON public.d1_audit_log;
CREATE TRIGGER trg_bridge_d1_audit_to_canonical
AFTER INSERT ON public.d1_audit_log
FOR EACH ROW EXECUTE FUNCTION public.bridge_d1_audit_to_canonical();

COMMIT;
