import { expect, test, describe, afterEach, mock } from "bun:test";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { AgendaCalendar } from "@/components/organisms/AgendaCalendar";
import type { CalendarDay } from "@/components/organisms/AgendaCalendar";
import * as React from "react";
import { format } from "date-fns";

afterEach(() => {
  cleanup();
});

function makeCalendarDays(): CalendarDay[] {
  const days: CalendarDay[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  for (let d = 1; d <= 30; d++) {
    const date = new Date(year, month, d);
    days.push({ date, day: d, isCurrentMonth: true });
  }
  return days;
}

const today = new Date();
const todayKey = format(today, "yyyy-MM-dd");

const mockCalendarDays = makeCalendarDays();

const mockVisitsByDate = {
  [todayKey]: [
    {
      id: "visit-today",
      status: "agendada",
      title: "Cliente hoje",
      startsAt: today.toISOString(),
      durationHours: 1,
      kind: "visit" as const,
      subtitle: "Visita 1",
    },
    {
      id: "visit-done",
      status: "concluida",
      title: "Cliente concluido",
      startsAt: today.toISOString(),
      durationHours: 1,
      kind: "visit" as const,
    },
  ],
  [format(new Date(today.getFullYear(), today.getMonth(), 5), "yyyy-MM-dd")]: [
    {
      id: "visit-five",
      status: "cancelada",
      title: "Cliente dia 5",
      startsAt: new Date(today.getFullYear(), today.getMonth(), 5, 10).toISOString(),
      durationHours: 1,
      kind: "visit" as const,
    },
  ],
};

describe("AgendaCalendar", () => {
  const defaultProps = {
    calendarDays: mockCalendarDays,
    visitsByDate: mockVisitsByDate,
    selectedDate: null,
    onDateSelect: mock(() => {}),
    monthLabel: "Abril 2026",
    onPrevMonth: mock(() => {}),
    onNextMonth: mock(() => {}),
    onToday: mock(() => {}),
    getVisitDotColor: (status: string) => {
      const map: Record<string, string> = {
        agendada: "bg-brand-primary",
        "concluida": "bg-status-success",
        cancelada: "bg-status-error",
      };
      return map[status] || "bg-text-tertiary";
    },
  };

  test("renders weekday headers", () => {
    render(<AgendaCalendar {...defaultProps} />);
    expect(screen.getByText("DOM")).toBeDefined();
    expect(screen.getByText("SEG")).toBeDefined();
    expect(screen.getByText("TER")).toBeDefined();
    expect(screen.getByText("QUA")).toBeDefined();
    expect(screen.getByText("QUI")).toBeDefined();
    expect(screen.getByText("SEX")).toBeDefined();
    expect(screen.getByText("SÁB")).toBeDefined();
  });

  test("renders calendar days", () => {
    render(<AgendaCalendar {...defaultProps} />);
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("30")).toBeDefined();
  });

  test("highlights today", () => {
    render(<AgendaCalendar {...defaultProps} />);
    const todayEl = screen.getByText(String(today.getDate()));
    const todayContainer = todayEl.closest("span")!;
    expect(todayContainer.className).toContain("bg-brand-primary");
    expect(todayContainer.className).toContain("text-white");
  });

  test("calls onDateSelect when day clicked", () => {
    const onDateSelect = mock(() => {});
    render(<AgendaCalendar {...defaultProps} onDateSelect={onDateSelect} />);
    const dayBtn = screen.getByText("5").closest("button")!;
    fireEvent.click(dayBtn);
    expect(onDateSelect).toHaveBeenCalled();
  });

  test("renders month label", () => {
    render(<AgendaCalendar {...defaultProps} />);
    expect(screen.getByText("Abril 2026")).toBeDefined();
  });

  test("renders today button", () => {
    render(<AgendaCalendar {...defaultProps} />);
    expect(screen.getByText("Hoje")).toBeDefined();
  });
});
