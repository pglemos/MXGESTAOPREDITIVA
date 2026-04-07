-- 1. Create Agencies Table
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add agency_id to all relevant tables
-- Note: Using DO block to handle existing data if any (mapping to a default or null)
DO $$ 
BEGIN 
    -- Team
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'team' AND COLUMN_NAME = 'agency_id') THEN
        ALTER TABLE team ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
    
    -- Leads
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'leads' AND COLUMN_NAME = 'agency_id') THEN
        ALTER TABLE leads ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;

    -- Tasks
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tasks' AND COLUMN_NAME = 'agency_id') THEN
        ALTER TABLE tasks ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;

    -- Commissions
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'commissions' AND COLUMN_NAME = 'agency_id') THEN
        ALTER TABLE commissions ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;

    -- Goals
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'goals' AND COLUMN_NAME = 'agency_id') THEN
        ALTER TABLE goals ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;

    -- Notifications
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'notifications' AND COLUMN_NAME = 'agency_id') THEN
        ALTER TABLE notifications ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;

    -- Audit Logs
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'agency_id') THEN
        ALTER TABLE audit_logs ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Enable RLS on all tables
ALTER TABLE team ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- 4. Create common RLS policies
-- We assume users are authenticated and their 'id' matches the 'team.id' 
-- and we can fetch their agency_id from the team table.

-- Function to get the current user's agency_id
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
    SELECT agency_id FROM team WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies for Team (Users only see their own agency's team)
CREATE POLICY "Users can view their agency team" ON team
    FOR SELECT USING (agency_id = get_user_agency_id());

-- Policies for Leads
CREATE POLICY "Users can view their agency leads" ON leads
    FOR ALL USING (agency_id = get_user_agency_id());

-- Policies for Tasks
CREATE POLICY "Users can view their agency tasks" ON tasks
    FOR ALL USING (agency_id = get_user_agency_id());

-- Policies for Commissions
CREATE POLICY "Users can view their agency commissions" ON commissions
    FOR ALL USING (agency_id = get_user_agency_id());

-- Policies for Goals
CREATE POLICY "Users can view their agency goals" ON goals
    FOR ALL USING (agency_id = get_user_agency_id());

-- Policies for Notifications
CREATE POLICY "Users can view their agency notifications" ON notifications
    FOR ALL USING (agency_id = get_user_agency_id());

-- Policies for Agencies
CREATE POLICY "Users can view their own agency" ON agencies
    FOR SELECT USING (id = get_user_agency_id());
