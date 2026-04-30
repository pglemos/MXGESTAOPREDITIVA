import { describe, it, expect } from "bun:test";
import { FeedbackSchema, parseFeedback, parseFeedbackArray } from "@/lib/schemas/feedback.schema";
import { NotificationSchema, parseNotification, parseNotificationArray } from "@/lib/schemas/notification.schema";
import { PDISchema, parsePDI, parsePDIArray, PDIReviewSchema, parsePDIReview, parsePDIReviewArray } from "@/lib/schemas/pdi.schema";
import { TeamProgressEntrySchema, parseTeamProgressEntry, parseTeamProgressEntryArray, TrainingProgressSchema, TrainingSchema } from "@/lib/schemas/performance.schema";
import { ConsultingClientSchema, parseConsultingClient, parseConsultingClientArray, ConsultingClientUnitSchema, parseConsultingClientUnitArray, ConsultingClientContactSchema, parseConsultingClientContactArray, ConsultingAssignmentSchema, parseConsultingAssignmentArray, ConsultingMethodologyStepSchema, parseConsultingMethodologyStepArray, ConsultingFinancialSchema, parseConsultingFinancialArray, ConsultingClientModuleSchema, PmrFormTemplateSchema, PmrFormResponseSchema, ConsultingMetricCatalogItemSchema, ConsultingParameterValueSchema, ConsultingActionItemSchema, ConsultingStrategicPlanSchema } from "@/lib/schemas/consulting-client.schema";
import { DREFinancialSchema, parseDREFinancial, parseDREFinancialArray, DREComputedSchema } from "@/lib/schemas/dre.schema";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("FeedbackSchema", () => {
  const valid = {
    id: UUID,
    store_id: "s1",
    manager_id: "m1",
    seller_id: "sl1",
    week_reference: "2026-W16",
    leads_week: 10,
    agd_week: 5,
    visit_week: 3,
    vnd_week: 2,
    tx_lead_agd: 0.5,
    tx_agd_visita: 0.6,
    tx_visita_vnd: 0.67,
    meta_compromisso: 0.7,
    positives: "good",
    attention_points: "attention",
    action: "action",
    notes: null,
    team_avg_json: {},
    diagnostic_json: {},
    commitment_suggested: 0.8,
    acknowledged: false,
    acknowledged_at: null,
    created_at: "2026-04-16T10:00:00Z",
  };

  it("parses valid data", () => {
    const result = parseFeedback(valid);
    expect(result.id).toBe(UUID);
    expect(result.leads_week).toBe(10);
  });

  it("rejects invalid data", () => {
    expect(() => parseFeedback({})).toThrow();
    expect(() => parseFeedback({ id: "not-uuid" })).toThrow();
  });

  it("parses array", () => {
    const result = parseFeedbackArray([valid, valid]);
    expect(result.length).toBe(2);
  });
});

describe("NotificationSchema", () => {
  const valid = {
    id: UUID,
    title: "Test",
    message: "msg",
    type: "info",
    priority: "high",
    read: false,
    recipient_id: "r1",
    sender_id: null,
    store_id: null,
    target_role: null,
    link: null,
    broadcast_id: null,
    created_at: "2026-04-16T10:00:00Z",
    updated_at: "2026-04-16T10:00:00Z",
  };

  it("parses valid data", () => {
    const result = parseNotification(valid);
    expect(result.id).toBe(UUID);
    expect(result.read).toBe(false);
  });

  it("rejects invalid data", () => {
    expect(() => parseNotification({})).toThrow();
    expect(() => NotificationSchema.parse({ id: 123 })).toThrow();
  });

  it("parses array", () => {
    const result = parseNotificationArray([valid]);
    expect(result.length).toBe(1);
  });
});

describe("PDISchema", () => {
  const validPDI = {
    id: UUID,
    store_id: "s1",
    manager_id: "m1",
    seller_id: "sl1",
    comp_prospeccao: 5,
    comp_abordagem: 4,
    comp_demonstracao: 3,
    comp_fechamento: 4,
    comp_crm: 5,
    comp_digital: 3,
    comp_disciplina: 4,
    comp_organizacao: 5,
    comp_negociacao: 3,
    comp_produto: 4,
    meta_6m: "increase sales",
    meta_12m: "team lead",
    meta_24m: "own store",
    action_1: "action",
    action_2: null,
    action_3: null,
    action_4: null,
    action_5: null,
    due_date: null,
    status: "active",
    acknowledged: false,
    created_at: "2026-04-16T10:00:00Z",
    updated_at: "2026-04-16T10:00:00Z",
  };

  const validReview = {
    id: UUID,
    pdi_id: "pdi-1",
    reviewer_id: null,
    notes: null,
    created_at: "2026-04-16T10:00:00Z",
  };

  it("parses valid PDI", () => {
    const result = parsePDI(validPDI);
    expect(result.id).toBe(UUID);
    expect(result.comp_prospeccao).toBe(5);
  });

  it("rejects invalid PDI", () => {
    expect(() => parsePDI({})).toThrow();
  });

  it("parses PDI array", () => {
    const result = parsePDIArray([validPDI]);
    expect(result.length).toBe(1);
  });

  it("parses valid PDIReview", () => {
    const result = parsePDIReview(validReview);
    expect(result.id).toBe(UUID);
  });

  it("rejects invalid PDIReview", () => {
    expect(() => parsePDIReview({})).toThrow();
  });

  it("parses PDIReview array", () => {
    const result = parsePDIReviewArray([validReview]);
    expect(result.length).toBe(1);
  });
});

describe("PerformanceSchema", () => {
  const validTeamProgress = {
    seller_id: "sl1",
    seller_name: "Seller",
    watched: ["t1", "t2"],
    total_trainings: 10,
    percentage: 0.2,
    current_gap: null,
    gap_training_completed: false,
  };

  const validTrainingProgress = {
    id: "tp1",
    user_id: "u1",
    training_id: "tr1",
    created_at: "2026-04-16T10:00:00Z",
  };

  const validTraining = {
    id: UUID,
    title: "Training 1",
    description: "Desc",
    type: "video",
    video_url: "https://example.com/v",
    target_audience: "sellers",
    active: true,
    created_at: "2026-04-16T10:00:00Z",
    updated_at: "2026-04-16T10:00:00Z",
  };

  it("parses valid TeamProgressEntry", () => {
    const result = parseTeamProgressEntry(validTeamProgress);
    expect(result.seller_id).toBe("sl1");
    expect(result.percentage).toBe(0.2);
  });

  it("rejects invalid TeamProgressEntry", () => {
    expect(() => parseTeamProgressEntry({})).toThrow();
  });

  it("parses TeamProgressEntry array", () => {
    const result = parseTeamProgressEntryArray([validTeamProgress]);
    expect(result.length).toBe(1);
  });

  it("parses valid TrainingProgress", () => {
    const result = TrainingProgressSchema.parse(validTrainingProgress);
    expect(result.user_id).toBe("u1");
  });

  it("rejects invalid TrainingProgress", () => {
    expect(() => TrainingProgressSchema.parse({})).toThrow();
  });

  it("parses valid Training", () => {
    const result = TrainingSchema.parse(validTraining);
    expect(result.id).toBe(UUID);
    expect(result.active).toBe(true);
  });

  it("rejects invalid Training", () => {
    expect(() => TrainingSchema.parse({})).toThrow();
  });
});

describe("ConsultingClientSchema", () => {
  const validClient = {
    id: UUID,
    name: "Client",
    legal_name: "Client Ltd",
    cnpj: "12345678000100",
    product_name: "Prod",
    status: "active",
    notes: null,
    modality: "Presencial" as const,
    current_visit_step: 1,
    primary_store_id: null,
    created_by: null,
    created_at: "2026-04-16T10:00:00Z",
    updated_at: "2026-04-16T10:00:00Z",
  };

  const validUnit = {
    id: UUID,
    client_id: "c1",
    name: "Unit 1",
    city: "Sao Paulo",
    state: "SP",
    is_primary: true,
    created_at: "2026-04-16T10:00:00Z",
    updated_at: "2026-04-16T10:00:00Z",
  };

  const validContact = {
    id: UUID,
    client_id: "c1",
    name: "Contact",
    email: "a@b.com",
    phone: "11999999999",
    role: "Manager",
    is_primary: true,
    created_at: "2026-04-16T10:00:00Z",
    updated_at: "2026-04-16T10:00:00Z",
  };

  const validAssignment = {
    id: UUID,
    client_id: "c1",
    user_id: "u1",
    assignment_role: "responsavel" as const,
    active: true,
    created_at: "2026-04-16T10:00:00Z",
    updated_at: "2026-04-16T10:00:00Z",
  };

  const validMethodologyStep = {
    id: UUID,
    visit_number: 1,
    objective: "Diagnóstico",
    target: "Identificar gargalos",
    duration: "2h",
    evidence_required: "Relatório",
  };

  const validFinancial = {
    id: UUID,
    client_id: "c1",
    reference_date: "2026-04",
    revenue: 100000,
    fixed_expenses: 50000,
    marketing_expenses: 5000,
    investments: 10000,
    financing: 2000,
    net_profit: 33000,
    roi: 0.33,
    conversion_rate: 0.25,
    created_at: "2026-04-16T10:00:00Z",
    updated_at: "2026-04-16T10:00:00Z",
  };

  it("parses valid ConsultingClient", () => {
    const result = parseConsultingClient(validClient);
    expect(result.id).toBe(UUID);
    expect(result.modality).toBe("Presencial");
  });

  it("rejects invalid ConsultingClient", () => {
    expect(() => parseConsultingClient({})).toThrow();
  });

  it("parses ConsultingClient array", () => {
    const result = parseConsultingClientArray([validClient]);
    expect(result.length).toBe(1);
  });

  it("parses valid ConsultingClientUnit", () => {
    const result = parseConsultingClientUnitArray([validUnit]);
    expect(result[0].is_primary).toBe(true);
  });

  it("parses valid ConsultingClientContact", () => {
    const result = parseConsultingClientContactArray([validContact]);
    expect(result[0].name).toBe("Contact");
  });

  it("parses valid ConsultingAssignment", () => {
    const result = parseConsultingAssignmentArray([validAssignment]);
    expect(result[0].assignment_role).toBe("responsavel");
  });

  it("rejects invalid ConsultingAssignment role", () => {
    const invalid = { ...validAssignment, assignment_role: "invalid" };
    expect(() => parseConsultingAssignmentArray([invalid])).toThrow();
  });

  it("parses valid ConsultingMethodologyStep", () => {
    const result = parseConsultingMethodologyStepArray([validMethodologyStep]);
    expect(result[0].visit_number).toBe(1);
  });

  it("parses valid ConsultingFinancial", () => {
    const result = parseConsultingFinancialArray([validFinancial]);
    expect(result[0].revenue).toBe(100000);
  });

  it("parses PMR client module", () => {
    const result = ConsultingClientModuleSchema.parse({
      id: UUID,
      client_id: UUID,
      module_key: "dre",
      label: "DRE Financeiro",
      enabled: true,
      premium: true,
      notes: null,
      configured_by: null,
      configured_at: "2026-04-18T10:00:00Z",
      created_at: "2026-04-18T10:00:00Z",
      updated_at: "2026-04-18T10:00:00Z",
    });
    expect(result.module_key).toBe("dre");
  });

  it("parses PMR form template and response", () => {
    const template = PmrFormTemplateSchema.parse({
      id: UUID,
      form_key: "owner",
      title: "Diagnostico - Dono/Socio",
      target_role: "dono",
      visit_number: 1,
      fields: [{ key: "strategic_goal", label: "Meta", type: "textarea", required: true }],
      active: true,
      created_at: "2026-04-18T10:00:00Z",
      updated_at: "2026-04-18T10:00:00Z",
    });
    const response = PmrFormResponseSchema.parse({
      id: UUID,
      client_id: UUID,
      visit_id: null,
      template_id: UUID,
      respondent_name: "Jose",
      respondent_role: "dono",
      answers: { strategic_goal: "Crescer" },
      summary: "Resumo",
      submitted_by: null,
      submitted_at: "2026-04-18T10:00:00Z",
      created_at: "2026-04-18T10:00:00Z",
      updated_at: "2026-04-18T10:00:00Z",
      template,
    });
    expect(response.template?.title).toContain("Dono");
  });

  it("parses PMR metric, parameter and action item", () => {
    const metric = ConsultingMetricCatalogItemSchema.parse({
      metric_key: "lead_to_appointment_rate",
      label: "Conversao de leads em agendamentos",
      direction: "increase",
      value_type: "percent",
      area: "Vendas",
      source_scope: "computed",
      formula_key: "appointments/leads_received",
      active: true,
      sort_order: 10,
    });
    const parameter = ConsultingParameterValueSchema.parse({
      id: UUID,
      parameter_set_id: UUID,
      metric_key: metric.metric_key,
      market_average: 0.2,
      best_practice: 0.3,
      target_default: 0.2,
      red_threshold: 0.1,
      yellow_threshold: 0.2,
      green_threshold: 0.3,
      formula: { from: "appointments/leads_received" },
      notes: null,
      metric,
    });
    const action = ConsultingActionItemSchema.parse({
      id: UUID,
      client_id: UUID,
      strategic_plan_id: null,
      metric_key: metric.metric_key,
      action: "Revisar cadencia de follow-up",
      how: "Rotina diaria no CRM",
      owner_name: "Gerente",
      due_date: "2026-04-30",
      completed_at: null,
      status: "em_andamento",
      efficacy: "Aumentar agendamentos",
      priority: 1,
      visit_number: 2,
      metric,
    });
    expect(parameter.best_practice).toBe(0.3);
    expect(action.status).toBe("em_andamento");
  });

  it("parses PMR strategic plan payload", () => {
    const plan = ConsultingStrategicPlanSchema.parse({
      id: UUID,
      client_id: UUID,
      title: "Planejamento PMR",
      period_start: null,
      period_end: null,
      status: "draft",
      diagnosis_summary: "Resumo",
      market_comparison: { metrics: [] },
      generated_payload: { source: "test" },
      generated_at: "2026-04-18T10:00:00Z",
      created_at: "2026-04-18T10:00:00Z",
      updated_at: "2026-04-18T10:00:00Z",
    });
    expect(plan.title).toBe("Planejamento PMR");
  });
});

describe("DRESchema", () => {
  const validDRE = {
    id: UUID,
    client_id: "c1",
    reference_date: "2026-04",
    revenue_proprios: 100000,
    revenue_consignados: 50000,
    revenue_repasse: 30000,
    ded_preparacao: 5000,
    ded_comissoes: 10000,
    ded_impostos: 8000,
    other_revenue_financiamento: 2000,
    other_revenue_outros1: 0,
    other_revenue_outros2: 0,
    other_revenue_outros3: 0,
    payroll_salarios: 20000,
    payroll_inss: 5000,
    payroll_fgts: 2000,
    payroll_seguro_social: 1000,
    payroll_tempo_servico: 500,
    payroll_13salario: 1500,
    payroll_ferias: 1000,
    payroll_indenizacao: 0,
    payroll_outros: 0,
    pro_labore: 5000,
    exp_fornecedores: 10000,
    exp_agua: 500,
    exp_limpeza: 300,
    exp_viagens: 1000,
    exp_energia: 800,
    exp_telefone: 400,
    exp_contabilidade: 1500,
    exp_aluguel: 5000,
    exp_frete: 2000,
    exp_contribuicoes: 500,
    exp_terceiros: 1000,
    exp_marketing: 3000,
    exp_iptu: 600,
    exp_combustivel: 800,
    exp_manutencao_imovel: 400,
    exp_seguranca: 300,
    exp_cartorio: 200,
    exp_pos_venda: 500,
    exp_ir_csll: 2000,
    exp_sistemas: 1500,
    exp_emprestimo_pf: 0,
    exp_emprestimo_pj: 0,
    exp_tarifas: 300,
    exp_informatica: 500,
    exp_treinamentos: 1000,
    exp_outras: 500,
    volume_vendas: 180,
    capital_proprio: 50000,
    revenue: 180000,
    fixed_expenses: 60000,
    marketing_expenses: 3000,
    investments: 10000,
    financing: 5000,
    net_profit: 50000,
    roi: 0.5,
    conversion_rate: 0.25,
    created_at: "2026-04-16T10:00:00Z",
    updated_at: "2026-04-16T10:00:00Z",
  };

  const validComputed = {
    gross_margin: 0.7,
    total_deductions: 23000,
    net_sales_margin: 0.6,
    other_revenue: 2000,
    gross_profit: 150000,
    total_payroll: 31000,
    total_fixed: 60000,
    pro_labore: 5000,
    total_expenses: 56000,
    net_profit: 50000,
    avg_ticket: 1000,
    margin_per_car: 833,
    net_margin_per_car: 278,
    prep_cost_per_car: 28,
    posvenda_per_car: 3,
    profit_per_car: 278,
    rentability: 0.28,
    cac: 120,
    lead_to_agd_rate: 0.45,
    agd_to_sale_rate: 0.32,
  };

  it("parses valid DREFinancial", () => {
    const result = parseDREFinancial(validDRE);
    expect(result.id).toBe(UUID);
    expect(result.revenue_proprios).toBe(100000);
  });

  it("rejects invalid DREFinancial", () => {
    expect(() => parseDREFinancial({})).toThrow();
    expect(() => DREFinancialSchema.parse({ id: "bad" })).toThrow();
  });

  it("parses DREFinancial array", () => {
    const result = parseDREFinancialArray([validDRE]);
    expect(result.length).toBe(1);
  });

  it("parses valid DREComputed", () => {
    const result = DREComputedSchema.parse(validComputed);
    expect(result.gross_margin).toBe(0.7);
    expect(result.net_profit).toBe(50000);
  });

  it("rejects invalid DREComputed", () => {
    expect(() => DREComputedSchema.parse({})).toThrow();
  });
});
