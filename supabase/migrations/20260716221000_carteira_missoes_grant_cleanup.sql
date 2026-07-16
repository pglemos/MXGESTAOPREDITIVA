-- Carteira Base44: remove privilégios residuais de authenticated em
-- carteira_missoes/carteira_missao_itens. A migration 21:00 revogou apenas
-- INSERT/UPDATE/DELETE; TRIGGER/TRUNCATE/REFERENCES continuavam concedidos
-- desde a criação das tabelas (20260716190050). Nenhuma dessas operações é
-- exposta pelo PostgREST (sem verbo REST equivalente), mas o escopo deve
-- ficar restrito ao mínimo necessário (SELECT + acesso via RPC SECURITY
-- DEFINER apenas).

BEGIN;

REVOKE TRIGGER, TRUNCATE, REFERENCES ON TABLE public.carteira_missoes FROM authenticated;
REVOKE TRIGGER, TRUNCATE, REFERENCES ON TABLE public.carteira_missao_itens FROM authenticated;

COMMIT;

-- DOWN: use supabase/rollbacks/20260716221000_carteira_missoes_grant_cleanup.sql.
