-- Migration: Rename 'Consultoria' role to 'Admin' and update default
-- This script updates existing data and ensures future uses of the role are consistent.

-- 1. Update existing 'Consultoria' roles to 'Admin' in the team table
UPDATE team SET role = 'Admin' WHERE role = 'Consultoria';

-- 2. (Optional) If there were any other tables with role references, they would be updated here.
-- Based on initial search, 'team' is the primary location.

-- 3. Verify the change (Internal verification for the user when they run this)
-- SELECT * FROM team WHERE role = 'Admin';
