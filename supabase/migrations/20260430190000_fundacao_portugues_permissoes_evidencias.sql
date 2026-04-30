-- Historia FUND-01: padronizacao em portugues, matriz de permissoes e evidencias.
-- Big bang planejado para janela de manutencao com backup previo.

BEGIN;

-- 1. Renomeacao das tabelas principais do dominio.
ALTER TABLE IF EXISTS public.users RENAME TO usuarios;
ALTER TABLE IF EXISTS public.stores RENAME TO lojas;
ALTER TABLE IF EXISTS public.memberships RENAME TO vinculos_loja;
ALTER TABLE IF EXISTS public.store_sellers RENAME TO vendedores_loja;
ALTER TABLE IF EXISTS public.daily_checkins RENAME TO lancamentos_diarios;
ALTER TABLE IF EXISTS public.trainings RENAME TO treinamentos;
ALTER TABLE IF EXISTS public.training_progress RENAME TO progresso_treinamentos;
ALTER TABLE IF EXISTS public.consulting_clients RENAME TO clientes_consultoria;
ALTER TABLE IF EXISTS public.consulting_visits RENAME TO visitas_consultoria;
ALTER TABLE IF EXISTS public.consulting_action_items RENAME TO itens_plano_acao;
ALTER TABLE IF EXISTS public.consulting_strategic_plans RENAME TO planejamentos_estrategicos;
ALTER TABLE IF EXISTS public.consulting_financials RENAME TO financeiro_consultoria;
ALTER TABLE IF EXISTS public.goals RENAME TO metas;
ALTER TABLE IF EXISTS public.goal_logs RENAME TO historico_metas;
ALTER TABLE IF EXISTS public.audit_logs RENAME TO logs_auditoria;

-- 2. Papeis canonicos.
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_role_check;
UPDATE public.usuarios SET role = 'administrador_geral' WHERE role IN ('admin_master', 'master', 'super_admin');
UPDATE public.usuarios SET role = 'administrador_mx' WHERE role = 'admin';
UPDATE public.usuarios SET role = 'consultor_mx' WHERE role = 'consultor';
UPDATE public.usuarios SET role = 'dono' WHERE role = 'owner';
UPDATE public.usuarios SET role = 'gerente' WHERE role = 'manager';
UPDATE public.usuarios SET role = 'vendedor' WHERE role = 'seller';
ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_role_check
  CHECK (role IN ('administrador_geral', 'administrador_mx', 'consultor_mx', 'dono', 'gerente', 'vendedor'));

ALTER TABLE public.vinculos_loja DROP CONSTRAINT IF EXISTS memberships_role_check;
ALTER TABLE public.vinculos_loja DROP CONSTRAINT IF EXISTS vinculos_loja_role_check;
UPDATE public.vinculos_loja SET role = 'dono' WHERE role = 'owner';
UPDATE public.vinculos_loja SET role = 'gerente' WHERE role = 'manager';
UPDATE public.vinculos_loja SET role = 'vendedor' WHERE role = 'seller';
ALTER TABLE public.vinculos_loja
  ADD CONSTRAINT vinculos_loja_role_check
  CHECK (role IN ('dono', 'gerente', 'vendedor'));

-- 3. Catalogo de permissoes.
CREATE TABLE IF NOT EXISTS public.perfis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  nivel integer NOT NULL,
  area_interna_mx boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modulos_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  sensivel boolean NOT NULL DEFAULT false,
  interno_mx boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissoes_modulo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.perfis_permissoes (
  perfil_codigo text NOT NULL REFERENCES public.perfis(codigo) ON DELETE CASCADE,
  modulo_codigo text NOT NULL REFERENCES public.modulos_sistema(codigo) ON DELETE CASCADE,
  permissao_codigo text NOT NULL REFERENCES public.permissoes_modulo(codigo) ON DELETE CASCADE,
  escopo text NOT NULL CHECK (escopo IN ('proprio', 'loja', 'carteira_mx', 'rede_mx', 'anonimizado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (perfil_codigo, modulo_codigo, permissao_codigo)
);

CREATE TABLE IF NOT EXISTS public.logs_acesso_sensivel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  perfil text,
  modulo_codigo text,
  entidade text,
  entidade_id uuid,
  motivo text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.perfis (codigo, nome, nivel, area_interna_mx) VALUES
  ('administrador_geral', 'Administrador Geral', 100, true),
  ('administrador_mx', 'Administrador MX', 90, true),
  ('consultor_mx', 'Consultor MX', 70, true),
  ('dono', 'Dono da loja', 50, false),
  ('gerente', 'Gerente', 40, false),
  ('vendedor', 'Vendedor', 10, false)
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, nivel = EXCLUDED.nivel, area_interna_mx = EXCLUDED.area_interna_mx;

INSERT INTO public.permissoes_modulo (codigo, nome) VALUES
  ('visualizar', 'Visualizar'),
  ('criar', 'Criar'),
  ('editar', 'Editar'),
  ('excluir', 'Excluir'),
  ('exportar', 'Exportar'),
  ('comparar', 'Comparar')
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome;

INSERT INTO public.modulos_sistema (codigo, nome, sensivel, interno_mx) VALUES
  ('lancamentos_diarios', 'Lancamentos diarios', false, false),
  ('metas', 'Metas', false, false),
  ('classificacao', 'Classificacao', false, false),
  ('consultoria', 'Consultoria', true, true),
  ('financeiro', 'Financeiro', true, true),
  ('comparativos', 'Comparativos', true, true),
  ('evidencias', 'Evidencias', true, true)
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, sensivel = EXCLUDED.sensivel, interno_mx = EXCLUDED.interno_mx;

-- 4. Evidencias e documentos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias-consultoria', 'evidencias-consultoria', false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.evidencias_visita (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id uuid NOT NULL REFERENCES public.visitas_consultoria(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('foto', 'anexo', 'ata', 'print', 'documento', 'observacao')),
  nome_arquivo text,
  caminho_storage text,
  content_type text,
  tamanho_bytes bigint,
  observacao text,
  enviado_por uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documentos_loja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid REFERENCES public.lojas(id) ON DELETE CASCADE,
  cliente_consultoria_id uuid REFERENCES public.clientes_consultoria(id) ON DELETE CASCADE,
  visita_id uuid REFERENCES public.visitas_consultoria(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  caminho_storage text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  enviado_por uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

UPDATE public.visitas_consultoria SET status = 'concluida' WHERE status = 'concluída';

ALTER TABLE public.evidencias_visita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_acesso_sensivel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissoes_modulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_permissoes ENABLE ROW LEVEL SECURITY;

-- 5. Helpers de permissao. Mantem nomes novos e nao normaliza consultor para admin.
CREATE OR REPLACE FUNCTION public.papel_usuario(uid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE id = uid AND active = true
$$;

CREATE OR REPLACE FUNCTION public.eh_area_interna_mx(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.papel_usuario(uid) IN ('administrador_geral', 'administrador_mx', 'consultor_mx'), false)
$$;

CREATE OR REPLACE FUNCTION public.eh_administrador_mx(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.papel_usuario(uid) IN ('administrador_geral', 'administrador_mx'), false)
$$;

CREATE OR REPLACE FUNCTION public.tem_papel_loja(p_loja_id uuid, p_papeis text[], uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vinculos_loja v
    WHERE v.user_id = uid
      AND v.store_id = p_loja_id
      AND v.role = ANY (p_papeis)
  )
$$;

CREATE OR REPLACE FUNCTION public.pode_ver_usuario(p_usuario_id uuid, uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_usuario_id = uid
    OR public.eh_area_interna_mx(uid)
    OR EXISTS (
      SELECT 1
      FROM public.vinculos_loja meu
      JOIN public.vinculos_loja alvo ON alvo.store_id = meu.store_id
      WHERE meu.user_id = uid
        AND meu.role IN ('dono', 'gerente')
        AND alvo.user_id = p_usuario_id
    )
$$;

-- Compatibilidade minima para RPCs antigas durante a mesma release. Deve ser removida em historia posterior.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.eh_administrador_mx(auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.normalize_mx_role(p_role text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_role IN ('admin_master', 'master', 'super_admin') THEN 'administrador_geral'
    WHEN p_role = 'admin' THEN 'administrador_mx'
    WHEN p_role = 'consultor' THEN 'consultor_mx'
    WHEN p_role = 'owner' THEN 'dono'
    WHEN p_role = 'manager' THEN 'gerente'
    WHEN p_role = 'seller' THEN 'vendedor'
    ELSE p_role
  END
$$;

CREATE OR REPLACE FUNCTION public.is_consultor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.eh_area_interna_mx(auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.check_user_role_in_store(p_store_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vinculos_loja
    WHERE store_id = p_store_id
      AND user_id = auth.uid()
      AND role = ANY (p_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.has_store_role(p_store_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.check_user_role_in_store(p_store_id, p_roles)
$$;

CREATE OR REPLACE FUNCTION public.is_owner_of(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.eh_administrador_mx(auth.uid()) OR public.check_user_role_in_store(p_store_id, ARRAY['dono'])
$$;

CREATE OR REPLACE FUNCTION public.is_manager_of(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.eh_administrador_mx(auth.uid()) OR public.check_user_role_in_store(p_store_id, ARRAY['gerente'])
$$;

CREATE OR REPLACE FUNCTION public.is_gerente_of(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_manager_of(p_store_id)
$$;

CREATE OR REPLACE FUNCTION public.is_member_of(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.eh_area_interna_mx(auth.uid()) OR public.check_user_role_in_store(p_store_id, ARRAY['dono', 'gerente', 'vendedor'])
$$;

CREATE OR REPLACE FUNCTION public.can_access_consulting_client(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.eh_administrador_mx(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.consulting_assignments ca
      WHERE ca.client_id = p_client_id
        AND ca.user_id = auth.uid()
        AND ca.active = true
    )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := public.normalize_mx_role(COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor'));

  INSERT INTO public.usuarios (id, email, name, role, must_change_password)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role,
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, true)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.usuarios.name),
    role = EXCLUDED.role,
    must_change_password = COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, public.usuarios.must_change_password),
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_orphan_users_after_membership_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'vendedores_loja' THEN
    v_target_user_id := OLD.seller_user_id;
  ELSIF TG_TABLE_NAME = 'vinculos_loja' THEN
    v_target_user_id := OLD.user_id;
  ELSE
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = v_target_user_id
      AND role IN ('administrador_geral', 'administrador_mx', 'consultor_mx')
  ) THEN
    RETURN OLD;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.vendedores_loja
    WHERE seller_user_id = v_target_user_id
      AND is_active = true
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.vinculos_loja
    WHERE user_id = v_target_user_id
  ) THEN
    UPDATE public.usuarios
    SET active = false,
        updated_at = now()
    WHERE id = v_target_user_id
      AND active = true;
  END IF;

  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_manager_on_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_name text;
  v_seller_name text;
BEGIN
  SELECT name INTO v_seller_name FROM public.usuarios WHERE id = COALESCE(NEW.seller_user_id, NEW.user_id);
  SELECT name INTO v_store_name FROM public.lojas WHERE id = NEW.store_id;

  PERFORM pg_notify(
    'manager_routine_events',
    json_build_object(
      'event_type', 'NEW_CHECKIN',
      'store_id', NEW.store_id,
      'seller_id', COALESCE(NEW.seller_user_id, NEW.user_id),
      'seller_name', v_seller_name,
      'store_name', v_store_name,
      'date', COALESCE(NEW.reference_date, NEW.date),
      'timestamp', now()
    )::text
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_manager_on_correction_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_name text;
BEGIN
  SELECT name INTO v_seller_name FROM public.usuarios WHERE id = NEW.seller_id;

  PERFORM pg_notify(
    'manager_routine_events',
    json_build_object(
      'event_type', 'CORRECTION_REQUEST',
      'request_id', NEW.id,
      'store_id', NEW.store_id,
      'seller_id', NEW.seller_id,
      'seller_name', v_seller_name,
      'status', NEW.status,
      'timestamp', now()
    )::text
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_correction_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
BEGIN
  SELECT * INTO v_request
  FROM public.checkin_correction_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitacao nao encontrada ou ja processada.';
  END IF;

  IF NOT (public.eh_administrador_mx(auth.uid()) OR public.is_manager_of(v_request.store_id)) THEN
    RAISE EXCEPTION 'Permissao negada.';
  END IF;

  UPDATE public.lancamentos_diarios
  SET
    leads_prev_day = COALESCE((v_request.requested_values->>'leads_prev_day')::integer, (v_request.requested_values->>'leads')::integer, leads_prev_day),
    agd_cart_today = COALESCE((v_request.requested_values->>'agd_cart_today')::integer, (v_request.requested_values->>'agd_cart')::integer, agd_cart_today),
    agd_net_today = COALESCE((v_request.requested_values->>'agd_net_today')::integer, (v_request.requested_values->>'agd_net')::integer, agd_net_today),
    vnd_porta_prev_day = COALESCE((v_request.requested_values->>'vnd_porta_prev_day')::integer, (v_request.requested_values->>'vnd_porta')::integer, vnd_porta_prev_day),
    vnd_cart_prev_day = COALESCE((v_request.requested_values->>'vnd_cart_prev_day')::integer, (v_request.requested_values->>'vnd_cart')::integer, vnd_cart_prev_day),
    vnd_net_prev_day = COALESCE((v_request.requested_values->>'vnd_net_prev_day')::integer, (v_request.requested_values->>'vnd_net')::integer, vnd_net_prev_day),
    visit_prev_day = COALESCE((v_request.requested_values->>'visit_prev_day')::integer, (v_request.requested_values->>'visitas')::integer, visit_prev_day),
    updated_at = now()
  WHERE id = v_request.checkin_id;

  UPDATE public.checkin_correction_requests
  SET status = 'approved',
      auditor_id = auth.uid(),
      reviewed_at = now()
  WHERE id = request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_import_data(p_log_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw record;
  v_store_id uuid;
  v_seller_id uuid;
  v_ref_date date;
  v_current_status text;
  v_file_hash text;
BEGIN
  SELECT status, file_hash
    INTO v_current_status, v_file_hash
    FROM public.reprocess_logs
   WHERE id = p_log_id
   FOR UPDATE;

  IF v_current_status = 'completed' OR v_current_status = 'processing' THEN
    RAISE EXCEPTION 'Este lote ja foi processado ou esta em execucao (status: %).', v_current_status;
  END IF;

  IF v_file_hash IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.reprocess_logs rl
    WHERE rl.id <> p_log_id
      AND rl.file_hash = v_file_hash
      AND rl.status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Arquivo ja processado anteriormente para este hash.';
  END IF;

  UPDATE public.reprocess_logs
     SET status = 'processing',
         started_at = now()
   WHERE id = p_log_id;

  FOR v_raw IN
    SELECT id, raw_data
    FROM public.raw_imports
    WHERE log_id = p_log_id
  LOOP
    BEGIN
      IF (v_raw.raw_data->>'store_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_store_id := (v_raw.raw_data->>'store_id')::uuid;
      ELSE
        SELECT id INTO v_store_id
        FROM public.lojas
        WHERE name ILIKE COALESCE(v_raw.raw_data->>'LOJA', '')
        LIMIT 1;
      END IF;

      IF (v_raw.raw_data->>'seller_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_seller_id := (v_raw.raw_data->>'seller_id')::uuid;
      ELSE
        SELECT id INTO v_seller_id
        FROM public.usuarios
        WHERE email ILIKE COALESCE(v_raw.raw_data->>'EMAIL', '')
           OR name ILIKE COALESCE(v_raw.raw_data->>'VENDEDOR', '')
        LIMIT 1;
      END IF;

      v_ref_date := (v_raw.raw_data->>'DATA')::date;

      IF v_ref_date > (timezone('America/Sao_Paulo', now()))::date THEN
        RAISE EXCEPTION 'Data de referencia (%) superior ao limite operacional.', v_ref_date;
      END IF;

      IF v_store_id IS NOT NULL AND v_seller_id IS NOT NULL AND v_ref_date IS NOT NULL THEN
        INSERT INTO public.lancamentos_diarios (
          seller_user_id,
          store_id,
          reference_date,
          submitted_at,
          metric_scope,
          leads_prev_day,
          agd_cart_today,
          agd_net_today,
          vnd_porta_prev_day,
          vnd_cart_prev_day,
          vnd_net_prev_day,
          visit_prev_day,
          zero_reason,
          created_by,
          updated_at
        ) VALUES (
          v_seller_id,
          v_store_id,
          v_ref_date,
          now(),
          'daily',
          COALESCE(NULLIF(v_raw.raw_data->>'LEADS', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'AGD_CART', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'AGD_NET', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'VND_PORTA', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'VND_CART', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'VND_NET', '')::integer, 0),
          COALESCE(NULLIF(v_raw.raw_data->>'VISITA', '')::integer, 0),
          NULLIF(v_raw.raw_data->>'MOTIVO_ZERO', ''),
          COALESCE((SELECT triggered_by FROM public.reprocess_logs WHERE id = p_log_id), v_seller_id),
          now()
        )
        ON CONFLICT (seller_user_id, store_id, reference_date)
        DO UPDATE SET
          submitted_at = EXCLUDED.submitted_at,
          leads_prev_day = EXCLUDED.leads_prev_day,
          agd_cart_today = EXCLUDED.agd_cart_today,
          agd_net_today = EXCLUDED.agd_net_today,
          vnd_porta_prev_day = EXCLUDED.vnd_porta_prev_day,
          vnd_cart_prev_day = EXCLUDED.vnd_cart_prev_day,
          vnd_net_prev_day = EXCLUDED.vnd_net_prev_day,
          visit_prev_day = EXCLUDED.visit_prev_day,
          zero_reason = EXCLUDED.zero_reason,
          updated_at = now();

        UPDATE public.reprocess_logs
           SET records_processed = COALESCE(records_processed, 0) + 1,
               rows_processed = COALESCE(rows_processed, 0) + 1
         WHERE id = p_log_id;
      ELSE
        UPDATE public.reprocess_logs
           SET records_failed = COALESCE(records_failed, 0) + 1,
               error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object(
                 'error', 'Entidade nao localizada (Loja ou Vendedor)',
                 'store_found', v_store_id IS NOT NULL,
                 'seller_found', v_seller_id IS NOT NULL,
                 'data', v_raw.raw_data
               )
         WHERE id = p_log_id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.reprocess_logs
         SET records_failed = COALESCE(records_failed, 0) + 1,
             error_log = COALESCE(error_log, '[]'::jsonb) || jsonb_build_object('error', SQLERRM, 'data', v_raw.raw_data)
       WHERE id = p_log_id;
    END;
  END LOOP;

  UPDATE public.reprocess_logs
     SET status = 'completed',
         finished_at = now(),
         processed_at = now()
   WHERE id = p_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_broadcast_notification(
  p_title text,
  p_message text,
  p_type text DEFAULT 'system'::text,
  p_priority text DEFAULT 'medium'::text,
  p_store_id uuid DEFAULT NULL::uuid,
  p_target_role text DEFAULT 'todos'::text,
  p_link text DEFAULT NULL::text,
  p_sender_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record record;
  v_broadcast_id uuid := gen_random_uuid();
BEGIN
  FOR v_user_record IN
    SELECT DISTINCT
      u.id AS user_id,
      CASE WHEN p_store_id IS NULL THEN NULL ELSE p_store_id END AS resolved_store_id
    FROM public.usuarios u
    LEFT JOIN public.vinculos_loja v ON v.user_id = u.id
    WHERE u.active = true
      AND (p_store_id IS NULL OR v.store_id = p_store_id)
      AND (
        p_target_role = 'todos'
        OR u.role = p_target_role
        OR v.role = p_target_role
      )
  LOOP
    INSERT INTO public.notifications (
      recipient_id,
      store_id,
      sender_id,
      broadcast_id,
      title,
      message,
      type,
      priority,
      link,
      read,
      created_at,
      target_type,
      target_store_id,
      target_role,
      sent_at
    ) VALUES (
      v_user_record.user_id,
      v_user_record.resolved_store_id,
      p_sender_id,
      v_broadcast_id,
      p_title,
      p_message,
      p_type,
      p_priority,
      p_link,
      false,
      now(),
      CASE WHEN p_store_id IS NULL THEN 'all' ELSE 'store' END,
      p_store_id,
      CASE WHEN p_target_role = 'todos' THEN NULL ELSE p_target_role END,
      now()
    );
  END LOOP;

  RETURN v_broadcast_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_dre(p_row public.financeiro_consultoria)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_gross_margin numeric;
  v_total_deductions numeric;
  v_net_sales_margin numeric;
  v_other_revenue numeric;
  v_gross_profit numeric;
  v_total_payroll numeric;
  v_total_fixed numeric;
  v_total_expenses numeric;
  v_net_profit numeric;
  v_avg_ticket numeric;
  v_margin_per_car numeric;
  v_net_margin_per_car numeric;
  v_prep_cost_per_car numeric;
  v_posvenda_per_car numeric;
  v_profit_per_car numeric;
  v_rentability numeric;
BEGIN
  v_gross_margin := COALESCE(p_row.revenue_proprios,0) + COALESCE(p_row.revenue_consignados,0) + COALESCE(p_row.revenue_repasse,0);
  v_total_deductions := COALESCE(p_row.ded_preparacao,0) + COALESCE(p_row.ded_comissoes,0) + COALESCE(p_row.ded_impostos,0);
  v_net_sales_margin := v_gross_margin - v_total_deductions;
  v_other_revenue := COALESCE(p_row.other_revenue_financiamento,0) + COALESCE(p_row.other_revenue_outros1,0) + COALESCE(p_row.other_revenue_outros2,0) + COALESCE(p_row.other_revenue_outros3,0);
  v_gross_profit := v_net_sales_margin + v_other_revenue;
  v_total_payroll := COALESCE(p_row.payroll_salarios,0) + COALESCE(p_row.payroll_inss,0) + COALESCE(p_row.payroll_fgts,0) + COALESCE(p_row.payroll_seguro_social,0) + COALESCE(p_row.payroll_tempo_servico,0) + COALESCE(p_row.payroll_13salario,0) + COALESCE(p_row.payroll_ferias,0) + COALESCE(p_row.payroll_indenizacao,0) + COALESCE(p_row.payroll_outros,0);
  v_total_fixed := COALESCE(p_row.exp_fornecedores,0) + COALESCE(p_row.exp_agua,0) + COALESCE(p_row.exp_limpeza,0) + COALESCE(p_row.exp_viagens,0) + COALESCE(p_row.exp_energia,0) + COALESCE(p_row.exp_telefone,0) + COALESCE(p_row.exp_contabilidade,0) + COALESCE(p_row.exp_aluguel,0) + COALESCE(p_row.exp_frete,0) + COALESCE(p_row.exp_contribuicoes,0) + COALESCE(p_row.exp_terceiros,0) + COALESCE(p_row.exp_marketing,0) + COALESCE(p_row.exp_iptu,0) + COALESCE(p_row.exp_combustivel,0) + COALESCE(p_row.exp_manutencao_imovel,0) + COALESCE(p_row.exp_seguranca,0) + COALESCE(p_row.exp_cartorio,0) + COALESCE(p_row.exp_pos_venda,0) + COALESCE(p_row.exp_ir_csll,0) + COALESCE(p_row.exp_sistemas,0) + COALESCE(p_row.exp_emprestimo_pf,0) + COALESCE(p_row.exp_emprestimo_pj,0) + COALESCE(p_row.exp_tarifas,0) + COALESCE(p_row.exp_informatica,0) + COALESCE(p_row.exp_treinamentos,0) + COALESCE(p_row.exp_outras,0);
  v_total_expenses := v_total_payroll + COALESCE(p_row.pro_labore,0) + v_total_fixed;
  v_net_profit := v_gross_profit - v_total_expenses;
  v_avg_ticket := CASE WHEN COALESCE(p_row.volume_vendas,0) > 0 THEN v_gross_margin / p_row.volume_vendas ELSE 0 END;
  v_margin_per_car := CASE WHEN COALESCE(p_row.volume_vendas,0) > 0 THEN v_gross_margin / p_row.volume_vendas ELSE 0 END;
  v_net_margin_per_car := CASE WHEN COALESCE(p_row.volume_vendas,0) > 0 THEN v_net_sales_margin / p_row.volume_vendas ELSE 0 END;
  v_prep_cost_per_car := CASE WHEN COALESCE(p_row.volume_vendas,0) > 0 THEN COALESCE(p_row.ded_preparacao,0) / p_row.volume_vendas ELSE 0 END;
  v_posvenda_per_car := CASE WHEN COALESCE(p_row.volume_vendas,0) > 0 THEN COALESCE(p_row.exp_pos_venda,0) / p_row.volume_vendas ELSE 0 END;
  v_profit_per_car := CASE WHEN COALESCE(p_row.volume_vendas,0) > 0 THEN v_net_profit / p_row.volume_vendas ELSE 0 END;
  v_rentability := CASE WHEN COALESCE(p_row.capital_proprio,0) > 0 THEN v_net_profit / p_row.capital_proprio ELSE 0 END;

  RETURN jsonb_build_object(
    'gross_margin', v_gross_margin,
    'total_deductions', v_total_deductions,
    'net_sales_margin', v_net_sales_margin,
    'other_revenue', v_other_revenue,
    'gross_profit', v_gross_profit,
    'total_payroll', v_total_payroll,
    'total_fixed', v_total_fixed,
    'pro_labore', COALESCE(p_row.pro_labore,0),
    'total_expenses', v_total_expenses,
    'net_profit', v_net_profit,
    'avg_ticket', ROUND(v_avg_ticket, 2),
    'margin_per_car', ROUND(v_margin_per_car, 2),
    'net_margin_per_car', ROUND(v_net_margin_per_car, 2),
    'prep_cost_per_car', ROUND(v_prep_cost_per_car, 2),
    'posvenda_per_car', ROUND(v_posvenda_per_car, 2),
    'profit_per_car', ROUND(v_profit_per_car, 2),
    'rentability', ROUND(v_rentability, 4)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.concluir_visita_consultoria(p_visita_id uuid)
RETURNS public.visitas_consultoria
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visita public.visitas_consultoria;
  v_exige_evidencia boolean;
  v_tem_evidencia boolean;
BEGIN
  SELECT * INTO v_visita FROM public.visitas_consultoria WHERE id = p_visita_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visita nao encontrada';
  END IF;

  v_exige_evidencia := EXISTS (
    SELECT 1
    FROM public.consulting_visit_template_steps s
    JOIN public.clientes_consultoria c ON c.id = v_visita.client_id
    WHERE s.program_key = COALESCE(c.program_template_key, 'pmr_7')
      AND s.visit_number = v_visita.visit_number
      AND NULLIF(BTRIM(COALESCE(s.evidence_required, '')), '') IS NOT NULL
  );

  v_tem_evidencia := EXISTS (
    SELECT 1 FROM public.evidencias_visita e WHERE e.visita_id = p_visita_id
  );

  IF v_exige_evidencia AND NOT v_tem_evidencia THEN
    RAISE EXCEPTION 'Esta visita exige evidencia antes da conclusao';
  END IF;

  UPDATE public.visitas_consultoria
  SET status = 'concluida', updated_at = now()
  WHERE id = p_visita_id
  RETURNING * INTO v_visita;

  RETURN v_visita;
END;
$$;

-- 6. Policies essenciais.
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vinculos_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendedores_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_consultoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitas_consultoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_consultoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.usuarios;
DROP POLICY IF EXISTS "Public profiles for authenticated" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.usuarios;
DROP POLICY IF EXISTS users_insert ON public.usuarios;
DROP POLICY IF EXISTS users_select ON public.usuarios;
DROP POLICY IF EXISTS users_update_own ON public.usuarios;
DROP POLICY IF EXISTS usuarios_select ON public.usuarios;
CREATE POLICY usuarios_select ON public.usuarios
  FOR SELECT TO authenticated
  USING (public.pode_ver_usuario(id));
DROP POLICY IF EXISTS usuarios_insert ON public.usuarios;
CREATE POLICY usuarios_insert ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (public.eh_administrador_mx());
DROP POLICY IF EXISTS usuarios_update ON public.usuarios;
CREATE POLICY usuarios_update ON public.usuarios
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.eh_administrador_mx())
  WITH CHECK (id = auth.uid() OR public.eh_administrador_mx());

DROP POLICY IF EXISTS mx_evolution_stores_update_admin ON public.lojas;
DROP POLICY IF EXISTS role_matrix_stores_delete ON public.lojas;
DROP POLICY IF EXISTS role_matrix_stores_insert ON public.lojas;
DROP POLICY IF EXISTS role_matrix_stores_select ON public.lojas;
DROP POLICY IF EXISTS role_matrix_stores_update ON public.lojas;
DROP POLICY IF EXISTS lojas_select ON public.lojas;
CREATE POLICY lojas_select ON public.lojas
  FOR SELECT TO authenticated
  USING (public.eh_area_interna_mx() OR public.tem_papel_loja(id, ARRAY['dono', 'gerente', 'vendedor']));
DROP POLICY IF EXISTS lojas_insert ON public.lojas;
CREATE POLICY lojas_insert ON public.lojas
  FOR INSERT TO authenticated
  WITH CHECK (public.eh_administrador_mx());
DROP POLICY IF EXISTS lojas_update ON public.lojas;
CREATE POLICY lojas_update ON public.lojas
  FOR UPDATE TO authenticated
  USING (public.eh_administrador_mx())
  WITH CHECK (public.eh_administrador_mx());
DROP POLICY IF EXISTS lojas_delete ON public.lojas;
CREATE POLICY lojas_delete ON public.lojas
  FOR DELETE TO authenticated
  USING (public.eh_administrador_mx());

DROP POLICY IF EXISTS "Managers can view store memberships" ON public.vinculos_loja;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.vinculos_loja;
DROP POLICY IF EXISTS role_matrix_memberships_select ON public.vinculos_loja;
DROP POLICY IF EXISTS role_matrix_memberships_write ON public.vinculos_loja;
DROP POLICY IF EXISTS vinculos_loja_select ON public.vinculos_loja;
CREATE POLICY vinculos_loja_select ON public.vinculos_loja
  FOR SELECT TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR user_id = auth.uid()
    OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
  );
DROP POLICY IF EXISTS vinculos_loja_write ON public.vinculos_loja;
CREATE POLICY vinculos_loja_write ON public.vinculos_loja
  FOR ALL TO authenticated
  USING (public.eh_administrador_mx())
  WITH CHECK (public.eh_administrador_mx());

DROP POLICY IF EXISTS role_matrix_store_sellers_select ON public.vendedores_loja;
DROP POLICY IF EXISTS role_matrix_store_sellers_write ON public.vendedores_loja;
DROP POLICY IF EXISTS store_sellers_select ON public.vendedores_loja;
DROP POLICY IF EXISTS vendedores_loja_select ON public.vendedores_loja;
CREATE POLICY vendedores_loja_select ON public.vendedores_loja
  FOR SELECT TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR seller_user_id = auth.uid()
    OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
  );
DROP POLICY IF EXISTS vendedores_loja_write ON public.vendedores_loja;
CREATE POLICY vendedores_loja_write ON public.vendedores_loja
  FOR ALL TO authenticated
  USING (public.eh_administrador_mx())
  WITH CHECK (public.eh_administrador_mx());

DROP POLICY IF EXISTS daily_checkins_select ON public.lancamentos_diarios;
DROP POLICY IF EXISTS role_matrix_daily_checkins_insert ON public.lancamentos_diarios;
DROP POLICY IF EXISTS role_matrix_daily_checkins_select ON public.lancamentos_diarios;
DROP POLICY IF EXISTS role_matrix_daily_checkins_update ON public.lancamentos_diarios;
DROP POLICY IF EXISTS lancamentos_diarios_select ON public.lancamentos_diarios;
CREATE POLICY lancamentos_diarios_select ON public.lancamentos_diarios
  FOR SELECT TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
    OR seller_user_id = auth.uid()
  );
DROP POLICY IF EXISTS lancamentos_diarios_insert ON public.lancamentos_diarios;
CREATE POLICY lancamentos_diarios_insert ON public.lancamentos_diarios
  FOR INSERT TO authenticated
  WITH CHECK (public.eh_area_interna_mx() OR seller_user_id = auth.uid());
DROP POLICY IF EXISTS lancamentos_diarios_update ON public.lancamentos_diarios;
CREATE POLICY lancamentos_diarios_update ON public.lancamentos_diarios
  FOR UPDATE TO authenticated
  USING (public.eh_area_interna_mx() OR seller_user_id = auth.uid())
  WITH CHECK (public.eh_area_interna_mx() OR seller_user_id = auth.uid());

DROP POLICY IF EXISTS role_matrix_goals_insert ON public.metas;
DROP POLICY IF EXISTS role_matrix_goals_select ON public.metas;
DROP POLICY IF EXISTS role_matrix_goals_update ON public.metas;
DROP POLICY IF EXISTS metas_select ON public.metas;
CREATE POLICY metas_select ON public.metas
  FOR SELECT TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR public.tem_papel_loja(store_id, ARRAY['dono', 'gerente'])
    OR user_id = auth.uid()
  );
DROP POLICY IF EXISTS metas_insert ON public.metas;
CREATE POLICY metas_insert ON public.metas
  FOR INSERT TO authenticated
  WITH CHECK (public.eh_administrador_mx() OR public.tem_papel_loja(store_id, ARRAY['gerente']));
DROP POLICY IF EXISTS metas_update ON public.metas;
CREATE POLICY metas_update ON public.metas
  FOR UPDATE TO authenticated
  USING (public.eh_administrador_mx() OR public.tem_papel_loja(store_id, ARRAY['gerente']))
  WITH CHECK (public.eh_administrador_mx() OR public.tem_papel_loja(store_id, ARRAY['gerente']));

DROP POLICY IF EXISTS goal_logs_insert ON public.historico_metas;
DROP POLICY IF EXISTS goal_logs_select ON public.historico_metas;
DROP POLICY IF EXISTS historico_metas_select ON public.historico_metas;
CREATE POLICY historico_metas_select ON public.historico_metas
  FOR SELECT TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR EXISTS (
      SELECT 1
      FROM public.metas m
      WHERE m.id = goal_id
        AND (m.user_id = auth.uid() OR public.tem_papel_loja(m.store_id, ARRAY['dono', 'gerente']))
    )
  );
DROP POLICY IF EXISTS historico_metas_insert ON public.historico_metas;
CREATE POLICY historico_metas_insert ON public.historico_metas
  FOR INSERT TO authenticated
  WITH CHECK (public.eh_area_interna_mx() OR public.pode_ver_usuario(changed_by));

DROP POLICY IF EXISTS consulting_clients_delete ON public.clientes_consultoria;
DROP POLICY IF EXISTS consulting_clients_insert ON public.clientes_consultoria;
DROP POLICY IF EXISTS consulting_clients_select ON public.clientes_consultoria;
DROP POLICY IF EXISTS consulting_clients_update ON public.clientes_consultoria;
DROP POLICY IF EXISTS clientes_consultoria_select ON public.clientes_consultoria;
CREATE POLICY clientes_consultoria_select ON public.clientes_consultoria
  FOR SELECT TO authenticated
  USING (public.can_access_consulting_client(id));
DROP POLICY IF EXISTS clientes_consultoria_write ON public.clientes_consultoria;
CREATE POLICY clientes_consultoria_write ON public.clientes_consultoria
  FOR ALL TO authenticated
  USING (public.eh_administrador_mx())
  WITH CHECK (public.eh_administrador_mx());

DROP POLICY IF EXISTS consulting_visits_select ON public.visitas_consultoria;
DROP POLICY IF EXISTS consulting_visits_write ON public.visitas_consultoria;
DROP POLICY IF EXISTS visitas_consultoria_select ON public.visitas_consultoria;
CREATE POLICY visitas_consultoria_select ON public.visitas_consultoria
  FOR SELECT TO authenticated
  USING (public.can_access_consulting_client(client_id));
DROP POLICY IF EXISTS visitas_consultoria_write ON public.visitas_consultoria;
CREATE POLICY visitas_consultoria_write ON public.visitas_consultoria
  FOR ALL TO authenticated
  USING (public.eh_area_interna_mx())
  WITH CHECK (public.eh_area_interna_mx());

DROP POLICY IF EXISTS consulting_financials_select ON public.financeiro_consultoria;
DROP POLICY IF EXISTS consulting_financials_write ON public.financeiro_consultoria;
DROP POLICY IF EXISTS financeiro_consultoria_select ON public.financeiro_consultoria;
CREATE POLICY financeiro_consultoria_select ON public.financeiro_consultoria
  FOR SELECT TO authenticated
  USING (public.eh_administrador_mx());
DROP POLICY IF EXISTS financeiro_consultoria_write ON public.financeiro_consultoria;
CREATE POLICY financeiro_consultoria_write ON public.financeiro_consultoria
  FOR ALL TO authenticated
  USING (public.eh_administrador_mx())
  WITH CHECK (public.eh_administrador_mx());

DROP POLICY IF EXISTS audit_insert ON public.logs_auditoria;
DROP POLICY IF EXISTS audit_select ON public.logs_auditoria;
DROP POLICY IF EXISTS logs_auditoria_select ON public.logs_auditoria;
CREATE POLICY logs_auditoria_select ON public.logs_auditoria
  FOR SELECT TO authenticated
  USING (public.eh_administrador_mx());
DROP POLICY IF EXISTS logs_auditoria_insert ON public.logs_auditoria;
CREATE POLICY logs_auditoria_insert ON public.logs_auditoria
  FOR INSERT TO authenticated
  WITH CHECK (public.eh_area_interna_mx() OR user_id = auth.uid());

DROP POLICY IF EXISTS evidencias_visita_select ON public.evidencias_visita;
CREATE POLICY evidencias_visita_select ON public.evidencias_visita
  FOR SELECT TO authenticated
  USING (public.eh_area_interna_mx());

DROP POLICY IF EXISTS evidencias_visita_write ON public.evidencias_visita;
CREATE POLICY evidencias_visita_write ON public.evidencias_visita
  FOR ALL TO authenticated
  USING (public.eh_area_interna_mx())
  WITH CHECK (public.eh_area_interna_mx());

DROP POLICY IF EXISTS documentos_loja_select ON public.documentos_loja;
CREATE POLICY documentos_loja_select ON public.documentos_loja
  FOR SELECT TO authenticated
  USING (
    public.eh_area_interna_mx()
    OR (loja_id IS NOT NULL AND public.tem_papel_loja(loja_id, ARRAY['dono', 'gerente']))
  );

DROP POLICY IF EXISTS documentos_loja_write ON public.documentos_loja;
CREATE POLICY documentos_loja_write ON public.documentos_loja
  FOR ALL TO authenticated
  USING (public.eh_area_interna_mx())
  WITH CHECK (public.eh_area_interna_mx());

DROP POLICY IF EXISTS perfis_select ON public.perfis;
CREATE POLICY perfis_select ON public.perfis FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS modulos_sistema_select ON public.modulos_sistema;
CREATE POLICY modulos_sistema_select ON public.modulos_sistema FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS permissoes_modulo_select ON public.permissoes_modulo;
CREATE POLICY permissoes_modulo_select ON public.permissoes_modulo FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS perfis_permissoes_select ON public.perfis_permissoes;
CREATE POLICY perfis_permissoes_select ON public.perfis_permissoes FOR SELECT TO authenticated USING (public.eh_area_interna_mx());

DROP POLICY IF EXISTS logs_acesso_sensivel_select ON public.logs_acesso_sensivel;
CREATE POLICY logs_acesso_sensivel_select ON public.logs_acesso_sensivel FOR SELECT TO authenticated USING (public.eh_administrador_mx());

DROP POLICY IF EXISTS logs_acesso_sensivel_insert ON public.logs_acesso_sensivel;
CREATE POLICY logs_acesso_sensivel_insert ON public.logs_acesso_sensivel FOR INSERT TO authenticated WITH CHECK (public.eh_area_interna_mx());

DROP POLICY IF EXISTS evidencias_consultoria_select ON storage.objects;
CREATE POLICY evidencias_consultoria_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'evidencias-consultoria' AND public.eh_area_interna_mx());

DROP POLICY IF EXISTS evidencias_consultoria_insert ON storage.objects;
CREATE POLICY evidencias_consultoria_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidencias-consultoria' AND public.eh_area_interna_mx());

DROP POLICY IF EXISTS evidencias_consultoria_update ON storage.objects;
CREATE POLICY evidencias_consultoria_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'evidencias-consultoria' AND public.eh_area_interna_mx())
  WITH CHECK (bucket_id = 'evidencias-consultoria' AND public.eh_area_interna_mx());

DROP POLICY IF EXISTS evidencias_consultoria_delete ON storage.objects;
CREATE POLICY evidencias_consultoria_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'evidencias-consultoria' AND public.eh_area_interna_mx());

-- 7. Views operacionais recriadas com tabelas em portugues.
CREATE OR REPLACE VIEW public.view_daily_team_status AS
WITH reference_clock AS (
  SELECT timezone('America/Sao_Paulo'::text, now())::date - 1 AS reference_date
)
SELECT
  vl.store_id,
  l.name AS store_name,
  vl.seller_user_id AS seller_id,
  u.name AS seller_name,
  rc.reference_date,
  ld.id AS checkin_id,
  ld.id IS NULL AS sem_registro,
  ld.submission_status,
  ld.submitted_at,
  ld.submitted_late,
  vl.started_at,
  vl.ended_at,
  vl.closing_month_grace
FROM public.vendedores_loja vl
JOIN public.usuarios u ON u.id = vl.seller_user_id
JOIN public.lojas l ON l.id = vl.store_id
CROSS JOIN reference_clock rc
LEFT JOIN public.lancamentos_diarios ld
  ON ld.seller_user_id = vl.seller_user_id
 AND ld.store_id = vl.store_id
 AND ld.reference_date = rc.reference_date
 AND ld.metric_scope = 'daily'::checkin_scope
WHERE vl.is_active = true
  AND vl.started_at <= rc.reference_date
  AND (vl.ended_at IS NULL OR vl.ended_at >= rc.reference_date);

CREATE OR REPLACE VIEW public.view_seller_tenure_status AS
SELECT
  vl.id AS tenure_id,
  vl.store_id,
  l.name AS store_name,
  vl.seller_user_id,
  u.name AS seller_name,
  vl.started_at,
  vl.ended_at,
  vl.is_active,
  vl.closing_month_grace,
  CASE
    WHEN vl.is_active AND (vl.ended_at IS NULL OR vl.ended_at >= timezone('America/Sao_Paulo'::text, now())::date) THEN 'ativo'::text
    ELSE 'encerrado'::text
  END AS tenure_status,
  timezone('America/Sao_Paulo'::text, now())::date AS operational_date
FROM public.vendedores_loja vl
JOIN public.usuarios u ON u.id = vl.seller_user_id
JOIN public.lojas l ON l.id = vl.store_id;

CREATE OR REPLACE VIEW public.view_sem_registro AS
SELECT
  vl.store_id,
  vl.seller_user_id,
  CURRENT_DATE AS reference_date,
  vl.started_at,
  vl.closing_month_grace
FROM public.vendedores_loja vl
LEFT JOIN public.lancamentos_diarios ld
  ON ld.seller_user_id = vl.seller_user_id
 AND ld.store_id = vl.store_id
 AND ld.reference_date = CURRENT_DATE
WHERE vl.is_active = true
  AND vl.started_at <= CURRENT_DATE
  AND (vl.ended_at IS NULL OR vl.ended_at >= CURRENT_DATE)
  AND ld.id IS NULL;

CREATE OR REPLACE VIEW public.view_store_daily_production AS
SELECT
  ld.store_id,
  ld.reference_date,
  sum(ld.leads_prev_day) AS total_leads,
  sum(ld.visit_prev_day) AS total_visits,
  sum(ld.agd_cart_today + ld.agd_net_today) AS total_agendamentos,
  sum(
    CASE
      WHEN COALESCE(u.is_venda_loja, false) THEN
        CASE
          WHEN COALESCE(smr.include_venda_loja_in_store_total, true) THEN ld.vnd_porta_prev_day + ld.vnd_cart_prev_day + ld.vnd_net_prev_day
          ELSE 0
        END
      ELSE ld.vnd_porta_prev_day + ld.vnd_cart_prev_day + ld.vnd_net_prev_day
    END
  ) AS total_vendas
FROM public.lancamentos_diarios ld
JOIN public.usuarios u ON u.id = ld.seller_user_id
LEFT JOIN public.store_meta_rules smr ON smr.store_id = ld.store_id
GROUP BY ld.store_id, ld.reference_date;

COMMIT;
