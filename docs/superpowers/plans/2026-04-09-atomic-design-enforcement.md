# Atomic Design Enforcement & Visual Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition the entire MX Performance frontend to a strict Atomic Design methodology, enforcing design tokens via ESLint and validating responsiveness/visual integrity in both Desktop and Mobile browsers.

**Architecture:** Tiered component library (Atoms → Molecules → Organisms) with centralized tokens in CSS/Tailwind and automated linting gates to prevent hardcoded style leakage.

**Tech Stack:** React, Tailwind CSS v4, Lucide React, ESLint, Driftx (Visual QA).

---

## Phase 1: Foundation & Enforcement (The "Constitution")

### Task 1: Setup ESLint Token Enforcement
**Files:**
- Modify: `eslint.config.js`
- Create: `scripts/lint-tokens.js`

- [ ] **Step 1: Create a custom lint script to detect hardcoded colors and arbitrary sizes**
```javascript
import fs from 'fs';
import path from 'path';

const RED_FLAGS = [
  /(bg|text|border|ring|fill|stroke)-\[#[0-9a-fA-F]{3,6}\]/g, // Hex in classes
  /(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?!50|100|200|300|400|500|600|700|800|900|950).*/g, // Non-MX colors
  /(p|m|gap|w|h|top|right|bottom|left)-\[.*\]/g // Arbitrary sizes
];

// Script to be integrated into CI or ESLint
```

- [ ] **Step 2: Update ESLint configuration to flag these as errors**
```javascript
// Add a custom rule or use 'eslint-plugin-tailwindcss' with strict whitelist
```

- [ ] **Step 3: Commit**
```bash
git add eslint.config.js scripts/lint-tokens.js
git commit -m "chore: setup automated token enforcement gates"
```

---

## Phase 2: Atomic Library Build

### Task 2: Build the 'Button' Atom (Adaptative Sizing)
**Files:**
- Create: `src/components/atoms/Button.tsx`
- Test: `src/test/atoms/Button.test.tsx`

- [ ] **Step 1: Implement Button with 44px min-size on mobile and semantic variants**
```tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-mx-md text-xs font-black uppercase tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 px-6 sm:h-10 sm:px-4", // 44px (11) on mobile, 40px (10) on desktop
  {
    variants: {
      variant: {
        primary: "bg-brand-primary text-white shadow-mx-md hover:bg-brand-primary-hover",
        secondary: "bg-brand-secondary text-white hover:bg-black",
        success: "bg-status-success text-white hover:opacity-90",
        danger: "bg-status-error text-white hover:bg-rose-600",
        outline: "border border-border-strong bg-white text-text-primary hover:bg-surface-alt",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-alt",
      }
    },
    defaultVariants: {
      variant: "primary"
    }
  }
)
// Component implementation...
```

- [ ] **Step 2: Commit**
```bash
git add src/components/atoms/Button.tsx
git commit -m "feat: build adaptive Button atom"
```

### Task 3: Build 'Badge', 'Input', and 'Typography' Atoms
**Files:**
- Create: `src/components/atoms/Badge.tsx`, `Input.tsx`, `Typography.tsx`

- [ ] **Step 1: Implement components using tokens and mobile-first sizing**
- [ ] **Step 2: Commit**
```bash
git add src/components/atoms/
git commit -m "feat: complete core atom library"
```

---

## Phase 3: Molecules & Organisms

### Task 4: Build 'Card' and 'FormField' Molecules
**Files:**
- Create: `src/components/molecules/Card.tsx`, `FormField.tsx`

- [ ] **Step 1: Standardize Card container with mx-tokens**
- [ ] **Step 2: Create FormField (Label + Atom/Input + Error)**
- [ ] **Step 3: Commit**
```bash
git add src/components/molecules/
git commit -m "feat: build standard molecules"
```

---

## Phase 4: Mass Migration (Refactoring)

### Task 5: Refactor Admin Module (Batch 1: First 6 Pages)
**Files:**
- Modify: `src/pages/PainelConsultor.tsx`, `Lojas.tsx`, `DashboardLoja.tsx`, `Equipe.tsx`, `Funil.tsx`, `GerentePDI.tsx`

- [ ] **Step 1: Replace manual JSX with Atoms/Molecules**
- [ ] **Step 2: Run Lint to ensure no #hex remains**
- [ ] **Step 3: Commit**
```bash
git commit -m "refactor: apply atomic design to admin batch 1"
```

### Task 6: Refactor Admin Module (Batch 2: Remaining 12 Pages)
- [ ] **Step 1: Refactor remaining pages**
- [ ] **Step 2: Commit**

### Task 7: Refactor Dono, Gerente, and Vendedor Modules
- [ ] **Step 1: Refactor all profile-specific pages**
- [ ] **Step 2: Commit**

---

## Phase 5: Forensic Validation (Visual QA)

### Task 8: Automated Browser Capture & Audit
**Files:**
- Create: `scripts/visual-audit.cjs`

- [ ] **Step 1: Create script to capture all pages in Desktop/Mobile using Playwright**
- [ ] **Step 2: Run audit and generate report**
- [ ] **Step 3: Final Fixes**
- [ ] **Step 4: Final Commit**
```bash
git commit -m "style: final atomic polish and visual compliance"
```
