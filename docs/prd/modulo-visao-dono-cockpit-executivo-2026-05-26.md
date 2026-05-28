# Modulo Visao do Dono - Cockpit Executivo

**Data:** 2026-05-26  
**Fonte visual:** `/Users/pedroguilherme/Desktop/Captura de Tela 2026-05-26 as 09.22.05.png`  
**Fonte de negocio:** transcricao Google Meet `MX - Evento online - Validacao Google Meet MX - Daniel e Jose`, 2026-05-22  
**PRD base:** `docs/prd/prd-refatoracao-mx-performance-reuniao-2026-05-22.md`  
**Tipo:** Especificacao funcional e visual para refatoracao brownfield da visao do dono

---

## 1. Intencao do Modulo

A tela enviada representa o modulo principal da visao do dono.

Ela deve substituir a leitura atual de "performance da loja" por um cockpit executivo simples, limpo e orientado a decisao.

Na reuniao, Daniel deixou claro que o dono nao deve entrar no sistema para interpretar dezenas de numeros. Ele deve bater o olho e entender:

- Como esta a loja hoje.
- Onde esta o risco.
- Qual area precisa de atencao.
- Qual acao esta pendente.
- Qual departamento esta performando mal.
- O que precisa ser cobrado do gerente/equipe.

Portanto, esta tela e a materializacao da frase da reuniao:

> "Aqui esta o que realmente importa hoje."

---

## 2. Papel no Produto

Esta tela deve ser a Home do dono.

Ela nao e:

- Tela tecnica de CRM.
- Tela de relatorio analitico.
- Tela de todos os 45 indicadores.
- Tela operacional do vendedor.
- Tela de consultor MX.

Ela e:

- Visao executiva.
- Resumo de risco.
- Painel de decisao.
- Entrada para Consultoria, Resultados, Plano de Acao, Visitas, Departamentos e Treinamentos.
- Vitrine comercial do valor da MX.

---

## 3. Estrutura Visual da Tela

A imagem tem quatro grandes regioes:

1. Sidebar de navegacao do dono.
2. Header executivo com saudacao, periodo, notificacoes e ajuda.
3. Area principal com KPIs, panorama, alertas, eficiencia e plano de acao.
4. Faixa inferior com desempenho por departamento.

---

## 4. Sidebar do Dono

### 4.1 Itens visuais da imagem

Ordem proposta:

1. Home
2. Consultoria
3. Resultados
4. Plano de Acao
5. Visitas
6. Departamentos
7. Treinamentos
8. Falar com Consultor

Tambem aparece:

- Logo MX Performance no topo.
- Perfil do dono no rodape.
- Nome: exemplo `Joao Silva`.
- Papel: `Diretor`.
- Loja ativa: exemplo `MX Veiculos`.
- Indicador online/status.
- Badge de pendencia no Plano de Acao.

### 4.2 Regra de produto

A sidebar do dono deve seguir a arquitetura aprovada na reuniao:

- Home e a entrada executiva.
- Consultoria e o agrupador do painel consultivo.
- Resultados e drill-down de metas/realizado/ano anterior/vendedores.
- Plano de Acao e a area de execucao central.
- Visitas e o acompanhamento PMR/PMR Plus/PPA.
- Departamentos e a visao da empresa por area.
- Treinamentos e biblioteca/trilhas.
- Falar com Consultor e suporte consultivo.

### 4.3 Impacto no sistema atual

Hoje `src/components/Layout.tsx` mostra para dono:

- Minhas Lojas
- Performance
- Equipe
- Ranking
- Matinal Oficial
- Devolutivas
- PDI
- Treinamentos
- Produtos Digitais

Isso nao reflete a decisao da reuniao.

Necessario refatorar a navegacao do perfil `dono` para a nova IA.

---

## 5. Header Executivo

### 5.1 Elementos da imagem

- Saudacao: `Bom dia, Joao!`
- Subtitulo: `Aqui esta o que realmente importa hoje.`
- Seletor de periodo: `Maio / 2026`
- Sino de notificacoes com badge.
- Botao de ajuda.

### 5.2 Regras

- Nome deve vir do perfil do usuario.
- Saudacao deve variar por horario quando possivel: bom dia, boa tarde, boa noite.
- Periodo deve controlar todos os dados da tela.
- Notificacoes devem priorizar pendencias relevantes do dono.
- Ajuda deve explicar a leitura da tela sem excesso de texto fixo.

### 5.3 Diferenca para tela atual

O header atual do `DashboardLoja` fala em "Status de Unidade" e possui abas `Performance`, `Metas`, `Equipe`.

Para o dono, isso deve mudar para uma leitura executiva:

- Menos tecnica.
- Mais direta.
- Mais proxima da linguagem da reuniao.
- Mais orientada a decisao.

### 5.4 Agenda do Diretor

A reuniao definiu que o dono precisa receber uma agenda clara de acoes obrigatorias ao longo do mes.

Mesmo que a imagem nao mostre um card dedicado de agenda, a Home do dono deve preparar espaco funcional para essa necessidade por meio de:

- Notificacoes de agenda no sino.
- Alertas quando houver acao obrigatoria do diretor vencida ou proxima do vencimento.
- Link para a agenda mensal do diretor a partir do painel/consultoria.
- Opcao para o dono receber comunicados por e-mail quando a agenda estiver vinculada.

O sistema ja possui disparo por e-mail configurado pelo endereco de gestao da MX, segundo a reuniao. A primeira entrega nao precisa recriar esse motor, mas deve considerar a agenda como fonte de alertas e pendencias da Home.

---

## 6. Cards de KPI Superior

A imagem mostra cinco cards superiores:

1. Vendas
2. Conversao
3. Ticket Medio
4. Estoque
5. Indice de Eficiencia

### 6.1 Vendas

Na imagem:

- `Vendas (R$)`
- Valor: `1.245.000`
- Variacao: `+18% vs Abril/2026`

Regra:

- Deve mostrar valor de venda quando houver base financeira.
- Se o sistema ainda so tiver quantidade de vendas, deve exibir `Vendas (Unid.)` para nao mentir.
- Deve comparar com periodo anterior.
- Deve indicar tendencia com cor e seta.

Dependencias:

- Dados de faturamento ou DRE para valor em R$.
- Dados de lancamento diario para unidades.

### 6.2 Conversao

Na imagem:

- `Conversao`
- Valor: `18,7%`
- Variacao: `+2,4 p.p. vs Abril/2026`

Regra:

- Conversao deve ser uma taxa principal, preferencialmente do funil.
- O sistema ja possui funil em `funilData`.
- Deve deixar claro qual conversao esta sendo mostrada.

Opcoes:

- Lead -> agendamento.
- Agendamento -> visita.
- Visita -> venda.
- Conversao composta.

Decisao pendente:

- Definir qual taxa o dono deve ver como KPI principal.

### 6.3 Ticket Medio

Na imagem:

- `Ticket Medio`
- Valor: `R$ 87.600`
- Variacao: `+7% vs Abril/2026`

Regra:

- Ticket medio deve vir de vendas com valor.
- Se nao houver valor por venda, pode vir de estoque/CRM.
- Nao deve ser calculado artificialmente a partir de dados inexistentes.

Dependencia:

- Valor de venda por unidade ou integracao com CRM/AutoCerto.

### 6.4 Estoque

Na imagem:

- `Estoque (Unid.)`
- Valor: `64`
- Variacao negativa: `-5% vs Abril/2026`

Regra:

- Estoque deve mostrar unidades atuais.
- Deve apoiar alertas de estoque envelhecendo.
- Deve vir de integracao, importacao manual ou cadastro mensal.

Dependencia:

- CRM/AutoCerto/API ou entrada manual.

### 6.5 Indice de Eficiencia

Na imagem:

- Gauge circular.
- Valor: `82 de 100`.
- Variacao: `+12 pontos vs Abril/2026`.

Regra:

- Este e o principal resumo executivo.
- Deve ser composto por departamentos e indicadores priorizados.
- Nao deve ser a media simples dos 45 indicadores sem curadoria.

Composicao inicial sugerida:

- Comercial.
- Marketing.
- Produto/Estoque.
- Financeiro.
- Operacional.
- RH.

Cada area deve ter peso configuravel no futuro.

---

## 7. Panorama da Loja

### 7.1 Elementos da imagem

- Titulo: `Panorama da Loja`.
- Subtitulo: `Comparativo: Planejado x Realizado`.
- Grafico de linha.
- Series:
  - Planejado.
  - Realizado.
  - Ano anterior.
- Meses de janeiro a dezembro.
- Tooltip/callout com meta mensal.

### 7.2 Regra

O dono precisa ver se a loja esta dentro do plano.

Esse bloco deve responder:

- O realizado esta acima ou abaixo do planejado?
- Como esta contra o ano anterior?
- Qual e a meta mensal?
- Quanto da meta foi atingido?

### 7.3 Dependencias de dados

Para a versao final:

- Planejamento mensal.
- Realizado mensal.
- Historico do ano anterior.
- Meta mensal.

Para MVP:

- Usar dados disponiveis de meta e vendas do periodo.
- Exibir grafico apenas quando houver serie suficiente.
- Se houver poucos dados, mostrar estado vazio explicativo.

### 7.4 Alerta de nao inventar dado

Nao preencher janeiro-dezembro com numero fake.

Se o sistema nao tiver historico anual, a UI deve mostrar:

- Periodo atual.
- Comparativo disponivel.
- Aviso de dado insuficiente para ano anterior.

---

## 8. Alertas Importantes

### 8.1 Elementos da imagem

Titulo:

- `Alertas importantes`
- `4 itens precisam da sua atencao`

Alertas exibidos:

1. Conversao abaixo da meta.
2. Follow-up atrasado.
3. Estoque envelhecendo.
4. Treinamento pendente.

Cada alerta tem:

- Icone.
- Cor/severidade.
- Titulo.
- Descricao objetiva.
- Chevron para abrir detalhe.

### 8.2 Regra

Alertas devem ser priorizados para decisao do dono, nao para execucao operacional.

Cada alerta precisa ter:

- Causa.
- Impacto.
- Proxima acao.
- Responsavel sugerido.
- Link para area correta.

### 8.3 Alertas derivados da reuniao

Alertas iniciais esperados:

- Meta abaixo do ritmo.
- Conversao abaixo do benchmark.
- Rotina diaria incompleta.
- Follow-up atrasado.
- Plano de acao vencido.
- Estoque envelhecendo.
- Treinamento pendente.
- DRE pendente.
- Marketing sem agenda/acao.
- Pesquisa de clima com indice baixo.

### 8.4 Impacto no sistema atual

Hoje `PerformanceAlerts.tsx` ja calcula:

- Meta abaixo do ritmo.
- Rotina diaria incompleta.
- Baixa conversao de lead.
- Visita nao vira venda.
- Sem dados no periodo.
- Operacao dentro do esperado.

Isso deve ser reaproveitado, mas o layout do dono precisa mudar para o formato da imagem.

---

## 9. Plano de Acao

### 9.1 Elementos da imagem

- Card lateral.
- Grafico circular.
- Total: `24 Acoes`.
- Legenda:
  - 14 concluidas.
  - 8 em andamento.
  - 2 atrasadas.
- Botao: `Ver todas as acoes`.

### 9.2 Regra

Este bloco deve resumir a execucao da loja.

Ele precisa mostrar:

- Total de acoes.
- Acoes concluidas.
- Acoes em andamento.
- Acoes atrasadas.
- Acoes aguardando evidencia, quando existir.
- Acoes do dono x gerente x vendedor.

### 9.3 Dependencia critica

A reuniao deixou claro que o plano de acao atual precisa ser refatorado.

Este card depende do Plano de Acao 2.0:

- Plano central.
- Responsaveis.
- Status editavel.
- Evidencias.
- Atualizacao pela loja.
- Notificacao/cobranca.

### 9.4 Regra de clique

O botao deve levar para `Plano de Acao`, mantendo:

- Loja ativa.
- Periodo.
- Filtros de status.

---

## 10. Desempenho por Departamento

### 10.1 Elementos da imagem

Titulo:

- `Desempenho por Departamento`
- Link: `Ver todas`

Cards:

- Comercial: 86, Otimo.
- Marketing: 78, Bom.
- Produto: 72, Atencao.
- Financeiro: 85, Otimo.
- Operacional: 76, Bom.
- RH: 80, Bom.

Cada card possui:

- Icone colorido.
- Nome do departamento.
- Score.
- Status textual.
- Barra de progresso.

### 10.2 Regra

Este bloco e a ponte entre a visao executiva e a aba Departamentos.

Ele deve mostrar a saude da empresa por area.

Ao clicar em um departamento:

- Abre detalhe daquele departamento.
- Mostra indicadores-chave.
- Mostra alertas.
- Mostra plano de acao vinculado.
- Mostra responsaveis.

### 10.3 Departamentos iniciais

Baseados na reuniao:

- Comercial.
- Marketing.
- Produto/Estoque.
- Financeiro.
- Operacional.
- RH.

Possiveis subdepartamentos:

- Preparacao.
- Pos-venda.
- Administrativo.

### 10.4 Score

O score por departamento deve ser simples para o dono, mas rastreavel tecnicamente.

Exemplo:

- 85-100: Otimo.
- 75-84: Bom.
- 60-74: Atencao.
- Abaixo de 60: Critico.

Decisao pendente:

- Definir pesos por area.

---

## 11. Complementos da Visao do Dono

A imagem representa a Home executiva, mas a reuniao deixou claro que a visao do dono nao termina nessa primeira tela. A Home deve ser a porta de entrada para os demais blocos de consultoria.

### 11.1 Comparativo mercado/rede

O dono precisa conseguir comparar a loja com:

- Mercado.
- Rede/base de clientes MX.
- Boas praticas.
- Lojas de perfil semelhante, quando houver amostra suficiente.

Regra de privacidade:

- Se houver menos de 5 lojas comparaveis, o sistema nao deve expor recorte especifico.
- Nesses casos, deve voltar para benchmark geral ou estado de dados insuficientes.

Na Home, esse comparativo pode aparecer inicialmente como alerta, insight ou link para dashboard comparativo. A tela nao deve depender disso para o MVP, mas a arquitetura precisa prever o drill-down.

### 11.2 Biblioteca consultiva

A biblioteca deve reduzir dependencia do consultor e responder duvidas recorrentes do dono, gerente e equipe.

Conteudos previstos pela reuniao:

- Estudos.
- Noticias do mercado automotivo.
- Materiais sobre remuneracao, CLT, PJ e boas praticas.
- Conteudos de marketing, estoque, financeiro, RH e operacao.
- Data da ultima atualizacao.
- Possibilidade de alimentacao automatica por IA.

Na Home, a biblioteca deve aparecer como destino de ajuda contextual: quando um alerta ou duvida exige explicacao, o sistema pode apontar para o conteudo correspondente.

### 11.3 Visitas PMR, PMR Plus e PPA

A Home deve respeitar o produto contratado.

O menu `Visitas` deve levar ao acompanhamento padronizado de:

- PMR.
- PMR Plus.
- PPA.

Regras derivadas da reuniao:

- PMR online e presencial devem seguir padrao semelhante, mudando apenas perfil da visita presencial.
- PMR Plus e PPA sao acompanhamento para clientes que ja passaram pelo PMR basico.
- PPA tem temas por visita, incluindo modelo de negocio/planejamento estrategico, eficiencia em custo e receita.
- Toda visita tem acompanhamento geral, mesmo quando possui tema especifico.
- Checklists, arquivos, evidencias e ata gerada por IA devem compor a execucao da visita.

Na Home, pendencias de visita podem virar alertas executivos.

### 11.4 Falar com Consultor

O item `Falar com Consultor` deve ser tratado como suporte consultivo e tambem como produto/upsell.

Regras da reuniao:

- Pode ser chat interno ou integracao futura com WhatsApp/API.
- O chamado deve ser distribuido para consultor designado ou consultor online.
- Conversas devem ficar registradas para banco de dados de duvidas, melhorias e solucoes.
- No futuro, a IA pode usar esse historico para sugerir respostas.
- Se o consultor nao responder dentro do SLA definido, pode haver redistribuicao.

Na Home, o botao deve estar sempre visivel na navegacao, mas regras de acesso podem depender do plano contratado.

---

## 12. Hierarquia de Informacao

A ordem da tela deve seguir a urgencia do dono:

1. Saudacao e periodo.
2. KPIs executivos.
3. Indice de eficiencia.
4. Panorama planejado x realizado.
5. Alertas importantes.
6. Plano de acao.
7. Departamentos.

Essa ordem evita que o dono caia direto em relatorio tecnico.

---

## 13. Comportamento Mobile

A imagem e desktop/tablet largo.

No mobile:

- Sidebar vira menu inferior ou drawer.
- Header deve manter saudacao e periodo.
- KPIs viram carousel ou grid 2x.
- Indice de eficiencia deve aparecer logo apos KPIs.
- Alertas aparecem antes do grafico se houver item critico.
- Grafico deve ter altura controlada.
- Plano de acao fica como card compacto.
- Departamentos viram lista vertical.

---

## 14. Estados

### 14.1 Loading

Mostrar skeletons por bloco, nao spinner global longo.

### 14.2 Sem dados

Nunca preencher com numeros falsos.

Estados vazios:

- `Ainda nao ha dados suficientes para comparar com o ano anterior.`
- `Cadastre a meta mensal para habilitar o panorama.`
- `Integre o estoque para acompanhar envelhecimento.`
- `Plano de acao ainda nao configurado.`

### 14.3 Erro

Erro por bloco, mantendo o restante da tela utilizavel.

### 14.4 Upsell

Para modulos nao contratados:

- Mostrar card bloqueado.
- Explicar valor.
- CTA: `Falar com consultor`.

---

## 15. Reaproveitamento do Codigo Atual

### 15.1 Reaproveitar

- `src/features/dashboard-loja/DashboardLoja.container.tsx`
- `src/features/dashboard-loja/hooks/useDashboardLojaData.ts`
- `src/features/dashboard-loja/sections/PerformanceAlerts.tsx`
- `src/features/dashboard-loja/sections/KpisSection.tsx` como fonte conceitual, nao visual final.
- `src/features/dashboard-loja/sections/OwnerDecisionCards.tsx` como logica inicial de decisao, mas nao layout final.
- `src/pages/ConsultoriaClienteDetalhe.tsx` e `ConsultoriaVisitaExecucao.tsx` para links futuros.

### 15.2 Refatorar

- `src/components/Layout.tsx`: navegacao do dono.
- `PerformanceTab`: renderizar cockpit executivo quando `role === dono`.
- Criar componente novo: `OwnerExecutiveCockpit`.
- Criar componentes internos:
  - `OwnerKpiStrip`.
  - `OwnerEfficiencyGauge`.
  - `OwnerPanoramaChart`.
  - `OwnerAlertList`.
  - `OwnerActionPlanSummary`.
  - `OwnerDepartmentScoreGrid`.

### 15.3 Criar depois

- Data model real de plano de acao.
- Data model real de departamentos.
- Data model real de estoque.
- Data model real de ticket medio.
- Data model real de benchmark mercado/rede.

---

## 16. MVP Recomendado

### 16.1 MVP visual funcional

Primeira entrega deve:

- Alterar navegacao do dono para a IA da reuniao.
- Criar cockpit executivo do dono.
- Usar dados reais existentes quando houver.
- Mostrar estados vazios onde faltar dado.
- Reaproveitar alertas atuais.
- Nao inventar ticket medio, estoque ou receita se ainda nao existem.

### 16.2 Campos do MVP

| Bloco | Fonte no MVP | Observacao |
| --- | --- | --- |
| Vendas | `metrics.totalSales` | Exibir como unidade se nao houver valor financeiro |
| Conversao | `funilData` | Definir qual taxa principal |
| Ticket Medio | estado vazio | Depende de dados financeiros/CRM |
| Estoque | estado vazio | Depende de CRM/AutoCerto/manual |
| Indice de Eficiencia | calculo inicial simples | Deve ser marcado como leitura MX preliminar |
| Panorama | meta + realizado disponivel | Nao simular ano anterior |
| Alertas | `usePerformanceAlerts` | Adaptar layout |
| Plano de Acao | estado vazio ou dados existentes se houver hook | Depende Plano de Acao 2.0 |
| Departamentos | scores iniciais derivados/pendentes | Melhor iniciar com estado configuravel |

---

## 17. Acceptance Criteria

1. Dono acessa `/lojas/:storeSlug` e ve a Home executiva, nao a tela antiga de performance tecnica.
2. Sidebar do dono exibe a nova IA: Home, Consultoria, Resultados, Plano de Acao, Visitas, Departamentos, Treinamentos e Falar com Consultor.
3. Header exibe saudacao pelo nome, periodo, notificacoes e ajuda.
4. KPIs principais aparecem no topo com valores reais ou estado vazio explicito.
5. O sistema nao exibe os 45 indicadores brutos na primeira tela.
6. Alertas aparecem em formato de lista priorizada, com causa e proxima acao.
7. Plano de Acao aparece como resumo visual, mesmo que em estado vazio ate Plano de Acao 2.0.
8. Departamentos aparecem como cards de eficiencia.
9. A tela e responsiva e nao quebra em mobile.
10. Nenhum dado ausente e preenchido com valor ficticio.
11. A navegacao preserva loja ativa e contexto de periodo.
12. A tela usa o design visual da imagem como referencia, mas respeita dados reais disponiveis.
13. A Home prepara acesso ou alerta para Agenda do Diretor, Comparativo mercado/rede, Biblioteca, Visitas e Falar com Consultor, mesmo que alguns sejam entregues em fases posteriores.

---

## 18. Pendencias de Decisao

1. O KPI `Vendas` sera valor em R$ ou unidade no MVP?
2. Qual taxa sera a `Conversao` principal?
3. Ticket medio vem de onde?
4. Estoque vem de AutoCerto, CRM, planilha ou cadastro manual?
5. Qual formula oficial do Indice de Eficiencia?
6. Quais status oficiais do Plano de Acao?
7. Quais departamentos entram no primeiro release?
8. O menu `Consultoria` abre subabas ou pagina dedicada?
9. `Resultados`, `Plano de Acao` e `Visitas` serao rotas novas ou tabs dentro de Consultoria?
10. Como sera tratado modulo bloqueado por plano?
11. Agenda do Diretor sera widget proprio, alerta, calendario ou resumo semanal?
12. Benchmark mercado/rede sera liberado para quais planos e com quais regras de amostra minima?
13. Falar com Consultor comeca como chat interno, WhatsApp ou formulario de chamado?
