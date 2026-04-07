-- MX Security & Multi-tenancy RLS
-- Migration: 20260403000011_mx_security_rls.sql

-- Enable RLS on all canonical tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_delivery_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_meta_rules ENABLE ROW LEVEL SECURITY;

-- Helper to check if user is Admin or Consultor
CREATE OR REPLACE FUNCTION public.is_mx_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role IN ('admin', 'consultor') FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to get user's store_id
CREATE OR REPLACE FUNCTION public.get_my_store_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT store_id FROM public.memberships WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. STORES
CREATE POLICY " MX Admins see all stores" ON public.stores FOR ALL TO authenticated USING (public.is_mx_admin());
CREATE POLICY "Users see their own store" ON public.stores FOR SELECT TO authenticated USING (id = public.get_my_store_id());

-- 2. DAILY CHECKINS
CREATE POLICY "MX Admins see all checkins" ON public.daily_checkins FOR ALL TO authenticated USING (public.is_mx_admin());
CREATE POLICY "Sellers see/edit their own checkins" ON public.daily_checkins FOR ALL TO authenticated USING (seller_user_id = auth.uid());
CREATE POLICY "Managers see all checkins in their store" ON public.daily_checkins FOR SELECT TO authenticated USING (store_id = public.get_my_store_id());

-- 3. STORE SELLERS
CREATE POLICY "MX Admins see all store sellers" ON public.store_sellers FOR ALL TO authenticated USING (public.is_mx_admin());
CREATE POLICY "Users see sellers in their store" ON public.store_sellers FOR SELECT TO authenticated USING (store_id = public.get_my_store_id());

-- 4. RULES & BENCHMARKS (Viewable by everyone in store, editable by admins)
CREATE POLICY "View store rules" ON public.store_benchmarks FOR SELECT TO authenticated USING (store_id = public.get_my_store_id() OR public.is_mx_admin());
CREATE POLICY "Edit store rules" ON public.store_benchmarks FOR ALL TO authenticated USING (public.is_mx_admin());

CREATE POLICY "View meta rules" ON public.store_meta_rules FOR SELECT TO authenticated USING (store_id = public.get_my_store_id() OR public.is_mx_admin());
CREATE POLICY "Edit meta rules" ON public.store_meta_rules FOR ALL TO authenticated USING (public.is_mx_admin());

-- 5. FEEDBACKS & PDIs (Assumed tables, applying same logic)
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MX Admins see all feedbacks" ON public.feedbacks FOR ALL TO authenticated USING (public.is_mx_admin());
CREATE POLICY "Vendedor sees their own feedback" ON public.feedbacks FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Gerente sees store feedbacks" ON public.feedbacks FOR ALL TO authenticated USING (store_id = public.get_my_store_id());

ALTER TABLE public.pdis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MX Admins see all pdis" ON public.pdis FOR ALL TO authenticated USING (public.is_mx_admin());
CREATE POLICY "Vendedor sees their own pdi" ON public.pdis FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Gerente sees store pdis" ON public.pdis FOR ALL TO authenticated USING (store_id = public.get_my_store_id());
