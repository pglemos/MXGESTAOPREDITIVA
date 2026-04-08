# Spec: Upgrade Monthly Closing Motor (MX Authority Standard)

**Date:** 2026-04-03
**Status:** Approved (System Best Judgment)
**Topic:** Reporting Motors Upgrade - Monthly Closing

## 1. Goal
Upgrade the `relatorio-mensal` Edge Function to the **MX Authority** standard, featuring "Prestige" branding (Gold/Midnight Blue) and automated CSV attachments for detailed performance analysis.

## 2. Requirements

### 2.1 CSV Generation
- **Function:** `generateCSV(ranking: any[])`
- **Output:** Base64-encoded CSV string.
- **Columns:**
    1. Vendedor (Consultor Name)
    2. Leads
    3. Agendamentos
    4. Visitas
    5. Vendas Porta
    6. Vendas Cartão
    7. Vendas Net
    8. Total Vendas
- **Format:** UTF-8 support using `TextEncoder` and `btoa` for Deno compatibility.

### 2.2 Email Attachment
- **Provider:** Resend.
- **Payload:** Include the generated CSV in the `attachments` array.
- **Filename:** `fechamento_mensal_MX_[Store]_[Month].csv` (e.g., `fechamento_mensal_MX_Loja_Exemplo_Janeiro_2024.csv`).

### 2.3 "Prestige" HTML Design
- **Theme:** Luxury, monthly recognition focus.
- **Palette:**
    - Midnight Blue: `#0f172a` (Backgrounds, Text)
    - Gold: `#eab308` (Accents, Headers, Icons)
    - White: `#ffffff` (Main content surface)
- **UI Elements:**
    - Bold headers with Gold accents.
    - Large stats display for Total Vendas and Goal Achievement.
    - Progress bar with Gold gradient.
    - Refined table for ranking.

### 2.4 WhatsApp Integration
- **Format:** `https://api.whatsapp.com/send?text=[EncodedText]`
- **Content:** Monthly summary including top performers and overall store percentage.

## 3. Architecture & Implementation

### 3.1 File: `supabase/functions/relatorio-mensal/index.ts`
- Implement `generateCSV` utility.
- Refactor `generateMonthlyHTML` with new CSS/HTML structure.
- Update `Deno.serve` loop to:
    1. Generate CSV.
    2. Define filename with store name and month.
    3. Inject into `resend.emails.send`.
    4. Add WhatsApp feedback button to HTML.

## 4. Verification Plan
- **Static Analysis:** Ensure TypeScript types are correct.
- **Unit Logic:** Verify CSV column mapping matches `agg` data structure.
- **Visual Review:** Mockup validated at `http://localhost:56330`.
