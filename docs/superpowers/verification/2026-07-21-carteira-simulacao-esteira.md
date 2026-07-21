# Evidências de verificação: esteira em simulação de vendedor

## Causa reproduzida

- A interface simulava o perfil de vendedor apenas no estado React.
- O adapter persistia com o `auth.uid()` real do administrador.
- O Postgres recusava a mutação com `Vendedor sem vínculo ativo com loja.`.

## TDD

- RED: contexto de simulação inexistente.
- RED: adapter resolvendo o administrador em vez do vendedor simulado.
- RED: contrato de migration para atuação delegada inexistente.
- GREEN: testes de contexto, adapter, hook e migration aprovados.

## Quality gates

- Typecheck: aprovado.
- Lint: aprovado.
- Suíte unitária completa: aprovada.
- Contratos da Carteira Base44: aprovados.
- Migration e rollback: aprovados.
- Build de produção: aprovado no GitHub Actions.

## Banco de produção

Migration `carteira_simulacao_vendedor` aplicada ao projeto Supabase `fbhcmzzgwjdgkctlfvbo`.

Teste transacional executado com administrador interno e vendedor ativo da MX CONSULTORIA:

1. criação de cliente no escopo do vendedor simulado;
2. criação de oportunidade em `prospeccao`;
3. atualização para `qualificacao`;
4. validação de `seller_user_id` e `loja_id`;
5. validação dos metadados `simulated_by`, `acting_seller_user_id` e `acting_store_id`;
6. `ROLLBACK`;
7. consulta posterior confirmou zero registros residuais.

## Deploy

Pendente apenas a confirmação de um novo preview/production deployment Vercel. Os previews anteriores falharam na etapa de infraestrutura com `Resource provisioning failed`; o build do mesmo SHA passou integralmente no GitHub Actions.
