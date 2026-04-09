# Plano de Correção da Responsividade e Visibilidade do Dashboard

O problema relatado (apenas 3 lojas visíveis no notebook e nenhuma no celular) deve-se a restrições de altura fixa (`h-full`, `h-screen`) combinadas com `overflow-hidden` tanto no layout global quanto no componente do painel. Isso "trava" a tela e impede a rolagem para ver o restante do conteúdo.

## Objetivos
1.  Eliminar o truncamento de conteúdo no notebook, permitindo a rolagem vertical completa da página.
2.  Garantir que a tabela de lojas e os cards de métricas apareçam corretamente no celular.
3.  Manter a sidebar original intacta.

## Alterações Propostas

### 1. Ajuste no Layout Global (`src/components/Layout.tsx`)
-   Alterar o contêiner do `<main>` (onde fica o `Outlet`) para permitir que o conteúdo transborde e seja rolável.
-   Remover `h-full` e `overflow-hidden` que estão forçando o conteúdo a ficar preso na altura da janela.

### 2. Ajuste no Painel Consultor (`src/pages/PainelConsultor.tsx`)
-   **Contêiner Principal:** Remover `h-full` e `overflow-y-auto`. Ao deixar o contêiner crescer naturalmente, ele usará a barra de rolagem do layout pai ou do navegador, o que é mais robusto em mobile.
-   **Card de Performance Estratégica:** Remover `flex-1` e `overflow-hidden`. Estas classes forçam o card a ocupar apenas o espaço restante da tela, escondendo as linhas da tabela que ultrapassam esse limite.
-   **Grid de Métricas:** Ajustar o espaçamento (`gap`) para ser menor em telas pequenas, evitando que os cards empurrem a tabela para fora da visualização inicial.

## Verificação Visual Obrigatória
- Capturar print em Desktop (1440px width).
- Capturar print em Mobile (375px width).
- Validar se todas as lojas são acessíveis.
