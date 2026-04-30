# Glossario Tecnico MX

Este documento e a fonte obrigatoria para nomenclatura tecnica do sistema MX.

## Regras

- Codigo, banco, rotas e nomes tecnicos usam portugues sem acento.
- Textos de interface usam portugues com acento normalmente.
- Siglas consolidadas podem permanecer: MX, PMR, PDI, DRE, ROI, RTA.
- Nomes de fornecedores e marcas permanecem originais: Google Calendar, Supabase, Vercel.
- Novos modulos devem consultar este glossario antes de criar tabelas, hooks, rotas, arquivos ou labels.

## Papeis canonicos

| Papel tecnico | Texto de interface | Uso |
| --- | --- | --- |
| `administrador_geral` | Administrador Geral | Governanca maxima da plataforma MX |
| `administrador_mx` | Administrador MX | Operacao interna MX com acesso amplo |
| `consultor_mx` | Consultor MX | Acompanhamento de clientes com restricoes sensiveis |
| `dono` | Dono da loja | Visao das proprias lojas |
| `gerente` | Gerente | Gestao da equipe da propria loja |
| `vendedor` | Vendedor | Lancamentos, metas e evolucao propria |

## Tabelas canonicas

| Nome legado | Nome canonico |
| --- | --- |
| `users` | `usuarios` |
| `stores` | `lojas` |
| `memberships` | `vinculos_loja` |
| `store_sellers` | `vendedores_loja` |
| `daily_checkins` | `lancamentos_diarios` |
| `trainings` | `treinamentos` |
| `training_progress` | `progresso_treinamentos` |
| `consulting_clients` | `clientes_consultoria` |
| `consulting_visits` | `visitas_consultoria` |
| `consulting_action_items` | `itens_plano_acao` |
| `consulting_strategic_plans` | `planejamentos_estrategicos` |
| `consulting_financials` | `financeiro_consultoria` |
| `goals` | `metas` |
| `goal_logs` | `historico_metas` |
| `audit_logs` | `logs_auditoria` |
| `store_benchmarks` | `benchmarks_loja` |
| `store_delivery_rules` | `regras_entrega_loja` |
| `store_meta_rules` | `regras_metas_loja` |
| `store_meta_rules_history` | `historico_regras_metas_loja` |
| `store_audit_log` | `logs_auditoria_loja` |
| `reprocess_logs` | `logs_reprocessamento` |
| `raw_imports` | `importacoes_brutas` |
| `weekly_feedback_reports` | `relatorios_devolutivas_semanais` |
| `checkin_correction_requests` | `solicitacoes_correcao_lancamento` |
| `digital_products` | `produtos_digitais` |
| `notifications` | `notificacoes` |
| `feedbacks` | `devolutivas` |
| `manager_routine_logs` | `logs_rotina_gerente` |
| `whatsapp_share_logs` | `logs_compartilhamento_whatsapp` |
| `profiles` | `perfis_usuario` |
| `consulting_assignments` | `atribuicoes_consultoria` |
| `consulting_client_units` | `unidades_cliente_consultoria` |
| `consulting_client_contacts` | `contatos_cliente_consultoria` |
| `consulting_oauth_tokens` | `tokens_oauth_consultoria` |
| `consulting_calendar_settings` | `configuracoes_calendario_consultoria` |
| `consulting_google_oauth_states` | `estados_oauth_google_consultoria` |
| `consulting_visit_programs` | `programas_visita_consultoria` |
| `consulting_visit_template_steps` | `etapas_modelo_visita_consultoria` |
| `consulting_client_modules` | `modulos_cliente_consultoria` |
| `consulting_pmr_form_templates` | `modelos_formulario_pmr` |
| `consulting_pmr_form_responses` | `respostas_formulario_pmr` |
| `consulting_metric_catalog` | `catalogo_metricas_consultoria` |
| `consulting_parameter_sets` | `conjuntos_parametros_consultoria` |
| `consulting_parameter_values` | `valores_parametros_consultoria` |
| `consulting_client_metric_targets` | `metas_metricas_cliente` |
| `consulting_client_metric_results` | `resultados_metricas_cliente` |
| `consulting_client_metric_snapshots` | `snapshots_metricas_cliente` |
| `consulting_marketing_monthly` | `marketing_mensal_consultoria` |
| `consulting_sales_entries` | `entradas_vendas_consultoria` |
| `consulting_inventory_snapshots` | `snapshots_estoque_consultoria` |
| `consulting_inventory_items` | `itens_estoque_consultoria` |
| `consulting_generated_artifacts` | `artefatos_gerados_consultoria` |
| `consulting_schedule_events` | `eventos_agenda_consultoria` |
| `consulting_import_batches` | `lotes_importacao_consultoria` |
| `consulting_import_rows` | `linhas_importacao_consultoria` |

## Rotas canonicas

| Rota legada | Rota canonica |
| --- | --- |
| `/checkin` | `/lancamento-diario` |
| `/ranking` | `/classificacao` |
| `/feedback` | `/devolutivas` |
| `/dashboard` | `/painel` |
| `/training` | `/treinamentos` |

## Termos de interface

| Evitar | Usar |
| --- | --- |
| Check-in | Lancamento Diario |
| Ranking | Classificacao |
| Feedback | Devolutiva |
| Dashboard | Painel |
| Store | Loja |
| Seller | Vendedor |
| Goal | Meta |
| Training | Treinamento |
| Attachment | Evidencia ou documento |
