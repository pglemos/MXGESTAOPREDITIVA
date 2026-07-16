-- DOWN for 20260716221000_carteira_missoes_grant_cleanup.sql
-- Restaura os grants TRIGGER/TRUNCATE/REFERENCES a authenticated.

BEGIN;

GRANT TRIGGER, TRUNCATE, REFERENCES ON TABLE public.carteira_missoes TO authenticated;
GRANT TRIGGER, TRUNCATE, REFERENCES ON TABLE public.carteira_missao_itens TO authenticated;

COMMIT;
