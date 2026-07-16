-- Carteira Base44: índice da FK user_id para cascatas e auditoria do ledger.
BEGIN;

CREATE INDEX IF NOT EXISTS carteira_missao_mutations_user_id_idx
  ON public.carteira_missao_mutations (user_id);

COMMIT;

-- DOWN: use supabase/rollbacks/20260716215500_carteira_mission_ledger_user_fk_index.sql.
