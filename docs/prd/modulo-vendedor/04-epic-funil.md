# EV-4 — Funil de Vendas (estratégia por canal)

**Objetivo:** responder a pergunta central — **"o que você precisa fazer para bater sua meta?"** — substituindo a calculadora do fim do dia. Inteligência por canal real da loja/vendedor.

**Fase:** Julho · **Status:** ✅ Done (execução técnica pronta para review).

**Arquivos atuais:** `src/features/crm/FunilVendedor.container.tsx`, `useStoreMetaRules`, `useVendedorHomePage`.

---

## EV-4.1 — Cards superiores e "o que falta por canal"
**Status:** ✅ Done

**Como** vendedor, **quero** ver quanto falta por canal para bater minha meta **para** ajustar meu esforço antes do fim do mês.

**Critérios de aceitação:**
1. Cards: Minha Meta, Minha Comissão, Ritmo Atual, Conversão Geral.
2. Bloco "O que falta para bater a meta" por canal: Internet (quantos leads faltam), Carteira (quantos agendamentos), Porta (quantos atendimentos) — via benchmarks de conversão da loja.
3. Ritmo ("1 carro a cada 3 dias") com senso de urgência.
4. Assistente Comercial com insights (leads/dia necessários, melhor canal, carteira sem agendamentos).

**Notas técnicas:** `FunilVendedor.container.tsx` deve usar metas, lançamentos e benchmarks reais da loja; sem benchmark, exibir estado de configuração pendente.

**Dependências:** metas/benchmarks de loja e EV-1 para produção diária.

---

## EV-4.2 — Estratégia pela distribuição real por canal
**Status:** ✅ Done

**Como** vendedor, **quero** que o funil priorize meu canal mais forte (pela minha venda real dos últimos 3 meses) **para** receber uma estratégia que faz sentido pra mim.

**Critérios de aceitação:**
1. O sistema calcula a **distribuição de vendas por canal** nos últimos 3 meses (ex.: 60% internet).
2. A estratégia "o que falta" é **ponderada** pelo canal mais forte (não padrão fixo).
3. Alternativa de cadastro manual no perfil ("quanto % você vende de porta/internet/carteira") como override.

**Notas técnicas:** agregar vendas (`oportunidades` ganhas) por canal por período; expor no funil.

**Dependências:** EV-1.2 para canal/tipo de venda completo e CRM com oportunidades ganhas.

---

## EV-4.3 — Ocultar canais que a loja não tem
**Status:** ✅ Done

**Como** vendedor de loja sem porta (ex.: PlayMotors), **quero** não ver estatística de Porta **para** não poluir minha estratégia.

**Critérios de aceitação:**
1. Canais sem operação (sem vendas/sem config) **não exibem** card/estratégia.
2. Configuração de canais ativos por loja (consultoria define) ou inferida pela distribuição real (canal com 0% por 3 meses some).
3. Loja "shopping" com 60% porta dá destaque a Porta; PlayMotors foca Internet/Carteira.

**Notas técnicas:** a lista de canais ativos deve vir da configuração da loja ou do agregado validado em EV-4.2; ocultar sem quebrar totais e percentuais.

**Dependências:** EV-4.2.
