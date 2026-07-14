-- MX-22 — janela oficial do Fechamento Diário.
--
-- 09:30 pertence à consolidação da Agenda D+1. O Fechamento Diário trabalha
-- por data operacional e continua válido até 12:00; depois desse corte D-1
-- deixa de ser lançamento diário e segue por regularização.
--
-- A função roda depois do trigger canônico legado (prefixo zz_) para impedir
-- que o timestamp real do dispositivo reintroduza a antiga regra 09:30.
--
-- Atraso real (FEV-DATA-09) é avaliado contra o prazo de 12:00 de
-- reference_date + 1 dia (America/Sao_Paulo) — não contra o relógio de hoje.
-- Não força "on_time" incondicional: isso apagaria a detecção de atraso que
-- o Módulo Gerencial (spec §10.2/§12.4) depende para penalização de
-- Disciplina. Os campos de penalização só são zerados quando o envio é
-- realmente no prazo; quando tardio, ficam para a regra de penalização
-- (MX-22.5) aplicar/registrar, não são apagados aqui.
CREATE OR REPLACE FUNCTION public.normalize_daily_closing_window()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  deadline timestamptz;
  is_late boolean;
BEGIN
  -- A aprovação de uma regularização histórica é a única transição para
  -- daily que pode preservar atraso/penalização e a auditoria correspondente.
  IF NEW.metric_scope = 'daily'::public.checkin_scope
     AND NOT (TG_OP = 'UPDATE' AND OLD.metric_scope = 'historical'::public.checkin_scope) THEN
    IF coalesce(NEW.submission_status, 'draft') <> 'draft' THEN
      deadline := ((NEW.reference_date + INTERVAL '1 day') AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '12 hours';
      is_late := NEW.submitted_at > deadline;

      NEW.submission_status := CASE WHEN is_late THEN 'late' ELSE 'on_time' END;
      NEW.submitted_late := is_late;

      IF NOT is_late THEN
        NEW.finalizado_apos_prazo := false;
        NEW.penalizacao_atraso_aplicada := false;
        NEW.percentual_penalizacao_atraso := 0;
        NEW.fechamento_liberado := false;
        NEW.liberado_por_id := NULL;
        NEW.liberado_por_nome := NULL;
        NEW.data_hora_liberacao := NULL;
        NEW.pontuacao_disciplina_final := coalesce(NEW.pontuacao_disciplina_base, 0);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS zz_daily_closing_window ON public.lancamentos_diarios;
CREATE TRIGGER zz_daily_closing_window
  BEFORE INSERT OR UPDATE ON public.lancamentos_diarios
  FOR EACH ROW EXECUTE FUNCTION public.normalize_daily_closing_window();

COMMENT ON FUNCTION public.normalize_daily_closing_window() IS
  'MX-22: fechamento diário oficial até 12:00; 09:30 é exclusivo do snapshot Agenda D+1.';

-- A unicidade por vendedor + loja + data operacional + escopo é a barreira
-- contra duplo clique, refresh e corridas de rede. A migration de hardening
-- anterior já cria essa constraint; não criar um segundo índice equivalente,
-- pois isso só duplica a estrutura sem aumentar a integridade.
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.lancamentos_diarios'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) =
        'UNIQUE (seller_user_id, store_id, reference_date, metric_scope)'
  ) THEN
    ALTER TABLE public.lancamentos_diarios
      ADD CONSTRAINT lancamentos_diarios_seller_store_reference_scope_key
      UNIQUE (seller_user_id, store_id, reference_date, metric_scope);
  END IF;
END
$do$;
