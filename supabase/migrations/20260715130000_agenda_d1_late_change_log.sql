-- Story MX-22.5 (AC-7/AC-8; Spec §11.2/§11.3 — FEV-DATA-12 "Snapshot D+1")
--
-- "até 09:30 permite ajuste; às 09:31 consolida; alteração posterior cria
--  log/versão; não reescreve snapshot silenciosamente."
--
-- Escopo mínimo (não um sistema de versionamento completo, ver Dev Notes da
-- story): log append-only de alterações tardias em `public.agendamentos`.
-- Nunca bloqueia nem reescreve a linha em `agendamentos` — só registra,
-- preservando o dado real e permitindo ao gestor enxergar a alteração
-- tardia (§11.3 "o gerente deve enxergar a alteração tardia").
--
-- "Tardio" aqui = a alteração (insert ou update) acontece no mesmo dia (SP)
-- em que o agendamento está marcado para ocorrer (data_hora), depois das
-- 09:30 SP daquele dia — o dia em que o agendamento ocorre é sempre, por
-- definição, o D+1 de algum fechamento já consolidado.

CREATE TABLE IF NOT EXISTS public.agenda_d1_late_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id uuid NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  data_hora timestamptz NOT NULL,
  operation text NOT NULL CHECK (operation IN ('insert', 'update')),
  changed_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL
);

COMMENT ON TABLE public.agenda_d1_late_changes IS
  'Log append-only (Spec §11.2/§11.3): registra insert/update em agendamentos '
  'feitos depois das 09:30 SP do próprio dia do agendamento. Nunca bloqueia '
  'nem reescreve agendamentos — só torna a alteração tardia visível ao gestor.';

CREATE INDEX IF NOT EXISTS idx_agenda_d1_late_changes_loja_data
  ON public.agenda_d1_late_changes(loja_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_agenda_d1_late_changes_agendamento
  ON public.agenda_d1_late_changes(agendamento_id);

ALTER TABLE public.agenda_d1_late_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agenda_d1_late_changes_select ON public.agenda_d1_late_changes;
CREATE POLICY agenda_d1_late_changes_select ON public.agenda_d1_late_changes
  FOR SELECT TO authenticated
  USING (
    seller_user_id = (SELECT auth.uid())
    OR public.eh_administrador_mx((SELECT auth.uid()))
    OR public.is_manager_of(loja_id)
    OR public.is_owner_of(loja_id)
  );

-- Nenhuma policy de INSERT/UPDATE/DELETE para `authenticated`: só a função
-- SECURITY DEFINER abaixo escreve nesta tabela.

CREATE OR REPLACE FUNCTION public.log_agenda_d1_late_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appt_date_sp date;
  v_now_sp timestamp;
BEGIN
  v_now_sp := timezone('America/Sao_Paulo', now());
  v_appt_date_sp := (timezone('America/Sao_Paulo', NEW.data_hora))::date;

  IF v_appt_date_sp = v_now_sp::date AND v_now_sp::time > time '09:30:00' THEN
    INSERT INTO public.agenda_d1_late_changes (
      agendamento_id, seller_user_id, loja_id, data_hora, operation, snapshot
    ) VALUES (
      NEW.id, NEW.seller_user_id, NEW.loja_id, NEW.data_hora,
      CASE WHEN TG_OP = 'INSERT' THEN 'insert' ELSE 'update' END,
      to_jsonb(NEW)
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Nunca bloquear o agendamento por causa do log tardio (Spec §11.3: o
    -- agendamento em si continua livre para ser salvo).
    PERFORM public.log_rpc_error(
      'log_agenda_d1_late_change', SQLSTATE, SQLERRM, NEW.seller_user_id,
      jsonb_build_object('agendamento_id', NEW.id)
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agenda_d1_late_change ON public.agendamentos;
CREATE TRIGGER trg_agenda_d1_late_change
  AFTER INSERT OR UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.log_agenda_d1_late_change();
