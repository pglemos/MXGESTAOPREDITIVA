# Decision Log: MX-MGR-20260713-01

**Date:** 2026-07-13
**Agent:** Dex (@dev)
**Mode:** YOLO
**Story:** `docs/stories/story-MX-MGR-20260713-01-inicio-base44-1x1.md`
**Baseline commit:** `213a922c`

## Decisions

1. Port the Base44 formulas into pure TypeScript before rebuilding JSX.
   - Reason: enables the mandatory RED → GREEN cycle and makes semantic parity independently testable.
   - Alternatives rejected: retaining the current remaining-goal formula; embedding calculations in the component.
2. Keep the existing Supabase aggregation hook and add an explicit manager calendar-date mode.
   - Reason: preserves membership/RLS and avoids a duplicate data-fetching stack while fixing the operational-date drift.
   - Alternatives rejected: Base44 SDK; client-side mock data; changing the global check-in operational date.
3. Rebuild the page as feature-scoped presentation components while retaining the current dark sidebar shell.
   - Reason: matches the approved architecture and keeps the next manager screens independently replaceable.
4. Refresh all five manager-home sources as one observable action.
   - Reason: Base44 reloads shop/meta, sellers, daily closes and monthly closes together; partial refresh could leave decisions based on stale goals or settings.
5. Preserve the exact Base44 chart colors through manager-specific chart tokens.
   - Reason: satisfies the repository token lint without replacing the observable emerald/axis colors with a different MX palette.

## Files and tests

- 23 source, test, story, architecture and AIOX evidence files created or modified.
- Targeted final: 18 tests, 77 assertions, zero failures.
- Full regression: 852 tests, 2748 assertions, zero failures.
- `npm run lint`, `npm run typecheck`, `npm run build` and `git diff --check` passed.
- Chrome real: authenticated refresh exercised daily/monthly check-ins, sellers, goal and operational settings with HTTP 200; console clean; three final viewports without horizontal overflow.
