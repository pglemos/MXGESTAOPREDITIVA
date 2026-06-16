# EV-8 — Meu Perfil + Comissionamento

**Objetivo:** o Meu Perfil é o **cadastro-base** do vendedor (rotina, objetivos, formação=currículo, remuneração). Alimenta a Central (jornada), a Trilha (maturidade), a comissão (modelo) e o Mercado de Trabalho (currículo).

**Fase:** Julho · **Status:** 🔧 Parcial (cadastro de rotina/objetivos/carreira existe; falta comissionamento configurável, campos de maturidade e ocultar Carreira para vendedor de loja).

**Arquivos atuais:** `src/features/crm/MeuPerfilVendedor.container.tsx`, `useVendedorPerfil`, tabela `vendedor_perfil`.

---

## EV-8.1 — Cadastro (rotina, objetivos, formação)
**Status:** ✅ Done

**Critérios de aceitação:**
1. Dados pessoais e profissionais.
2. **Horário de trabalho** (entrada, almoço, saída, dias) — define a Rotina do Dia na Central (EV-3.3).
3. Objetivos curto/médio/longo prazo.
4. Formação (treinamentos/certificações) = base do currículo do Mercado de Trabalho.
5. Edição real persistida em `vendedor_perfil`.

---

## EV-8.2 — Campos de maturidade (tempo de mercado, experiência, cargo)
**Status:** 🆕 Novo

**Como** sistema, **quero** saber tempo de mercado, experiência e cargo do vendedor **para** atribuir a trilha (N1–N4) e calibrar a estratégia.

**Critérios de aceitação:**
1. Campos: tempo de mercado, experiência declarada, cargo.
2. Usados pela regra de atribuição de trilha (EV-5.3).
3. Parte do currículo (Mercado de Trabalho).

**Notas técnicas:** adicionar campos a `vendedor_perfil`; migration.

---

## EV-8.3 — Comissionamento configurável
**Status:** 🆕 Novo

**Como** vendedor/gestor, **quero** configurar o modelo de comissão **para** o sistema calcular minha remuneração corretamente.

**Critérios de aceitação:**
1. Modelos suportados:
   - **Valor fixo por carro**.
   - **Percentual** sobre valor vendido / faturamento.
   - **Por categoria de veículo** (carro/moto/caminhão — exige `tipo_veiculo` na venda, EV-1.2).
   - **Bônus por patamar** (ex.: atingiu 6 carros → bônus X acrescido).
   - **Comissão de equipe** pela meta da loja (só vendedor de loja; entra como "plus").
2. **Vendedor de loja:** herda o plano cadastrado pelo **RH/dono** (departamento RH); **não** configura.
3. **Vendedor autônomo:** configura o próprio modelo nas Configurações.
4. O cálculo da tela de Comissão usa o valor/faturamento das vendas (não só contagem).

**Notas técnicas:** estender o motor de remuneração (`regras_remuneracao`/`useRemuneracao`) para percentual/categoria/bônus/equipe; herança loja→vendedor; flag autônomo.

**Dependências:** EV-1.2 (tipo de veículo), EV-12 (persona).

---

## EV-8.4 — Ocultar "Oportunidades de Carreira" para vendedor de loja
**Status:** 🆕 Novo (decisão imediata)

**Como** dono de loja, **quero** que o vendedor vinculado **não** veja "Oportunidades de Carreira" **para** não estimular saída.

**Critérios de aceitação:**
1. O card/aba "Oportunidades de Carreira" do Meu Perfil **não aparece** para vendedor vinculado a loja com pacote principal.
2. Aparece apenas para **autônomo**.
3. Como o conceito de autônomo ainda não existe no sistema, hoje o card fica **oculto para todos** (até EV-12).

**Dependências:** EV-12.
