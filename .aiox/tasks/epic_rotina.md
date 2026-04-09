# Epic: Correções e Melhorias no Painel de Rotina do Gestor (/rotina)

**Description:**
Restaurar completamente o Drag and Drop, acessibilidade de formulários, inputs e status visuais do workflow de Rotina (Morning, Rituais e Tarefas), cumprindo as 20 frentes da auditoria.

## Stories & Tasks

### Story 1: Soluções da Grade e Estados Iniciais (Race e Landmarks)
- [ ] Task 1.1: [Erro 1] Prevenir o Flicker em loopings no console do `No profile found` que afeta duramente o Paint primário.
- [ ] Task 1.2: [Erro 2] Instanciar todo o body do dashboard na tag Landmark obrigatória `<main>`.
- [ ] Task 1.3: [Erro 5] Atribuir ao Title dinâmico o "Título do navegador" referente ao dia e escopo abertos da gestão rotineira.
- [ ] Task 1.4: [Erro 8] Consertar saltos de títulos semânticos falhos dos Relatórios no markup primário da página (do h1 pulando direto no h4 e pulando blocos lógicos).
- [ ] Task 1.5: [Erro 19] Consolidar tratamentos de "Sem Tarefas/Dia Livre" atrelando textos ou Fallbacks descritivos que funcionem semanticamente (não apenas ilustração SVG crua).
- [ ] Task 1.6: [Erro 20] Evitar anomalias pesadas de "Flickering" nas tarefas da base ao renderizar subconjuntos React antes de se consolidarem na State Local.

### Story 2: Controles Interativos, Checklists e Lógica Semântica (A11y/DND)
- [ ] Task 2.1: [Erro 3] Transformar checkmarks customizados mudos baseados no layout div / SVG em rótulos adequados que usem "role=checkbox aria-checked".
- [ ] Task 2.2: [Erro 4] Associar rituais do dia num agrupamento natural na Web de listagem englobados em marcadores `<ul/ol role="list">`.
- [ ] Task 2.3: [Erro 6] Preencher os seletores esquerdo/direito (Setas) com lógicas e A11y Descritivos dos Carrosséis das semanas em vez de apenas labels ausentes (Imagens).
- [ ] Task 2.4: [Erro 9] Elaborar fallbacks não exclusivos de mouse-drag aos componentes móveis do Calendário com atalhos Up/Down e leituras text-to-speech dinâmicas.
- [ ] Task 2.5: [Erro 12] Retificar travas visuais nos formulários flutuantes na Rota ("Modal preso") contendo vazamentos indevidos aos comandos externos.
- [ ] Task 2.6: [Erro 13] Formatar propriedades ativas/nativas em dropdowns do tipo botão Expandir/Retrair Tarefas (`aria-expanded`).
- [ ] Task 2.7: [Erro 14] Proibir repetição massiva (`Keys/IDs Duplicadas`) de iterações do grid da checklist no DOM com as Tags For das labels não alinhadas na DOM Tree.
- [ ] Task 2.8: [Erro 16] Formular leituras coerentes a SR injetando "aria-valuemax / progressbar" aos indicadores de completude de tarefas visuais da rotina.

### Story 3: UX Formular, Contrasted UI e Mensagerias Críticas
- [ ] Task 3.1: [Erro 7] Corrigir métricas de Visibilidade dos itens com "Line-Through" apagados onde os textos das tarefas prontas violam taxa de leitura de Contraste.
- [ ] Task 3.2: [Erro 10] Deletar e contornar uso não-semantizado do Decorativo com marcação `aria-hidden` no feed dos botões.
- [ ] Task 3.3: [Erro 11] Incluir retornos progressivos à engine ("Tarefa Oculta", "Marcado Como Feito") em Live Regions no ato sem ter de mudar página ou interações nativas.
- [ ] Task 3.4: [Erro 15] Reorganizar tamanhos exíguos (< 44px) nos comandos "Avançar" ou "Recuar" do cabeçalho da timeline diária da UI móvel.
- [ ] Task 3.5: [Erro 17] Induzir focos e marcações automáticas de falhas nos Forms limpos de input em branco recuando erros brutos em campos anônimos na edição (focar com id alert).
- [ ] Task 3.6: [Erro 18] Substituir as cores e opacidades inábeis (< 4.5 ratio) aos recados como "Sem pendências Hoje", restaurando Legibilidade estrita.