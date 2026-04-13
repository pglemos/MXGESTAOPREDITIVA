# Epics - CRM de Consultoria MX

Fonte completa: `../mx-consultoria-crm-prd.md`

## Epic 1 - Fundacao do CRM de Consultoria

Objetivo: criar o contexto de consultoria sem quebrar o core atual.

Stories previstas:

1. Criar schema base de clientes da consultoria, contatos, unidades e atribuicoes.
2. Criar RLS e testes de isolamento para clientes da consultoria.
3. Criar rotas e tela inicial `/consultoria` para admin/MX.
4. Criar listagem e detalhe de cliente com historico vazio preparado.

## Epic 2 - Agenda de Consultoria

Objetivo: substituir a planilha como fonte operacional da agenda sem perder Google Agenda.

## Epic 3 - Motor PMR de Visitas

Objetivo: transformar visitas 1-7 em execucao padronizada.

## Epic 4 - Documentos, Diagnosticos e Relatorios

Objetivo: centralizar documentos de consultoria por cliente/visita.

## Epic 5 - Financeiro/DRE

Objetivo: criar prestacao de contas e analise financeira por cliente.

## Epic 6 - Estoque e Leads

Objetivo: trazer dados de estoque e leads para diagnostico da consultoria.

## Epic 7 - PDI, Treinamentos e BI

Objetivo: conectar PDI, aulas, eventos e indicadores de evolucao ao cliente.

## Sequencia

Comecar por Epic 1. Nao iniciar Google Agenda, financeiro, estoque ou BI antes da fundacao e RLS estarem verdes.
