# EPIC-MX-22 — Fechamento Diário do Vendedor (Data Operacional, D-1→D0, Histórico & Regularização)

**Data:** 2026-07-14
**Status:** Draft
**Tipo:** Brownfield
**Owner:** @pm (Morgan) — Strategist
**Spec fonte:** "Revisão Funcional Definitiva — Fechamento Diário do Vendedor" v2.0 (14/07/2026), status: regra funcional confirmada
**Epic pai/relacionado:** EPIC-MX-05 — Home Vendedor + Fechamento Diário (Story 5.4 é substituída em profundidade por este epic)
**Epic relacionado:** EPIC-MODULO-GERENCIAL-BASE44-REBUILD (contabilização, aprovação de regularização, snapshot D+1)
**Wave:** 3 — UI operacional
**Fuso oficial:** `America/Sao_Paulo`

---

## 0. Decisão Arquitetural (por que epic próprio e não expansão da Story 5.4)

Optou-se por **epic próprio (opção b)** em vez de reescrever a Story 5.4 dentro do EPIC-MX-05. O spec v2.0 não é um refinamento de UI: é uma correção de **modelagem de estado** (status por vendedor + data operacional + escopo, no lugar de status global), com 14 critérios de aceite formais (FEV-DATA-01..12, FEV-FORM-01..02), persistência/idempotência, transição D-1→D0 e integração auditável com o Módulo Gerencial — que vive em outro epic. Esse escopo transborda uma única story e exige um agrupamento próprio, rastreável e priorizado (P0/P1), mantendo o EPIC-MX-05 como guarda-chuva da Home Vendedor (meta, agenda, ranking, feedbacks, PDI), intocada por esta revisão. A Story 5.4 do EPIC-MX-05 passa a apontar para este epic como sua implementação definitiva.

---

## 1. Goal

Corrigir o Fechamento Diário do Vendedor para operar por **data operacional** (não por status global), garantindo transição imediata D-1→D0, hierarquia visual com card de contexto + formulário atual, persistência separada e idempotente por data/escopo, Histórico com Regularização auditável e integração contabilizável com o Módulo Gerencial. (Spec §1, §16)

---

## 2. Background

O problema central do Fechamento Diário não é visual: é uma falha de modelagem em que um `status global` bloqueia todas as datas, quando deveria existir `status por vendedor + data operacional + escopo`. A correção deve ocorrer em quatro níveis: (1) seleção da data operacional, (2) persistência separada de D-1 e D0, (3) hierarquia visual com card anterior + formulário atual, (4) integração auditável com Histórico e Módulo Gerencial. A política de horário deixa de ser questão em aberto: antes das 12:00 D-1 pendente pode ser priorizado; concluído D-1, D0 é liberado imediatamente; às 12:00+ D0 é sempre a data principal e D-1 pendente vai para o Histórico/Regularização. Edição rápida permanece na Rotina do Dia, não no Fechamento. (Spec §1, §2, §3, §16)

---

## 3. Acceptance Criteria

Todo AC rastreia a uma seção/critério específico do spec v2.0 (ver §6 Rastreabilidade).

| AC | Critério | Rastreio |
|---|---|---|
| **AC-01** | A tela trabalha por data operacional; nenhum status de uma data bloqueia globalmente a tela | Spec §1.1, §2.3, §2.4, §16 |
| **AC-02** | Antes de 12:00 com D-1 pendente, D-1 pode ser priorizado como tarefa; ao finalizar D-1, a tela troca imediatamente para D0 sem esperar 12:00 | Spec §3.1, §14 FEV-DATA-01, FEV-DATA-02 |
| **AC-03** | Às 12:00 ou depois, D0 é sempre a data principal; D-1 pendente move-se para Histórico/Regularização e nunca domina a tela | Spec §3.2, §14 FEV-DATA-03, FEV-DATA-04 |
| **AC-04** | A seleção de data principal, rótulo Hoje/Ontem, checkin carregado, bloqueio de formulário, card superior e ação principal são resolvidos por uma única camada `ActiveClosingContext` (pura e testável) | Spec §4, §5 |
| **AC-05** | D0 em andamento carrega o progresso real salvo; D0 inexistente inicia em 0% sem herança de D-1; D0 concluído bloqueia o formulário sem abrir D+1 antecipadamente | Spec §3.3, §3.4, §3.5, §14 FEV-DATA-05, FEV-DATA-06, FEV-DATA-07 |
| **AC-06** | Progresso, etapas, resumo e status pertencem sempre a `mainDate`; nunca há herança de progresso de D-1 em D0 | Spec §7.4, §7.5 |
| **AC-07** | A transição pós-finalização de D-1 segue a sequência de 12 passos; D-1 não é zerado no banco, apenas a representação do formulário ao mudar para D0 | Spec §6 |
| **AC-08** | Existe índice único por `seller_user_id + reference_date + metric_scope` (+ `store_id` quando aplicável); D-1 e D0 têm registros, rascunhos, progresso, status, timestamps, eventos e snapshots separados | Spec §2.4, §12.1, §12.2, §14 FEV-DATA-09 |
| **AC-09** | A finalização é idempotente: duplo clique, refresh ou retorno de rede produzem um único fechamento e uma única venda por evento, sem duplicidade, sem apagar D0, sem reabrir D-1 | Spec §12.3, §14 FEV-DATA-08 |
| **AC-10** | Hoje/Ontem e `reference_date` são calculados no fuso `America/Sao_Paulo`, não em UTC nem pela data do dispositivo, inclusive próximo à meia-noite | Spec §2.1, §2.2, §2.3, §14 FEV-DATA-09 |
| **AC-11** | Card verde "Fechamento anterior concluído" e card de alerta "Fechamento anterior pendente" exibem os textos e ações prescritos (Ver histórico, Ajustar/Regularizar dd/mm), abrindo a data do card | Spec §7.2, §7.3 |
| **AC-12** | Histórico expõe os estados mínimos e ações por estado; "Ajustar" carrega exatamente a data escolhida, gera diff, cria nova versão sem sobrescrever o original nem duplicar | Spec §8.1, §8.2, §8.3, §14 FEV-DATA-10 |
| **AC-13** | O campo "Observações Operacionais (Justificativa)" é removido do Ajustar; motivo de regularização é conceito separado; auditoria registra usuário, data, valores anteriores/novos e diferenças automaticamente | Spec §1.3, §8.4, §12.4, §14 FEV-DATA-10 |
| **AC-14** | Formulário Garantia: Responsável = lista oficial (usuários ativos/elegíveis da loja); Data = `reference_date + 1 dia`, Hora = 09:00; Descrição depende do Motivo via catálogo; "Outro" abre texto obrigatório | Spec §9.1, §14 FEV-FORM-01 |
| **AC-15** | Formulário Qualificado: campo "Passo atual da oportunidade" tem ícone de informação com ajuda operacional por status (significado, quando usar, efeito no Mentor, próxima ação, agendamento, temperatura, Rotina, métricas) | Spec §9.2, §14 FEV-FORM-02 |
| **AC-16** | Integração gerencial: no prazo contabiliza; D-1 pendente após 12:00 não contabiliza como oficial mas vira pendência gerencial; regularização aguardando não entra em Dashboard/Funil/Ranking; aprovada contabiliza e versiona; recusada preserva auditoria | Spec §10.1, §10.2, §14 FEV-DATA-11 |
| **AC-17** | Janela do Fechamento (12:00) e janela da Agenda D+1 (snapshot 09:31) são distintas; alterações após 09:31 geram log/versão e não reescrevem o snapshot silenciosamente | Spec §11.1, §11.2, §11.3, §14 FEV-DATA-12 |
| **AC-18** | Os estados de interface obrigatórios (carregando D-1/D0, salvando, finalizando, troca automática, erro, finalização já processada, regularização em análise/aprovada/recusada, erro de fuso, conflito de versão, sem conexão, retomada após refresh) estão cobertos | Spec §13 |

---

## 4. Stories Planejadas

| Story | Título | Resumo | Rastreio (spec §15) |
|---|---|---|---|
| **22.1** | ActiveClosingContext + regra D-1/D0 + hierarquia visual | Camada pura `getActiveClosingContext`, seleção da data operacional, regra antes/depois de 12:00, cards de D-1 concluído/pendente, ordem visual e rótulos; impedir herança de progresso | P0 #1, #2, #4, #5, #6 (§3, §4, §5, §7) |
| **22.2** | Transição D-1→D0, persistência e idempotência | Sequência de 12 passos pós-finalização, registros/rascunhos/status separados, índice único por vendedor+data+escopo, finalização idempotente, testes de fuso/refresh/idempotência | P0 #3, #7, #8 (§6, §12) |
| **22.3** | Histórico de Fechamentos + Regularização | Estados e ações por estado, botão Ajustar (diff, nova versão, sem sobrescrita/duplicidade), remover "Observações Operacionais (Justificativa)", auditoria automática | P0 #9, P1 #4 (§1.3, §8) |
| **22.4** | Formulários — Garantia & Qualificado | Garantia: responsável=lista oficial, data D+1/09:00, catálogo Motivo→Descrição com "Outro" obrigatório; Qualificado: ícone de ajuda operacional por status | P1 #1, #2, #3 (§9) |
| **22.5** | Integração com Módulo Gerencial | Contabilização por estado, pendência gerencial de D-1 atrasado, regularização aguardando/aprovada/recusada, conciliação da janela 12:00 com snapshot D+1 de 09:31 | P0 #10 (§10, §11) |
| **22.6** | Estados de interface & acabamento pós-finalização | Cobrir todos os estados obrigatórios de UI, melhorar textos pós-finalização e preservar navegação contextual | P1 #5, #6 (§13) |

> Backlog removido do escopo (Spec §15 "Remover"): "Decidir política oficial de horário do Fechamento" e "Avaliar se edição rápida deve voltar ao Fechamento" — ambas já resolvidas (política confirmada; edição rápida permanece na Rotina do Dia).

---

## 5. Dependencies

**Bloqueado por:**
- EPIC-MX-01 — Design System (cards, ícones, tipografia)
- EPIC-MX-02 — Perfis & Permissões (lista oficial de responsáveis / usuários ativos da loja — §9.1)
- EPIC-MX-05 — Home Vendedor + Fechamento Diário (contexto guarda-chuva; Story 5.4 apontará para este epic)

**Depende de coordenação com:**
- EPIC-MODULO-GERENCIAL-BASE44-REBUILD — contabilização, aprovação/recusa de regularização, snapshot D+1 09:31, pendência gerencial (§10, §11)

**Bloqueia:**
- EPIC-MX-07 — Dimensão Disciplina do score (penalização de atraso na regularização — §10.2)
- EPIC-MX-08 — Alertas sobre pendências de fechamento e regularização

---

## 6. Article IV — Rastreabilidade (No Invention — NON-NEGOTIABLE)

Toda linha rastreia ao spec v2.0 (14/07/2026). Nenhum requisito fora do spec foi introduzido.

| Item | Fonte no Spec |
|---|---|
| Tela por data operacional; sem status global bloqueante | §1.1, §2.3, §2.4, §16 |
| Regra antes/depois de 12:00; liberar D0 ao concluir D-1 | §3.1, §3.2 |
| D0 em andamento / inexistente / concluído | §3.3, §3.4, §3.5 |
| Camada `ActiveClosingContext` (tipo e pseudológica) | §4, §5 |
| Sequência de transição D-1→D0 (12 passos) e proibição de zerar D-1 | §6 |
| Hierarquia visual, cards verde/alerta, rótulos, progresso de mainDate | §7 |
| Histórico: estados, ações, botão Ajustar, campo removido | §8, §1.3 |
| Garantia: responsável/lista, data D+1 09:00, catálogo Motivo→Descrição | §9.1 |
| Qualificado: ícone de ajuda operacional por status | §9.2 |
| Integração gerencial: contabilização e responsabilidades | §10 |
| Janela 12:00 × snapshot D+1 09:31 | §11 |
| Persistência: índice único, separação D-1/D0, idempotência, auditoria | §12 |
| Estados de interface obrigatórios | §13 |
| Critérios de aceite FEV-DATA-01..12, FEV-FORM-01..02 | §14 |
| Backlog P0/P1 e itens removidos | §15 |
| Veredito (falha de modelagem de estado) | §16 |

---

## 7. Next Step

@sm `*draft` das stories deste epic, começando por **22.1** (ActiveClosingContext + regra D-1/D0 + hierarquia visual) por ser fundação P0 das demais. Sequência sugerida: 22.1 → 22.2 → 22.3 → 22.4 → 22.5 → 22.6.

Atualizar EPIC-MX-05 Story 5.4 para referenciar este epic como implementação definitiva do Fechamento Diário (ação de @po/@sm no draft).
