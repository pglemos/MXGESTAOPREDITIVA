import { expect, test, describe } from "bun:test";
import {
  getEventPosition,
  snapMinutes,
  pxToMinutes,
  minutesToPx,
  clampDuration,
  layoutOverlappingEvents,
  HOUR_HEIGHT,
  START_HOUR,
} from "@/components/organisms/AgendaCalendar/layout";

// Built from local Date parts (not a hardcoded UTC offset) so getHours()
// round-trips correctly regardless of the machine/CI running the test.
function isoAt(hour: number, minute = 0): string {
  return new Date(2026, 6, 22, hour, minute).toISOString();
}

describe("getEventPosition", () => {
  test("positions a 1h event at its start hour", () => {
    const { top, height } = getEventPosition(isoAt(9), 1);
    expect(top).toBe((9 - START_HOUR) * HOUR_HEIGHT);
    expect(height).toBe(1 * HOUR_HEIGHT - 6);
  });

  test("stretches height proportionally to duration", () => {
    const { height } = getEventPosition(isoAt(9), 6);
    expect(height).toBe(6 * HOUR_HEIGHT - 6);
  });

  test("falls back to 1h when durationHours is null/invalid", () => {
    const withNull = getEventPosition(isoAt(9), null as unknown as number);
    const withZero = getEventPosition(isoAt(9), 0);
    expect(withNull.height).toBe(1 * HOUR_HEIGHT - 6);
    expect(withZero.height).toBe(1 * HOUR_HEIGHT - 6);
  });

  test("never renders above the grid top", () => {
    const { top } = getEventPosition(isoAt(0), 1);
    expect(top).toBe(4);
  });
});

describe("snapMinutes", () => {
  test("rounds to nearest 15min by default", () => {
    expect(snapMinutes(7)).toBe(0);
    expect(snapMinutes(8)).toBe(15);
    expect(snapMinutes(22)).toBe(15);
    expect(snapMinutes(23)).toBe(30);
  });

  test("supports custom step", () => {
    expect(snapMinutes(20, 30)).toBe(30);
    expect(snapMinutes(10, 30)).toBe(0);
  });
});

describe("px/minutes conversion", () => {
  test("round-trips", () => {
    expect(pxToMinutes(HOUR_HEIGHT)).toBe(60);
    expect(minutesToPx(60)).toBe(HOUR_HEIGHT);
    expect(minutesToPx(pxToMinutes(28))).toBeCloseTo(28, 5);
  });
});

describe("clampDuration", () => {
  test("clamps visits between 0.5h and 12h", () => {
    expect(clampDuration(0.1, "visit")).toBe(0.5);
    expect(clampDuration(20, "visit")).toBe(12);
    expect(clampDuration(3, "visit")).toBe(3);
  });

  test("clamps events between 0.5h and 24h", () => {
    expect(clampDuration(0.1, "event")).toBe(0.5);
    expect(clampDuration(30, "event")).toBe(24);
  });
});

describe("layoutOverlappingEvents", () => {
  test("single event gets full column", () => {
    const result = layoutOverlappingEvents([
      { id: "a", startsAt: "2026-07-22T09:00:00-03:00", durationHours: 1 },
    ]);
    expect(result).toEqual([{ item: { id: "a", startsAt: "2026-07-22T09:00:00-03:00", durationHours: 1 }, columnIndex: 0, columnCount: 1 }]);
  });

  test("two events at the same time split into 2 columns", () => {
    const result = layoutOverlappingEvents([
      { id: "a", startsAt: "2026-07-22T16:00:00-03:00", durationHours: 1 },
      { id: "b", startsAt: "2026-07-22T16:00:00-03:00", durationHours: 1 },
    ]);
    const byId = Object.fromEntries(result.map((r) => [r.item.id, r]));
    expect(byId.a.columnCount).toBe(2);
    expect(byId.b.columnCount).toBe(2);
    expect(byId.a.columnIndex).not.toBe(byId.b.columnIndex);
  });

  test("sequential non-overlapping events each get columnCount 1", () => {
    const result = layoutOverlappingEvents([
      { id: "a", startsAt: "2026-07-22T09:00:00-03:00", durationHours: 1 },
      { id: "b", startsAt: "2026-07-22T10:00:00-03:00", durationHours: 1 },
    ]);
    expect(result.every((r) => r.columnCount === 1 && r.columnIndex === 0)).toBe(true);
  });

  test("three-way overlap uses 3 columns", () => {
    const result = layoutOverlappingEvents([
      { id: "a", startsAt: "2026-07-22T09:00:00-03:00", durationHours: 2 },
      { id: "b", startsAt: "2026-07-22T09:30:00-03:00", durationHours: 2 },
      { id: "c", startsAt: "2026-07-22T10:00:00-03:00", durationHours: 2 },
    ]);
    const columnCounts = new Set(result.map((r) => r.columnCount));
    expect(columnCounts).toEqual(new Set([3]));
    const columns = new Set(result.map((r) => r.columnIndex));
    expect(columns).toEqual(new Set([0, 1, 2]));
  });

  test("an event starting exactly when others end is its own cluster (full width)", () => {
    const result = layoutOverlappingEvents([
      { id: "a", startsAt: "2026-07-22T09:00:00-03:00", durationHours: 1 },
      { id: "b", startsAt: "2026-07-22T09:00:00-03:00", durationHours: 1 },
      { id: "c", startsAt: "2026-07-22T10:00:00-03:00", durationHours: 1 },
    ]);
    const byId = Object.fromEntries(result.map((r) => [r.item.id, r]));
    expect(byId.a.columnCount).toBe(2);
    expect([byId.a.columnIndex, byId.b.columnIndex].sort()).toEqual([0, 1]);
    // c starts exactly when a/b end — no real overlap, gets its own full-width cluster.
    expect(byId.c.columnCount).toBe(1);
    expect(byId.c.columnIndex).toBe(0);
  });

  test("a later event reuses a column freed by an earlier one, within the same cluster", () => {
    // a: 09:00-09:30, b: 09:00-10:00, c: 09:30-10:00.
    // a and c never overlap each other, but both overlap b, so all three
    // share one cluster (peak concurrency 2) and c reuses a's column.
    const result = layoutOverlappingEvents([
      { id: "a", startsAt: "2026-07-22T09:00:00-03:00", durationHours: 0.5 },
      { id: "b", startsAt: "2026-07-22T09:00:00-03:00", durationHours: 1 },
      { id: "c", startsAt: "2026-07-22T09:30:00-03:00", durationHours: 0.5 },
    ]);
    const byId = Object.fromEntries(result.map((r) => [r.item.id, r]));
    expect(byId.a.columnCount).toBe(2);
    expect(byId.b.columnCount).toBe(2);
    expect(byId.c.columnCount).toBe(2);
    expect(byId.a.columnIndex).toBe(byId.c.columnIndex);
    expect(byId.b.columnIndex).not.toBe(byId.a.columnIndex);
  });

  test("empty input returns empty array", () => {
    expect(layoutOverlappingEvents([])).toEqual([]);
  });
});
