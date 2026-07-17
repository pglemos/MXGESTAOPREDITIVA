# P0-04 — Escalada cliente × oportunidade × vendedor

## Problema observado (hipótese inicial do prompt mestre)
Policy de `oportunidades` validaria apenas `seller_user_id = auth.uid()`, sem checar
se o `cliente_id` pertence ao mesmo vendedor/loja.

## Evidência

Policy encontrada em `20260609120000_mx_crm_vendedor_foundation.sql` (linhas 188-191),
nunca corrigida por migration posterior (`grep` confirmado em todas as migrations):

```sql
CREATE POLICY oportunidades_seller_rw ON public.oportunidades FOR ALL TO authenticated
  USING (seller_user_id = auth.uid())
  WITH CHECK (seller_user_id = auth.uid());
```

O mesmo padrão (`_seller_rw` só valida `seller_user_id`, nunca `cliente_id`) existe
também em `agendamentos_seller_rw` e `atendimentos_seller_rw`, na mesma migration —
o problema é sistêmico nas 3 tabelas, não isolado em `oportunidades`.

## Causa raiz
`WITH CHECK` nunca referencia `clientes`. Qualquer `authenticated` consegue
`INSERT`/`UPDATE` em `oportunidades`/`agendamentos`/`atendimentos` apontando
`cliente_id` para **qualquer** cliente existente (mesmo de outra loja), desde que
`seller_user_id = auth.uid()` na própria linha — o FK apenas exige que o UUID
exista, não que seja "seu".

## Descoberta importante durante a correção (evitou quebrar feature legítima)

A hipótese inicial do prompt ("cliente_id deve pertencer ao mesmo vendedor") está
**errada** para este produto. `20260710140000` e `20260716240000` documentam e
testam (`clientes.test.sql`) uma feature intencional: **um cliente pode ser
reaproveitado por outro vendedor da MESMA loja** (`pode_ler_cliente_por_oportunidade`
concede leitura do cliente enquanto a oportunidade própria do novo vendedor estiver
aberta). Exigir `clientes.seller_user_id = auth.uid()` na policy de `oportunidades`
teria quebrado esse fluxo (inclusive para a fixture já existente em
`setup.sql`, que modela exatamente esse caso).

O gap de segurança real é **cross-store** (cliente de OUTRA loja), não
cross-seller-mesma-loja (que é reuso legítimo).

## Fix aplicado

Migration `20260717060000_carteira_cross_seller_ownership_hardening.sql`, aplicada
em produção (`supabase db push`, confirmado via `db push --dry-run` antes/depois —
antes mostrava só essa migration pendente, depois mostrou "up to date"). Para as
3 tabelas, `USING`/`WITH CHECK` passam a exigir, além de `seller_user_id = auth.uid()`:

1. `cliente_id` (quando não nulo) pertence à MESMA `loja_id` da linha
   (`clientes.loja_id = tabela.loja_id`) — bloqueia cross-store;
2. o vendedor tem vínculo ativo com essa loja (`vendedores_loja.is_active`) —
   impede que alguém sem vínculo real com a loja escreva qualquer linha nela.

Reuso de cliente por outro vendedor da mesma loja continua permitido (não regride
a feature de `20260716240000`).

## Testes

Novo arquivo `supabase/tests/rls-matrix/oportunidades.test.sql` (registrado em
`runner.sql`), 7 asserts pgTAP:

1. INSERT p/ cliente compartilhado MESMA loja → permitido (feature preservada).
2. INSERT p/ cliente de OUTRA loja com loja_id também de outra loja → bloqueado (P0-04).
3. INSERT com loja_id própria mas cliente de outra loja (inconsistência) → bloqueado.
4. INSERT com `seller_user_id` falsificado → bloqueado (regressão do check original).
5. UPDATE de oportunidade própria (cliente/loja consistentes) → permitido.
6. INSERT anônimo → bloqueado.
7. UPDATE anônimo em massa → bloqueado.

Execução real desses testes depende do `rls-matrix.yml` (precisa de Docker/Supabase
local, indisponível neste ambiente de desenvolvimento) — vão rodar no CI do PR.
Testes unitários de `src/features/carteira-clientes/lib/` (adapter, mutation
coordinator, mappers) rodados localmente após o fix: **9 pass, 0 fail**, sem
regressão de contrato/tipo.

## Risco residual
- Reprodução "antes do fix" não foi executada via pgTAP local (sem Docker) —
  confio na leitura direta do SQL da policy (`USING (seller_user_id = auth.uid())`
  sem qualquer referência a `clientes`) como evidência da vulnerabilidade, não em
  suposição. Confirmação empírica via pgTAP acontece no CI do PR
  (`rls-matrix.yml`) antes do merge.
- `verify:db-types` está atualmente vermelho em `main` por causa do módulo Manager
  (SellerRoutineSnapshot/StoreTargetPlan), que chegou em 43 commits fora desta
  sessão sem rodar `npm run gen:db-types`. Não é causado por este fix (RLS não
  altera schema/tipos) e está fora do escopo Carteira — reportado separadamente,
  não corrigido aqui pra não misturar responsabilidades.
