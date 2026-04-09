# Epic: Correções e Melhorias em Gestão de Lojas (/lojas)

**Description:**
Resolução completa dos 20 problemas de tabelas, contrastes críticos e comportamentos anômalos no painel de lojas.

## Stories & Tasks

### Story 1: Arquitetura de Tabelas e DOM
- [ ] Task 1.1: [Erro 1] Associar corretamente os elementos `<td>` aos seus respectivos headers `<th>` usando `scope="col"` ou `scope="row"`.
- [ ] Task 1.2: [Erro 8] Adicionar uma tag `<caption>` à grande tabela de lojas para descrever seu propósito aos leitores de tela.
- [ ] Task 1.3: [Erro 15] Ajustar o layout para evitar o "pulo" de reflow (Cumulative Layout Shift leve) durante o loading do conteúdo.
- [ ] Task 1.4: [Erro 19] Modificar o container superior do painel para utilizar tamanhos fluidos que se ajustem perfeitamente no redimensionamento mobile.
- [ ] Task 1.5: [Erro 20] Adicionar indicação visual (*affordance*) ao scroll horizontal oculto da tabela em telas menores.

### Story 2: Semântica Interativa e Botões
- [ ] Task 2.1: [Erro 2] Inserir texto ou `aria-label` nos links rápidos por linha (ex: `href="/loja?id=..."`) que contêm apenas SVGs (*Links do not have a discernible name*).
- [ ] Task 2.2: [Erro 7] Adicionar texto descritivo (`aria-label`) nos botões vazios de paginação e filtros.
- [ ] Task 2.3: [Erro 14] Substituir células/divs na tabela que funcionam como botão da loja por componentes que disparem nos teclados Enter/Space.
- [ ] Task 2.4: [Erro 10] Corrigir o "Label Mismatch" do botão lateral de menu de navegação entre o texto visível e o acessível.
- [ ] Task 2.5: [Erro 11] Adicionar estado semântico (`aria-current="page"` ou `aria-pressed="true"`) aos filtros clicados visualmente.
- [ ] Task 2.6: [Erro 13] Ocultar SVGs estritamente decorativos dentro da lista usando `aria-hidden="true"`.
- [ ] Task 2.7: [Erro 18] Implementar `aria-live="polite"` no componente da tabela para anunciar dinamicamente novos resultados filtrados.

### Story 3: UI, Contraste e Fontes Críticas
- [ ] Task 3.1: [Erro 3] Aumentar a fonte e o contraste de `text-[8px] font-black ... text-text-tertiary` para viabilizar leitura.
- [ ] Task 3.2: [Erro 4] Subir o tamanho de fonte das tags `<th>` que estão em 9px ou 10px para o mínimo web aceitável de 12-14px.
- [ ] Task 3.3: [Erro 12] Melhorar o contraste das classes de `text-status-error` (vermelho) contra o fundo das linhas da tabela.

### Story 4: Forms, Redes e Concorrência de Estado
- [ ] Task 4.1: [Erro 5] Corrigir a multiplicação de logs de renderização `DEBUG: Stores from useStores: 12 [array Array]`.
- [ ] Task 4.2: [Erro 6] Diagnosticar e resolver falha de rede 404 (Not Found) silenciosa ao carregar recursos da listagem.
- [ ] Task 4.3: [Erro 16] Solucionar erro `GoTrueClient` duplicado nesta rota refatorando a inicialização do Auth.
- [ ] Task 4.4: [Erro 9] Inserir atributos `id` aos formulários de busca da tabela para resolver a issue de console correspondente.
- [ ] Task 4.5: [Erro 17] Criar uma `<label for="...">` vinculada e pareada ao ID no campo "órfão" de busca de loja.