-- Migration: Drop migration_backup_*_20260503 (PII LGPD compliance)
-- Story: 1.7 (Sprint 1) — Débito DB-013 (Crítico)
-- Padrão: encrypt-then-drop (export offline criptografado AES-256/KMS aprovado pelo DPO ANTES da execução)
-- ATENÇÃO: NÃO APLICAR EM PRODUÇÃO SEM APROVAÇÃO FORMAL DO DPO (ver docs/runbooks/sprint-1-story-1.7-drop-pii-backups.md)
-- Pré-requisitos verificados externamente:
--   1. Export criptografado AES-256 com KMS para bucket privado (checksum SHA-256 validado)
--   2. Spot-check 100 linhas: export == origem
--   3. DPO approval formal anexado (template em docs/runbooks/lgpd-dpo-approval-template.md)
--   4. Snapshot PITR Supabase confirmado pré-execução

BEGIN;

SET LOCAL search_path = public, pg_temp;

-- ============================================================================
-- 1) GATE: apenas administrador MX pode executar este DROP
-- ============================================================================
DO $$
BEGIN
  IF NOT public.eh_administrador_mx() THEN
    RAISE EXCEPTION 'BLOQUEADO: Apenas admin MX pode executar drop de PII backups (Story 1.7 / DB-013)';
  END IF;
END
$$;

-- ============================================================================
-- 2) AUDITORIA: registrar intenção + row_count ANTES do DROP
--    (idempotente: usa IF EXISTS para evitar erro em re-runs)
-- ============================================================================
DO $$
DECLARE
  v_rowcount_vendedores bigint := NULL;
  v_rowcount_lancamentos bigint := NULL;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'migration_backup_vendedores_loja_duplicates_20260503'
  ) THEN
    EXECUTE 'SELECT count(*) FROM public.migration_backup_vendedores_loja_duplicates_20260503'
      INTO v_rowcount_vendedores;

    INSERT INTO public.logs_auditoria (user_id, action, entity, details_json)
    VALUES (
      auth.uid(),
      'DROP_PII_BACKUP',
      'migration_backup_vendedores_loja_duplicates_20260503',
      jsonb_build_object(
        'story', '1.7',
        'debito', 'DB-013',
        'row_count', v_rowcount_vendedores,
        'reason', 'LGPD compliance — eliminação de backup PII sem RLS',
        'legal_basis', 'LGPD Art. 16 (minimização) + Art. 5º X (tratamento)',
        'dpo_approval_required', true,
        'encrypted_export_offline', true,
        'retention_offline_years', 1
      )
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'migration_backup_lancamentos_diarios_duplicates_20260503'
  ) THEN
    EXECUTE 'SELECT count(*) FROM public.migration_backup_lancamentos_diarios_duplicates_20260503'
      INTO v_rowcount_lancamentos;

    INSERT INTO public.logs_auditoria (user_id, action, entity, details_json)
    VALUES (
      auth.uid(),
      'DROP_PII_BACKUP',
      'migration_backup_lancamentos_diarios_duplicates_20260503',
      jsonb_build_object(
        'story', '1.7',
        'debito', 'DB-013',
        'row_count', v_rowcount_lancamentos,
        'reason', 'LGPD compliance — eliminação de backup PII sem RLS',
        'legal_basis', 'LGPD Art. 16 (minimização) + Art. 5º X (tratamento)',
        'dpo_approval_required', true,
        'encrypted_export_offline', true,
        'retention_offline_years', 1
      )
    );
  END IF;
END
$$;

-- ============================================================================
-- 3) DROP definitivo das tabelas (idempotente)
-- ============================================================================
DROP TABLE IF EXISTS public.migration_backup_vendedores_loja_duplicates_20260503;
DROP TABLE IF EXISTS public.migration_backup_lancamentos_diarios_duplicates_20260503;

-- ============================================================================
-- 4) Auditoria de conclusão (uma linha-resumo)
-- ============================================================================
INSERT INTO public.logs_auditoria (user_id, action, entity, details_json)
VALUES (
  auth.uid(),
  'DROP_PII_BACKUP_COMPLETED',
  'migration_backups_20260503',
  jsonb_build_object(
    'story', '1.7',
    'debito', 'DB-013',
    'tables_dropped', jsonb_build_array(
      'migration_backup_vendedores_loja_duplicates_20260503',
      'migration_backup_lancamentos_diarios_duplicates_20260503'
    ),
    'compliance', 'LGPD Art. 16',
    'rollback_strategy', 'PITR restore + encrypted offline export (S3+KMS)'
  )
);

COMMIT;

-- ============================================================================
-- DOWN (rollback) — INVIÁVEL via migration
-- ============================================================================
-- Dados PII deletados sob aprovação formal do DPO. Restore exige:
--   1. PITR (Point-In-Time Recovery) via Supabase Pro+ console (janela 7 dias), OU
--   2. Decrypt + COPY FROM do export offline criptografado (S3 + KMS),
--      seguindo procedimento em docs/runbooks/sprint-1-story-1.7-drop-pii-backups.md §Rollback.
-- RTO estimado: ~2h. Não automatizar rollback nesta migration por design.
