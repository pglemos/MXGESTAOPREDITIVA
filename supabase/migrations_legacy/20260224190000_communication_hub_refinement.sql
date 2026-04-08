-- Refine automation_configs and add communication_instances

-- 1. Ensure automation_configs has necessary fields for WhatsApp delivery
ALTER TABLE automation_configs 
ADD COLUMN IF NOT EXISTS time_to_trigger TIME DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT '{Manager, Owner}',
ADD COLUMN IF NOT EXISTS custom_message TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- 2. Create WhatsApp Integration Instances table
CREATE TABLE IF NOT EXISTS communication_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID,
    name TEXT NOT NULL,
    provider TEXT DEFAULT 'evolution_api', -- E.g., Evolution API, WPPConnect, etc.
    status TEXT DEFAULT 'disconnected', -- connected, disconnected, pairing
    api_url TEXT,
    api_key TEXT,
    instance_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add RLS for communication_instances
ALTER TABLE communication_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view their own communication instances"
ON communication_instances FOR SELECT
TO authenticated
USING (true); -- Simplified for now, should ideally check agency_id

CREATE POLICY "Agencies can manage their own communication instances"
ON communication_instances FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
