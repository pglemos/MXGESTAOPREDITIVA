-- Bloqueia edição estrutural de PDI para vendedor.
-- Vendedor continua podendo ler o próprio PDI e registrar ciência/comentário
-- em feedback; criação, avaliação, metas, ações e status ficam com liderança
-- da loja ou Admin MX.

BEGIN;

DROP POLICY IF EXISTS role_matrix_pdis_insert ON public.pdis;
CREATE POLICY role_matrix_pdis_insert ON public.pdis
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.is_owner_of(store_id)
    OR public.is_manager_of(store_id)
  );

DROP POLICY IF EXISTS role_matrix_pdis_update ON public.pdis;
CREATE POLICY role_matrix_pdis_update ON public.pdis
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR public.is_owner_of(store_id)
    OR public.is_manager_of(store_id)
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_owner_of(store_id)
    OR public.is_manager_of(store_id)
  );

DROP POLICY IF EXISTS "Acesso as metas via sessao" ON public.pdi_metas;
DROP POLICY IF EXISTS pdi_metas_access_operacional ON public.pdi_metas;
DROP POLICY IF EXISTS pdi_metas_write_operacional ON public.pdi_metas;
CREATE POLICY pdi_metas_select_operacional ON public.pdi_metas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.colaborador_id = auth.uid()
          OR s.gerente_id = auth.uid()
        )
    )
  );
CREATE POLICY pdi_metas_write_operacional ON public.pdi_metas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.gerente_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.gerente_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "Acesso as avaliacoes via sessao" ON public.pdi_avaliacoes_competencia;
DROP POLICY IF EXISTS pdi_avaliacoes_access_operacional ON public.pdi_avaliacoes_competencia;
CREATE POLICY pdi_avaliacoes_select_operacional ON public.pdi_avaliacoes_competencia
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.colaborador_id = auth.uid()
          OR s.gerente_id = auth.uid()
        )
    )
  );
CREATE POLICY pdi_avaliacoes_write_operacional ON public.pdi_avaliacoes_competencia
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.gerente_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.gerente_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "Acesso ao plano via sessao" ON public.pdi_plano_acao;
DROP POLICY IF EXISTS pdi_plano_access_operacional ON public.pdi_plano_acao;
CREATE POLICY pdi_plano_select_operacional ON public.pdi_plano_acao
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.colaborador_id = auth.uid()
          OR s.gerente_id = auth.uid()
        )
    )
  );
CREATE POLICY pdi_plano_write_operacional ON public.pdi_plano_acao
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.gerente_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.gerente_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "Acesso aos obj pessoais via sessao" ON public.pdi_objetivos_pessoais;
DROP POLICY IF EXISTS pdi_objetivos_access_operacional ON public.pdi_objetivos_pessoais;
CREATE POLICY pdi_objetivos_select_operacional ON public.pdi_objetivos_pessoais
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.colaborador_id = auth.uid()
          OR s.gerente_id = auth.uid()
        )
    )
  );
CREATE POLICY pdi_objetivos_write_operacional ON public.pdi_objetivos_pessoais
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.gerente_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pdi_sessoes s
      WHERE s.id = sessao_id
        AND (
          public.is_admin()
          OR public.is_owner_of(s.loja_id)
          OR public.is_manager_of(s.loja_id)
          OR s.gerente_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS planos_update ON public.planos_acao;
DROP POLICY IF EXISTS planos_update_leadership ON public.planos_acao;
CREATE POLICY planos_update_leadership ON public.planos_acao
  FOR UPDATE TO authenticated
  USING (public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx']))
  WITH CHECK (public.user_has_role(ARRAY['master','director','sales_manager','consultant','admin_mx']));

REVOKE EXECUTE ON FUNCTION public.vendedor_criar_pdi_acao(uuid, uuid, text, date, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.vendedor_atualizar_pdi_acao(uuid, text, date, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.vendedor_atualizar_pdi_acao_status(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.vendedor_atualizar_pdi_metas(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;

COMMIT;
