-- DOWN — remove apenas o índice auxiliar; o ledger permanece intacto.
BEGIN;

DROP INDEX IF EXISTS public.carteira_missao_mutations_user_id_idx;

COMMIT;
