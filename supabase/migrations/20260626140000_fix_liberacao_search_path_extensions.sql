-- Fix: pgcrypto (gen_random_bytes/digest) está instalada no schema `extensions`
-- neste projeto, mas as 3 RPCs de liberação de fechamento (EV-1.6) fixavam
-- `SET search_path = public`, deixando essas funções pgcrypto invisíveis.
--
-- Isso passou no QA estático porque o teste com SUPABASE_SERVICE_ROLE_KEY
-- nunca alcança a chamada de gen_random_bytes/digest: auth.uid() retorna
-- null para a service role e a função já retorna 'Não autenticado.' antes.
-- Só falha de fato com um caller autenticado real (anon key + access token
-- de usuário) — confirmado em produção via teste manual:
--   ERROR 42883: function gen_random_bytes(integer) does not exist
--
-- Efeito em produção: nenhum vendedor real conseguia solicitar liberação
-- de fechamento atrasado (EV-1.6 completamente inoperante para o caso de uso
-- real, apesar de "PASS" no QA gate baseado em revisão estática de código).

ALTER FUNCTION public.solicitar_liberacao_fechamento(date)
  SET search_path = public, extensions;

ALTER FUNCTION public.consultar_liberacao_por_token(text)
  SET search_path = public, extensions;

ALTER FUNCTION public.liberar_fechamento_por_token(text, text)
  SET search_path = public, extensions;

-- Rollback:
--   ALTER FUNCTION public.solicitar_liberacao_fechamento(date) SET search_path = public;
--   ALTER FUNCTION public.consultar_liberacao_por_token(text) SET search_path = public;
--   ALTER FUNCTION public.liberar_fechamento_por_token(text, text) SET search_path = public;
