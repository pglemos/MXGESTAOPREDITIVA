// Geração determinística de Resultado Atual e Ano Anterior para os 45 indicadores.
// Valores fixos e previsíveis — não usa Math.random.

const INCREASE_CURRENT = [1.09, 0.93, 1.05, 0.89, 0.96, 1.02, 0.98, 1.06, 1.0, 1.04, 0.95, 1.08];
const DECREASE_CURRENT = [0.94, 1.08, 0.96, 1.12, 1.03, 0.98, 0.92, 1.05, 0.97, 0.9, 0.95, 0.88];
const INCREASE_PREVIOUS = [0.88, 0.91, 0.94, 0.92, 0.9, 0.93, 0.96, 0.98, 1.0, 1.01, 1.03, 1.05];
const DECREASE_PREVIOUS = [1.18, 1.14, 1.12, 1.1, 1.08, 1.06, 1.04, 1.02, 1.0, 0.98, 0.96, 0.94];

// Valores específicos para Vendas Total (SP-001)
const SP001_CURRENT = [60, 36, 85, 49, 52, 57, 18, 58, 54, 61, 50, 63];
const SP001_PREVIOUS = [52, 48, 57, 50, 46, 54, 56, 51, 53, 58, 60, 62];

function roundFixture(value, format, decimalPlaces) {
  if (!isFinite(value)) return 0;
  switch (format) {
    case "integer":
      return Math.round(value);
    case "decimal": {
      const f = Math.pow(10, decimalPlaces);
      return Math.round(value * f) / f;
    }
    case "percentage": {
      const f = Math.pow(10, decimalPlaces);
      return Math.round(value * f) / f;
    }
    case "currency":
      return Math.round(value / 10) * 10;
    case "rating":
      return Math.min(5, Math.max(0, Math.round(value * 10) / 10));
    default:
      return value;
  }
}

export function generateCurrentValues(indicator) {
  if (indicator.id === "SP-001") return [...SP001_CURRENT];
  const mult = indicator.direction === "increase" ? INCREASE_CURRENT : DECREASE_CURRENT;
  return indicator.targetValues.map((t, i) => roundFixture(t * mult[i], indicator.displayFormat, indicator.decimalPlaces));
}

export function generatePreviousYearValues(indicator) {
  if (indicator.id === "SP-001") return [...SP001_PREVIOUS];
  const mult = indicator.direction === "increase" ? INCREASE_PREVIOUS : DECREASE_PREVIOUS;
  return indicator.targetValues.map((t, i) => roundFixture(t * mult[i], indicator.displayFormat, indicator.decimalPlaces));
}

// Configuração dos 5 cards executivos da Visão Geral — vinculados a indicadores do catálogo.
export const executiveCardConfigs = [
  { id: "profit", indicatorId: "SP-039", title: "Lucro Líquido", icon: "dollar", iconColor: "green", sparkType: "line", sparkColor: "green" },
  { id: "volume", indicatorId: "SP-001", title: "Volume de Vendas", icon: "barChart", iconColor: "purple", sparkType: "bar", sparkColor: "purple" },
  { id: "cost", indicatorId: "SP-025", title: "Custo p/ Venda", icon: "shoppingCart", iconColor: "orange", sparkType: "line", sparkColor: "orange" },
  { id: "stock", indicatorId: "SP-031", title: "Estoque Total", icon: "package", iconColor: "blue", sparkType: "line", sparkColor: "blue" },
  { id: "employees", indicatorId: "SP-045", title: "Funcionários", icon: "users", iconColor: "teal", sparkType: "line", sparkColor: "teal" },
];