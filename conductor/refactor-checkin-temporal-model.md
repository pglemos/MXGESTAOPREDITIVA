# Implementation Plan - Check-in Temporal Model Refactor (AIOX Method)

Refactor the Check-in module to correctly model and display the temporal aspects of the data: submission date, reference production date, yesterday's metrics, and today's appointments.

## Objective
Align the Check-in UI and logic with the official MX Methodology:
- **Reference Date**: The business day the check-in belongs to.
- **Yesterday's Metrics**: Leads, Visits, and Sales (Porta, Carteira, Internet).
- **Today's Metrics**: Appointments scheduled for the current day.
- **Auditability**: Clearly show when the report is being sent vs. the period it refers to.

## Key Files
- `src/pages/DailyCheckin.tsx`: Primary UI for data input.
- `src/hooks/useCheckins.ts`: Logic for calculating reference dates and saving data.
- `src/types/database.ts`: Canonical data structure.

## Implementation Steps

### 1. Hook Enhancement (`useCheckins.ts`)
- Ensure `calculateReferenceDate` accurately reflects the 09:45 cutoff rule.
- Verify `saveCheckin` maps `CheckinFormData` correctly to the database columns (`..._prev_day` vs `..._today`).

### 2. UI Refactoring (`DailyCheckin.tsx`)
- **Header**:
    - Show "Data de Referência" (e.g., "Operação de 03/04").
    - Show "Data de Envio" (Current Timestamp).
- **Section 1: Produção de Ontem (Yesterday)**:
    - Group **Leads**, **Visitas**, and **Vendas** (Porta, Carteira, Internet) under "Ontem".
    - Add clear "D-1" labels.
- **Section 2: Agendamentos de Hoje (Today)**:
    - Group **Agendamentos** (Carteira, Internet) under "Hoje".
    - Add clear "D-0" labels.
- **Validation**:
    - Implement `validarFunil` before submission to ensure logical consistency (Vendas <= Visitas <= Agendamentos).

### 3. Data Flow
- Update the form state to match the required fields:
    - `leads_prev_day`
    - `visit_prev_day`
    - `vnd_porta_prev_day`, `vnd_cart_prev_day`, `vnd_net_prev_day`
    - `agd_cart_today`, `agd_net_today`

## Verification & Testing

### Automated Verification
- Verify that `saveCheckin` payload matches the `daily_checkins` table schema.
- Check that `calculateReferenceDate` returns yesterday if called before 09:45.

### Manual Verification
- Perform a check-in and verify in the "Historico" or database that the values are in the correct columns.
- Ensure the UI labels clearly distinguish between "Produção de Ontem" and "Agendamentos de Hoje".
- Verify that clicking "Consolidar" triggers a success toast and clears the form (or shows the submitted state).
