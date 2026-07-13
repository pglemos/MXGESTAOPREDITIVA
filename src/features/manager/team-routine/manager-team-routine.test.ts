import { describe, expect, test } from "bun:test";
import { buildRoutineActionMetrics, buildRoutineTrend, getRoutineDateFromSearch } from "./manager-team-routine";

describe("rotina da equipe", () => {
  test("lê a data civil da navegação e rejeita valores inválidos", () => {
    expect(getRoutineDateFromSearch("?data=2026-07-11", "2026-07-13")).toBe("2026-07-11");
    expect(getRoutineDateFromSearch("?data=11/07/2026", "2026-07-13")).toBe("2026-07-13");
  });

  test("agrega follow-ups e atualizações sem fabricar contadores", () => {
    expect(buildRoutineActionMetrics([
      { seller_id: "seller-1", due_at: "2026-07-11T10:00:00.000Z", status: "concluida", source_type: "funil", metadata: {} },
      { seller_id: "seller-1", due_at: "2026-07-11T11:00:00.000Z", status: "pendente", source_type: "funil", metadata: { requires_customer_update: true } },
      { seller_id: "seller-1", due_at: "2026-07-11T12:00:00.000Z", status: "concluida", source_type: "manual", metadata: { requires_customer_update: true, customer_updated: true } },
    ])).toEqual({
      planned: 3,
      completed: 2,
      followUpsPlanned: 2,
      followUpsCompleted: 1,
      updatesRequired: 2,
      updatesCompleted: 1,
    });
  });
});

describe("buildRoutineTrend", () => {
  test("calcula a execução média por vendedor e preserva dias sem dados", () => {
    const trend = buildRoutineTrend(
      [
        { seller_id: "seller-1", due_at: "2026-07-01T10:00:00.000Z", status: "concluida" },
        { seller_id: "seller-1", due_at: "2026-07-01T11:00:00.000Z", status: "pendente" },
        { seller_id: "seller-2", due_at: "2026-07-01T12:00:00.000Z", status: "justificada" },
        { seller_id: "seller-2", due_at: "2026-07-03T12:00:00.000Z", status: "concluida" },
      ],
      "2026-07-01",
      "2026-07-03",
    );

    expect(trend).toEqual([
      { date: "2026-07-01", label: "01/07", value: 75 },
      { date: "2026-07-02", label: "02/07", value: null },
      { date: "2026-07-03", label: "03/07", value: 100 },
    ]);
  });
});
