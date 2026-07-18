# Remoção Completa do Legado Visual dos Perfis de Gestão V3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar componentes, classes, wrappers, tokens e composições visuais legadas de Administrador Geral, Admin MX, Consultor MX e Dono, fazendo todas as rotas reais desses perfis seguirem o mesmo design system canônico do código-fonte de referência e do módulo Gerente.

**Architecture:** A correção será guiada por um inventário executável de rotas e por uma auditoria de grafo de imports, não por uma única tela de amostra. O shell continuará compartilhado, mas cada rota real será validada quanto a primitives, classes computadas, estados, diálogos, tabelas, formulários, responsividade e ausência de dependências legadas. Supabase, RBAC, contratos de dados, queries, RPCs, triggers, Edge Functions e RLS permanecem intocados.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind 4, Radix UI, Motion, Bun Test, Playwright, Supabase JS, GitHub Actions e Vercel.

## Global Constraints

- Preservar todas as rotas, hooks, queries, RPCs, capabilities, políticas RLS e funcionalidades atuais.
- Não alterar schema, migrations, tabelas, triggers, Edge Functions, Auth ou Storage do Supabase.
- Não alterar o design system do Vendedor.
- A referência visual e estrutural é o código-fonte anexado e a implementação canônica do módulo Gerente.
- Nenhuma conclusão pode ser baseada somente em shell, header ou uma rota por perfil.
- Cada correção deve seguir RED → GREEN → REFACTOR.
- A validação final deve cobrir desktop e mobile, páginas, filtros, tabelas, formulários, modais, drawers, loading, empty, error e estados interativos.

---

### Task 1: Inventário executável de rotas e componentes

**Files:**
- Create: `src/design-system/management/managementRouteManifest.ts`
- Create: `src/test/management-route-manifest.test.ts`
- Modify: `src/App.tsx`
- Inspect: `src/components/Layout.tsx`
- Inspect: `src/lib/auth/routeAccess.ts`

**Interfaces:**
- Produces: `managementRouteManifest`, uma lista tipada com `path`, `roles`, `surface`, `expectedPrimitives` e `interactiveChecks`.
- Consumes: componentes lazy e regras de acesso já existentes.

- [ ] **Step 1: Escrever teste RED que exige cobertura de todas as rotas acessíveis aos quatro perfis**
- [ ] **Step 2: Executar `bun test src/test/management-route-manifest.test.ts` e confirmar falha por rotas ausentes**
- [ ] **Step 3: Criar o manifest sem alterar comportamento de navegação**
- [ ] **Step 4: Executar novamente e confirmar PASS**
- [ ] **Step 5: Commitar inventário e teste**

### Task 2: Auditoria estática do grafo de imports e tokens legados

**Files:**
- Create: `scripts/audit-management-design-system.mjs`
- Create: `src/test/management-design-system-source-audit.test.ts`
- Modify: `package.json`
- Consume: `src/design-system/management/managementRouteManifest.ts`

**Interfaces:**
- Produces: comando `npm run audit:management-design-system` com saída JSON e exit code diferente de zero para violações.
- Detecta: imports de shells antigos, wrappers paralelos, primitives duplicadas, classes `mxds-*`, `mx-internal-*`, tokens `rounded-mx-*`, `shadow-mx-*`, botões rosa em perfis de gestão, hex inline, `!important`, componentes de página não canônicos e CSS corretivo por rota.

- [ ] **Step 1: Escrever teste RED com fixtures de violações conhecidas**
- [ ] **Step 2: Executar o teste e confirmar que o auditor ainda não existe**
- [ ] **Step 3: Implementar parser determinístico de imports e classes**
- [ ] **Step 4: Executar auditor contra o repositório e salvar ledger de violações**
- [ ] **Step 5: Commitar auditor, testes e comando**

### Task 3: Fundação visual única para páginas de gestão

**Files:**
- Modify: `src/components/module/MxModuleVisualPrimitives.tsx`
- Modify: `src/components/module/MxRoleVisualScope.tsx`
- Modify: `src/styles/manager-visual-scope.css`
- Modify: `src/components/atoms/Button.tsx`
- Test: `src/components/module/MxModuleVisualPrimitives.test.tsx`
- Test: `src/components/atoms/Button.test.tsx`

**Interfaces:**
- Produces: primitives canônicas para page, header, toolbar, KPI, section, table, field, tabs, banner, loading, empty, error, modal e drawer.
- Consome: tokens semânticos gerenciais e provider visual existente.

- [ ] **Step 1: Escrever testes RED para cada primitive e estado que ainda use composição legada**
- [ ] **Step 2: Confirmar falhas focadas**
- [ ] **Step 3: Completar primitives e remover aliases visuais paralelos**
- [ ] **Step 4: Confirmar testes focados e suite existente em GREEN**
- [ ] **Step 5: Commitar fundação visual**

### Task 4: Migração de todas as rotas dos quatro perfis

**Files:**
- Modify: arquivos de página e feature apontados pelo ledger da Task 2.
- Test: `src/test/management-design-system-source-audit.test.ts`
- Test: testes unitários específicos de cada página alterada.

**Interfaces:**
- Consome: primitives da Task 3.
- Produz: zero violações estáticas em todas as rotas do manifest.

- [ ] **Step 1: Agrupar violações por superfície: dashboard, gestão de lojas, consultoria, agenda, relatórios, configuração, desenvolvimento e produtos**
- [ ] **Step 2: Para cada grupo, escrever ou ampliar o teste RED da página**
- [ ] **Step 3: Substituir wrappers e componentes legados pela foundation canônica sem tocar em dados ou permissões**
- [ ] **Step 4: Executar testes focados após cada grupo**
- [ ] **Step 5: Executar `npm run audit:management-design-system` até retornar zero violações**
- [ ] **Step 6: Commitar cada grupo separadamente**

### Task 5: Matriz Playwright de todas as rotas reais

**Files:**
- Create: `src/test/management-design-system-route-matrix.playwright.ts`
- Modify: `.github/workflows/module-design-system-authenticated-visual.yml`
- Consume: `src/design-system/management/managementRouteManifest.ts`

**Interfaces:**
- Produces: screenshots, métricas e relatório por rota, perfil e viewport.
- Verifica: identidade da página, ausência de overlay, console, exatamente um item ativo, primitive esperada, cores, raios, tipografia, overflow, modal/drawer e interação principal.

- [ ] **Step 1: Escrever matriz RED que percorre cada rota real em desktop 1440×900 e mobile 390×844**
- [ ] **Step 2: Confirmar falhas nas rotas que ainda renderizam legado**
- [ ] **Step 3: Corrigir somente as rotas apontadas**
- [ ] **Step 4: Reexecutar até todas as combinações passarem**
- [ ] **Step 5: Publicar artefato de screenshots e métricas no GitHub Actions**

### Task 6: Verificação final, Supabase e Vercel

**Files:**
- Create: `docs/qa/2026-07-18-remocao-completa-legado-design-system-v3.md`
- Modify: story associada à correção V3.

**Interfaces:**
- Produces: evidência reproduzível de código, CI, renderização e produção.

- [ ] **Step 1: Executar TypeScript, lint, testes unitários, auditor estático, build e bundle budget**
- [ ] **Step 2: Executar matriz Playwright completa e revisar screenshots, não apenas status do job**
- [ ] **Step 3: Confirmar Supabase `ACTIVE_HEALTHY` e ausência de migrations ou funções alteradas**
- [ ] **Step 4: Abrir PR, revisar diff e threads, e integrar por squash somente com todos os gates verdes**
- [ ] **Step 5: Confirmar deployment Vercel `READY`, HTTP 200 e ausência de erros de runtime**
- [ ] **Step 6: Registrar riscos residuais e rotas não testadas, caso existam**
