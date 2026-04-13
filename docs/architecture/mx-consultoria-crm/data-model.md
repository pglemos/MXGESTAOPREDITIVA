# Data Model - CRM de Consultoria MX

Fonte completa: `../mx-consultoria-crm-architecture.md`

## Tabelas do MVP inicial

- `consulting_clients`
- `consulting_client_units`
- `consulting_client_contacts`
- `consulting_assignments`

## Tabelas seguintes

- `consulting_calendar_events`
- `consulting_calendar_sync_logs`
- `pmr_visit_templates`
- `pmr_visit_template_steps`
- `consulting_visits`
- `consulting_visit_steps`
- `consulting_visit_evidence`
- `consulting_documents`
- `consulting_financial_periods`
- `consulting_financial_lines`
- `consulting_financial_imports`
- `consulting_inventory_snapshots`
- `consulting_inventory_items`
- `consulting_lead_imports`
- `consulting_lead_channel_metrics`

## Regras

- RLS obrigatoria em todas as tabelas `consulting_*`.
- `consulting_clients` pode apontar para `stores` somente quando houver relacionamento real com loja operacional existente.
- Importadores devem gravar primeiro em staging.
- Financeiro e documentos so podem ir para UI depois de RLS e testes.
