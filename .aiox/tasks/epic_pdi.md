# Epic: Correções e Melhorias no Plano de Desenvolvimento Individual (/pdi)

**Description:**
Restabelecer o LCP que quebrou no teste, refatorar grupos de Radio-buttons ilegais, fornecer focus-managements justos em erros e travar envios perdidos.

## Stories & Tasks

### Story 1: Concorrência e Formulários Múltiplos (Race Condition & Form Fixes)
- [ ] Task 1.1: Tratar falhas Críticas de Redirecionamento e timeouts (Supabase `No profile found`) no protetor da rota e estabilizar Time to Interactive.
- [ ] Task 1.2: Intervir no erro sistêmico de `form-field-multiple-labels` mudando a mecânica de geração de chaves `ID` de inputs em loops de critério de avaliação.
- [ ] Task 1.3: Conectar a tag raiz do formulário sob um `<main>`.
- [ ] Task 1.4: Refatorar seções de perguntas e notas em blocos controlados por `<fieldset>` e titulados em `<legend>`.
- [ ] Task 1.5: Impedir o duplo clique ou envio redundante de PDIs ao banco de dados congelando o botão (desabilitado) assim que despachar a query inicial.

### Story 2: Semântica ARIA e Tratamento de Erros em UX
- [ ] Task 2.1: Agrupar Radio Buttons customizados convertendo suas chaves (`divs onClick`) para inputs acessíveis.
- [ ] Task 2.2: Lidar com o alerta de falha focando programaticamente o elemento (`element.focus()`) que impediu o PDI de ser salvo, e criando uma `role="alert"`.
- [ ] Task 2.3: Integrar a lógica de evento `beforeunload` global do Window que aciona se o usuário preencher dados e tentar sair ou fechar o site antes de confirmar.
- [ ] Task 2.4: Marcar campos cruciais (como Data) explícitos em `aria-required="true"`.
- [ ] Task 2.5: Providenciar contagem e `aria-describedby` de limite nos campos livres (`<textarea>`) da justificativa.
- [ ] Task 2.6: Formatar o painel `aria-live` a fim de divulgar uma string sonora no Sucesso de "PDI Salvo!".

### Story 3: UI Customizada, Botões Visuais e Hitboxes
- [ ] Task 3.1: Ampliar a legibilidade base limpando fontes `text-[10px] text-gray-400 opacity-60` usadas nas instruções de preenchimento do formulário.
- [ ] Task 3.2: Reverter estados indicativos só por cor de bolinha (Verde = PDI Aprovado) e injetar uma `.sr-only` descritiva.
- [ ] Task 3.3: Exigir hitbox WCAG (44px) nos controles de nota ou em links secundários dentro do texto.
- [ ] Task 3.4: Remediar o SVG "Cego" de "Exportar PDF / Imprimir" definindo text-label visível ou um aria-label limpo.
- [ ] Task 3.5: Impedir elementos falsos (`div tabindex="0"`) de quebrarem a varredura sem implementar KeyDown Handlers explícitos.