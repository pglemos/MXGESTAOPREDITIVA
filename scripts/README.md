# Scripts Operacionais — MX Performance

Todos os scripts operacionais do projeto. Execute com `tsx` (`.ts`) ou `node` (`.mjs`/`.js`).

## Referência Rápida

| Script | Propósito | Uso | Categoria |
|--------|-----------|-----|-----------|
| `auditar_rls_consultoria.ts` | Auditoria de RLS para CRM Consultoria | `tsx scripts/auditar_rls_consultoria.ts` | util |
| `audit_data_migration_final.ts` | Auditoria forense de dados migrados | `tsx scripts/audit_data_migration_final.ts` | util |
| `audit_duplicates.mjs` | Auditoria de check-ins duplicados | `node scripts/audit_duplicates.mjs` | cleanup |
| `audit_parity_routes.mjs` | Auditoria E2E de paridade de rotas (Playwright) | `node scripts/audit_parity_routes.mjs` | util |
| `audit_visual_temporal.mjs` | Auditoria visual temporal com filtros de período | `node scripts/audit_visual_temporal.mjs` | util |
| `analyze_csv_sections.mjs` | Análise de seções do CSV de importação | `node scripts/analyze_csv_sections.mjs` | util |
| `bulk_import_curl.mjs` | Importação em lote de check-ins via cURL | `node scripts/bulk_import_curl.mjs` | seed |
| `check_csv_april.mjs` | Verificação de dados CSV de abril por loja | `node scripts/check_csv_april.mjs` | util |
| `check_data_links.mjs` | Verificação de integridade de FK entre dados | `node scripts/check_data_links.mjs` | util |
| `check_memberships.ts` | Verificação de memberships usuário↔loja | `tsx scripts/check_memberships.ts` | util |
| `check_refs.mjs` | Verificação de refs Supabase URL vs Postgres URL | `node scripts/check_refs.mjs` | util |
| `check_rls.ts` | Verificação de RLS na tabela users | `tsx scripts/check_rls.ts` | util |
| `check_roles.mjs` | Verificação de roles dos usuários | `node scripts/check_roles.mjs` | util |
| `check_tables.mjs` | Verificação de tabelas existentes no Supabase | `node scripts/check_tables.mjs` | util |
| `cleanup_redundant_users.mjs` | Limpeza de usuários redundantes por ID | `node scripts/cleanup_redundant_users.mjs` | cleanup |
| `consolidate_users.mjs` | Consolidação de registros duplicados de vendedores | `node scripts/consolidate_users.mjs` | cleanup |
| `consultoria_gerar_resumo_executivo.ts` | Geração CLI do resumo executivo PMR | `npm run consultoria:gerar-resumo-executivo -- --client-id <uuid>` | util |
| `consultoria_gerar_planejamento_estrategico.ts` | Geração CLI do planejamento estratégico PMR | `npm run consultoria:gerar-planejamento-estrategico -- --client-id <uuid>` | util |
| `consultoria_importar_fechamento_mensal.ts` | Importação do fechamento mensal PMR (`Cadmkt`, `Cadven`, `Cadest`) | `npm run consultoria:importar-fechamento-mensal -- --client-id <uuid> --file <xlsx>` | carga |
| `consultoria_carregar_parametros.ts` | Carga de indicadores e parâmetros PMR editáveis | `npm run consultoria:carregar-parametros` | carga |
| `create_managers.mjs` | Criação de contas auth para gerentes | `node scripts/create_managers.mjs` | seed |
| `debug_caio_browser.mjs` | Debug de login via navegador (Playwright) | `node scripts/debug_caio_browser.mjs` | util |
| `debug-login-e2e.mjs` | Debug E2E de fluxo de login | `node scripts/debug-login-e2e.mjs` | util |
| `debug_stores.ts` | Debug de lojas no banco | `tsx scripts/debug_stores.ts` | util |
| `debug_users.ts` | Debug de usuários no auth e public.users | `tsx scripts/debug_users.ts` | util |
| `e2e-mocked-audit.mjs` | Auditoria E2E com perfil mockado no localStorage | `node scripts/e2e-mocked-audit.mjs` | util |
| `final_data_sync.mjs` | Sincronização final de dados via CSV | `node scripts/final_data_sync.mjs` | seed |
| `final_elite_import.mjs` | Importação final de dados Elite via CSV | `node scripts/final_elite_import.mjs` | seed |
| `final_production_verify.mjs` | Validação final em produção (Playwright) | `node scripts/final_production_verify.mjs` | deploy |
| `find_joao.mjs` | Busca de usuário João por nome | `node scripts/find_joao.mjs` | util |
| `fix_manager_roles.mjs` | Correção de roles de gerentes via cURL | `node scripts/fix_manager_roles.mjs` | cleanup |
| `force_deploy_consulting.ts` | Deploy forçado de migration SQL de consultoria | `tsx scripts/force_deploy_consulting.ts` | deploy |
| `full_dedupe.mjs` | Deduplicação total de check-ins | `node scripts/full_dedupe.mjs` | cleanup |
| `import_google_forms_history.js` | Importação de histórico do Google Forms (CSV) | `node scripts/import_google_forms_history.js` | seed |
| `link_sellers.mjs` | Vinculação de vendedores às lojas via memberships | `node scripts/link_sellers.mjs` | seed |
| `lint-tokens.js` | Lint de tokens CSS/design system do MX | `npm run lint:tokens` | util |
| `list_all_users.mjs` | Lista todos os usuários com role e email | `node scripts/list_all_users.mjs` | util |
| `migrate_data.mjs` | Migração de dados de vendedores (rename/merge) | `node scripts/migrate_data.mjs` | migration |
| `migrate_joao.mjs` | Migração de dados do usuário João entre IDs | `node scripts/migrate_joao.mjs` | migration |
| `parse_csv_stats.mjs` | Estatísticas de vendedores e lojas no CSV | `node scripts/parse_csv_stats.mjs` | util |
| `purge_dups.mjs` | Purge de check-ins duplicados via cURL | `node scripts/purge_dups.mjs` | cleanup |
| `purge_wrong_stores.mjs` | Purge de vendedores em lojas erradas | `node scripts/purge_wrong_stores.mjs` | cleanup |
| `reconcile_stores_network.ts` | Reconciliação de rede (normalização de case/nomes) | `tsx scripts/reconcile_stores_network.ts` | cleanup |
| `recover_lost_data.ts` | Recuperação de check-ins perdidos | `tsx scripts/recover_lost_data.ts` | cleanup |
| `repair_retry.ts` | Reparo de auth/users com retry automático | `tsx scripts/repair_retry.ts` | cleanup |
| `repair_sql.ts` | Reparo direto via SQL (Postgres) | `tsx scripts/repair_sql.ts` | cleanup |
| `repair_system.ts` | Reparo de sistema auth + tabela users | `tsx scripts/repair_system.ts` | cleanup |
| `reset_admin_password.mjs` | Reset de senha do admin via service role | `node scripts/reset_admin_password.mjs` | util |
| `reset_admin_single.ts` | Reset de senha do admin único | `tsx scripts/reset_admin_single.ts` | util |
| `reset_passwords.ts` | Reset de senhas dos 4 usuários padrão | `tsx scripts/reset_passwords.ts` | util |
| `reset_passwords_v2.ts` | Reset de senhas v2 com busca individual | `tsx scripts/reset_passwords_v2.ts` | util |
| `restore_all_sellers.mjs` | Restauração de todos os vendedores do CSV | `node scripts/restore_all_sellers.mjs` | seed |
| `restore_truth_final.mjs` | Restauração final da source of truth | `node scripts/restore_truth_final.mjs` | seed |
| `run_fix_rls.ts` | Execução de migration SQL de fix RLS | `tsx scripts/run_fix_rls.ts` | migration |
| `setup_managers.mjs` | Setup de gerentes via Supabase SDK | `node scripts/setup_managers.mjs` | seed |
| `setup_managers_curl.mjs` | Setup de gerentes via cURL | `node scripts/setup_managers_curl.mjs` | seed |
| `source_of_truth_sync.mjs` | Sincronização completa com source of truth | `node scripts/source_of_truth_sync.mjs` | seed |
| `surgical_import.mjs` | Importação cirúrgica registro a registro | `node scripts/surgical_import.mjs` | seed |
| `surgical_merge.mjs` | Merge cirúrgico de registros duplicados | `node scripts/surgical_merge.mjs` | cleanup |
| `sync-admin-password.mjs` | Sincronização de senha admin local | `node scripts/sync-admin-password.mjs` | util |
| `sync_stores_managers.mjs` | Sincronização de lojas com emails de gerentes | `node scripts/sync_stores_managers.mjs` | seed |
| `test_custom_range.mjs` | Teste E2E do filtro personalizado (Playwright) | `node scripts/test_custom_range.mjs` | util |
| `update_seller_passwords.mjs` | Atualização de senhas de vendedores | `node scripts/update_seller_passwords.mjs` | util |
| `validate_logins.mjs` | Validação de logins via Playwright | `node scripts/validate_logins.mjs` | util |
| `verify_api_auth.mjs` | Verificação de autenticação via API Supabase | `node scripts/verify_api_auth.mjs` | util |
| `verify_sellers.mjs` | Verificação de integridade de vendedores | `node scripts/verify_sellers.mjs` | util |
| `visual-checkin-audit.mjs` | Diagnóstico visual da página de check-in | `node scripts/visual-checkin-audit.mjs` | util |

## Scripts Declarados no package.json (não criados ainda)

| Script no npm | Arquivo esperado |
|---------------|------------------|
| `npm run fix:admin-access` | `scripts/fix_admin_access.ts` |
| `npm run seed:sandbox:live` | `scripts/seed_live_sandbox.ts` |
| `npm run validate:e2e:live` | `scripts/validate_live_end_to_end.ts` |

## Categorias

| Categoria | Descrição |
|-----------|-----------|
| **seed** | Importação e carga de dados |
| **migration** | Migrações e transforms de schema/dados |
| **cleanup** | Deduplicação, purge e correção de dados |
| **deploy** | Deploy e validação em produção |
| **util** | Debug, auditoria e verificação |
