# Auditoria: Mockups (5 telas) × Sistema real — Módulo Vendedor

Data: 2026-06-09 · Base: branch `main` · Comparação imagem ↔ código-fonte ↔ banco (Supabase `fbhcmzzgwjdgkctlfvbo`)

## Veredito geral

As imagens representam **dois designs distintos**:

- **Imagem 1 ("Meu Dia")** → corresponde ao módulo real (`VendedorHome`), com ressalvas de dados hardcoded.
- **Imagens 2–5 (Fechamento Diário, Central de Execução, Funil de Vendas, Carteira de Clientes)** → pertencem a uma **arquitetura de informação divergente** (menu lateral "Dashboard / Fechamento Diário / Central de Execução / Funil de Vendas / Carteira de Clientes / Leads / Comissão / Treinamentos / Feedback / PDI / Ranking / Relatórios") que **não existe** no sistema atual do vendedor.

### Navegação real do vendedor (`src/components/Layout.tsx`, categoria NAVEGAÇÃO)
Meu Dia (`/home`) · Agenda (`/agenda-vendedor`) · Funil (`/historico`) · Feedbacks (`/devolutivas`) · Consultor IA · PDI (`/pdi`) · Treinamentos (`/treinamentos`) · Trilhas (`/trilhas`).

> "Funil" no menu aponta para `/historico`, **não** para um funil de oportunidades. `/funil-vendas` é `ForbiddenRoute` para vendedor (só gerente/dono).
> "Comissão" existe como `/minha-remuneracao` mas **não está no menu** do vendedor.

---

## Imagem 1 — "Bom dia, João!" / Meu Dia ✅ (com ressalvas)

Arquivo real: `src/features/vendedor-home/VendedorHome.container.tsx`

Estrutura bate com o mockup: Minha Meta (Mês), Comissão Estimada, Agendamentos Hoje, Atividades Hoje, Meu Score MX, Minha Agenda de Hoje, Fechar Meu Dia, Ranking da Loja, Minha Evolução, Minhas Conquistas, Meus Treinamentos, Último Feedback.

### ⚠️ Dados HARDCODED (idênticos aos números do mockup, NÃO vêm do banco)
| Item | Valor fixo no código | Linha |
|------|----------------------|-------|
| Score MX | `score = 720` (`Prata MX` → `Ouro MX`) | container ~51-53 |
| Atividades Hoje | Negociações 3 / Agendamentos 2 / Retornos 5 / Entregas 1 | ~62-65 |
| Minhas Conquistas | `score={450}` | ~135 |
| Fechar meu dia | `dayCompletion = 70` | ~50 |
| Saudação | sempre "Bom dia" (sem lógica de horário) | SellerHeader |

Esses cards são **réplicas estáticas do mockup**, não refletem o vendedor logado. Ligados a dados reais: meta, comissão estimada (`remuneracaoEstimada`), agendamentos, ranking, evolução (checkins), treinamentos e feedback.

---

## Imagem 2 — "Fechamento Diário" ⚠️ parcial / modelo diferente

Equivalente real: `/lancamento-diario` → `src/features/checkin/` (CheckinForm). **Muito mais simples** que o mockup.

### Campos reais (7) — `daily_checkins`
Leads de Ontem · Visitas de Ontem · Vendas Porta/Carteira/Internet · Agenda Carteira/Internet · Justificativa de produção zero.

### Presentes no mockup e AUSENTES no sistema
- **Atendimentos Hoje** com canal **Showroom** (não existe canal Showroom em lugar nenhum).
- **Agendamento D+1** separado (real tem agenda, sem rótulo D+1).
- **"Cadastrar Novo Cliente"** — tabela CRM completa (Nome, Telefone, Veículo, Valor Negociado, Data Agendamento, Canal, Compareceu, Carro Avaliado, Sinal, Financiamento, Venda Realizada). **Não existe.**
- **Resumo do Dia** com **Faturamento** (R$).
- Mockup usa "Hoje"; sistema usa "de **Ontem**" (modelo temporal diferente).

### Banco
`daily_checkins` guarda **apenas contadores agregados** por vendedor/dia (`leads, visitas, agd_cart, agd_net, vnd_porta, vnd_cart, vnd_net` + variações `_prev_day`). **Não há registro por cliente** — a tabela "Cadastrar Novo Cliente" do mockup não tem suporte no schema.

---

## Imagem 3 — "Central de Execução" ❌ não existe

Sem rota, sem página, sem item de menu para o vendedor. O conceito do mockup (agenda linha-a-linha por cliente com ações WhatsApp/editar, timeline "Rotina do Dia", "Score da Rotina") **não está implementado** no módulo do vendedor. (`DailyRoutineCard` em `vendedor-home` é outra coisa.) Sem tabela de agenda por cliente no banco.

---

## Imagem 4 — "Funil de Vendas" ❌ não disponível para vendedor

- `/funil-vendas` = `ForbiddenRoute` para vendedor (App.tsx). Funil real (`FunilVendasGerente`) só para gerente/dono.
- O item "Funil" do menu do vendedor leva a `/historico`, não a um funil.
- Etapas do mockup (Prospecção/Qualificação/Apresentação/Negociação/Fechamento), insights, ticket médio, ciclo médio, melhores origens: **não existem para vendedor**. Sem tabela de oportunidades nível-vendedor no banco.

---

## Imagem 5 — "Carteira de Clientes" ❌ não existe

Sem rota, página, item de menu ou tabela de banco para carteira de clientes do vendedor (356 clientes, status de relacionamento, próxima ação, potencial de negócio, lembretes). As tabelas `carteira_empresa` (patrimônio da empresa) e `consulting_clients` (clientes de consultoria) **não têm relação** com isso.

---

## Resumo de lacunas (mockups 2–5)

| Tela do mockup | Status no sistema do vendedor |
|----------------|-------------------------------|
| Dashboard (menu) | É o "Meu Dia" (IA diferente) |
| Fechamento Diário | Parcial — sem Atendimentos/Showroom, D+1, CRM de cliente, Faturamento |
| Central de Execução | ❌ Inexistente |
| Funil de Vendas | ❌ Proibido p/ vendedor |
| Carteira de Clientes | ❌ Inexistente |
| Leads (página) | ❌ Inexistente |
| Comissão (menu) | Existe `/minha-remuneracao`, fora do menu |
| Relatórios | ❌ Inexistente p/ vendedor |

## Itens que exigem decisão
1. Os mockups 2–5 são **escopo futuro** ou o sistema atual deveria já cobri-los? Hoje o vendedor **não** opera como CRM (decisão explícita no código: *"sem virar CRM"*, comentário no container).
2. No "Meu Dia", ligar os cards hardcoded (Score 720, Atividades 3/2/5/1, Conquistas 450, Fechar dia 70%) a dados reais ou assumi-los como placeholders.
