# Plan: 100% Comprehensive Fix for Admin Module (18 Pages)

**Objective:**
Perform a total correction of all 360+ issues identified across the 18 pages of the admin module, ensuring full compliance with Acessibility (A11y), Performance, and UI standards.

**Scope:**
- **Accessibility:** `aria-label`, `aria-hidden`, `aria-live`, `role`, `tabindex`, `focus-visible`, `<main>` landmark, semantic headings.
- **Tables:** `<caption>`, `scope="col/row"`, `<thead>`, `<tbody>`.
- **Forms:** `id`, `name`, `<label>`, `<fieldset>`, `<legend>`, `aria-required`.
- **UI/UX:** Removal of `text-[8px/9px/10px]`, fixing low contrast `text-gray-400`, fixing touch targets (44px+).
- **Performance:** Fixing multiple `GoTrueClient` instances, removing debug logs, implementing skeletons and memoization.

## Phased Implementation Plan

### Phase 1: Core Layout & Navigation
- [ ] **src/components/Layout.tsx:** Ensure it contains `<nav>`, `<aside>`, and consistent aria-labels for sidebar buttons.
- [ ] **src/pages/PainelConsultor.tsx:** root to `<main>`, fix all buttons, inputs, headings, and contrast.

### Phase 2: Unit Management
- [ ] **src/pages/Lojas.tsx:** Fix table semantics, aria-labels, view mode states, and contrast.
- [ ] **src/pages/DashboardLoja.tsx:** Fix individual store dashboard metrics and tables.
- [ ] **src/pages/OperationalSettings.tsx:** Fix complex configuration forms.

### Phase 3: People & Process
- [ ] **src/pages/Equipe.tsx:** Fix team grid, row interactions, and labels.
- [ ] **src/pages/Funil.tsx:** Fix Kanban semantics, drag-and-drop labels, and performance.
- [ ] **src/pages/GerentePDI.tsx:** Fix multi-step form, radar chart accessibility, and fieldsets.
- [ ] **src/pages/GerenteFeedback.tsx:** Fix feedback engine, chart labels, and list semantics.

### Phase 4: Data & BI
- [ ] **src/pages/Ranking.tsx:** Fix ordered list ranking, avatar alts, and toggles.
- [ ] **src/pages/MorningReport.tsx:** Fix operational grid, share buttons, and projections.
- [ ] **src/pages/Metas.tsx (GoalManagement.tsx):** Fix large matrix inputs and virtualization.
- [ ] **src/pages/Historico.tsx:** Fix activity logs, dates, and filters.

### Phase 5: Advanced & Technical
- [ ] **src/pages/Treinamentos.tsx:** Fix iframe titles, media lists, and progress bars.
- [ ] **src/pages/ProdutosDigitais.tsx:** Fix catalog semantics and contrast.
- [ ] **src/pages/RotinaGerente.tsx:** Fix daily checklist and ritual firing.
- [ ] **src/pages/AiDiagnostics.tsx:** Fix forense audit engine and tabs.
- [ ] **src/pages/Reprocessamento.tsx:** Fix bulk import terminal and log table.

## Detailed Task Checklist (Global Pattern)
For EACH page, verify:
1.  Root element is `<main>` or inside one.
2.  All Lucide icons have `aria-hidden="true"`.
3.  All buttons have `aria-label` if they are icon-only.
4.  All inputs have `id`, `name`, and a paired `<label>`.
5.  All tables have `<caption>` and `scope` on `<th>`.
6.  No `text-[8px]`, `text-[9px]`, or `text-[10px]` classes.
7.  `text-gray-400` replaced by `text-gray-600` on white backgrounds.
8.  Heading hierarchy is logical (`h1` -> `h2` -> `h3`).
9.  Clickable divs/spans have `role="button"`, `tabIndex={0}` and `onKeyDown`.
10. `focus-visible:ring` added to all interactive elements.

## Verification
- Re-run Lighthouse audit on all 18 routes.
- Monitor console for `GoTrueClient` warnings.
- Test keyboard navigation (Tab/Enter) on all interactive components.
