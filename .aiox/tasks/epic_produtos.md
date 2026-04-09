# Epic: Correções e Melhorias nos Produtos Digitais (/produtos)

**Description:**
Solução integral dos 20 problemas de componentes, renderização repetitiva de catálogo, bugs de conexão em massa, e validação semântica profunda da página Produtos.

## Stories & Tasks

### Story 1: Componentes Críticos e Falhas Iniciais
- [ ] Task 1.1: [Erro 1] Lidar com o erro drástico `Failed to fetch SupabaseAuthClient` caindo em reset de conexão no build inicial da Rota.
- [ ] Task 1.2: [Erro 2] Tratar as concorrências assíncronas do protetor de rota acusando seguidos "No profile found".
- [ ] Task 1.3: [Erro 3] Embrulhar o catálogo raiz e detalhes interativos em uma tag genérica de landmark `<main>`.
- [ ] Task 1.4: [Erro 20] Mitigar as falhas diretas e Network 404 (NotFound) caso faltem badges, ícones ou banners de assets do Produto na interface.

### Story 2: Catalogação, Tabela e Acessibilidade (A11y)
- [ ] Task 2.1: [Erro 7] Se houver render de tabela de produtos, preencher obrigatoriamente a descrição com base numa string da tag `<caption>`.
- [ ] Task 2.2: [Erro 6] Prestar indicativos funcionais (`aria-label`) associando formulários e combos visuais de categorização (ex. Select por Tipos).
- [ ] Task 2.3: [Erro 8] Excluir ou silenciar por `aria-hidden="true"` ícones decorativos ou poluição em botões como "Comprar" ou "Ativar/Desativar" produto.
- [ ] Task 2.4: [Erro 12] Atualizar divisões semânticas entre painéis Ativos/Inativos usando propriedades A11y adequadas `role="tablist"` e `role="tab"`.
- [ ] Task 2.5: [Erro 15] Reformar as propriedades `background-image` em previews de Thumbnails passando à tag `<img loading="lazy" alt="desc">` para rastreamento visual seguro.
- [ ] Task 2.6: [Erro 16] Tratar redundância excessiva dos atributos linkando com títulos ("Saiba Mais sobre X" em vez de só "Saiba Mais") na lista corrida.

### Story 3: Interfaces Ativas, Formulários e Contraste
- [ ] Task 3.1: [Erro 4] Suprir o limite WCAG mínimo no contraste da cor em Labels, Descontos, e Badges do produto listados com opacidade.
- [ ] Task 3.2: [Erro 5] Intensificar visibilidade da arquitetura das borders-bottoms ou linhas `<hr>` enfraquecidas que prejudicam separação das fileiras.
- [ ] Task 3.3: [Erro 9] Habilitar o fechamento por eventos simples de Input (ex. a tecla `ESC` fechar o Off-Canvas/Modal do descritivo do Produto).
- [ ] Task 3.4: [Erro 10] Enviar Live-alert ao Screen Reader ou Pop-up nativo solicitando conformidade se o usuário clicar num botão crítico "Excluir Produto".
- [ ] Task 3.5: [Erro 11] Proibir propriedades ilusórias de `cursor-pointer` em blocos inteiros que não ancoram efetivamente num link `<a>` nativo (bloqueando a feature abrir noutra aba).
- [ ] Task 3.6: [Erro 13] Retornar os contornos interativos aos componentes e remover neutralizações forçadas (ex: CSS `outline: none` abusivo).
- [ ] Task 3.7: [Erro 14] Notificar os assistentes A11y sobre repaginações de catálogo com "aria-live".
- [ ] Task 3.8: [Erro 17] Transformar os formatos livres (text values) de Estoque e Compras em tipos estritos como `type="number"`.
- [ ] Task 3.9: [Erro 18] Habilitar link de "Skip Content" que salte atalhos repetitivos do menu indo direto pro container de grade de produtos.
- [ ] Task 3.10: [Erro 19] Refatorar DOM tree obesidade limpando aninhamentos flexbox monstruosos.