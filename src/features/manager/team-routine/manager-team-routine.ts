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

  return {
    planned: actions.length,
    completed: completedActions.length,
    followUpsPlanned: followUps.length,
    followUpsCompleted: followUps.filter((action) => (
      action.status === "concluida"
        || action.status === "justificada"
        || readMetadata(action.metadata).follow_up_completed === true
    )).length,
    updatesRequired: updates.length,
    updatesCompleted: updates.filter((action) => (
      readMetadata(action.metadata).customer_updated === true
        || action.status === "concluida"
        || action.status === "justificada"
    )).length,
  };
}

export function getRoutineDateFromSearch(search: string, fallback: string) {
  const value = new URLSearchParams(search).get("data");
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

export function buildRoutineTrend(
  actions: RoutineTrendAction[],
  start: string,
  end: string,
) {
  return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map(
    (day) => {
      const date = format(day, "yyyy-MM-dd");
      const bySeller = new Map<string, { completed: number; total: number }>();

      for (const action of actions) {
        if (!action.due_at.startsWith(date)) continue;
        const current = bySeller.get(action.seller_id) || {
          completed: 0,
          total: 0,
        };
        current.total += 1;
        if (action.status === "concluida" || action.status === "justificada") {
          current.completed += 1;
        }
        bySeller.set(action.seller_id, current);
      }

      const values = Array.from(bySeller.values()).map((seller) =>
        seller.total > 0 ? Math.round((seller.completed / seller.total) * 100) : 0,
      );

      return {
        date,
        label: format(day, "dd/MM"),
        value: values.length
          ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
          : null,
      };
    },
  );
}

function readMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
