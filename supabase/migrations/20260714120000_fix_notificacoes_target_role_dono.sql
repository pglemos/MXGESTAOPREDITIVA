-- Fixture autorizada MX-MGR-20260713 (regularização de fechamento).
-- trg_expandir_destino_notificacao_regularizacao (20260710170000) espalha a
-- notificação de regularização para gerente e dono vinculados à loja, usando
-- o role cru de vinculos_loja. A constraint legada só aceitava
-- gerente/vendedor/todos, então qualquer loja com sócio (dono) vinculado
-- fazia solicitar_regularizacao_fechamento falhar inteiro (INSERT em lote
-- viola constraint, transação reverte, nenhuma solicitação é criada).
-- Confirmado em produção com as contas de homologação
-- gerente@/dono@mxgestaopreditiva.com.br em 2026-07-14.

ALTER TABLE public.notificacoes
  DROP CONSTRAINT IF EXISTS notifications_target_role_check;

ALTER TABLE public.notificacoes
  ADD CONSTRAINT notifications_target_role_check
  CHECK (target_role = ANY (ARRAY['gerente'::text, 'vendedor'::text, 'todos'::text, 'dono'::text]));

-- Down:
-- ALTER TABLE public.notificacoes DROP CONSTRAINT IF EXISTS notifications_target_role_check;
-- ALTER TABLE public.notificacoes ADD CONSTRAINT notifications_target_role_check
--   CHECK (target_role = ANY (ARRAY['gerente'::text, 'vendedor'::text, 'todos'::text]));
