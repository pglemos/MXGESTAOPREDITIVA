# Story UX-20260718 — Remoção completa do legado visual dos perfis de gestão V3

## Status

Em investigação.

## Problema

Administrador Geral, Admin MX, Consultor MX e Dono ainda renderizam componentes e composições visuais legadas, embora o shell compartilhado e algumas primitives tenham sido alinhados ao módulo Gerente.

A validação anterior cobriu somente uma rota por perfil e três seletores proibidos, portanto não demonstrou paridade em todas as rotas, componentes, estados e interações.

## Objetivo

Auditar e corrigir todas as rotas reais dos quatro perfis para seguirem o código-fonte de referência e a matriz visual canônica do Gerente, preservando dados, RBAC, Supabase e funcionalidades.

## Critérios de aceitação

- [ ] Existe inventário executável de todas as rotas acessíveis aos quatro perfis.
- [ ] O grafo de imports não contém shells, wrappers ou primitives visuais paralelas nas rotas alvo.
- [ ] Não existem classes, tokens, CSS corretivo por rota ou variantes de botão legadas nas superfícies alvo.
- [ ] Headers, toolbars, KPIs, cards, tabelas, formulários, tabs, banners, loading, empty, error, modal e drawer usam primitives canônicas.
- [ ] A matriz Playwright percorre todas as rotas reais em desktop e mobile.
- [ ] A interação principal de cada superfície é exercitada e validada.
- [ ] TypeScript, lint, testes, auditor estático, build e bundle budget passam.
- [ ] Supabase permanece sem alterações de schema, migrations, RPCs, Edge Functions, Auth e RLS.
- [ ] Deployment Vercel fica READY e sem erros de runtime.

## Evidência inicial

O teste `src/test/module-design-system-authenticated-visual.playwright.ts` usa apenas:

- Gerente: `/gerente/ranking`;
- Dono: `/lojas`;
- Administrador Geral: `/painel`;
- Administrador MX: `/painel`;
- Consultor MX: `/consultoria/clientes`.

O detector de legado considera somente `.mxds-page-frame`, `.mx-internal-workspace` e classes contendo `mxds-`, deixando de fora componentes, imports, tokens, wrappers e estados antigos com outros nomes.
