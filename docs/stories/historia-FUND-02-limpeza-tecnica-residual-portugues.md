# Historia FUND-02: Limpeza tecnica residual em portugues

**Status:** Em andamento
**Agente:** aiox-master
**Prioridade:** ALTA
**Branch:** main

## Contexto

A FUND-01 padronizou o dominio principal, permissoes, rotas centrais e evidencias de visita. Ainda existem nomes tecnicos antigos em areas secundarias e historicas do codigo, como `consulting_*`, `seller_*`, `store_*`, `user_*` e termos equivalentes fora do nucleo principal.

Esses nomes residuais nao bloqueiam a entrega FUND-01, mas precisam de uma story propria para evitar uma mudanca ampla sem mapa completo de impacto.

## User Story

Como equipe MX,
quero remover nomenclaturas tecnicas antigas de modulos secundarios,
para manter o codigo, banco, testes e Edge Functions em portugues tecnico padronizado sem misturar ingles e portugues.

## Escopo

- Mapear ocorrencias residuais de nomes tecnicos em ingles fora do dominio principal migrado na FUND-01.
- Classificar cada ocorrencia como funcional, legado, teste, comentario, fixture ou integracao externa.
- Renomear apenas o que for dominio interno MX.
- Manter marcas, fornecedores e siglas oficiais: Google Calendar, Supabase, Vercel, PDI, PMR, DRE, ROI e RTA.
- Atualizar hooks, paginas, schemas, testes, scripts, Edge Functions, migrations futuras e documentacao impactada.

## Acceptance Criteria

- [x] Inventario residual versionado com ocorrencias e decisao de manter/renomear.
- [x] Comandos e scripts operacionais ativos de consultoria renomeados para portugues sem acento tecnico.
- [x] Tabelas secundarias internas renomeadas para portugues sem acento tecnico.
- [x] Nenhuma referencia funcional interna a `consulting_*`, `store_meta_rules`, `store_delivery_rules`, `store_benchmarks`, `reprocess_logs`, `raw_imports`, `weekly_feedback_reports`, `checkin_correction_requests`, `digital_products`, `notifications`, `feedbacks`, `manager_routine_logs`, `whatsapp_share_logs` ou `profiles` permanece em `src`, `scripts` ou `supabase/functions` sem justificativa.
- [x] UI continua usando portugues normal, com acentuacao quando apropriado.
- [x] Codigo e banco novos continuam em portugues sem acento tecnico.
- [x] Testes, build e E2E passam apos as renomeacoes.
- [x] File list atualizado antes de concluir.

## Plano de Execucao

1. Rodar auditoria por `rg` nos prefixos antigos e termos correlatos.
2. Separar nomes que pertencem a bibliotecas, fornecedores ou contratos externos.
3. Planejar migrations pequenas e reversiveis quando houver impacto em banco.
4. Atualizar codigo TypeScript, Edge Functions, testes e documentos por area.
5. Rodar gates completos antes de qualquer deploy.

## Plano de Rollback

1. Para alteracoes somente de codigo, reverter o commit da story.
2. Para migrations de banco, criar migration reversa antes do deploy.
3. Se login, RLS, lancamento diario, visitas ou agenda falharem no smoke, interromper deploy e restaurar versao anterior.

## Validacao Obrigatoria

- [x] `npm run validate:structure`
- [x] `npm run validate:agents`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [x] `npm run test:e2e`

## Observacoes de Validacao

- Migration live aplicada: `20260430230000_fund02_nomenclatura_secundaria_portugues.sql`.
- Reload do schema PostgREST aplicado: `20260430231000_reload_postgrest_schema_fund02.sql`.
- Smoke REST confirmou novas tabelas como `regras_metas_loja`, `regras_entrega_loja`, `logs_reprocessamento`, `importacoes_brutas`, `devolutivas`, `notificacoes`, `eventos_agenda_consultoria`, `modelos_formulario_pmr`, `respostas_formulario_pmr`, `catalogo_metricas_consultoria` e `tokens_oauth_consultoria`.
- Smoke REST confirmou que tabelas antigas como `store_meta_rules` e `consulting_metric_catalog` sairam do schema cache publico do PostgREST.
- Edge Functions publicadas apos rename: `feedback-semanal`, `google-calendar-events`, `google-calendar-merged`, `google-calendar-sync`, `google-oauth-handler`, `relatorio-matinal`, `relatorio-mensal`, `send-individual-feedback` e `send-visit-report`.
- Frontend publicado em producao: `https://mxperformance.vercel.app`, deployment `dpl_eKmRan1ywn7EAbHwuA1J1xHE7WEe`.
- `npm run test:e2e` completo passou com `165 passed`, `2 skipped`.
- Smoke live final passou com `3 passed`, incluindo fluxo autenticado e evidencia obrigatoria de visita no dominio de producao.
- Migrations historicas e documentos de registro antigo podem manter nomes antigos como evidencia historica; codigo funcional atual, scripts ativos e Edge Functions foram atualizados.

## File List

- `docs/stories/historia-FUND-02-limpeza-tecnica-residual-portugues.md`
- `docs/architecture/inventario-nomenclatura-residual.md`
- `package.json`
- `scripts/README.md`
- `scripts/consultoria_carregar_parametros.ts`
- `scripts/consultoria_importar_fechamento_mensal.ts`
- `scripts/consultoria_gerar_planejamento_estrategico.ts`
- `scripts/consultoria_gerar_resumo_executivo.ts`
- `scripts/auditar_rls_consultoria.ts`
- `supabase/migrations/20260430230000_fund02_nomenclatura_secundaria_portugues.sql`
- `supabase/migrations/20260430231000_reload_postgrest_schema_fund02.sql`
- `supabase/functions/feedback-semanal/index.ts`
- `supabase/functions/google-calendar-events/index.ts`
- `supabase/functions/google-calendar-merged/index.ts`
- `supabase/functions/google-calendar-sync/index.ts`
- `supabase/functions/google-oauth-handler/index.ts`
- `supabase/functions/relatorio-matinal/index.ts`
- `supabase/functions/relatorio-mensal/index.ts`
- `supabase/functions/send-individual-feedback/index.ts`
- `supabase/functions/send-visit-report/index.ts`
- `src/hooks/useAgendaAdmin.ts`
- `src/hooks/useFeedbacks.ts`
- `src/hooks/useNotifications.ts`
- `src/hooks/useGoals.ts`
- `src/hooks/useOperationalSettings.ts`
- `src/hooks/useConsultingParameters.ts`
- `src/hooks/useConsultingMetrics.ts`
- `src/hooks/usePmrDiagnostics.ts`
- `src/pages/Reprocessamento.tsx`
- `src/pages/ProdutosDigitais.tsx`
- `src/pages/Perfil.tsx`
- `docs/stories/story-CONS-06-pmr-parameters.md`
- `docs/stories/story-CONS-07-pmr-operational-inputs.md`
- `docs/stories/story-CONS-09-pmr-cli-artifacts.md`
- `docs/stories/story-CONS-11-pmr-full-workflow-sync.md`
