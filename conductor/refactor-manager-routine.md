# Implementation Plan - Manager's Command Center (AIOX Method)

Refactor the `RotinaGerente.tsx` into a comprehensive Command Center that guides the manager through the daily, weekly, and monthly rituals of the MX Methodology.

## Objective
Ties all management features into a single, actionable workflow:
- **Daily**: Morning ritual (Meetings, Appointments, 10:30 Report).
- **Weekly**: Structured feedback, funnel gap correction, commitment goals.
- **Monthly**: PDI reviews and career evolution.

## Key Files
- `src/pages/RotinaGerente.tsx`: Primary UI component.
- `src/hooks/useData.ts`: Access to feedbacks and PDIs.
- `src/hooks/useCheckins.ts`: Access to real-time production.
- `src/lib/calculations.ts`: Diagnostics logic.

## Implementation Steps

### 1. UI Refactoring (`RotinaGerente.tsx`)
- **Dashboard Layout**:
    - Header showing "Operational Discipline Score".
    - Three-pill selection: [DIÁRIO] [SEMANAL] [ESTRATÉGICO].
- **Diário (Morning Ritual)**:
    - Checklist of 3 core tasks:
        1. "Reunião Individual Realizada" (Local state toggle).
        2. "Agendamentos Validados" (Auto-check if check-ins are done).
        3. "Relatório Enviado (Deadline 10:30)" (Integrated trigger to Edge Function).
    - "Cobrar Tropa" panel for sellers who haven't registered yet.
- **Semanal (Performance Hub)**:
    - Matrix of the team showing who received "Feedback Estruturado" this week.
    - "Gargalo da Unidade": Real-time analysis of the store's funnel gap.
    - "Meta Compromisso": Quick view of team attainment.
- **Estratégico (Monthly/PDI)**:
    - List of sellers with PDIs due for review.
    - Career evolution overview.

### 2. Logic Integration
- Combine multiple hooks to feed the routine metrics.
- Implement `triggerMorningReport` from the routine page.
- Track "Routine Completion" in local storage or a dedicated `manager_logs` table (future EPIC).

### 3. Visual Polish
- Use the "Elite" design system tokens (black, indigo, rose for alerts).
- Add animations for checklist completion.

## Verification & Testing

### Manual Verification
- Check if "Ritual Matinal" checklist correctly marks tasks as done.
- Verify that the "Deadline 10:30" countdown is visible.
- Ensure the "Weekly Feedback" status matches actual records in the `feedbacks` table.
- Verify the "Cobrar Tropa" button sends real notifications to the sellers.
