# High-Performance Dealer OS - Documentação do Sistema

## 1) Diagrama de Entidades (ERD) e Tabelas

### Entidades Principais e Campos

**Tenant (Consultoria)**
- `id` (UUID, PK)
- `name` (String)
- `created_at` (Timestamp)

**Store (Loja/Unidade)**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK, Index)
- `name` (String)
- `settings` (JSONB) - benchmarks, políticas de SLA

**User**
- `id` (UUID, PK)
- `store_id` (UUID, FK, Index)
- `name`, `email`, `phone` (String)
- `role` (Enum: OWNER, MANAGER, SELLER, CONSULTANT, HR)

**Lead**
- `id` (UUID, PK)
- `store_id` (UUID, FK, Index)
- `owner_id` (UUID, FK, Index)
- `name`, `phone`, `email` (String)
- `source` (String) - Meta, RD, CSV
- `status` (Enum: NEW, CONTACTED, SCHEDULED, VISITED, PROPOSAL, NEGOTIATION, WON, LOST)
- `created_at`, `updated_at` (Timestamp)

**Activity**
- `id` (UUID, PK)
- `lead_id` (UUID, FK, Index)
- `user_id` (UUID, FK, Index)
- `type` (Enum: ATTEMPT, RETURN, SCHEDULED, VISITED, PROPOSAL, LOST)
- `timestamp` (Timestamp)
- `result` (String)

**Appointment (Agendamento)**
- `id` (UUID, PK)
- `lead_id` (UUID, FK, Index)
- `user_id` (UUID, FK, Index)
- `scheduled_for` (Timestamp)
- `status` (Enum: PENDING, CONFIRMED, NO_SHOW, COMPLETED)

**Visit**
- `id` (UUID, PK)
- `appointment_id` (UUID, FK, Index)
- `validated` (Boolean)
- `validation_method` (Enum: QR, GEOFENCE, MANAGER)
- `timestamp` (Timestamp)

**Deal (Venda)**
- `id` (UUID, PK)
- `lead_id` (UUID, FK, Index)
- `amount` (Decimal)
- `vehicle_id` (UUID, FK)
- `date` (Timestamp)

## 2) RBAC (Matriz de Permissões) + Isolamento

- **Isolamento**: Todas as queries de banco de dados devem ter `WHERE tenant_id = ?` e `WHERE store_id = ?` (exceto Consultoria que vê todas as stores do tenant).
- **Consultoria (Admin Master)**: Acesso total ao Tenant, visualiza todas as Stores, edita benchmarks globais.
- **Owner (Dono)**: Acesso total à sua Store, exportação de dados, aprovação de políticas.
- **Manager (Gerente)**: Cria/edita leads da Store, gerencia pipeline, valida visitas, ajusta agendamentos, vê relatórios da equipe.
- **Seller (Vendedor)**: Vê/edita apenas leads atribuídos a si (`owner_id = user_id`), registra atividades, marca status.
- **HR (RH)**: Acesso restrito a relatórios de ponto e comissão.

## 3) APIs (REST)

- `POST /api/v1/leads`: Entrada de lead (Webhook Meta/RD).
- `GET /api/v1/leads`: Listagem com filtros e paginação.
- `PUT /api/v1/leads/:id/status`: Atualização de etapa do funil.
- `POST /api/v1/activities`: Registro de atividade (1 toque).
- `POST /api/v1/appointments`: Agendamento de visita.
- `POST /api/v1/visits/:id/validate`: Validação de visita (QR/Gerente).
- `GET /api/v1/reports/cockpit`: KPIs do dashboard (run-rate, conversões).
- `POST /api/v1/ai/diagnostics`: Geração de diagnóstico semanal.

## 4) Jobs Assíncronos

- `SLA_Monitor`: Roda a cada 1 min. Verifica leads sem atividade válida após `created_at + SLA_config`. Dispara alerta e redistribui.
- `Lead_Expiration`: Roda a cada 15 min. Retorna leads sem interação há X horas para o pool.
- `Daily_Projection`: Roda às 00:00. Recalcula run-rate e projeção de vendas do mês.
- `Weekly_Feedback`: Roda domingo 23:59. Agrega dados da semana e chama IA para gerar diagnóstico.

## 5) Notificações

- **SLA Estourando**: Push para Vendedor (aviso) e Inbox para Gerente.
- **Lead Estagnado**: Push para Vendedor (24h/48h/72h).
- **Projeção Caiu**: Email e Inbox para Gerente e Dono.
- **Nova Atribuição de Lead**: Push para Vendedor.

## 6) UI: Sitemap e Wireframes

**Web (Gestão)**
- `/dashboard`: Cockpit (KPIs, Gráficos de Run-rate, Alertas).
- `/funnel`: Kanban board com drag-and-drop.
- `/leads`: Lista em tabela com SLA timer.
- `/reports`: Relatórios exportáveis.
- `/settings`: Configuração de SLA, Benchmarks, Usuários.

**App (Vendedor)**
- `Home`: Lista de Tarefas do dia (Leads novos, Follow-ups, Agendamentos).
- `Lead Detail`: Botões rápidos (1 toque) para registrar atividade.
- `Agenda`: Calendário de visitas e botão de Check-in.
- `Performance`: Espelho de comissão e meta pessoal.

## 7) Antifraude de KPI

- **Regra 1**: Visita sem check-in validado não conta para conversão final.
- **Regra 2**: Venda sem proposta registrada gera alerta de auditoria.
- **Regra 3**: Agendamentos excessivos com alto no-show (>40%) bloqueiam atribuição de novos leads até revisão do gerente.

## 8) Motor de IA

**Prompt Template**:
```text
Atue como um consultor de performance automotiva.
Dados da semana do vendedor {seller_name}:
- Leads: {leads_count}
- Agendamentos: {appointments} (Benchmark: {bench_apt}%)
- Visitas: {visits} (Benchmark: {bench_vis}%)
- Vendas: {sales} (Benchmark: {bench_sales}%)

Gere:
1. Diagnóstico (3 linhas focadas no maior vazamento).
2. 2 ações práticas e mensuráveis para a próxima semana.
3. Mensagem curta para o vendedor (max 800 caracteres).
```

## 9) Roadmap

- **MVP**: Multi-tenant, LeadOps (SLA), Funil Kanban, Activity Tracking, Cockpit Básico.
- **V1**: Agenda + Validação (QR), Playbooks, NPS, Integrações Meta/RD.
- **V2**: ProfitOps (Estoque/Margem), PeopleOps (Comissão/Ponto), WhatsApp API para relatórios.
