import { eachDayOfInterval, format, parseISO } from "date-fns";

export type RoutineTrendAction = {
  seller_id: string;
  due_at: string;
  status: string;
};

export type RoutineAction = RoutineTrendAction & {
  source_type?: string;
  metadata?: unknown;
  completed_at?: string | null;
  updated_at?: string;
};

export type RoutineActionMetrics = {
  planned: number;
  completed: number;
  followUpsPlanned: number;
  followUpsCompleted: number;
  updatesRequired: number;
  updatesCompleted: number;
};

export type OfficialRoutineComponentInput = {
  value: number | null;
  source: string;
  evidence: string | null;
  reason?: string | null;
  applicable?: boolean;
};

export type OfficialRoutineScore = {
  score: number | null;
  denominator: number;
  components: Array<OfficialRoutineComponentInput & {
    key: keyof OfficialRoutineScoreInput;
    weight: number;
    applicable: boolean;
  }>;
};

export type OfficialRoutineScoreInput = {
  routineAccess: OfficialRoutineComponentInput;
  resolvedPendencies: OfficialRoutineComponentInput;
  attackPlan: OfficialRoutineComponentInput;
  prospectingAgenda: OfficialRoutineComponentInput;
  updatedClients: OfficialRoutineComponentInput;
  dailyClosing: OfficialRoutineComponentInput;
};

export type OfficialRoutineEvidence = {
  dayEligible?: boolean;
  routineAccess: {
    accessed: boolean | null;
    sourceAvailable: boolean;
  };
  resolvedPendencies: {
    planned: number | null;
    resolved: number | null;
    sourceAvailable: boolean;
    zeroLegitimate?: boolean;
    reason?: string | null;
  };
  attackPlan: {
    planned: number | null;
    executed: number | null;
    sourceAvailable: boolean;
    zeroLegitimate?: boolean;
    reason?: string | null;
  };
  prospectingAgenda: {
    planned: number | null;
    executed: number | null;
    sourceAvailable: boolean;
    zeroLegitimate?: boolean;
    reason?: string | null;
  };
  updatedClients: {
    required: number | null;
    updated: number | null;
    sourceAvailable: boolean;
    zeroLegitimate?: boolean;
    reason?: string | null;
  };
  dailyClosing: {
    submitted: boolean | null;
    status: string | null;
    sourceAvailable: boolean;
  };
};

export type OfficialRoutineCanonicalSources = {
  sellerIds: string[];
  date: string;
  actionsAvailable: boolean;
  actions: Array<RoutineAction & { seller_id: string }>;
  openings: Array<{ seller_user_id: string; data?: string }>;
  cadenceStates: Array<{
    seller_user_id: string;
    status: string;
    last_result: string | null;
    proxima_acao_em: string;
    updated_at: string;
  }>;
  schedules: Array<{ quantidade: number | null; dia_semana?: number; semana_mes?: number | null }>;
  qualificationEvents: Array<{ seller_user_id: string; data_evento?: string }>;
  closings: Array<{ seller_user_id: string; submission_status: string; reference_date?: string }>;
  sourcesAvailable: {
    openings: boolean;
    cadenceStates: boolean;
    schedules: boolean;
    qualificationEvents: boolean;
    closings: boolean;
  };
};

export type OfficialRoutineTrendSources = Omit<OfficialRoutineCanonicalSources, 'date'> & {
  start: string;
  end: string;
};

const OFFICIAL_ROUTINE_WEIGHTS: Record<keyof OfficialRoutineScoreInput, number> = {
  routineAccess: 10,
  resolvedPendencies: 10,
  attackPlan: 20,
  prospectingAgenda: 20,
  updatedClients: 20,
  dailyClosing: 20,
};

/** Calcula a pontuação normativa de 100 pontos sem contar componentes não aplicáveis. */
export function buildOfficialRoutineScore(input: OfficialRoutineScoreInput): OfficialRoutineScore {
  const components = (Object.keys(OFFICIAL_ROUTINE_WEIGHTS) as Array<keyof OfficialRoutineScoreInput>).map((key) => {
    const component = input[key];
    const applicable = component.applicable !== false && component.value !== null;
    return {
      ...component,
      key,
      weight: OFFICIAL_ROUTINE_WEIGHTS[key],
      applicable,
    };
  });
  const denominator = components
    .filter((component) => component.applicable)
    .reduce((sum, component) => sum + component.weight, 0);
  const weightedTotal = components
    .filter((component) => component.applicable)
    .reduce((sum, component) => sum + Math.min(100, Math.max(0, component.value ?? 0)) * component.weight, 0);

  return {
    score: denominator > 0 ? Math.round(weightedTotal / denominator) : null,
    denominator,
    components,
  };
}

/** Adapta as fontes canônicas do MX para os seis blocos da fórmula normativa. */
export function buildOfficialRoutineScoreFromEvidence(evidence: OfficialRoutineEvidence): OfficialRoutineScore {
  if (evidence.dayEligible === false) {
    return buildOfficialRoutineScore({
      routineAccess: component(null, 'central_execucao_aberturas', 'Dia não elegível.', false),
      resolvedPendencies: component(null, 'cadencia_estado_cliente', 'Dia não elegível.', false),
      attackPlan: component(null, 'execution_actions', 'Dia não elegível.', false),
      prospectingAgenda: component(null, 'prospecting_schedule/eventos_comerciais', 'Dia não elegível.', false),
      updatedClients: component(null, 'execution_actions', 'Dia não elegível.', false),
      dailyClosing: component(null, 'lancamentos_diarios', 'Dia não elegível.', false),
    });
  }

  return buildOfficialRoutineScore({
    routineAccess: evidence.routineAccess.sourceAvailable
      ? component(evidence.routineAccess.accessed === null ? null : evidence.routineAccess.accessed ? 100 : 0, 'central_execucao_aberturas', evidence.routineAccess.accessed ? 'Abertura oficial registrada.' : 'Nenhuma abertura oficial registrada.')
      : component(null, 'central_execucao_aberturas', 'Fonte oficial indisponível.', false),
    resolvedPendencies: ratioComponent(
      evidence.resolvedPendencies.planned,
      evidence.resolvedPendencies.resolved,
      100,
      'cadencia_estado_cliente',
      evidence.resolvedPendencies,
    ),
    attackPlan: ratioComponent(
      evidence.attackPlan.planned,
      evidence.attackPlan.executed,
      100,
      'execution_actions',
      evidence.attackPlan,
    ),
    prospectingAgenda: ratioComponent(
      evidence.prospectingAgenda.planned,
      evidence.prospectingAgenda.executed,
      100,
      'prospecting_schedule/eventos_comerciais',
      evidence.prospectingAgenda,
    ),
    updatedClients: ratioComponent(
      evidence.updatedClients.required,
      evidence.updatedClients.updated,
      100,
      'execution_actions',
      evidence.updatedClients,
    ),
    dailyClosing: evidence.dailyClosing.sourceAvailable
      ? component(evidence.dailyClosing.submitted === null ? null : evidence.dailyClosing.submitted ? 100 : 0, 'lancamentos_diarios', evidence.dailyClosing.submitted ? `Fechamento ${evidence.dailyClosing.status || 'enviado'}.` : 'Fechamento não contabilizado no sistema.')
      : component(null, 'lancamentos_diarios', 'Fonte oficial indisponível.', false),
  });
}

export function buildOfficialRoutineScores(input: OfficialRoutineCanonicalSources): Record<string, OfficialRoutineScore> {
  return Object.fromEntries(input.sellerIds.map((sellerId) => {
    const actions = input.actions.filter(action => action.seller_id === sellerId && action.due_at.slice(0, 10) === input.date);
    const attackPlan = actions.filter(isAttackPlanAction);
    const updateActions = actions.filter(action => readMetadata(action.metadata).requires_customer_update === true);
    const executedUpdates = updateActions.filter(isCompletedAction);
    const updatedActions = executedUpdates.filter(action => readMetadata(action.metadata).customer_updated === true);
    const cadenceStates = input.cadenceStates.filter(row => row.seller_user_id === sellerId);
    const pendingCadence = cadenceStates.filter(row => row.status === 'ativo' && row.proxima_acao_em <= input.date);
    const resolvedCadence = cadenceStates.filter(row => row.last_result === 'feito' && row.updated_at.slice(0, 10) === input.date);
    const weekday = new Date(`${input.date}T12:00:00-03:00`).getDay();
    const weekOfMonth = Math.min(4, Math.ceil(Number(input.date.slice(8, 10)) / 7));
    const schedulesForDate = input.schedules.filter(row => (
      row.dia_semana === undefined
        || (row.dia_semana === weekday && (row.semana_mes == null || row.semana_mes === weekOfMonth))
    ));
    const prospectingPlanned = schedulesForDate.reduce((sum, row) => sum + Math.max(0, row.quantidade || 0), 0);
    const qualificationEvents = input.qualificationEvents.filter(row => row.seller_user_id === sellerId && (!row.data_evento || row.data_evento.slice(0, 10) === input.date)).length;
    const closing = input.closings.find(row => row.seller_user_id === sellerId && (!row.reference_date || row.reference_date === input.date));

    return [sellerId, buildOfficialRoutineScoreFromEvidence({
      routineAccess: {
        accessed: input.sourcesAvailable.openings ? input.openings.some(row => row.seller_user_id === sellerId && (!row.data || row.data === input.date)) : null,
        sourceAvailable: input.sourcesAvailable.openings,
      },
      resolvedPendencies: {
        planned: input.sourcesAvailable.cadenceStates ? pendingCadence.length + resolvedCadence.length : null,
        resolved: input.sourcesAvailable.cadenceStates ? resolvedCadence.length : null,
        sourceAvailable: input.sourcesAvailable.cadenceStates,
        reason: input.sourcesAvailable.cadenceStates && !cadenceStates.length ? 'Nenhuma base de cadência oficial encontrada.' : null,
      },
      attackPlan: {
        planned: attackPlan.length || null,
        executed: attackPlan.length ? attackPlan.filter(isCompletedAction).length : null,
        sourceAvailable: true,
        reason: attackPlan.length ? null : 'Nenhuma ação oficial do Plano de Ataque encontrada.',
      },
      prospectingAgenda: {
        planned: input.sourcesAvailable.schedules && prospectingPlanned > 0 ? prospectingPlanned : null,
        executed: input.sourcesAvailable.qualificationEvents && prospectingPlanned > 0 ? qualificationEvents : null,
        sourceAvailable: input.sourcesAvailable.schedules && input.sourcesAvailable.qualificationEvents,
        reason: prospectingPlanned > 0 ? null : 'Agenda de prospecção não criada.',
      },
      updatedClients: {
        required: input.actionsAvailable ? updateActions.length : null,
        updated: input.actionsAvailable ? updatedActions.length : null,
        sourceAvailable: input.actionsAvailable,
        reason: executedUpdates.length ? null : 'Nenhuma ação executada que exigisse atualização.',
      },
      dailyClosing: {
        submitted: input.sourcesAvailable.closings ? closing ? closing.submission_status !== 'draft' : false : null,
        status: closing?.submission_status || null,
        sourceAvailable: input.sourcesAvailable.closings,
      },
    })];
  }));
}

export function buildOfficialRoutineTrend(input: OfficialRoutineTrendSources) {
  return eachDayOfInterval({ start: parseISO(input.start), end: parseISO(input.end) }).map((day) => {
    const date = format(day, 'yyyy-MM-dd');
    const hasOfficialEvidence = input.actions.some(action => action.due_at.slice(0, 10) === date)
      || input.openings.some(row => !row.data || row.data === date)
      || input.cadenceStates.some(row => row.updated_at.slice(0, 10) === date || row.proxima_acao_em === date)
      || input.qualificationEvents.some(row => !row.data_evento || row.data_evento.slice(0, 10) === date)
      || input.closings.some(row => !row.reference_date || row.reference_date === date);
    const scores = buildOfficialRoutineScores({ ...input, date });
    const values = Object.values(scores)
      .map(score => score.score)
      .filter((value): value is number => value !== null);

    return {
      date,
      label: format(day, 'dd/MM'),
      value: hasOfficialEvidence && values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null,
    };
  });
}

function component(
  value: number | null,
  source: string,
  evidence: string | null,
  applicable = true,
): OfficialRoutineComponentInput {
  return { value, source, evidence, applicable };
}

function ratioComponent(
  planned: number | null,
  executed: number | null,
  scale: number,
  source: string,
  evidence: { sourceAvailable: boolean; zeroLegitimate?: boolean; reason?: string | null },
  zeroOnEmpty = false,
): OfficialRoutineComponentInput {
  if (!evidence.sourceAvailable) return component(null, source, evidence.reason || 'Fonte oficial indisponível.', false);
  if (planned === null || executed === null) return component(null, source, evidence.reason || 'Base oficial insuficiente.', false);
  if (planned === 0) {
    if (evidence.zeroLegitimate || zeroOnEmpty) {
      return component(zeroOnEmpty ? 0 : scale, source, evidence.reason || (zeroOnEmpty ? 'Nenhuma ação exigia atualização.' : 'Nenhuma pendência oficial encontrada.'));
    }
    return component(null, source, evidence.reason || 'Base oficial insuficiente.', false);
  }
  return component(Math.min(scale, Math.max(0, (executed / planned) * scale)), source, `${executed}/${planned} registros oficiais.`);
}

function isCompletedAction(action: RoutineAction): boolean {
  return action.status === 'concluida' || action.status === 'justificada';
}

function isAttackPlanAction(action: RoutineAction): boolean {
  const metadata = readMetadata(action.metadata);
  return action.source_type === 'funil'
    || metadata.category === 'plano_ataque'
    || metadata.block === 'plano_ataque';
}

export function buildRoutineActionMetrics(
  actions: RoutineAction[],
): RoutineActionMetrics {
  const completedActions = actions.filter((action) => (
    action.status === "concluida" || action.status === "justificada"
  ));
  const followUps = actions.filter((action) => (
    action.source_type === "funil"
      || readMetadata(action.metadata).category === "plano_ataque"
      || readMetadata(action.metadata).block === "plano_ataque"
  ));
  const updates = actions.filter((action) => readMetadata(action.metadata).requires_customer_update === true);
  const executedUpdates = updates.filter(isCompletedAction);

  return {
    planned: actions.length,
    completed: completedActions.length,
    followUpsPlanned: followUps.length,
    followUpsCompleted: followUps.filter((action) => (
      action.status === "concluida"
        || action.status === "justificada"
        || readMetadata(action.metadata).follow_up_completed === true
    )).length,
    updatesRequired: executedUpdates.length,
    updatesCompleted: executedUpdates.filter((action) => readMetadata(action.metadata).customer_updated === true).length,
  };
}

export function getRoutineDateFromSearch(search: string, fallback: string) {
  const value = new URLSearchParams(search).get("data");
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

function readMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
