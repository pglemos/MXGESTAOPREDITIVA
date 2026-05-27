-- ============================================================================
-- DRAFT (NOT APPLIED) — MX-2.2 RLS Policies Finais para tabelas score_*
-- ============================================================================
-- Story:     MX-2.2 (docs/stories/story-MX-02-20260527-rls-policies.md)
-- Depende de: 20260527110000_score_engine_schema.sql + 20260527120000_role_rls_helpers.sql
--
-- STATUS: 🛑 DRAFT — NÃO APLICADO em produção.
-- Razão: tightening de policies em prod requer validação de UI (frontend pode
-- consumir tabelas score_* de forma incompatível com policies restritas).
--
-- Para aplicar:
--   1. Renomear arquivo removendo prefixo `.draft_`
--   2. Validar em staging (Supabase branch) que UI continua funcional
--   3. Aplicar via `supabase db push` ou Management API
--   4. Atualizar story MX-2.2 para Done
--
-- ESTRATÉGIA:
--   - Substituir policies temporárias permissivas (USING true) por policies
--     que consomem `current_user_role_codes()` e `user_is_master_loja()`
--   - Manter SELECT permissivo (UI atual depende de leitura ampla)
--   - WRITE restrito por role
--
-- DECISÕES PENDENTES (bloqueiam aplicação):
--   1. score_inputs.scope_id quando scope_type='store' aponta para qual tabela?
--      (provavelmente lojas.id, mas vinculos_loja.store_id é o caminho M:N)
--   2. Como filtrar score_inputs por loja do user? (LEFT JOIN vinculos_loja?)
--   3. Consultor MX pode ver scores de TODAS as lojas onde é consultor (M:N)?
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. score_inputs — leitura permissiva, write restrito a roles operacionais
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS score_inputs_read ON public.score_inputs;
CREATE POLICY score_inputs_read
  ON public.score_inputs
  FOR SELECT
  TO authenticated
  USING (true);  -- permissivo por ora (UI consume amplo)

DROP POLICY IF EXISTS score_inputs_write ON public.score_inputs;
CREATE POLICY score_inputs_write
  ON public.score_inputs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_role(ARRAY['master','director','sales_manager','seller','consultant','admin_mx'])
  );

-- ----------------------------------------------------------------------------
-- 2. score_calculations — leitura permissiva, INSERT só service_role
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS score_calc_read ON public.score_calculations;
CREATE POLICY score_calc_read
  ON public.score_calculations
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS score_calc_insert_service ON public.score_calculations;
CREATE POLICY score_calc_insert_service
  ON public.score_calculations
  FOR INSERT
  TO authenticated
  WITH CHECK (false);  -- bloqueado para todos exceto service_role (que bypass RLS)

-- ----------------------------------------------------------------------------
-- 3. score_history — somente leitura (UPDATE/DELETE bloqueado por trigger)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS score_history_read ON public.score_history;
CREATE POLICY score_history_read
  ON public.score_history
  FOR SELECT
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 4. score_observations — leitura permissiva, INSERT só consultant/master
--    (trigger enforce_observation_author_role já valida, mas dupla camada)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS score_obs_read ON public.score_observations;
CREATE POLICY score_obs_read
  ON public.score_observations
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS score_obs_write ON public.score_observations;
CREATE POLICY score_obs_write
  ON public.score_observations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND public.user_has_role(ARRAY['consultant','master','admin_mx'])
  );

-- ----------------------------------------------------------------------------
-- 5. roles — leitura mantém pública (catálogo)
--    (já configurada em 20260527100000 — não alterar)
-- ----------------------------------------------------------------------------

COMMIT;

-- ============================================================================
-- DOWN (manual rollback) — restaura policies temporárias permissivas de MX-7.1
-- BEGIN;
--   DROP POLICY IF EXISTS score_inputs_read ON public.score_inputs;
--   CREATE POLICY score_inputs_read ON public.score_inputs FOR SELECT TO authenticated USING (true);
--   DROP POLICY IF EXISTS score_inputs_write ON public.score_inputs;
--   CREATE POLICY score_inputs_write ON public.score_inputs FOR INSERT TO authenticated WITH CHECK (true);
--   -- ... (mesma estrutura permissiva para outras tabelas)
-- COMMIT;
-- ============================================================================
