# Verificação da Sidebar Universal MX

Data: 18 de julho de 2026

## Objetivo

Unificar a anatomia visual e o comportamento do sidebar dos perfis `administrador_geral`, `administrador_mx`, `consultor_mx`, `dono`, `gerente` e `vendedor` usando como referência canônica o sidebar claro do módulo Gerente.

## Causa raiz

O `Layout.tsx` selecionava três shells concorrentes:

- `ManagerSidebarShell` para Gerente;
- `SellerLayoutShell` para Vendedor e Dono;
- `MxInternalShell` para os perfis internos MX.

A correção substitui essa seleção por um único `MxSidebarShell`.

## Contratos preservados

- navegação específica por perfil;
- filtro por `canAccessPath` e capabilities existentes;
- badges de notificações e devolutivas;
- perfil, preferências e logout;
- simulação dos perfis internos;
- enquadramento contextual das páginas internas;
- drawer mobile, tecla Escape e focus trap;
- largura de 264 px expandida e 80 px recolhida.

## Legado removido do runtime

- `src/components/ManagerSidebarShell.tsx`;
- `src/components/SellerSidebar.tsx`;
- `src/design-system/internal-mx/MxInternalShell.tsx`;
- `src/design-system/internal-mx/internal-mx-shell.css`.

## Verificação automatizada

- TypeScript: aprovado;
- Bun: 1.243 testes aprovados;
- ESLint a11y: aprovado;
- MX Atomic Design Enforcement: aprovado;
- Bundle Budget: aprovado;
- Gitleaks: aprovado;
- CodeRabbit: aprovado.

## Banco de dados

Nenhuma migration, tabela, RPC, RLS, trigger ou Edge Function foi alterada.
