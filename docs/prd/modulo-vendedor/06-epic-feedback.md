# EV-6 — Feedback (líder ↔ liderado)

**Objetivo:** comunicação estruturada entre gestor e vendedor, com **caso obrigatório**, **ação acionável** que vira tarefa, e versão **autônoma** gerada pelo sistema.

**Fase:** Julho · **Status:** 🔧 Parcial (cards, "Li e compreendi", comentário e badge existem; falta caso obrigatório, ação→central, banco de ações e feedback autônomo).

**Arquivos atuais:** `src/pages/VendedorFeedback.tsx`, `useFeedbacks`, tabela `devolutivas`, migration `20260612120000_devolutivas_seller_comment.sql`.

---

## EV-6.1 — Cards, confirmação e comentário do vendedor
**Status:** ✅ Done

**Critérios de aceitação:**
1. Cards: Feedbacks Recebidos, Positivos, Desenvolvimento, Pendentes.
2. Pendências com botão **"Li e compreendi"** (acknowledge real).
3. Campo opcional **"Meu comentário"** enviado na confirmação.
4. Histórico: Data, Tipo, Competência/Referência, Responsável, Confirmação, Meu comentário.
5. **Badge vermelho** de pendentes no menu (ex.: "Feedback (3)").

---

## EV-6.2 — Caso/motivo obrigatório no registro do gerente
**Status:** 🆕 Novo (tela do gerente — fase Julho)

**Como** gerente, **quero** informar o **caso** que motivou o feedback **para** não soltar feedback genérico.

**Critérios de aceitação:**
1. Ao registrar feedback, o gerente **obrigatoriamente** informa o caso (ex.: "falta de argumentação na negociação X").
2. O caso fica no histórico — serve de documentação (inclusive para desligamento).
3. Sem caso, o feedback não é enviado.

**Notas técnicas:** campo `caso`/`motivo` obrigatório em `devolutivas` (na tela do gerente). Vendedor de loja apenas.

---

## EV-6.3 — Ação do feedback vinculada à Central + alerta
**Status:** 🆕 Novo

**Como** vendedor, **quero** que a ação do feedback (ex.: "agendar 3 retornos/dia") apareça na minha rotina **para** não esquecer de executar.

**Critérios de aceitação:**
1. A ação definida no feedback vira **item recorrente** na Central de Execução, no horário.
2. Alerta visual (vermelho) persiste até a ação ser concluída.
3. Pode atrelar à **trava do Fechamento** (EV-1.4): não fecha o dia sem cumprir/justificar.
4. Percorre **os dois pontos**: Central (dia todo) + Fechamento (alerta final).

**Dependências:** EV-3.4, EV-1.4.

---

## EV-6.4 — Banco de ações selecionáveis (fluxograma)
**Status:** 🔮 Futuro

**Como** gerente, **quero** selecionar a ação de um banco pré-definido **para** acionar um fluxograma automático.

**Critérios de aceitação:**
1. Banco de ações pré-cadastradas; gerente seleciona em vez de digitar.
2. A ação escolhida aciona o fluxograma vinculado (dispara tarefa/alerta na rotina).

**Dependências:** EV-6.3.

---

## EV-6.5 — Feedback autônomo (sistema gera)
**Status:** 🆕 Novo

**Como** vendedor autônomo (sem gerente), **quero** receber feedback gerado pelo sistema **para** saber onde estou errando no fluxo.

**Critérios de aceitação:**
1. O sistema analisa os números (ex.: agenda mas não vem visita; não está agendando) e gera feedback automático.
2. Aponta a etapa do fluxo onde o vendedor falha.
3. Mesma UX do feedback humano (confirmar, ação na rotina).

**Dependências:** EV-2.6 (analytics de gargalo), EV-12 (persona autônomo).
