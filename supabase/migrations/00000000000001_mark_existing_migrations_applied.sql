-- ============================================================
-- MARK EXISTING MIGRATIONS AS APPLIED
-- Generated: 2026-04-15
-- Purpose: After baseline migration captures the complete schema,
--          these 39 migrations are already reflected in the baseline.
--          This script registers them in supabase_migrations so
--          they are not re-executed on db reset.
-- ============================================================

-- Ensure the schema_migrations table exists (Supabase manages this)
CREATE SCHEMA IF NOT EXISTS supabase_migrations;

CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version VARCHAR(255) NOT NULL,
  statements TEXT[],
  name VARCHAR(255),
  PRIMARY KEY (version)
);

-- Mark all existing migrations as applied
-- Using INSERT ... ON CONFLICT DO NOTHING for idempotency
INSERT INTO supabase_migrations.schema_migrations (version, statements, name) VALUES
  ('20260407000000', '{}', 'role_matrix_dono_admin'),
  ('20260407001000', '{}', 'canonical_domain_alignment'),
  ('20260407002000', '{}', 'checkin_temporal_status'),
  ('20260407003000', '{}', 'manager_daily_routine'),
  ('20260407004000', '{}', 'morning_report_cron_1030'),
  ('20260407005000', '{}', 'whatsapp_share_logs'),
  ('20260407006000', '{}', 'weekly_feedback_official'),
  ('20260407006100', '{}', 'feedback_seller_ack_guard'),
  ('20260407160000', '{}', 'reconcile_epic09_12_end_to_end'),
  ('20260407161000', '{}', 'pdi_legacy_compatibility'),
  ('20260407162000', '{}', 'training_progress_rls'),
  ('20260407170000', '{}', 'fix_auth_rls'),
  ('20260407180000', '{}', 'fix_meta_rules_rls'),
  ('20260407190000', '{}', 'optimize_rls_performance'),
  ('20260407200000', '{}', 'kill_rls_recursion'),
  ('20260407210000', '{}', 'permissive_select_rls'),
  ('20260408000000', '{}', 'automate_reports'),
  ('20260408000001', '{}', 'fix_dates'),
  ('20260408000002', '{}', 'migration_data_full'),
  ('20260409000000', '{}', 'register_all_official_recipients'),
  ('20260409000001', '{}', 'register_official_recipients'),
  ('20260409135401', '{}', 'pdi_mx_360_foundation'),
  ('20260409135731', '{}', 'pdi_mx_360_rpcs'),
  ('20260409140000', '{}', 'secure_rls_frontend_access'),
  ('20260410000000', '{}', 'sec01_rls_hardening'),
  ('20260411000000', '{}', 'add_projection_mode'),
  ('20260411001000', '{}', 'checkin_audit_system'),
  ('20260411002000', '{}', 'add_audit_indexes'),
  ('20260411003000', '{}', 'native_enums_migration'),
  ('20260411004000', '{}', 'membership_orphan_cleanup'),
  ('20260413000000', '{}', 'perf_add_composite_index'),
  ('20260413001000', '{}', 'drop_legacy_tables'),
  ('20260413002000', '{}', 'secure_pdi_constraints'),
  ('20260413110000', '{}', 'consulting_core_foundation'),
  ('20260413120000', '{}', 'consulting_google_calendar'),
  ('20260413120100', '{}', 'consulting_crm_extended'),
  ('20260413134746', '{}', 'consulting_seed_temp'),
  ('20260414103000', '{}', 'consulting_google_calendar_hardening'),
  ('20260415001000', '{}', 'db02_audit_composite_indexes')
ON CONFLICT (version) DO NOTHING;

-- ============================================================
-- END OF MIGRATION MARKING
-- ============================================================
