# Epic: Correções e Melhorias no Painel Inicial (/painel)

**Description:**
Resolução de todos os 20 problemas estruturais, de acessibilidade e de performance identificados na auditoria do painel inicial.

## Stories & Tasks

### Story 1: Performance e Instabilidade de Rede/Auth
- [ ] Task 1.1: [Erro 1] Corrigir `Multiple GoTrueClient instances detected` resolvendo múltiplas instâncias concorrentes do cliente Supabase/Auth.
- [ ] Task 1.2: [Erro 2] Remover o vazamento excessivo de logs de debug no console (`[log] Audit Info [ProtectedRoute]`).
- [ ] Task 1.3: [Erro 16] Investigar e resolver o erro `404 Not Found` silencioso ao tentar carregar assets ou manifestos em background.

### Story 2: Estrutura HTML5 e Landmarks
- [ ] Task 2.1: [Erro 15] Envolver a área principal do dashboard dentro de uma tag landmark `<main>`.
- [ ] Task 2.2: [Erro 8] Unificar e corrigir as múltiplas tags `<h1>` da visualização para respeitar a regra de hierarquia única.
- [ ] Task 2.3: [Erro 11] Ajustar pulos lógicos nos níveis de headings (passando de `h1` direto para `h3` em "PERFORMANCE ESTRATÉGICA").
- [ ] Task 2.4: [Erro 20] Condicionar a renderização de Headings (`h2`/`h3`) garantindo que não exibam tags vazias antes do carregamento da API.

### Story 3: Acessibilidade de Navegação e Foco
- [ ] Task 3.1: [Erro 5] Substituir links âncora (`<a>`) vazios ou com `href="#"` usados como botões por tags `<button>` nativas.
- [ ] Task 3.2: [Erro 6] Adicionar `role="button"` e `tabindex="0"` a `divs` e `spans` clicáveis (com `onClick`) sem acessibilidade de teclado.
- [ ] Task 3.3: [Erro 14] Adicionar contorno visível (`outline`) aos elementos interativos para quem navega via tecla `Tab`.
- [ ] Task 3.4: [Erro 19] Remover propriedades `tabindex` maiores que 0, que forçam uma ordem de tabulação não natural.
- [ ] Task 3.5: [Erro 13] Remover redundância de navegação onde links idênticos adjacentes apontam para o mesmo destino.

### Story 4: Formulários, Rótulos e Semântica ARIA
- [ ] Task 4.1: [Erro 3] Adicionar texto discernível ou `aria-label` apropriado aos botões de ação do menu lateral e do topo.
- [ ] Task 4.2: [Erro 4] Resolver o conflito do DOM onde os botões "Abrir notificações" e "Abrir perfil" possuem nome acessível divergente do visual.
- [ ] Task 4.3: [Erro 7] Garantir atributos `id` ou `name` válidos em campos de busca/filtros (`[issue] A form field element should have an id or name attribute`).
- [ ] Task 4.4: [Erro 17] Adicionar uma tag `<label>` real ao input "Localizar unidade..." além do mero placeholder.
- [ ] Task 4.5: [Erro 9] Adicionar o atributo `alt` (mesmo que `alt=""` para itens decorativos) nas imagens e avatares.
- [ ] Task 4.6: [Erro 12] Adicionar `aria-hidden="true"` a ícones SVG soltos na UI para evitar ruído aos leitores de tela.

### Story 5: Contraste Visual e SEO
- [ ] Task 5.1: [Erro 10] Aumentar a relação de contraste de textos secundários (ex: `text-gray-400` em fundos claros) para atender o padrão WCAG.
- [ ] Task 5.2: [Erro 18] Corrigir ou providenciar um `robots.txt` válido, atualmente retornado como inválido/ausente no servidor local.