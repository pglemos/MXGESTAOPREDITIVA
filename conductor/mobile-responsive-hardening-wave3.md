# Epic: Mobile Responsive Hardening (Material Design & Android Guidelines)

## 1. Objetivo
Aplicar um hardening responsivo mobile-first massivo em todas as 40+ páginas dos 4 módulos (Vendedor, Gerente, Dono, Admin MX). A execução ocorrerá em duas fases (Massa + Cirúrgica), aderindo estritamente às diretrizes do Material Design.

## 2. Princípios de Design Adotados
- **Window Size Classes:** Layouts adaptativos para `compact` (mobile), `medium` (tablet), `expanded` (desktop), `large`, e `extra-large` (Tailwind `sm`, `md`, `lg`, `xl`, `2xl`).
- **Base Grid (4/8dp):** Uso de medidas múltiplas de 4 e 8 para espaçamento e alinhamento (Tailwind usa o sistema de 4px por padrão, ex: `p-2` = 8px, `gap-4` = 16px, `p-6` = 24px).
- **Layouts Canônicos:** Iniciar pelo layout `compact` e expandir, sem forçar grades de desktop em telas de celular.
- **Agrupamento:** Uso de agrupamento explícito (cards, bordas) e implícito (proximidade, respiro) para guiar a atenção do usuário à ação principal.
- **Unidades Relativas:** Foco em tipografia e elementos que escalam com o dispositivo, preservando a legibilidade.

## 3. FASE 1: Hardening em Massa (Script de Automação)
Executar um script Node.js nativo para aplicar as seguintes regras em todo o diretório `src/pages/`:
1. **Normalização de Grids:** Encontrar `grid-cols-X` e forçar `grid-cols-1 sm:grid-cols-X` (garantindo coluna única no `compact`).
2. **Isolamento de Tabelas:** Envolver toda `<table>` em um `<div className="overflow-x-auto no-scrollbar w-full">` para erradicar o overflow horizontal global do body.
3. **Otimização de Paddings (Margens e Acolchoamento):** Substituir paddings gigantes e fixos (`p-mx-lg`) por variantes responsivas baseadas no grid de 4/8 (`p-4 md:p-mx-lg`).
4. **Flex Wrapping:** Garantir que containers horizontais (botões, filtros) usem `flex-wrap` e o devido espaçamento (spacer).

## 4. FASE 2: Hardening Cirúrgico (Auditoria Manual)
Página por página, módulo por módulo, aplicar o ajuste fino utilizando emulação mobile (390px):
- **Vendedor:** `VendedorHome.tsx`, `Checkin.tsx`, etc.
- **Gerente:** `DashboardLoja.tsx`, `RotinaGerente.tsx`, `Equipe.tsx`.
- **Dono/Admin:** `Lojas.tsx`, `PainelConsultor.tsx`, `Reprocessamento.tsx`.

**Ações Cirúrgicas:**
- Migrar tabelas complexas para o organismo `DataGrid` (que converte tabela para Cards no mobile).
- Ajustar tamanhos de fonte responsivos (`text-2xl sm:text-4xl`).
- Corrigir botões flutuantes, barras de navegação inferiores e alinhamentos de ícones.

## 5. Verificação
- Zero scroll horizontal indesejado no `<body>`.
- Agrupamento claro de informações operacionais sem estrangulamento de dados.