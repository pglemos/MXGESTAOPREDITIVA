# Conformidade de Design — Vendedor vs Padrão (Gerente/Dono/Admin)

**Data:** 2026-06-18 · **Método:** auditoria visual autenticada em produção (4 roles)
**Referência (padrão):** módulo Gerente/Admin MX · **Avaliado:** módulo Vendedor
**Evidências:** `.playwright-mcp/vendedor-home.png`, `vendedor-sidebar.png`, `gerente-home.png`, `admin-painel.png`

---

## 1. Sidebar — 🔴 QUEBRADO (desvio confirmado)

| | Vendedor | Gerente (padrão) |
|---|----------|------------------|
| Estrutura | **1 stack plano** — 13 ícones todos sob "(NAVEGAÇÃO)" | **3 grupos** com separadores: COMERCIAL (7), PESSOAS (2), FERRAMENTAS (3) |
| Largura | 80px icon-rail | 80px icon-rail |
| Separação semântica | ❌ nenhuma | ✅ grupos com divisores |

**Causa:** o vendedor despeja todos os 13 itens em um único grupo sem divisórias → visual cramped/"quebrado". O padrão agrupa por domínio (Comercial / Pessoas / Ferramentas) com separadores.

**Fix:** aplicar a mesma estrutura agrupada do gerente ao menu do vendedor em `Layout.tsx` — ex.: **MEU DIA** (Home, Terminal MX, Central, Carteira, Funil, Relatórios), **EVOLUÇÃO** (Feedbacks, PDI, Treinamentos, Ranking), **FERRAMENTAS** (Consultor IA), **CONTA** (Perfil, Config). Adicionar divisores entre grupos.

---

## 2. Cards / KPIs — 🟡 INCONSISTENTE

| | Vendedor | Gerente (padrão) |
|---|----------|------------------|
| Chip de ícone | verde monocromático, flat | chip arredondado com bg tintado por status (verde/vermelho/laranja) |
| Paleta | mono-verde | multicolor semântico por status |
| Pills de status | esparsos | consistentes (Crítico/Atenção com cor) |

**Fix:** padronizar o card de KPI do vendedor com o componente/estilo do gerente (icon-chip tintado + pill de status). Centralizar em molecule única reusada por ambos.

---

## 3. Landmarks / Estrutura semântica — 🟡 DESVIO

| | Vendedor | Gerente (padrão) |
|---|----------|------------------|
| Regions | divs genéricas | `<region aria-label>` ("Indicadores gerenciais", "Operação da equipe", "Agenda e engajamento") |
| Tabelas | `columnheader` sem scope | `columnheader` sem scope (mesmo gap a11y) |

**Fix:** envolver seções da home vendedor em `region`/`section aria-label` como o gerente. (Cruza com `pipeline-design-system-vendedor` — th scope.)

---

## 4. Dentro do padrão (ok)

- Header (logo, busca, notificações, perfil) idêntico entre roles ✅
- Skip-link presente ✅
- Tokens de cor (0 hex hardcoded) ✅
- Login/auth consistente ✅

---

## Veredito: **NÃO CONFORME** — 1 quebra (sidebar) + 2 desvios (cards, landmarks)

### Remediação priorizada
1. 🔴 **Sidebar agrupado** (~4h) — maior impacto visual, resolve "feio/quebrado". Reusa padrão do gerente
2. 🟡 **Card KPI unificado** (~8h) — molecule única vendedor↔gerente
3. 🟡 **Region landmarks** na home vendedor (~3h) — + th scope (cruza pipeline a11y)

Todos = aproximar o vendedor do padrão Gerente/Admin já existente (reuso, não invenção).
