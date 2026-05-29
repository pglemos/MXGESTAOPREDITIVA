-- ============================================================================
-- Migration: 20260530200000_sprint3_push_subscriptions.sql
-- Sprint:    3 — S3-T5 (Push notifications)
-- PRD:       docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md §4.6 (FR-ALERT-3)
-- Fonte:     .docx §230 (canais: sistema, push, WhatsApp) + ata 2026-05-22 §00:25
-- Owner:     @aiox-master (Orion)
--
-- ESCOPO: schema para subscriptions Web Push (VAPID) por usuario, com upsert
-- idempotente, RPC interna para listar subscriptions ativas de uma loja, e
-- audit minimo de envio.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  endpoint        text NOT NULL UNIQUE,
  p256dh          text NOT NULL,
  auth            text NOT NULL,
  user_agent      text,
  loja_id         uuid REFERENCES public.lojas(id) ON DELETE SET NULL,
  is_active       boolean NOT NULL DEFAULT true,
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON public.push_subscriptions(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_loja
  ON public.push_subscriptions(loja_id) WHERE is_active = true;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subs_read_self ON public.push_subscriptions;
CREATE POLICY push_subs_read_self ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()
         OR public.user_has_role(ARRAY['master','director','consultant','admin_mx']));

DROP POLICY IF EXISTS push_subs_upsert_self ON public.push_subscriptions;
CREATE POLICY push_subs_upsert_self ON public.push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS push_subs_update_self ON public.push_subscriptions;
CREATE POLICY push_subs_update_self ON public.push_subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS push_subs_delete_self ON public.push_subscriptions;
CREATE POLICY push_subs_delete_self ON public.push_subscriptions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Audit minimo
CREATE TABLE IF NOT EXISTS public.push_notifications_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  title           text NOT NULL,
  body            text,
  url             text,
  status          text NOT NULL CHECK (status = ANY (ARRAY['sent','failed','expired'])),
  error           text,
  payload         jsonb,
  sent_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_log_user
  ON public.push_notifications_log(user_id, sent_at DESC);

ALTER TABLE public.push_notifications_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS push_log_read_self_or_admin ON public.push_notifications_log;
CREATE POLICY push_log_read_self_or_admin ON public.push_notifications_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()
         OR public.user_has_role(ARRAY['master','director','consultant','admin_mx']));

COMMIT;
