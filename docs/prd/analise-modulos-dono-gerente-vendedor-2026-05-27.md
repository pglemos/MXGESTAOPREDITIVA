# Analise dos Modulos por Perfil - Dono, Gerente e Vendedor

**Data:** 2026-05-27  
**Fonte:** `MX PERFORMANCE - DESENVOLVIMENTO.docx` + imagens do modulo do dono + imagens das visoes do gerente e vendedor  
**Status:** Base funcional aplicada em UI, pendencias de dados mantidas explicitas, documento completo conferido por extracao textual do DOCX

## Direcao Geral

O MX Performance deve funcionar como um sistema operacional de consultoria e gestao para lojas automotivas. Ele nao deve parecer CRM, ERP, BI tradicional ou planilha.

Cada perfil precisa entrar no sistema e ver apenas a leitura que ajuda sua rotina:

- Dono / diretor: decisao estrategica, risco, prioridade e cobranca.
- Gerente comercial: execucao operacional da equipe, rotina, funil, agenda e cobranca.
- Vendedor: performance pessoal, agenda, fechamento diario, ranking, feedbacks e desenvolvimento.

## Modulo do Dono

### Objetivo

Ser uma central de controle estrategica. O dono nao deve navegar muito nem interpretar dezenas de indicadores brutos. A Home precisa mostrar o que importa hoje.

### Estrutura Correta

- Home executiva com saudacao, periodo, filtros, alertas e score.
- KPIs principais: Lucro Bruto, % Margem, Volume de Vendas, Estoque e MX Score.
- Meta do mes com vendidos, faltam, ritmo e projecao.
- Alertas criticos com prioridade e prazo.
- Alertas sempre estruturados com problema, impacto, recomendacao e acao rapida.
- Proximas acoes do diretor.
- Desempenho por departamento: Comercial, Marketing, Produto, Financeiro, Operacional e RH.
- Central MX com Planejamento Estrategico, Plano de Acao, Alertas Inteligentes, Benchmarking, Agenda Executiva e Consultor IA.

### Regra de Dados

Dados sem fonte real nao podem virar numero ficticio. Ticket, estoque, ano anterior, custo por venda e ranking comparativo devem exibir pendencia ou placeholder claro enquanto nao houver integracao/importacao.

### Correcao Aplicada

- Navegacao do dono foi reorganizada para a IA das imagens.
- Home executiva substitui o header legado de status da loja apenas para `role === dono`.
- Central MX agora renderiza telas internas para planejamento, plano de acao, alertas, benchmarking, agenda e consultor.
- Alertas do dono foram ajustados para expor problema, impacto, recomendacao e acao rapida, conforme a regra do documento.
- Desktop e mobile foram validados sem overflow horizontal.

## Modulo do Gerente

### Objetivo

Ser a central operacional da equipe comercial. O gerente nao precisa da leitura estrategica do dono como primeira camada; ele precisa saber o que cobrar, quem esta pendente e onde o funil quebrou.

### Estrutura Correta

Home gerencial:

- Meta do mes com Meta, Realizado, Projecao, progresso e falta.
- Ritmo diario com ritmo ideal e ritmo atual.
- Conversao geral contra benchmark.
- Agendamentos hoje.
- MX Score da loja com leitura operacional.

Blocos:

- Desempenho da equipe com vendedor, vendas, meta, agenda, disciplina e status.
- Funil de vendas da equipe com leads, agendamentos, visitas e vendas.
- Alertas importantes priorizados.
- Alertas com problema, impacto, recomendacao e acao rapida para cobranca operacional.
- Agenda de hoje / rotina operacional.
- Ranking da loja.
- Engajamento da equipe.

### Comportamento Esperado

- O gerente deve ter atalhos diretos para rotina, equipe, ranking, feedback e PDI.
- Alertas devem indicar proxima acao operacional, nao apenas diagnostico.
- Funil deve mostrar leads > agendamentos > visitas > vendas contra benchmark.
- Disciplina mede preenchimento/rotina, nao deve ser misturada como nota comercial pura.

### Correcao Aplicada

- Navegacao do gerente foi renomeada para Central Operacional e Rotina Comercial.
- Home de performance do gerente agora usa cockpit operacional proprio, alinhado a imagem enviada.
- Header legado de dashboard foi removido somente da Home do gerente, assim como ja havia sido feito para a Home executiva do dono.
- KPIs do gerente foram ajustados para Meta do Mes, Ritmo Diario, Conversao Geral, Agendamentos Hoje e MX Score.
- A tela inclui Desempenho da Equipe, Funil de Vendas da Equipe, Alertas Importantes, Engajamento, Ranking da Loja e Agenda de Hoje.
- Alertas gerenciais agora mostram recomendacao separada da acao imediata, evitando misturar diagnostico com execucao.
- A agenda usa apenas dados reais disponiveis nos lancamentos; quando nao ha integracao/cadastro, exibe pendencia clara.

## Modulo do Vendedor

### Objetivo

Ser um app de performance pessoal. O vendedor nao deve usar o MX como CRM nem duplicar preenchimentos comerciais de sistemas parceiros.

### Estrutura Correta

Menu:

- Meu Dia.
- Agenda.
- Funil.
- Feedbacks.
- PDI.
- Treinamentos.
- Trilhas.

Blocos:

- Meta.
- Comissao estimada quando houver regra real.
- Agenda do dia.
- Fechar meu dia.
- Ranking.
- Score pessoal.
- Treinamentos.
- Feedbacks.

### Comportamento Esperado

- O fechamento diario continua simples: leads, agendamentos, visitas, vendas, porta, carteira e expectativa do dia seguinte.
- A Home precisa explicar a rotina pelo uso, nao por texto longo.
- Ranking e score devem orientar melhoria, sem expor dados indevidos de outros vendedores.
- Treinamentos e PDI entram como evolucao, nao como administracao.

### Correcao Aplicada

- Navegacao do vendedor foi renomeada para Meu Dia e Evolucao.
- Lançamento diario virou Fechar Meu Dia.
- Historico foi reposicionado como Funil.
- Devolutivas virou Feedbacks.
- Desenvolvimento foi dividido em Treinamentos e Trilhas, apontando para o modulo existente.
- Home `Meu Dia` foi redesenhada como cockpit pessoal do vendedor, alinhada a imagem enviada: meta mensal, comissao estimada, agendamentos hoje, atividades hoje, Score MX, agenda, fechamento do dia, ranking, evolucao, conquistas, treinamentos e ultimo feedback.
- Comissao estimada nao usa numero ficticio; quando a regra de comissao nao esta configurada, a UI mostra estado pendente e orienta configurar a regra.
- Agenda do dia usa dados operacionais existentes do fechamento/check-in. Quando nao ha integracao de agenda real, a tela mostra tarefas agregadas sem criar compromissos falsos.
- Score pessoal, conquistas e progresso usam leituras derivadas da rotina disponivel; sem fonte completa, devem ser tratados como estimativas de performance e disciplina, nao como gamificacao financeira definitiva.

## Pendencias Reais

Estas pendencias nao devem ser mascaradas por numeros falsos:

- Estoque total e estoque envelhecido dependem de integracao, importacao ou cadastro mensal.
- Lucro bruto, margem, custo por venda e ticket medio dependem de DRE ou fonte financeira consistente.
- Benchmarking com lojas similares depende de base comparativa validada.
- Agenda Executiva real depende de integracao Google/Outlook ou cadastro operacional.
- Plano de Acao 2.0 precisa de modelo persistente com departamento, indicador, problema, acao, como, responsavel, prazo, status, eficacia, origem e prioridade.

## Principio de Implementacao

O sistema deve detectar, orientar, cobrar, acompanhar e evoluir. A UI observa e direciona; a operacao deve continuar sustentada por dados reais e automacoes existentes.
