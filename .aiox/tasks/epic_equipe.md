# Epic: Correções e Melhorias na Gestão de Equipes (/equipe)

**Description:**
Tratamento aprofundado dos 20 bugs identificados na página Equipe, focando em landmarks ausentes, legibilidade e loops severos de rotas.

## Stories & Tasks

### Story 1: Estrutura HTML Mãe e SEO
- [ ] Task 1.1: [Erro 1] Injetar a tag landmark `<main>` englobando o conteúdo central e grid de equipe para navegação por SR.
- [ ] Task 1.2: [Erro 5] Fornecer contexto à tag única de H1 adicionando subtítulos ou uma tag Title (SEO) dinâmica coerente.
- [ ] Task 1.3: [Erro 4] Prover um `robots.txt` válido para eliminar os warnings crônicos de requisições falhas de crawler da UI.

### Story 2: Componentes da Grid e Acessibilidade (A11y)
- [ ] Task 2.1: [Erro 7] Corrigir elementos que quebram o fluxo do teclado, atribuindo `role="button"` aos links restritos a SVGs e estados focais reais.
- [ ] Task 2.2: [Erro 8] Aplicar navegação semântica via tag `<nav aria-label="Paginação">` nos paginadores da tabela se houver transbordo de membros.
- [ ] Task 2.3: [Erro 10] Acoplar o atributo `aria-hidden="true"` a todas as decorações em SVG da tabela.
- [ ] Task 2.4: [Erro 12] Fixar a ausência de rótulo contextual da lista grid usando um `aria-label="Lista de membros da equipe"`.
- [ ] Task 2.5: [Erro 13] Transformar indicadores puramente cromáticos (classes `text-status-success`/`error`) numa informação tátil incluindo span `.sr-only` ("Status Ativo").
- [ ] Task 2.6: [Erro 14] Transformar cliques cegos do mouse nas linhas `<tr>` ou `<div>` para atrelarem handlers nativos `onKeyDown` de Enter/Space.
- [ ] Task 2.7: [Erro 20] Unificar elementos/botões com múltiplos SVGs sob um único `aria-label` descrevendo o botão por completo.

### Story 3: Formulários Internos e Imagens
- [ ] Task 3.1: [Erro 11] Prover um ID único e rotular perfeitamente a barra visual do mecanismo de busca de vendedor.
- [ ] Task 3.2: [Erro 16] Padronizar inputs de filtro de Select genéricos para comportarem os atributos HTML `name/id` exigidos pelo W3C.
- [ ] Task 3.3: [Erro 18] Criar suporte de *fallback state* se a URL da foto do avatar de equipe cair ou não carregar (`onError`), substituindo pelo nome ou placeholder sem quebrar layout.

### Story 4: UX Visual, Responsividade e Contrastes Críticos
- [ ] Task 4.1: [Erro 2] Reformular o texto das labels miúdas (`text-[10px] text-gray-400 uppercase`) para solucionar a quebra de acessibilidade em contraste WCAG contra brancos.
- [ ] Task 4.2: [Erro 6] Parar o uso contínuo de fontes muito pequenas (inferiores a 12px) na exibição em grids pesados para desktop.
- [ ] Task 4.3: [Erro 9] Remover dependência de espaçadores baseados apenas em `gap` com paddings engessados que inviabilizam os touch-targets em formato Mobile.
- [ ] Task 4.4: [Erro 17] Substituir cor hardcoded do CSS no Tailwind para suportar as transições de Dark/Light mode corretamente.
- [ ] Task 4.5: [Erro 19] Modificar as classes primárias de cor em textos (`brand-primary`/azul fraco) para garantir rating 4.5:1 de contraste visual.

### Story 5: Auth Loop e Performance TTI
- [ ] Task 5.1: [Erro 3] Consertar a Race Condition que dispara múltiplas verificações protetoras de rota simultâneas (`Audit Warn [ProtectedRoute]: No profile found`).
- [ ] Task 5.2: [Erro 15] Otimizar excesso de re-draws e loops dos React Hooks na montagem da tela que atrasam o TTI (Time to Interactive).