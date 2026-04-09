# Epic: Correções e Melhorias no Dashboard Individual de Loja (/loja?id=...)

**Description:**
Solucionar loops na leitura de dependências de rotas que travam as instâncias Supabase, injetar atributos fundamentais da UI e assegurar o controle correto de modais e selects.

## Stories & Tasks

### Story 1: Soluções de Instância Supabase e Montagem
- [ ] Task 1.1: Eliminar o erro Crítico de `Multiple GoTrueClient instances` consertando dependência de Hooks na captura de `URLParams` da loja.
- [ ] Task 1.2: Envelopar todo o dashboard da loja com o HTML `main`.
- [ ] Task 1.3: Conectar a tag `H1` ausente (`<h1Count: 0>`), quebrando a estrutura de Título descritivo primário.
- [ ] Task 1.4: Definir `aria-live="assertive"` para loaders e spinners que não comunicam quando uma grande massa de dados da loja terminou de carregar.
- [ ] Task 1.5: Intervir no título da aba do Browser para carregar o "Nome da Loja Selecionada".

### Story 2: Semântica em Cards, Navegação e Entradas
- [ ] Task 2.1: Prender Filtros de Busca Avançada (`Dropdowns`/Modais) com Focus Trap nativo ao abrir parâmetros de pesquisa.
- [ ] Task 2.2: Remediar a seta de `Voltar` e incluir `aria-label="Voltar para todas as lojas"` nos Ícones cegos de header.
- [ ] Task 2.3: Configurar os cartões rápidos e KPIs com Títulos escondidos/labels para dar contexto extra às dezenas (`aria-labelledby`).
- [ ] Task 2.4: Providenciar IDs explícitas para inputs de filtro soltos na tela.
- [ ] Task 2.5: Impor travas de HTML nos seletores de Data `min`/`max` e impedir lógicas que invalidem o fetch no banco.

### Story 3: Acessibilidade Profunda (Textos e Tabelas)
- [ ] Task 3.1: Ampliar a legibilidade base alterando de `<span class="text-[10px] text-text-tertiary">` para adequação na WCAG.
- [ ] Task 3.2: Reformatar divs que servem de links nos nomes de vendedores para operarem via "Enter".
- [ ] Task 3.3: Adicionar a tag `<p role="alert">` em cenários "Em branco/Empty state" onde a Loja não possua dados ou vendas a exibir, quebrando o silêncio.
- [ ] Task 3.4: Suprimir leitura SR de SVGs e flechas puramente ilustrativas com `aria-hidden="true"`.
- [ ] Task 3.5: Tratar tabelas de histórico longas de loja que forçam Scroll Oculto com CSS nativo e contorno.
- [ ] Task 3.6: Definir labels e mecânicas A11y sobre uma Paginação se uma loja tiver centenas de funcionários.