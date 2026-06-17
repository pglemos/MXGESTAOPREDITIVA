# EV-3 — Central de Execução (rotina automática)

**Objetivo:** organizar o dia do vendedor numa tela que ele abre de manhã e deixa aberta o dia inteiro. A rotina se preenche **sozinha** conforme ele trabalha — sem dar trabalho extra.

**Fase:** Julho · **Status:** ✅ Done (execução técnica pronta para review).

**Arquivos atuais:** `src/features/crm/CentralExecucao.container.tsx`, `useAgendamentos`, `lib/daily-routine.ts`.

---

## EV-3.1 — Cards superiores e Agenda do Dia
**Status:** ✅ Done

**Como** vendedor, **quero** ver meus compromissos e indicadores do dia em uma tela central **para** decidir rapidamente o que executar agora.

**Critérios de aceitação:**
1. Cards: Agendamentos Hoje, Compareceram, Não Compareceram, Em Negociação, Vendas Realizadas, Score da Rotina.
2. Tabela Agenda do Dia: Horário, Cliente, Veículo, Canal, Status, Próxima ação.
3. Filtros (Hoje / Atrasados / Próximos 7 / Todos) e ação WhatsApp.

**Notas técnicas:** `CentralExecucao.container.tsx` consome agendamentos reais e métricas do CRM; filtros não podem criar dados sintéticos.

**Dependências:** CRM e agendamentos existentes.

---

## EV-3.2 — Score da Rotina conforme spec
**Status:** ✅ Done

**Como** vendedor, **quero** entender meu Score da Rotina do dia **para** saber quais hábitos ainda faltam cumprir.

**Critérios de aceitação:**
1. Abriu Central = 10%; Fechamento Diário feito = 20%; 1 cliente cadastrado hoje = 40%; 2 = 60%; 3+ = 70%.
2. Linhas refletem o estado real (check verde só quando cumprido).

**Notas técnicas:** cálculo em `daily-routine.ts` deve usar eventos reais do dia; manter pesos documentados até a recomposição do Score do Vendedor (EV-9).

**Dependências:** EV-1 (fechamento) e CRM para contagem de clientes cadastrados.

---

## EV-3.3 — Rotina do Dia com auto-preenchimento
**Status:** ✅ Done

**Como** vendedor, **quero** que a rotina do dia (Mentalidade, Organização, Novos Clientes, Prospecção, Atendimento, Lista Quente, Fechamento) se marque sozinha **para** focar em executar, não em registrar.

**Critérios de aceitação:**
1. **Atendimento** → check automático ao atingir o mínimo configurável de atendimentos (ex.: 5).
2. **Organização do dia** → check ao atualizar o status dos clientes na Central.
3. **Novos Clientes / Contato com novos leads** → check ao preencher agendamentos / cadastrar cliente.
4. **Fechamento do dia** → check ao concluir o Fechamento Diário.
5. Itens sem fonte de dado (ex.: Mentalidade) podem "passar batido" (não exigem check manual).
6. Horários da rotina ajustados conforme a **jornada cadastrada** no Meu Perfil.
7. Tela apenas visual (sem botão de marcação manual obrigatória).

**Notas técnicas:** derivar checks de eventos reais (atendimentos do dia, agendamentos criados, status atualizados, lançamento do dia). Mínimos configuráveis por loja/perfil.

**Dependências:** EV-1, EV-2.5, EV-8 (jornada).

---

## EV-3.4 — Ações sugeridas pelo sistema por horário
**Status:** ✅ Done

**Como** vendedor, **quero** abrir a Central e já ver o que o sistema sugere em cada horário **para** seguir um roteiro pronto.

**Critérios de aceitação:**
1. As próximas ações da cadência (EV-2.5) entram na Agenda do Dia com horário sugerido.
2. Ações reagendadas (EV-2.4) aparecem automaticamente.
3. Feedback do gestor com ação (ex.: "agendar 3 retornos/dia") aparece como item com **alerta vermelho** até concluir (EV-6.3).
4. "Novo Compromisso" cria agendamento real (já feito); cadastro de cliente fica na Carteira (não aqui).

**Notas técnicas:** unificar itens da agenda vindos de `agendamentos`, cadência e feedback em uma lista ordenável por horário, mantendo origem rastreável.

**Dependências:** EV-2.5, EV-2.4 e EV-6.3.
