# Auditoria Design System / UX-UI / A11y / Responsividade — 2026-06-18

Executada via 3 agentes paralelos (Explore, read-only). Stack: React 19 + Vite + Tailwind 4 + Radix UI.

## CRÍTICO (7)

1. **Avatar sem alt text** (`src/components/atoms/Avatar.tsx`) — img sem alt/aria-label, fallback iniciais não acessível p/ screen reader.
2. **`hover:bg-brand-primary-hover` indefinido** (`src/App.tsx`, `ForcePasswordChange.tsx`, `GoogleCalendarView.tsx`, 5+ locais) — classe usada mas nunca definida em `src/index.css` @theme. Hover falha silenciosamente.
3. **`min-h-[120px]` arbitrário** (`src/components/atoms/Textarea.tsx:12`) — bypassa token system.
4. **Padding bottom insuficiente mobile** (`src/components/Layout.tsx:499`) — `pb-mx-12` (12px) vs bottom nav ~80px. Conteúdo cobre nav.
5. **Bottom nav grid-cols-5 squeeze <375px** (`src/components/Layout.tsx:782`) — iPhone SE labels truncados, sem breakpoint sm.
6. **RankingPodium quebra mobile** (`src/features/ranking/components/RankingPodium.tsx:24`) — `min-h-mx-64` fixo + `max-w-lg` não escala <375px, texto sobrepõe.
7. **Input height 14px mobile** (`src/components/atoms/Input.tsx:13`) — `h-mx-14 sm:h-12`, abaixo do touch target mínimo 44px (WCAG).

## MÉDIO (9)

- Layout.tsx — divs clicáveis (sidebar/drawer/mobile menu) sem aria-label; TabNav sem aria-controls.
- Input.tsx — placeholder:text-text-tertiary, contraste a verificar (4.5:1 AA).
- AlertCard.tsx:121 — botão "Ação Rápida" renderiza `<span>` sem callback, sem aria-disabled/role=button.
- Emergency CSS override (`src/index.css:1609-1614`) — `.rounded-2xl/.gap-6/.p-6` hardcoded `!important`, conflita com tokens (legado landing/consultoria).
- Cor duplicada `--color-score-elite` = `--color-brand-primary` mesmo hex, sem referência via var().
- Search input modal sem max-width (Layout.tsx:607-613) — pode exceder 100vw.
- Mobile bottom-sheet search input `h-mx-12` não escalável (Layout.tsx:688).
- Playwright cobre só Pixel 5 — falta <375px (iPhone SE) e landscape.
- FormField — `aria-describedby` não conecta erro ao input.

## BAIXO (6)

- Storybook sem play function de a11y/axe (Button, FormField stories).
- focus:ring vs focus-visible:ring inconsistente (Input vs Button).
- Nomenclatura espaçamento duplicada: `--spacing-mx-xs` vs `--spacing-mx-tiny` mesmo valor.
- SellerListItem.tsx:46 — `sm:hover` morto em mobile, sem impacto real.
- Atoms sem doc de estados hover/focus/disabled consistente.
- ADR ausente justificando aliases de cor.

## Recomendação de execução

Workflow existente cobre parte disso: `*workflow design-system-build-quality` (build→docs→a11y WCAG→ROI), mas não cobre responsividade/mobile nem UX heurística — gap real do framework AIOX atual.

Próximo passo sugerido: criar story(s) por bloco crítico e rodar SDC (`@sm *draft` → `@po *validate` → `@dev *develop` → `@qa *qa-gate`), priorizando os 7 críticos primeiro (touch targets, mobile nav, hover token, alt text).
