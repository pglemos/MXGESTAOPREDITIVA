// Utilitários do Calendário: datas, preferências, restrições de reagendamento.
import { REFERENCE_DATE, CYCLE_INFO } from "../actionPlanConstants";
import { parseBRDate, getRefDate, daysBetween, isLate } from "../actionPlanUtils";

const PREFS_KEY = "mx_action_plan_calendar_preferences_v1";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const WEEKDAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function formatDateBR(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISOToDate(iso) {
  if (!iso || typeof iso !== "string") return null;
  const parts = iso.split("-");
  if (parts.length !== 3) return null;
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return isNaN(date.getTime()) ? null : date;
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isRefToday(date) {
  return isSameDay(date, getRefDate());
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthMatrix(date) {
  const first = startOfMonth(date);
  const start = startOfWeek(first);
  const weeks = [];
  let current = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current = addDays(current, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function getWeekDays(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatMonthYear(date) {
  if (!date || isNaN(date.getTime())) return "";
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWeekRange(date) {
  if (!date || isNaN(date.getTime())) return "";
  const days = getWeekDays(date);
  const s = days[0];
  const e = days[6];
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()} a ${e.getDate()} de ${MONTHS[s.getMonth()].toLowerCase()} de ${s.getFullYear()}`;
  }
  return `${s.getDate()} de ${MONTHS[s.getMonth()].toLowerCase()} a ${e.getDate()} de ${MONTHS[e.getMonth()].toLowerCase()} de ${e.getFullYear()}`;
}

export function formatDayShort(date) {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function getRelativeDayLabel(date) {
  const ref = getRefDate();
  const diff = daysBetween(date, ref);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  return formatDayShort(date).toUpperCase();
}

export function getWeekdayShort(date) {
  return WEEKDAYS_SHORT[date.getDay() === 0 ? 6 : date.getDay() - 1];
}

export function isInCycle(date) {
  const cycleStart = parseBRDate(CYCLE_INFO.startDate);
  const cycleEnd = parseBRDate(CYCLE_INFO.endDate);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return d.getTime() >= cycleStart.getTime() && d.getTime() <= cycleEnd.getTime();
}

export function getActionsForDate(actions, date) {
  return actions.filter((a) => {
    if (!a.dueDate) return false;
    const due = parseBRDate(a.dueDate);
    return due && isSameDay(due, date);
  });
}

export function getActionsByDate(actions) {
  const map = new Map();
  for (const a of actions) {
    if (!a.dueDate) continue;
    const due = parseBRDate(a.dueDate);
    if (!due) continue;
    const key = formatDateISO(due);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(a);
  }
  return map;
}

export function loadCalendarPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { viewMode: null, refDate: REFERENCE_DATE, selectedDate: REFERENCE_DATE };
}

export function saveCalendarPrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function canReschedule(action) {
  if (action.status === "completed") return { allowed: false, message: "Reabra a ação antes de alterar o prazo." };
  if (action.status === "cancelled") return { allowed: false, message: "Ação cancelada não pode ser reagendada." };
  if (action.status === "awaiting_decision") return { allowed: true, requireFuture: true };
  if (action.status === "awaiting_validation") return { allowed: true, requireConfirm: true };
  return { allowed: true };
}

export function getUpcomingDeadlineActions(actions, limit = 5) {
  const ref = getRefDate();
  return actions
    .filter((a) => a.status !== "completed" && a.status !== "cancelled" && a.dueDate)
    .filter((a) => parseBRDate(a.dueDate).getTime() >= ref.getTime())
    .sort((a, b) => parseBRDate(a.dueDate) - parseBRDate(b.dueDate))
    .slice(0, limit);
}