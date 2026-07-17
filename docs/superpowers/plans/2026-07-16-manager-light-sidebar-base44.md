# Manager Light Base44 Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir somente o shell lateral do Módulo Gerencial pelo sidebar claro inspirado no Base44, preservando integralmente o design e o funcionamento já implantados no Módulo Vendedor.

**Architecture:** O shell compartilhado atual permanece como fonte dos módulos Vendedor, Dono e Admin MX. Um novo `ManagerSidebarShell` será usado exclusivamente quando `role === 'gerente'`, consumindo as mesmas rotas, permissões, badges, perfil e callbacks já calculados em `Layout.tsx`. Nenhuma entidade, RPC ou migration será criada para uma alteração puramente visual.

**Tech Stack:** React 19, TypeScript 5.8, React Router 7, Tailwind CSS 4, Lucide React, Bun Test, Vercel.

## Global Constraints

- Trabalhar somente na branch `main` do repositório `pglemos/MXGESTAOPREDITIVA`.
- Não copiar nem alterar o design do Módulo Vendedor.
- O Base44 Gerencial orienta design e comportamento; o PDF de 63 páginas prevalece em regras, fórmulas, permissões, eventos e auditoria.
- Preservar as dez opções gerenciais na ordem oficial: Início, Rotina do Dia, Fechamento Diário, Rotina da Equipe, Minha Equipe, Meta da Loja, Mentor Gerencial, Desenvolvimento, Ranking e Universidade MX.
- Preservar navegação contextual, autenticação, `canAccessPath`, Supabase, RLS e callbacks existentes.
- Não usar mocks, dados demo, SDK Base44 ou `localStorage` operacional.
- Desktop, tablet e mobile devem possuir navegação funcional e acessível.
- Não alterar Supabase para uma mudança que não exige persistência.
- Publicação ocorre pelo pipeline GitHub `main` → Vercel; produção só é considerada validada quando o deployment estiver `READY`.

---

### Task 1: Criar contrato de regressão do sidebar gerencial

**Files:**
- Create: `src/components/ManagerSidebarShell.test.ts`

**Interfaces:**
- Consumes: fonte de `ManagerSidebarShell.tsx` e `Layout.tsx`.
- Produces: contrato automatizado para impedir retorno do sidebar escuro no perfil gerente.

- [ ] Verificar que `Layout.tsx` seleciona `ManagerSidebarShell` apenas para `role === 'gerente'`.
- [ ] Verificar que o shell gerencial usa fundo claro, navegação verde e superfície neutra.
- [ ] Verificar a ordem do menu de perfil: Meu Perfil, Preferências, Notificações e Sair.
- [ ] Verificar que nome, cargo, avatar e chevron permanecem no card inferior.
- [ ] Verificar que o shell gerencial não contém a antiga superfície navy `#051923`.

### Task 2: Implementar o shell gerencial claro

**Files:**
- Create: `src/components/ManagerSidebarShell.tsx`

**Interfaces:**
- Consumes: `SellerLayoutNavSection[]`, perfil, callbacks de logout/simulação e rotas de conta.
- Produces: `ManagerSidebarShell(props)` com desktop expansível, drawer mobile e menu de usuário.

- [ ] Criar sidebar desktop branco com borda suave, sombra leve e largura expandida de 264px.
- [ ] Criar estado recolhido de 80px com tooltips acessíveis.
- [ ] Aplicar item ativo verde claro, ícone verde e indicador lateral.
- [ ] Refazer o card inferior do gerente com avatar, nome, cargo e chevron em superfície clara.
- [ ] Refazer o menu de perfil em popover branco, acima do card, com as quatro ações da referência.
- [ ] Implementar fechamento por clique externo e tecla Escape.
- [ ] Implementar drawer mobile claro com focus trap e botão de fechar.
- [ ] Preservar banner de simulação e área principal com scroll interno.

### Task 3: Conectar exclusivamente o gerente ao novo shell

**Files:**
- Modify: `src/components/Layout.tsx`

**Interfaces:**
- Consumes: `ManagerSidebarShell` e os `sidebarSections` existentes.
- Produces: seleção de shell por papel sem duplicar rotas ou lógica de permissão.

- [ ] Importar `ManagerSidebarShell`.
- [ ] Extrair o conteúdo comum da página para uma única variável React.
- [ ] Renderizar `ManagerSidebarShell` somente para `role === 'gerente'`.
- [ ] Manter `SellerLayoutShell` inalterado para Vendedor, Dono, Admin MX e Consultor MX.
- [ ] Reutilizar os mesmos caminhos de perfil, preferências, notificações e simulação.

### Task 4: Validar e publicar

**Files:**
- Verify: `src/components/ManagerSidebarShell.test.ts`
- Verify: GitHub Actions e deployment Vercel do commit final.

- [ ] Executar `npm run typecheck`.
- [ ] Executar `npm test`.
- [ ] Executar `npm run lint`.
- [ ] Executar `npm run build`.
- [ ] Confirmar que não existem pull requests abertos pendentes de merge para `main`.
- [ ] Confirmar deployment Vercel de `main` em estado `READY`.
- [ ] Realizar smoke test das dez rotas gerenciais e do menu de perfil em desktop e mobile.

## Self-review

- Cobertura do escopo: mudança restrita ao shell gerencial; Módulo Vendedor permanece visualmente intacto.
- Segurança: nenhuma migration ou policy é alterada.
- Acessibilidade: cor acompanhada de texto, `aria-current`, `aria-expanded`, focus ring, Escape, focus trap e áreas de toque mínimas.
- Governança: a branch de entrega é exclusivamente `main`; branches históricas já mergeadas não são reaplicadas, evitando duplicidade de commits.
