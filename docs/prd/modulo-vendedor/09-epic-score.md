# EV-9 — Score do Vendedor (composição)

**Objetivo:** consolidar um score que gera histórico profissional e ranking — comparável entre vendedores de forma **justa**.

**Fase:** Julho/Agosto · **Status:** 🆕 Novo (decisão de composição mudou na reunião — recompor antes de implementar).

**Arquivos atuais:** `score_calculations`, RPC `compute_individual_score_mvp` (migration `20260609140000`), `useMeuScore`.

---

## EV-9.1 — Recompor o Score do Vendedor
**Status:** 🆕 Novo · ⚠️ Bloqueado por decisão de pesos

**Como** produto, **quero** um score que reflita resultado + disciplina + desenvolvimento **para** ranquear e gerar histórico.

**Contexto / decisão da reunião:**
- A spec original previa **35% Resultado, 25% Disciplina, 15% Treinamentos, 10% Feedback, 15% PDI**.
- ⚠️ **O PDI NÃO pode entrar na comparação** ("o PDI é a parte, é o polimento/refinamento do score"). Motivo: comparar autônomo vs vendedor de loja em pé de igualdade.
- ⇒ **Os pesos precisam ser redefinidos** removendo o PDI da composição comparativa (redistribuir os 15%).

**Critérios de aceitação:**
1. Definir nova composição **sem PDI** na nota comparativa (proposta a validar: Resultado 40% / Disciplina 30% / Treinamentos 20% / Feedback 10% — **a confirmar com Daniel**).
2. Fontes por dimensão:
   - **Resultado:** vendas/meta (`lancamentos_diarios` / oportunidades ganhas).
   - **Disciplina:** rotina + fechamentos (7 dias) — `daily-routine`.
   - **Treinamentos:** progresso de trilhas + presenças em aulas (`progresso_treinamentos`, `aula_presencas`).
   - **Feedback:** % de devolutivas confirmadas (engajamento).
3. O **PDI fica como camada de refinamento** (o gerente ajusta), não soma na nota comparativa.
4. O **gerente refina** o score (semanal/mensal) — valida se o sistema não está "alucinando" pelo que o vendedor declarou.

**Notas técnicas:** alterar RPC `compute_individual_score_mvp` e dims em `score_calculations`; impacta gestão, ranking e histórico de **todos os perfis** → fazer com cuidado, sessão dedicada, após confirmação dos pesos.

**Dependências:** EV-5 (treinamentos), EV-6 (feedback), EV-7 (PDI como refinamento), EV-12 (comparação justa autônomo).

---

## EV-9.2 — Refinamento do gestor
**Status:** 🆕 Novo

**Como** gerente, **quero** ajustar/validar o score do vendedor **para** corrigir distorções do auto-reporte.

**Critérios de aceitação:**
1. Gerente tem controle de refinamento (mensal/semanal) sobre o score.
2. Auditoria do ajuste (quem, quando, quanto).
3. Vendedor autônomo não tem refinamento de gestor (score puro do sistema).

**Notas técnicas:** registrar refinamentos em tabela auditável vinculada ao score calculado; cálculo final deve preservar o score bruto e o score refinado.

**Dependências:** EV-9.1 e EV-12.
