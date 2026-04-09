# Epic: Correções e Melhorias em Configurações Gerais (/configuracoes)

**Description:**
Cobertura de todos os 20 bugs de UX, formulários ilegais, e contrastes falhos no módulo global de Configurações.

## Stories & Tasks

### Story 1: Semântica e Qualidade Tipográfica (Textos e Headings)
- [ ] Task 1.1: [Erro 1] Substituir o abuso de classes `text-[8px]` e `text-[10px]` para opções operacionais por tamanhos legíveis (12-14px).
- [ ] Task 1.2: [Erro 2] Resolver a quebra de sequência de hierarquia onde um `<h3 class="text-xs...">` é usado só como divisor, reestruturando a lógica `h1 -> h2`.
- [ ] Task 1.3: [Erro 14] Substituir aninhamentos errados de tags `<p>` vazias usadas para espaçamento por propriedades nativas CSS `gap` ou `margin`.
- [ ] Task 1.4: [Erro 19] Corrigir "Layout Repetitivo" em que os nomes descritivos das divs flex não correspondem à ordem aplicada visualmente pelo CSS.

### Story 2: Form Fields, Labels e Estados
- [ ] Task 2.1: [Erro 4] Alterar toggles/chaves construídos com `<div onClick>` para tags nativas `<input type="checkbox">` ou `<button role="switch" aria-checked="true/false">`.
- [ ] Task 2.2: [Erro 6] Suprir o aviso persistente `A form field element should have an id or name attribute` em todos os forms de ajuste.
- [ ] Task 2.3: [Erro 12] Vincular inputs mudos das configurações através de atributos `id` às suas respectivas tags `<label>`.
- [ ] Task 2.4: [Erro 7] Criar um contêiner `aria-live` que anuncie verbalmente o status: "Configurações foram salvas".
- [ ] Task 2.5: [Erro 15] Definir indicativo de estado desabilitado (disabled visual e funcional) aos botões de "Salvar" caso o form não sofra alterações.

### Story 3: UI Controls, Links e Foco
- [ ] Task 3.1: [Erro 5] Adicionar `aria-label` descritivo aos botões cegos de "Voltar" e links internos (`<a class="w-12 h-12...">`) corrigindo "Links do not have a discernible name".
- [ ] Task 3.2: [Erro 10] Ocultar SVGs decorativos de painéis de configuração da A11y Tree via `aria-hidden="true"`.
- [ ] Task 3.3: [Erro 11] Aplicar *Focus Trap* (foco preso) em possíveis modais ou overlays de configuração abertos, impedindo o vazamento do tabulador ao fundo.
- [ ] Task 3.4: [Erro 16] Ajustar elementos com classe `cursor-pointer` para serem funcionalmente focalizáveis (via teclado) e não apenas reativos ao mouse.
- [ ] Task 3.5: [Erro 18] Ajustar os botões do menu lateral para que atinjam no mínimo a área de clique recomendada de 44x44px.

### Story 4: Cores, Auth Loop e Rede
- [ ] Task 4.1: [Erro 3] Reparar a paleta de labels `text-gray-400` que falha ao atingir o índice mínimo WCAG em fundos de container `bg-white`.
- [ ] Task 4.2: [Erro 17] Substituir cores explícitas e hardcoded que escapam das variáveis de sistema limitando implementações futuras de Dark Mode.
- [ ] Task 4.3: [Erro 8] Remover a poluição do loop repetido de `[log] Audit Info [ProtectedRoute]` em console.
- [ ] Task 4.4: [Erro 9] Resolver a instância duplicada de `GoTrueClient` nesta tela refatorando os hooks protetores.
- [ ] Task 4.5: [Erro 13] Criar uma tratativa visual via "ErrorBoundary" para lidar visivelmente com falhas de rede em saves de painel, que hoje só alertam no console.
- [ ] Task 4.6: [Erro 20] Solucionar o fetch cego e erro de rede ao recurso de rota inexistente (`robots.txt`) forçado em chamadas secundárias.