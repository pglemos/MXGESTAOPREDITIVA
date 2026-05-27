# PRD — MX Performance: Visão Estrutural do Produto

**Data:** 2026-05-27
**Tipo:** PRD-mestre (constituição do produto) — Brownfield
**Status:** Draft para validação
**Autor:** @pm (Morgan) via handoff de @aiox-master (Orion)
**Fonte primária:** `MX PERFORMANCE - DESENVOLVIMENTO.docx` (387 parágrafos, extração textual integral)
**PRDs correlatos (referência cruzada):**
- `docs/prd/analise-modulos-dono-gerente-vendedor-2026-05-27.md` — mesma fonte, escopo módulos por perfil
- `docs/prd/modulo-visao-dono-cockpit-executivo-2026-05-26.md` — Visão Dono detalhada
- `docs/prd/plano-mestre-evolucao-mx-performance-2026-05-22.md` — plano da reunião 22/05
- `docs/prd/prd-refatoracao-mx-performance-reuniao-2026-05-22.md` — PRD de refatoração 22/05

> **Article IV — No Invention:** Toda afirmação neste documento rastreia ao `.docx` fonte ou aos PRDs correlatos. Nenhuma feature inventada.

---

## 1. Goals and Background Context

### 1.1 Objetivo do Produto

Transformar a metodologia consultiva MX em sistema escalável, simples, visual e orientado à execução, funcionando como **"Sistema Operacional de Consultoria e Gestão para Lojas Automotivas"** — não como CRM, ERP ou BI tradicional.

> Fonte: `.docx` §1–§9

### 1.2 Foco do Produto

O sistema deve cumprir 6 funções nucleares:

1. **Identificar gargalos**
2. **Gerar alertas**
3. **Recomendar ações**
4. **Acompanhar execução**
5. **Medir evolução**
6. **Desenvolver cultura operacional**

> Fonte: `.docx` §10–§16

### 1.3 Princípio Final

> "O MX deve funcionar como **consultor operacional inteligente para lojas automotivas**. O sistema deve detectar, orientar, cobrar, acompanhar e evoluir. E NÃO apenas armazenar dados."

> Fonte: `.docx` §377–§387

### 1.4 Posicionamento (NÃO-Goals)

O MX Performance explicitamente **NÃO É**:

| NÃO é | Por quê |
|---|---|
| CRM | Vendedor NÃO utilizará CRM dentro do MX. O sistema NÃO duplica preenchimentos comerciais já feitos em CRMs parceiros (`.docx` §170–§171) |
| ERP | Evitar aparência de ERP (`.docx` §23–§26) |
| BI tradicional | Evitar excesso de gráficos, foco em cards e status (`.docx` §337, §365–§366) |
| Sistema burocrático | Evitar aparência de planilha ou sistema burocrático (`.docx` §25–§26) |

---

## 2. Filosofia de UX (Requisitos Não-Funcionais Comportamentais)

### 2.1 Princípios Inegociáveis (UX-P1 a UX-P6)

| ID | Princípio | Fonte |
|---|---|---|
| **UX-P1** | O sistema deve parecer **SIMPLES** | §29 |
| **UX-P2** | O usuário deve precisar de **poucos cliques** | §30 |
| **UX-P3** | O sistema deve **orientar o usuário** | §31 |
| **UX-P4** | O sistema deve **gerar ação** | §32 |
| **UX-P5** | O sistema deve **parecer vivo** | §33 |
| **UX-P6** | O sistema deve **se adaptar ao perfil do usuário** | §34 |

### 2.2 Aparência Desejada vs Evitada

**Aparência desejada:** simples, moderno, objetivo, inteligente, operacional (§17–§22)
**Evitar:** ERP, planilha, sistema burocrático (§23–§26)

---

## 3. Perfis do Sistema (10 perfis)

> Fonte: `.docx` §35–§74

| # | Perfil | Responsabilidades |
|---|---|---|
| 1 | **Master / Dono** | Acesso total, visão estratégica, libera acessos |
| 2 | **Diretor / Sócio** | Visão executiva |
| 3 | **Gerente Comercial** | Gestão da equipe comercial, execução operacional |
| 4 | **Vendedor** | Rotina operacional, metas, agenda, desenvolvimento |
| 5 | **Marketing** | Leads, campanhas, canais |
| 6 | **Produto** | Estoque, giro, margem |
| 7 | **Financeiro / Administrativo** | DRE, margem, fluxo |
| 8 | **RH** | Treinamentos, PDIs, feedbacks, clima |
| 9 | **Operações** | Preparação, pós-venda, entrega |
| 10 | **Consultor MX** | Análise consultiva, planos de ação, observações qualitativas |

**Implicação técnica (UX-P6):** Sistema de permissões e personalização de Home/menu por perfil é obrigatório.

---

## 4. Functional Requirements (FR)

### 4.1 Estrutura Principal do Menu (FR-MENU)

> Fonte: `.docx` §75–§109

**FR-MENU-1:** Menu principal deve conter 6 áreas:

| Área | Descrição | Submenus |
|---|---|---|
| **HOME** | Dinâmica conforme perfil | — |
| **CENTRAL MX** | Núcleo consultivo (cérebro do sistema) | Planejamento Estratégico, Plano de Ação, Alertas Inteligentes, Benchmarking, Agenda Executiva, Consultor IA |
| **DEPARTAMENTOS** | Visão por área | Comercial, Marketing, Produto, Financeiro, RH, Operações |
| **PESSOAS** | Gestão de pessoas | Usuários, permissões, feedbacks, PDIs, treinamentos |
| **UNIVERSIDADE MX** | Educação corporativa | Biblioteca, trilhas, aulas ao vivo, certificações |
| **CONFIGURAÇÕES** | Setup | Empresa, usuários, integrações, notificações |

### 4.2 Arquitetura das Homes (FR-HOME)

#### FR-HOME-1 — Home Dono / Diretor

> Fonte: `.docx` §111–§129

**Objetivo:** Central de controle estratégica.

| KPIs principais | Blocos |
|---|---|
| Lucro Bruto | Meta do mês |
| % Margem | Alertas críticos |
| Volume de Vendas | Score por departamento |
| Estoque | Agenda executiva |
| MX Score | Próximas ações / Gargalos da loja |

**Restrição UX:** O dono NÃO deve navegar muito. Experiência baseada em **alertas, prioridades, ações rápidas** (§126–§129).

#### FR-HOME-2 — Home Gerente Comercial

> Fonte: `.docx` §130–§150

**Objetivo:** Central operacional da equipe.

| Indicadores | Blocos | Foco |
|---|---|---|
| Meta, Realizado, Projeção | Equipe | Cobrança |
| Agendamentos hoje | Funil comercial | Acompanhamento |
| Conversão | Alertas | Execução |
| MX Score | Agenda operacional, Ranking, Engajamento | Rotina |

#### FR-HOME-3 — Home Vendedor

> Fonte: `.docx` §151–§171

**Objetivo:** App de performance pessoal.

| Menu | Blocos |
|---|---|
| Meu Dia | Meta |
| Agenda | Comissão estimada |
| Funil | Agenda do dia |
| Feedbacks | Fechar meu dia |
| PDI | Ranking |
| Treinamentos | Score pessoal |
| Trilhas | Treinamentos / Feedbacks |

**Restrição crítica:** Vendedor NÃO usa CRM dentro do MX. MX NÃO duplica preenchimentos comerciais já feitos em CRMs parceiros.

### 4.3 Estrutura Operacional em 3 Níveis (FR-OPS)

> Fonte: `.docx` §172–§189

| Nível | Nome | Componentes |
|---|---|---|
| 1 | **Consultoria Estratégica** | Score, benchmarking, indicadores, alertas, planos de ação |
| 2 | **Gestão Operacional** | Rotina, agenda, acompanhamento, disciplina |
| 3 | **Performance Avançada** | Funil, conversão, gamificação, comparativos |

### 4.4 Dados e Coleta (FR-DATA)

> Fonte: `.docx` §190–§207

**FR-DATA-1 — Dados Operacionais:** Atualização diária pelos usuários (agendamentos, visitas, leads, vendas, rotina).

**FR-DATA-2 — Dados Estratégicos:** Atualização semanal pela equipe MX ou administrativo (estoque, margem, DRE, lucro, financeiro).

**FR-DATA-3 — Sem tempo real:** "O sistema NÃO depende de integração em tempo real" (§207).

### 4.5 Fechamento Diário do Vendedor (FR-DAILY)

> Fonte: `.docx` §208–§222

Processo rápido e simples, captura:
- Leads recebidos
- Agendamentos
- Visitas
- Vendas (Porta / Carteira)
- Expectativa do dia seguinte

**Objetivo:** funil comercial, disciplina, dados operacionais, desenvolvimento.

### 4.6 Sistema de Alertas (FR-ALERT)

> Fonte: `.docx` §223–§240

**FR-ALERT-1 — Tipos:** Crítico | Atenção | Positivo | Consultivo

**FR-ALERT-2 — Estrutura obrigatória do alerta:**
- Problema
- Impacto
- Recomendação
- Ação rápida

**FR-ALERT-3 — Canais:** Sistema, push, WhatsApp

**FR-ALERT-4 — Estratégia 2026:** Regras fixas inteligentes. **SEM IA contextual avançada inicialmente.**

### 4.7 MX Score (FR-SCORE)

> Fonte: `.docx` §241–§264

**FR-SCORE-1 — Escala:** 0–100

**FR-SCORE-2 — Classificação:**

| Faixa | Classificação |
|---|---|
| 90–100 | Elite |
| 80–89 | Excelente |
| 70–79 | Bom |
| 60–69 | Atenção |
| < 60 | Crítico |

**FR-SCORE-3 — Camadas:** Score da loja · Score por departamento · Score individual · Score de processos

**FR-SCORE-4 — Estrutura:** Resultado · Processo · Disciplina

**FR-SCORE-5 — Automático:** O score é **AUTOMÁTICO**. Consultor NÃO altera a nota — apenas **comenta, contextualiza, recomenda** (§259–§264).

### 4.8 Plano de Ação (FR-PLAN)

> Fonte: `.docx` §265–§290

**FR-PLAN-1 — Estrutura de cada ação:** Departamento, Indicador, Problema, Ação, Como, Responsável, Prazo, Status, Eficácia, Origem, Prioridade.

**FR-PLAN-2 — Origens válidas:** Alertas · Score · Consultor · Manual

**FR-PLAN-3 — Status válidos:** Pendente · Em andamento · Atrasado · Concluído · Validando eficácia

**Objetivo:** Transformar problemas em execução prática.

### 4.9 Benchmarking (FR-BENCH)

> Fonte: `.docx` §291–§303

Comparar a loja com:
- Região
- Porte
- Segmento
- Melhores lojas

**Comparações:** margem, giro, estoque, conversão, custo, score.

### 4.10 Agenda Executiva (FR-AGENDA)

> Fonte: `.docx` §304–§313

**Integração obrigatória:** Google Agenda + Outlook.
**Funções:** rotina executiva, lembretes, reuniões, acompanhamento, notificações.

### 4.11 Dashboard Executivo (FR-DASH)

> Fonte: `.docx` §314–§330

**KPIs principais:** Lucro Bruto, % Margem, Volume de Vendas, Estoque, MX Score.
**Blocos:** Meta do mês, Alertas, Score departamentos, Gargalos, Benchmark, Evolução, Agenda, Observação consultiva.

### 4.12 Planejamento Estratégico (FR-PLANEJ)

> Fonte: `.docx` §331–§337

Estrutura aprovada:
- 5 cards principais
- Tabela anual completa
- Visão Meta / Realizado / Ano Anterior
- Todos os indicadores do PDF cadastrados
- **Sem excesso de gráficos**

### 4.13 Central MX (FR-CENTRAL)

> Fonte: `.docx` §338–§348

A Central MX é **o cérebro do sistema**. Integra: score, alertas, benchmarking, plano de ação, indicadores, agenda, IA consultiva.

### 4.14 Consultor IA (FR-IA)

> Fonte: `.docx` §349–§356

**Função:** interpretar dados, sugerir ações, identificar gargalos, recomendar melhorias.
**Exemplo:** *"Seu estoque acima de 90 dias aumentou 18%."*
**Restrição 2026:** IA baseada em **regras e contexto simples**. Sem IA preditiva avançada inicialmente.

---

## 5. Non-Functional Requirements (NFR)

### 5.1 NFR-Tech — Prioridade Técnica

> Fonte: `.docx` §367–§376

O sistema deve ser:

| NFR | Requisito |
|---|---|
| **NFR-T1** | Rápido |
| **NFR-T2** | Modular |
| **NFR-T3** | Escalável |
| **NFR-T4** | Simples de usar |

**Anti-requisitos:** excesso de menus, excesso de profundidade, telas poluídas.

### 5.2 NFR-Visual — Padrão Visual

> Fonte: `.docx` §357–§366

| NFR | Requisito |
|---|---|
| **NFR-V1** | Fundo branco |
| **NFR-V2** | Cards arredondados |
| **NFR-V3** | Design clean |
| **NFR-V4** | Azul como cor principal |
| **NFR-V5** | Visual moderno SaaS |
| **NFR-V6** | Alta legibilidade |
| **NFR-V7** | Poucos gráficos — foco em cards e status |

### 5.3 NFR-IA — Restrição de IA para 2026

| NFR | Requisito |
|---|---|
| **NFR-IA1** | Alertas: regras fixas inteligentes — sem IA contextual avançada inicialmente |
| **NFR-IA2** | Consultor IA: regras e contexto simples — sem IA preditiva avançada inicialmente |

---

## 6. UI Design Goals (Sumário)

| Goal | Detalhe |
|---|---|
| **Home dinâmica por perfil** | Cada um dos 10 perfis tem layout próprio (UX-P6) |
| **Hierarquia visual** | Cards e status > gráficos (NFR-V7) |
| **Cor primária azul** | Identidade SaaS moderna (NFR-V4) |
| **Densidade baixa** | Poucos cliques, evitar profundidade excessiva (UX-P2, NFR-Tech) |
| **Foco em ação** | Toda tela deve sugerir próxima ação (UX-P4) |

---

## 7. Technical Assumptions

1. **Frontend modular** com componentes reutilizáveis por perfil (já parcialmente presente em `src/features/dashboard-loja`, `src/features/vendedor-home` — ver git status atual).
2. **Persistência:** dados operacionais (diários) + dados estratégicos (semanais). **Sem requisito de tempo real.**
3. **Integrações iniciais obrigatórias:** Google Agenda + Outlook (FR-AGENDA).
4. **Canal de notificação:** sistema + push + WhatsApp (FR-ALERT-3).
5. **Camada de score:** motor automático de cálculo (FR-SCORE-5) — independente do consultor.
6. **Engine de alertas 2026:** rules-based, não-LLM (NFR-IA1).
7. **Compatibilidade com CRMs parceiros:** sistema NÃO duplica preenchimentos do CRM externo (FR-HOME-3 / §171).

---

## 8. Epic List (Alto Nível — Para @sm Detalhar)

> @sm detalhará cada épico em stories. PM apenas estrutura.

| Epic ID | Título | Escopo Resumido |
|---|---|---|
| **EPIC-MX-01** | Fundação Visual & Design System | Tokens (azul, branco, cards arredondados), tipografia, componentes base (NFR-V1 a NFR-V7) |
| **EPIC-MX-02** | Sistema de Perfis & Permissões | 10 perfis, autorização, libera acessos pelo Master |
| **EPIC-MX-03** | Home Dono / Diretor | FR-HOME-1 (KPIs + blocos + alertas-driven) |
| **EPIC-MX-04** | Home Gerente Comercial | FR-HOME-2 (cobrança/acompanhamento/execução) |
| **EPIC-MX-05** | Home Vendedor (app pessoal) | FR-HOME-3 + Fechamento Diário (FR-DAILY) |
| **EPIC-MX-06** | Central MX (cérebro) | FR-CENTRAL: integra score, alertas, benchmarking, plano de ação |
| **EPIC-MX-07** | Motor MX Score | FR-SCORE (automático, 4 camadas, Resultado/Processo/Disciplina) |
| **EPIC-MX-08** | Sistema de Alertas | FR-ALERT (tipos, estrutura, canais sistema/push/WhatsApp, regras fixas) |
| **EPIC-MX-09** | Plano de Ação | FR-PLAN (estrutura, origens, status, eficácia) |
| **EPIC-MX-10** | Benchmarking | FR-BENCH (região/porte/segmento/melhores lojas) |
| **EPIC-MX-11** | Agenda Executiva | FR-AGENDA (Google + Outlook) |
| **EPIC-MX-12** | Dashboard Executivo | FR-DASH (KPIs + blocos) |
| **EPIC-MX-13** | Planejamento Estratégico | FR-PLANEJ (5 cards + tabela anual) |
| **EPIC-MX-14** | Consultor IA (rules-based 2026) | FR-IA (regras simples, sem LLM) |
| **EPIC-MX-15** | Departamentos | Comercial, Marketing, Produto, Financeiro, RH, Operações |
| **EPIC-MX-16** | Pessoas | Usuários, permissões, feedbacks, PDIs, treinamentos |
| **EPIC-MX-17** | Universidade MX | Biblioteca, trilhas, aulas ao vivo, certificações |
| **EPIC-MX-18** | Configurações | Empresa, usuários, integrações, notificações |

---

## 9. Cross-References (Article IV — Rastreabilidade)

Toda afirmação deste PRD rastreia para:

| Seção | Origem |
|---|---|
| §1 Goals | `.docx` §1–§16 |
| §2 UX Philosophy | `.docx` §27–§34 |
| §3 Perfis | `.docx` §35–§74 |
| §4 Functional Requirements | `.docx` §75–§356 |
| §5 NFR | `.docx` §357–§376 |
| §6 UI Design | `.docx` §357–§366 + correlato `modulo-visao-dono-cockpit-executivo-2026-05-26.md` |
| §7 Technical Assumptions | `.docx` §190–§207, §304–§313 + estado atual de `src/features/` |
| §8 Epic List | derivação direta de §4 (FR) — escopo a ser refinado por @sm |

---

## 10. Next Steps

### 10.1 Imediato (Recomendação @pm para @po)

1. **@po `*validate`** este PRD (checklist 10 pontos)
2. **Reconciliação:** alinhar este PRD-mestre com `analise-modulos-dono-gerente-vendedor-2026-05-27.md` e PRDs de 22/05 — designar este como fonte canônica de visão estrutural e os demais como specs de implementação.
3. **@pm `*create-epic`** para EPIC-MX-01 a EPIC-MX-18 (após aprovação).

### 10.2 Médio prazo

1. **@architect** revisar §7 Technical Assumptions e gerar `front-end-architecture` complementar.
2. **@sm** quebrar épicos aprovados em stories priorizadas.
3. **@dev** alinhar implementação atual (`src/features/dashboard-loja`, `vendedor-home`) com o PRD-mestre.

### 10.3 Gates de Qualidade (Constitution)

- [x] **Article IV (No Invention):** Toda afirmação rastreada.
- [ ] **Article V (Quality First):** Aguarda QA gate via @qa após validação do @po.
- [ ] **Article III (Story-Driven):** Aguarda quebra em stories por @sm.

---

**Documento gerado por:** Morgan (@pm) sob handoff de Orion (@aiox-master) em modo YOLO/Auto.
**Próximo agente sugerido:** `@po *validate-story-draft` (adaptado para PRD).
