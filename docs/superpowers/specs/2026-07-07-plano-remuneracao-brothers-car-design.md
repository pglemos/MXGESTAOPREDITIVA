# Plano salarial "Brothers Car" — motor de comissão/bônus por faixa de loja

## Contexto

Dono trouxe uma planilha (`Plano_Salarial_Vendedores_BROTHERS CAR.xlsx`) com um plano salarial completo pra vendedor. Objetivo: pré-configurar esse plano na loja de testes da MX (**MX CONSULTORIA**, `loja_id = 467a19d1-af51-4b4f-9b05-d67187a2a759`), funcionando de ponta a ponta pros 3 perfis:

- **Dono/gerente**: podem editar o plano totalmente (tela Configurações → Remuneração já existe e já dá CRUD completo).
- **Vendedor**: enxerga o resultado calculado, somente leitura (tela Minha Remuneração já existe e já é read-only).

Contas de teste já existentes na loja:
- `dono@mxgestaopreditiva.com.br`
- `gerente@mxgestaopreditiva.com.br`
- `vendedor@mxgestaopreditiva.com.br`
- `mari.vendedor@mxgestaopreditiva.com.br`
- `jose.vendedor@mxgestaopreditiva.com.br`
- `daniel.vendedor@mxgestaopreditiva.com.br`

## Regra do plano (fonte: planilha, aba Premissas)

Para um vendedor com X carros vendidos no mês:

1. Fixo: R$ 1.500
2. Comissão: R$ 500 × carros vendidos pelo vendedor
3. Bônus individual: R$ 1.000 se o vendedor vender ≥ 8 carros no mês
4. Bônus coletivo (só paga se o vendedor bateu o próprio mínimo de 8 carros — sem "carona"):
   - loja ≥ 35 carros no mês → +R$ 100 por carro vendido pelo vendedor
   - loja ≥ 40 carros no mês → +R$ 1.000
   - loja ≥ 45 carros no mês → +R$ 1.000
   - loja ≥ 50 carros no mês → +R$ 1.000
   - Faixas são **cumulativas** (bater 50 soma as 4).
5. Bônus de carreira (mérito — tempo de casa/comportamento/volume, atribuição manual do dono/gerente, sem fórmula automática):
   - nível "pleno" → +R$ 800
   - nível "líder" → +R$ 800

Exemplo de verificação (vendedor com 8 carros, loja com 50 carros):
1.500 + 4.000 (comissão) + 1.000 (individual) + 800 (faixa 35, 8×100) + 1.000 (faixa 40) + 1.000 (faixa 45) + 1.000 (faixa 50) = **R$ 10.300** — bate com a planilha.

## Estado atual do sistema (já mapeado)

- `remuneracao_planos` (cargo, salario_fixo, salario_variavel, beneficios) + `remuneracao_regras` (tipo, valor, percentual_meta_min, tipo_veiculo, ativo, vigencia_inicio) já existem, com RLS: dono/gerente da loja escrevem, vendedor só lê.
- Motor de cálculo puro em `src/features/remuneracao/lib/comparativo.ts` (`calcularRemuneracaoEstimada`), consumido por:
  - `CadastroPlanos.tsx` / `CadastroRegras.tsx` (tela dono/gerente, CRUD)
  - `useMinhaRemuneracaoDashboard.ts` → `MinhaRemuneracaoPage.tsx` (tela vendedor, read-only)
- Gap identificado: tipo `comissao_equipe` hoje só suporta **um único patamar vencedor** (não cumulativo) avaliado contra **percentual de meta em R$ da loja** (`atingimentoLojaPercentual`). O plano Brothers Car exige contagem **absoluta de carros** da loja, **cumulativa**, e **travada** ao vendedor já ter batido o mínimo individual — não suportado hoje.
- Achado: o campo `atingimentoLojaPercentual` passado hoje pro motor (via `useVendedorHomePage.ts`) na verdade carrega o atingimento **individual** do vendedor, não o da loja — nome enganoso, comportamento correto pro uso atual (não é bug a corrigir aqui, só não serve pro que precisamos).
- Bônus individual (item 3 do plano) **não pode reaproveitar `bonus_meta` como estava previsto** — investigado e a meta individual por vendedor não existe de fato hoje: `useGoals()` retorna `sellerGoals: []` fixo (hardcoded), então `meta` em `useSellerMetrics` sempre cai no fallback de dividir a meta em R$ da loja (`regras_metas_loja.monthly_goal`) igualmente entre vendedores — não é uma meta em carros configurável por vendedor. Construir esse sistema de meta individual do zero é escopo maior que essa entrega. Solução: `bonus_meta` passa a aceitar `unidade_meta_min` também, comparando direto contra `vendasConsideradas` (carros do próprio vendedor no período) — mesma mecânica nova usada em `comissao_equipe`, sem depender do sistema de metas em R$ da loja.
- Não existe hoje nenhum conceito de "nível de carreira" (júnior/pleno/líder) no sistema.

## Mudanças de schema (migration nova)

**`remuneracao_regras`** — colunas novas (aditivas, `IF NOT EXISTS`):
- `unidade_meta_min integer null` — limiar absoluto (carros), usado no lugar de `percentual_meta_min` quando presente.
- `cumulativo boolean not null default false` — se true, soma todos os patamares atingidos em vez de aplicar só o maior.
- `valor_por_unidade boolean not null default false` — se true, `valor` é multiplicado pelos carros vendidos pelo próprio vendedor (não é valor fixo).
- `requer_bonus_individual boolean not null default false` — se true, a regra só se aplica se o vendedor já bateu o próprio bônus individual (`bonus_meta`) no período.
- enum `remuneracao_regra_tipo` ganha valor `bonus_carreira`.
- coluna `nivel_carreira text null` (reaproveita o padrão já usado por `tipo_veiculo` em `comissao_categoria`) para as regras `bonus_carreira`.

**`vendedor_nivel_carreira`** (tabela nova, não coluna em `vendedor_perfil`):
`vendedor_perfil` tem RLS `vendedor_perfil_seller_rw` que dá RW total da própria linha ao vendedor (owner-only write); dono/gerente só têm SELECT nela (`vendedor_perfil_store_read`). Colocar `nivel_carreira` ali quebraria a exigência "vendedor não edita esse campo" — RLS do Postgres é por linha, não por coluna. Por isso vai em tabela dedicada:
- `id uuid pk`, `seller_user_id uuid unique references usuarios(id)`, `loja_id uuid references lojas(id)`, `nivel_carreira text not null default 'junior' check in ('junior','pleno','lider')`, `updated_by uuid references usuarios(id)`, `created_at`, `updated_at`.
- RLS: dono/gerente da loja (via `tem_papel_loja`) fazem RW; vendedor só SELECT da própria linha (`seller_user_id = auth.uid()`).

Todas as colunas novas são opcionais/têm default — zero impacto em planos/regras já cadastrados de outras lojas (comportamento legado continua igual quando os campos novos ficam null/false).

## Mudanças no motor (`comparativo.ts`)

1. Novo input em `RemuneracaoEstimadaInput` / `RemuneracaoResumoVendedorInput`: `carrosVendidosLoja?: number` e `nivelCarreira?: 'junior' | 'pleno' | 'lider'`. A contagem absoluta de carros da loja já existe pronta em `src/hooks/useStoreSales.ts` → `stats.storeTotalVendas` (soma `vnd_total` do ranking da loja no mês, já considerando a regra `include_venda_loja_in_store_total`) — é essa fonte que `useVendedorHomePage.ts` vai passar pro motor.
2. `bonus_meta`: quando a regra tem `unidade_meta_min` preenchido, o patamar é avaliado contra `vendasConsideradas` (carros do próprio vendedor) em vez de `atingimentoPercentual` (mantém o comportamento por percentual pras regras existentes de outras lojas, que não usam esse campo). Continua pegando só o maior patamar (comportamento não-cumulativo já existente, correto pro bônus individual — não há múltiplos patamares nesse caso).
3. `comissao_equipe`: quando a regra tem `unidade_meta_min` preenchido, comparar contra `carrosVendidosLoja` em vez de `atingimentoLojaPercentual`. Quando `cumulativo`, somar **todas** as regras cujo limiar foi atingido (hoje pega só a de maior patamar). Quando `valor_por_unidade`, `valor_aplicado = regra.valor × vendasConsideradas` (carros do próprio vendedor). Quando `requer_bonus_individual`, só entra na soma se `regraBonusAplicada` (do cálculo de `bonus_meta`, já recalculado com a lógica do item 2) for não-nulo.
4. Novo componente `bonusCarreira` (campo próprio no resultado, separado de `comissao`/`bonus` pra ficar claro no extrato que é mérito, não venda): lookup de regra `bonus_carreira` por `nivelCarreira`, mesmo padrão de `selecionarRegraMaisRecentePorTipoVeiculo` (reindexado por `nivel_carreira` em vez de `tipo_veiculo`). Somado direto no `total` final. Item próprio em `formulaItens` (chave `bonus_carreira`).
5. `formulaItens` ganha entradas descritivas pros novos componentes (faixas de loja aplicadas, bônus de carreira) — a tela `CalculationDetailsDrawer` já renderiza esse array genericamente.
6. Compatibilidade: regras existentes de outras lojas (`percentual_meta_min`, sem os campos novos) continuam calculando exatamente como hoje — os novos ramos só disparam quando os campos novos estão preenchidos.

## Dados semeados (só loja MX CONSULTORIA, cargo `vendedor`)

- `remuneracao_planos`: sobrescrever a linha existente → `salario_fixo=1500, salario_variavel=0, beneficios=0`.
- `remuneracao_regras` (todas `ativo=true`, `vigencia_inicio` = hoje):
  - `comissao_por_venda`, `valor=500`
  - `bonus_meta`, `percentual_meta_min=100`, `valor=1000`
  - `comissao_equipe`, `unidade_meta_min=35`, `cumulativo=true`, `valor_por_unidade=true`, `valor=100`, `requer_bonus_individual=true`
  - `comissao_equipe`, `unidade_meta_min=40`, `cumulativo=true`, `valor=1000`, `requer_bonus_individual=true`
  - `comissao_equipe`, `unidade_meta_min=45`, `cumulativo=true`, `valor=1000`, `requer_bonus_individual=true`
  - `comissao_equipe`, `unidade_meta_min=50`, `cumulativo=true`, `valor=1000`, `requer_bonus_individual=true`
  - `bonus_carreira`, `nivel_carreira='pleno'`, `valor=800`
  - `bonus_carreira`, `nivel_carreira='lider'`, `valor=800`
- Meta individual mensal (carros) dos 4 vendedores = 8 (via tabela de metas por vendedor já existente — não `store_meta_rules`, que é em R$).
- `vendedor_nivel_carreira` (uma linha por vendedor):
  - `vendedor@mxgestaopreditiva.com.br` → `lider`
  - `mari.vendedor@mxgestaopreditiva.com.br` → `pleno`
  - `jose.vendedor@mxgestaopreditiva.com.br` → `junior`
  - `daniel.vendedor@mxgestaopreditiva.com.br` → `junior`

## Mudanças de UI

- `CadastroRegras.tsx` (dono/gerente): campos novos condicionais por tipo — `unidade_meta_min`, `cumulativo`, `valor_por_unidade`, `requer_bonus_individual` quando tipo = comissão de equipe; seletor `nivel_carreira` quando tipo = bônus de carreira.
- Tela de gestão de equipe (dono/gerente): campo "Nível de carreira" por vendedor (júnior/pleno/líder).
- `MinhaRemuneracaoPage.tsx` / `CalculationDetailsDrawer`: nenhuma mudança estrutural — já renderiza `formulaItens`/`regrasAplicadas` genericamente; só precisa dos novos itens populados pelo motor.

## Fora de escopo

- Outras lojas do sistema (schema é aditivo e não quebra nada existente, mas não semeamos dados em nenhuma outra loja).
- Correção do nome `atingimentoLojaPercentual` (mantido como está, só passamos a não depender dele pro bônus coletivo).
- Automação de promoção de nível de carreira (fica manual, dono/gerente decide).

## Aplicação em ambiente

Projeto Supabase `fbhcmzzgwjdgkctlfvbo` — MCP sem permissão nesse projeto (confirmado de novo nesta sessão). Aplicar migration via CLI linked (`supabase db push --linked`, cuidado com as 3 migrations out-of-order já conhecidas — mover pra fora antes do push e restaurar depois). Depois `npm run gen:db-types` + `npm run typecheck`.
