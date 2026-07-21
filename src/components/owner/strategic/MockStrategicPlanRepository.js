// Repositório mock do Plano Estratégico com persistência em localStorage.
// Arquitetado para ser substituído por uma API real sem alterar os componentes.

import { strategicIndicatorCatalog } from "./strategicIndicatorCatalog";
import { generateCurrentValues, generatePreviousYearValues } from "./strategicPlanFixtures";
import { SELECTED_MONTH_INDEX, REFERENCE_YEAR, MONTHS, formatCellValue, calculatePercentageOfTarget, calculateVariation, consolidateValues, getConsolidatedLabel } from "./strategicUtils";

const KEYS = {
  targets: "mx_strategic_plan_targets_v1",
  actions: "mx_strategic_plan_actions_v1",
  history: "mx_strategic_plan_history_v1",
  preferences: "mx_strategic_plan_preferences_v2",
};

class MockStrategicPlanRepository {
  constructor() {
    this.keys = KEYS;
  }

  // ---------- Catalog ----------
  getIndicatorCatalog() {
    return strategicIndicatorCatalog;
  }

  getIndicatorById(id) {
    return strategicIndicatorCatalog.find((i) => i.id === id) || null;
  }

  // ---------- Series ----------
  getIndicatorSeries(indicatorId, _companyId = "demo", _unitId = "all", year = REFERENCE_YEAR) {
    const base = this.getIndicatorById(indicatorId);
    if (!base) return null;

    const targetValues = this._getTargets(indicatorId, year);
    const indicatorWithTargets = { ...base, targetValues };
    const currentFull = generateCurrentValues(indicatorWithTargets);
    const previousFull = generatePreviousYearValues(indicatorWithTargets);

    // Mask future months for current values
    const currentValues = currentFull.map((v, i) => (i <= SELECTED_MONTH_INDEX ? v : null));

    return {
      ...base,
      targetValues,
      currentValues,
      previousYearValues: previousFull,
    };
  }

  getOverviewData(_companyId = "demo", _unitId = "all", year = REFERENCE_YEAR) {
    return strategicIndicatorCatalog.map((ind) => this.getIndicatorSeries(ind.id, _companyId, _unitId, year));
  }

  // ---------- Targets ----------
  updateTargets(indicatorId, year, values, user, note) {
    const indicator = this.getIndicatorById(indicatorId);
    const previousValues = this._getTargets(indicatorId, year);
    this._setTargets(indicatorId, year, values);
    this._addHistory({
      indicatorId,
      indicatorName: indicator?.name || indicatorId,
      year,
      timestamp: new Date().toISOString(),
      user: user?.full_name || user?.email || "Usuário",
      previousValues,
      newValues: values,
      note: note || "",
    });
  }

  resetDemoTargets(indicatorId, year, user) {
    const indicator = this.getIndicatorById(indicatorId);
    if (!indicator) return;
    const previousValues = this._getTargets(indicatorId, year);
    this._removeTargets(indicatorId, year);
    this._addHistory({
      indicatorId,
      indicatorName: indicator.name,
      year,
      timestamp: new Date().toISOString(),
      user: user?.full_name || user?.email || "Sistema",
      previousValues,
      newValues: indicator.targetValues,
      note: "Restaurado para os valores originais",
    });
  }

  // ---------- Actions ----------
  createActionItem(payload) {
    const actions = this._getActions();
    const action = { id: `action_${Date.now()}`, createdAt: new Date().toISOString(), ...payload };
    actions.push(action);
    this._setActions(actions);
    return action;
  }

  getActionItems(indicatorId) {
    const actions = this._getActions();
    return indicatorId ? actions.filter((a) => a.indicatorId === indicatorId) : actions;
  }

  // ---------- History ----------
  getTargetHistory(indicatorId, year) {
    const history = this._getHistory();
    return history
      .filter((h) => h.indicatorId === indicatorId && String(h.year) === String(year))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  restoreHistoryVersion(historyId, user) {
    const history = this._getHistory();
    const entry = history.find((h) => h.id === historyId);
    if (!entry) return;
    this.updateTargets(entry.indicatorId, entry.year, entry.newValues, user, `Restaurado da versão de ${entry.timestamp}`);
  }

  // ---------- Preferences ----------
  getPreferences() {
    return this._read(this.keys.preferences, {});
  }

  setPreferences(prefs) {
    const current = this._read(this.keys.preferences, {});
    this._write(this.keys.preferences, { ...current, ...prefs });
  }

  // ---------- Export ----------
  exportIndicatorData(indicatorId, year = REFERENCE_YEAR) {
    const series = this.getIndicatorSeries(indicatorId, "demo", "all", year);
    if (!series) return "";
    const header = ["Código", "Indicador", "Área", "Direção", "Tipo", "Agregação", "Série", ...MONTHS, "Consolidado"];
    const rows = [header];
    const { targetValues, currentValues, previousYearValues, displayFormat, decimalPlaces, aggregationMode } = series;

    const consTarget = consolidateValues(targetValues, aggregationMode, SELECTED_MONTH_INDEX);
    const consCurrent = consolidateValues(currentValues, aggregationMode, SELECTED_MONTH_INDEX);
    const consPrevious = consolidateValues(previousYearValues, aggregationMode, SELECTED_MONTH_INDEX);

    const pctValues = currentValues.map((c, i) => (c !== null && targetValues[i] ? calculatePercentageOfTarget(c, targetValues[i]) : null));
    const consPct = consCurrent !== null && consTarget ? calculatePercentageOfTarget(consCurrent, consTarget) : null;
    const varValues = currentValues.map((c, i) => (c !== null ? calculateVariation(c, previousYearValues[i]) : null));
    const consVar = consCurrent !== null && consPrevious ? calculateVariation(consCurrent, consPrevious) : null;

    const meta = [series.code, series.name, series.area, series.direction, series.sourceType, series.aggregationMode];

    const fmtRow = (label, vals, cons) => [...meta, label, ...vals.map((v) => (v === null || v === undefined ? "—" : formatCellValue(v, displayFormat, decimalPlaces))), cons !== null && cons !== undefined ? formatCellValue(cons, displayFormat, decimalPlaces) : "—"];
    const fmtPctRow = (label, vals, cons) => [...meta, label, ...vals.map((v) => (v === null || v === undefined ? "—" : formatCellValue(v, "percentage", 1))), cons !== null && cons !== undefined ? formatCellValue(cons, "percentage", 1) : "—"];

    rows.push(fmtRow("Meta", targetValues, consTarget));
    rows.push(fmtRow("Resultado Atual", currentValues, consCurrent));
    rows.push(fmtPctRow("% da Meta", pctValues, consPct));
    rows.push(fmtRow("Ano Anterior", previousYearValues, consPrevious));
    rows.push(fmtPctRow("Variação vs. Ano Anterior", varValues, consVar));

    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  }

  exportOverviewData(year = REFERENCE_YEAR) {
    const allSeries = this.getOverviewData("demo", "all", year);
    const header = ["Código", "Indicador", "Área", "Direção", "Tipo", "Agregação", ...MONTHS, getConsolidatedLabel("sum", SELECTED_MONTH_INDEX)];
    const rows = [header];
    for (const s of allSeries) {
      const cons = consolidateValues(s.targetValues, s.aggregationMode, SELECTED_MONTH_INDEX);
      rows.push([
        s.code, s.name, s.area, s.direction, s.sourceType, s.aggregationMode,
        ...s.targetValues.map((v) => formatCellValue(v, s.displayFormat, s.decimalPlaces)),
        formatCellValue(cons, s.displayFormat, s.decimalPlaces),
      ]);
    }
    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  }

  // ---------- localStorage helpers ----------
  _getTargets(indicatorId, year) {
    const all = this._read(this.keys.targets, {});
    const key = `${indicatorId}_${year}`;
    return all[key] || this.getIndicatorById(indicatorId)?.targetValues || [];
  }

  _setTargets(indicatorId, year, values) {
    const all = this._read(this.keys.targets, {});
    all[`${indicatorId}_${year}`] = values;
    this._write(this.keys.targets, all);
  }

  _removeTargets(indicatorId, year) {
    const all = this._read(this.keys.targets, {});
    delete all[`${indicatorId}_${year}`];
    this._write(this.keys.targets, all);
  }

  _getActions() { return this._read(this.keys.actions, []); }
  _setActions(a) { this._write(this.keys.actions, a); }
  _getHistory() { return this._read(this.keys.history, []); }
  _setHistory(h) { this._write(this.keys.history, h); }
  _addHistory(entry) {
    const h = this._getHistory();
    h.push({ id: `hist_${Date.now()}`, ...entry });
    this._setHistory(h);
  }

  _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }
}

export const strategicPlanRepository = new MockStrategicPlanRepository();