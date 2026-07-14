import { describe, expect, test } from "bun:test";
import { buildOfficialRoutineScore, buildOfficialRoutineScores, buildOfficialRoutineTrend, buildRoutineActionMetrics, getRoutineDateFromSearch } from "./manager-team-routine";

describe("rotina da equipe", () => {
  test("calcula o score oficial de 100 pontos e recalcula o denominador dos não aplicáveis", () => {
    const complete = buildOfficialRoutineScore({
      routineAccess: { value: 100, source: "central_execucao_aberturas", evidence: "abertura oficial" },
      resolvedPendencies: { value: 100, source: "execution_actions", evidence: "ações oficiais" },
      attackPlan: { value: 50, source: "execution_actions", evidence: "plano de ataque" },
      prospectingAgenda: { value: 0, source: "agendamentos", evidence: "agenda oficial" },
      updatedClients: { value: 100, source: "clientes", evidence: "atualização oficial" },
      dailyClosing: { value: 100, source: "lancamentos_diarios", evidence: "fechamento enviado" },
    });

    expect(complete.score).toBe(70);
    expect(complete.denominator).toBe(100);
    expect(complete.components).toHaveLength(6);

    const withoutAgenda = buildOfficialRoutineScore({
      routineAccess: { value: 100, source: "central_execucao_aberturas", evidence: "abertura oficial" },
      resolvedPendencies: { value: 100, source: "execution_actions", evidence: "ações oficiais" },
      attackPlan: { value: 100, source: "execution_actions", evidence: "plano de ataque" },
      prospectingAgenda: { value: null, source: "agendamentos", evidence: null, reason: "não aplicável para a loja" },
      updatedClients: { value: 100, source: "clientes", evidence: "atualização oficial" },
      dailyClosing: { value: 100, source: "lancamentos_diarios", evidence: "fechamento enviado" },
    });

    expect(withoutAgenda.score).toBe(100);
    expect(withoutAgenda.denominator).toBe(80);
    expect(withoutAgenda.components.find(component => component.key === "prospectingAgenda")).toMatchObject({ applicable: false, weight: 20 });
  });

  test("retorna base insuficiente quando nenhuma fonte oficial está disponível", () => {
    const score = buildOfficialRoutineScore({
      routineAccess: { value: null, source: "central_execucao_aberturas", evidence: null },
      resolvedPendencies: { value: null, source: "execution_actions", evidence: null },
      attackPlan: { value: null, source: "execution_actions", evidence: null },
      prospectingAgenda: { value: null, source: "agendamentos", evidence: null },
      updatedClients: { value: null, source: "clientes", evidence: null },
      dailyClosing: { value: null, source: "lancamentos_diarios", evidence: null },
    });

    expect(score.score).toBeNull();
    expect(score.denominator).toBe(0);
  });

  test("conecta o score aos registros canônicos por vendedor e data", () => {
    const scores = buildOfficialRoutineScores({
      sellerIds: ["seller-1", "seller-2"],
      date: "2026-07-14",
      actionsAvailable: true,
      actions: [
        { seller_id: "seller-1", due_at: "2026-07-13T09:00:00-03:00", status: "concluida", source_type: "funil", metadata: {} },
        { seller_id: "seller-1", due_at: "2026-07-14T10:00:00-03:00", status: "concluida", source_type: "funil", metadata: {} },
        { seller_id: "seller-1", due_at: "2026-07-14T11:00:00-03:00", status: "pendente", source_type: "funil", metadata: {} },
        { seller_id: "seller-1", due_at: "2026-07-14T12:00:00-03:00", status: "concluida", source_type: "manual", metadata: { requires_customer_update: true, customer_updated: true } },
      ],
      openings: [{ seller_user_id: "seller-1" }],
      cadenceStates: [
        { seller_user_id: "seller-1", status: "ativo", last_result: "nao_feito", proxima_acao_em: "2026-07-14", updated_at: "2026-07-13T09:00:00-03:00" },
        { seller_user_id: "seller-1", status: "ativo", last_result: "feito", proxima_acao_em: "2026-07-16", updated_at: "2026-07-14T09:00:00-03:00" },
      ],
      schedules: [{ quantidade: 2 }],
      qualificationEvents: [{ seller_user_id: "seller-1" }],
      closings: [{ seller_user_id: "seller-1", submission_status: "on_time" }],
      sourcesAvailable: { openings: true, cadenceStates: true, schedules: true, qualificationEvents: true, closings: true },
    });

    expect(scores["seller-1"].score).toBe(75);
    expect(scores["seller-1"].components.find(component => component.key === "attackPlan")).toMatchObject({ value: 50, applicable: true });
    expect(scores["seller-2"].score).toBe(0);
    expect(scores["seller-2"].components.find(component => component.key === "prospectingAgenda")).toMatchObject({ value: 0, applicable: true });
  });

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
      updatesRequired: 1,
      updatesCompleted: 1,
    });
  });
});

describe("buildRoutineTrend", () => {
  test("calcula a série histórica com o mesmo score oficial e preserva dias sem dados", () => {
    const trend = buildOfficialRoutineTrend({
      sellerIds: ["seller-1", "seller-2"],
      start: "2026-07-01",
      end: "2026-07-03",
      actionsAvailable: true,
      actions: [
        { seller_id: "seller-1", due_at: "2026-07-01T10:00:00.000Z", status: "concluida", source_type: "funil", metadata: {} },
        { seller_id: "seller-1", due_at: "2026-07-01T11:00:00.000Z", status: "pendente", source_type: "funil", metadata: {} },
        { seller_id: "seller-2", due_at: "2026-07-01T12:00:00.000Z", status: "justificada", source_type: "funil", metadata: {} },
        { seller_id: "seller-2", due_at: "2026-07-03T12:00:00.000Z", status: "concluida", source_type: "funil", metadata: {} },
      ],
      openings: [],
      cadenceStates: [],
      schedules: [],
      qualificationEvents: [],
      closings: [],
      sourcesAvailable: { openings: true, cadenceStates: true, schedules: true, qualificationEvents: true, closings: true },
    });

    expect(trend).toEqual([
      { date: "2026-07-01", label: "01/07", value: 30 },
      { date: "2026-07-02", label: "02/07", value: null },
      { date: "2026-07-03", label: "03/07", value: 20 },
    ]);
  });
});
