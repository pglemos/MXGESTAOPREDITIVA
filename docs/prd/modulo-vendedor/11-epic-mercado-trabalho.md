# EV-11 — Mercado de Trabalho MX

**Objetivo:** transformar o sistema num **ecossistema de contratação** — o score do vendedor vira currículo vivo; donos contratam pela performance real.

**Fase:** Novembro · **Status:** 🔮 Futuro (estratégico).

---

## EV-11.1 — Vitrine de vagas e currículo (opt-in)
**Status:** 🔮 Futuro

**Como** vendedor, **quero** ver vagas da minha região e expor meu score **para** crescer na carreira.

**Critérios de aceitação:**
1. Aba "Mercado" lista vagas abertas na região do vendedor.
2. Vendedor decide se **se cadastra** (opt-in) — currículo + score visível ao dono contratante.
3. Currículo = dados do Meu Perfil (formação, objetivos, histórico, carteira).
4. Se não se cadastrar, ninguém vê seu desempenho.

**Notas técnicas:** criar entidade de candidatura/perfil público com opt-in explícito; nunca expor score/currículo sem consentimento e regra de visibilidade EV-11.2.

**Dependências:** EV-8.1, EV-9 e EV-12.

---

## EV-11.2 — Regra de visibilidade (proteção ao lojista)
**Status:** 🔮 Futuro · ⚠️ regra comercial crítica

**Como** dono de loja com pacote principal, **quero** que meus vendedores **não** apareçam no Mercado **para** não perdê-los.

**Critérios de aceitação:**
1. Vendedor vinculado a loja com **pacote principal** é **bloqueado** do Mercado de Trabalho.
2. Mercado habilitado apenas para **autônomos** (ou vendedores não vinculados).
3. "Oportunidades de Carreira" no perfil segue a mesma regra (EV-8.4).
4. Público principal é o **dono** — a visibilidade parte do interesse dele.

**Notas técnicas:** RLS/consulta do Mercado deve bloquear vendedores vinculados ao pacote principal antes de qualquer filtro de busca; regra compartilhada com Meu Perfil.

**Dependências:** EV-12 (distinção loja vs autônomo).

---

## EV-11.3 — Opção de mentoria/aula paga (autônomo)
**Status:** 🔮 Futuro

**Como** vendedor autônomo, **quero** poder comprar mentoria/aula mensal **para** acelerar meu desenvolvimento.

**Critérios de aceitação:**
1. Autônomo pode contratar aula/mentoria mensal por tema (modelo histórico do Daniel: aula semanal por papel).
2. Acesso liberado conforme compra.

**Notas técnicas:** tratar como produto avulso do autônomo, vinculado a assinatura/compra; liberar acesso por entitlement auditável.

**Dependências:** EV-12.3 e EV-5.
