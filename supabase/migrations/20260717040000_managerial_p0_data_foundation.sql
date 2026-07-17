-- MX Performance — Módulo Gerencial P0
-- Autoridade: Especificação Funcional v1.0, §§ 5, 6.8, 7, 9, 14 e 15.
-- Migration forward-only: cria fontes canônicas versionadas sem substituir as tabelas operacionais.

BEGIN;

-- ---------------------------------------------------------------------------
-- Agenda D+1: taxonomia de confirmação separada do status operacional do CRM.
-- ---------------------------------------------------------------------------
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS modalidade public.crm_evento_modalidade,
  ADD COLUMN IF NOT EXISTS confirmation_status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS confirmation_note text,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL;

DO $$
BEGIN
  ALTER TABLE public.agendamentos
    ADD CONSTRAINT agendamentos_confirmation_status_check
    CHECK (confirmation_status IN (
      'pendente', 'whatsapp_aberto', 'confirmado', 'sem_resposta',
      'solicitou_reagendamento', 'cancelou', 'outro'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

UPDATE public.agendamentos
SET confirmation_status = CASE
  WHEN status::text = 'confirmado' THEN 'confirmado'
  ELSE confirmation_status
END,
modalidade = CASE
  WHEN modalidade IS NULL AND tipo::text = 'visita' THEN 'visita_loja'::public.crm_evento_modalidade
  ELSE modalidade
END
WHERE (status::text = 'confirmado' AND confirmation_status = 'pendente')
   OR (modalidade IS NULL AND tipo::text = 'visita');

-- ---------------------------------------------------------------------------
-- Snapshot oficial da Agenda D+1. Lote + itens, sempre append-only/versionado.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.d1_snapshot_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_id uuid NOT NULL REFERENCES public.lancamentos_diarios(id) ON DELETE RESTRICT,
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE RESTRICT,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  reference_date date NOT NULL,
  agenda_date date NOT NULL,
  version integer NOT NULL CHECK (version >= 1),
  appointments_informed integer NOT NULL DEFAULT 0 CHECK (appointments_informed >= 0),
  appointments_detailed integer NOT NULL DEFAULT 0 CHECK (appointments_detailed >= 0),
  appointments_valid integer NOT NULL DEFAULT 0 CHECK (appointments_valid >= 0),
  discipline_score numeric(6,2) NOT NULL DEFAULT 70 CHECK (discipline_score >= 0 AND discipline_score <= 100),
  source_hash text NOT NULL,
  consolidated_at timestamptz NOT NULL DEFAULT now(),
  consolidated_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (closing_id, version)
);

CREATE TABLE IF NOT EXISTS public.d1_snapshot_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.d1_snapshot_batches(id) ON DELETE RESTRICT,
  appointment_id uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE RESTRICT,
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  appointment_at timestamptz NOT NULL,
  channel text,
  appointment_type text,
  modality text,
  confirmation_status text NOT NULL,
  client_name text,
  phone text,
  vehicle text,
  last_contact_at timestamptz,
  source_updated_at timestamptz,
  valid_for_discipline boolean NOT NULL DEFAULT false,
  valid_for_forecast boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_d1_snapshot_batches_store_agenda
  ON public.d1_snapshot_batches(store_id, agenda_date, version DESC);
CREATE INDEX IF NOT EXISTS idx_d1_snapshot_batches_seller_reference
  ON public.d1_snapshot_batches(seller_user_id, reference_date, version DESC);
CREATE INDEX IF NOT EXISTS idx_d1_snapshot_items_batch
  ON public.d1_snapshot_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_d1_snapshot_items_appointment
  ON public.d1_snapshot_items(appointment_id);

-- ---------------------------------------------------------------------------
-- Rotina oficial do gerente e do vendedor + Plano de Sustentação.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manager_daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE RESTRICT,
  reference_date date NOT NULL,
  task_key text NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('resultado','equipe','desenvolvimento','operacao')),
  routine_block text NOT NULL CHECK (routine_block IN (
    'abertura_direcionamento','acompanhamento_execucao','gestao_resultado',
    'pessoas_processos','encerramento_preparacao'
  )),
  origin_module text NOT NULL,
  origin_record_id text,
  seller_user_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  due_at timestamptz NOT NULL,
  priority text NOT NULL CHECK (priority IN ('vencida','critica','atencao','normal','futura')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','completed','partially_completed','rescheduled','not_completed','technical_error'
  )),
  automatic boolean NOT NULL DEFAULT true,
  counts_for_score boolean NOT NULL DEFAULT true,
  completion_mode text CHECK (completion_mode IN ('automatic','manual')),
  completed_at timestamptz,
  completed_by uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  result text,
  observation text,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (manager_user_id, store_id, reference_date, task_key)
);

CREATE TABLE IF NOT EXISTS public.manager_routine_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE RESTRICT,
  reference_date date NOT NULL,
  version integer NOT NULL CHECK (version >= 1),
  opening_points numeric(6,2) NOT NULL DEFAULT 0,
  execution_points numeric(6,2) NOT NULL DEFAULT 0,
  result_points numeric(6,2) NOT NULL DEFAULT 0,
  people_process_points numeric(6,2) NOT NULL DEFAULT 0,
  closing_points numeric(6,2) NOT NULL DEFAULT 0,
  execution_score numeric(6,2) NOT NULL DEFAULT 0 CHECK (execution_score >= 0 AND execution_score <= 100),
  final_status text NOT NULL CHECK (final_status IN ('em_dia','atencao','critico','nao_consolidado','nao_aplicavel')),
  eligible_tasks integer NOT NULL DEFAULT 0,
  completed_tasks integer NOT NULL DEFAULT 0,
  overdue_tasks integer NOT NULL DEFAULT 0,
  technical_errors integer NOT NULL DEFAULT 0,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  consolidated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (manager_user_id, reference_date, version)
);

CREATE TABLE IF NOT EXISTS public.seller_routine_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE RESTRICT,
  reference_date date NOT NULL,
  version integer NOT NULL CHECK (version >= 1),
  eligible boolean NOT NULL DEFAULT true,
  not_applicable_reason text,
  reliable_work_base boolean NOT NULL DEFAULT false,
  access_numerator integer,
  access_denominator integer,
  pending_resolved integer,
  pending_expected integer,
  attack_executed integer,
  attack_expected integer,
  prospecting_executed integer,
  prospecting_expected integer,
  updates_completed integer,
  updates_expected integer,
  closing_points numeric(6,2),
  access_points numeric(6,2),
  pending_points numeric(6,2),
  attack_points numeric(6,2),
  prospecting_points numeric(6,2),
  update_points numeric(6,2),
  execution_score numeric(6,2),
  routine_status text NOT NULL CHECK (routine_status IN (
    'aguardando_inicio','nao_iniciada','em_dia','atencao','critico','erro_geracao','nao_aplicavel'
  )),
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  consolidated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_user_id, reference_date, version),
  CHECK ((eligible = true) OR execution_score IS NULL)
);

CREATE TABLE IF NOT EXISTS public.store_target_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE RESTRICT,
  reference_date date NOT NULL,
  horizon text NOT NULL CHECK (horizon IN ('hoje','esta_semana','esta_dezena','este_mes')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  version integer NOT NULL CHECK (version >= 1),
  monthly_goal numeric(12,2),
  realized numeric(12,2) NOT NULL DEFAULT 0,
  required_sales numeric(12,2),
  required_pace numeric(12,4),
  appointments_per_sale numeric(12,4),
  operational_need numeric(12,2),
  focus_message text,
  business_days_elapsed integer,
  business_days_remaining integer,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  consolidated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, reference_date, horizon, version),
  CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_manager_daily_tasks_manager_date
  ON public.manager_daily_tasks(manager_user_id, reference_date, status);
CREATE INDEX IF NOT EXISTS idx_manager_daily_tasks_store_due
  ON public.manager_daily_tasks(store_id, due_at, status);
CREATE INDEX IF NOT EXISTS idx_manager_routine_snapshots_store_date
  ON public.manager_routine_snapshots(store_id, reference_date, version DESC);
CREATE INDEX IF NOT EXISTS idx_seller_routine_snapshots_store_date
  ON public.seller_routine_snapshots(store_id, reference_date, version DESC);
CREATE INDEX IF NOT EXISTS idx_store_target_plans_store_date
  ON public.store_target_plans(store_id, reference_date, horizon, version DESC);

-- ---------------------------------------------------------------------------
-- RLS: leitura por escopo; escrita direta bloqueada para authenticated.
-- ---------------------------------------------------------------------------
ALTER TABLE public.d1_snapshot_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.d1_snapshot_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_routine_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_routine_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_target_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS d1_snapshot_batches_select ON public.d1_snapshot_batches;
CREATE POLICY d1_snapshot_batches_select ON public.d1_snapshot_batches
FOR SELECT TO authenticated USING (
  seller_user_id = (SELECT auth.uid())
  OR public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id)
  OR public.is_owner_of(store_id)
);

DROP POLICY IF EXISTS d1_snapshot_items_select ON public.d1_snapshot_items;
CREATE POLICY d1_snapshot_items_select ON public.d1_snapshot_items
FOR SELECT TO authenticated USING (
  seller_user_id = (SELECT auth.uid())
  OR public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id)
  OR public.is_owner_of(store_id)
);

DROP POLICY IF EXISTS manager_daily_tasks_select ON public.manager_daily_tasks;
CREATE POLICY manager_daily_tasks_select ON public.manager_daily_tasks
FOR SELECT TO authenticated USING (
  manager_user_id = (SELECT auth.uid())
  OR public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_owner_of(store_id)
);

DROP POLICY IF EXISTS manager_routine_snapshots_select ON public.manager_routine_snapshots;
CREATE POLICY manager_routine_snapshots_select ON public.manager_routine_snapshots
FOR SELECT TO authenticated USING (
  manager_user_id = (SELECT auth.uid())
  OR public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_owner_of(store_id)
);

DROP POLICY IF EXISTS seller_routine_snapshots_select ON public.seller_routine_snapshots;
CREATE POLICY seller_routine_snapshots_select ON public.seller_routine_snapshots
FOR SELECT TO authenticated USING (
  seller_user_id = (SELECT auth.uid())
  OR public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id)
  OR public.is_owner_of(store_id)
);

DROP POLICY IF EXISTS store_target_plans_select ON public.store_target_plans;
CREATE POLICY store_target_plans_select ON public.store_target_plans
FOR SELECT TO authenticated USING (
  public.eh_administrador_mx((SELECT auth.uid()))
  OR public.is_manager_of(store_id)
  OR public.is_owner_of(store_id)
  OR EXISTS (
    SELECT 1 FROM public.vendedores_loja vl
    WHERE vl.store_id = store_target_plans.store_id
      AND vl.seller_user_id = (SELECT auth.uid())
      AND vl.is_active = true
      AND vl.started_at <= CURRENT_DATE
      AND (vl.ended_at IS NULL OR vl.ended_at >= CURRENT_DATE)
  )
);

-- ---------------------------------------------------------------------------
-- D+1 consolidation. Manual callers must have store scope; cron runs without JWT.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consolidate_d1_snapshot(
  p_reference_date date DEFAULT NULL,
  p_store_id uuid DEFAULT NULL,
  p_force boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  local_now timestamp := timezone('America/Sao_Paulo', now());
  target_reference_date date := COALESCE(p_reference_date, (timezone('America/Sao_Paulo', now()))::date - 1);
  caller_id uuid := auth.uid();
  closing_row record;
  batch_id uuid;
  next_version integer;
  informed_count integer;
  detailed_count integer;
  valid_count integer;
  discipline numeric(6,2);
  created_batches integer := 0;
BEGIN
  IF NOT p_force AND local_now::time < time '09:31:00' THEN
    RETURN jsonb_build_object('status','skipped_before_0931','reference_date',target_reference_date);
  END IF;

  IF caller_id IS NOT NULL AND p_store_id IS NULL
     AND NOT public.eh_administrador_mx(caller_id) THEN
    RAISE EXCEPTION 'Informe a loja para consolidar o D+1.' USING ERRCODE = '42501';
  END IF;

  IF caller_id IS NOT NULL AND p_store_id IS NOT NULL
     AND NOT public.eh_administrador_mx(caller_id)
     AND NOT public.is_manager_of(p_store_id)
     AND NOT public.is_owner_of(p_store_id) THEN
    RAISE EXCEPTION 'Usuário sem permissão para consolidar o D+1 desta loja.' USING ERRCODE = '42501';
  END IF;

  FOR closing_row IN
    SELECT ld.*
    FROM public.lancamentos_diarios ld
    WHERE ld.metric_scope = 'daily'
      AND ld.reference_date = target_reference_date
      AND (p_store_id IS NULL OR ld.store_id = p_store_id)
      AND (
        ld.submission_status = 'on_time'
        OR EXISTS (
          SELECT 1
          FROM public.solicitacoes_correcao_lancamento scr
          WHERE scr.checkin_id = ld.id AND scr.status = 'approved'
        )
      )
  LOOP
    SELECT COALESCE(MAX(version),0) + 1
      INTO next_version
    FROM public.d1_snapshot_batches
    WHERE closing_id = closing_row.id;

    informed_count := CASE
      WHEN COALESCE(closing_row.agd_cart_today,0) <> 0 OR COALESCE(closing_row.agd_net_today,0) <> 0
        THEN COALESCE(closing_row.agd_cart_today,0) + COALESCE(closing_row.agd_net_today,0)
      ELSE COALESCE(closing_row.agd_cart,0) + COALESCE(closing_row.agd_net,0)
    END;

    SELECT
      COUNT(*)::integer,
      COUNT(*) FILTER (
        WHERE a.cliente_id IS NOT NULL
          AND a.canal::text IN ('carteira','internet')
      )::integer,
      COUNT(*) FILTER (
        WHERE a.cliente_id IS NOT NULL
          AND a.canal::text IN ('carteira','internet')
          AND a.modalidade IS NOT NULL
      )::integer
    INTO detailed_count, detailed_count, valid_count
    FROM public.agendamentos a
    WHERE a.loja_id = closing_row.store_id
      AND a.seller_user_id = closing_row.seller_user_id
      AND (timezone('America/Sao_Paulo', a.data_hora))::date = target_reference_date + 1
      AND (a.fechamento_id = closing_row.id OR a.fechamento_id IS NULL);

    discipline := CASE
      WHEN informed_count > 0 THEN LEAST(100, 70 + (30.0 * LEAST(valid_count, informed_count) / informed_count))
      ELSE 70
    END;

    INSERT INTO public.d1_snapshot_batches (
      closing_id, store_id, seller_user_id, reference_date, agenda_date, version,
      appointments_informed, appointments_detailed, appointments_valid,
      discipline_score, source_hash, consolidated_by
    ) VALUES (
      closing_row.id, closing_row.store_id, closing_row.seller_user_id,
      target_reference_date, target_reference_date + 1, next_version,
      informed_count, detailed_count, valid_count, discipline,
      md5(concat_ws('|', closing_row.id::text, next_version::text, target_reference_date::text,
        informed_count::text, detailed_count::text, valid_count::text)),
      caller_id
    ) RETURNING id INTO batch_id;

    INSERT INTO public.d1_snapshot_items (
      batch_id, appointment_id, client_id, opportunity_id, store_id, seller_user_id,
      appointment_at, channel, appointment_type, modality, confirmation_status,
      client_name, phone, vehicle, last_contact_at, source_updated_at,
      valid_for_discipline, valid_for_forecast
    )
    SELECT
      batch_id, a.id, a.cliente_id, a.oportunidade_id, a.loja_id, a.seller_user_id,
      a.data_hora, a.canal::text, a.tipo::text, a.modalidade::text, a.confirmation_status,
      c.nome, c.telefone, o.veiculo_interesse, a.last_contact_at, a.updated_at,
      (a.cliente_id IS NOT NULL AND a.canal::text IN ('carteira','internet') AND a.modalidade IS NOT NULL),
      (a.cliente_id IS NOT NULL AND a.confirmation_status = 'confirmado' AND a.modalidade IS NOT NULL)
    FROM public.agendamentos a
    LEFT JOIN public.clientes c ON c.id = a.cliente_id
    LEFT JOIN public.oportunidades o ON o.id = a.oportunidade_id
    WHERE a.loja_id = closing_row.store_id
      AND a.seller_user_id = closing_row.seller_user_id
      AND (timezone('America/Sao_Paulo', a.data_hora))::date = target_reference_date + 1
      AND (a.fechamento_id = closing_row.id OR a.fechamento_id IS NULL);

    created_batches := created_batches + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'status','ok',
    'reference_date',target_reference_date,
    'created_batches',created_batches,
    'consolidated_at',now()
  );
EXCEPTION WHEN others THEN
  PERFORM public.log_rpc_error(
    'consolidate_d1_snapshot', SQLSTATE, SQLERRM, caller_id,
    jsonb_build_object('reference_date',target_reference_date,'store_id',p_store_id)
  );
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.consolidate_d1_snapshot(date,uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consolidate_d1_snapshot(date,uuid,boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.run_d1_consolidation_clock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  local_now timestamp := timezone('America/Sao_Paulo', now());
BEGIN
  IF local_now::time >= time '09:31:00' AND local_now::time < time '10:00:00' THEN
    PERFORM public.consolidate_d1_snapshot(local_now::date - 1, NULL, false);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.run_d1_consolidation_clock() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_d1_consolidation_clock() TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'mx-consolidate-d1-0931';

  PERFORM cron.schedule('mx-consolidate-d1-0931', '31 * * * *',
    'SELECT public.run_d1_consolidation_clock();');
END $$;

-- ---------------------------------------------------------------------------
-- Auditoria tardia D+1: estado anterior/posterior e vínculo ao snapshot oficial.
-- ---------------------------------------------------------------------------
ALTER TABLE public.agenda_d1_late_changes
  ADD COLUMN IF NOT EXISTS previous_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS changed_fields text[],
  ADD COLUMN IF NOT EXISTS official_batch_id uuid REFERENCES public.d1_snapshot_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS authorized boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS authorization_note text;

CREATE OR REPLACE FUNCTION public.log_agenda_d1_late_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  local_now timestamp := timezone('America/Sao_Paulo', now());
  appointment_date date := (timezone('America/Sao_Paulo', NEW.data_hora))::date;
  official_batch uuid;
  fields text[] := ARRAY[]::text[];
BEGIN
  SELECT dsi.batch_id INTO official_batch
  FROM public.d1_snapshot_items dsi
  JOIN public.d1_snapshot_batches dsb ON dsb.id = dsi.batch_id
  WHERE dsi.appointment_id = NEW.id
  ORDER BY dsb.version DESC
  LIMIT 1;

  IF official_batch IS NULL AND local_now::time >= time '09:31:00' THEN
    SELECT dsb.id INTO official_batch
    FROM public.d1_snapshot_batches dsb
    WHERE dsb.store_id = NEW.loja_id
      AND dsb.seller_user_id = NEW.seller_user_id
      AND dsb.agenda_date = appointment_date
    ORDER BY dsb.version DESC
    LIMIT 1;
  END IF;

  IF official_batch IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.data_hora IS DISTINCT FROM NEW.data_hora THEN fields := array_append(fields,'data_hora'); END IF;
    IF OLD.canal IS DISTINCT FROM NEW.canal THEN fields := array_append(fields,'canal'); END IF;
    IF OLD.tipo IS DISTINCT FROM NEW.tipo THEN fields := array_append(fields,'tipo'); END IF;
    IF OLD.modalidade IS DISTINCT FROM NEW.modalidade THEN fields := array_append(fields,'modalidade'); END IF;
    IF OLD.confirmation_status IS DISTINCT FROM NEW.confirmation_status THEN fields := array_append(fields,'confirmation_status'); END IF;
    IF OLD.cliente_id IS DISTINCT FROM NEW.cliente_id THEN fields := array_append(fields,'cliente_id'); END IF;
    IF OLD.oportunidade_id IS DISTINCT FROM NEW.oportunidade_id THEN fields := array_append(fields,'oportunidade_id'); END IF;
  ELSE
    fields := ARRAY['insert'];
  END IF;

  INSERT INTO public.agenda_d1_late_changes (
    agendamento_id, seller_user_id, loja_id, data_hora, operation, changed_at,
    previous_snapshot, snapshot, changed_fields, official_batch_id, actor_id
  ) VALUES (
    NEW.id, NEW.seller_user_id, NEW.loja_id, NEW.data_hora,
    CASE WHEN TG_OP = 'INSERT' THEN 'insert' ELSE 'update' END,
    now(), CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW), fields, official_batch,
    COALESCE(auth.uid(), NEW.updated_by, NEW.created_by)
  );

  RETURN NEW;
EXCEPTION WHEN others THEN
  PERFORM public.log_rpc_error(
    'log_agenda_d1_late_change', SQLSTATE, SQLERRM,
    COALESCE(auth.uid(), NEW.updated_by, NEW.created_by),
    jsonb_build_object('agendamento_id',NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agenda_d1_late_change ON public.agendamentos;
CREATE TRIGGER trg_agenda_d1_late_change
AFTER INSERT OR UPDATE ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.log_agenda_d1_late_change();

-- ---------------------------------------------------------------------------
-- Rotina do Dia: cria apenas tarefas com pendência, usando fontes canônicas.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_manager_daily_tasks(
  p_manager_user_id uuid,
  p_store_id uuid,
  p_reference_date date DEFAULT NULL
)
RETURNS SETOF public.manager_daily_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_date date := COALESCE(p_reference_date, (timezone('America/Sao_Paulo', now()))::date);
  caller_id uuid := auth.uid();
  active_keys text[] := ARRAY[]::text[];
  planned_prospecting integer := 0;
  qualified_count integer := 0;
BEGIN
  IF caller_id IS NOT NULL
     AND caller_id <> p_manager_user_id
     AND NOT public.eh_administrador_mx(caller_id) THEN
    RAISE EXCEPTION 'Não é permitido gerar tarefas para outro gerente.' USING ERRCODE = '42501';
  END IF;

  IF caller_id IS NOT NULL
     AND NOT public.eh_administrador_mx(caller_id)
     AND NOT public.is_manager_of(p_store_id)
     AND NOT public.is_owner_of(p_store_id) THEN
    RAISE EXCEPTION 'Usuário sem escopo nesta loja.' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.lancamentos_diarios ld
    WHERE ld.store_id = p_store_id
      AND ld.metric_scope = 'daily'
      AND ld.reference_date = target_date - 1
      AND ld.submission_status <> 'on_time'
      AND NOT EXISTS (
        SELECT 1 FROM public.solicitacoes_correcao_lancamento scr
        WHERE scr.checkin_id = ld.id AND scr.status = 'approved'
      )
  ) OR EXISTS (
    SELECT 1 FROM public.solicitacoes_correcao_lancamento scr
    WHERE scr.store_id = p_store_id AND scr.status = 'pending'
  ) THEN
    active_keys := array_append(active_keys,'regularizar_fechamento_0930');
    INSERT INTO public.manager_daily_tasks (
      manager_user_id,store_id,reference_date,task_key,title,description,category,
      routine_block,origin_module,due_at,priority,automatic,counts_for_score,source_payload
    ) VALUES (
      p_manager_user_id,p_store_id,target_date,'regularizar_fechamento_0930',
      'Regularizar Fechamento Diário','Há fechamento atrasado ou solicitação pendente.',
      'operacao','abertura_direcionamento','fechamento_diario',
      (target_date + time '09:30') AT TIME ZONE 'America/Sao_Paulo','normal',true,true,
      jsonb_build_object('source','solicitacoes_correcao_lancamento')
    ) ON CONFLICT (manager_user_id,store_id,reference_date,task_key)
      DO UPDATE SET description=EXCLUDED.description,updated_at=now();
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.loja_id = p_store_id
      AND (timezone('America/Sao_Paulo',a.data_hora))::date = target_date
      AND a.confirmation_status IN ('pendente','whatsapp_aberto')
  ) THEN
    active_keys := array_append(active_keys,'confirmar_agendamentos_1030');
    INSERT INTO public.manager_daily_tasks (
      manager_user_id,store_id,reference_date,task_key,title,description,category,
      routine_block,origin_module,due_at,priority,automatic,counts_for_score
    ) VALUES (
      p_manager_user_id,p_store_id,target_date,'confirmar_agendamentos_1030',
      'Confirmar agendamentos do dia','Existem compromissos sem tratamento explícito.',
      'resultado','abertura_direcionamento','fechamento_diario',
      (target_date + time '10:30') AT TIME ZONE 'America/Sao_Paulo','normal',true,true
    ) ON CONFLICT (manager_user_id,store_id,reference_date,task_key)
      DO UPDATE SET description=EXCLUDED.description,updated_at=now();
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.execution_actions ea
    WHERE ea.store_id = p_store_id
      AND ea.automatic = true
      AND ea.active = true
      AND ea.status NOT IN ('completed','cancelled')
      AND (timezone('America/Sao_Paulo',ea.due_at))::date = target_date
  ) THEN
    active_keys := array_append(active_keys,'conferir_plano_ataque_1100');
    INSERT INTO public.manager_daily_tasks (
      manager_user_id,store_id,reference_date,task_key,title,description,category,
      routine_block,origin_module,due_at,priority,automatic,counts_for_score
    ) VALUES (
      p_manager_user_id,p_store_id,target_date,'conferir_plano_ataque_1100',
      'Conferir execução do Plano de Ataque','Há ações previstas ainda não executadas.',
      'equipe','acompanhamento_execucao','rotina_equipe',
      (target_date + time '11:00') AT TIME ZONE 'America/Sao_Paulo','normal',true,true
    ) ON CONFLICT (manager_user_id,store_id,reference_date,task_key)
      DO UPDATE SET description=EXCLUDED.description,updated_at=now();
  END IF;

  SELECT COALESCE(SUM(ps.quantidade),0)::integer INTO planned_prospecting
  FROM public.prospecting_schedule ps
  WHERE ps.ativo = true
    AND ps.dia_semana = EXTRACT(DOW FROM target_date)::integer
    AND (ps.semana_mes IS NULL OR ps.semana_mes = LEAST(4,CEIL(EXTRACT(DAY FROM target_date)/7.0)::integer));

  SELECT COUNT(*)::integer INTO qualified_count
  FROM public.eventos_comerciais ec
  WHERE ec.loja_id = p_store_id
    AND ec.tipo_evento::text = 'cliente_qualificado'
    AND (timezone('America/Sao_Paulo',ec.data_evento))::date = target_date;

  IF planned_prospecting > qualified_count THEN
    active_keys := array_append(active_keys,'conferir_prospeccao_1200');
    INSERT INTO public.manager_daily_tasks (
      manager_user_id,store_id,reference_date,task_key,title,description,category,
      routine_block,origin_module,due_at,priority,automatic,counts_for_score,source_payload
    ) VALUES (
      p_manager_user_id,p_store_id,target_date,'conferir_prospeccao_1200',
      'Conferir prospecção',format('Qualificados %s de %s previstos.',qualified_count,planned_prospecting),
      'resultado','gestao_resultado','rotina_equipe',
      (target_date + time '12:00') AT TIME ZONE 'America/Sao_Paulo','normal',true,true,
      jsonb_build_object('qualified',qualified_count,'planned',planned_prospecting)
    ) ON CONFLICT (manager_user_id,store_id,reference_date,task_key)
      DO UPDATE SET description=EXCLUDED.description,source_payload=EXCLUDED.source_payload,updated_at=now();
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.execution_actions ea
    WHERE ea.store_id = p_store_id
      AND ea.status = 'completed'
      AND (timezone('America/Sao_Paulo',COALESCE(ea.completed_at,ea.updated_at)))::date = target_date
      AND COALESCE((ea.metadata->>'requires_client_update')::boolean,false) = true
      AND COALESCE((ea.metadata->>'client_updated')::boolean,false) = false
  ) THEN
    active_keys := array_append(active_keys,'conferir_atualizacao_clientes_1600');
    INSERT INTO public.manager_daily_tasks (
      manager_user_id,store_id,reference_date,task_key,title,description,category,
      routine_block,origin_module,due_at,priority,automatic,counts_for_score
    ) VALUES (
      p_manager_user_id,p_store_id,target_date,'conferir_atualizacao_clientes_1600',
      'Conferir atualização dos clientes','Existem ações executadas sem atualização correspondente.',
      'equipe','acompanhamento_execucao','rotina_equipe',
      (target_date + time '16:00') AT TIME ZONE 'America/Sao_Paulo','normal',true,true
    ) ON CONFLICT (manager_user_id,store_id,reference_date,task_key)
      DO UPDATE SET description=EXCLUDED.description,updated_at=now();
  END IF;

  UPDATE public.manager_daily_tasks
  SET status='completed',completion_mode='automatic',completed_at=COALESCE(completed_at,now()),
      completed_by=COALESCE(completed_by,p_manager_user_id),updated_at=now()
  WHERE manager_user_id=p_manager_user_id
    AND store_id=p_store_id
    AND reference_date=target_date
    AND automatic=true
    AND status='pending'
    AND NOT (task_key = ANY(active_keys));

  RETURN QUERY
  SELECT * FROM public.manager_daily_tasks mdt
  WHERE mdt.manager_user_id=p_manager_user_id
    AND mdt.store_id=p_store_id
    AND mdt.reference_date=target_date
  ORDER BY mdt.due_at,mdt.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_manager_daily_tasks(uuid,uuid,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_manager_daily_tasks(uuid,uuid,date) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consolidate_manager_routine_snapshot(
  p_manager_user_id uuid,
  p_store_id uuid,
  p_reference_date date DEFAULT NULL
)
RETURNS public.manager_routine_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_date date := COALESCE(p_reference_date,(timezone('America/Sao_Paulo',now()))::date);
  caller_id uuid := auth.uid();
  next_version integer;
  opening numeric(6,2);
  execution numeric(6,2);
  result_score numeric(6,2);
  people numeric(6,2);
  closing_score numeric(6,2);
  total_score numeric(6,2);
  eligible_count integer;
  completed_count integer;
  overdue_count integer;
  technical_count integer;
  inserted public.manager_routine_snapshots;
BEGIN
  IF caller_id IS NOT NULL
     AND caller_id <> p_manager_user_id
     AND NOT public.eh_administrador_mx(caller_id) THEN
    RAISE EXCEPTION 'Não é permitido consolidar a rotina de outro gerente.' USING ERRCODE='42501';
  END IF;

  PERFORM public.refresh_manager_daily_tasks(p_manager_user_id,p_store_id,target_date);

  SELECT COALESCE(MAX(version),0)+1 INTO next_version
  FROM public.manager_routine_snapshots
  WHERE manager_user_id=p_manager_user_id AND reference_date=target_date;

  SELECT
    COUNT(*) FILTER (WHERE status <> 'technical_error' AND counts_for_score = true AND automatic = true)::integer,
    COUNT(*) FILTER (WHERE status='completed' AND counts_for_score = true AND automatic = true)::integer,
    COUNT(*) FILTER (WHERE status='pending' AND due_at < now() AND counts_for_score = true AND automatic = true)::integer,
    COUNT(*) FILTER (WHERE status='technical_error')::integer
  INTO eligible_count,completed_count,overdue_count,technical_count
  FROM public.manager_daily_tasks
  WHERE manager_user_id=p_manager_user_id AND store_id=p_store_id AND reference_date=target_date;

  SELECT
    CASE WHEN COUNT(*)=0 THEN 15 ELSE 15.0*COUNT(*) FILTER (WHERE status='completed')/COUNT(*) END
  INTO opening
  FROM public.manager_daily_tasks
  WHERE manager_user_id=p_manager_user_id AND store_id=p_store_id AND reference_date=target_date
    AND routine_block='abertura_direcionamento' AND status <> 'technical_error'
    AND counts_for_score = true AND automatic = true;

  SELECT CASE WHEN COUNT(*)=0 THEN 30 ELSE 30.0*COUNT(*) FILTER (WHERE status='completed')/COUNT(*) END
  INTO execution FROM public.manager_daily_tasks
  WHERE manager_user_id=p_manager_user_id AND store_id=p_store_id AND reference_date=target_date
    AND routine_block='acompanhamento_execucao' AND status <> 'technical_error'
    AND counts_for_score = true AND automatic = true;

  SELECT CASE WHEN COUNT(*)=0 THEN 25 ELSE 25.0*COUNT(*) FILTER (WHERE status='completed')/COUNT(*) END
  INTO result_score FROM public.manager_daily_tasks
  WHERE manager_user_id=p_manager_user_id AND store_id=p_store_id AND reference_date=target_date
    AND routine_block='gestao_resultado' AND status <> 'technical_error'
    AND counts_for_score = true AND automatic = true;

  SELECT CASE WHEN COUNT(*)=0 THEN 15 ELSE 15.0*COUNT(*) FILTER (WHERE status='completed')/COUNT(*) END
  INTO people FROM public.manager_daily_tasks
  WHERE manager_user_id=p_manager_user_id AND store_id=p_store_id AND reference_date=target_date
    AND routine_block='pessoas_processos' AND status <> 'technical_error'
    AND counts_for_score = true AND automatic = true;

  SELECT CASE WHEN COUNT(*)=0 THEN 15 ELSE 15.0*COUNT(*) FILTER (WHERE status='completed')/COUNT(*) END
  INTO closing_score FROM public.manager_daily_tasks
  WHERE manager_user_id=p_manager_user_id AND store_id=p_store_id AND reference_date=target_date
    AND routine_block='encerramento_preparacao' AND status <> 'technical_error'
    AND counts_for_score = true AND automatic = true;

  total_score := LEAST(100,COALESCE(opening,0)+COALESCE(execution,0)+COALESCE(result_score,0)+COALESCE(people,0)+COALESCE(closing_score,0));

  INSERT INTO public.manager_routine_snapshots (
    manager_user_id,store_id,reference_date,version,opening_points,execution_points,
    result_points,people_process_points,closing_points,execution_score,final_status,
    eligible_tasks,completed_tasks,overdue_tasks,technical_errors,source_payload
  ) VALUES (
    p_manager_user_id,p_store_id,target_date,next_version,opening,execution,result_score,people,closing_score,total_score,
    CASE WHEN total_score>=75 THEN 'em_dia' WHEN total_score>=50 THEN 'atencao' ELSE 'critico' END,
    eligible_count,completed_count,overdue_count,technical_count,
    jsonb_build_object('task_source','manager_daily_tasks')
  ) RETURNING * INTO inserted;

  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.consolidate_manager_routine_snapshot(uuid,uuid,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consolidate_manager_routine_snapshot(uuid,uuid,date) TO authenticated, service_role;

COMMIT;
