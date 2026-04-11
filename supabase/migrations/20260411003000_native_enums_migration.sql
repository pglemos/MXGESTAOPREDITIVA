-- v1.1: Evolução para Enums Nativos do PostgreSQL
-- Objetivo: Garantir integridade de domínio e performance em filtros categóricos.

BEGIN;

-- 1. Criar Tipos Enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_source_mode') THEN
        CREATE TYPE public.store_source_mode AS ENUM ('legacy_forms', 'native_app', 'hybrid');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'individual_goal_mode') THEN
        CREATE TYPE public.individual_goal_mode AS ENUM ('even', 'custom', 'proportional');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
        CREATE TYPE public.submission_status AS ENUM ('on_time', 'late');
    END IF;
END $$;

-- 2. Migrar stores.source_mode
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_source_mode_check;
ALTER TABLE public.stores ALTER COLUMN source_mode TYPE public.store_source_mode USING source_mode::public.store_source_mode;

-- 3. Migrar store_meta_rules.individual_goal_mode
ALTER TABLE public.store_meta_rules DROP CONSTRAINT IF EXISTS store_meta_rules_individual_goal_mode_check;
ALTER TABLE public.store_meta_rules ALTER COLUMN individual_goal_mode TYPE public.individual_goal_mode USING individual_goal_mode::public.individual_goal_mode;

-- 4. Migrar daily_checkins.submission_status
ALTER TABLE public.daily_checkins DROP CONSTRAINT IF EXISTS daily_checkins_submission_status_check;
ALTER TABLE public.daily_checkins ALTER COLUMN submission_status TYPE public.submission_status USING submission_status::public.submission_status;

COMMENT ON TYPE public.store_source_mode IS 'Define a origem primária de entrada de dados da unidade.';
COMMENT ON TYPE public.individual_goal_mode IS 'Define como a meta da loja é rateada entre os vendedores.';

COMMIT;
