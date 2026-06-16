# EV-12 — Multi-tenancy (Vendedor de Loja vs Autônomo)

**Objetivo:** suportar o vendedor **avulso** (R$ 49,90/mês) como produto separado, convivendo com o vendedor de loja, com migração de dados entre os dois mundos. É a base de várias regras de visibilidade.

**Fase:** Julho → (fundação cedo, pois governa visibilidade de EV-6, EV-7, EV-8, EV-9, EV-11) · **Status:** 🆕 Novo.

---

## EV-12.1 — Tipo de vínculo do vendedor
**Status:** 🆕 Novo · fundação

**Como** sistema, **quero** distinguir vendedor de loja de autônomo **para** aplicar regras de visibilidade e configuração.

**Critérios de aceitação:**
1. Atributo de vínculo: **loja (pacote principal)** vs **autônomo**.
2. Governa: comissionamento (herdado vs próprio — EV-8.3), feedback (gerente vs autônomo — EV-6.5), PDI (avaliado vs autoavaliado — EV-7.3), Carreira/Mercado (oculto vs visível — EV-8.4/EV-11.2), refinamento de score (sim vs não — EV-9.2).
3. Telas exclusivas de um lado ficam **ocultas** (não quebradas) para o outro.

**Notas técnicas:** flag em `usuarios`/`vendedor_perfil` ou derivada do vínculo de loja + assinatura. Definir fonte canônica.

---

## EV-12.2 — Migração de dados por CPF/e-mail
**Status:** 🔮 Futuro

**Como** vendedor, **quero** levar meu histórico/carteira ao trocar de loja **para** não recomeçar do zero.

**Critérios de aceitação:**
1. Vínculo de identidade por **CPF/e-mail**.
2. Ao migrar (autônomo→loja, loja→loja, loja→autônomo), histórico, carteira e cadastro acompanham.
3. Vendedor avulso que entra em loja-cliente **importa** seus dados para o ambiente da loja.

---

## EV-12.3 — Assinatura avulsa (R$ 49,90/mês)
**Status:** 🔮 Futuro

**Como** vendedor autônomo, **quero** assinar o sistema sozinho **para** ter gestão do meu dia.

**Critérios de aceitação:**
1. Plano avulso R$ 49,90/mês.
2. Apenas funcionalidades aplicáveis ao autônomo ativas; o resto oculto.
3. Pode ser o único vendedor da sua loja usando o sistema.
