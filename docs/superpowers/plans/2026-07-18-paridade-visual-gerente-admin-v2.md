# Paridade Visual Gerente/Admin V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir Admin MX, Administrador Geral, Consultor MX e Dono para reproduzirem a matriz visual concreta do módulo Gerente e das referências anexadas, sem alterar negócio, RBAC ou banco.

**Architecture:** O `MxSidebarShell` permanece como shell único, mas sua implementação visual passa a refletir a sidebar do Gerente. `MxModuleVisualPrimitives` continua sendo a fundação compartilhada, agora derivada das classes reais de `ManagerSellerParityHomeCanonical`, e o `Button` recebe variantes gerenciais explícitas para evitar que o primary rosa vaze aos módulos alvo. As páginas consumidoras deixam de depender de variantes genéricas incompatíveis.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind 4, Lucide React, Motion, Bun Test, Playwright, Supabase JS e Vercel.

## Global Constraints

- A referência visual é `ManagerSellerParityHomeCanonical.tsx`, o ZIP `mx-gerente (2).zip` e as duas imagens anexadas.
- Não alterar tabelas, migrations, RPCs, triggers, Edge Functions, Auth ou RLS.
- Não alterar rotas, capabilities, simulação, notificações, perfil ou contratos de dados.
- Não criar CSS por perfil, wrappers paralelos ou classes com `!important`.
- Não modificar o tema do Vendedor para resolver o Admin.
- Toda correção deve ser coberta por teste RED antes da implementação.
- Lint, typecheck, testes, build e preview Vercel são bloqueadores.

---

### Task 1: Contrato RED da matriz visual real

**Files:**
- Modify: `src/components/MxSidebarShell.test.ts`
- Modify: `src/components/module/MxModuleVisualPrimitives.test.tsx`
- Modify: `src/test/module-design-system-parity.test.ts`

**Interfaces:**
- Consumes: fontes do shell, primitives, Button, PainelConsultor e Gerente canônico.
- Produces: contratos que exigem as classes visuais reais do Gerente.

- [ ] **Step 1: Trocar expectativas token-only por classes concretas**

Exigir `bg-gray-50`, `max-w-7xl`, `space-y-5`, `rounded-2xl`, `border-gray-100`, `shadow-sm`, `w-56`, `w-16` e `bg-emerald-600 text-white`.

- [ ] **Step 2: Proibir os sintomas observados**

Proibir `w-[264px]`, trilho lateral de item ativo, `bg-emerald-50 text-emerald-800` no estado ativo e uso do primary rosa nas páginas alvo.

- [ ] **Step 3: Rodar RED**

Run: `bun test src/components/MxSidebarShell.test.ts src/components/module/MxModuleVisualPrimitives.test.tsx src/test/module-design-system-parity.test.ts`

Expected: FAIL nas expectativas novas, comprovando que o teste detecta a divergência atual.

---

### Task 2: Variantes de botão do Gerente

**Files:**
- Modify: `src/components/atoms/Button.tsx`
- Test: `src/test/module-design-system-parity.test.ts`

**Interfaces:**
- Produces: `managerPrimary`, `managerOutline`, `managerSecondary` e `managerGhost` em `buttonVariants`.

- [ ] **Step 1: Implementar apenas as variantes exigidas**

As variantes devem usar emerald/gray, `rounded-xl`, foco visível e estados hover/disabled consistentes.

- [ ] **Step 2: Rodar contrato focado**

Run: `bun test src/test/module-design-system-parity.test.ts`

Expected: PASS para as variantes, permanecendo RED para primitives e sidebar.

---

### Task 3: Primitives compartilhadas derivadas do Gerente

**Files:**
- Modify: `src/components/module/MxModuleVisualPrimitives.tsx`
- Test: `src/components/module/MxModuleVisualPrimitives.test.tsx`

**Interfaces:**
- Preserva todas as exports públicas atuais.
- Produz a anatomia visual canônica para páginas, cabeçalhos, KPIs, toolbars, seções, tabelas e estados.

- [ ] **Step 1: Corrigir layout e superfícies**

Aplicar fundo `gray-50`, container `max-w-7xl`, espaçamento `px-4 py-6`, gap `5`, cards `rounded-2xl border-gray-100 bg-white shadow-sm`.

- [ ] **Step 2: Corrigir tipografia, ícones e tons**

Usar `gray-800/500/400`, emerald como brand/success e azul/amber/red apenas para semântica.

- [ ] **Step 3: Rodar teste focado**

Run: `bun test src/components/module/MxModuleVisualPrimitives.test.tsx`

Expected: PASS.

---

### Task 4: Sidebar canônica

**Files:**
- Modify: `src/components/MxSidebarShell.tsx`
- Test: `src/components/MxSidebarShell.test.ts`

**Interfaces:**
- Preserva props, navegação, perfil, notificações, simulação, drawer mobile e logout.

- [ ] **Step 1: Corrigir dimensões e estrutura visual**

Sidebar desktop `w-56`/`w-16`, borda `gray-100`, sombra leve, conteúdo sem caixas de ícone separadas.

- [ ] **Step 2: Corrigir estados de navegação**

Ativo `bg-emerald-600 text-white shadow-sm`; inativo `text-gray-600 hover:bg-gray-50`; foco e badges acessíveis.

- [ ] **Step 3: Corrigir offsets do conteúdo e mobile**

Main desktop `md:pl-56`/`md:pl-16`; drawer e topbar sem overflow.

- [ ] **Step 4: Rodar teste focado**

Run: `bun test src/components/MxSidebarShell.test.ts`

Expected: PASS.

---

### Task 5: Consumidores Admin, Consultoria e Dono

**Files:**
- Modify: `src/pages/PainelConsultor.tsx`
- Modify: `src/features/lojas/sections/LojasHeader.tsx`

**Interfaces:**
- Mantém callbacks, rotas, filtros, relatórios e conteúdo atual.

- [ ] **Step 1: Trocar ações pelas variantes gerenciais**

Atualizar refresh, CTA, tabs e relatórios para variantes `manager*`.

- [ ] **Step 2: Remover hierarquia visual não presente na referência**

Retirar eyebrow do painel principal e manter título/descrição na mesma hierarquia do Gerente.

- [ ] **Step 3: Rodar contrato de paridade**

Run: `bun test src/test/module-design-system-parity.test.ts`

Expected: PASS.

---

### Task 6: Verificação integral e evidências

**Files:**
- Modify: `docs/stories/story-UX-20260718-paridade-visual-gerente-admin-v2.md`
- Create: `docs/qa/2026-07-18-paridade-visual-gerente-admin-v2.md`

- [ ] **Step 1: Executar gates locais/CI**

Run:
```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: exit code 0 em todos.

- [ ] **Step 2: Executar matriz visual Playwright**

Validar desktop e mobile para Gerente, Dono, Administrador Geral, Admin MX e Consultor MX, sem overflow horizontal.

- [ ] **Step 3: Validar Vercel**

Confirmar Preview READY, build sem erros e ausência de clusters de runtime associados às rotas alteradas.

- [ ] **Step 4: Validar Supabase sem mutação**

Confirmar projeto saudável e registrar que nenhuma migration ou alteração de schema foi necessária.

- [ ] **Step 5: Atualizar story e evidência**

Marcar critérios comprovados, registrar comandos, resultados, screenshots e desvios intencionais.
