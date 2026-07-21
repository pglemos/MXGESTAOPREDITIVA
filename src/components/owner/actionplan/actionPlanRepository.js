// Repositório do Plano de Ação com persistência em localStorage.
// Fonte única de dados para Visão Executiva e Quadro de Ações.
import { actionPlanFixtures } from "./actionPlanFixtures";

const STORAGE_KEY = "mx_action_plan_executive_v1";

function nowBR() {
  return new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function todayBR() {
  return new Date().toLocaleDateString("pt-BR");
}

function makeHistory(type, author, description, metadata = {}) {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    date: nowBR(),
    author: author || "Sistema",
    description,
    metadata,
  };
}

function ensureArrays(action) {
  return {
    ...action,
    history: action.history || [
      { id: "h-init", type: "created", date: action.startDate || todayBR(), author: "Sistema", description: "Ação criada" },
    ],
    comments: action.comments || [],
    evidences: action.evidences || [],
    checklist: action.checklist || [],
    evidenceRequired: action.evidenceRequired || false,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw).map(ensureArrays);
  } catch {
    // ignore
  }
  const fixtures = actionPlanFixtures.map(ensureArrays);
  save(fixtures);
  return fixtures;
}

function save(actions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  } catch {
    // ignore
  }
}

function updateWithHistory(id, updates, historyEntry) {
  const actions = load();
  const idx = actions.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  actions[idx] = {
    ...actions[idx],
    ...updates,
    history: [...(actions[idx].history || []), historyEntry],
    lastUpdate: todayBR(),
  };
  save(actions);
  return actions[idx];
}

export const actionPlanRepository = {
  getActions() {
    return load();
  },

  getActionById(id) {
    return load().find((a) => a.id === id) || null;
  },

  createAction(payload) {
    const actions = load();
    const maxNum = actions.reduce((max, a) => {
      const n = parseInt(a.code.replace("PA-", ""), 10);
      return n > max ? n : max;
    }, 0);
    const code = `PA-${String(maxNum + 1).padStart(3, "0")}`;
    const now = todayBR();
    const newAction = ensureArrays({
      id: `pa-${Date.now()}`,
      code,
      title: payload.title || "",
      description: payload.description || "",
      problemOrOpportunity: payload.problemOrOpportunity || "",
      department: payload.department || "general",
      departmentLabel: payload.departmentLabel || payload.department || "",
      strategicObjective: payload.strategicObjective || "",
      strategicObjectiveLabel: payload.strategicObjectiveLabel || "",
      indicator: payload.indicator || null,
      origin: payload.origin || "manual",
      responsible: payload.responsible || "",
      executor: payload.executor || payload.responsible || "",
      participants: payload.participants || [],
      priority: payload.priority || "medium",
      progress: 0,
      startDate: payload.startDate || now,
      dueDate: payload.dueDate || "",
      lastUpdate: now,
      requiresOwner: payload.requiresOwner || false,
      expectedImpact: payload.expectedImpact || "",
      financialImpact: payload.financialImpact != null ? payload.financialImpact : null,
      budget: payload.budget != null ? payload.budget : null,
      evidenceRequired: payload.evidenceRequired || false,
      blockedReason: null,
      completedAt: null,
      impactStatus: null,
      recommendation: payload.recommendation || null,
      status: payload.requiresOwner ? "awaiting_decision" : "not_started",
      checklist: payload.checklist || [],
      evidences: [],
      comments: [],
      history: [makeHistory("created", payload.createdBy || "Dono", `Ação criada${payload.requiresOwner ? " (aguarda decisão do Dono)" : ""}`)],
    });
    actions.push(newAction);
    save(actions);
    return newAction;
  },

  updateAction(id, updates) {
    const actions = load();
    const idx = actions.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    actions[idx] = { ...actions[idx], ...updates, lastUpdate: todayBR() };
    save(actions);
    return actions[idx];
  },

  approveAction(id, payload) {
    return updateWithHistory(id, {
      status: "in_progress",
      requiresOwner: false,
      responsible: payload.responsible || undefined,
      dueDate: payload.dueDate || undefined,
      budget: payload.budget !== undefined ? payload.budget : undefined,
      approvedBy: payload.approvedBy,
      approvedAt: todayBR(),
      approvalNote: payload.note || "",
    }, makeHistory("approved", payload.approvedBy, `Ação aprovada por ${payload.approvedBy}${payload.note ? `: ${payload.note}` : ""}`));
  },

  delegateAction(id, payload) {
    return updateWithHistory(id, {
      executor: payload.responsible,
      delegatedTo: payload.responsible,
      delegatedAt: todayBR(),
      delegationNote: payload.note || "",
      dueDate: payload.dueDate || undefined,
      priority: payload.priority || undefined,
      participants: payload.participants || undefined,
    }, makeHistory("delegated", payload.delegatedBy || "Dono", `Ação delegada para ${payload.responsible}`));
  },

  startAction(id, payload) {
    return updateWithHistory(id, {
      status: "in_progress",
      startDate: payload.startDate || todayBR(),
      startedBy: payload.startedBy,
      startedAt: nowBR(),
    }, makeHistory("status_changed", payload.startedBy, "Ação iniciada", { from: "not_started", to: "in_progress" }));
  },

  updateProgress(id, payload) {
    return updateWithHistory(id, {
      progress: payload.progress,
      progressNote: payload.comment || "",
      nextStep: payload.nextStep || "",
      projectedDate: payload.projectedDate || "",
    }, makeHistory("progress_changed", payload.updatedBy, `Progresso atualizado para ${payload.progress}%${payload.comment ? `: ${payload.comment}` : ""}`));
  },

  blockAction(id, payload) {
    return updateWithHistory(id, {
      status: "blocked",
      blockedReason: payload.reason,
      blockCategory: payload.category,
      blockResponsible: payload.responsible,
      expectedUnblockDate: payload.expectedUnblockDate,
      blockNote: payload.note,
    }, makeHistory("blocked", payload.blockedBy, `Ação bloqueada: ${payload.reason}`, { category: payload.category }));
  },

  unblockAction(id, payload) {
    const action = this.getActionById(id);
    if (!action) return null;
    return updateWithHistory(id, {
      status: "in_progress",
      blockedReason: null,
      blockCategory: null,
      blockResponsible: null,
      expectedUnblockDate: null,
      unblockSolution: payload.solution,
      unblockNote: payload.note,
    }, makeHistory("unblocked", payload.unblockedBy, `Bloqueio removido: ${payload.solution}`));
  },

  submitForValidation(id, payload) {
    const action = this.getActionById(id);
    if (!action) return null;
    const errors = [];
    if ((action.progress || 0) < 100) errors.push("Progresso deve ser 100%");
    if (action.status === "blocked") errors.push("Ação não pode estar bloqueada");
    const requiredItems = (action.checklist || []).filter((i) => i.required);
    const incompleteRequired = requiredItems.filter((i) => !i.done);
    if (incompleteRequired.length > 0) errors.push(`${incompleteRequired.length} item(ns) obrigatório(s) do checklist pendente(s)`);
    if (action.evidenceRequired && (!action.evidences || action.evidences.length === 0)) {
      errors.push("Evidência obrigatória não anexada");
    }
    if (errors.length > 0) return { error: true, errors };
    return updateWithHistory(id, {
      status: "awaiting_validation",
      submittedForValidationAt: todayBR(),
      submittedForValidationBy: payload.submittedBy,
    }, makeHistory("status_changed", payload.submittedBy, "Enviada para validação", { from: "in_progress", to: "awaiting_validation" }));
  },

  validateAction(id, payload) {
    const current = this.getActionById(id);
    return updateWithHistory(id, {
      status: "completed",
      progress: 100,
      completedAt: todayBR(),
      validatedBy: payload.validatedBy,
      validationNote: payload.note || "",
      impactStatus: payload.impactStatus || current?.impactStatus || "unmeasured",
      impactValueBefore: payload.valueBefore,
      impactValueAfter: payload.valueAfter,
    }, makeHistory("validated", payload.validatedBy, `Conclusão aprovada por ${payload.validatedBy}`, { impactStatus: payload.impactStatus }));
  },

  returnToExecution(id, payload) {
    return updateWithHistory(id, {
      status: "in_progress",
      returnReason: payload.reason,
      returnGuidance: payload.guidance,
      responsible: payload.responsible || undefined,
      dueDate: payload.newDueDate || undefined,
    }, makeHistory("status_changed", payload.returnedBy, `Devolvida para execução: ${payload.reason}`, { from: "awaiting_validation", to: "in_progress" }));
  },

  reopenAction(id, payload) {
    return updateWithHistory(id, {
      status: "in_progress",
      progress: payload.initialProgress != null ? payload.initialProgress : 0,
      completedAt: null,
      impactStatus: null,
      responsible: payload.newResponsible || undefined,
      dueDate: payload.newDueDate || undefined,
      reopenReason: payload.reason,
      reopenNote: payload.note,
    }, makeHistory("reopened", payload.reopenedBy, `Ação reaberta: ${payload.reason}`));
  },

  cancelAction(id, payload) {
    return updateWithHistory(id, {
      status: "cancelled",
      cancelReason: payload.reason,
      cancelNote: payload.note,
      cancelledAt: todayBR(),
      cancelledBy: payload.cancelledBy,
    }, makeHistory("cancelled", payload.cancelledBy, `Ação cancelada: ${payload.reason}`));
  },

  duplicateAction(id, payload) {
    const source = this.getActionById(id);
    if (!source) return null;
    const actions = load();
    const maxNum = actions.reduce((max, a) => {
      const n = parseInt(a.code.replace("PA-", ""), 10);
      return n > max ? n : max;
    }, 0);
    const code = `PA-${String(maxNum + 1).padStart(3, "0")}`;
    const now = todayBR();
    const newAction = ensureArrays({
      ...source,
      id: `pa-${Date.now()}`,
      code,
      title: payload.title || source.title,
      description: payload.description || source.description,
      problemOrOpportunity: payload.problemOrOpportunity || source.problemOrOpportunity,
      department: payload.department || source.department,
      departmentLabel: payload.departmentLabel || source.departmentLabel,
      strategicObjective: payload.strategicObjective || source.strategicObjective,
      strategicObjectiveLabel: payload.strategicObjectiveLabel || source.strategicObjectiveLabel,
      indicator: payload.indicator !== undefined ? payload.indicator : source.indicator,
      responsible: payload.responsible || "",
      executor: payload.responsible || "",
      priority: payload.priority || source.priority,
      dueDate: payload.dueDate || "",
      expectedImpact: payload.expectedImpact || source.expectedImpact,
      status: payload.requiresOwner ? "awaiting_decision" : "not_started",
      requiresOwner: payload.requiresOwner || false,
      progress: 0,
      startDate: now,
      lastUpdate: now,
      completedAt: null,
      impactStatus: null,
      blockedReason: null,
      approvedBy: null,
      approvedAt: null,
      delegatedTo: null,
      delegatedAt: null,
      checklist: (source.checklist || []).map((i) => ({ ...i, done: false, id: `cl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      evidences: [],
      comments: [],
      history: [makeHistory("created", payload.createdBy || "Dono", `Ação criada (duplicada de ${source.code})`)],
    });
    actions.push(newAction);
    save(actions);
    return newAction;
  },

  addComment(id, payload) {
    const action = this.getActionById(id);
    if (!action) return null;
    const comment = {
      id: `c-${Date.now()}`,
      author: payload.author,
      content: payload.content,
      date: nowBR(),
    };
    return updateWithHistory(id, {
      comments: [...(action.comments || []), comment],
    }, makeHistory("comment", payload.author, `Comentário adicionado: ${payload.content.slice(0, 60)}`));
  },

  addEvidence(id, payload) {
    const action = this.getActionById(id);
    if (!action) return null;
    const evidence = {
      id: `e-${Date.now()}`,
      type: payload.type || "file",
      name: payload.name,
      responsible: payload.responsible,
      date: nowBR(),
      note: payload.note || "",
      valueBefore: payload.valueBefore,
      valueAfter: payload.valueAfter,
    };
    return updateWithHistory(id, {
      evidences: [...(action.evidences || []), evidence],
    }, makeHistory("evidence", payload.responsible, `Evidência adicionada: ${payload.name}`));
  },

  removeEvidence(id, evidenceId) {
    const action = this.getActionById(id);
    if (!action) return null;
    return this.updateAction(id, {
      evidences: (action.evidences || []).filter((e) => e.id !== evidenceId),
    });
  },

  addChecklistItem(id, payload) {
    const action = this.getActionById(id);
    if (!action) return null;
    const item = {
      id: `cl-${Date.now()}`,
      text: payload.text,
      done: false,
      required: payload.required || false,
    };
    return this.updateAction(id, {
      checklist: [...(action.checklist || []), item],
    });
  },

  updateChecklistItem(id, itemId, payload) {
    const action = this.getActionById(id);
    if (!action) return null;
    const checklist = (action.checklist || []).map((i) =>
      i.id === itemId ? { ...i, ...payload } : i
    );
    return this.updateAction(id, { checklist });
  },

  removeChecklistItem(id, itemId) {
    const action = this.getActionById(id);
    if (!action) return null;
    return this.updateAction(id, {
      checklist: (action.checklist || []).filter((i) => i.id !== itemId),
    });
  },

  getChecklistProgress(action) {
    const items = action.checklist || [];
    if (items.length === 0) return null;
    const done = items.filter((i) => i.done).length;
    return Math.round((done / items.length) * 100);
  },

  measureImpact(id, payload) {
    return updateWithHistory(id, {
      impactStatus: payload.impactStatus,
      impactValueBefore: payload.valueBefore,
      impactValueAfter: payload.valueAfter,
      realizedImpact: payload.realizedImpact,
      impactMeasurementDate: payload.measurementDate || todayBR(),
      impactNote: payload.note,
    }, makeHistory("impact_measured", payload.measuredBy, `Impacto medido: ${payload.impactStatus}`));
  },

  getActionHistory(id) {
    const action = this.getActionById(id);
    return action ? action.history || [] : [];
  },

  updateDueDate(id, payload) {
    return updateWithHistory(id, {
      dueDate: payload.newDueDate,
      rescheduleReason: payload.reason,
      rescheduleNote: payload.note,
      rescheduledAt: todayBR(),
      rescheduledBy: payload.rescheduledBy,
    }, makeHistory("due_date_changed", payload.rescheduledBy, `Prazo alterado de ${payload.oldDueDate} para ${payload.newDueDate}${payload.reason ? `: ${payload.reason}` : ""}`, { from: payload.oldDueDate, to: payload.newDueDate }));
  },

  batchUpdate(ids, updates) {
    const actions = load();
    const updated = [];
    for (const id of ids) {
      const idx = actions.findIndex((a) => a.id === id);
      if (idx !== -1) {
        actions[idx] = { ...actions[idx], ...updates, lastUpdate: todayBR() };
        updated.push(actions[idx]);
      }
    }
    save(actions);
    return updated;
  },

  reset() {
    save(actionPlanFixtures.map(ensureArrays));
    return actionPlanFixtures;
  },
};