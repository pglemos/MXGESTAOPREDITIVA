# Epic: Correções e Melhorias no Painel de Check-in (/checkin)

**Description:**
Restaurar lógicas de formulário robusto englobando as 20 faltas de estruturação das respostas (semântica, foco, timeouts e controles ARIA não obedecidos) cruciais para dados longos.

## Stories & Tasks

### Story 1: Estrutura Geral de Submissão e Rede
- [ ] Task 1.1: [Erro 1] Mitigar falhas com conexões e Timeout massivo engolidos pelos "Warnings de No Profile" assíncronos no componente pai.
- [ ] Task 1.2: [Erro 2] Providenciar contorno na tela principal base através do Landmark `<main>`.
- [ ] Task 1.3: [Erro 10] Instituir um sumário lógico nos subtítulos hierárquicos com as divisões de instruções do questionário (`h2/h3`).
- [ ] Task 1.4: [Erro 12] Desenvolver controle anti-perdas usando `beforeunload` para barrar a transição da rota por deslize e precaver dados incompletos.
- [ ] Task 1.5: [Erro 15] Aliviar blocos inversos lógicos visuais vs A11y onde os validadores escondidos requerem do SR varreduras perdidas por Scroll final.
- [ ] Task 1.6: [Erro 19] Contornar repetição cíclica nas chamadas ao servidor gerando spikes na CPU numa interface de inserção lenta como os Forms.

### Story 2: Lógicas Nativas do Componente Form, Textos e Acessibilidade
- [ ] Task 2.1: [Erro 3] Subdividir o check-in em contextos semânticos usando HTML Fieldsets e as titulações Legend.
- [ ] Task 2.2: [Erro 4] Conectar a rede de Múltiplos Ids concorrentes no Lighthouse que se duplicam nas avaliações do mesmo modelo iterativo.
- [ ] Task 2.3: [Erro 7] Descrever ao validador de navegação os pontos cruciais usando o flag ativo de `aria-required="true"`.
- [ ] Task 2.4: [Erro 9] Adicionar descrição contextual informando aos preenchedores o contador restrito dos Textareas usando links de `aria-describedby`.
- [ ] Task 2.5: [Erro 11] Trocar spans Checkboxes visuais/mudos por nativas labels semânticas e validadores form-control html base (`input` do tipo).
- [ ] Task 2.6: [Erro 13] Retrabalhar seletores limitados e perigosos no Input de data formatados soltos e desprovidos de min/max/pattern seguros do Calendário.
- [ ] Task 2.7: [Erro 20] Encapsular componentes mal configurados em Radio Groups onde label fica estruturalmente isolado da Input Box via flex layouts.

### Story 3: Experiência Interativa, UI State e Controles Complexos
- [ ] Task 3.1: [Erro 5] Implementar Sliders Avaliativos (Ranges / Barras Deslizantes) usando tags base `<input type="range">` que são focáveis no Teclado sem necessitar de Drag do mouse.
- [ ] Task 3.2: [Erro 6] Preencher Atributo aria "disabled" claro onde faltar informações antes de fechar e enviar formulários (evitando disables visuais silenciosos).
- [ ] Task 3.3: [Erro 8] Inserir `div role="alert"` nas caixas estouradas e focar nativamente as rejeições que pipocam em validação genérica de falha.
- [ ] Task 3.4: [Erro 14] Proibir encavalamentos desestruturados de Modais (`Modais sobre Modais`) acionando as tags modernas HTML5 de `<dialog>`.
- [ ] Task 3.5: [Erro 16] Prevenir botões e abas internas disfarçadas operando como hrefs inúteis sem âncoras ("href='#'") dentro de assistentes de wizard no formulário.
- [ ] Task 3.6: [Erro 17] Solucionar perdas nas tipografias finas (Weights) e cor lavadas nos text inputs não passando os ratings de legibilidade.
- [ ] Task 3.7: [Erro 18] Alertar no sumário da API sucesso e status do Fetch sem dependência de modais mudos (implementando Aria-Live feedback global).