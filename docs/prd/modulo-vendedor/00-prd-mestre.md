# PRD Mestre — Módulo Vendedor MX Performance

> **Fonte:** Reunião 12/06/2026 (Pedro Guilherme, Daniel Santos, Mariane Durães) — transcrição completa em [`../20260612-reuniao-modulo-vendedor.md`](../20260612-reuniao-modulo-vendedor.md).
> **Versão:** 1.0 — refeito do zero em formato Épico/Story.
> **Status global:** execução técnica das stories Julho pronta para review; pendências restantes dependem de decisão de produto, mock final, pagamento/assinatura, mobile ou validação visual externa.

---

## 1. Visão e conceito central

> *"Um sistema que ajuda o vendedor a vender mais."* — e que **age como o gestor dele**.

O Módulo Vendedor não é um CRM tradicional. É um **mentor digital de vendas** que:

1. **Desenvolve** o vendedor (trilhas, PDI, feedback).
2. **Cria disciplina operacional** (rotina diária guiada, fechamento, cadência).
3. **Melhora a performance comercial** (funil "o que falta para bater a meta", assistente comercial).
4. **Alimenta os indicadores** do sistema (fechamento → score → ranking).
5. **Cria histórico profissional** (base do futuro Mercado de Trabalho MX).
6. **Substitui o gerente** para quem não tem um — o sistema "trabalha como gestor".

**Público-alvo prioritário:** o vendedor **mediano para baixo** (80% do volume), que precisa de um fluxo mastigado ("isso aqui, meu filho, só faz"). O vendedor top (~10%) usa pouco, mas não é o foco.

---

## 2. Personas

| Persona | Descrição | Particularidades |
|---------|-----------|------------------|
| **Vendedor de loja** | Vinculado a uma loja com **pacote principal** (consultoria MX). | Plano de remuneração herdado do RH; recebe feedback do gerente; **não** aparece no Mercado de Trabalho; competências do PDI avaliadas pelo gestor. |
| **Vendedor autônomo** | Assina o sistema sozinho (**R$ 49,90/mês**). | Configura o próprio comissionamento; recebe **feedback autônomo** gerado pelo sistema; autoavalia o PDI; **pode** se expor no Mercado de Trabalho; algumas telas ficam "cinza"/ocultas. |
| **Gerente comercial** | Gestão da loja (fase Julho). | Registra feedback (com caso obrigatório); **refina** o score do vendedor; valida se o sistema não está "alucinando". |
| **Dono** | Dono da loja (fase Agosto). | Cadastra plano de comissionamento no RH; enxerga scores; consome Mercado de Trabalho para contratar. |

---

## 3. Modelo de produto e multi-tenancy

- **Pacote principal (loja):** loja contrata consultoria MX; todos os vendedores vinculados herdam plano de remuneração, recebem feedback de gerente e ficam **invisíveis** no Mercado de Trabalho.
- **Avulso (autônomo):** R$ 49,90/mês; gestão individual; pode migrar de loja levando seus dados.
- **Migração de dados:** vínculo por **CPF/e-mail**. Ao trocar de loja (ou virar avulso ↔ vinculado), histórico, carteira e cadastro viajam com o vendedor.
- **Importação:** vendedor avulso que entra numa loja-cliente pode importar seus dados para o ambiente da loja.

---

## 4. Menu do Vendedor (ordem-alvo)

Ordem discutida (fluxo natural: alimentar → consultar → executar):

1. Dashboard (Meu Dia)
2. **Fechamento Diário** (obrigatório, alimenta o sistema)
3. **Carteira de Clientes** (consulta o dia todo)
4. **Central de Execução** (executa o dia)
5. Funil de Vendas
6. Treinamentos
7. Feedback *(badge vermelho de pendentes)*
8. PDI
9. Ranking
10. Meu Perfil
11. Mercado de Trabalho *(condicional — autônomo / opt-in)*

> **Decisão:** Agenda e Histórico **removidos** (já feito). Cadastro de cliente **concentrado na Carteira** (não duplicar na Central).

---

## 5. Regras transversais

| Regra | Descrição |
|-------|-----------|
| **R-01 Dados reais** | Nenhuma tela exibe dado fake/placeholder. Sem dado → empty state honesto. |
| **R-02 Sistema-gestor** | O sistema preenche/sugere o máximo automaticamente. "Não quero dar trabalho ao vendedor." |
| **R-03 Interligação** | Carteira ↔ Central ↔ Funil ↔ Feedback ↔ Fechamento conversam: ação numa tela reflete na outra. |
| **R-04 Visibilidade por persona** | Telas/cards exclusivos de autônomo ficam ocultos (não "cinza" quebrado) para vendedor de loja, e vice-versa. |
| **R-05 Tipografia leve** | Reduzir `font-black`/negrito pesado → tom mais leve ("mais Arial"). **Mariane valida todo layout.** |
| **R-06 Mobile-first de uso** | Vendedor interage muito mais pelo app (anda no pátio com telefone). App é "ouro". |
| **R-07 Persistência comercial** | Todo fluxo de cadência alimenta o índice de Persistência Comercial. |

---

## 6. Índice de Épicos

| Épico | Título | Arquivo | Fase | Status |
|-------|--------|---------|------|--------|
| **EV-1** | Fechamento Diário e Cadastro Rico | [`01-epic-fechamento.md`](01-epic-fechamento.md) | Jul | ✅ Done |
| **EV-2** | Carteira + Motor de Cadência | [`02-epic-carteira-cadencia.md`](02-epic-carteira-cadencia.md) | Jul | ✅ Done |
| **EV-3** | Central de Execução (rotina automática) | [`03-epic-central-execucao.md`](03-epic-central-execucao.md) | Jul | ✅ Done |
| **EV-4** | Funil de Vendas (estratégia por canal) | [`04-epic-funil.md`](04-epic-funil.md) | Jul | ✅ Done |
| **EV-5** | Treinamentos (Biblioteca/Trilha/Aulas) | [`05-epic-treinamentos.md`](05-epic-treinamentos.md) | Jul | 🔧 Parcial |
| **EV-6** | Feedback (caso, ação, trava, autônomo) | [`06-epic-feedback.md`](06-epic-feedback.md) | Jul | ✅ Done |
| **EV-7** | PDI (evolução + autoavaliação) | [`07-epic-pdi.md`](07-epic-pdi.md) | Jul | ✅ Done |
| **EV-8** | Meu Perfil + Comissionamento | [`08-epic-perfil-comissionamento.md`](08-epic-perfil-comissionamento.md) | Jul | ✅ Done |
| **EV-9** | Score do Vendedor (composição) | [`09-epic-score.md`](09-epic-score.md) | Jul/Ago | ⚠️ Bloqueado |
| **EV-10** | Ranking | [`10-epic-ranking.md`](10-epic-ranking.md) | Jul | 🔧 Parcial |
| **EV-11** | Mercado de Trabalho MX | [`11-epic-mercado-trabalho.md`](11-epic-mercado-trabalho.md) | Nov | 🔮 Futuro |
| **EV-12** | Multi-tenancy (loja vs autônomo) | [`12-epic-multitenancy.md`](12-epic-multitenancy.md) | Jul→ | 🔧 Parcial |
| **EV-13** | Aplicativo Mobile (React Native) | [`13-epic-app-mobile.md`](13-epic-app-mobile.md) | pós-validação | 🔮 Futuro |
| **EV-14** | Design System / Tipografia | [`14-epic-design-tipografia.md`](14-epic-design-tipografia.md) | Jul | 🔧 Parcial |

> Legenda status: ✅ Done · 🔧 Parcial (existe, falta requisito/validação externa) · 🆕 Novo · 🔮 Futuro · ⚠️ Bloqueado.

---

## 7. Roadmap (cronograma da reunião)

```
Início Julho   → Lançar módulo VENDEDOR em produção (meta: "semana que vem funcionando")
Julho          → Construir módulo GERENTE (mais simples; parametrizado pelo vendedor)
Agosto         → Construir módulo DONO + Departamentos (evento com donos de loja)
Set–Out        → Testes e ajustes (piloto)
Novembro       → Lançar MERCADO DE TRABALHO
Pós-validação  → App mobile (Android first)
```

**Operação de rollout (EV-Op):**
- Reunião fixa de alinhamento **semanal (terça)**.
- Piloto em **grupo pequeno** (José + mentoria) → expandir p/ ~20-30 lojas / ~100 vendedores.
- Canal de erros: **print da tela + áudio** → Mariane valida com Pedro (igual fluxo atual).
- Possível **dia presencial** de teste com vendedores (demonstração + coleta de "o que falta").

---

## 8. Glossário

| Termo | Significado |
|-------|-------------|
| **Cadência** | Sequência de ações por etapa do funil (ex.: msg1→msg2→msg3→retorna em 7 dias). |
| **Persistência Comercial** | % de clientes que percorreram toda a cadência até a venda. |
| **Score da Rotina** | Pontuação diária por cumprir a rotina (abriu Central, fez Fechamento, cadastrou clientes). |
| **Score do Vendedor** | Score consolidado/histórico (Resultado/Disciplina/Treinamentos/Feedback). |
| **Canal** | Origem do cliente: Internet (Lead), Carteira (Agendamento), Porta (Atendimento), Showroom. |
| **Caso** | Motivo obrigatório que o gerente informa ao registrar um feedback. |
| **Distribuição por canal** | % de vendas de cada canal (últimos 3 meses) — direciona a estratégia do funil. |
