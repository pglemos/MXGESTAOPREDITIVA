# Story OPS-20260501: BI Executivo Admin de Performance

## Status
Ready for Review

## Contexto
Ao acessar `/relatorios/performance-vendas` em 2026-05-01, a tela de Admin MX exibiu volume zero e nenhum gráfico porque o relatório consultava apenas o mês atual. A operação precisa de uma visão executiva completa, com histórico e indicadores consolidados para análise de lojas, consultorias, donos, gerentes e vendedores.

## Acceptance Criteria
- [x] Admin Master/Admin MX visualiza KPIs consolidados da rede mesmo quando o mês atual ainda não tem lançamentos.
- [x] Tela exibe dados históricos de vendas, funil, metas, projeção, cobertura de lançamentos e ranking por loja.
- [x] Tela exibe distribuição de usuários por papel e visão de consultoria.
- [x] Exportação continua funcional com dados consolidados.
- [x] Refresh continua funcional.
- [x] Rota continua protegida e compatível com perfis não-admin.
- [x] Quality gates executados: lint, typecheck, test.
- [x] Auditoria visual via Chrome MCP concluída.

## Dev Agent Record

### Checklist
- [x] Refatorar hook de métricas da rede.
- [x] Refazer UI admin do relatório.
- [x] Validar build/quality gates.
- [x] Validar visualmente em produção/local via Chrome MCP.

### File List
- `src/hooks/useNetworkPerformance.ts`
- `src/pages/SalesPerformance.tsx`
- `docs/stories/story-OPS-20260501-admin-performance-bi.md`

### Completion Notes
- `useNetworkPerformance` agora monta uma janela historica de 180 dias e consolida lojas, metas, lancamentos, usuarios, vinculos, vendedores, clientes e visitas de consultoria.
- A UI admin foi refeita como cockpit executivo com KPIs, graficos historicos, ranking, matriz loja x meta, funil, distribuicao de perfis, consultoria e matriz completa por loja.
- Validado em `http://localhost:3001/relatorios/performance-vendas` com login admin real via Chrome MCP: 39 lojas, 99 usuarios, 44 clientes de consultoria, 234 sell-out historico e 39 linhas na matriz.
- Quality gates executados com sucesso: `npm run typecheck`, `npm run lint`, `npm test` e `npm run build`.
