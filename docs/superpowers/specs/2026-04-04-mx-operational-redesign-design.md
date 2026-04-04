# Design Spec: MX Operational Redesign (Methodology Realignment)

**Date:** 2026-04-04
**Topic:** Realignment of Morning Report, Feedback, and PDI to MX Operational Standards.

## 1. Objective
Refactor the system's core interfaces to move away from "Mentorship/Editorial" style towards "Operational/Disciplined" standards. This involves renaming technical terms to operational ones, restructuring navigation by user persona, and redesigning key modules to be analytical and action-oriented.

## 2. Core Pillars (MX Methodology)
- **Mathematical Predictability:** Visual focus on Goal vs. Realized vs. Projected.
- **Operational Discipline:** Highlighting "Missing Registrations" (Sem Registro) and mandatory field impacts.
- **Direct Accountability:** Automated WhatsApp group formatting and hard status alerts (Green/Red rhythm).
- **Audit-based Feedback:** Moving from subjective text to tabular gap analysis based on 20/60/33 benchmarks.

## 3. Scope of Changes

### 3.1 Language Refactor (Terminology Mapping)
- **Remove:** cluster, node, network health, pacing engine, broadcast center.
- **Implement:** loja, vendedor, performance da rede, motor de projeção, relatório matinal.

### 3.2 Navigation Restructuring
Implement role-based navigation in `src/components/Layout.tsx`:
- **Consultoria/Admin:** Painel Geral, Lojas, Metas, Visão Geral, Relatório Matinal, Feedback Semanal, Treinamentos.
- **Gerente:** Painel da Loja, Equipe, Check-ins, Ranking, Feedback Estruturado, PDI, Treinamentos.
- **Vendedor:** Home, Lançamento Diário, Histórico, Ranking, Feedback, PDI, Treinamentos.

### 3.3 Module Redesigns

#### A. Morning Report (`MorningReport.tsx`)
- **Visuals:** Hard briefing layout. High-contrast Green/Red badges for rhythm.
- **Sections:**
    1. **Mathematical Projection:** Realized | Goal | Projected | Gap (Falta X).
    2. **Discipline Alerts:** List of sellers with "Sem Registro" (Check-in missing from yesterday/today).
    3. **Action:** "Resumo WhatsApp" button formatted for store group collection.

#### B. Feedback & PDI (`Feedback.tsx`, `GerenteFeedback.tsx`, `GerentePDI.tsx`)
- **Structure:** Tabular weekly audit (Week | Meta | Real | Gap).
- **Logic:** Auto-diagnostics based on `MX_BENCHMARKS` (20/60/33).
- **PDI:** Timeline-based with 5 mandatory actions and competence radar comparison.

#### C. Check-in (`Checkin.tsx`)
- **Structure:** 
    - **Section 1 (Yesterday):** Real Sales (Door, Portfolio, Internet) + Visits. (Mandatory).
    - **Section 2 (Today):** Goal Commitment (Meta Compromisso).
- **Constraint:** Visual warning on deadline (e.g., "Lançamento até as 10:00").

## 4. Architecture & Data Flow
- **Reuse:** `src/lib/calculations.ts` for projections and funnel diagnostics.
- **State Management:** `useAppStore` for real-time seller and goal tracking.
- **Persistence:** Supabase `feedbacks` and `pdi` tables (referencing `src/types/database.ts`).

## 5. Verification Plan
- **Role-based Auth:** Verify that a 'Gerente' cannot see 'Admin' menus and vice versa.
- **Calculations:** Ensure 'Gap' and 'Projection' values match manual MX formulas.
- **UI Audit:** Verify that no technical terms (node/cluster) remain in the user-facing interface.
- **Responsive Check:** Ensure the tabular feedback view is usable on tablets/mobile.
