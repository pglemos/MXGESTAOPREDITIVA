-- Migration to resolve DB-04: Legacy Ghost Tables

-- Drop tables associated with removed legacy modules
DROP TABLE IF EXISTS public.gamification CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
