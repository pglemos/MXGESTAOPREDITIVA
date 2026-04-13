# Validacao PO - CRM de Consultoria MX

Data: 2026-04-13
Workflow: `brownfield-fullstack`
Artefatos avaliados:

- `docs/prd/mx-consultoria-crm-analysis.md`
- `docs/prd/mx-consultoria-crm-prd.md`
- `docs/architecture/mx-consultoria-crm-brownfield-impact.md`
- `docs/architecture/mx-consultoria-crm-architecture.md`

## Resumo executivo

Tipo de projeto: brownfield com UI, banco, RLS, importacoes e integracao externa.

Readiness: 88%

Decisao: CONDITIONAL

O plano esta bom para seguir para sharding/story planning, mas ainda nao deve ir direto para implementacao. A razao e simples: o escopo e grande, altera a direcao do PRD antigo e introduz financeiro, documentos e Google Calendar. Antes de codar, as primeiras stories precisam ser pequenas, com rollback, e o usuario precisa validar que a interpretacao do escopo esta correta.

Atualizacao: os ajustes de MVP e rollback foram aplicados em `docs/prd/mx-consultoria-crm-prd.md` e `docs/architecture/mx-consultoria-crm-architecture.md`.

## Status por categoria

| Categoria | Status | Observacao |
| --- | --- | --- |
| Project Setup & Initialization | PASS | Projeto existente analisado e workflow atualizado. |
| Infrastructure & Deployment | CONDITIONAL | Supabase/Vercel definidos; falta detalhar rollback por story e secrets Google. |
| External Dependencies & Integrations | CONDITIONAL | Google Calendar/Meet identificado; falta estrategia final de OAuth/conta de servico. |
| UI/UX Considerations | PASS | Rotas e integracao com shell atual definidas. |
| User/Agent Responsibility | CONDITIONAL | Usuario precisa validar escopo e fornecer credenciais quando chegar na story de Google. |
| Feature Sequencing & Dependencies | PASS | Sequencia prioriza fundacao/RLS antes de Google/financeiro/BI. |
| Risk Management | CONDITIONAL | Riscos identificados; rollback precisa entrar em cada story. |
| MVP Scope Alignment | CONDITIONAL | MVP recomendado existe, mas PRD tambem lista escopo completo; stories devem cortar o MVP. |
| Documentation & Handoff | PASS | PRD, impacto brownfield, arquitetura e handoffs criados. |
| Post-MVP Considerations | PASS | Epicos deixam financeiro/BI mais avancados para etapas posteriores. |

## Riscos principais

1. Confundir `stores` com `consulting_clients` e quebrar relatorios atuais.
2. Expor dados financeiros/documentos sem RLS completa.
3. Google Calendar duplicar eventos ou apagar evento errado.
4. Importar planilhas com erros de formula para tabelas finais.
5. Comecar por BI/financeiro antes da fundacao de clientes, agenda e visitas.

## Must-fix antes de desenvolvimento

- [x] Primeira story deve ser apenas fundacao: schema `consulting_*`, RLS e tela/listagem minima.
- [x] Cada story deve ter rollback explicito.
- [x] Google Calendar deve ficar fora do primeiro lote de implementacao ate existir modelo de credenciais/tokens aprovado.
- [x] Importadores devem usar staging/preview/validacao antes de gravar dados finais.
- O usuario deve validar que o novo modulo e um CRM interno da MX Consultoria e nao uma substituicao completa do CRM comercial das lojas.

## Should-fix para qualidade

- Criar `docs/stories` a partir do PRD antes de qualquer codigo.
- Criar teste RLS antes das telas financeiras/documentos.
- Definir feature flag ou guard de rota para `/consultoria`.
- Definir convencao de tipos de documento, evidencia e status de visita.
- Definir quais clientes entram no piloto inicial.

## Recomendacao PO

Prosseguir para document sharding e criacao da primeira story somente com escopo reduzido:

1. Criar contexto `consultoria` no banco.
2. Criar RLS e testes de isolamento.
3. Criar tela minima de clientes.
4. Garantir regressao do core atual.

Nao iniciar Google Agenda, DRE, estoque ou BI antes dessa fundacao estar verde.
