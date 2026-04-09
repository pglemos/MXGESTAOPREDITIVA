# Epic: Correções e Melhorias no Kanban / Funil de Vendas (/funil)

**Description:**
Solução compreensiva das 20 falhas do Kanban, com foco especial na integração com Screen Readers, Modais e correção da montagem de Rota.

## Stories & Tasks

### Story 1: Semântica Central e Acessibilidade do Kanban
- [ ] Task 1.1: [Erro 3] Englobar os containers gerados de drag do Kanban numa âncora semântica `<main>`.
- [ ] Task 1.2: [Erro 8] Consertar colunas de estágios do funil mudando as classes pseudo-título (`<div class="font-bold">`) para uma tag correta de seção `<h3>`.
- [ ] Task 1.3: [Erro 9] Transformar listas desconexas em semânticas atrelando as colunas com a tag `<ul role="list">` e os cards de lead como `<li>`.
- [ ] Task 1.4: [Erro 19] Fornecer mecanismo invisível de "Skip Link" ou "Pular para o conteúdo principal" isolando a base de componentes de administração do Kanban.
- [ ] Task 1.5: [Erro 10] Ocultar a poluição gerada de SVGs decorativos nas colunas de lead usando `aria-hidden="true"`.
- [ ] Task 1.6: [Erro 15] Interromper repetição estrita de mesmos títulos descritivos no atributo `title` de todos os avatares de cards para evitar saturação ao Screen Reader.

### Story 2: Lógicas Operacionais de Drag and Drop
- [ ] Task 2.1: [Erro 4] Ligar a retenção de foco (`Focus Trap`) dentro das caixas modais e popups do lead do Kanban impedindo cliques de fundo.
- [ ] Task 2.2: [Erro 5] Implementar fallbacks nativos de acessibilidade permitindo a movimentação dos blocos via setas direcionais do teclado onde Mouse Drag não é possível.
- [ ] Task 2.3: [Erro 7] Disparar anúncios vivos com `aria-live="polite"` quando resultados e movimentação do Funil são alterados em tempo real na conexão socket/fetch.
- [ ] Task 2.4: [Erro 13] Vincular um título em gavetas laterais de visualização (`Drawer`) utilizando adequadamente o atributo `aria-labelledby`.
- [ ] Task 2.5: [Erro 18] Incorporar elementos `.sr-only` em cartões de Kanban onde a indicação "quente" ou "frio" hoje é feita 100% via troca de cor.

### Story 3: UI Visual e Inputs de Pesquisa
- [ ] Task 3.1: [Erro 2] Aumentar e equalizar o contraste de texto extremamente claro (`text-[10px] font-black text-gray-400`) falhando o WCAG.
- [ ] Task 3.2: [Erro 6] Modificar o background ou textos cinza-claro dos indicadores de Pipeline base que comprometem a legibilidade das etapas.
- [ ] Task 3.3: [Erro 12] Ampliar os botões operacionais no card de detalhes de lead para o alvo tátil (touch target) mínimo de `44px`.
- [ ] Task 3.4: [Erro 14] Prover atributos semânticos id/name e tag `<label>` para campos anônimos encarregados dos filtros das colunas.
- [ ] Task 3.5: [Erro 17] Substituir os manipuladores cegos de submit (`onClick` livre em botão ou form de alteração de fase de kanban) por rotinas nativas de evento `onSubmit` englobadas em `<form>`.
- [ ] Task 3.6: [Erro 20] Solucionar perdas de cabeçalho e relação eixo fixo ao rolar os funis no transbordo da viewport móvel (Mobile Axis).

### Story 4: Perf LCP, Chaves Dom e State Loop
- [ ] Task 4.1: [Erro 1] Cuidar do problema de redundância e recarregamento assíncrono repetitivo da Rota causando Warnings sucessivos de Auth State.
- [ ] Task 4.2: [Erro 11] Interromper perigosas repetições de chave (`keys` estáticas) originadas por loops no array do funnel que espelham colisões de ID no HTML final.
- [ ] Task 4.3: [Erro 16] Virtualizar carregamento maciço de cartões ou usar `memoização` agressiva em pipelines de Lojas complexas que bloqueiam a métrica de LCP.