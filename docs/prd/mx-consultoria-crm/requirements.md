# Requirements - CRM de Consultoria MX

Fonte completa: `../mx-consultoria-crm-prd.md`

## MVP inicial obrigatorio

1. Schema `consulting_*` de clientes, contatos, assignments e auditoria basica.
2. RLS e testes de isolamento.
3. Rotas protegidas `/consultoria` e `/consultoria/clientes`.
4. Tela minima de cadastro/listagem/detalhe de cliente.
5. Importacao ou cadastro manual inicial dos clientes, sem Google Calendar.
6. Verificacao de regressao das rotas atuais do core.

## Fora do primeiro MVP

- Google Calendar/Meet.
- DRE/financeiro.
- Estoque.
- BI completo.
- Importacao definitiva de todos os arquivos.
- Portal do cliente.

## Requisitos principais

- Cliente da consultoria com produto, contatos, unidades, status e consultores.
- Historico por cliente: visitas, documentos, evidencias, feedbacks e pendencias.
- Agenda de consultoria com visitas, eventos, aulas e bloqueios.
- Visitas PMR 1-7 com objetivo, checklist, evidencia e modelo de relatorio.
- Financeiro/DRE, estoque, leads, PDI e treinamentos em fases posteriores.
- RLS obrigatoria antes de expor dados financeiros, documentos e clientes.
- Importacoes sempre por staging/validacao.

## Compatibilidade obrigatoria

- Manter Supabase Auth, `users`, `memberships` e papeis existentes.
- Nao trocar `stores` por clientes de consultoria.
- Nao quebrar `checkin`, `funil`, `ranking`, `feedback`, `pdi`, `treinamentos` e relatorios.
