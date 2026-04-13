# Integration Plan - CRM de Consultoria MX

Fonte completa: `../mx-consultoria-crm-architecture.md`

## Frontend

Novas rotas:

- `/consultoria`
- `/consultoria/clientes`
- `/consultoria/clientes/:clientId`
- `/consultoria/agenda`
- `/consultoria/visitas/:visitId`
- `/consultoria/importacoes`
- `/consultoria/financeiro`
- `/consultoria/estoque`
- `/consultoria/bi`

Novas areas:

- `src/features/consultoria/*`
- `src/hooks/useConsultingClients.ts`
- `src/hooks/useConsultingAgenda.ts`
- `src/hooks/useConsultingVisits.ts`
- `src/hooks/useConsultingDocuments.ts`
- `src/hooks/useConsultingFinancials.ts`
- `src/hooks/useConsultingInventory.ts`
- `src/hooks/useConsultingLeadMetrics.ts`

## Backend

Migrations isoladas:

- `consulting_core`
- `consulting_calendar`
- `consulting_visits_documents`
- `consulting_financial_inventory_leads`

Edge Functions posteriores:

- `consultoria-calendar-sync`
- `consultoria-import-agenda`
- `consultoria-import-financials`
- `consultoria-import-inventory`
- `consultoria-import-leads`

## Rollback

- Rotas novas podem ser escondidas sem tocar no core.
- Story de schema deve ter migration isolada.
- Story de importacao deve gravar em staging.
- Story de Google deve ficar atras de configuracao explicita.
