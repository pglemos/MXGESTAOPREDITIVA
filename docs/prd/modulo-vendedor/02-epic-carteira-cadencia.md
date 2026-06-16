# EV-2 — Carteira de Clientes + Motor de Cadência

**Objetivo:** conduzir cada cliente até a venda por um **fluxo de cadência** que o sistema dirige — o "treinamento prático" que substitui o gerente. É o coração do "sistema-gestor".

**Fase:** Julho · **Status:** 🔧 Parcial (fundação de cadência existe; falta o motor configurável e a integração com a Central).

**Arquivos atuais:** `src/features/crm/CarteiraClientes.container.tsx`, `src/features/crm/lib/cadencia.ts`, hooks `useClientes`/`useOportunidades`/`useAgendamentos`.

---

## EV-2.1 — Carteira com cadência por canal (fundação)
**Status:** ✅ Done

**Como** vendedor, **quero** ver cada cliente com etapa atual, cadência (%) e próxima ação **para** saber o que fazer.

**Critérios de aceitação:**
1. Tabela: Cliente, Veículo Procurado, Origem, Carro na troca, Ficha, Etapa Atual, Cadência, Próxima ação, Último contato, Status.
2. Painel direito "Fluxo do Cliente" com etapas por canal (Internet: Lead→Contato→Agendamento→Visita→Negociação→Venda; Carteira: Agendamento→Visita→Negociação→Venda; Porta: Atendimento→Negociação→Venda).
3. Cada etapa: Objetivo, O que fazer, Próxima ação, Script sugerido.
4. Cards: Total, Em Andamento, Aguardando Cliente, Sem Resposta, Vendidos, **Persistência Comercial**.
5. Filtros: Origem, Status, Carro na troca, Ficha do cliente.

---

## EV-2.2 — Motor de cadência configurável
**Status:** 🆕 Novo

**Como** consultor/admin, **quero** definir fluxos de cadência por etapa **para** que o sistema diga ao vendedor o próximo passo sem treinar ninguém.

**Critérios de aceitação:**
1. Fluxo é uma sequência de passos por etapa. Ex.: *Cliente respondeu* → "enviar mensagem 1" → "enviar mensagem 2" → "enviar mensagem 3" → se sem resposta após 3, "retorna em 7 dias".
2. Cada passo gera automaticamente a **próxima ação** do cliente com prazo.
3. Os fluxos são configuráveis (não hard-coded) e versionáveis para analytics ("qual fluxo chegou na venda").
4. O vendedor **não cria** fluxo — ele segue o que está pronto ("mastigado").

**Notas técnicas:** tabelas `cadencia_fluxos` (por canal/etapa/loja, com passos em JSONB), `cadencia_estado_cliente` (cliente_id, passo_atual, proxima_acao_em). RLS por loja/admin.

**Dependências:** EV-2.1.

---

## EV-2.3 — Status da ação com 3 opções realimentando o fluxo
**Status:** 🆕 Novo

**Como** vendedor, **quero** marcar a ação como **Feito / Não feito / Aguardando** **para** o sistema saber a que etapa do fluxo voltar.

**Critérios de aceitação:**
1. Cada ação do cliente tem 3 status: **Feito**, **Não feito**, **Aguardando**.
2. O status escolhido **cria o próximo ciclo** da cadência (define a próxima ação/etapa).
3. Sem campo de observação livre obrigatório por padrão (evitar barreira) — observação opcional.
4. "Não feito" e "Aguardando" mantêm o cliente vivo no fluxo (não some).

**Dependências:** EV-2.2.

---

## EV-2.4 — Reagendamento automático de tentativas
**Status:** 🆕 Novo

**Como** vendedor, **quero** que tentativas de contato sem sucesso sejam reagendadas automaticamente **para** nenhum cliente ficar no limbo.

**Critérios de aceitação:**
1. Ao registrar "não consegui contato" (ex.: 3ª tentativa), o sistema **reagenda a ação para o próximo dia** (não no mesmo dia).
2. A ação reagendada reaparece na Central de Execução do dia seguinte.
3. Limite de tentativas configurável por fluxo; ao estourar, cliente cai em "retornar em X dias" ou status terminal.

**Dependências:** EV-2.2, EV-3 (Central).

---

## EV-2.5 — Integração Carteira → Central de Execução
**Status:** 🆕 Novo

**Como** vendedor, **quero** que as próximas ações da cadência apareçam na minha Central de Execução **para** abrir o sistema e já saber o que fazer hoje.

**Critérios de aceitação:**
1. Toda próxima ação com prazo "hoje" (confirmar visita, ligar, retorno de cliente atendido há 7 dias) aparece na **Agenda do Dia** da Central.
2. Cada item mostra cliente, ação sugerida e horário.
3. Concluir o item na Central atualiza o status na Carteira (e vice-versa) — interligação R-03.
4. O sistema **sugere** o que fazer em cada horário ("já está sugerido o que ele tem que fazer").

**Dependências:** EV-2.3, EV-3.

---

## EV-2.6 — Analytics de funil/cadência (gargalo)
**Status:** 🔮 Futuro

**Como** gerente/marketing, **quero** saber em que etapa os clientes param **para** agir no gargalo.

**Critérios de aceitação:**
1. Relatório: em qual etapa do fluxo o cliente para (ex.: faz agendamento mas não vem visita).
2. Modelo de veículo de interesse agregado por loja (demanda real).
3. Taxa de conversão por fluxo (qual cadência converte mais) para melhoria contínua.

**Dependências:** EV-2.2 (versão de fluxos).
