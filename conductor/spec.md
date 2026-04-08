# Track Specification: Legacy to MX Performance Migration (Full Scope)

## 1. Core Data Model (The Canonical Contract)
- Fields: `DATA`, `LOJA`, `VENDEDOR`, `LEADS`, `VND_PORTA`, `AGD_CART`, `VND_CART`, `AGD_NET`, `VND_NET`, `VISITA`.
- Must be the "Single Source of Truth" for all derived analytics.

## 2. Aggressive Resilient Importer
- **Features**: 
    - Flexible column mapping (searching for keywords in headers).
    - Data sanitization (date normalization, numeric cleaning).
    - Deduplication (Loja + Vendedor + Data).
    - Audit logs & Replayability.

## 3. Store Governance Module (Config)
- **Settings per unit**:
    - Meta (monthly).
    - Contacts (Morning/Weekly email lists).
    - WhatsApp group ID.
    - Benchmarks/Source Mode/Team tenure (vigência).

## 4. Operational & Executive Dashboard
- **Features**: 
    - Executive KPIs (Meta, Sold, Projected, % Completion, Ranking).
    - Operational detail (raw grid per seller).
    - Logic: Exclusion of "VENDA LOJA" from individual divisor for specific metrics.

## 5. Manager Command Center
- **Features**: 
    - Launch status monitor.
    - Accountability/Mass-coaching.
    - Daily routine schedule.
    - Risk/Ranking view (real-time).

## 6. Official Morning Report (Automated)
- **Features**: 
    - Base recalculation engine.
    - Projection analysis.
    - Generation of HTML body + Official XLSX attachment.
    - WhatsApp CTA generation.
    - Idempotent execution (Cron-driven).

## 7. Admin Executive Overview
- **Features**: 
    - Real-time Semaphore (Pacing, Gap, Status).
    - Multi-store comparative analysis.

## 8. Automated Weekly Feedback Loop
- **Features**: 
    - Engine triggers Monday 12:30.
    - Diagnoses bottlenecks automatically.
    - Actionable training suggestions.
    - Multi-store PDF/XLSX delivery + WhatsApp script.

## 9. Automated Monthly Close
- **Features**: 
    - Trigger Day 1, 10:30.
    - Memory-aware processing (PropertiesService logic replacement).
    - Idempotent delivery, storage, and history archive.

## 10. Broadcast & Communication Engine
- **Features**: 
    - Rastreio de campanha (Email/WhatsApp).
    - Message template gallery for managers.

## 11. Bottleneck-Driven Training Engine
- **Features**: 
    - Mapping bottleneck to training material.
    - Consumption tracking by seller.

## 12. Orquestração e Gatilhos (Observability)
- Native Scheduler (Retry, Logs, Status monitoring).

## 13. Hard Logic Requirements (Non-Negotiable)
- Benchmarks: 20/60/33.
- Monthly projection pacing.
- Status (Batida/Quase/Abaixo).
- D-1/D-0 data dependency.
