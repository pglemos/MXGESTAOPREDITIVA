# P0-05 / P1-01 — Reconciliação de dados (Carteira de Clientes)

**Modo:** documentação apenas — nenhuma escrita foi feita no banco (decisão do responsável
pelo produto: gerar relatório e classificação primeiro, consolidar depois).

## Método
Consultas read-only via Supabase Management API (`database/query`, token pessoal fornecido
para esta sessão), diretamente contra produção (`fbhcmzzgwjdgkctlfvbo`). Sem Docker/CLI local
para `psql`/`dump`, essa foi a única via de leitura direta disponível.

## P0-05 — Oportunidades abertas duplicadas

- Total de oportunidades abertas (`closed_at IS NULL AND etapa NOT IN ('ganho','perdido')`): **41**
- Total de clientes: **59**
- Clientes com 2+ oportunidades abertas simultâneas: **4**

| Cliente | Qtd oportunidades abertas | Classificação | Evidência |
|---|---|---|---|
| `0726c743-f194-…` | 8 | **DUPLICIDADE_CLARA** | Mesmo vendedor, mesma loja, mesmo estágio (`prospeccao`), veículos com valores de teste ("teste", "teste123v dsf asdasdasdasd", "1231"), criadas em cluster de minutos/horas entre 24-26/06. Só 2 das 8 têm agendamento vinculado. |
| `4e6f7ee4-d5d5-…` | 2 | **DUPLICIDADE_CLARA** | Mesmo veículo ("GOL 1.0") nas duas, criadas 1 dia de diferença, estágios `fechamento`→`negociacao` (regressão de estágio via linha nova em vez de UPDATE). |
| `5b2a1d4b-6869-…` | 3 | **DUPLICIDADE_CLARA** | Duas com veículo "HB20 Comfort QA" (nome já indica teste) + uma com valor numérico solto ("5500075"), todas em 2 minutos. |
| `b5be4a83-d902-…` | 2 | **NEGOCIACOES_DISTINTAS — NÃO MEXER** | Veículos genuinamente diferentes ("HB20 1.0 2023" vs "TUCSON GL 2.0 AUTOMATICA"), ambas com agendamento próprio, 1 dia de diferença — cross-shopping legítimo do cliente entre dois carros. |

CSV completo (15 linhas, todos os campos pedidos: cliente_id, cliente_nome, loja_id,
seller_user_id do cliente e da oportunidade, etapa, valor, veículo, timestamps,
agendamentos/eventos relacionados, classificação, ação proposta):
`docs/audits/oportunidades-abertas-reconciliation-before.csv`

**Observação importante:** os 4 clientes com duplicidade têm nomes/veículos claramente de
teste/QA ("teste", "HB20 Comfort QA", "teste123v..."). Não é dado de cliente real — o risco
de qualquer consolidação é baixo, mas a ação ainda não foi executada, conforme decisão do
responsável (só relatório por enquanto).

### Ação proposta (não executada)
Para os 3 grupos `DUPLICIDADE_CLARA`: manter a oportunidade com mais atividade
(agendamentos/eventos vinculados) ou, no empate, a mais recente; marcar as demais como
encerradas por duplicidade via um campo/motivo explícito (nunca `DELETE`), preservando
`id` e qualquer `agendamento`/`evento` que aponte pra elas (reapontar pra oportunidade
consolidada antes de encerrar as outras). `b5be4a83` fica intocado.

### Garantia contra recorrência (avaliada, não implementada)
A tabela já tem uma coluna `idempotency_key` em `oportunidades`, mas está `NULL` em
100% das linhas amostradas — não está sendo populada nem tem constraint única. Duas
opções pra evitar recorrência, a decidir com o dono do produto:
1. Popular `idempotency_key` no fluxo de criação (frontend/RPC) e criar índice único
   parcial `(cliente_id, idempotency_key) WHERE idempotency_key IS NOT NULL` — não quebra
   negociações legítimas simultâneas (cada uma teria sua própria key), só evita reenvio
   duplicado do mesmo clique/form.
2. Se o objetivo for impedir 2 oportunidades **abertas** simultâneas por cliente
   independente de veículo (mais restritivo, quebraria o caso legítimo `b5be4a83`) —
   **não recomendado** dado o cross-shopping real observado.
Recomendação: opção 1.

## P1-01 — Agendamentos sem cliente_id

- Total: **4** agendamentos com `cliente_id IS NULL`
- Dos 4, **0 têm `oportunidade_id` preenchido** — ou seja, **nenhum pode ser inferido
  automaticamente** pela regra `UPDATE ... SET cliente_id = oportunidades.cliente_id`
  proposta no prompt mestre, porque não há oportunidade pra puxar o cliente de.
- Todos os 4 pertencem à mesma loja (`467a19d1-…`), 2 vendedores, criados entre
  07-07 e 07-08. Não há padrão de ambiguidade — são registros genuinamente órfãos
  (nem cliente nem oportunidade), provavelmente criados via fluxo manual/teste sem
  vincular nada.
- **Nenhuma migration de correção é aplicável.** Ficam documentados como
  não-corrigíveis automaticamente; correção exigiria decisão manual (qual cliente é
  esse agendamento) que não há como inferir dos dados.

CSV: `docs/audits/agendamentos-reconciliation-after.csv` (nome mantido conforme convenção
do prompt mestre, mas neste caso é "situação atual", já que não houve `UPDATE`).

## Risco residual
- Nenhuma escrita foi feita — achados documentados, aguardando decisão de consolidação.
- Amostra é pequena (4 grupos de duplicidade, 4 agendamentos órfãos) e parece ser dado de
  teste/QA, não produção real — mas a mesma classificação/metodologia se aplica igual se
  o dataset crescer.
