# Wave 1 - UX Preflight

Status: completed by AIOX orchestration preflight  
Agent: aiox-ux-design-expert  
Date: 2026-05-15

## Objective

Define the intended experience for consultoria execution before implementation.

The meeting direction was clear: the consultant must open the meeting, conduct the meeting, capture information, generate the report, and close the meeting inside the system.

## Core Flow

Recommended visit execution sequence:

1. Context
   - client;
   - visit type;
   - objective;
   - selected analysis period.
2. Methodology
   - meeting steps;
   - what to ask;
   - what to capture;
   - required evidence.
3. Work Area
   - notes;
   - indicators;
   - tasks;
   - attachments;
   - transcript when available.
4. Executive Summary
   - positive points;
   - points to improve;
   - next actions;
   - accountable people;
   - dates.
5. Finalize
   - review;
   - generate report;
   - make summary available to client/group.

## Visit 8 UX Direction

Do not show Visit 8 as `8/7`.

Recommended label:

```txt
Acompanhamento Mensal
```

Alternative secondary label:

```txt
Visita 8 - Acompanhamento Mensal
```

The screen should make it clear that this is a recurring follow-up after the PMR main cycle.

## Agenda UX

Agenda should support:

- starting a visit from the calendar/list;
- creating Visit 8 for eligible clients;
- showing visit objective before opening;
- showing period if already selected;
- separating main PMR visits from follow-up visits visually.

Do not force all cards to look the same if the semantic state is different.

## Period Selector UX

Recommended control:

- segmented or dropdown preset for common periods;
- date range fields when `custom` is selected.

Preset labels:

- Mes atual
- Mes anterior
- Trimestre atual
- Trimestre anterior
- Personalizado

The selected period should be visible in the report preview.

## Executive Report UX

Report preview should not require the consultant to understand internal data order.

Recommended sections:

- Resultado do periodo;
- Resultado do trimestre, when available;
- Pontos positivos;
- Pontos a melhorar;
- Tarefas e proximos passos;
- Anexos;
- Transcricao, when available.

The generated report order should follow MX methodology even when the meeting conversation happened in a different order.

## Mobile Constraint

The visit execution screen may be used online and in person. It should not depend on wide desktop-only panels.

Minimum mobile rules:

- fixed action footer for save/finalize only if it does not cover content;
- no nested cards;
- compact section headings;
- controls large enough for touch;
- visible state for unsaved changes.

## Open Product Decision

W1-D03 should confirm whether the client sees the executive summary immediately during the meeting or only after consultant finalization.

UX recommendation: show a consultant-only preview during editing and publish the client-facing summary only after finalization.
