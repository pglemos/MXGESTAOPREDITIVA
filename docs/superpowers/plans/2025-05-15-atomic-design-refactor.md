# Atomic Design & WCAG 2.1 AA Compliance Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `src/pages/` and `src/components/` to ensure 100% compliance with Atomic Design (using Typography component) and WCAG 2.1 AA (semantics and accessibility).

**Architecture:** 
- Centralize all text rendering through the `Typography` component.
- Ensure Atoms like `Badge` and `Button` use `Typography` for their internal text content.
- Standardize font sizes using `Typography` variants (`tiny`, `caption`, `p`, etc.).
- Maintain semantic integrity using the `as` prop.

**Tech Stack:** React, TypeScript, Tailwind CSS, Radix UI.

---

### Task 1: Refactor Atoms (Badge and Button)

**Files:**
- Modify: `src/components/atoms/Badge.tsx`
- Modify: `src/components/atoms/Button.tsx`

- [ ] **Step 1: Update Badge to use Typography internally**
- [ ] **Step 2: Update Button to use Typography internally**
- [ ] **Step 3: Remove arbitrary font size classes from Badge and Button variants**

### Task 2: Refactor Priority Pages

**Files:**
- Modify: `src/pages/ConsultorTreinamentos.tsx`
- Modify: `src/pages/Feedback.tsx`
- Modify: `src/pages/VendedorTreinamentos.tsx`
- Modify: `src/pages/Lojas.tsx`
- Modify: `src/pages/Gamification.tsx`
- Modify: `src/pages/Funil.tsx`
- Modify: `src/pages/Agenda.tsx`
- Modify: `src/pages/Notificacoes.tsx`

- [ ] **Step 1: Replace raw HTML text tags with Typography**
- [ ] **Step 2: Remove arbitrary Tailwind font size classes**
- [ ] **Step 3: Ensure semantic correctness with 'as' prop**

### Task 3: Global Sweep of src/pages/ and src/components/

**Files:**
- Modify: All files in `src/pages/` and `src/components/` recursively.

- [ ] **Step 1: Use grep to find remaining raw text tags and arbitrary text classes**
- [ ] **Step 2: Batch refactor remaining files**

### Task 4: Verification and Accessibility Audit

- [ ] **Step 1: Run lint and type checks**
- [ ] **Step 2: Verify visual consistency**
- [ ] **Step 3: Check for accessibility regressions**
