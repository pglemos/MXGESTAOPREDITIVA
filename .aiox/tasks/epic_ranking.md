# Epic: Correções e Melhorias no Ranking (/ranking)

**Description:**
Restaurar as fundações de acessibilidade, listagens de pontuações, performance visual pesada e uso incorreto das marcações de ranking em prol do suporte total.

## Stories & Tasks

### Story 1: Soluções Estruturais da Tela e Auth Network
- [ ] Task 1.1: [Erro 1] Exterminar conexões redundantes com 10+ ocorrências de loops no Redirecionamento Supabase durante a montagem.
- [ ] Task 1.2: [Erro 2] Encapsular as molduras do painel e as abas do layout principal em tag `<main>`.
- [ ] Task 1.3: [Erro 5] Modificar lógicas de Animações CSS obstrutivas bloqueando render no FCP.
- [ ] Task 1.4: [Erro 12] Substituir ou intervir na tag visual de Título global do projeto passando a propriedade dinâmica ao carregar "Ranking Atual".
- [ ] Task 1.5: [Erro 15] Trabalhar na Memoização correta sobre os array iterados para prevenir a lentidão no Time to Interactive (TTI) num reorder de 100+ vendedores.
- [ ] Task 1.6: [Erro 19] Corrigir erros de Fetch disfarçados pelos redirecionamentos silenciosos sem feedback amigável no DOM ("No profile found").

### Story 2: Acessibilidade em Listas Numéricas e Filtros
- [ ] Task 2.1: [Erro 7] Corrigir as falsas disposições de "Rankings", formatando as disposições flex em Listas Ordenadas de Fato (`<ol>` com itens `<li>`).
- [ ] Task 2.2: [Erro 4] Retificar alinhamentos na arquitetura DOM Tree flexível que confundem vozes SR em relação às leituras (Horizontal x Vertical) sem tabelas reais.
- [ ] Task 2.3: [Erro 3] Fornecer Atributo A11y Alternativo (`Alt` textual) descritivo e claro para medalhas de troféus e avatares (Top 3).
- [ ] Task 2.4: [Erro 10] Fornecer as marcações exclusivas `<label for="...">` às buscas do seletor superior de "Filtro de Loja".
- [ ] Task 2.5: [Erro 8] Adicionar Labels sonoras na divisão do ranking por data (Mensal, Semanal, Anual) que operam em inputs sem tabgroup e role group.
- [ ] Task 2.6: [Erro 9] Sinalizar o botão ativado visualmente nos toggles superiores usando `aria-pressed="true"`.
- [ ] Task 2.7: [Erro 14] Definir retorno dinâmico de Focus programático avisando a alteração pesada no array de Ranking pós Renderização.

### Story 3: Elementos Visuais Críticos, Troféus e Index
- [ ] Task 3.1: [Erro 6] Retrabalhar propriedades WCAG textuais (`text-gray-400`) não legíveis identificando a Posicionamento / Ordinal do Rank (ex: `#12`).
- [ ] Task 3.2: [Erro 11] Substituir layouts Tailwinds fixos na marcação do pódio prejudicando transições futuras pro Dark Mode.
- [ ] Task 3.3: [Erro 13] Remover interações danosas manipuladas diretamente com Tab Index (`tabindex > 0`).
- [ ] Task 3.4: [Erro 16] Cuidar do acúmulo desmedido de ícones decorativos sem proteção `aria-hidden`.
- [ ] Task 3.5: [Erro 17] Descrever verbalmente as intenções visuais de setas dependentes ("Subiu/Caiu" de Posição) com os textos escondidos `.sr-only`.
- [ ] Task 3.6: [Erro 18] Incorporar salto lógico (Skip Link Content) que favoreça navegar no Ranking isolando o topo maciço e menu fixo do app.
- [ ] Task 3.7: [Erro 20] Modificar caixas emuladas em click sem área táctil de `44x44px` usadas na abertura de Painel de Performance dos usuários da tabela.