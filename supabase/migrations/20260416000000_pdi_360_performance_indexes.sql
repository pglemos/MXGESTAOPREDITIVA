-- ============================================================
-- STORY-TD-008 (DB-05): PDI 360 Performance Indexes
-- Creates 7 indexes on PDI 360 child tables to eliminate Seq Scans
-- on RPCs get_pdi_print_bundle() and create_pdi_session_bundle()
-- ============================================================

-- pdi_sessoes: lookup by colaborador (RLS policy "Vendedor ve suas sessoes")
CREATE INDEX IF NOT EXISTS pdi_sessoes_colaborador_idx
  ON public.pdi_sessoes (colaborador_id);

-- pdi_sessoes: lookup by gerente (RLS policy "Gerente ve sessoes que criou")
CREATE INDEX IF NOT EXISTS pdi_sessoes_gerente_idx
  ON public.pdi_sessoes (gerente_id);

-- pdi_avaliacoes_competencia: FK lookup (each session has ~18 rows)
CREATE INDEX IF NOT EXISTS pdi_avaliacoes_sessao_idx
  ON public.pdi_avaliacoes_competencia (sessao_id);

-- pdi_plano_acao: FK lookup
CREATE INDEX IF NOT EXISTS pdi_plano_acao_sessao_idx
  ON public.pdi_plano_acao (sessao_id);

-- pdi_plano_acao: partial index for pending actions dashboard
CREATE INDEX IF NOT EXISTS pdi_plano_acao_pending_idx
  ON public.pdi_plano_acao (status, data_conclusao)
  WHERE status IN ('pendente', 'em_andamento');

-- pdi_metas: FK lookup
CREATE INDEX IF NOT EXISTS pdi_metas_sessao_idx
  ON public.pdi_metas (sessao_id);

-- pdi_objetivos_pessoais: FK lookup
CREATE INDEX IF NOT EXISTS pdi_objetivos_sessao_idx
  ON public.pdi_objetivos_pessoais (sessao_id);
