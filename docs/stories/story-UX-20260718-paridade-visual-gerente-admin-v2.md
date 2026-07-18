# Story UX-20260718 — Paridade visual real com o módulo Gerente

## Status

In Progress

## Contexto

A entrega anterior unificou a origem dos componentes de `administrador_geral`, `administrador_mx`, `consultor_mx` e `dono`, porém não reproduziu o design visual canônico do módulo `gerente`. Os testes validavam apenas compartilhamento de arquivos e tokens próprios, permitindo sidebar com 264 px, item ativo em verde-claro, botões primários rosa e superfícies `mx-*`, enquanto a referência aprovada usa sidebar branca de 224 px, item ativo verde sólido, fundo `gray-50`, cards brancos `rounded-2xl`, bordas `gray-100`, sombras leves e ações emerald.

## Objetivo

Fazer Admin MX, Administrador Geral, Consultor MX e Dono utilizarem a mesma matriz visual concreta do Gerente, preservando regras de negócio, RBAC, Supabase, rotas, dados e interações.

## Requisitos

- FR-01: O shell compartilhado deve reproduzir largura, navegação, estados ativo/inativo, tipografia, bordas, sombras e comportamento responsivo da referência do Gerente.
- FR-02: As primitivas de página, cabeçalho, toolbar, KPI, seção, tabela, estado vazio e carregamento devem usar a anatomia concreta do Gerente.
- FR-03: Ações primárias desses módulos devem usar emerald, nunca o `mx-action` rosa.
- FR-04: `PainelConsultor` e `Lojas` devem herdar a fundação sem CSS corretivo por rota.
- FR-05: Navegação, simulação, perfil, notificações, filtros, relatórios e seleção de loja devem continuar funcionais.
- NFR-01: Não alterar schema, migration, RPC, trigger, Edge Function ou RLS do Supabase.
- NFR-02: Não introduzir novo design system paralelo.
- NFR-03: Não alterar contratos de dados nem permissões.
- NFR-04: Desktop e mobile não podem apresentar overflow horizontal acidental.

## Critérios de aceitação

- [ ] Sidebar expandida mede 224 px (`w-56`) e recolhida 64 px (`w-16`).
- [ ] Item ativo usa `bg-emerald-600 text-white shadow-sm` sem trilho lateral decorativo.
- [ ] Fundo das páginas é `bg-gray-50`; conteúdo usa `max-w-7xl`, `px-4`, `py-6` e ritmo vertical de 20 px.
- [ ] Cabeçalhos, toolbars, KPIs, seções e tabelas usam `rounded-2xl border-gray-100 bg-white shadow-sm`.
- [ ] Botões principais de Admin/Consultoria/Dono usam emerald e não `mx-action`.
- [ ] Os testes de paridade comparam classes reais do Gerente, não apenas origem de imports.
- [ ] TypeScript, lint, testes, build e matriz visual passam.
- [ ] Preview Vercel fica READY sem erro de build ou runtime.
- [ ] Nenhuma alteração de banco é aplicada ao Supabase.

## Checklist de execução

- [x] Auditar screenshots, ZIP de referência e código publicado do Gerente.
- [x] Identificar causa-raiz nos componentes e testes.
- [ ] Criar contratos RED de fidelidade visual.
- [ ] Corrigir primitives, sidebar, botões e páginas consumidoras.
- [ ] Rodar testes focados e suíte completa.
- [ ] Validar build e preview Vercel.
- [ ] Registrar evidências e file list.

## File List

- `docs/stories/story-UX-20260718-paridade-visual-gerente-admin-v2.md`
- `docs/superpowers/plans/2026-07-18-paridade-visual-gerente-admin-v2.md`
- `src/components/MxSidebarShell.tsx`
- `src/components/MxSidebarShell.test.ts`
- `src/components/atoms/Button.tsx`
- `src/components/module/MxModuleVisualPrimitives.tsx`
- `src/components/module/MxModuleVisualPrimitives.test.tsx`
- `src/pages/PainelConsultor.tsx`
- `src/features/lojas/sections/LojasHeader.tsx`
- `src/test/module-design-system-parity.test.ts`
