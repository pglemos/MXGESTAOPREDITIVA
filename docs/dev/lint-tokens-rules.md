# Lint-tokens AST — Regras e Operação

**Story 3.8 — UX-006** | Script: `scripts/lint-tokens-ast.mjs` | Legacy: `scripts/lint-tokens.legacy.js`

## Propósito

Garantir que cores hex (`#RRGGBB`, `#RGB`, `#RRGGBBAA`) **não sejam hardcoded** em código TS/TSX da aplicação. Toda cor deve vir de:

- `chartTokens` (`src/lib/charts/tokens.ts`) — para componentes recharts e ícones SVG.
- CSS variables (`--color-*` em `src/index.css`) — para CSS classes.
- Tailwind tokens MX (`mx-*`, `brand-*`, `status-*`).

## Detecção (AST-driven)

Usa **TypeScript Compiler API** (`ts.createSourceFile`) com visitor pattern. Diferente do regex-based legacy, **não gera falsos positivos** em:

- Comentários
- Strings com `#` que não são hex (`#section-id`, `mailto:`, etc.)
- Data URIs (`data:image/...`)

Detecta hex em:

| Tipo AST                         | Exemplo                            |
| -------------------------------- | ---------------------------------- |
| `StringLiteral`                  | `"#0D3B2E"`, `'#22C55E'`           |
| `NoSubstitutionTemplateLiteral`  | `` `#FACC15` ``                    |
| `TemplateHead/Middle/Tail`       | `` `color: #abc; bg: ${x}` ``      |
| `JsxText`                        | conteúdo textual em JSX            |
| JSX attributes (string values)   | `<Line stroke="#0D3B2E" />`        |

## Whitelist (paths legítimos)

Configurada em `WHITELIST_PATTERNS` no script:

- `src/lib/charts/tokens.ts` — definição canônica.
- `src/index.css` — definição de CSS vars.
- `src/features/landing/**` — preservar visual histórico (UX-001).
- `src/lib/observability/**` — Sentry, web-vitals (não é design).
- `src/lib/automation/email/**` — templates HTML para email (CSS vars não resolvem em Gmail/Outlook).
- `src/features/consultoria/components/VisitOne*.tsx`, `VisitReport*.tsx` — print/PDF templates.
- `src/pages/PDIPrint.tsx` — print template.
- `**/*.test.{ts,tsx}`, `**/*.spec.{ts,tsx}`, `__tests__/`, `test/`.

## Exceções inline

Para suprimir uma linha específica:

```ts
const corLegacy = '#abc123' // lint-tokens-ignore-line
// ou:
// lint-tokens-ignore
const outra = '#def456'
```

## Comandos

```bash
npm run lint:tokens              # exit 1 se violations
node scripts/lint-tokens-ast.mjs --warn-only
node scripts/lint-tokens-ast.mjs --json
```

## CI

Workflow `.github/workflows/atomic-lint.yml` roda `npm run lint:tokens` em PR e push para `main`. Falha se exit code ≠ 0.

## Adicionando exceção por path

Editar `WHITELIST_PATTERNS` em `scripts/lint-tokens-ast.mjs`. Adicionar regex e justificativa (comentário). Preferir whitelist por path a múltiplos `// lint-tokens-ignore-line`.

## Sugestão automática de token

O lint mapeia hex conhecidos (`#0D3B2E`, `#22C55E`, etc.) para o token correto em `chartTokens`. Output:

```
src/pages/Dashboard.tsx
  120:34  #0D3B2E → use chartTokens.primary()
```

## Performance

Scan de ~228 arquivos em ~0.3s. Linear em N(arquivos). Sem dependências extras além do `typescript` já instalado.

## Migração do legacy

O lint legacy (`lint-tokens.legacy.js`) focava em **classes Tailwind** (cores `-blue-500`, valores arbitrários `[#0D3B2E]`, números crus em spacing). O novo AST-driven foca em **hex literals**. As duas validações são **complementares**:

- Próxima iteração: ESLint plugin custom integrando ambas em uma única passada.
- Por enquanto: rodar manualmente `npm run lint:tokens:legacy` se quiser checar regressões de classes Tailwind.
