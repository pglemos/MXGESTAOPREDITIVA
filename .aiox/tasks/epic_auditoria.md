# Epic: Correções e Melhorias em Auditoria (/auditoria)

**Description:**
Restaurar as fundações estruturais (`<main>`), combater as falhas repetidas de timeout e auth, readequar a árvore HTML de tabelas de log massivas.

## Stories & Tasks

### Story 1: Soluções Críticas de Estrutura e Auth (Landmark & Router)
- [ ] Task 1.1: Envolver o grid principal e as seções da tabela de log em tag de landmark `<main>`.
- [ ] Task 1.2: Remediar a condição de concorrência (`Race Condition`) de `Multiple GoTrueClient instances` gerando erros críticos em produção na auditoria.
- [ ] Task 1.3: Conectar a tag `H1` do topo de forma hierárquica corrigindo pulos para H4 no render do detalhamento dos logs.
- [ ] Task 1.4: Mitigar travamentos de Initial Paint providenciando um Fallback se a Rota Falhar na resposta do Banco.

### Story 2: Semântica em Tabela Massiva e Inputs
- [ ] Task 2.1: Envelopar grandes colunas e linhas da malha de logs com propriedades `scope="col"` e `scope="row"` nas tags `th`.
- [ ] Task 2.2: Adicionar uma tag `<caption>` narrando ou sumarizando o objetivo da tabela do Log de Auditoria.
- [ ] Task 2.3: Anexar rótulos ID a campos visuais ou seletores de período da tabela. Evitando IDs reciclados (`form-field-multiple-labels`).
- [ ] Task 2.4: Suprir `aria-label` e descritivos para botões da "Paginação" de logs e ícones Chevron.

### Story 3: Design Systems, SVG e Modal Focus
- [ ] Task 3.1: Ampliar a legibilidade base e remover a dependência contínua nas tags `.text-[10px]` para status na tabela, subindo ao padrão.
- [ ] Task 3.2: Assegurar o bloqueio interativo de Foco de teclado no Modal (`Focus Trap`) ao clicar sobre os detalhes JSON de um registro de auditoria, garantindo a classe `aria-modal="true"`.
- [ ] Task 3.3: Excluir tooltips criados só com hover ou pseudo-eventos `onClick` sobre divs e criar `<button>` nativo na linha para inspecionar os detalhes.
- [ ] Task 3.4: Definir `aria-hidden="true"` nos ícones de Ação/Status ou usar textos explícitos de SR sobre status de "Revertido" ou "Válido".
- [ ] Task 3.5: Tratar o Overflow Horizontal na visualização para as larguras reduzidas e prover um "Baixar Auditoria CSV/PDF" devidamente rotulado.