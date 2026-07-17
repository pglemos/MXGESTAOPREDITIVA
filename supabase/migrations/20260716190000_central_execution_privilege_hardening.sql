-- Hardening complementar da fila canonica da Central de Execucao.
-- Mantem apenas os privilegios usados pelos fluxos atuais do vendedor e gerente.

BEGIN;

REVOKE ALL ON TABLE public.execution_actions FROM PUBLIC;
REVOKE ALL ON TABLE public.execution_actions FROM anon;

REVOKE DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.execution_actions
  FROM authenticated;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.execution_actions
  TO authenticated;

-- A funcao e pura e nao depende de objetos do schema public.
-- Fixar o search_path elimina resolucao mutavel de nomes.
ALTER FUNCTION public.central_result_allowed(text, text)
  SET search_path = pg_catalog;

COMMIT;
