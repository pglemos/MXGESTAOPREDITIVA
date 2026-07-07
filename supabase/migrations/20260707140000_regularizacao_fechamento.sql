CREATE TABLE IF NOT EXISTS public.regularizacao_fechamento (
  id                                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id                                 uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  vendedor_id                             uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  vendedor_nome                           text,
  data_competencia                        date NOT NULL,
  data_hora_envio                         timestamptz NOT NULL DEFAULT now(),
  status_solicitacao                      text NOT NULL DEFAULT 'Pendente'
                                           CHECK (status_solicitacao IN ('Pendente', 'Aprovada', 'Recusada')),
  tipo_solicitacao                        text NOT NULL DEFAULT 'Regularização de Fechamento',
  motivo_recusa                           text,
  contabilizar_no_sistema                 boolean NOT NULL DEFAULT false,
  regularizado_fora_do_prazo              boolean NOT NULL DEFAULT true,
  enviado_para_aprovacao                  boolean NOT NULL DEFAULT true,
  pontuacao_disciplina_calculada          numeric,
  pontuacao_disciplina_com_penalizacao    numeric,
  leads_carteira                          integer NOT NULL DEFAULT 0,
  leads_internet                          integer NOT NULL DEFAULT 0,
  atendimentos_showroom                   integer NOT NULL DEFAULT 0,
  atendimentos_carteira                   integer NOT NULL DEFAULT 0,
  atendimentos_internet                   integer NOT NULL DEFAULT 0,
  agendamentos_carteira                   integer NOT NULL DEFAULT 0,
  agendamentos_internet                   integer NOT NULL DEFAULT 0,
  created_at                              timestamptz NOT NULL DEFAULT now(),
  updated_at                              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendedor_id, data_competencia)
);
COMMENT ON TABLE public.regularizacao_fechamento IS 'Solicitação de vendedor para regularizar fechamento diário enviado fora do prazo. Substitui a versão anterior baseada em localStorage.';

CREATE INDEX IF NOT EXISTS idx_regularizacao_fechamento_loja ON public.regularizacao_fechamento(loja_id, data_competencia);
CREATE INDEX IF NOT EXISTS idx_regularizacao_fechamento_vendedor ON public.regularizacao_fechamento(vendedor_id, data_competencia);

DROP TRIGGER IF EXISTS trg_regularizacao_fechamento_updated_at ON public.regularizacao_fechamento;
CREATE TRIGGER trg_regularizacao_fechamento_updated_at BEFORE UPDATE ON public.regularizacao_fechamento
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

ALTER TABLE public.regularizacao_fechamento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS regularizacao_fechamento_seller_rw ON public.regularizacao_fechamento;
CREATE POLICY regularizacao_fechamento_seller_rw ON public.regularizacao_fechamento FOR ALL TO authenticated
  USING (vendedor_id = auth.uid())
  WITH CHECK (vendedor_id = auth.uid());

DROP POLICY IF EXISTS regularizacao_fechamento_store_manage ON public.regularizacao_fechamento;
CREATE POLICY regularizacao_fechamento_store_manage ON public.regularizacao_fechamento FOR SELECT TO authenticated
  USING (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id) OR public.user_has_role(ARRAY['admin_mx','master','consultant']));

DROP POLICY IF EXISTS regularizacao_fechamento_store_approve ON public.regularizacao_fechamento;
CREATE POLICY regularizacao_fechamento_store_approve ON public.regularizacao_fechamento FOR UPDATE TO authenticated
  USING (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id) OR public.user_has_role(ARRAY['admin_mx','master','consultant']))
  WITH CHECK (public.is_manager_of(loja_id) OR public.is_owner_of(loja_id) OR public.user_has_role(ARRAY['admin_mx','master','consultant']));

CREATE TABLE IF NOT EXISTS public.d1_audit_log (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id            uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  usuario_nome          text,
  fechamento_id         uuid,
  cliente_id            text,
  data_hora_alteracao   timestamptz NOT NULL DEFAULT now(),
  tipo_alteracao        text NOT NULL,
  valor_anterior         text,
  valor_novo             text,
  created_at            timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.d1_audit_log IS 'Trilha de auditoria de ajustes feitos na janela D+1. Substitui a versão anterior baseada em localStorage.';

CREATE INDEX IF NOT EXISTS idx_d1_audit_log_usuario ON public.d1_audit_log(usuario_id, data_hora_alteracao);

ALTER TABLE public.d1_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS d1_audit_log_seller_rw ON public.d1_audit_log;
CREATE POLICY d1_audit_log_seller_rw ON public.d1_audit_log FOR ALL TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());
