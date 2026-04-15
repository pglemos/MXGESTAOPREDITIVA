-- v1.1: Adiciona suporte a modos de projeção (Calendário vs Dias Úteis)
-- Objetivo: Garantir justiça matemática na projeção MX, permitindo ignorar domingos/feriados.

BEGIN;

-- 1. Criar tipo enum para o modo de projeção
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'projection_mode') THEN
        CREATE TYPE public.projection_mode AS ENUM ('calendar', 'business');
    END IF;
END
$$;

-- 2. Adicionar coluna à tabela store_meta_rules
ALTER TABLE public.store_meta_rules 
ADD COLUMN IF NOT EXISTS projection_mode public.projection_mode NOT NULL DEFAULT 'calendar';

COMMENT ON COLUMN public.store_meta_rules.projection_mode IS 'Define se a projeção MX considera dias corridos ou apenas dias úteis (segunda a sábado).';

COMMIT;
