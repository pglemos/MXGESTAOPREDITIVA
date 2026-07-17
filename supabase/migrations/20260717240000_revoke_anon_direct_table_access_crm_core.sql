BEGIN;

-- Achado Fase 0 (docs/auditorias/2026-07-17-remediacao-central-carteira-inventario.md):
-- anon mantinha INSERT/SELECT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER (default template
-- do Supabase, nunca revogado) nestas 6 tabelas. Nenhuma policy de RLS referencia anon/public
-- nelas (verificado via pg_policies), logo nada legitimo depende desses grants; RLS ja bloqueia
-- SELECT/INSERT/UPDATE/DELETE para anon na pratica, mas TRUNCATE nao e coberto por RLS.
-- Mesmo padrao ja usado em public.execution_actions (zero grants para anon).

REVOKE ALL ON TABLE public.clientes FROM anon;
REVOKE ALL ON TABLE public.oportunidades FROM anon;
REVOKE ALL ON TABLE public.agendamentos FROM anon;
REVOKE ALL ON TABLE public.eventos_comerciais FROM anon;
REVOKE ALL ON TABLE public.notificacoes FROM anon;
REVOKE ALL ON TABLE public.central_execucao_aberturas FROM anon;

COMMIT;

-- DOWN
-- BEGIN;
-- GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.clientes TO anon;
-- GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.oportunidades TO anon;
-- GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.agendamentos TO anon;
-- GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.eventos_comerciais TO anon;
-- GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.notificacoes TO anon;
-- GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.central_execucao_aberturas TO anon;
-- COMMIT;
