-- STORY-08: vendedor pode apenas confirmar ciencia do feedback

CREATE OR REPLACE FUNCTION public.enforce_feedback_seller_ack_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() = OLD.seller_id
        AND NOT public.is_admin()
        AND NOT public.is_manager_of(OLD.store_id)
    THEN
        IF NEW.store_id IS DISTINCT FROM OLD.store_id
            OR NEW.manager_id IS DISTINCT FROM OLD.manager_id
            OR NEW.seller_id IS DISTINCT FROM OLD.seller_id
            OR NEW.week_reference IS DISTINCT FROM OLD.week_reference
            OR NEW.leads_week IS DISTINCT FROM OLD.leads_week
            OR NEW.agd_week IS DISTINCT FROM OLD.agd_week
            OR NEW.visit_week IS DISTINCT FROM OLD.visit_week
            OR NEW.vnd_week IS DISTINCT FROM OLD.vnd_week
            OR NEW.tx_lead_agd IS DISTINCT FROM OLD.tx_lead_agd
            OR NEW.tx_agd_visita IS DISTINCT FROM OLD.tx_agd_visita
            OR NEW.tx_visita_vnd IS DISTINCT FROM OLD.tx_visita_vnd
            OR NEW.meta_compromisso IS DISTINCT FROM OLD.meta_compromisso
            OR NEW.positives IS DISTINCT FROM OLD.positives
            OR NEW.attention_points IS DISTINCT FROM OLD.attention_points
            OR NEW.action IS DISTINCT FROM OLD.action
            OR NEW.notes IS DISTINCT FROM OLD.notes
            OR NEW.team_avg_json IS DISTINCT FROM OLD.team_avg_json
            OR NEW.diagnostic_json IS DISTINCT FROM OLD.diagnostic_json
            OR NEW.commitment_suggested IS DISTINCT FROM OLD.commitment_suggested
            OR NEW.created_at IS DISTINCT FROM OLD.created_at
        THEN
            RAISE EXCEPTION 'Vendedor pode apenas confirmar ciencia do feedback.';
        END IF;

        IF NEW.acknowledged IS DISTINCT FROM true THEN
            RAISE EXCEPTION 'Confirmacao de ciencia deve marcar acknowledged=true.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feedbacks_seller_ack_only ON public.feedbacks;
CREATE TRIGGER feedbacks_seller_ack_only
BEFORE UPDATE ON public.feedbacks
FOR EACH ROW
EXECUTE FUNCTION public.enforce_feedback_seller_ack_only();

REVOKE ALL ON FUNCTION public.enforce_feedback_seller_ack_only() FROM PUBLIC;
