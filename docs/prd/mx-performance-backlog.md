# BACKLOG — MX PERFORMANCE (Sistema Completo)

**Data:** 2026-04-14
**Versão:** 1.0
**PRD de referência:** `docs/prd/mx-performance-prd.md`

---

## EPIC 01 — Autenticação, Autorização e Onboarding

**Objetivo:** Sistema de autenticação robusto com roles, multi-tenancy, zero trust e onboarding automático.

### Stories

**STORY-01.1 — Login e autenticação Supabase**
- Tela de login com email/senha via Supabase Auth.
- Manter sessão com refresh automático.
- Redirect role-based pós-login.
- AC: Login funciona para todos os 4 roles; redirect correto; sessão persiste.

**STORY-01.2 — Normalização de roles**
- Mapear aliases legados: consultor→admin, owner→dono, manager→gerente, seller→vendedor.
- Função normalizeRole() no useAuth.
- AC: Usuário com role legado é normalizado corretamente.

**STORY-01.3 — Multi-tenancy via memberships**
- Usuário pertence a N lojas com role por loja.
- Store switcher para admin/dono.
- Contexto de loja ativa influencia todas as queries.
- AC: Admin vê todas lojas; dono vê só as suas; gerente vê só a sua; troca de loja funciona.

**STORY-01.4 — Zero Trust enforcement**
- Não-admin sem memberships ativas é deslogado.
- Check em login e durante sessão.
- Admin sem memberships recebe fallback storeId.
- AC: Usuário sem memberships é redirecionado para login.

**STORY-01.5 — Onboarding automático via trigger**
- Trigger on_auth_user_created cria perfil em public.users.
- Trigger check_orphan_users desativa usuários sem affiliations.
- AC: Novo usuário via Supabase Auth recebe perfil; usuário sem lojas é desativado.

**STORY-01.6 — Tela de perfil do usuário**
- Exibir nome, email, telefone, avatar, role.
- Editar nome, telefone, avatar.
- Trocar senha.
- AC: Usuário edita dados; senha é trocada com sucesso.

---

## EPIC 02 — Gestão de Lojas e Rede

**Objetivo:** CRUD de lojas com stats, hierarquia de rede e role management.

### Stories

**STORY-02.1 — Listagem de lojas com stats**
- DataGrid com nome, status, vendedores, check-ins, % disciplina.
- Admin vê todas; dono vê suas; gerente vê a sua.
- AC: Listagem filtrada por role; stats corretas.

**STORY-02.2 — CRUD de lojas (admin)**
- Criar, editar, excluir, ativar/desativar.
- Campos: nome, manager_email, source_mode.
- AC: Admin gerencia lojas; outros roles não podem.

**STORY-02.3 — Gestão de memberships e vigências**
- Atribuir vendedor a loja com data início, data fim, closing_month_grace.
- Visualizar vigências ativas e encerradas.
- AC: Vigência criada; vendedor aparece na equipe; vigência encerrada remove da equipe ativa.

**STORY-02.4 — Admin Network View**
- Hierarquia visual: lojas como cards expansíveis com membros.
- Promover/demover (vendedor↔gerente) e remover membros.
- AC: Admin altera role de membro; membro removido; usuário órfão é desativado.

---

## EPIC 03 — Check-in Diário

**Objetivo:** Ritual diário de lançamento de métricas com deadline, lock, validação e auditoria.

### Stories

**STORY-03.1 — Formulário de check-in**
- Campos: leads_prev_day, agd_cart_prev_day, agd_net_prev_day, agd_cart_today, agd_net_today, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, visit_prev_day.
- Zero reason e notas opcionais.
- Sanitização XSS.
- Rollback: Remover rota /checkin; dados existentes preservados.
- AC: Check-in salvo com sucesso; XSS é neutralizado.

**STORY-03.2 — Deadline 09:30 e lock 09:45**
- Após 09:30 marca como late (submission_status = 'late').
- Após 09:45 bloqueia edição.
- Campos disabled após lock.
- Rollback: Remover lógica de deadline no hook; check-ins ficam sempre editáveis.
- AC: Check-in antes de 09:30 é on_time; entre 09:30-09:45 é late; após 09:45 é bloqueado.

**STORY-03.3 — Upsert por vendedor+loja+data**
- Não duplicar check-in do mesmo dia.
- Trigger sync_daily_checkins_canonical.
- Rollback: DROP TRIGGER; dados existentes preservados.
- AC: Segundo check-in do dia sobrescreve o primeiro; colunas canônicas e legadas sincronizam.

**STORY-03.4 — Venda-loja (is_venda_loja)**
- Flag is_venda_loja no usuário.
- Regras configuráveis: incluir no total da loja, incluir na meta individual.
- Rollback: Reverter lógica no useStoreSales; flag preservada no banco.
- AC: Venda-loja contabilizada conforme regras da loja.

**STORY-03.5 — Correção retroativa de check-in**
- Vendedor solicita correção com motivo e valores desejados.
- Gerente aprova ou rejeita.
- Auditoria imutável em checkin_audit_logs.
- Rollback: DROP TABLE checkin_correction_requests, checkin_audit_logs; remover UI.
- AC: Correção pendente aparece para gerente; aprovação aplica valores; rejeição notifica vendedor; audit log registrado.

**STORY-03.6 — Histórico de check-ins**
- Tela de histórico mensal por vendedor.
- Filtros por data, vendedor, loja.
- Rollback: Remover rota /historico; dados existentes preservados.
- AC: Histórico exibe todos os check-ins do período com filtros.

---

## EPIC 04 — Ranking e Performance

**Objetivo:** Rankings mensais com métricas completas, projeção, ritmo e score MX.

### Stories

**STORY-04.1 — Ranking mensal por loja**
- Por vendedor: vendas, leads, agd, visitas, meta, atingimento %, projeção, ritmo, gap, eficiência, posição.
- Meta individual = meta loja / vendedores (modo even) ou configurável.
- Cache 5 minutos localStorage.
- AC: Ranking exibe dados corretos; cache funciona; posição ordenada por vendas.

**STORY-04.2 — Score MX**
- Fórmula baseada em vendas, meta, funil e disciplina.
- Range 0-1800+.
- AC: Score calculado e exibido corretamente.

**STORY-04.3 — Status operacional**
- Verde/amarelo/vermelho baseado em pacing e disciplina.
- AC: Status correto por vendedor.

**STORY-04.4 — Ranking global cross-loja**
- Todos os vendedores ativos da rede.
- Acessível por admin.
- AC: Admin vê ranking de todas as lojas combinadas.

**STORY-04.5 — Performance por loja com semáforo**
- Meta, realizado, projeção, gap, % disciplina.
- Semáforo verde/amarelo/vermelho.
- AC: Admin vê status de cada loja com indicadores visuais.

**STORY-04.6 — Métricas individuais do vendedor**
- Vendas mês, por canal, meta, atingimento, projeção, falta, rank, vendas ontem, agendamentos hoje, vendas semana, competidores acima/abaixo.
- AC: Vendedor vê todas as suas métricas na Home.

---

## EPIC 05 — Funil MX

**Objetivo:** Análise de funil 20/60/33 com diagnóstico de gargalo automático.

### Stories

**STORY-05.1 — Visualização do funil**
- 4 etapas: Leads → Agendamentos → Visitas → Vendas.
- Conversões: Lead→Agd, Agd→Visita, Visita→Venda.
- Agregação por canal (Porta, Carteira, Internet).
- AC: Funil exibe valores e conversões corretas.

**STORY-05.2 — Diagnóstico de gargalo**
- Comparação com benchmarks configuráveis (padrão 20/60/33).
- Identifica pior conversão.
- Gera diagnóstico textual e sugestão.
- AC: Gargalo identificado corretamente; texto explicativo gerado.

**STORY-05.3 — Prescrição tática**
- Mapeia gargalo para tipo de treinamento.
- LEAD_AGD→prospeccao, AGD_VISITA→atendimento, VISITA_VND→fechamento.
- Exibe treinamento recomendado.
- AC: Treinamento correto recomendado para cada gargalo.

---

## EPIC 06 — Metas, Benchmarks e Regras Operacionais

**Objetivo:** Configuração completa de metas, benchmarks, modos de projeção e regras por loja.

### Stories

**STORY-06.1 — Meta mensal por loja**
- Definir monthly_goal em store_meta_rules.
- Modo de projeção: calendário ou dias úteis.
- AC: Meta definida; projeção calculada corretamente por modo.

**STORY-06.2 — Modo de meta individual**
- even (dividido igual), custom, proportional.
- Regras venda-loja: incluir no total da loja, incluir na meta individual.
- AC: Meta individual calculada conforme modo configurado.

**STORY-06.3 — Benchmarks por loja**
- lead_to_agend, agend_to_visit, visit_to_sale.
- Padrão 20/60/33, editável por loja.
- AC: Benchmarks aplicados ao funil e diagnóstico.

**STORY-06.4 — Regras de entrega de email**
- Destinatários matinal, semanal, mensal (array de emails).
- WhatsApp group ref, timezone, toggle ativo.
- AC: Emails enviados para destinatários corretos.

**STORY-06.5 — Tela unificada de configuração operacional**
- Admin edita meta, benchmarks, delivery rules e vigências em uma tela.
- Salva tudo em paralelo.
- Auditoria de mudanças em store_meta_rules_history.
- AC: Config salva sem erro; auditoria registrada.

---

## EPIC 07 — Feedback Semanal

**Objetivo:** Feedback estruturado com análise de funil, ciência do vendedor e envio por email.

### Stories

**STORY-07.1 — Criação de feedback pelo gerente**
- Selecionar vendedor + semana.
- Preencher: leads, agd, visitas, vendas, taxas de conversão, meta compromisso.
- Pontos positivos, pontos atenção, ação, notas.
- Upsert por vendedor + semana.
- AC: Feedback criado/atualizado; taxas calculadas automaticamente.

**STORY-07.2 — Diagnóstico JSON automático**
- Snapshot do vendedor vs média da equipe.
- Diagnostic_json e team_avg_json populados.
- AC: Diagnóstico incluído no feedback.

**STORY-07.3 — Ciência do vendedor (acknowledge)**
- Vendedor visualiza feedback e marca como lido.
- Trigger impede edição de outros campos.
- AC: Vendedor só pode dar ciência; campos bloqueados.

**STORY-07.4 — Envio de feedback por email**
- Gerente clica botão email → Edge Function send-individual-feedback.
- Email HTML com: tabela de métricas, Real vs Ideal, diagnóstico, ação.
- AC: Email enviado e recebido.

**STORY-07.5 — Relatórios semanais consolidados**
- weekly_feedback_reports por loja com ranking, benchmarks, status email.
- Gerado automaticamente pelo feedback-semanal.
- AC: Relatório armazenado e acessível.

**STORY-07.6 — Feedback print/view**
- PrintableFeedback com tabela, Real vs Ideal, comparação equipe.
- WeeklyStoreReport com ranking e análise de funil.
- AC: Layout correto para impressão.

---

## EPIC 08 — PDI (Plano de Desenvolvimento Individual)

**Objetivo:** PDI com 10 competências, metas temporais e revisões.

### Stories

**STORY-08.1 — Criação de PDI pelo gerente**
- Selecionar vendedor.
- 10 competências com escala 1-10: prospecção, abordagem, demonstração, fechamento, CRM, digital, disciplina, organização, negociação, produto.
- Metas 6/12/24 meses.
- Até 5 ações de desenvolvimento com data limite.
- AC: PDI criado com todos os campos.

**STORY-08.2 — Status e workflow PDI**
- Status: aberto, em_andamento, concluido.
- Gerente/admin altera status.
- AC: Status transiciona corretamente.

**STORY-08.3 — Ciência do vendedor**
- Vendedor visualiza PDI e marca acknowledge.
- Trigger sincroniza colunas legadas.
- AC: Vendedor visualiza e dá ciência.

**STORY-08.4 — Revisões de PDI**
- Gerente/admin cria reviews com: evolução, dificuldades, ajustes, próxima revisão.
- AC: Review criado e vinculado ao PDI.

**STORY-08.5 — Impressão de PDI**
- Tela PDIPrint formatada para impressão.
- AC: Layout impresso correto.

---

## EPIC 09 — PDI MX 360 (Sessão Avançada)

**Objetivo:** Wizard de PDI em 4 etapas com radar chart, níveis de cargo e ações sugeridas.

### Stories

**STORY-09.1 — Tabela de níveis de cargo e descritores**
- 5 níveis: Higienizador(1-5), Operador(6-10), Técnico(11-15), Estrategista(16-20), CEO(21-25).
- Descritores de escala por nível e nota.
- AC: Níveis e descritores disponíveis via RPC.

**STORY-09.2 — 18 competências com indicadores**
- 10 técnicas + 8 comportamentais.
- Nome, tipo, descrição completa, indicador.
- AC: Competências carregadas no wizard.

**STORY-09.3 — Ações sugeridas por competência**
- pdi_acoes_sugeridas com descrição por competência.
- AC: Ações carregadas dinamicamente por competência.

**STORY-09.4 — Frases inspiracionais**
- 7 frases exibidas durante a sessão.
- AC: Frase exibida em cada etapa do wizard.

**STORY-09.5 — Wizard Etapa 1: Especialista**
- Selecionar colaborador da equipe.
- Selecionar cargo/nível.
- AC: Colaborador e cargo selecionados.

**STORY-09.6 — Wizard Etapa 2: Metas (7 min)**
- 9 metas: 3 pessoais + 3 profissionais para 6, 12 e 24 meses.
- Validação antes de avançar.
- AC: Metas preenchidas e validadas.

**STORY-09.7 — Wizard Etapa 3: Mapeamento (10 min)**
- Sliders para cada competência (nota e alvo).
- Radar chart Recharts com notas vs alvo.
- Tabela acessível para screen readers.
- AC: Radar renderiza; notas e alvos capturados.

**STORY-09.8 — Wizard Etapa 4: Plano de Ação (11 min)**
- Top 5 gaps baseados em (alvo - nota).
- Ações sugeridas por gap.
- Data conclusão, impacto, custo.
- AC: Plano salvo com gaps identificados e ações.

**STORY-09.9 — Salvamento atômico via RPC**
- create_pdi_session_bundle: sessão + metas + avaliações + plano em uma transação.
- AC: Todos os dados salvos ou nenhum (rollback).

**STORY-09.10 — Impressão do bundle completo**
- get_pdi_print_bundle retorna tudo para PDF.
- AC: Dados completos disponíveis para impressão.

**STORY-09.11 — Aprovação de evidência de ação**
- Ação com status, evidência URL, aprovado_por, data aprovação.
- RPC approve_pdi_action_evidence.
- AC: Evidência aprovada; status atualizado.

---

## EPIC 10 — Treinamentos

**Objetivo:** Gestão de treinamentos com progresso, público-alvo e prescrição automática.

### Stories

**STORY-10.1 — CRUD de treinamentos (admin)**
- Título, descrição, tipo (prospeccao/fechamento/atendimento/gestao/pre-vendas), URL vídeo, público-alvo (vendedor/gerente/todos), ativo.
- AC: Treinamento criado, editado, ativado/desativado.

**STORY-10.2 — Listagem por público-alvo**
- Vendedor vê treinamentos para vendedor e todos.
- Gerente vê para gerente e todos.
- Admin vê todos.
- AC: Filtro por público-alvo funciona.

**STORY-10.3 — Marcar como assistido**
- Usuário clica e registra training_progress com timestamp.
- AC: Progresso registrado; badge de assistido.

**STORY-10.4 — Progresso de equipe (gerente/admin)**
- Por vendedor: total treinamentos, assistidos, % completos, gap de funil atual, se treinamento do gap foi concluído.
- AC: Progresso exibido por membro da equipe.

**STORY-10.5 — Lembrete de treinamento**
- Gerente/admin envia notificação de lembrete a vendedor.
- AC: Notificação enviada e recebida.

---

## EPIC 11 — Notificações

**Objetivo:** Sistema de inbox com broadcast, real-time e rastreamento de leitura.

### Stories

**STORY-11.1 — Inbox de notificações**
- Lista com título, mensagem, tipo, prioridade, data, lida/não lida.
- Contagem de não lidas no header.
- Marcar como lida individual ou todas.
- Excluir notificação.
- AC: Inbox funciona; contagem correta; ações funcionam.

**STORY-11.2 — Broadcast por loja/role**
- Admin envia para loja específica + role específica.
- RPC send_broadcast_notification: explode para N destinatários.
- Broadcast_id para agrupar.
- AC: Todos os destinatários recebem; broadcast rastreado.

**STORY-11.3 — Real-time updates**
- Subscription postgres_changes para INSERT e UPDATE.
- Badge atualiza instantaneamente.
- AC: Notificação aparece em tempo real sem refresh.

**STORY-11.4 — Rastreamento de leitura**
- notification_reads populado via trigger.
- AC: Registro de leitura criado automaticamente.

**STORY-11.5 — Notificações automáticas de disciplina**
- Edge Function relatorio-matinal gera notificações tipo 'discipline' para vendedores sem check-in.
- AC: Vendedor sem check-in recebe notificação.

**STORY-11.6 — Notificações automáticas de performance**
- Edge Function feedback-semanal gera notificações tipo 'performance' para vendedores com gargalo.
- Link para /treinamentos.
- AC: Vendedor com gargalo recebe notificação com link.

---

## EPIC 12 — Relatórios Automatizados

**Objetivo:** Geração automática de relatórios matinal, semanal e mensal com email, XLSX e WhatsApp.

### Stories

**STORY-12.1 — Relatório matinal automático**
- pg_cron diário 08:30 BRT.
- Edge Function relatorio-matinal.
- Ranking do mês, vendas por canal, projeção, gap, sem registro.
- Email HTML + XLSX via Resend.
- Notificações disciplina.
- Idempotência via reprocess_logs.
- AC: Email enviado diariamente; XLSX correto; notificações geradas.

**STORY-12.2 — Relatório semanal automático**
- pg_cron segunda 12:30 BRT.
- Edge Function feedback-semanal.
- Análise de funil por vendedor, benchmarks, gargalo, diagnóstico.
- Email HTML + XLSX.
- Notificações gargalo.
- Upsert weekly_feedback_reports.
- AC: Relatório semanal enviado; gargalos identificados.

**STORY-12.3 — Relatório mensal automático**
- pg_cron dia 1° 10:30 BRT.
- Edge Function relatorio-mensal.
- Vendas totais por canal, ranking completo, atingimento meta.
- Email HTML + XLSX.
- AC: Relatório mensal enviado com dados completos.

**STORY-12.4 — Trigger manual de relatórios**
- Admin dispara pelo Painel Consultor.
- Gerente dispara matinal pela Rotina.
- AC: Relatório gerado manualmente sob demanda.

**STORY-12.5 — Preview e download do matinal**
- Tela Morning Report com preview.
- Download XLSX manual.
- Compartilhamento WhatsApp manual.
- AC: Download e compartilhamento funcionam.

**STORY-12.6 — Configuração de cron jobs**
- SQL functions: configure_morning_report_cron, configure_weekly_feedback_cron, configure_monthly_report_cron.
- Tokens via Supabase Vault.
- AC: Cron jobs reconfiguráveis.

---

## EPIC 13 — Rotina do Gerente

**Objetivo:** Checklist diário do gerente com dados operacionais e ações.

### Stories

**STORY-13.1 — Registro de rotina diária**
- Check-ins pendentes, sem registro, agendamentos hoje (carteira/internet), leads/vendas ontem, snapshot ranking, notas.
- Upsert por loja + gerente + data.
- AC: Rotina registrada sem duplicação.

**STORY-13.2 — Histórico de rotina**
- Últimos 7 dias.
- AC: Histórico exibido corretamente.

**STORY-13.3 — Ações na rotina**
- Enviar notificações a partir da rotina.
- Disparar relatório matinal.
- AC: Notificação enviada; matinal disparado.

---

## EPIC 14 — Reprocessamento e Importação

**Objetivo:** Importação de dados históricos via CSV com validação e reprocessamento.

### Stories

**STORY-14.1 — Importação CSV**
- Upload de arquivo CSV.
- Headers: DATA, LOJA, VENDEDOR, LEADS, AGD_CART, AGD_NET, VND_PORTA, VND_CART, VND_NET, VISITA.
- Validação de headers e dados.
- AC: CSV importado; erros reportados.

**STORY-14.2 — Normalização de headers legados**
- Mapeamento fuzzy: VENDAS PORTA→VND_PORTA, AGENDAMENTO CARTEIRA→AGD_CART, etc.
- AC: Headers legados normalizados corretamente.

**STORY-14.3 — Processamento batch**
- RPC process_import_data: resolve loja/vendedor, upsert checkins, deduplica.
- Contagem de success/failure.
- AC: Dados processados; duplicatas ignoradas.

**STORY-14.4 — Logs de reprocessamento**
- reprocess_logs com status, rows, falhas, file_hash, timestamps.
- raw_imports para auditoria dos dados brutos.
- AC: Log completo de cada importação.

**STORY-14.5 — SQL executor (admin)**
- Edge Function db-executor para SQL arbitrário.
- AC: Admin executa queries arbitrárias.

---

## EPIC 15 — Auditoria e Diagnósticos

**Objetivo:** Trilha de auditoria e views de diagnóstico.

### Stories

**STORY-15.1 — Audit logs gerais**
- Tabela audit_logs: user_id, action, entity, entity_id, details_json, timestamp.
- AC: Operações sensíveis logadas.

**STORY-15.2 — Audit logs de check-in**
- checkin_audit_logs imutável: checkin_id, old_values, new_values, changed_by, change_type.
- AC: Correção de check-in gera audit log.

**STORY-15.3 — Audit logs de configuração**
- store_meta_rules_history: old_values, new_values, changed_by.
- AC: Mudança de meta gera audit log.

**STORY-15.4 — Real-time audit logs**
- Subscription postgres_changes para novos audit logs.
- Tela AiDiagnostics com logs em tempo real.
- AC: Logs aparecem sem refresh.

**STORY-15.5 — Views de diagnóstico**
- view_sem_registro: vendedores sem check-in hoje.
- view_store_daily_production: produção agregada por loja/dia.
- view_seller_tenure_status: vigências ativas.
- view_daily_team_status: status diário da equipe.
- AC: Views retornam dados corretos.

---

## EPIC 16 — CRM de Consultoria

**Objetivo:** Gestão de clientes da consultoria MX com unidades, contatos, visitas PMR, financeiro e Google Calendar.

### Stories

**STORY-16.1 — Schema base de clientes**
- Tabela consulting_clients: nome, razão social, CNPJ, produto contratado, status, notas, loja primária.
- RLS com can_access_consulting_client().
- Rollback: DROP TABLE consulting_clients.
- AC: Cliente criado; admin acessa; não-admin bloqueado.

**STORY-16.2 — Rota e dashboard de consultoria**
- Rota /consultoria (admin only).
- Dashboard com: total clientes, ativos, suspensos, visitas pendentes.
- Hook useConsultingClientMetrics.
- Rollback: Remover rota e componente.
- AC: Dashboard exibe métricas corretas.

**STORY-16.3 — Listagem de clientes**
- Rota /consultoria/clientes com DataGrid: nome, produto, status, consultor responsável.
- Filtros por status. Paginação.
- Hook useConsultingClients.
- Rollback: Remover rota e componente.
- AC: Listagem filtrada; admin vê todos.

**STORY-16.4 — Formulário de cadastro de cliente**
- Dialog/form de novo cliente com campos: nome, razão social, CNPJ, produto, status, notas.
- Validação de campos obrigatórios (nome, produto).
- Rollback: Remover dialog.
- AC: Cliente criado via UI; aparece na listagem.

**STORY-16.5 — Unidades por cliente**
- Tabela consulting_client_units: nome, cidade, UF, is_primary.
- Cadastro inline no detalhe do cliente.
- Rollback: DROP TABLE; remover seção da UI.
- AC: Unidade criada e vinculada ao cliente.

**STORY-16.6 — Contatos por cliente**
- Tabela consulting_client_contacts: nome, email, telefone, cargo, is_primary.
- Cadastro inline no detalhe do cliente.
- Rollback: DROP TABLE; remover seção da UI.
- AC: Contato criado e vinculado ao cliente.

**STORY-16.7 — Tela de detalhe do cliente com abas**
- Rota /consultoria/clientes/:clientId com abas: dados, unidades, contatos, consultores, visitas, financeiro, agenda Google.
- Aba "dados" funcional; demais abas em estado vazio/preparado.
- Rollback: Remover rota e componente.
- AC: Detalhe carrega com dados do cliente.

**STORY-16.8 — Atribuição de consultores**
- Tabela consulting_assignments: user_id, assignment_role (responsavel/auxiliar/viewer), active.
- Toggle ativo/inativo no detalhe do cliente.
- Lista de usuários disponíveis via hook.
- Rollback: DROP TABLE; remover seção.
- AC: Consultor atribuído; toggle funciona.

**STORY-16.9 — Schema de visitas PMR**
- Tabela consulting_visits: visit_number, scheduled_at, duration, modality, status, consultant, auxiliary, objective, checklist_data (JSONB), feedback, executive_summary, google_event_id.
- Tabela consulting_methodology_steps: 7 visitas com objetivo, alvo, duração, evidência.
- RLS com can_access_consulting_client().
- Rollback: DROP TABLES.
- AC: Visitas e steps criados no banco.

**STORY-16.10 — Listagem de visitas no detalhe do cliente**
- Aba "visitas" mostra lista de visitas com status, data, consultor.
- Status badges: agendada (amarelo), em_andamento (azul), concluida (verde), cancelada (vermelho).
- Rollback: Remover seção da aba.
- AC: Visitas listadas com status correto.

**STORY-16.11 — Execução de visita com checklist**
- Rota /consultoria/clientes/:clientId/visitas/:visitNumber.
- Checklist interativo baseado em methodology_steps.
- Campos obrigatórios bloqueiam fechamento.
- Salva checklist_data como JSONB.
- Rollback: Remover rota e componente.
- AC: Etapas preenchidas; obrigatórias bloqueiam; dados salvos.

**STORY-16.12 — Finalização de visita e relatório**
- Status transiciona para concluida.
- Campos de feedback_client e executive_summary editáveis.
- Rollback: Remover funcionalidade de status.
- AC: Visita finalizada; relatório salvo.

**STORY-16.13 — Dados financeiros por cliente**
- Tabela consulting_financials: receita, despesas fixas, marketing, investimentos, financiamento, lucro, ROI, taxa conversão.
- Aba financeiro no detalhe do cliente.
- Unicidade por cliente + data referência.
- Rollback: DROP TABLE; remover aba.
- AC: Dados financeiros registrados e exibidos.

**STORY-16.14 — OAuth2 Google Calendar**
- Edge Function google-oauth-handler: troca code por tokens.
- Tabela consulting_oauth_tokens: access_token, refresh_token, expires_at, scopes.
- Tabela consulting_calendar_settings: google_calendar_id, sync_active, last_sync_at.
- Component GoogleCalendarView com botão conectar na aba agenda.
- Rollback: Deletar Edge Function; DROP TABLES; remover componente.
- AC: OAuth flow funciona; tokens armazenados; status exibido.

---

## EPIC 17 — Produtos Digitais

**Objetivo:** Catálogo de produtos digitais.

### Stories

**STORY-17.1 — CRUD de produtos digitais**
- Admin cria/edita/exclui: nome, descrição, link.
- Todos visualizam.
- AC: Produto criado; listagem exibe todos.

---

## EPIC 18 — Configurações

**Objetivo:** Tela unificada de configuração operacional por loja.

### Stories

**STORY-18.1 — Config operacional por loja**
- /configuracoes/operacional (admin only).
- Meta, benchmarks, delivery rules, vigências.
- Salva tudo em paralelo.
- AC: Config salva; dados persistidos.

**STORY-18.2 — Vigências de vendedores**
- Adicionar vigência (started_at, closing_month_grace).
- Encerrar vigência (ended_at).
- AC: Vigência criada e encerrada.

---

## EPIC 19 — Layout e Navegação

**Objetivo:** Shell de layout com sidebar role-based, mobile nav e store switcher.

### Stories

**STORY-19.1 — Layout principal com sidebar**
- Sidebar categorizada: Governança MX, Rituais MX, Sustentação.
- Items filtrados por role.
- Store switcher para admin/dono.
- Badge de notificações.
- AC: Sidebar correta por role; store switcher funciona.

**STORY-19.2 — Bottom bar mobile**
- Navegação mobile com ícones.
- Menu overlay full-screen.
- AC: Navegação mobile funcional.

**STORY-19.3 — Lazy loading e Suspense**
- Todas as páginas lazy-loaded.
- Spinner central durante carregamento.
- AC: Carregamento sem flash branco.

---

## EPIC 20 — Design System e Componentes

**Objetivo:** Biblioteca de componentes atômicos consistentes.

### Stories

**STORY-20.1 — Átomos (Typography, Button, Input, Badge, Skeleton, Textarea)**
- CVA variants com tokens MX.
- Tipografia uppercase, heavy, tracking.
- Botões: primary, secondary, success, warning, info, danger, outline, ghost.
- AC: Componentes renderizam com variantes corretas.

**STORY-20.2 — Moléculas (Card, MXScoreCard, FormField)**
- Card com subcomponentes.
- MXScoreCard com tone, ícone, loading skeleton.
- FormField com label, ícone, validação de erro.
- AC: Moléculas renderizam e interagem corretamente.

**STORY-20.3 — Organismo DataGrid**
- Desktop: tabela com sticky header, animação.
- Mobile: cards com headers.
- Loading skeleton, empty state, row click.
- AC: DataGrid responsivo com animação.

**STORY-20.4 — UI Radix/shadcn (22 componentes)**
- Dialog, Tabs, Select, Switch, Checkbox, Table, Avatar, DropdownMenu, Tooltip, Progress, ScrollArea, Separator, Label, Toaster, Chart.
- AC: Componentes Radix estilizados com tokens MX.

---

## EPIC 21 — Bibliotecas e Motor de Cálculos

**Objetivo:** Motor de cálculos central e utilitários.

### Stories

**STORY-21.1 — Motor de cálculos (calculations.ts)**
- calcularTotais, calcularAtingimento, calcularFaltaX, calcularProjecao, calcularRitmo.
- isBusinessDay, getBusinessDaysInMonth, getDiasInfo.
- calcularFunil, gerarDiagnosticoMX, validarFunil.
- calcularScoreMX, getOperationalStatus.
- somarVendas, somarVendasPorCanal.
- MX_BENCHMARKS (20/60/33).
- formatWhatsAppMorningReport, formatStructuredWhatsAppFeedback.
- AC: Todos os cálculos corretos com testes.

**STORY-21.2 — Utilitários**
- cn() (Tailwind merge), toCamelCase(), toSnakeCase().
- Supabase client singleton.
- Exportação Excel (xlsx).
- Email sender (Resend).
- CSV parser com validação.
- AC: Utilitários funcionais.

**STORY-21.3 — Validação de dados**
- legacy-normalizer: headers legados → canônicos.
- checkin-validator: validação de payload.
- migration-validator: validação de dados de migração.
- AC: Dados inválidos rejeitados com mensagens claras.

---

## Resumo do Backlog

| Epic | Módulo | Stories | Prioridade |
|------|--------|---------|------------|
| 01 | Autenticação e Autorização | 6 | P0 |
| 02 | Gestão de Lojas e Rede | 4 | P0 |
| 03 | Check-in Diário | 6 | P0 |
| 04 | Ranking e Performance | 6 | P1 |
| 05 | Funil MX | 3 | P1 |
| 06 | Metas e Regras | 5 | P1 |
| 07 | Feedback Semanal | 6 | P1 |
| 08 | PDI | 5 | P1 |
| 09 | PDI MX 360 | 11 | P2 |
| 10 | Treinamentos | 5 | P1 |
| 11 | Notificações | 6 | P1 |
| 12 | Relatórios Automatizados | 6 | P1 |
| 13 | Rotina do Gerente | 3 | P1 |
| 14 | Reprocessamento e Importação | 5 | P2 |
| 15 | Auditoria e Diagnósticos | 5 | P2 |
| 16 | CRM de Consultoria | 13 | P2 |
| 17 | Produtos Digitais | 1 | P2 |
| 18 | Configurações | 2 | P1 |
| 19 | Layout e Navegação | 3 | P0 |
| 20 | Design System | 4 | P0 |
| 21 | Bibliotecas e Motor | 3 | P0 |
| **TOTAL** | **21 módulos** | **107 stories** |

---

## Mapa de Dependências entre Epics

```
P0 (Fundação — pré-requisito de tudo):
  EPIC 21 (Motor) ─┐
  EPIC 20 (Design) ─┤
  EPIC 19 (Layout) ─┤
  EPIC 01 (Auth) ───┤
       │            │
       ▼            │
  EPIC 02 (Lojas) ◄─┘
       │
       ├─► EPIC 03 (Check-in) ──► EPIC 04 (Ranking)
       │                        ──► EPIC 05 (Funil) ──► EPIC 10 (Treinamentos)
       │                        ──► EPIC 13 (Rotina)
       │
       ├─► EPIC 06 (Metas)
       ├─► EPIC 07 (Feedback) ──► EPIC 12 (Relatórios)
       ├─► EPIC 08 (PDI) ──► EPIC 09 (PDI 360)
       ├─► EPIC 11 (Notificações) [cross-cutting]
       ├─► EPIC 14 (Reprocessamento)
       ├─► EPIC 15 (Auditoria)
       ├─► EPIC 16 (CRM Consultoria)
       ├─► EPIC 17 (Produtos Digitais)
       └─► EPIC 18 (Configurações)

Dependências críticas:
- EPIC 01 → TUDO (auth gate)
- EPIC 02 → TUDO operacional (multi-tenant)
- EPIC 21 → EPIC 04, 05, 12 (motor de cálculos)
- EPIC 03 → EPIC 04, 05 (dados para ranking e funil)
- EPIC 05 → EPIC 10 (gargalo → prescrição treinamento)
- EPIC 11 é cross-cutting: usado por EPIC 03, 07, 10, 12, 13
```

---

## Rollback por Story

Cada story deve ter estratégia de rollback documentada. Padrão:

| Tipo de Story | Estratégia de Rollback |
|---------------|----------------------|
| Nova tabela/migration | `DROP TABLE` + remover migration; dados criados são perdidos |
| Nova rota/página | Remover rota do App.tsx; deletar arquivo da página; sem impacto em core |
| Novo hook | Remover import do hook; deletar arquivo; componentes que usavam quebram (reverter também) |
| Novo componente | Remover import; deletar arquivo; pages que usavam precisam ser revertidas |
| Alteração em página existente | `git revert` do commit da story |
| Alteração em hook existente | `git revert` + verificar pages que dependem |
| Edge Function nova | Deletar diretório da function; sem impacto em core |
| Trigger/RPC nova | `DROP FUNCTION` / `DROP TRIGGER`; sem impacto em dados existentes |
| RLS policy | `DROP POLICY`; tabela fica sem restrição (dev only) |

### Rollback por Epic

| Epic | Rollback | Impacto |
|------|----------|---------|
| EPIC 01 | Reverter para auth legada | Crítico — sem auth, sistema inteiro para |
| EPIC 02 | Remover rotas /lojas, /loja | Médio — lojas ficam sem gestão |
| EPIC 03 | Remover rota /checkin | Médio — checkins param, ranking fica sem dados |
| EPIC 04 | Remover rota /ranking | Baixo — sem visualização, dados preservados |
| EPIC 05 | Remover rota /funil | Baixo — sem diagnóstico |
| EPIC 06 | Remover config screens | Médio — configs voltam ao banco direto |
| EPIC 07 | Remover rota /feedback | Médio — feedbacks param |
| EPIC 08-09 | Remover rotas /pdi | Médio — PDIs param |
| EPIC 10 | Remover rota /treinamentos | Baixo — treinamentos preservados no banco |
| EPIC 11 | Remover rota /notificacoes | Baixo — notificações acumulam sem UI |
| EPIC 12 | Desativar pg_cron + Edge Functions | Médio — relatórios param |
| EPIC 13 | Remover rota /rotina | Baixo |
| EPIC 14 | Remover rota /reprocessamento | Baixo — imports param |
| EPIC 15 | Remover rota /auditoria | Baixo — logs continuam no banco |
| EPIC 16 | Remover rotas /consultoria* | Baixo — core não afetado |
| EPIC 17 | Remover rota /produtos | Baixo |
| EPIC 18 | Remover rota /configuracoes/operacional | Baixo — config via banco |
| EPIC 19-21 | Reverter para UI anterior | Crítico — shell do sistema |
