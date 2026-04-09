# Epic: Correções e Melhorias no Painel de Metas (/metas)

**Description:**
Restabelecer matrizes e manipulação de fluxos contábeis do Administrador num escopo que previne travamentos dom, tabelas acessíveis, valores explícitos, feedbacks visuais de auto-salvamento na grade.

## Stories & Tasks

### Story 1: Renderização de Grade e Estruturação Massiva
- [ ] Task 1.1: [Erro 1] Preencher os erros mascarados por inatividade das queries ("Silêncio Perigoso") que não executam adequadamente o loop Supabase nas promessas.
- [ ] Task 1.2: [Erro 2] Instanciar todo o body das metas administradas numa ancoragem Landmark `<main>`.
- [ ] Task 1.3: [Erro 11] Proteger as árvores React de loops de performance pesada e dezenas de nós virtuais não-paginados usando virtualização estrita num grid extenso.
- [ ] Task 1.4: [Erro 5] Ater as grades estruturais base aos parâmetros tabulares vitais referenciando Cabeçalho e Linha (`<th scope="col" e scope="row">`).
- [ ] Task 1.5: [Erro 10] Remover chaves DOM repetidas pelo looper de input da tabela massiva, estacando erro `form-field-multiple-labels`.
- [ ] Task 1.6: [Erro 19] Sinalizar invalidação raiz A11y caso sintonias do footer de "Soma Totais" divirjam de metas primárias do head com `aria-invalid="true"`.

### Story 2: Controles de Input Decimal, Lote e Interatividade Tabulada
- [ ] Task 2.1: [Erro 3] Reverter máscaras cegas em content-editable de edição in-line, habilitando wrappers e tratamentos nativos input para leitor.
- [ ] Task 2.2: [Erro 8] Fornecer rótulos ARIA e avisos sublinhando se aquele box manipula porcentagens ou Moedas (R$).
- [ ] Task 2.3: [Erro 14] Definir área alvo controlada por botões mestres do lote de Gestão de Meta ("Atribuir a todos", "Zerar") injetando controle e semântica `aria-controls`.
- [ ] Task 2.4: [Erro 18] Substituir Drop-down de seletores customizados e perdidos via navegação focada aos moldes acessíveis originais `combobox` nativo.
- [ ] Task 2.5: [Erro 17] Agrupar os tabs (Vendas x Serviços) aprimorados via modelo `role="tabpanel"` e comportamentos Tablist corretos.

### Story 3: UI Feedback, Teclado e Elementos Visuais Tácteis
- [ ] Task 3.1: [Erro 4] Eliminar pular intencionalmente campos de input injetando Tabindex falhos ou positivos (ordem forçada que quebra leitura orgânica das grades).
- [ ] Task 3.2: [Erro 6] Prestar visibilidade em Projeções Críticas com esquemas de cores contrastadas em base lavada que fere os indicadores estritos do ratio AA.
- [ ] Task 3.3: [Erro 7] Anunciar com audível/Aria-Live quando modificadores inline auto-gravam promessas ("Meta atualizada") numa linha preenchida sem aviso.
- [ ] Task 3.4: [Erro 9] Induzir estados "aria-pressed=true" acentuados visualmente em comutadores do formato "Ativar / Encerrar Modo de Edição Lápis".
- [ ] Task 3.5: [Erro 12] Retirar falsos inputs visuais sem descrevê-los da matriz com "aria-hidden=true" nas marcações de SVG puros na celula.
- [ ] Task 3.6: [Erro 13] Retornar fluxos KeyDown Arrow Up / Down na Tabela de Lote de Excel, agilizando acesso via seta não exigindo centenas de tabs.
- [ ] Task 3.7: [Erro 15] Abstrair lógicas exclusivas em Cores na variação das bolinhas de meta de Grid e usar rótulos textuais ocultos A11y "Meta Atingida/Meta Estourada".
- [ ] Task 3.8: [Erro 16] Remover usos falsos em blocos inativos formatados na sintaxe vazia `"a href='#'"`.
- [ ] Task 3.9: [Erro 20] Solucionar quebras de container horizontais móveis no overflow do Viewport de Mobile que destroem o Eixo visual primário.