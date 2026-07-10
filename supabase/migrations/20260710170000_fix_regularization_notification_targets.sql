-- Story MX-AUDIT-20260710 / hotfix de validação transacional
-- O schema legado de notificacoes aceita target_type apenas all/store. As
-- RPCs canônicas usam intenções user/role; este trigger converte essas
-- intenções antes do CHECK e materializa destinatários individuais, que é o
-- formato consumido por useNotifications (recipient_id).

CREATE OR REPLACE FUNCTION public.expandir_destino_notificacao_regularizacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.type <> 'regularizacao' THEN
    RETURN NEW;
  END IF;

  IF NEW.target_type = 'user' THEN
    NEW.target_type := 'all';
    RETURN NEW;
  END IF;

  IF NEW.target_type = 'role' THEN
    INSERT INTO public.notificacoes (
      recipient_id, sender_id, store_id, title, message, target_type,
      target_store_id, target_role, type, priority, link, read, created_at, sent_at
    )
    SELECT DISTINCT
      vl.user_id, NEW.sender_id, NEW.store_id, NEW.title, NEW.message, 'all',
      NEW.target_store_id, vl.role, NEW.type, NEW.priority, NEW.link,
      coalesce(NEW.read, false), coalesce(NEW.created_at, now()), coalesce(NEW.sent_at, now())
      FROM public.vinculos_loja vl
      JOIN public.usuarios u ON u.id = vl.user_id AND u.active = true
     WHERE vl.store_id = coalesce(NEW.target_store_id, NEW.store_id)
       AND coalesce(vl.is_active, true)
       AND (
         vl.role = coalesce(NEW.target_role, 'gerente')
         OR (coalesce(NEW.target_role, 'gerente') = 'gerente' AND vl.role = 'dono')
       );
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_expandir_destino_notificacao_regularizacao ON public.notificacoes;
CREATE TRIGGER trg_expandir_destino_notificacao_regularizacao
BEFORE INSERT ON public.notificacoes
FOR EACH ROW EXECUTE FUNCTION public.expandir_destino_notificacao_regularizacao();

REVOKE ALL ON FUNCTION public.expandir_destino_notificacao_regularizacao() FROM PUBLIC;

