# MX Performance Frontend Specification

## Introduction

This document outlines the frontend architecture and design standards for **MX Performance**, following the universal UI refactor (Story 6.1.2.1). It focuses on the implementation of **Atomic Design** and the use of **Tailwind 4** tokens.

---

## 🎨 Design System & Tokens

### 1. Typography (JetBrains Mono & Plus Jakarta Sans)
- **Primary Font**: Plus Jakarta Sans (UI, Headings, Body).
- **Numbers/Metrics**: JetBrains Mono (Tabular nums for performance data).
- **Scale**:
  - `h1`: 4xl/5xl, font-black, uppercase.
  - `h2`: 2xl/3xl, font-black, uppercase.
  - `caption`: tiny (10px), font-black, tracking-widest.
  - `tiny`: micro (9px), font-black.

### 2. Color Palette (Semantic)
- **Brand**: `brand-primary` (#4f46e5), `brand-secondary` (#1A1D20).
- **Status**: `success` (#10b981), `warning` (#f59e0b), `error` (#ef4444), `info` (#3b82f6).
- **Surfaces**: `surface-default` (White), `surface-alt` (#f8fafc).
- **Prefix**: All custom colors use the `mx-` or category-specific prefix in CSS variables.

### 3. Spacing & Radius
- **Radius**: `mx-sm` (0.5rem) to `mx-3xl` (2rem), plus `mx-full`.
- **Spacing**: Atomic scale using `mx-` prefix (e.g., `p-mx-lg`, `gap-mx-xs`).

---

## 🧩 Atomic Component Architecture

### 1. Atoms (`src/components/atoms/`)
Definitive UI primitives. **MUST NOT** contain business logic.
- **`Button`**: Highly variant-driven (primary, secondary, success, etc.) with built-in Typography support.
- **`Typography`**: Centralized text handler with `variant` and `tone` props.
- **`Badge`**, `Input`, `Select`, `Textarea`.

### 2. Molecules (`src/components/molecules/`)
Functional units. Can contain simple internal state but avoid direct API calls.
- **`Card`**: Standardized container with header/content/footer.
- **`FormField`**: Label + Input + Error messaging.
- **`MXScoreCard`**: Metric visualization with iconography.

### 3. Organisms (`src/components/organisms/`)
Complex sections. Can handle data orchestration.
- **`PowerRankingList`**: Full-featured ranking visualization.

---

## 📱 Layout & Responsiveness

- **Sidebar**: Collapsible (80px to 280px).
- **Grid System**: Standardized use of `gap-mx-lg` for consistency.
- **High-Density**: Custom "Elite" widths (`mx-elite-table`, `mx-elite-canvas`) for reports and large-scale data visualization.

---

## ♿ Accessibility (a11y) & UX Standards

- **Radix UI**: All interactive atoms (`Select`, `Dialog`, `Tabs`) are built on Radix primitives for keyboard navigation and screen reader support.
- **Visual Feedback**: Mandatory use of `Motion` for transitions and `sonner` for toast notifications.
- **Contrast**: High-contrast status colors (e.g., `status-error-surface` with `status-error` text) following WCAG AA standards.

---

## 🔴 UX Technical Debt & Inconsistencies

1. **Large Components**: Main dashboard pages (`VendedorHome`, `GerenteFeedback`) are over-indexed on logic.
   - **Recommendation**: Move prescription and complex metric logic to specialized hooks or features.
2. **Duplicate Assets**: Legacy `src/components/ui/` components still exist.
   - **Policy**: All new features must use `src/components/atoms/`.
3. **Skeleton States**: Inconsistent use of loading skeletons across different pages.
