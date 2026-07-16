# Carteira de Clientes Base44 1:1 Design Specification

## Objetivo

Reproduzir a rota `/carteira` do Base44 no MX com paridade visual, responsiva e comportamental 1:1, usando os dados e regras normalizados do Supabase.

## Critérios obrigatórios

A paridade cobre estrutura visual, tipografia, espaçamentos, tamanhos, cores, bordas, sombras, ícones, estados vazios, cards, filtros, modais, ficha lateral, transições, animações, desktop, tablet, mobile e comportamento de cada clique.

## Viewports de aceite

| Categoria | Viewport |
|---|---:|
| Desktop amplo | 1440 × 900 |
| Desktop padrão | 1280 × 800 |
| Tablet paisagem | 1024 × 768 |
| Tablet retrato | 768 × 1024 |
| Mobile amplo | 430 × 932 |
| Mobile padrão | 390 × 844 |

Tolerância máxima: 2 px em posição, dimensão e espaçamento. Cores, estados e iconografia devem reproduzir os valores observáveis do Base44.

## Estrutura da página

1. Fundo global `#F8FAFC`.
2. Conteúdo central com largura máxima de 1440 px.
3. Navegação em abas com `Carteira ativa`, `Plano de ataque` e `Execução` quando uma missão estiver ativa.
4. Aba ativa com fundo `#005BFF`, texto branco e raio de 12 px.
5. Aba inativa com fundo branco, texto `#475569`, borda suave e estado hover.
6. Área principal com espaçamento vertical de 24 px em desktop e 16 px em mobile.

## Carteira ativa

- Busca textual por nome, telefone e veículo.
- Botão de filtros com ícone `SlidersHorizontal`.
- Drawer lateral direito com backdrop, foco preso, animação e fechamento seguro.
- Chips removíveis para filtros aplicados.
- Agrupamentos temporais: Hoje, Amanhã e próximos dias.
- Estado vazio com ícone, título, explicação e CTA aplicável.
- Card desktop dividido em identidade, situação, recomendação e ações.
- Card mobile empilhado com identidade, badges, situação, recomendação, explicação, score e CTAs.
- CTA primário `Executar próximo passo`.
- CTA secundário `Abrir ficha`.

## Plano de ataque

- Missões com título, descrição, quantidade, prioridade e CTA.
- Estado de missão ativa persistente.
- Execução sequencial sem perder posição ao abrir ficha ou WhatsApp.
- Métricas de enviados, pulados, aguardando resposta, concluídos, visitas e propostas.

## Modo Ataque

- Tela completa com fila, posição atual, cronômetro, objetivo, recomendação, script e ações.
- Ficha lateral deve abrir sobre o Modo Ataque sem desmontá-lo.
- WhatsApp e ligação devem registrar origem e permitir retorno para o mesmo cliente.
- Pular, registrar resultado, avançar e sair devem preservar estado consistente.

## Ficha lateral

- Sheet lateral responsivo: direita em desktop/tablet; tela quase completa em mobile.
- Seções: dados pessoais, oportunidade ativa, veículo, negociação, financiamento, troca, observações, próximo passo e timeline.
- Timeline cronológica com data, usuário, origem, resultado, situação anterior e nova situação.
- Estados loading, vazio, erro e sucesso.

## Modais e overlays

- Novo cliente.
- WhatsApp com script e alteração de tom.
- Próximo passo.
- Próxima oportunidade.
- Retorno do WhatsApp.
- Reagendamento.
- Encerramento e não contato.

Todos devem possuir backdrop, foco preso, Escape quando seguro, bloqueio durante gravação, feedback visual, animação de entrada/saída e adaptação mobile.

## Comportamento dos cliques

| Ação | Resultado obrigatório |
|---|---|
| Buscar | Filtra em tempo real sem perder agrupamento |
| Abrir filtros | Exibe drawer com estado atual |
| Aplicar filtros | Atualiza lista e cria chips |
| Limpar filtros | Remove critérios e restaura lista |
| Remover chip | Remove somente aquele critério |
| Executar | Abre fluxo de contato/resultado do cliente |
| Abrir ficha | Abre sheet sem desmontar o contexto atual |
| WhatsApp | Abre roteiro, registra sessão e detecta retorno |
| Ligar | Abre `tel:` e permite registrar resultado |
| Alterar tom | Atualiza script sem apagar edição manual |
| Copiar | Copia mensagem e exibe feedback |
| Registrar resultado | Executa transição transacional e atualiza lista |
| Pular | Avança sem alterar situação comercial |
| Iniciar missão | Persiste missão e posição inicial |
| Pausar missão | Persiste posição e métricas |
| Retomar missão | Restaura posição, fila e métricas |
| Concluir missão | Fecha missão e registra resumo |
| Novo cliente | Cria cliente e oportunidade em transação idempotente |
| Reagendar | Atualiza compromisso existente quando aplicável |
| Encerrar | Encerra cadência com motivo e histórico |
| Não contatar | Registra bloqueio comercial e impede sugestões automáticas |

## Arquitetura de dados

A interface não pode importar ou criar a entidade monolítica `CarteiraCliente`. Deve mapear:

- `clientes` para identidade e preferências;
- `oportunidades` para negociação e etapa;
- `agendamentos` para compromissos;
- `eventos_comerciais` para timeline append-only;
- `cadencia_estado_cliente` para ritmo e próxima ação;
- `execution_actions` para tarefas sincronizadas;
- `carteira_missoes` e `carteira_missao_itens` para execução persistente.

Mudança de etapa atualiza a oportunidade ativa. Nova oportunidade exige decisão explícita e chave idempotente. Toda mutação multientidade ocorre por RPC transacional.