# Auditoria Visual — Todas as Telas do Vendedor

**Data:** 2026-06-18 · **Método:** captura autenticada em prod (12 telas) vs padrão Gerente/Admin
**Evidências:** `.playwright-mcp/v-*.png`

---

## Matriz por tela

| # | Tela | Veredito | Desvio principal |
|---|------|----------|------------------|
| 1 | /home | 🔴 OFF | KPI cards verde flat, sem icon-chip; verde monocromático |
| 2 | /vendedor/terminal-mx | 🟢 ON | seções numeradas, steppers — bom (+ header dup) |
| 3 | /central-execucao | 🟡 mild | KPI cards verde flat; coluna direita rica |
| 4 | /carteira-clientes | 🟢 ON | tabela (th scope corrigido) |
| 5 | /meu-funil | 🟢 ON | colunas funil tintadas (Internet/Carteira/Porta) |
| 6 | /relatorios-vendedor | 🔴 OFF | **6 KPI cards brancos SEM ícone/chip** — mais flat |
| 7 | /devolutivas | 🟡 mild | cards ok; th scope corrigido |
| 8 | /pdi | 🟢 ON | empty state ok (+ header dup) |
| 9 | /treinamentos | 🟢 ON | icon chips coloridos, rico (+ header dup) |
| 10 | /classificacao | 🟡 mild | pódio bom; KPI cards brancos flat |
| 11 | /perfil | 🟢 ON | seções numeradas densas |
| 12 | /vendedor/configuracoes | 🟢 ON | **icon-chip cards (padrão correto)** |

---

## Causa raiz (sistêmica)

**Não há um componente único de KPI/stat card.** Cada tela estiliza o card do seu jeito:
- **Bare** (relatórios): branco, sem ícone
- **Flat verde** (home, central): chip verde sem tom semântico
- **Corner-icon** (ranking): branco com ícone canto
- **Icon-chip correto** (config, treinamentos, gerente/admin): chip tintado + tom

→ Inconsistência visual entre telas vendedor E vs padrão Gerente/Admin.

### Desvios secundários
1. **Header duplicado:** PDI, Terminal, Treinamentos renderizam header in-page (data + notif + user chip) que repete o top bar global. Redundante.
2. **Verde monocromático** em home/central vs multi-acento semântico do padrão.
3. **Título inconsistente:** ranking usa acento na palavra "Performance"; demais bold plano.

---

## Remediação (reuso, não invenção)

1. 🔴 **`StatCard` molecule único** (~10h) — icon-chip tintado + label + value + `tone` (green/red/orange/blue/purple). Extrair do padrão config/gerente. **Substituir** os cards bare/flat em: home, relatórios, central, ranking.
2. 🟡 **Remover header secundário duplicado** (~3h) — PDI, Terminal, Treinamentos usam só o top bar global.
3. 🟡 **Título padronizado** (~1h) — `PageHeader` consistente em todas as 12 telas.

**Impacto:** unifica o visual das 12 telas e alinha ao padrão Gerente/Admin. Maior alavanca = #1 (StatCard).

---

## Telas já conformes (manter)
Terminal MX, Funil, Carteira, PDI, Treinamentos, Perfil, Configurações — usam padrão estruturado/icon-chip.

## Recomendação de execução
Aplicar #1 com **baseline visual** (Playwright screenshot pré/pós por tela) para garantir zero regressão — telas afetadas: home, relatórios, central, ranking.
