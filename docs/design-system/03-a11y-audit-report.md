# Design System — Accessibility Audit (WCAG 2.1 AA)

**Pipeline:** `design-system-build-quality` · **Phase:** 3/4 — Quality Assurance
**Date:** 2026-04-13 · **Auditor:** @ux-design-expert · **Standard:** WCAG 2.1 Level AA

---

## Executive Summary

| Dimensão | Status | Violações |
|----------|--------|-----------|
| **Contraste de cores** | ⚠️ CONCERNS | 2 HIGH (brand-primary como texto) |
| **Navegação por teclado** | ✅ PASS | — |
| **ARIA / roles** | ⚠️ CONCERNS | 10+ MEDIUM (icon-only buttons sem label) |
| **Focus states** | ✅ PASS | ring-4 em todos os atoms |
| **Touch targets** | ✅ PASS | `h-mx-11` = 44px default |
| **Semantic HTML** | ✅ PASS | label/htmlFor correto em FormField |
| **Alt text em imagens** | ⚠️ CONCERNS | 2 LOW (pages) |

**Verdict:** ⚠️ CONCERNS — 2 HIGH, 10+ MEDIUM, 2 LOW · **Zero CRITICAL** · remediable em sprint curto.

---

## 1. Contraste de Cores (WCAG 1.4.3)

**Critério:** 4.5:1 texto normal · 3:1 texto grande (≥18pt ou ≥14pt bold) · 3:1 UI components.

### Pares testados

| FG / BG | Hex | Ratio | Normal AA | Large AA | UI AA |
|---------|-----|-------|-----------|----------|-------|
| `text-primary` / white | `#0A0A0B` | **~19.6:1** | ✅ | ✅ | ✅ |
| `text-secondary` / white | `#475569` | **~7.9:1** | ✅ | ✅ | ✅ |
| `text-tertiary` / white | `#94a3b8` | **~2.8:1** | ❌ | ❌ | ❌ |
| `brand-primary` / white | `#22C55E` | **~2.30:1** | ❌ | ❌ | ❌ |
| white / `brand-primary` | `#22C55E` bg | **~2.30:1** | ❌ | ❌ | ❌ |
| white / `brand-secondary` | `#0D3B2E` bg | **~12.5:1** | ✅ | ✅ | ✅ |
| `mx-green-700` / white | `#15803d` | **~5.0:1** | ✅ | ✅ | ✅ |
| `mx-green-900` / white | `#14532d` | **~10:1** | ✅ | ✅ | ✅ |

### Violações HIGH

#### V-A11Y-001 · `text-brand-primary` em textos body
**Onde:** `text-brand-primary` usado em `Badge`, `MXScoreCard tone=brand`, `ChallengeCard`, links em pages, contadores em `Layout.tsx`.
**Problema:** 2.30:1 < 4.5:1 exigido para texto normal.
**Impacto:** usuários com baixa visão ou daltonismo verde têm dificuldade de leitura.

**Fix recomendado:**
```diff
- className="text-brand-primary"
+ className="text-mx-green-700"   // 5.0:1 — passa AA
```
Ou para texto forte em métricas (valor destacado):
```diff
+ className="text-mx-green-900"   // ~10:1 — excelente
```

#### V-A11Y-002 · `text-white` em `bg-brand-primary` (Botão primário)
**Onde:** `<Button>` default, submit de Login, CTAs principais.
**Problema:** 2.30:1 < 4.5:1. Marginal para "large text" porque usa `font-black` + `text-sm`, mas ainda falha o critério 3:1 de grande.
**Impacto:** ação mais importante do sistema tem o pior contraste.

**Fix recomendado — escolher 1:**

1. **Darker green default** (preferido — mantém identidade):
   ```diff
   - className="... bg-brand-primary hover:bg-mx-green-400 text-white"
   + className="... bg-mx-green-700 hover:bg-mx-green-800 text-white"
   ```
   → 5.0:1 ✓

2. **Brand-secondary como "primary CTA"** (mais premium):
   ```diff
   - className="... bg-brand-primary text-white"
   + className="... bg-brand-secondary hover:bg-mx-green-950 text-white"
   ```
   → 12.5:1 ✓

3. **Manter green-500 com texto escuro**:
   ```diff
   - className="... bg-brand-primary text-white"
   + className="... bg-brand-primary text-brand-secondary font-black"
   ```
   → `text-brand-secondary` em `#22C55E`: ~7.5:1 ✓

### Violações LOW

#### V-A11Y-003 · `text-text-tertiary`
**Onde:** placeholders, subtítulos em várias pages.
**Nota:** 2.8:1. Placeholders são **isentos** por WCAG 1.4.3 (C.1 note). Para copy visual, subir para `text-secondary` (`#475569`, 7.9:1).

---

## 2. Navegação por Teclado (WCAG 2.1.1, 2.4.3, 2.4.7)

✅ PASS.
- Ordem de tab natural em `Login` (email → password → submit)
- Radix primitives (Dialog, Dropdown, Tabs, Select) gerenciam focus-trap e roving index nativamente
- `Button` herda `<button>` native → Enter/Space ✓
- `tabIndex` customizado: não usado (bom)

---

## 3. Focus States (WCAG 2.4.7)

✅ PASS — todos os atoms interativos têm focus visível:

| Componente | Focus style |
|------------|-------------|
| `Button` | `focus-visible:ring-4 focus-visible:ring-brand-primary/20 outline-none` |
| `Input` | `focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5` |
| `Select` | `focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5` |
| `FormField` | `group-focus-within:text-brand-primary` em ícone |

**Touch target:** `h-mx-11` (2.75rem = 44px) satisfaz WCAG 2.5.5 AAA (44x44).

---

## 4. ARIA & Semantic HTML

### ✅ Padrões exemplares

- **`FormField.tsx`**: `<label htmlFor={fieldId}>` + `aria-hidden="true"` em icon decorativo + `group-focus-within` — **reference implementation**.
- **`Button.tsx`**: auto-aplica `aria-hidden="true"` em children SVG.

### ⚠️ Violações MEDIUM — icon-only buttons sem `aria-label`

**10+ ocorrências** em pages:

| Arquivo:linha | Contexto |
|---------------|----------|
| `pages/Checkin.tsx:237` | `<Button variant="outline" size="icon" onClick={() => navigate('/home')}>` |
| `pages/Configuracoes.tsx:71` | `<Button size="icon" variant="secondary">` (botão flutuante de avatar) |
| `pages/ConsultoriaClientes.tsx:157` | `<Button variant="outline" size="icon" onClick={() => refetch()}>` |
| `pages/ConsultorNotificacoes.tsx:80` | `<Button ... onClick={handleRefresh}>` |
| `pages/ConsultorNotificacoes.tsx:104` | Close button `<X size={24} />` |
| `pages/ConsultorTreinamentos.tsx:60,84,174` | refresh / close / navigate |
| `pages/DailyCheckin.tsx:115` | refresh |

**Fix (padrão):**
```diff
- <Button variant="outline" size="icon" onClick={() => refetch()}>
+ <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Atualizar lista">
    <RefreshCw size={18} />
  </Button>
```

**Enforcement proposto:** lint rule eslint-plugin-jsx-a11y `no-autofocus` + custom rule que exige `aria-label` quando `size="icon"`.

### ⚠️ Violações LOW — `<img>` sem `alt`

- `pages/Configuracoes.tsx:66` — provável avatar de usuário
- `pages/Equipe.tsx:171` — provável avatar de membro

**Fix:** `alt={user.name ? \`Foto de \${user.name}\` : ''}` (vazio = decorativo explícito é aceitável).

---

## 5. Screen Reader Patterns

Não testado manualmente nesta rodada. Radix primitives (Dialog/Dropdown/Tabs/Tooltip) são conhecidos por boa compatibilidade com NVDA/VoiceOver/JAWS.

**Recomendado:** rodada manual com VoiceOver em Login + Dashboard após remediação dos HIGH.

---

## 6. Remediation Plan

### Sprint curto (high-impact, low-effort)

| # | Severity | Item | Estimativa | Owner |
|---|----------|------|-----------|-------|
| 1 | HIGH | Trocar `text-brand-primary` por `text-mx-green-700` em badges/cards | 2h | @dev |
| 2 | HIGH | Escolher estratégia V-A11Y-002 e aplicar em `Button` default | 1h | @ux-design-expert + @dev |
| 3 | MEDIUM | Adicionar `aria-label` em 10+ icon-only buttons | 1h | @dev |
| 4 | LOW | Adicionar `alt` nas 2 `<img>` | 15min | @dev |
| 5 | LOW | Rename classes legacy `mx-indigo-*` → `mx-green-*` (cosmético) | 1h | @dev |

**Total:** ~5h de remediação.

### Sprint médio (enforcement)

- Adicionar `eslint-plugin-jsx-a11y` ao lint pipeline
- Incluir audit `axe-core` no CI (step após build)
- Gate: `ratio < 4.5 para text-*` reprova PR

---

## Critérios de Sucesso

- [x] Contraste documentado e ratios computados
- [x] Navegação por teclado validada
- [x] ARIA labels verificados (violações listadas)
- [x] Focus states confirmados em todos atoms
- [ ] Zero violações críticas WCAG AA → **ATINGIDO** (zero CRITICAL)
- [ ] Zero HIGH → **PENDENTE** (2 HIGH listados, plano em place)

---

## Outputs

- `a11y_audit_report`: este documento
- `violations_list`: V-A11Y-{001..003} + 10+ MEDIUM + 2 LOW
- `remediation_plan`: seção 6 acima

**Status:** ⚠️ CONCERNS — pipeline continua para Phase 4 com debt registrado. Remediation sprint sugerido antes do próximo release de produção.
