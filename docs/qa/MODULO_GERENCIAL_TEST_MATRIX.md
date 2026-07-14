# Matriz de testes — Módulo Gerencial

| Camada | Cobertura exigida | Evidência/gate |
|---|---|---|
| Unitário | fórmulas oficiais, calendário `America/Sao_Paulo`, denominador zero, não aplicável, base insuficiente, classificação, ordenação, filtros, status, idempotência, serialização, períodos do Ranking e arredondamento somente na apresentação | `npm test` em 2026-07-14 na branch `fix/manager-module-full-parity-20260714`; `918 pass / 0 fail` |
| Componente | dez menus, tabs, cards, tabelas, selects, dropdowns, modais, foco, Escape, loading, vazio, erro, sem vínculo, sem permissão, mobile e conteúdo condicional | Bun + Testing Library |
| Integração | queries, mutations, RPCs, auditoria, notificações, escopo por loja, persistência, rollback lógico e erro server-side | testes de serviço/Supabase somente leitura ou fixture autorizada |
| E2E gerente | login, dez rotas, refresh, filtros, modais, cobrança, regularização, leads, feedback, PDI, ranking, Universidade, retorno contextual, console e network | `src/test/manager-module.playwright.ts`: local Chromium `5/5`, mobile-chrome `5/5`; Chrome real confirmou modais e períodos do Ranking; produção somente leitura menu/rotas `1/1`, conteúdo `1/1`, console/network `1/1`; credencial somente em runtime; cancelamentos `net::ERR_ABORTED` de navegação mobile não são tratados como falhas, enquanto 4xx/5xx continuam bloqueando |
| Segurança | vendedor recebe 403; gerente não lê outra loja; gerente não altera dado operacional não autorizado; dono/admin preservam capability; RLS/RPC; nenhum segredo no bundle | Chrome local: vendedor recebeu `Acesso não autorizado`; dono/admin carregaram escopo; RLS cross-store de mutation ainda requer fixture autorizada |
| Regressão | vendedor, gerente, dono e admin; shell/ícones; aliases; refresh e restauração de contexto | suíte completa e rotas canônicas |
| Visual | `1920×1080`, `1440×900`, `1366×768`, `1024×768`, `768×1024`, `430×932`, `390×844`, `375×812`; gate final mínimo em `1440×900`, `768×1024`, `390×844` | `e2e/visual/manager-module.spec.ts` e baselines versionadas: `30/30` nos três viewports mínimos; credencial somente em runtime; ausência da variável falha explicitamente; capturas em `docs/qa/evidence/manager-parity/2026-07-14`; spinner Base44 não vale |

## Critério de aprovação

Uma tela somente pode ser `APROVADO` quando tiver estado carregado estável, loading/vazio/erro/sem permissão quando aplicável, fluxo interativo crítico, console/network limpos, dados escopados, testes verdes e diff visual aprovado nos três viewports mínimos. O módulo só pode ser `APROVADO` quando as dez telas forem aprovadas.
