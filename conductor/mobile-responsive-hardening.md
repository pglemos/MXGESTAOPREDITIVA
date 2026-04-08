# Mobile Responsive Hardening Plan

## Objective
Fix layout breakage, poor readability, and interaction issues on mobile devices for the MX Gestão Preditiva system.

## Key Changes
1. **Fluid Grids:** Update `DashboardLoja.tsx`, `RotinaGerente.tsx`, and `VendedorHome.tsx` to switch from rigid `lg:col-span-x` to fluid `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` layouts.
2. **Table Scrolling:** Implement `overflow-x-auto` with a container wrapper for all data tables.
3. **Responsive Spacing:** Replace large fixed paddings/margins (`p-mx-3xl`, `w-48`) with responsive utilities (`p-4`, `w-full`).
4. **Font/Typography:** Ensure font sizes scale down gracefully on small screens without losing the 'high-performance' brand aesthetics.
5. **Interactive Elements:** Ensure buttons and touch targets are at least 44x44px where possible.

## Implementation Steps
1. Refactor table components in `DashboardLoja.tsx`.
2. Update mobile padding in `Layout.tsx` (if applicable) and individual page components.
3. Replace hardcoded widths in sidebars and toolbars.
4. Validate layouts using responsive simulation.

## Verification
- Run `npm run typecheck` after every major file change.
- Simulate mobile viewport via browser inspection.
- Confirm table horizontal scrolling.
