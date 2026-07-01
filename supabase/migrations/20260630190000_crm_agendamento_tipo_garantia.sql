-- ============================================================================
-- Migration: 20260630190000_crm_agendamento_tipo_garantia.sql
-- Epic:      EPIC-MX-CRM-VENDEDOR — Base Única (porte Base44, fase 2)
--
-- ESCOPO: adiciona 'garantia' e 'pos_venda' como tipos válidos de
--   agendamento, reaproveitando a tabela `agendamentos` (já é a fonte da
--   Central de Execução) em vez de criar uma tabela paralela de
--   atividades. Aditivo — não remove nem renomeia valores existentes.
--   UI de cadastro (formulário Garantia com motivo/descrição) fica para
--   uma fase seguinte; este migration só habilita a capacidade no dado.
-- ============================================================================

BEGIN;

ALTER TYPE public.crm_agendamento_tipo ADD VALUE IF NOT EXISTS 'garantia';
ALTER TYPE public.crm_agendamento_tipo ADD VALUE IF NOT EXISTS 'pos_venda';

COMMIT;

-- ============================================================================
-- DOWN: não há remoção segura de valor de enum em uso; reversão exigiria
-- recriar o tipo (fora do escopo de um DOWN automático).
-- ============================================================================
