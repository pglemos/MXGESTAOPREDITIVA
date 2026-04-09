# Design Spec: Atomic Design Enforcement & Visual Governance

**Status:** Draft | **Author:** Orion (aiox-master) | **Date:** 2026-04-09

## 1. Problem Statement
The current UI architecture of the MX Performance system is built using a "Top-Down" approach (Template → Page directly), bypassing standardized Atoms and Molecules. This has led to:
- **Component Redundancy:** Multiple versions of `Card`, `Badge`, and `Header` reinvented across 18+ admin pages.
- **Visual Inconsistency:** Hardcoded hex colors, RGB values, and arbitrary Tailwind classes (e.g., `text-[10px]`, `bg-indigo-600`) bypassing the semantic token layer.
- **Responsive Fragility:** Inconsistent behavior in mobile browsers due to "artisanal" layout fixes.
- **Lack of Enforcement:** No automated gates to prevent technical and visual debt.

## 2. Proposed Solution: The "Atomic Law"
Transition the entire frontend architecture to a strict **Atomic Design** methodology with automated enforcement.

### 2.1. Core Architecture
Reorganize components into a tiered structure:
- **Atoms (`src/components/atoms/`):** Indivisible units (Button, Input, Badge, Typography, Icon).
- **Molecules (`src/components/molecules/`):** Simple groups of atoms (FormField, StatCard, EmptyState).
- **Organisms (`src/components/organisms/`):** Complex, functional sections (MXTable, FeedbackBoard, PageHeader).
- **Shared Library:** Atoms will be 100% shared across all modules (Admin, Dono, Gerente, Vendedor) to maintain a unified brand identity.

### 2.2. The "Law" (Design Tokens & Enforcement)
- **Strict Tokenization:** All styling must originate from the tokens defined in `src/index.css`.
- **ESLint Enforcement:** Implement rules to block:
    - Hardcoded colors (`#hex`, `rgb`, `bg-blue-500` if not an MX token).
    - Arbitrary sizing/spacing classes (e.g., `p-[13px]`, `w-[200px]`).
    - Non-standard font sizes.
- **Auto-Adaptive Sizing:** All interactive atoms (Buttons, Inputs) will automatically scale to a minimum of 44px on mobile devices to ensure accessibility.

### 2.3. Forensic Validation Workflow
A rigorous validation process to ensure 100% compliance:
1.  **Capture Baselines:** Full-screen screenshots of all pages in Desktop (1440px) and Mobile (375px).
2.  **Pixel-Perfect Audit:** Use `Driftx` to detect discrepancies between the new atomic implementation and design standards.
3.  **Visual Evaluation:** Manual review of every screenshot to confirm accessibility, contrast, and responsive integrity.

## 3. Implementation Phases

### Phase 1: Foundation & Enforcement (The "Constitution")
- Setup folder structure.
- Configure ESLint/Stylelint gates.
- Refactor `tailwind.config.js` to strictly match MX tokens.

### Phase 2: Atomic Library Build
- Build the core Atoms and Molecules using Shadcn as a technical base, refactored for 100% token dependency.

### Phase 3: Mass Migration (Admin Module)
- Refactor 18 pages/tabs of the Admin module to use the new library.

### Phase 4: Full System Expansion
- Refactor Dono, Gerente, and Vendedor modules.

### Phase 5: Final Forensic Audit
- Generate validation reports and fix visual leaks.

## 4. Success Criteria
- [ ] 0 instances of hardcoded hex/rgb in the entire `src/` directory.
- [ ] 100% of pages using shared Atoms/Molecules.
- [ ] Mobile navigation scores 90+ in A11y audits.
- [ ] Linting gate prevents merging of non-compliant code.

---
— Orion, orquestrando o sistema 🎯
