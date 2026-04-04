# Implementation Plan - Morning Report Refactor (AIOX Method)

Refactor the Morning Report screen to align with the legacy methodology requirements, moving from a generic "editorial briefing" to a data-driven operational cockpit.

## Objective
Implement the 5 core pillars of the AIOX Morning Report:
- Mathematical Projection (Meta vs. Projected).
- Inactivity Alerts (Stagnant leads/performance).
- WhatsApp Integration (Direct action on alerts).
- Daily Email Report (Status and trigger).
- Scheduled Send Time (10:30 constraint).

## Key Files
- `src/pages/MorningReport.tsx`: Primary UI component.
- `src/lib/calculations.ts`: Logic for projections and dates.
- `src/stores/main.ts`: Source of leads, goals, and team data.

## Implementation Steps

### 1. Data Logic & Calculations
- Import `calcularProjecao`, `getDiasInfo`, `calcularAtingimento` from `@/lib/calculations`.
- Fetch `leads`, `goals`, `team` from `useAppStore`.
- Compute:
    - **Current Sales**: Sum of sales from `team` or `leads`.
    - **Monthly Goal**: Sum of `goals` (type 'Equipe').
    - **Projection**: `calcularProjecao(currentSales, daysInfo.decorridos, daysInfo.total)`.
    - **Stagnant Leads**: `leads.filter(l => l.stagnantDays > 0)`.
    - **Inactivity Alerts**: Identify sellers with 0 actions in last 24h or leads waiting too long.

### 2. UI Refactoring (`MorningReport.tsx`)
- **Header**:
    - Update title to "Relatório Matinal Oficial".
    - Add a "Status de Envio" badge showing "Programado para 10:30".
    - Add "Enviar por E-mail" button with a loading state.
- **KPI Section (Mathematical Projection)**:
    - Create a prominent card for "Projeção Matemática".
    - Show: Realized vs. Goal vs. Projected.
    - Progress bar indicating % of goal reached vs. expected % for the day.
- **Alerts Section (Inactivity)**:
    - List stagnant leads with "Days Stagnant" counter.
    - Add a "WhatsApp" button for each entry to initiate immediate follow-up.
    - List sellers with "Alerta de Inatividade" if applicable.
- **Action Section**:
    - Replace generic "Pauta do Dia" with "Plano de Reativação".
    - Focus on specific counts (e.g., "X Leads para reativar hoje").

### 3. Interactivity
- Implement `handleWhatsApp(phone, message)`:
    - Opens `https://wa.me/phone?text=message`.
- Implement `handleSendEmail()`:
    - Simulate API call to send the morning report.
    - Show success toast: "Relatório disparado para os gestores."

## Verification & Testing

### Automated Verification
- Verify that `calcularProjecao` is called with correct arguments.
- Check that `stagnantLeads` filter correctly identifies mock data.

### Manual Verification
- Check if the "Projeção" value changes if mock data is modified.
- Verify that the WhatsApp button opens a new tab with the correct URL.
- Ensure the "Envio 10:30" label is clearly visible.
- Verify responsive layout on mobile/desktop.
