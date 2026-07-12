# Matriz de testes — Módulo Gerencial

| Camada | Cobertura exigida | Gate |
|---|---|---|
| Unitário | status, metas, ritmo, projeção, agendamento, disciplina, rotina, telefone/WhatsApp, ordenação e transições | `npm test` |
| Componente | nove menus, tabs, cards, tabela, selects, dropdowns, Dialog/Sheet, estados assíncronos | Bun + Testing Library |
| Integração | queries, mutations, cache, auditoria, notificações e isolamento por loja | Supabase local/live não destrutivo |
| E2E gerente | login, nove rotas, filtros, fechamento, rotina, equipe, feedback/PDI, ranking e Universidade | Playwright |
| Segurança | vendedor recebe 403; gerente não edita campos operacionais; loja A não lê B | RLS + E2E |
| Regressão | vendedor, dono, admin e simulação | Playwright |
| Visual | 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 390×844 | screenshots revisados |
