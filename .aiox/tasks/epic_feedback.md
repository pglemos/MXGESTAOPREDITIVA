# Epic: Correções e Melhorias no Feedback Engine (/feedback)

**Description:**
Resolver defeitos graves de ordem visual, falha em modais, lógicas destrutivas perigosas sem fallbacks e reconstruir os campos "mudos".

## Stories & Tasks

### Story 1: Semântica em Listas Virtuais e Inputs Não Resolvidos
- [ ] Task 1.1: Readequar o feed/tabela histórico de feedback para se portar num wrapper nativo de listas (`<ul role="list">`).
- [ ] Task 1.2: Vincular o `<textarea>` cego do input a uma `<label for="feedback_message">` devida e evitar envios monstruosos com maxLength.
- [ ] Task 1.3: Conectar a tag base `<main>` central.
- [ ] Task 1.4: Refatorar o dropdown de Tipos de Feedback com os descritivos `aria-selected` para que o dev visual sinta mudança real nas opções.
- [ ] Task 1.5: Resolver colisão de `ID` na caixa combinada (Combobox) "Selecione o Vendedor" (`form-field-multiple-labels`).

### Story 2: Modais, Interações Críticas e Ações Invertidas
- [ ] Task 2.1: Reestruturar visualmente e via teclado as lógicas do layout (ex. retirar a anarquia do `flex-col-reverse`) para igualar o tab index visual.
- [ ] Task 2.2: Adicionar um Alert Dialog interativo antes de ações destrutivas (ex. Deletar Feedback ou Invalidar), com role "dialog" apropriada, ao invés do `window.confirm()`.
- [ ] Task 2.3: Interligar botão Submit (`e.preventDefault()`) ao forms semântico com validação.
- [ ] Task 2.4: Fazer o gerenciamento do Modal ("Ver Detalhes do Feedback Longo") redirecionando o Foco de volta à caixa de ativação no fechamento.
- [ ] Task 2.5: Sanar a ilegibilidade das labels base com timestamps ("Há 2 dias") para WCAG ratio (sair do cinza 10px).

### Story 3: Performance, Console Fixes e Z-Indexes
- [ ] Task 3.1: Intervir na montagem de repetição pesada de instâncias `GoTrueClient` e redirects.
- [ ] Task 3.2: Consertar Scroll de fundo que trava os sub-menus ao trás do formulário de feedback devido à altura (`z-index` bug) no viewport menor.
- [ ] Task 3.3: Excluir excesso de CSS text-transform: uppercase em campos muito longos que prejudicam IA ou Disléxicos.
- [ ] Task 3.4: Suprimir centenas de SVGs puramente ilustrativos sem a propriedade `aria-hidden="true"`.
- [ ] Task 3.5: Aplicar Skip Link para o painel de formulário pulando o histórico de quem não quer re-escutar a tabela antiga ao recarregar a tela.