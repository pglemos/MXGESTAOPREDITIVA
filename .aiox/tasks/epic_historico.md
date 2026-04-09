# Epic: Correções e Melhorias no Histórico (/historico)

**Description:**
Restaurar completamente a estabilidade do fluxo de auditoria/histórico, englobando as 20 falhas arquiteturais desde o DOM da grid até os erros contínuos do Supabase reportados.

## Stories & Tasks

### Story 1: Loops Críticos e Problemas DOM / Landmark
- [ ] Task 1.1: [Erro 1] Curar os múltiplos Warnings e timeouts de Network reset gerados num Race Condition do Auth Cliente que prejudicam a TTI.
- [ ] Task 1.2: [Erro 2] Instanciar todo o quadro principal das listas históricas no Landmark `<main>`.
- [ ] Task 1.3: [Erro 10] Ajustar lógicas redundantes nas chaves virtuais da árvore React (`key={...}`) que promovem recarregamentos agressivos das rows.
- [ ] Task 1.4: [Erro 14] Definir uma ramificação segura de Headings introduzindo h2/h3 antes da tabela secundária.
- [ ] Task 1.5: [Erro 18] Conectar lógica Cleanup ou AbortController Hooks para previnir travamentos de memória se a query assíncrona for cancelada ao sair da rota.
- [ ] Task 1.6: [Erro 19] Formatar esqueletos Loading UI apropriados abolindo congelamentos de interfaces sem render inicial.

### Story 2: Interações e Semânticas Temporais
- [ ] Task 2.1: [Erro 4] Configurar a atribuição A11y exigida (`th scope="col"`) nos grids estruturais da matriz do relatório Histórico.
- [ ] Task 2.2: [Erro 5] Ajustar formatações de data isolada usando `<time datetime="YYYY-MM-DD">` compatível para software assistencial.
- [ ] Task 2.3: [Erro 6] Preencher rótulos dinâmicos ID com seus respectivos inputs em form de Filtragem temporal / filtro de histórico.
- [ ] Task 2.4: [Erro 7] Restaurar funcionalidades base dos `Datepickers` alterados e grid A11y que não suportem tabuladores via teclado.
- [ ] Task 2.5: [Erro 8] Habilitar componentes de Aria-Live comunicando o reflow dos updates da tela na ativação de novos logs.
- [ ] Task 2.6: [Erro 3] Acoplar a navegação em logs através do modelo `<nav aria-label="Paginação">`.

### Story 3: Layouts, Botões Secundários e Textos
- [ ] Task 3.1: [Erro 11] Prover um padrão de legibilidade coerente substituindo rótulos finos `text-[10px]` na sinalização de status de auditoria.
- [ ] Task 3.2: [Erro 9] Neutralizar as representações puras de SVGs (Check/Erro) dos ícones injetando flags `aria-hidden` ou labels A11y adequadas.
- [ ] Task 3.3: [Erro 12] Administrar longos flexbox wrappers em textos não quebráveis com fallbacks nativos evitando cortes forçados não vistos no scroll móvel.
- [ ] Task 3.4: [Erro 13] Segurar e não "vazar" focus states interativos para o plano de fundo (Trap) no carregamento de janelas suspensas (modais) de detalhes de logs.
- [ ] Task 3.5: [Erro 15] Habilitar propriedades e botões genuínos em seletores falsos que engatilham Exportações de PDF, mas se omitem ao foco.
- [ ] Task 3.6: [Erro 16] Corrigir tamanho dos hitboxes e toques menores a `44px`.
- [ ] Task 3.7: [Erro 17] Declarar verbalmente (Sr Only text) no markup os indicativos de bolinhas verde/vermelha como "Log Efetuado" e "Log Falho".
- [ ] Task 3.8: [Erro 20] Mudar links mortos `a href="#"` atuando sem funções ou disparos semânticos.