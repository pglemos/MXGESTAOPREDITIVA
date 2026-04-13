# UI/UX Specification & Technical Debt Audit

**Project:** MX Performance
**Status:** ACTIVE
**Date:** April 13, 2026
**Auditor:** @ux-design-expert (Uma)

## 1. Design System & Principles

### Foundation
- **Methodology:** Strict Atomic Design (Atoms → Molecules → Organisms → Pages)
- **Styling:** TailwindCSS 4.1 + Radix UI Primitives + Framer Motion (v12)
- **Tokenization Strategy:** 100% tokenized. Use `mx-` prefixed tokens (e.g., `p-mx-md`, `text-mx-tiny`, `bg-brand-primary`).

### Usability Goals
1. **Efficiency:** Store managers can complete check-ins and performance reviews with minimal friction (under 2 minutes).
2. **Clarity:** Sales performance (D-0 vs D-1) and conversion funnels must be visually unambiguous.
3. **Responsiveness:** Flawless mobile experience, prioritizing touch areas and compact layouts for operational field usage.

## 2. Frontend & UX Audit (Technical Debt)

While the core modules have been refactored for Atomic Design compliance, an audit reveals residual technical debt across the UI.

### 🔴 Critical UX/UI Debt (Violations)
1. **Login Page Chaos (`src/pages/Login.tsx`):**
   - 39 token violations detected via `lint:tokens`.
   - Extensive use of arbitrary values (`w-[70%]`, `top-[-20%]`, `blur-[140px]`).
   - Standard tailwind classes (`p-16`, `w-40`) circumventing the `mx-` design system.
   - **UX Impact:** Inconsistent branding and unpredictable responsive behavior on different viewports.

### 🟡 High Priority UX/UI Debt
1. **Component Library Drift (`src/components/ui/`):**
   - Shadcn UI base components (`dialog.tsx`, `dropdown-menu.tsx`, `scroll-area.tsx`, `select.tsx`) still use hardcoded pixel values and VW units (e.g., `w-[95vw]`, `translate-x-[-50%]`, `min-w-[8rem]`).
   - **UX Impact:** Accessibility and scaling issues. These components do not respond accurately to our global spacing scale.

2. **Modal and Overlay Viewport Bounds:**
   - Scattered use of `max-h-[80vh]`, `max-h-[90vh]` instead of semantic layout containers.
   - Files affected: `GerenteTreinamentos.tsx`, `GerenteFeedback.tsx`, `History.tsx`, `WizardPDI.tsx`, `Layout.tsx`.
   - **UX Impact:** Scroll-trapping and clipping on small mobile screens.

### 🔵 Medium Priority UX/UI Debt
1. **Hardcoded Inline Styles in Print/Reporting Views:**
   - Extensive use of `style={{ textAlign: 'left' }}` in `PrintableFeedback.tsx` and `WeeklyStoreReport.tsx`.
   - Fixed millimeter widths (`w-[210mm]`) in `PDIPrint.tsx`.
   - Hardcoded colors in Recharts tooltips (`backgroundColor: '#1A1D20'`) in `SellerPerformance.tsx` and `SalesPerformance.tsx`.
   - **UX Impact:** Print views break atomic rules, and chart tooltips will fail to adapt if a Light Mode theme is introduced.

## 3. Action Plan (Next Steps)

1. **Refactor Login Page:** Completely rewrite `Login.tsx` to strictly use `mx-` tokens and grid/flex utilities.
2. **Saneamento da UI Base:** Atualizar as larguras e alturas da biblioteca Shadcn/Radix UI para absorver a escala `mx-`.
3. **Chart Theming:** Migrar as cores hardcoded nos componentes `<Tooltip />` do Recharts para ler as variáveis CSS do tema.

---
**Approval:** Uma (UX Design Expert)