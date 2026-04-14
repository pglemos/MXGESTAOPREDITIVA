# PRD — MX PERFORMANCE (Sistema Completo)

**Status:** Em produção (refinamento contínuo)
**Data:** 2026-04-14
**Versão:** 1.0
**Stack:** React 19, Vite 6, TypeScript 5.8, Supabase (Postgres + Auth + Edge Functions + Storage), Tailwind CSS 4, Radix UI, Recharts, Motion, Sonner, Vercel

---

## 1. Visão Geral do Produto

### 1.1 O que é o MX Performance

Sistema operacional de gestão de performance comercial em lojas automotivas, com foco nos rituais da Metodologia MX: lançamento diário, funil 20/60/33, ranking, feedback estruturado, PDI, treinamentos, relatórios recorrentes, automações e reprocessamento de dados.

### 1.2 Identidade

- **Nome do produto:** MX PERFORMANCE
- **Repositório:** github.com/pglemos/MXGESTAOPREDITIVA
- **Deploy:** Vercel (frontend) + Supabase (backend)
- **Domínio público:** mxperformance.vercel.app

### 1.3 Problema que resolve

Lojas automotivas operam vendas sem visibilidade de funil, sem acompanhamento estruturado de vendedores, sem feedback contínuo, sem PDIs formais e sem relatórios automatizados. A MX Consultoria atende múltiplas lojas e precisa governar tudo de um lugar.

### 1.4 Objetivos do produto

- Operacionalizar a Metodologia MX em todas as lojas atendidas.
- Padronizar check-in diário, ranking, feedback e PDI.
- Automatizar relatórios matinais, semanais e mensais por email e WhatsApp.
- Dar visibilidade gerencial ao dono da agência e ao admin MX.
- Conectar gargalo de funil a treinamento prescrito automaticamente.
- Permitir reprocessamento e auditoria de dados históricos.
- Gerir carteira de clientes da consultoria MX com CRM dedicado.

### 1.5 KPIs de sucesso do produto

| KPI | Meta | Como medir | Fonte |
|-----|------|------------|-------|
| Taxa de check-in no prazo | >= 85% dos check-ins com submission_status = 'on_time' | `daily_checkins.submission_status` | Banco |
| Cobertura de feedback semanal | >= 80% dos vendedores ativos recebem feedback por semana | `feedbacks` vs `store_sellers` ativos | Banco |
| Ciência de feedback | >= 70% dos feedbacks recebem acknowledge em até 48h | `feedbacks.acknowledged` + `acknowledged_at` | Banco |
| Cobertura de PDI | >= 90% dos vendedores com PDI ativo (status em aberto ou em_andamento) | `pdis` vs `store_sellers` | Banco |
| Precisão do relatório matinal | 0 erros em dados de ranking por loja (comparar com source) | `reprocess_logs.status` + feedback admin | Auditoria |
| Tempo de setup de nova loja | < 10 minutos (criação + meta + delivery rules + primeiro vendedor) | Timestamp entre criação e config completa | Banco |
| Adoção de treinamento por gargalo | >= 60% dos vendedores com gargalo completam treinamento prescrito | `training_progress` + `useTacticalPrescription` | Banco |
| Zero regressão no core | 0 testes falhando em CI após cada release | CI: npm run lint + typecheck + test + build | CI |
| Uptime do sistema | >= 99.5% durante horário comercial (8h-20h BRT) | Vercel + Supabase monitoring | Infra |
| NPS do admin MX | >= 8/10 satisfação com o sistema | Pesquisa trimestral | Manual |

---

## 2. Personas e Roles

### 2.1 Roles do sistema (Supabase `users.role` + `memberships.role`)

| Role | Tipo | Origem | Descrição |
|------|------|--------|-----------|
| **admin** | UserRole | Tabela `users` | Representa a MX Consultoria. Governança total sobre lojas, usuários, metas, benchmarks, treinamentos, consultoria, relatórios, reprocessamento. Alias legado `consultor` normalizado para `admin`. |
| **dono** | UserRole + MembershipRole | `users` + `memberships` | Dono de uma ou mais agências de carro. Acompanha suas lojas, performance da equipe, metas, funil, relatórios, feedbacks e PDIs. Visão executiva sem operar rotina diária. |
| **gerente** | MembershipRole | `memberships` | Gerente de uma agência. Opera o painel da loja, equipe, metas, funil, ranking, feedback, PDI, treinamentos e rotina gerencial diária. |
| **vendedor** | MembershipRole | `memberships` | Vendedor de uma agência. Registra check-in diário, acompanha histórico, ranking, feedback recebido, PDI, treinamentos e notificações. |

### 2.2 Regras de autenticação e autorização

- Autenticação via Supabase Auth (email/senha).
- Alias legados normalizados: `consultor → admin`, `owner → dono`, `manager → gerente`, `seller → vendedor`.
- Multi-tenant via `memberships`: usuário pertence a N lojas com um role por loja.
- **Zero Trust:** não-admin sem nenhuma membership ativa é deslogado automaticamente.
- Admin sem memberships recebe fallback storeId para operação global.
- Troca de loja ativa via `setActiveStoreId()` para admin/dono.

### 2.3 Role Redirect (pós-login)

| Role | Redireciona para |
|------|-----------------|
| admin | `/painel` |
| dono | `/lojas` |
| gerente | `/loja` |
| vendedor | `/home` |

---

## 3. Módulos do Sistema

O sistema é composto por 19 módulos funcionais:

| # | Módulo | Descrição |
|---|--------|-----------|
| 1 | Autenticação e Autorização | Login, roles, memberships, zero trust |
| 2 | Gestão de Lojas | CRUD de lojas, stats, disciplina |
| 3 | Check-in Diário | Lançamento de métricas com deadline e lock |
| 4 | Ranking e Performance | Ranking mensal com meta, projeção, ritmo |
| 5 | Funil MX | Diagnóstico de gargalo com benchmarks 20/60/33 |
| 6 | Metas e Regras | Meta mensal, modo projeção, benchmarks, regras venda-loja |
| 7 | Feedback Semanal | Feedback estruturado com análise de funil |
| 8 | PDI (Plano de Desenvolvimento Individual) | PDI com 10 competências, metas 6/12/24 meses |
| 9 | PDI MX 360 | PDI avançado com wizard, radar, cargos, ações sugeridas |
| 10 | Treinamentos | Vídeos por público-alvo, progresso, prescrição por gargalo |
| 11 | Notificações | Inbox por usuário, broadcast por role/loja, real-time |
| 12 | Relatórios Automatizados | Matinal, semanal, mensal via Edge Functions |
| 13 | Rotina do Gerente | Checklist diário, agendamentos, ranking, notas |
| 14 | Reprocessamento e Importação | Importação CSV, reprocessamento, logs |
| 15 | Auditoria e Diagnósticos | Audit logs, check-in corrections, AI diagnostics |
| 16 | CRM de Consultoria | Clientes, unidades, contatos, visitas PMR, financeiro |
| 17 | Produtos Digitais | Catálogo de produtos digitais |
| 18 | Configurações | Config operacional, regras entrega, vigências |
| 19 | Perfil do Usuário | Dados pessoais, troca de senha |

---

## 4. Requisitos Funcionais por Módulo

### Módulo 1 — Autenticação e Autorização

FR-AUTH-01: O sistema deve autenticar via Supabase Auth com email e senha.
FR-AUTH-02: O sistema deve normalizar roles legados (consultor→admin, owner→dono, manager→gerente, seller→vendedor).
FR-AUTH-03: O sistema deve redirecionar para a tela correta após login (admin→/painel, dono→/lojas, gerente→/loja, vendedor→/home).
FR-AUTH-04: O sistema deve deslogar automaticamente não-admins sem memberships ativas (Zero Trust).
FR-AUTH-05: O sistema deve permitir troca de loja ativa para admin e dono.
FR-AUTH-06: O sistema deve criar perfil automaticamente ao registrar via Supabase Auth (trigger on_auth_user_created).
FR-AUTH-07: O sistema deve desativar usuários órfãos (sem memberships ou store_sellers ativos) via trigger automático.
FR-AUTH-08: O sistema deve manter sessão com refresh token automático via Supabase.
FR-AUTH-09: O sistema deve persistir estado de auth em React Context com provider global.

### Módulo 2 — Gestão de Lojas

FR-STORE-01: Admin deve criar, editar, excluir e ativar/desativar lojas.
FR-STORE-02: Dono deve ver apenas suas lojas (filtrado por memberships).
FR-STORE-03: Gerente deve ver apenas a loja atribuída.
FR-STORE-04: A listagem de lojas deve mostrar: nome, status, total vendedores, vendedores com check-in, % disciplina.
FR-STORE-05: Cada loja deve ter source_mode (legacy_forms, native_app, hybrid).
FR-STORE-06: Admin deve poder gerenciar a hierarquia da rede (promover/demover/remover membros por loja).

### Módulo 3 — Check-in Diário

FR-CHK-01: Vendedor deve registrar check-in diário com métricas: leads dia anterior, agendamentos carteira/internet dia anterior e hoje, vendas porta/carteira/internet dia anterior, visitas dia anterior.
FR-CHK-02: O sistema deve calcular data de referência como dia anterior (produção declarada = D-1).
FR-CHK-03: O sistema deve marcar check-in como atrasado se submetido após 09:30 BRT.
FR-CHK-04: O sistema deve bloquear edição do check-in após 09:45 BRT.
FR-CHK-05: O sistema deve permitir motivo de zero vendas (zero_reason) e notas.
FR-CHK-06: O sistema deve validar unicidade por vendedor + loja + data de referência (upsert).
FR-CHK-07: O sistema deve sanitizar inputs contra XSS.
FR-CHK-08: O sistema deve registrar submission_status (on_time/late) automaticamente via trigger.
FR-CHK-09: O sistema deve sincronizar colunas canônicas e legadas via trigger sync_daily_checkins_canonical.
FR-CHK-10: O sistema deve suportar scope (daily, adjustment, historical).
FR-CHK-11: O sistema deve suportar venda-loja (is_venda_loja) com regras configuráveis por loja.
FR-CHK-12: O sistema deve gerenciar corretivas retroativas com workflow de aprovação (vendedor solicita → gerente aprova/rejeita).
FR-CHK-13: O sistema deve manter trilha de auditoria imutável para todas as correções de check-in.

### Módulo 4 — Ranking e Performance

FR-RNK-01: O sistema deve gerar ranking mensal por vendedor com: vendas totais, leads, agendamentos, visitas, meta individual, atingimento %, projeção, ritmo, gap, eficiência, posição.
FR-RNK-02: O sistema deve calcular meta individual a partir da meta da loja dividida pelo número de vendedores (modo even) ou configurável.
FR-RNK-03: O sistema deve calcular projeção mensal com base em vendas acumuladas e dias decorridos/total.
FR-RNK-04: O sistema deve calcular ritmo diário necessário para atingir a meta.
FR-RNK-05: O sistema deve calcular score MX (0-1800+) baseado em vendas, meta, funil e disciplina.
FR-RNK-06: O sistema deve classificar vendedor com status operacional (verde/amarelo/vermelho).
FR-RNK-07: O sistema deve gerar ranking global cross-loja (rede inteira) para admin.
FR-RNK-08: O sistema deve calcular performance por loja com semáforo (verde/amarelo/vermelho).
FR-RNK-09: O sistema deve cachear ranking por 5 minutos no localStorage.

### Módulo 5 — Funil MX

FR-FUN-01: O sistema deve exibir funil com 4 etapas: Leads → Agendamentos → Visitas → Vendas.
FR-FUN-02: O sistema deve calcular taxas de conversão: Lead→Agd, Agd→Visita, Visita→Venda.
FR-FUN-03: O sistema deve comparar conversões com benchmarks configuráveis (padrão 20/60/33).
FR-FUN-04: O sistema deve identificar o gargalo do funil (LEAD_AGD, AGD_VISITA, VISITA_VND).
FR-FUN-05: O sistema deve gerar diagnóstico textual e sugestão de ação para o gargalo.
FR-FUN-06: O sistema deve validar consistência lógica do funil.
FR-FUN-07: O sistema deve mostrar agregação por canal (Porta, Carteira, Internet).

### Módulo 6 — Metas e Regras

FR-META-01: O sistema deve permitir definir meta mensal por loja em store_meta_rules.
FR-META-02: O sistema deve suportar modos de projeção: calendário (todos os dias) ou dias úteis.
FR-META-03: O sistema deve suportar modos de meta individual: even (dividido igual), custom, proportional.
FR-META-04: O sistema deve configurar se venda-loja entra no total da loja e/ou na meta individual.
FR-META-05: O sistema deve configurar benchmarks por loja (lead_agd, agd_visita, visita_vnd).
FR-META-06: O sistema deve configurar regras de entrega de email por loja (destinatários matinal, semanal, mensal).
FR-META-07: O sistema deve registrar auditoria de alterações em store_meta_rules.
FR-META-08: O sistema deve permitir admin editar todas as configurações operacionais de uma loja em tela unificada.
FR-META-09: O sistema deve permitir gerenciar vigências de vendedores por loja (data início, data fim, closing_month_grace).

### Módulo 7 — Feedback Semanal

FR-FB-01: Gerente/admin deve criar feedback semanal por vendedor com: leads, agd, visitas, vendas, taxas de conversão, meta compromisso, pontos positivos, pontos de atenção, ação.
FR-FB-02: O sistema deve calcular automaticamente taxas de conversão e média da equipe.
FR-FB-03: O sistema deve incluir diagnóstico JSON com snapshot vendedor vs equipe.
FR-FB-04: O sistema deve garantir unicidade por vendedor + semana (upsert).
FR-FB-05: Vendedor deve visualizar feedback recebido e dar ciência (acknowledge).
FR-FB-06: O sistema deve impedir que vendedor edite campos do feedback (trigger feedbacks_seller_ack_only), apenas acknowledge.
FR-FB-07: Gerente deve poder enviar feedback individual por email (Edge Function send-individual-feedback).
FR-FB-08: O sistema deve gerar relatórios semanais consolidados por loja com ranking, benchmarks e status de envio.
FR-FB-09: O sistema deve exibir feedback com comparação Real vs Ideal usando benchmarks MX.

### Módulo 8 — PDI (Plano de Desenvolvimento Individual)

FR-PDI-01: Gerente/admin deve criar PDI para vendedor com 10 competências (escala 1-10): prospecção, abordagem, demonstração, fechamento, CRM, digital, disciplina, organização, negociação, produto.
FR-PDI-02: PDI deve ter metas de 6, 12 e 24 meses e até 5 ações de desenvolvimento.
FR-PDI-03: PDI deve ter data limite e status (aberto, em_andamento, concluido).
FR-PDI-04: Vendedor deve visualizar PDI e dar ciência (acknowledge).
FR-PDI-05: Gerente/admin deve criar revisões de PDI com notas de evolução, dificuldades e ajustes.
FR-PDI-06: O sistema deve manter colunas legadas (objective, action) sincronizadas via trigger.
FR-PDI-07: O sistema deve suportar impressão de PDI formatado.
FR-PDI-08: O sistema deve restringir criação/edição de PDI a admin e gerente; vendedor pode apenas visualizar e dar ciência.

### Módulo 9 — PDI MX 360

FR-PDI360-01: O sistema deve fornecer wizard de PDI em 4 etapas: Especialista (seleção + cargo), Metas (9 metas pessoais/profissionais), Mapeamento (competências com sliders + radar), Plano de Ação (top 5 gaps com ações sugeridas).
FR-PDI360-02: O sistema deve ter tabela de níveis de cargo (Higienizador → CEO, notas 1-25) com descritores de escala.
FR-PDI360-03: O sistema deve ter 18 competências (10 técnicas + 8 comportamentais) com indicadores.
FR-PDI360-04: O sistema deve sugerir ações por competência via tabela pdi_acoes_sugeridas.
FR-PDI360-05: O sistema deve exibir frases inspiracionais durante a sessão.
FR-PDI360-06: O sistema deve criar sessão PDI completa atomicamente via RPC create_pdi_session_bundle (sessão + metas + avaliações + plano de ação).
FR-PDI360-07: O sistema deve permitir impressão do bundle completo via RPC get_pdi_print_bundle.
FR-PDI360-08: Cada ação do plano deve ter: data conclusão, impacto (baixo/medio/alto), custo (baixo/medio/alto), status, evidência e aprovação.
FR-PDI360-09: O sistema deve permitir aprovação de evidência de ação via RPC approve_pdi_action_evidence.
FR-PDI360-10: O sistema deve exibir radar chart (Recharts) com notas atribuídas vs alvo.

### Módulo 10 — Treinamentos

FR-TRN-01: Admin deve criar treinamentos com: título, descrição, tipo (prospeccao, fechamento, atendimento, gestao, pre-vendas), URL do vídeo, público-alvo (vendedor, gerente, todos).
FR-TRN-02: O sistema deve filtrar treinamentos por público-alvo do usuário logado.
FR-TRN-03: Vendedor/gerente deve marcar treinamento como assistido.
FR-TRN-04: O sistema deve prescrever treinamento automaticamente com base no gargalo de funil (LEAD_AGD→prospeccao, AGD_VISITA→atendimento, VISITA_VND→fechamento).
FR-TRN-05: O sistema deve exibir progresso de treinamento por vendedor com % assistido e gap de funil.
FR-TRN-06: Gerente/admin deve poder enviar notificação de lembrete de treinamento a vendedores.
FR-TRN-07: Admin deve poder ativar/desativar treinamentos.

### Módulo 11 — Notificações

FR-NOT-01: O sistema deve ter inbox de notificações por usuário com contagem de não lidas.
FR-NOT-02: Usuário deve poder marcar como lida individualmente ou todas.
FR-NOT-03: Usuário deve poder excluir notificações.
FR-NOT-04: Admin deve poder enviar broadcast de notificação por loja e/ou role via RPC send_broadcast_notification.
FR-NOT-05: O sistema deve suportar tipos: system, discipline, performance, alert.
FR-NOT-06: O sistema deve suportar prioridades: low, medium, high.
FR-NOT-07: O sistema deve rastrear leitura via tabela notification_reads (trigger automático).
FR-NOT-08: O sistema deve suportar subscription real-time (Supabase postgres_changes) para atualização instantânea.
FR-NOT-09: Notificações de disciplina (check-in ausente) devem ser enviadas automaticamente pelo relatório matinal.
FR-NOT-10: Notificações de performance (gargalo de funil) devem ser enviadas automaticamente pelo relatório semanal.

### Módulo 12 — Relatórios Automatizados

FR-RPT-01: O sistema deve gerar relatório matinal automático diário às 08:30 BRT via pg_cron + Edge Function.
FR-RPT-02: O relatório matinal deve conter: ranking do mês, vendas por canal, projeção, gap, lista sem registro.
FR-RPT-03: O relatório matinal deve enviar email HTML com anexo XLSX via Resend para destinatários configurados por loja.
FR-RPT-04: O relatório matinal deve incluir link WhatsApp para compartilhamento manual.
FR-RPT-05: O relatório matinal deve gerar notificações de disciplina para vendedores sem check-in e gerentes.
FR-RPT-06: O sistema deve gerar relatório semanal automático toda segunda às 12:30 BRT.
FR-RPT-07: O relatório semanal deve conter: análise de funil por vendedor, comparação com benchmarks, diagnóstico de gargalo.
FR-RPT-08: O relatório semanal deve enviar email com anexo XLSX e notificações de gargalo por vendedor.
FR-RPT-09: O sistema deve gerar relatório mensal automático no 1° dia às 10:30 BRT.
FR-RPT-10: O relatório mensal deve conter: vendas totais por canal, ranking completo, atingimento da meta.
FR-RPT-11: O relatório mensal deve enviar email com anexo XLSX.
FR-RPT-12: Admin deve poder disparar qualquer relatório manualmente pelo Painel Consultor.
FR-RPT-13: Gerente deve poder disparar relatório matinal manualmente pela Rotina do Gerente.
FR-RPT-14: O sistema deve registrar execução em reprocess_logs com idempotência.
FR-RPT-15: O sistema deve permitir download manual de XLSX pela tela Morning Report.
FR-RPT-16: O sistema deve permitir compartilhamento WhatsApp manual pela tela Morning Report.

### Módulo 13 — Rotina do Gerente

FR-ROT-01: Gerente deve registrar rotina diária com: check-ins pendentes, sem registro, agendamentos carteira/internet hoje, leads/vendas dia anterior, snapshot do ranking, notas.
FR-ROT-02: O sistema deve garantir unicidade por loja + gerente + data.
FR-ROT-03: O sistema deve exibir histórico de 7 dias da rotina.
FR-ROT-04: Gerente deve poder enviar notificações a partir da rotina.
FR-ROT-05: Gerente deve poder disparar relatório matinal a partir da rotina.

### Módulo 14 — Reprocessamento e Importação

FR-REP-01: Admin deve poder importar dados via CSV com headers: DATA, LOJA, VENDEDOR, LEADS, AGD_CART, AGD_NET, VND_PORTA, VND_CART, VND_NET, VISITA.
FR-REP-02: O sistema deve normalizar headers legados para campos canônicos.
FR-REP-03: O sistema deve validar dados importados com relatório de erros e warnings.
FR-REP-04: O sistema deve processar importação em batch via RPC process_import_data com deduplicação.
FR-REP-05: O sistema deve manter log de reprocessamento com status, rows processados, falhas, file hash.
FR-REP-06: O sistema deve armazenar dados brutos em raw_imports para auditoria.
FR-REP-07: O sistema deve executar SQL arbitrário via Edge Function db-executor (admin only).

### Módulo 15 — Auditoria e Diagnósticos

FR-AUD-01: O sistema deve manter audit_logs para todas as operações sensíveis.
FR-AUD-02: O sistema deve manter checkin_audit_logs imutável para correções de check-in.
FR-AUD-03: O sistema deve manter store_meta_rules_history para alterações de configuração.
FR-AUD-04: O sistema deve exibir audit logs em tempo real via subscription.
FR-AUD-05: O sistema deve exibir view_sem_registro (vendedores sem check-in hoje).
FR-AUD-06: O sistema deve exibir view_store_daily_production (produção agregada por loja/dia).
FR-AUD-07: O sistema deve exibir view_seller_tenure_status (vigências ativas).
FR-AUD-08: O sistema deve exibir view_daily_team_status (status diário da equipe).

### Módulo 16 — CRM de Consultoria

FR-CRM-01: Admin deve cadastrar clientes da consultoria com: nome, razão social, CNPJ, produto contratado, status (ativo/inativo/suspenso/prospect), notas, loja primária.
FR-CRM-02: Admin deve cadastrar unidades por cliente com: nome, cidade, UF, unidade primária.
FR-CRM-03: Admin deve cadastrar contatos por cliente com: nome, email, telefone, cargo, contato primário.
FR-CRM-04: Admin deve atribuir consultores a clientes com role (responsavel, auxiliar, viewer) e toggle ativo.
FR-CRM-05: O sistema deve exibir dashboard de consultoria com: total clientes, ativos, suspensos, visitas pendentes.
FR-CRM-06: O sistema deve exibir detalhe do cliente com abas: dados, unidades, contatos, consultores, visitas, financeiro, agenda Google.
FR-CRM-07: O sistema deve suportar visitas PMR com: número da visita, data, duração, modalidade, status, consultor/auxiliar, objetivo, checklist_data (JSONB), feedback, resumo executivo.
FR-CRM-08: O sistema deve permitir execução de visita com checklist e campos obrigatórios.
FR-CRM-09: O sistema deve registrar dados financeiros por cliente e período: receita, despesas fixas, marketing, investimentos, financiamento, lucro líquido, ROI, taxa conversão.
FR-CRM-10: O sistema deve fornecer steps de metodologia PMR (7 visitas) com objetivo, alvo, duração, evidência requerida.
FR-CRM-11: O sistema deve suportar OAuth2 com Google Calendar para sincronização de agenda.
FR-CRM-12: O sistema deve armazenar tokens OAuth em consulting_oauth_tokens (access_token, refresh_token, expires_at, scopes).
FR-CRM-13: O sistema deve armazenar configurações de sincronização por cliente/consultor em consulting_calendar_settings.
FR-CRM-14: O sistema deve restringir acesso a clientes de consultoria via RLS com função can_access_consulting_client().

### Módulo 17 — Produtos Digitais

FR-PRD-01: Admin deve cadastrar produtos digitais com: nome, descrição, link.
FR-PRD-02: O sistema deve listar produtos digitais para todos os usuários autenticados.
FR-PRD-03: Apenas admin pode criar, editar e excluir produtos.

### Módulo 18 — Configurações

FR-CFG-01: Admin deve configurar todas as definições operacionais de uma loja em tela unificada: meta, benchmarks, regras de entrega, modo de projeção, regras venda-loja.
FR-CFG-02: Admin deve gerenciar vigências de vendedores (data início, data fim, grace period).
FR-CFG-03: O sistema deve salvar todas as configurações em paralelo (meta + benchmarks + delivery + vigências).
FR-CFG-04: Gerente/dono pode visualizar configurações mas não editar.

### Módulo 19 — Perfil do Usuário

FR-PRF-01: Usuário deve visualizar seus dados: nome, email, telefone, avatar, role.
FR-PRF-02: Usuário deve poder alterar nome, telefone e avatar.
FR-PRF-03: Usuário deve poder trocar sua senha.

---

## 5. Requisitos Não Funcionais

NFR-01: TypeScript estrito em todo o código.
NFR-02: Design system consistente com tokens MX (cores, espaçamento, tipografia).
NFR-03: RLS ativa em todas as tabelas com políticas por role.
NFR-04: Todas as páginas lazy-loaded com Suspense.
NFR-05: Responsivo para desktop e mobile (viewport a partir de 375px).
NFR-06: Navegação role-based com sidebar categorizada e bottom bar mobile.
NFR-07: Todas as operações de escrita gated por role no hook/frontend E no RLS.
NFR-08: Audit trail para operações sensíveis (correções de check-in, alterações de meta, imports).
NFR-09: Idempotência em relatórios automatizados (reprocess_logs).
NFR-10: Real-time via Supabase postgres_changes para notificações e audit logs.
NFR-11: Sanitização de inputs de texto contra XSS.
NFR-12: Cache de ranking por 5 minutos (localStorage).
NFR-13: Timeout de 4 segundos para fetch de dados de usuário.
NFR-14: Componentes atômicos reutilizáveis (Typography, Button, Card, Badge, Input, DataGrid).
NFR-15: Zero quebra de rotas legadas ao adicionar novas funcionalidades.
NFR-16: Rollback seguro: remoção de rotas /consultoria desativa o módulo sem afetar o core.
NFR-17: Componentes do sistema devem atender nível AA do WCAG 2.1 para contraste de texto mínimo 4.5:1, navegação por teclado em todas as interações, labels em todos os campos de formulário, e aria-labels em ícones e botões de ação.
NFR-18: Tempo de resposta de listagens deve ser inferior a 2 segundos para 80 lojas com até 200 check-ins cada, medido em conexão 4G.
NFR-19: Tempo de resposta de abertura de tela (First Contentful Paint) deve ser inferior a 1.5 segundos.
NFR-20: O sistema deve suportar upload de anexos até 25 MB com feedback visual de progresso.
NFR-21: O sistema deve funcionar em navegadores mobile (Chrome/Safari) com viewport a partir de 375px sem perda funcional.
NFR-22: Importações devem processar até 5.000 linhas em menos de 30 segundos com feedback de progresso.
NFR-23: O sistema deve estar disponível 99.5% do tempo durante horário comercial (8h-20h BRT), excluindo janelas de deploy programado (máx 2x/semana, 15 min cada).
NFR-24: O sistema deve registrar audit log para operações de criação, edição e exclusão em metas, configurações e correções de check-in, com usuário, timestamp e dados anteriores quando aplicável.
NFR-25: Edge Functions devem ter timeout de 60 segundos e retry automático com backoff exponencial (1s, 2s, 4s) para falhas transitórias.
NFR-26: O sistema deve suportar pelo menos 50 usuários simultâneos sem degradação de performance.

---

## 6. Mapa de Rotas

### Públicas (3)
`/login`, `/privacy`, `/terms`

### Vendedor (9)
`/home`, `/checkin`, `/historico`, `/ranking`, `/feedback`, `/pdi`, `/treinamentos`, `/notificacoes`, `/perfil`

### Gerente (9)
`/loja`, `/loja/:storeSlug`, `/equipe`, `/metas`, `/funil`, `/rotina`, `/feedback` → GerenteFeedback, `/pdi` → GerentePDI, `/pdi/:id/print`

### Dono (herda Gerente +)
`/lojas` (suas lojas)

### Admin (17 exclusivas + herda todas)
`/painel`, `/lojas`, `/produtos`, `/configuracoes`, `/configuracoes/operacional`, `/configuracoes/reprocessamento`, `/relatorio-matinal`, `/relatorios/performance-vendas`, `/relatorios/performance-vendedores`, `/auditoria`, `/treinamentos` → ConsultorTreinamentos, `/notificacoes` → ConsultorNotificacoes

### Consultoria (4)
`/consultoria`, `/consultoria/clientes`, `/consultoria/clientes/:clientId`, `/consultoria/clientes/:clientId/visitas/:visitNumber`

### Legadas
`/legacy/agenda`, `/legacy/configuracoes/comissoes`

---

## 7. Banco de Dados

### 7.1 Tabelas Core (4)
`users`, `stores`, `memberships`, `store_sellers`

### 7.2 Tabelas de Performance (5)
`daily_checkins`, `store_meta_rules`, `store_meta_rules_history`, `store_benchmarks`, `store_delivery_rules`

### 7.3 Tabelas de Qualidade (4)
`feedbacks`, `weekly_feedback_reports`, `pdis`, `pdi_reviews`

### 7.4 Tabelas PDI MX 360 (10)
`pdi_niveis_cargo`, `pdi_descritores_escala`, `pdi_competencias`, `pdi_acoes_sugeridas`, `pdi_frases_inspiracionais`, `pdi_sessoes`, `pdi_metas`, `pdi_avaliacoes_competencia`, `pdi_plano_acao`, `pdi_objetivos_pessoais`

### 7.5 Tabelas Operacionais (6)
`trainings`, `training_progress`, `notifications`, `notification_reads`, `manager_routine_logs`, `whatsapp_share_logs`

### 7.6 Tabelas de Auditoria (5)
`audit_logs`, `checkin_correction_requests`, `checkin_audit_logs`, `reprocess_logs`, `raw_imports`

### 7.7 Tabelas Consultoria CRM (9)
`consulting_clients`, `consulting_client_units`, `consulting_client_contacts`, `consulting_assignments`, `consulting_visits`, `consulting_financials`, `consulting_methodology_steps`, `consulting_oauth_tokens`, `consulting_calendar_settings`

### 7.8 Outras (1)
`digital_products`

**Total: 44 tabelas**

### 7.9 Views (4)
`view_sem_registro`, `view_store_daily_production`, `view_seller_tenure_status`, `view_daily_team_status`

### 7.10 Enums (6)
`checkin_scope`, `projection_mode`, `correction_status`, `store_source_mode`, `individual_goal_mode`, `submission_status`

---

## 8. Automações

### 8.1 Edge Functions (6)

| Função | Trigger | Saída |
|--------|---------|-------|
| `relatorio-matinal` | Diário 08:30 BRT (pg_cron) | Email + XLSX + Notificações disciplina |
| `feedback-semanal` | Segunda 12:30 BRT (pg_cron) | Email + XLSX + Notificações gargalo |
| `relatorio-mensal` | Dia 1° 10:30 BRT (pg_cron) | Email + XLSX |
| `send-individual-feedback` | Manual (gerente) | Email |
| `google-oauth-handler` | OAuth callback | Token storage |
| `db-executor` | Manual (admin) | SQL arbitrário |

### 8.2 Triggers de Banco (9)

| Trigger | Tabela | Função |
|---------|--------|--------|
| `sync_daily_checkins_canonical` | daily_checkins | Sincroniza colunas legadas/canônicas, calcula submission_status |
| `update_updated_at_column` | 18 tabelas | Auto-set updated_at |
| `on_auth_user_created` | auth.users | Cria perfil automático |
| `notifications_sync_notification_reads` | notifications | Rastreia leitura |
| `feedbacks_seller_ack_only` | feedbacks | Vendedor só pode dar ciência |
| `check_orphan_users` (×2) | store_sellers, memberships | Desativa órfãos |
| `pdis_sync_legacy_shadow_columns` | pdis | Compatibilidade legada |
| `log_store_meta_rules_changes` | store_meta_rules | Auditoria de configuração |

### 8.3 RPCs (11)

`send_broadcast_notification`, `process_import_data`, `configure_morning_report_cron`, `configure_weekly_feedback_cron`, `configure_monthly_report_cron`, `get_pdi_form_template`, `get_suggested_actions`, `create_pdi_session_bundle`, `get_pdi_print_bundle`, `approve_pdi_action_evidence`, `get_admin_executive_overview`

---

## 9. Componentes e Features

### 9.1 Componentes Atômicos (5)
Typography, Button, Input, Badge, Skeleton, Textarea

### 9.2 Moléculas (3)
Card (com Header/Title/Description/Content/Footer), MXScoreCard, FormField

### 9.3 Organismos (1)
DataGrid (desktop table + mobile cards, animado)

### 9.4 Admin (1)
AdminNetworkView (hierarquia rede com role management)

### 9.5 UI Radix/shadcn (22)
Dialog, Tabs, Select, Switch, Checkbox, Table, Avatar, DropdownMenu, Tooltip, Progress, ScrollArea, Separator, Label, Toaster, Chart (Recharts wrapper)

### 9.6 Features (3 módulos)
- **Consultoria:** types.ts, GoogleCalendarView
- **PDI:** WizardPDI (4 etapas com radar chart)
- **Feedback:** PrintableFeedback, WeeklyStoreReport

---

## 10. Hooks (24 arquivos, ~40 hooks)

| Hook | Propósito |
|------|-----------|
| useAuth | Auth, roles, memberships, store switching, zero trust |
| useCheckins | CRUD check-in, deadlines, sanitização |
| useMyCheckins | Check-ins do próprio vendedor |
| useCheckinsByDateRange | Check-ins por período |
| useCheckinAuditor | Correção retroativa com aprovação |
| useRanking | Ranking por loja com cache 5min |
| useGlobalRanking | Ranking cross-loja |
| useStorePerformance | Performance por loja com semáforo |
| useSellerMetrics | Métricas individuais |
| useTacticalPrescription | Gargalo → treinamento |
| useStoreSales | Agregação vendas + regras venda-loja |
| useTeam | Equipe com vigências |
| useStores | CRUD lojas |
| useStoresStats | Stats por loja |
| useSellersByStore | Vendedores de uma loja |
| useMemberships | Memberships |
| useNetworkHierarchy | Hierarquia rede |
| useGoals | Meta mensal |
| useAllStoreGoals | Todas metas + benchmarks |
| useStoreMetaRules | Regras completas |
| useStoreGoal | Meta simplificada |
| useTrainings | Treinamentos + progresso |
| useCourses | Cursos derivados |
| useFeedbacks | Feedbacks com CRUD |
| usePDIs | PDIs com reviews |
| useMyPDIs | PDIs próprios |
| useNotifications | Notificações + broadcast |
| useSystemBroadcasts | Broadcasts admin |
| useTeamTrainings | Progresso treinos com gap |
| useStoreDeliveryRules | Regras entrega |
| useWeeklyFeedbackReports | Relatórios semanais |
| usePDI_MX | PDI 360: cargos, templates, ações |
| useManagerRoutine | Rotina diária |
| useOperationalSettings | Config operacional completa |
| useConsultingClients | Clientes consultoria |
| useConsultingClientDetail | Detalhe cliente completo |
| useConsultingMethodology | Steps PMR |
| useConsultingClientMetrics | Métricas consultoria |
| useAuditLogs | Audit logs real-time |
| useWhatsAppPolling | Status WhatsApp |

---

## 11. Bibliotecas e Utilitários

| Módulo | Função |
|--------|--------|
| calculations.ts | Motor: funil, atingimento, projeção, score MX, diagnóstico, benchmarks |
| utils.ts | cn(), camelCase, snakeCase |
| supabase.ts | Client singleton |
| export.ts | Exportação Excel |
| email.ts | Envio email Resend |
| csv-parser.ts | Parser CSV + validação headers |
| migration-validator.ts | Validação dados legados |
| legacy-normalizer.ts | Mapeamento headers legados |
| checkin-validator.ts | Validação payload checkin |
| api/manager.ts | Dados rotina gerente |
| api/stores.ts | Governança lojas |
| services/checkin-service.ts | Storage idempotente |
| automation/* | 14 arquivos: scheduler, engines, templates, XLSX, WhatsApp |

---

## 12. Cronograma e Milestones

### Fase 1 — Fundação (Epics 01, 02, 19, 20, 21) — Core operacional
- Auth, roles, memberships, zero trust
- Gestão de lojas e rede
- Layout, navegação e design system
- Motor de cálculos e utilitários
- **Status:** Em produção

### Fase 2 — Rituais MX (Epics 03, 04, 05, 06, 13) — Operação diária
- Check-in diário com deadlines
- Ranking e performance
- Funil MX com diagnóstico
- Metas, benchmarks e regras
- Rotina do gerente
- **Status:** Em produção

### Fase 3 — Qualidade e Desenvolvimento (Epics 07, 08, 09, 10) — Gestão de pessoas
- Feedback semanal
- PDI (10 competências)
- PDI MX 360 (wizard avançado)
- Treinamentos com prescrição
- **Status:** Em produção

### Fase 4 — Comunicação e Automação (Epics 11, 12) — Escala
- Notificações com broadcast e real-time
- Relatórios automatizados (matinal, semanal, mensal)
- **Status:** Em produção

### Fase 5 — Governança (Epics 14, 15, 18) — Admin
- Reprocessamento e importação
- Auditoria e diagnósticos
- Configurações operacionais
- **Status:** Em produção

### Fase 6 — Expansão (Epics 16, 17) — Novos módulos
- CRM de Consultoria
- Produtos Digitais
- **Status:** Em produção (CRM em expansão)

---

## 13. Stakeholders e Responsabilidades

| Stakeholder | Papel | Responsabilidade | Aprova |
|-------------|-------|------------------|--------|
| Pedro Guilherme (Dono MX) | Product Owner final | Valida escopo, prioridades e releases | Release de cada fase |
| Admin MX | Champion do produto | Valida fluxos operacionais, testes em produção | Configurações operacionais |
| Dono de Agência | Early adopter | Valida visão executiva, relatórios | Funcionalidades dono |
| Gerente de Agência | Usuário-chave | Valida rituais diários, feedback, PDI | Fluxos do gerente |
| Vendedor | Usuário final | Valida check-in, ranking, treinamentos | Usabilidade mobile |
| Dev Team | Implementação | Estimativa, implementação, testes | PRs e deploys |

### Processo de aprovação por módulo

| Módulo | Quem valida | Critério de aprovação |
|--------|------------|----------------------|
| Auth/Roles | Dev Team + Admin MX | Login para todos os roles; redirect correto; zero trust |
| Check-in | Gerente + Vendedor | Prazo 09:30; lock 09:45; dados corretos |
| Ranking | Admin MX + Dono | Cálculos batem com planilha de referência |
| Funil | Admin MX | Benchmarks 20/60/33; gargalo identificado |
| Feedback | Gerente + Vendedor | Envio email; ciência funciona |
| PDI | Gerente + Admin MX | Wizard completo; radar renderiza |
| Relatórios | Admin MX + Dono | Email recebido; XLSX correto; dados consistentes |
| CRM Consultoria | Admin MX | CRUD completo; visitas executáveis |
| Config operacional | Admin MX | Meta salva; auditoria registrada |

---

## 14. Análise de Riscos e Mitigações

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|---------------|---------|-----------|
| R1 | Google Calendar API muda ou limita quota | Média | Alto | Wrapper com retry; fallback para registro manual; batch operations |
| R2 | Supabase Edge Function timeout em meses com muitos dados | Média | Médio | Paginação por loja; processamento assíncrono; timeout de 60s com retry |
| R3 | Vendedores não adotam check-in diário | Alto | Alto | Notificações disciplina automáticas; deadline com alerta; campanha de onboarding |
| R4 | Resend API downtime afeta relatórios | Baixo | Médio | Log de falha em reprocess_logs; retry manual pelo admin; fallback console |
| R5 | RLS policy mal configurada vaza dados entre lojas | Baixo | Crítico | Testes automatizados de RLS por role; audit de policies; script check_rls.ts |
| R6 | Grande volume de imports sobrecarrega banco | Médio | Médio | Batch de 500 linhas; file_hash para dedup; timeout configurável |
| R7 | Dependência de pg_cron para relatórios automáticos | Baixo | Médio | Fallback manual via Painel Consultor; monitoramento do cron |
| R8 | Mobile browsers com limitações de storage/cache | Médio | Baixo | Service worker para offline; cache agressivo de ranking; fallback graceful |
| R9 | Usuário órfão após remoção de membership | Médio | Baixo | Trigger automático de desativação; re-ativação ao re-adicionar |
| R10 | Edge Function db-executor como superfície de ataque | Baixo | Crítico | Admin only via RLS; audit log; considerer desativar em produção |

---

## 15. Política de Retenção de Dados

| Tabela | Período de retenção | Ação após expiração |
|--------|-------------------|-------------------|
| `daily_checkins` | Indefinido (dados operacionais) | Arquivar em tabela `_archive` após 24 meses |
| `audit_logs` | 24 meses | Delete após 24 meses (cron mensal) |
| `checkin_audit_logs` | 36 meses | Delete após 36 meses |
| `checkin_correction_requests` | 12 meses após resolução | Delete após 12 meses |
| `reprocess_logs` | 12 meses | Delete após 12 meses |
| `raw_imports` | 6 meses | Delete após 6 meses |
| `notifications` | 90 dias para lidas; indefinido para não lidas | Delete lidas após 90 dias (cron semanal) |
| `notification_reads` | 90 dias | Delete após 90 dias |
| `whatsapp_share_logs` | 12 meses | Delete após 12 meses |
| `manager_routine_logs` | 24 meses | Arquivar após 24 meses |
| `weekly_feedback_reports` | Indefinido (dados de qualidade) | Arquivar após 24 meses |
| `store_meta_rules_history` | Indefinido (auditoria) | Sem expiração |
| `consulting_*` | Indefinido (dados de cliente) | Sem expiração (LGPD: exclusão sob requisição) |
| `feedbacks` | Indefinido | Arquivar após 24 meses |
| `pdis` / `pdi_reviews` | Indefinido | Arquivar após 36 meses |
| `training_progress` | Indefinido | Sem expiração |
| `pdi_sessoes` e derivadas | Indefinido | Arquivar após 36 meses |

### Notas LGPD
- Dados pessoais em `users` (nome, email, telefone) podem ser excluídos sob requisição do titular.
- Exclusão LGPD: anonymize (SET name='REMOVIDO', email=NULL, phone=NULL, active=false) em vez de DELETE para preservar integridade referencial.
- Dados de `consulting_client_contacts` seguem mesma regra.

---

## 16. API Specs — Edge Functions

### 16.1 relatorio-matinal

```
POST /functions/v1/relatorio-matinal
Headers: Authorization: Bearer {service-role-key}
Content-Type: application/json

Request Body:
{
  "store_id": "uuid (opcional, sem = todas)",
  "reference_date": "YYYY-MM-DD (opcional, default = yesterday)",
  "dry_run": false
}

Response 200:
{
  "processed": 3,
  "errors": [],
  "logs": [
    { "store_id": "uuid", "store_name": "Loja X", "status": "sent", "recipients": 2, "notifications_sent": 5 }
  ]
}
```

### 16.2 feedback-semanal

```
POST /functions/v1/feedback-semanal
Headers: Authorization: Bearer {service-role-key}

Request Body:
{
  "store_id": "uuid (opcional)",
  "week_start": "YYYY-MM-DD (opcional)",
  "week_end": "YYYY-MM-DD (opcional)"
}

Response 200:
{
  "processed": 2,
  "errors": [],
  "reports": [
    { "store_id": "uuid", "store_name": "Loja Y", "status": "sent", "recipients": 3 }
  ]
}
```

### 16.3 relatorio-mensal

```
POST /functions/v1/relatorio-mensal
Headers: Authorization: Bearer {service-role-key}

Request Body:
{
  "store_id": "uuid (opcional)",
  "month": "YYYY-MM (opcional, default = previous month)"
}

Response 200:
{
  "processed": 3,
  "errors": [],
  "reports": [
    { "store_id": "uuid", "store_name": "Loja Z", "status": "sent" }
  ]
}
```

### 16.4 send-individual-feedback

```
POST /functions/v1/send-individual-feedback
Headers: Authorization: Bearer {anon-key}
Content-Type: application/json

Request Body:
{
  "feedback_id": "uuid"
}

Response 200:
{ "sent": true, "to": ["gerente@email.com", "dono@email.com"] }
Response 404:
{ "error": "Feedback not found" }
```

### 16.5 google-oauth-handler

```
GET /functions/v1/google-oauth-handler?code={auth_code}&state={user_id}
(OAuth redirect callback)

Response 200: HTML confirmation page
Response 400: { "error": "Missing code or state" }
```

### 16.6 db-executor

```
POST /functions/v1/db-executor
Headers: Authorization: Bearer {service-role-key}
Content-Type: application/json

Request Body:
{ "sql": "SELECT * FROM stores WHERE active = true LIMIT 10" }

Response 200:
{ "data": [...], "count": 10 }
Response 403:
{ "error": "Unauthorized" }
```

---

## 17. Diagramas do Sistema

### 17.1 Diagrama ER (Entidade-Relacionamento)

```
auth.users
  └── public.users (1:1 via id)
       ├── memberships (N:N user↔store com role)
       ├── store_sellers (1:N, vigências)
       ├── daily_checkins (1:N, métricas diárias)
       ├── feedbacks (1:N como manager ou seller)
       ├── pdis (1:N como manager ou seller)
       │   └── pdi_reviews (1:N)
       ├── training_progress (1:N)
       ├── notifications (1:N como recipient ou sender)
       ├── manager_routine_logs (1:N)
       ├── consulting_assignments (1:N → consulting_clients)
       ├── consulting_oauth_tokens (1:1)
       └── consulting_calendar_settings (1:N)

stores
  ├── memberships (1:N)
  ├── store_sellers (1:N)
  ├── daily_checkins (1:N)
  ├── store_benchmarks (1:1, PK=store_id)
  ├── store_delivery_rules (1:1, PK=store_id)
  ├── store_meta_rules (1:1, PK=store_id)
  │   └── store_meta_rules_history (1:N)
  ├── feedbacks (1:N)
  ├── weekly_feedback_reports (1:N)
  ├── pdis (1:N)
  ├── manager_routine_logs (1:N)
  ├── consulting_clients (1:N via primary_store_id)
  └── notifications (1:N)

consulting_clients
  ├── consulting_client_units (1:N)
  ├── consulting_client_contacts (1:N)
  ├── consulting_assignments (1:N)
  ├── consulting_calendar_settings (1:N)
  ├── consulting_visits (1:N)
  └── consulting_financials (1:N, unique por client+date)

pdi_niveis_cargo
  └── pdi_descritores_escala (1:N)

pdi_competencias
  └── pdi_acoes_sugeridas (1:N)

pdi_sessoes
  ├── pdi_metas (1:N)
  ├── pdi_avaliacoes_competencia (1:N → pdi_competencias)
  ├── pdi_plano_acao (1:N → pdi_competencias)
  └── pdi_objetivos_pessoais (1:N)

daily_checkins
  ├── checkin_correction_requests (1:N)
  └── checkin_audit_logs (1:N)

reprocess_logs
  └── raw_imports (1:N)
```

### 17.2 Fluxo do Check-in Diário

```
VENDEDOR                    SISTEMA                          BANCO
   │                          │                               │
   ├─ Acessa /checkin ───────►│                               │
   │                          ├─ Busca ref date (D-1) ───────►│
   │                          │◄─ Retorna data ref ───────────┤
   │                          ├─ Verifica deadline 09:30      │
   │  Preenche métricas       │                               │
   ├─ Submit ────────────────►│                               │
   │                          ├─ Sanitiza XSS                 │
   │                          ├─ Determina on_time/late       │
   │                          ├─ UPSERT checkin ─────────────►│
   │                          │                               ├─ Trigger sync_canonical
   │                          │                               ├─ Trigger updated_at
   │                          │◄─ Confirma ───────────────────┤
   │  Toast sucesso ◄─────────┤                               │
```

### 17.3 Fluxo de Feedback Semanal

```
GERENTE                     SISTEMA                          BANCO
   │                          │                               │
   ├─ Acessa /feedback ──────►│                               │
   │                          ├─ Busca vendedores ───────────►│
   │                          │◄─ Lista equipe ───────────────┤
   ├─ Seleciona vendedor ────►│                               │
   ├─ Preenche métricas ─────►│                               │
   │                          ├─ Calcula taxas conversão      │
   │                          ├─ Gera diagnóstico (vendedor vs equipe)
   │                          ├─ UPSERT feedback ────────────►│
   │                          │                               ├─ Trigger seller_ack_only
   │  Toast sucesso ◄─────────┤                               │
   │                          │                               │
   ├─ [Email] ───────────────►│                               │
   │                          ├─ POST send-individual-feedback│
   │                          │   → Resend API                │
   │  Toast enviado ◄─────────┤                               │
```

### 17.4 Fluxo de Relatório Matinal Automatizado

```
PG_CRON (08:30 BRT)
   │
   ├─ POST relatorio-matinal ──► Edge Function
   │                               │
   │                               ├─ Busca lojas ativas
   │                               ├─ Para cada loja:
   │                               │   ├─ Busca vendedores + checkins MTD
   │                               │   ├─ Calcula ranking
   │                               │   ├─ Gera XLSX
   │                               │   ├─ Gera HTML email
   │                               │   ├─ Envia via Resend
   │                               │   ├─ Identifica sem registro
   │                               │   └─ Cria notificações disciplina
   │                               ├─ Registra em reprocess_logs
   │                               └─ Response
```

### 17.5 Fluxo de Visita PMR (Consultoria)

```
ADMIN                       SISTEMA                          BANCO
   │                          │                               │
   ├─ Acessa /consultoria ──►│                               │
   │   /clientes/:id          │                               │
   │   /visitas/:num          │                               │
   │                          ├─ Busca methodology_steps ────►│
   │                          ├─ Busca visita ───────────────►│
   │  Exibe checklist ◄───────┤                               │
   │                          │                               │
   ├─ Preenche etapas ───────►│                               │
   │                          ├─ Valida obrigatórias          │
   │                          ├─ UPDATE checklist_data ──────►│
   │                          │                               ├─ Trigger updated_at
   │  Finaliza visita ───────►│                               │
   │                          ├─ UPDATE status='concluida' ──►│
   │  Toast sucesso ◄─────────┤                               │
```

---

## 18. Dependências entre Epics

```
EPIC 21 (Motor de Cálculos) ─────────────────┐
EPIC 20 (Design System) ─────────────────────┤
EPIC 19 (Layout/Navegação) ──────────────────┤
EPIC 01 (Auth/Autorização) ──────────────────┤
    │                                         │
    ├─► EPIC 02 (Lojas/Rede) ◄───────────────┤ (todos dependem destes base)
    │      │                                  │
    │      ├─► EPIC 03 (Check-in Diário) ◄────┤
    │      │      │                            │
    │      │      ├─► EPIC 04 (Ranking) ◄─────┤
    │      │      ├─► EPIC 05 (Funil MX) ◄────┤
    │      │      └─► EPIC 06 (Metas/Regras) ◄─┤
    │      │                                   │
    │      ├─► EPIC 07 (Feedback) ◄────────────┤
    │      │      └─► EPIC 12 (Relatórios) ◄───┤
    │      │                                   │
    │      ├─► EPIC 08 (PDI) ◄─────────────────┤
    │      │      └─► EPIC 09 (PDI 360) ◄──────┤
    │      │                                   │
    │      ├─► EPIC 10 (Treinamentos) ◄────────┤
    │      │      (depende de EPIC 05)          │
    │      │                                   │
    │      ├─► EPIC 11 (Notificações) ◄────────┤
    │      │      (usado por EPIC 03,07,10,12)  │
    │      │                                   │
    │      ├─► EPIC 13 (Rotina Gerente) ◄──────┤
    │      │      (depende de EPIC 03,04,12)    │
    │      │                                   │
    │      ├─► EPIC 14 (Reprocessamento) ◄─────┤
    │      │                                   │
    │      ├─► EPIC 15 (Auditoria) ◄───────────┤
    │      │      (depende de EPIC 03,06)       │
    │      │                                   │
    │      ├─► EPIC 16 (CRM Consultoria) ◄─────┤
    │      │      (depende de EPIC 01,02)       │
    │      │                                   │
    │      ├─► EPIC 17 (Produtos Digitais) ◄───┤
    │      │                                   │
    │      └─► EPIC 18 (Configurações) ◄───────┘
              (depende de EPIC 02,06)

Dependências críticas:
- EPIC 01 é pré-requisito de TUDO (auth)
- EPIC 02 é pré-requisito de tudo operacional (multi-tenant)
- EPIC 21 (Motor de cálculos) é pré-requisito de EPIC 04, 05, 12
- EPIC 03 (Check-in) é pré-requisito de EPIC 04, 05 (ranking e funil precisam de dados)
- EPIC 05 (Funil) é pré-requisito de EPIC 10 (treinamento prescrito por gargalo)
- EPIC 11 (Notificações) é cross-cutting: usado por EPIC 03, 07, 10, 12, 13
```
