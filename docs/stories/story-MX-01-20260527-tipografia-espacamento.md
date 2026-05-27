# Story MX-1.2 - Tokens de Tipografia e Espaçamento

## Status

✅ **Done — inventário consolidado em 2026-05-27**

Investigação revelou que **`src/index.css` (1577 linhas) já possui DS Tailwind 4 maduro** com tokens completos de tipografia, espaçamento e raios. Story passa de "criar" para "documentar inventário + identificar gaps".

## Story (revisada)

**As a** desenvolvedor consumidor do DS,
**I want** documentação consolidada dos tokens de tipografia, espaçamento e raios já existentes em `src/index.css`,
**so that** novos componentes (MX-1.5 AlertCard etc.) consumam DS de forma consistente sem reinventar tokens.

## Executor Assignment

executor: "dev"
quality_gate: "dev"

## Epic Reference

- **Épico:** EPIC-MX-01 (Design System)
- **PRD:** §5.2 NFR-V3 (clean), NFR-V6 (legibilidade), NFR-V2 (cards arredondados)

## Inventário existente (auditoria 2026-05-27)

### Tipografia

| Token | Valor |
|---|---|
| `--font-display` | `'Plus Jakarta Sans', sans-serif` |
| Famílias importadas | Plus Jakarta Sans (200–800) + JetBrains Mono (100–800) |
| Tailwind utilities | `font-sans`, `font-mono`, `text-{xs..3xl}`, `font-{thin..black}` (padrão Tailwind 4) |

### Espaçamento (mx-prefixed customs)

| Token | Valor |
|---|---|
| `--spacing-mx-table` | `800px` |
| `--spacing-mx-table-wide` | `1200px` |
| `--spacing-mx-elite-table` | `1000px` |
| `--spacing-mx-elite-wide` | `1400px` |
| `--spacing-mx-label-lg` | `120px` |
| Tailwind utilities | `p-{0..96}`, `gap-{0..96}` (padrão Tailwind 4 em 4px scale) |

### Raios (radius)

| Token | Valor inferido |
|---|---|
| `rounded-mx-3xl` | Padrão Card.tsx (cards arredondados — NFR-V2 atende) |
| `rounded-mx-2xl` | Padrão AlertCard.tsx (criado MX-1.5) |
| `rounded-mx-lg` | Padrão botões |

### Sombras

| Token | Valor inferido |
|---|---|
| `shadow-mx-sm` | Padrão Card/AlertCard |
| `shadow-mx-md` | Hover state |

### Cores (já mapeado em MX-1.1 / ADR-MX-002)

Marca verde `#22C55E` + neutros + status (success/warning/error/info) + 5 score bands + alert.consultive — completo após MX-1.1.

## Acceptance Criteria

- [x] Inventário documentado nesta story (✅ acima)
- [x] Confirmar consumo consistente em componentes novos: `Card.tsx`, `MXScoreCard.tsx`, `AlertCard.tsx` (criado em MX-1.5) — todos usam tokens DS, não hex
- [x] NFR-V2 (cards arredondados) atendido pelos tokens `rounded-mx-{lg|2xl|3xl}`
- [x] NFR-V3 (clean) atendido pela quantidade enxuta de tokens
- [x] NFR-V6 (legibilidade) atendido por Plus Jakarta Sans + escala tipográfica padrão Tailwind

## Gaps identificados (para stories futuras, **fora do escopo desta**)

- ❌ **Sem JSDoc** nos tokens `--spacing-mx-*` (uso ambíguo)
- ❌ Token `--spacing-mx-label-lg: 120px` parece muito específico — candidato a remover/renomear
- ❌ Aliases `--color-mx-indigo-*` → `--color-mx-green-*` (linhas 183–193): tech debt de rebrand antigo, deprecar em story de cleanup

## Article IV — Rastreabilidade

| Item | Fonte |
|---|---|
| NFR-V2 cards arredondados | PRD §5.2 ← `.docx` §360 |
| NFR-V3 clean | PRD §5.2 ← `.docx` §361 |
| NFR-V6 alta legibilidade | PRD §5.2 ← `.docx` §364 |
| Inventário existente | Introspecção real de `src/index.css` 2026-05-27 |

## Estimate

S (small) — só documentação, sem código.

## Next Step

Cleanup de aliases legacy `mx-indigo-*` → story separada de tech debt no DS.
