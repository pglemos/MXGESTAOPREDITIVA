# ⚡ Shock Report: Caos Atômico & Débito Visual

**Data:** 11 de Abril de 2026
**Responsável:** Orion (aiox-master)
**Status:** Fase 1 Concluída

## 🔍 Visão Geral da Auditoria
Após a execução do script `lint:tokens`, identificamos um volume crítico de inconsistências arquiteturais no front-end. O sistema, embora visualmente funcional, sofre de "reinvenção de roda" em quase todas as páginas novas.

### 📊 Números do Caos
- **Total de Violações Atômicas:** 146
- **Valores Arbitrários (`[...]`):** 83 instâncias (ex: `top-[104px]`, `text-[12rem]`).
- **Cores Não-Tokenizadas:** ~50 instâncias (ex: `bg-[#0A0A0B]`, `blue-500`, `indigo-600`).
- **Utilitários Legado (Tailwind Standard):** ~60 instâncias (uso de `h-10` em vez de `h-mx-14`).

## 🚩 Pontos de Inflexão Críticos

### 1. O "Buraco Negro" do Login
A página `src/pages/Login.tsx` opera em um ecossistema de cores completamente paralelo:
- `bg-[#0A0A0B]`
- `bg-[#121214]`
- `bg-[#1A1A1D]`
- **Risco:** Inconsistência total se o tema dark oficial for alterado.

### 2. Layout Hardcoded
O `src/components/Layout.tsx` utiliza valores mágicos para posicionamento:
- `top-[104px]`
- `h-[calc(100vh-120px)]`
- `left-[136px]`
- **Risco:** Quebra de layout em dispositivos com resoluções não-padrão ou zoom de acessibilidade.

### 3. Skeletons "Freelancers"
Vários componentes (`MXScoreCard`, `DashboardLoja`) implementam seus próprios Skeletons usando utilitários padrão (`h-3`, `w-20`) em vez de consumir o Atom `Skeleton.tsx` ou tokens `mx-`.

## 🛠️ Plano de Ataque (Fase 2 & 3)
1. **Centralização de Layout:** Mover constantes como `104px` e `120px` para o `index.css` como variáveis de ambiente CSS ou tokens de layout.
2. **Tokenização do Login:** Substituir cores hexadecimais por variantes de `mx-black` e `brand-secondary`.
3. **Padronização de Skeletons:** Refatorar todos os estados de loading para usar o componente `src/components/atoms/Skeleton.tsx`.
4. **Enforcement:** Bloquear PRs que introduzam novos utilitários `text-[...]` ou cores fora do contrato MX.

---
**Assinatura:** — Orion, orquestrando a excelência 🎯
