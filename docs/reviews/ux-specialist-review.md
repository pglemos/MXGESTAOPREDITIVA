# UX Specialist Review - MX Performance

**Responsável:** @ux-design-expert (Uma)
**Data:** 11 de Abril de 2026

## 1. Débitos Validados
| ID | Débito | Severidade | Esforço (h) | Prioridade | Impacto UX |
|----|--------|------------|-------------|------------|------------|
| UI-01 | Extraction of Organisms | Alta | 8h | Média | Alto (Consistência) |
| UI-02 | Icon Inconsistency | Baixa | 2h | Baixa | Médio (Polimento) |
| UI-03 | Utility Overlap | Média | 4h | Alta | Baixo (Dívida Técnica) |

## 2. Débitos Adicionados
- **[CRITICAL] Mobile Density:** Algumas tabelas do Gerente (`Reprocessamento`, `History`) ainda possuem densidade de informação excessiva para telas < 360px, exigindo scroll horizontal agressivo. Recomendo o uso de "Cards Desconstrutores" para mobile.
- **[HIGH] Accessibility Contrast:** O modo dark da página de Login precisa de um audit de contraste nas labels `white/30`.

## 3. Respostas ao @architect
- **R:** Recomendo manter o `Skeleton` como um **Atomo independente** para flexibilidade, mas criar uma versão "composta" dentro de cada Molécula (ex: `MXScoreCard.Skeleton`) para garantir que o layout de loading seja 100% fiel ao layout final daquele componente.

## 4. Recomendações de Design
1. Criar o organismo `DataGrid` que abstraia a lógica de responsividade das tabelas (Cards em mobile, Table em desktop).
2. Padronizar todos os ícones para `Lucide` com `strokeWidth={2}`.
3. Mover utilitários de layout para o `tailwind.config.ts` como extensões de plugins em vez de CSS puro no `index.css`.

---
**Status:** VALIDATED
