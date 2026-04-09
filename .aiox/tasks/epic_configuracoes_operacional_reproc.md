# Epic: Correções e Melhorias no Setor de Configurações Administrativas (/configuracoes/operacional & /reprocessamento)

**Description:**
Restaurar falhas de estrutura semântica grave de UX em formulários complexos globais do operacional e gatilhos longos de administração de reprocessamento em lote (20 falhas da sub-rota identificadas conjuntamente).

## Stories & Tasks

### Story 1: Soluções LCP, Autenticação e Landmark HTML (Roteador e Base)
- [ ] Task 1.1: [Erro 1] Curar e mitigar Warning massivo e loop de `Audit Warn [ProtectedRoute]` persistente consumindo dados da TTI na rota de validação da config.
- [ ] Task 1.2: [Erro 2] Instanciar e readequar a falta crônica de `Landmark <main>` sobre as sub-rotas globais de Painel.
- [ ] Task 1.3: [Erro 5] Restaurar falhas dos títulos `h1 -> h2` em cabeçalhos da página convertidos falsamente para a classe genérica uppercase dos rótulos de layout do Tailwind.
- [ ] Task 1.4: [Erro 20] Prover Placeholder robusto dos dados que carregam em Delay na promisse da Tabela, curando Layout Shift nos gatilhos reprocessados do form.

### Story 2: Forms Globais, Semântica de Toggles e Identificadores (Input & Tab)
- [ ] Task 2.1: [Erro 3] Subdividir botões visuais Switch do Tailwind puros por roles nativas tipo `button role="switch" aria-checked="true/false"`.
- [ ] Task 2.2: [Erro 6] Preencher formulários em lote longos sem contexto de limites numa amarração via `<fieldset e legend>`.
- [ ] Task 2.3: [Erro 7] Corrigir IDs genéricos quebrando Labels (`form-field-multiple-labels`) que geram repetição de referências dinâmicas perdendo o `for` descritivo.
- [ ] Task 2.4: [Erro 9] Desfazer supressões explícitas aos comandos focados (`tabindex="-1"`) ocultando componentes cruciais do envio ao servidor baseados na ausência dos "Enters".
- [ ] Task 2.5: [Erro 13] Recuperar Selects da árvore DOM convertidos em React customizados perigosos que apagam a tag pai/label visível dos SR via varreduras tabulares.
- [ ] Task 2.6: [Erro 14] Reformular estrutura e flow natural das Divs flex que puxam Tab-indexes do topo da "Operacional" erradamente direto pro rodapé da Tela de Reprocessamento ao navegar de Setas/Tab.
- [ ] Task 2.7: [Erro 17] Conectar `outputs` em Inputs tipo "Range" exibindo verbalmente quantos % mudaram no preenchimento interativo não só visual.

### Story 3: UI Feedback Crítico, Erros de Salvamento e Contraste Fontes
- [ ] Task 3.1: [Erro 4] Expandir a legibilidade das Fontes com base em classes proibidas (Inferior a 12px opacidade baixa) utilizadas ao ditar as normas restritivas na UI.
- [ ] Task 3.2: [Erro 8] Injetar componentes ou Alertas de tela Modal-dialog amigável à renderização progressiva dos botões de Robô de Processamento longo sem sumários falsos (alert).
- [ ] Task 3.3: [Erro 10] Fornecer avisos assertivos de feedback aos formulários defeituosos se os parâmetros limites excederem Ranges nos configs da matriz.
- [ ] Task 3.4: [Erro 11] Interromper design fixado base `gray-50` em background brancos suprimindo e bloqueando suporte futuro em Dark Mode por contrastes baixos.
- [ ] Task 3.5: [Erro 12] Desativar o rastreio cego do ARIA injetando `aria-hidden="true"` à poeira SVG visual exposta aos form elements.
- [ ] Task 3.6: [Erro 15] Reparar `aria-label` corrompidos no Hover da interface ou falsos SVGs atuando como âncoras/Ação sem rótulo.
- [ ] Task 3.7: [Erro 16] Remover ativação Exclusiva de hover nos tooltips secundários "Help" de reprocessamento de parâmetros forçando uso via Tab também na marca da "?" iconizada.
- [ ] Task 3.8: [Erro 18] Assegurar a perda Acidental englobando Warning nativo (BeforeUnload Window) se a pessoa editar 10 parâmetros difíceis e sair da página esquecendo o Commit dos dados globais na config.
- [ ] Task 3.9: [Erro 19] Refazer âncoras compridas perdidas ou invisíveis sem contraste WCAG em menus esquerdos compridos (submenu) ou Links num bloco longo.