-- REL-001 — reaplicação da função corrigida normalize_daily_closing_window em produção.
--
-- Contexto: a migration 20260714150000_definitive_daily_closing_window.sql foi
-- marcada como aplicada em produção às 15:00 UTC de 2026-07-14, ANTES do fix
-- 552a9b40 (17:42 UTC). O CREATE OR REPLACE FUNCTION que efetivamente rodou em
-- produção foi a versão COM BUG (força submission_status='on_time' incondicional
-- e zera penalizacao_atraso_aplicada/percentual_penalizacao_atraso sempre,
-- desligando silenciosamente a penalização de atraso da Disciplina).
-- Reaplicar o mesmo timestamp não re-executa (Supabase já o marca aplicado),
-- então esta migration nova reaplica LITERALMENTE a lógica corrigida já revisada
-- em QA (MX-22.2 e MX-22.5, gate CONCERNS citando este bug como REL-001).
--
-- Atraso real (FEV-DATA-09) é avaliado contra o prazo de 12:00 de
-- reference_date + 1 dia (America/Sao_Paulo). Não força "on_time" incondicional:
-- submission_status/submitted_late são setados condicionalmente e os campos de
-- penalização só são zerados quando o envio é realmente no prazo (IF NOT is_late).
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

-- =====================================================================
-- DOWN (rollback manual — NÃO reintroduzir a versão com bug):
-- Não há rollback seguro para a versão anterior, pois ela é justamente o
-- bug REL-001. Em caso de necessidade de reverter o trigger, apenas:
--   DROP TRIGGER IF EXISTS zz_daily_closing_window ON public.lancamentos_diarios;
-- (deixando a função sem gatilho). Reaplicar a versão buggada é proibido.
-- =====================================================================
