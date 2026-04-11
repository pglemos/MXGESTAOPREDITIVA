# Frontend & UX Specification - MX Performance

**Status:** ACTIVE
**Version:** 1.1 (Atomic Update)
**Responsible:** @ux-design-expert (Uma)

## 1. Design System Architecture
The system follows a strict **Atomic Design** methodology, powered by TailwindCSS 4 variables.

### Atoms
- **Typography:** Standardized `Typography` component with semantic variants (h1, h2, h3, p, caption, mono, tiny, micro).
- **Interactive:** `Button`, `Input`, `Select`, `Textarea`, `Badge`.
- **Feedback:** `Skeleton`, `Sonner` (toasts).

### Molecules
- **Card:** Base container for all elevation-based UI.
- **FormField:** Composite atom with label and error state.
- **MXScoreCard:** Specialized metric display with `aria-description` support.
- **ChallengeCard:** Gamification-based progress tracking.

### Organisms
- **PowerRankingList:** Hierarchical display of sellers and unit performance.
- **WizardPDI:** 4-step guided session for development plans.

## 2. Technical Standards
- **Tokenization:** 100% of colors and spacing use `mx-` prefix (e.g., `bg-brand-primary`, `p-mx-lg`).
- **Responsive Hardening:** Mobile-first approach. All grids use fallback `grid-cols-1`.
- **A11y:** Use of `aria-live`, `aria-atomic`, `role="log"`, and semantic HTML (`main`, `aside`, `nav`).

## 3. Identified Technical Debts (UI/UX Level)
- **[HIGH] Organism Scarcity:** Most pages re-implement complex structures instead of consuming standardized `Organisms`. Need to extract `MetricGrid` and `Timeline` into the library.
- **[MEDIUM] Icon Inconsistency:** Mix of standard Lucide icons and filled variants without a strict guideline on "stroke vs fill" for semantic actions.
- **[MEDIUM] Layout Utility Overlap:** Several layout classes (`mx-layout-sticky-offset`, etc.) are defined in `index.css`. These should be moved to a specific `src/styles/layout.css` or integrated into Tailwind plugin.
- **[LOW] Animation Budget:** Motion (Framer) is used extensively. Need to audit bundle size impact if the number of pages continues to grow.

---
**Audit Date:** April 11, 2026
**Approval:** Orion (Master Orchestrator)
