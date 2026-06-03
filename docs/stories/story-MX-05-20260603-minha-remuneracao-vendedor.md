# Story MX-05.2 - Drill-down de Minha Remuneração do Vendedor

## Status

Ready for Review

## Story

**As a** Vendedor,
**I want** abrir o detalhamento da minha remuneração estimada a partir da Home,
**so that** eu entenda como salário fixo, variável, benefícios, comissão, meta e bônus formam o valor realizado e projetado.

## Executor Assignment

executor: "dev"
quality_gate: "qa"
quality_gate_tools: ["npm run lint", "npm run typecheck", "npm test", "npm run build", "browser responsive audit"]

## Acceptance Criteria

1. O card "Salário Estimado" da Home Vendedor é clicável e abre `/minha-remuneracao`.
2. `/minha-remuneracao` é acessível somente para `vendedor`; perfis de liderança continuam usando `/configuracoes/remuneracao`.
3. A página mostra realizado e projeção, com projeção selecionada por padrão.
4. A página detalha fixo, variável, benefícios, comissão por venda, vendas consideradas, meta, atingimento, bônus, vigências, observações e fórmula final.
5. Comissão usa somente a regra ativa vigente mais recente.
6. Bônus usa somente o maior patamar atingido e não é aplicado sem meta válida.
7. Dados ausentes exibem estado pendente ou alerta claro sem inventar valores.
8. O vendedor não visualiza outros cargos, lojas, benchmark ou ações de edição.

## Tasks / Subtasks

- [x] Evoluir o contrato puro de cálculo com detalhamento e resumo realizado/projetado.
- [x] Criar a página pessoal somente leitura.
- [x] Registrar rota e guard de acesso.
- [x] Conectar o card da Home à página.
- [x] Adicionar cobertura unitária, de rota e de navegação.
- [x] Rodar gates e smoke desktop/mobile como vendedor.

## Dev Notes

- Reutilizar `remuneracao_planos`, `remuneracao_regras`, metas e vendas já usadas pela Home.
- A configuração administrativa permanece em `/configuracoes/remuneracao`.
- Não criar migration nesta story; RLS atual já limita vendedor ao cargo `Vendedor` da loja vinculada.
- Projeção deve usar `max(projecao, vendasMes)` para nunca ficar abaixo do realizado.

## File List

- `docs/stories/story-MX-05-20260603-drill-down-indicadores-dashboard-vendedor.md`
- `docs/stories/story-MX-05-20260603-minha-remuneracao-vendedor.md`
- `src/App.tsx`
- `src/features/remuneracao/MinhaRemuneracaoPage.tsx`
- `src/features/remuneracao/hooks/useRemuneracao.ts`
- `src/features/remuneracao/lib/comparativo.test.ts`
- `src/features/remuneracao/lib/comparativo.ts`
- `src/features/vendedor-home/VendedorHome.container.test.tsx`
- `src/features/vendedor-home/VendedorHome.container.tsx`
- `src/features/vendedor-home/hooks/useVendedorHomePage.ts`
- `src/lib/auth/routeAccess.test.ts`
- `src/lib/auth/routeAccess.ts`

## Dev Agent Record

### Debug Log

- TDD red confirmado para contrato detalhado ausente, rota não autorizada e card sem navegação.
- Cobertura adicionada para comissão mais recente, maior bônus atingido, patamar repetido, ausência de meta, ausência de regras, zero vendas e resumo realizado/projetado.
- Smoke local com bypass de vendedor confirmou card clicável, rota pessoal, estados de erro e bloqueio de perfis não vendedores.
- Smoke com respostas de leitura controladas confirmou projeção padrão, realizado e projetado visíveis, fórmula final, aviso de estimativa e ausência de overflow horizontal em `1366x768` e `390x844`.

### Completion Notes

- Criada `/minha-remuneracao` como visão pessoal somente leitura, sem item no sidebar e restrita a `vendedor`.
- O card "Salário Estimado" usa o mesmo resultado projetado da página e permanece clicável quando o plano está pendente.
- O cálculo agora retorna detalhamento pronto para UI, usa a comissão vigente mais recente, o maior bônus atingido e nunca aplica bônus sem meta válida.
- A configuração administrativa permanece em `/configuracoes/remuneracao`; nenhuma migration foi necessária.
- Gates aprovados: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.

### Change Log

- 2026-06-03: Story criada para detalhar a remuneração pessoal do vendedor.
- 2026-06-03: Implementação concluída e enviada para revisão.
