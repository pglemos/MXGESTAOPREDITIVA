# Módulo Gerencial — mapeamento de dados

## Regra de transformação

As fontes MX abaixo fornecem identidade, autorização e dados persistidos. A transformação deve reproduzir as entidades, fórmulas, estados e transições do código Base44; “usar a fonte MX” não autoriza manter um cálculo ou fluxo divergente. Quando mais de uma tabela for necessária para formar uma entidade Base44, a composição fica no adaptador de domínio e deve ser coberta por testes de contrato.

| Conceito Base44 | Fonte real MX | Tabela/RPC/hook | Transformação | Gap | Ação |
|---|---|---|---|---|---|
| Loja | membership ativa | `vinculos_loja`, `lojas`, `useAuth` | contexto da unidade | nenhum | reutilizar |
| Gerente | usuário autenticado | `usuarios`, `useAuth` | papel/capability | nenhum | reutilizar |
| Vendedores ativos | vínculo da loja | `vendedores_loja`, `useSellersByStore` | somente ativos | nenhum | reutilizar |
| Metas da loja | regra persistida | `store_meta_rules`, `useStoreGoal` | adaptar aos campos e fórmulas Base44 | validar paridade de calendário/dias úteis | adaptar |
| Metas individuais | ranking/meta persistida | hooks de ranking/meta | adaptar por vendedor ao contrato Base44 | revisar cobertura | adaptar |
| Fechamento diário | lançamento canônico | `lancamentos_diarios`, hooks check-in | consolidar por data | ações gerenciais dispersas | compor central |
| Movimento por canal | fechamento/CRM | `lancamentos_diarios`, `clientes`, `oportunidades` | somas por canal | nenhum | reutilizar |
| Leads/vendas/atendimentos | CRM + fechamento | `clientes`, `oportunidades`, `atendimentos` | agregação escopada | nenhum | reutilizar |
| Agendamentos / D+1 | carteira CRM | `agendamentos` | deduplicar cliente ativo | auditoria parcial | compor ações |
| Qualificados/garantia | carteira CRM | `clientes`, `oportunidades` | status canônico | nenhum | reutilizar |
| Disciplina | check-in oficial | `lancamentos_diarios` | parcial/oficial | histórico comparativo | agregar |
| Regularização | fluxo aprovado | `regularizacao_fechamento` | estado/transição | nenhum | reutilizar |
| Correção/auditoria | logs canônicos | `checkin_correction_requests`, `checkin_audit_logs`, `d1_audit_log` | antes/depois | validar RPC | endurecer servidor |
| Plano de ataque/rotina | Central de Execução | `central_execucao_aberturas`, `routine_activity_templates`, `execution_actions` | formar `RotinaDiaria` e tarefas gerenciais Base44 | agregação gerencial | criar adaptador composto |
| Follow-ups/ações | CRM/execução | `execution_actions`, cadência CRM | executado/planejado | nenhum | agregar |
| Carteira | CRM | `clientes`, `oportunidades` | atraso/último contato | nenhum | reutilizar |
| Feedbacks | fonte persistida | `feedbacks`, hooks gerente | por equipe | nenhum | reutilizar |
| PDIs | fonte persistida | `pdis`, `pdi_*`, hooks PDI | por vendedor | agenda unificada | compor abas |
| Treinamentos | fonte canônica | `treinamentos`, `progresso_treinamentos`, service | progresso por equipe | nenhum | reutilizar |
| Ranking | dados de score persistidos | hooks/features ranking | calcular e apresentar pelos pesos/estados Base44 | validar cobertura dos insumos | adaptar |
| Agenda gerencial | agenda executiva | `eventos_agenda_executiva` | por loja/usuário | nenhum | reutilizar |
| Notificações | notificações MX | hooks/tabela de notificações | eventos persistidos | nenhum | reutilizar |

Migration nova só será criada se a auditoria comprovar ausência de contrato canônico; deve incluir RLS, índices, auditoria e rollback lógico.
