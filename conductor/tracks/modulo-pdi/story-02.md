# Story 02: Interface do PDI - O Fluxo Perfeito de 45 Minutos (Manager Cockpit)

## Descrição
Criar a interface onde o Gerente Comercial conduz a sessão. O design deve ser um assistente "step-by-step" que guia a pauta da MX rigorosamente, sem permitir que o gestor fuja do método ou esqueça das perguntas certas.

## Critérios de Aceite

1. **Step 1: Cabeçalho & Metas (Pauta: 7 Minutos):**
   *   Header com a frase inspiracional randômica (Ex: "Todo bom desempenho começa com objetivos claros.").
   *   Formulário de Metas: 3 colunas (6, 12 e 24 meses). Cada coluna possui 3 slots. Validação em tempo real garantindo a marcação se a meta é Pessoal ou Profissional (obrigando pelo menos 1 de cada por prazo).

2. **Step 2: Mapeamento de Competências (Pauta: 10 Minutos):**
   *   Lista dividida em Técnicas (10) e Comportamentais (8).
   *   Embaixo de cada competência, **exibir o texto exato da descrição e do indicador** (buscados do banco).
   *   Slider ou botões de seleção de nota restritos à faixa do cargo (Ex: Se o cargo for Vendedor, a régua vai de 6 a 10. Se for Gerente, 11 a 15). Avaliação deve informar o descritivo de escala ("Demonstra na maioria das vezes", "Atingiu plenamente", etc).

3. **Step 3: Mapa de Competências (Radar) e Análise de Lacunas:**
   *   Ao finalizar as notas, a tela renderiza o gráfico de Radar idêntico ao da planilha (Notas vs Alvo).
   *   O sistema deve dar um *Highlight* (destaque visual) automático nas 5 competências com as menores notas.

4. **Step 4: Plano de Ação (Pauta: 11 Minutos):**
   *   Painel onde o gerente cadastra **5 ações de desenvolvimento**.
   *   Ao selecionar a competência que precisa de melhoria, um dropdown exibe as "Ações Recomendadas" (ex: "Assistir módulo 6...", "Desabilitar botão soneca", "Preencher 20 avaliações de carro"). O gerente pode clicar para preencher automaticamente ou digitar uma ação customizada.
   *   O formulário da ação exige: Ação, Data Limite, **Impacto** e **Custo** (atributos do Mapa de Competências da planilha).

5. **Finalização e Relatório PDF:**
   *   Botão "Concluir Sessão".
   *   Geração de PDF "Pixel-Perfect", com a mesma identidade visual da Capa PDI, Mapa de Radar e Plano de Ação para impressão imediata. Exibição final em tela da fórmula `$ = QI + DC`.