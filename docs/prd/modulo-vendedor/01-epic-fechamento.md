# EV-1 — Fechamento Diário e Cadastro Rico

**Objetivo do épico:** capturar diariamente os dados que alimentam todo o sistema (score, funil, comissão, ranking) com o menor atrito possível, no layout aprovado pelo Daniel.

**Fase:** Julho · **Status:** 🔧 Parcial

**Telas/arquivos atuais:** `src/features/checkin/` (`Checkin.container.tsx`, `sections/CheckinForm.tsx`, `sections/CheckinCrmSection.tsx`), tabelas `lancamentos_diarios` (D-1 oficial) e CRM (`clientes`, `oportunidades`, `agendamentos`, `atendimentos`).

---

## EV-1.1 — Layout do mock no Fechamento Diário
**Status:** ✅ Done (CheckinCrmSection no visual do mock)

**Como** vendedor, **quero** uma tela de fechamento com cards numerados por canal **para** lançar rápido a produção do dia.

**Critérios de aceitação:**
1. Card "1. Leads Recebidos Hoje" com Carteira e Internet.
2. Card "2. Atendimentos Hoje" com Showroom, Carteira, Internet (+ Porta) e steppers `+/-` funcionais.
3. Card "3. Agendamento D+1" com Carteira e Internet.
4. Resumo do Dia (Leads, Atendimentos, Agendamentos D+1, Vendas, Faturamento).
5. Card Disciplina (% dos últimos 7 dias) + Dica do Dia.
6. Form oficial D-1 (`lancamentos_diarios`) preservado — é o sistema de record.

---

## EV-1.2 — Cadastro rico do cliente alimentando comissão
**Status:** 🔧 Parcial

**Como** vendedor, **quero** registrar venda com sinal, financiamento, carro avaliado e **tipo de veículo** **para** o sistema calcular minha comissão pela regra correta da loja.

**Critérios de aceitação:**
1. Cadastro de venda captura: nome, telefone, veículo, **tipo de veículo (carro/moto/caminhão)**, canal, data, carro na troca, sinal, financiamento (aprovado/reprovado/pendente/não se aplica), venda realizada, motivo da perda.
2. O **valor/faturamento** da venda fica disponível para o motor de remuneração (não só a contagem).
3. Cadastro é **opcional** no Fechamento, mas **concentrado na Carteira** (não duplicar formulário).
4. Campo "tipo de veículo" habilita comissionamento por categoria (ver EV-8).

**Notas técnicas:** adicionar `tipo_veiculo` em `oportunidades`; enum `crm_tipo_veiculo`. Migration + regenerar tipos.

**Dependências:** EV-8 (comissionamento por categoria).

---

## EV-1.3 — Cards de Leads e D+1 derivados do CRM
**Status:** ✅ Done

**Como** vendedor, **quero** que Leads Recebidos e Agendamentos D+1 venham do CRM **para** não digitar duas vezes.

**Critérios de aceitação:**
1. Leads Hoje = clientes criados hoje por `canal_origem`.
2. Agendamentos D+1 = agendamentos reais de amanhã por canal.
3. Atendimentos por canal persistem em `atendimentos` (com remover último).

---

## EV-1.4 — Trava de fechamento por meta de feedback
**Status:** 🆕 Novo

**Como** gerente, **quero** que o vendedor só feche o dia se cumpriu a ação do feedback (ou justificou) **para** garantir execução.

**Critérios de aceitação:**
1. Se há ação de feedback pendente do dia (ex.: "cadastrar 2 clientes/dia"), o botão "Finalizar fechamento" exige **observação obrigatória** com o motivo de não-cumprimento.
2. A trava só vale quando a loja/gerente configurou aquela ação como obrigatória.
3. Vendedor autônomo: a trava usa metas auto-definidas (feedback autônomo — ver EV-6.5).

**Dependências:** EV-6 (ação de feedback vinculada).
