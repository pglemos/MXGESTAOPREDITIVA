# Tarefas de Migração e Paridade Final — MX PERFORMANCE

## [Fase 1] Preparação e Extração
- [x] Extrair `CONFIG` do Excel para JSON
- [x] Extrair dados da planilha legacy para JSON (`scripts/extract-excel.ts`)
- [x] Configurar Supabase `service_role` para migração massiva
- [x] Criar script de migração core (`scripts/migrate-legacy-data.ts`)
- [x] Executar migração histórica (Lojas, Vendedores, Metas, Histórico)
- [x] Validar paridade de dados no Supabase

## [Fase 2] Execução da Migração (Script)
- [x] Criar script de migração `scripts/migrate-legacy-data.ts`
- [x] Importar Lojas e Metas (Configuração Base)
- [x] Importar Vendedores (Perfis de Loja)
- [ ] Importar Histórico de Check-ins (Normalizando Datas 0026 -> 2026)
- [ ] Vincular metas mensais às lojas e vendedores

## [Fase 3] Validação de Paridade
- [ ] Rodar script de auditoria (Soma Vendas Supabase vs Excel)
- [x] Verificar visibilidade dos dados no Dashboard Administrativo
- [x] Refatorar Dashboard Admin para refletir dados legados
- [x] Implementar "Share Hub" por loja (WhatsApp links)
- [x] Validar persistência de metas e projeções
- [ ] Validar cálculos de Ritmo e Projeção com dados reais

## [Fase 4] Automação (Review)
- [x] Configurar `automate_reports.sql`
- [x] Validar disparos de relatórios com novos dados
