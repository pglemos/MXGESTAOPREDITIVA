# Plano de Correção: Módulo de Gestão de Unidades (Lojas)

Este plano visa corrigir a navegação entre a listagem de lojas (`/lojas`) e o painel individual da loja (`/loja`), garantindo que apenas os dados da loja selecionada sejam exibidos.

## Problemas Identificados

1.  **Navegação Incorreta**: Na página `/lojas`, o botão "DASHBOARD" aponta para `/dashboard?id={storeId}`, mas no `App.tsx` a rota definida para o `DashboardLoja` é `/loja`. Isso causa um redirecionamento ou exibe a página errada.
2.  **Filtro de Dados Ausente**: A página `/loja` (`DashboardLoja`) não está filtrando corretamente os dados pela loja selecionada via URL, ou a sincronização entre o `activeStoreId` do `useAuth` e o parâmetro da URL está inconsistente.
3.  **Exibição de Todas as Lojas**: O usuário relatou que a página de loja individual mostra "todas as lojas", o que sugere que o componente `AdminNetworkView` (ou similar) está sendo exibido incondicionalmente ou que os hooks de dados não estão respeitando o `storeId` da URL.

## Mudanças Propostas

### 1. `src/pages/Lojas.tsx`
- Corrigir o link do botão "DASHBOARD" de `/dashboard?id=${store.id}` para `/loja?id=${store.id}` para alinhar com as rotas do `App.tsx`.

### 2. `src/pages/DashboardLoja.tsx`
- Refinar a lógica de captura do `storeId`:
    - Priorizar `urlStoreId` (da URL).
    - Se `urlStoreId` estiver presente, chamar `setActiveStoreId(urlStoreId)` no `useEffect` para garantir que o contexto global de autenticação/loja ativa esteja sincronizado.
- Garantir que componentes de visão "Geral" (como `AdminNetworkView`) só apareçam se explicitamente desejado ou se nenhuma loja estiver selecionada (embora a página `/loja` deva ser individual).
- Remover ou esconder a `AdminNetworkView` quando um `id` de loja específico estiver sendo visualizado para evitar confusão.

### 3. `src/hooks/useAuth.tsx`
- Verificar se `setActiveStoreId` persiste corretamente e se a mudança reflete nos hooks dependentes (`useCheckinsByDateRange`, `useSellersByStore`, etc.).

## Verificação

1.  Acessar `/lojas`.
2.  Clicar em "DASHBOARD" de uma loja específica.
3.  Verificar se a URL é `/loja?id={ID_DA_LOJA}`.
4.  Verificar se o nome da loja no cabeçalho corresponde ao ID.
5.  Verificar se os números (Vendas, Leads, Ranking) são exclusivos daquela loja.
6.  Verificar se o seletor de lojas (para admin/dono) está sincronizado com a URL.

---
**Deseja prosseguir com a implementação destas correções?**
