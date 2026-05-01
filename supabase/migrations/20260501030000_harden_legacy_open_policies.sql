-- Hardening defensivo para policies legadas permissivas herdadas do baseline.
-- Mantem compatibilidade com ambientes onde algumas tabelas ja foram removidas.

DO $$
BEGIN
  IF to_regclass('public.automation_configs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.automation_configs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Automation access for authenticated" ON public.automation_configs';
    EXECUTE 'DROP POLICY IF EXISTS "Automation access for authenticated anon" ON public.automation_configs';
    EXECUTE 'DROP POLICY IF EXISTS automation_configs_admin_only ON public.automation_configs';
    EXECUTE 'CREATE POLICY automation_configs_admin_only ON public.automation_configs FOR ALL TO authenticated USING (public.eh_administrador_mx() OR public.is_admin()) WITH CHECK (public.eh_administrador_mx() OR public.is_admin())';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.communication_instances') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.communication_instances ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Comms access for authenticated" ON public.communication_instances';
    EXECUTE 'DROP POLICY IF EXISTS "Comms access for authenticated anon" ON public.communication_instances';
    EXECUTE 'DROP POLICY IF EXISTS communication_instances_admin_only ON public.communication_instances';
    EXECUTE 'CREATE POLICY communication_instances_admin_only ON public.communication_instances FOR ALL TO authenticated USING (public.eh_administrador_mx() OR public.is_admin()) WITH CHECK (public.eh_administrador_mx() OR public.is_admin())';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.daily_lead_volumes') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.daily_lead_volumes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Allow read access for all" ON public.daily_lead_volumes';
    EXECUTE 'DROP POLICY IF EXISTS "DLV access for authenticated" ON public.daily_lead_volumes';
    EXECUTE 'DROP POLICY IF EXISTS "DLV access for authenticated anon" ON public.daily_lead_volumes';
    EXECUTE 'DROP POLICY IF EXISTS daily_lead_volumes_admin_only ON public.daily_lead_volumes';
    EXECUTE 'CREATE POLICY daily_lead_volumes_admin_only ON public.daily_lead_volumes FOR ALL TO authenticated USING (public.eh_administrador_mx() OR public.is_admin()) WITH CHECK (public.eh_administrador_mx() OR public.is_admin())';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.inventory') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Inventory access for authenticated" ON public.inventory';
    EXECUTE 'DROP POLICY IF EXISTS "Inventory access for authenticated anon" ON public.inventory';
    EXECUTE 'DROP POLICY IF EXISTS inventory_admin_only ON public.inventory';
    EXECUTE 'CREATE POLICY inventory_admin_only ON public.inventory FOR ALL TO authenticated USING (public.eh_administrador_mx() OR public.is_admin()) WITH CHECK (public.eh_administrador_mx() OR public.is_admin())';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.report_history') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Report history access for authenticated" ON public.report_history';
    EXECUTE 'DROP POLICY IF EXISTS "Report history access for authenticated anon" ON public.report_history';
    EXECUTE 'DROP POLICY IF EXISTS report_history_admin_only ON public.report_history';
    EXECUTE 'CREATE POLICY report_history_admin_only ON public.report_history FOR ALL TO authenticated USING (public.eh_administrador_mx() OR public.is_admin()) WITH CHECK (public.eh_administrador_mx() OR public.is_admin())';
  END IF;
END $$;
