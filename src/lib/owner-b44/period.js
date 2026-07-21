// Cálculo de intervalos de período para filtros da tela do Dono

const startOfMonth = (d) => {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
};

const startOfQuarter = (d) => {
  const x = new Date(d);
  const month = x.getMonth();
  x.setMonth(month - (month % 3));
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
};

const startOfYear = (d) => {
  const x = new Date(d);
  x.setMonth(0);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const computePeriodRange = (period, reference = new Date()) => {
  const start = startOfMonth(reference);
  const end = new Date(reference);
  if (period === "month") {
    return { start: startOfMonth(reference), end };
  }
  if (period === "quarter") {
    const qs = startOfQuarter(reference);
    return { start: qs, end };
  }
  if (period === "year") {
    return { start: startOfYear(reference), end };
  }
  return { start: startOfYear(reference), end };
};

export const PERIOD_LABELS = {
  month: "Mês atual",
  quarter: "Trimestre atual",
  year: "Ano atual",
  custom: "Período personalizado",
};

export const periodLabel = (period, range) => {
  const fmt = (d) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getFullYear()}`;
  };
  if (period === "custom" && range) return `${fmt(range.start)} — ${fmt(range.end)}`;
  if (period === "month") return `${fmt(range.start)} — hoje`;
  if (period === "quarter") return `${fmt(range.start)} — hoje`;
  if (period === "year") return `${fmt(range.start)} — hoje`;
  return "";
};