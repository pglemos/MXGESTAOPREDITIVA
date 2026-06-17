# EV-7 — PDI (Plano de Desenvolvimento Individual)

**Objetivo:** desenvolvimento profissional do vendedor — conquistas, competências e plano de ação — mantido **clean**, com visão de evolução.

**Fase:** Julho · **Status:** ✅ Done (execução técnica pronta para review).

**Arquivos atuais:** `src/pages/VendedorPDI.tsx`, `useMyPDISessions`.

---

## EV-7.1 — Conquistas, competências e plano de ação
**Status:** ✅ Done

**Como** vendedor, **quero** acompanhar conquistas, competências e plano de ação **para** orientar meu desenvolvimento individual.

**Critérios de aceitação:**
1. **Conquistas** por prazo: Curto (1 ano), Médio (2 anos), Longo (3 anos).
2. **Competências técnicas** (notas 6–10, alvo 10): Planejamento, Atendimento, Agendamento, Fechamento, Carteira, Mídias Sociais, Prospecção, Avaliação, Financiamentos, Processos.
3. **Competências comportamentais**: Pontualidade, Urgência, Iniciativa, Organização, Liderança, Relacionamento, Persistência, Resiliência.
4. **Plano de ação**: Ação, Competência, Descrição, Prazo, Status, Progresso (%).
5. Plano de ação vinculado às conquistas/competências.

**Notas técnicas:** `useMyPDISessions` deve ler sessões reais de PDI e manter plano de ação vinculado às competências/conquistas.

**Dependências:** nenhuma adicional; base de PDI atual.

---

## EV-7.2 — Visão de evolução da nota
**Status:** ✅ Done

**Como** vendedor, **quero** ver a evolução das minhas notas de competência ao longo do tempo **para** saber onde estou evoluindo e onde não.

**Critérios de aceitação:**
1. Gráfico/painel de **progresso** comparando sessões de PDI (evolução por competência).
2. Destaca o que está evoluindo e o que está estagnado.
3. Estilo "telinha de progresso" (como na trilha/aulas).

**Notas técnicas:** série temporal de avaliações por competência entre sessões de PDI.

**Dependências:** EV-7.1 com múltiplas sessões avaliadas.

---

## EV-7.3 — Autoavaliação do vendedor autônomo
**Status:** ✅ Done

**Como** vendedor autônomo, **quero** preencher minhas competências por formulário **para** ter PDI sem um gestor.

**Critérios de aceitação:**
1. Formulário de autoavaliação (o sistema "confia" no que ele declara).
2. Para vendedor de loja, as notas vêm do gestor (não autoavalia).
3. Pode incluir registro de **ponto** (horário que chegou/saiu) como dado comportamental.

**Notas técnicas:** fonte da nota deve registrar origem (`gestor` vs `autoavaliacao`) para não misturar comparações; autônomo não altera fluxo de loja.

**Dependências:** EV-12 (persona autônomo).

> ⚠️ **Decisão crítica:** o PDI **NÃO entra na composição do Score comparativo** (ver EV-9). PDI é "polimento/refinamento" — usado pelo gestor para refinar, não para ranquear.
