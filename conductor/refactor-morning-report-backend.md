# Implementation Plan - Morning Report Backend Automation (AIOX Method)

Fix the `relatorio-matinal` Supabase Edge Function to actually send emails to configured recipients, ensuring the "Relatório diário por e-mail" requirement from the legacy methodology is fully implemented.

## Objective
- Fetch recipients from `store_delivery_rules`.
- Integrate an email sending service (Resend).
- Send the generated HTML report to all recipients.
- Update the cron trigger to 10:30 (Legacy Rule).

## Key Files
- `supabase/functions/relatorio-matinal/index.ts`: The Edge Function logic.
- `supabase/migrations/20260224180000_reporting_automations.sql`: The cron configuration.

## Implementation Steps

### 1. Refactor Edge Function (`supabase/functions/relatorio-matinal/index.ts`)
- **Import Resend**: Add Resend client import (assuming `RESEND_API_KEY` is in Edge Runtime secrets).
- **Fetch Delivery Rules**: For each store, query `store_delivery_rules` for `matinal_recipients`.
- **Email Sending**:
    - Iterate over `matinal_recipients`.
    - Use `resend.emails.send({ from, to, subject, html })`.
    - Log success/failure for each recipient.
- **Data Integrity**: Update `reprocess_logs` with counts and any errors during delivery.

### 2. Update Cron Configuration
- Create a new migration `20260403000005_fix_morning_report_cron.sql`.
- Update `automation_configs` where `report_type = 'morning'`:
    - Set `schedule_cron = '30 10 * * *'`.
- Update `store_delivery_rules` timezone to `America/Sao_Paulo` (already default).

### 3. Verification
- Manually trigger the Edge Function via CLI: `supabase functions serve relatorio-matinal`.
- Verify the logs in `reprocess_logs`.
- Check `Inbucket` (for local) or `Resend` dashboard (for production) for sent emails.

## Metadata & Secrets
- **Required Secrets**: `RESEND_API_KEY` must be set in Supabase.
- **From Address**: `relatorios@mxgestaopreditiva.com.br` (Official MX).

## Verification & Testing
- Use `deno run` or `supabase functions serve` to test locally.
- Verify `generateHTML` output in a browser to ensure styles match the legacy briefing.
