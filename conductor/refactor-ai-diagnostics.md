# Implementation Plan - IA Forense & Audit Engine (AIOX Method)

Transform the `AiDiagnostics.tsx` page from a mock placeholder into a real operational audit engine that analyzes the database based on the 20/60/33 rule.

## Objective
Enable technical diagnostics and corrective prescriptions based on real data:
- **Audit Engine**: Real-time analysis of unit or specialist funnel.
- **Technical Gaps**: Identify LEAD_AGD, AGD_VISITA, or VISITA_VND bottlenecks.
- **Deep Audit**: Full visibility into the canonical check-in logs.
- **Correction Path**: Direct links to training modules based on detected gaps.

## Key Files
- `src/pages/AiDiagnostics.tsx`: The primary audit interface.
- `src/lib/calculations.ts`: The logic for generating the MX Diagnostic.
- `src/hooks/useCheckins.ts`: Source of raw production data.

## Implementation Steps

### 1. Data Integration
- Integrate `useTeam`, `useCheckins`, and `useAllStoreGoals` hooks.
- Implement filtering logic to switch between "Unidade Consolidada" and individual specialists.

### 2. Logic Implementation
- Replace the `setTimeout` mock with real calls to `calcularFunil` and `gerarDiagnosticoMX`.
- Map the `gargalo` type to specific training categories (Prospecção, Atendimento, Fechamento).

### 3. UI Refactoring
- **Diagnóstico Tab**:
    - High-impact KPI bar showing actual vs benchmark rates.
    - Prescrição MX section with actionable suggestions.
    - "Plano de Recuperação" card linking to the training module.
- **Deep Audit Tab**:
    - Comprehensive table of `daily_checkins` records.
    - Clear distinction between retroactive (D-1) and focus (D-0) metrics.
    - Efficiency highlighting (color-coded badges).

## Verification & Testing

### Manual Verification
- Select different sellers and verify that the funnel rates update correctly.
- Verify that the "Prescrição MX" changes based on which benchmark is failing.
- Check if the "Deep Audit" table correctly lists the history of check-ins for the selected target.
- Verify that the "Disparar Audit" button triggers the analysis and shows the success toast.
