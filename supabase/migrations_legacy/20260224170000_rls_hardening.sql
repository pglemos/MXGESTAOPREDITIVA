-- Hardening RLS and Multi-Tenancy Security
-- Migration to refine access control and ensure strict isolation

-- 1. Ensure commission_rules has agency_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'commission_rules' AND COLUMN_NAME = 'agency_id') THEN
        ALTER TABLE commission_rules ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Enable RLS on commission_rules
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

-- 3. Refine get_user_agency_id (already existing, but ensuring it's optimized)
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
    SELECT agency_id FROM team WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 4. Helper function to check if user is Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM team WHERE id = auth.uid() AND role = 'Admin');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 5. Helper function to check if user has write access (Owner, Manager, or Admin)
CREATE OR REPLACE FUNCTION has_write_access()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM team WHERE id = auth.uid() AND role IN ('Admin', 'Owner', 'Manager'));
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 6. Drop existing overly permissive policies if any
DROP POLICY IF EXISTS "Users can view their agency team" ON team;
DROP POLICY IF EXISTS "Users can view their agency leads" ON leads;
DROP POLICY IF EXISTS "Users can view their agency tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view their agency commissions" ON commissions;
DROP POLICY IF EXISTS "Users can view their agency goals" ON goals;
DROP POLICY IF EXISTS "Users can view their agency notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own agency" ON agencies;

-- 7. New Strict Policies

-- AGENCIES: Only admins can manage, members can view their own
CREATE POLICY "Admins can manage agencies" ON agencies
    FOR ALL USING (is_admin());
CREATE POLICY "Members can view their own agency" ON agencies
    FOR SELECT USING (id = get_user_agency_id());

-- TEAM: Same agency view, restricted write
CREATE POLICY "View same agency team" ON team
    FOR SELECT USING (agency_id = get_user_agency_id() OR is_admin());
CREATE POLICY "Manage same agency team" ON team
    FOR ALL USING ((agency_id = get_user_agency_id() AND has_write_access()) OR is_admin());

-- LEADS: Isolated by agency
CREATE POLICY "Isolate leads by agency" ON leads
    FOR ALL USING (agency_id = get_user_agency_id() OR is_admin());

-- TASKS: Isolated by agency
CREATE POLICY "Isolate tasks by agency" ON tasks
    FOR ALL USING (agency_id = get_user_agency_id() OR is_admin());

-- COMMISSIONS: Isolated by agency
CREATE POLICY "Isolate commissions by agency" ON commissions
    FOR ALL USING (agency_id = get_user_agency_id() OR is_admin());

-- COMMISSION RULES: Isolated by agency
CREATE POLICY "Isolate commission rules by agency" ON commission_rules
    FOR ALL USING (agency_id = get_user_agency_id() OR is_admin());

-- GOALS: Isolated by agency
CREATE POLICY "Isolate goals by agency" ON goals
    FOR ALL USING (agency_id = get_user_agency_id() OR is_admin());

-- NOTIFICATIONS: Isolated by agency
CREATE POLICY "Isolate notifications by agency" ON notifications
    FOR ALL USING (agency_id = get_user_agency_id() OR is_admin());

-- AUDIT LOGS: Isolated by agency
CREATE POLICY "Isolate audit logs by agency" ON audit_logs
    FOR ALL USING (agency_id = get_user_agency_id() OR is_admin());
