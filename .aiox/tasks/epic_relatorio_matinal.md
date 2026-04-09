# Epic: Correções e Melhorias em Relatório Matinal (/relatorio-matinal)

**Description:**
Restruturação técnica de uma das visualizações centrais cobrindo todos os 20 bugs pesados apontados na checagem em background, focado em tabelas ineficazes e ausência de leitores gráficos.

## Stories & Tasks

### Story 1: Carregamento do Painel, Eventos e Landmarks
- [ ] Task 1.1: [Erro 1] Investigar renderizações mudas no relatório engolidas por um erro tardio de React ou problemas com NetworkIdle falso antes dos renders.
- [ ] Task 1.2: [Erro 2] Instanciar todo o core visual do relatório matriz no envelope acessível da tag `<main>`.
- [ ] Task 1.3: [Erro 14] Otimizar e refatorar loops e processamentos de front-end assíncronos que barram ou prejudicam agressivamente a INP (Interaction to Next Paint).
- [ ] Task 1.4: [Erro 13] Vincular title dinâmico à janela Web/Documento HTML sinalizando à pessoa visual qual contexto real em "Relatório Matinal".

### Story 2: Matrizes Complexas e Falhas de Acessibilidade
- [ ] Task 2.1: [Erro 8] Ajustar escopos (`scope="row/col"`) de tabelas de dados maciças que quebram o entendimento das colunas matrizadas para leitor de SR.
- [ ] Task 2.2: [Erro 5] Envelopar componentes visuais densos/gráficos (ex: Recharts) ou criar resumos de apoio usando `<table class="sr-only">`.
- [ ] Task 2.3: [Erro 7] Incluir seções explícitas e um descritivo sumarizado que relacione e ajude quem não interage com os visuais de BI na parte de cima.
- [ ] Task 2.4: [Erro 9] Remover o exclusivismo de "Tooltips ativados em Hover de mouse" nas planilhas BI que não admitem foco com aba Tab.
- [ ] Task 2.5: [Erro 11] Proibir ids reusadas/clonadas geradas em cada linha das Vendas que compartilham a classe base de Tooltip.
- [ ] Task 2.6: [Erro 15] Gerenciar updates de Live regions quando blocos do Supabase montarem de forma progressiva dados das vendas matinais.

### Story 3: Erros UI/UX Críticos, Forms e Fontes
- [ ] Task 3.1: [Erro 3] Fixar o erro `form-field-multiple-labels` por conta da colisão de seleções temporais e de exportação de dados na barra de menus.
- [ ] Task 3.2: [Erro 4] Refazer e consertar o flow lógico de Heading que atira níveis perdidos (`h1` e depois direto para `h3`).
- [ ] Task 3.3: [Erro 6] Incluir indicação text-to-speech complementar (.sr-only) para suportar sinais verdes/vermelhos que medem falha em Metas do BI.
- [ ] Task 3.4: [Erro 10] Aumentar a escala de legibilidade global removendo `<span class="text-[9px]">` impeditivos na tela do dashboard.
- [ ] Task 3.5: [Erro 12] Tratar comandos brutos "Exportar, Imprimir, Compartilhar" construídos com `divs`, modificando-os a tags de `<button>`.
- [ ] Task 3.6: [Erro 16] Extinguir do leitor visual representações redundantes de SVG e gráficos fixos puros sem marca `aria-hidden`.
- [ ] Task 3.7: [Erro 17] Formatar expansões no relatório sobre o controle do status modal seguro (`role="alertdialog"`).
- [ ] Task 3.8: [Erro 18] Incorporar loader silencioso ou texto com aria-live aos spins imperceptíveis do recurso "Baixar arquivo" PDF/XLS.
- [ ] Task 3.9: [Erro 19] Conter os overflows horizontais acidentais estourando as margens 100vw com lógicas flexbox "row" danificadas em Mobile.
- [ ] Task 3.10: [Erro 20] Solucionar encadeamento agressivo de regras Tailwind com overrides (`!important`) que empacam manutenções de CSS na exibição.