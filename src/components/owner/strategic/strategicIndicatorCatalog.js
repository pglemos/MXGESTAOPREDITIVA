// Catálogo legado do Plano Estratégico, mantido fora do runtime ativo.
// Fonte única de verdade para metas, metadados e classificação de indicadores.

const C = (v) => Array(12).fill(v);
const JAN_REST = (jan, rest) => [jan, ...Array(11).fill(rest)];

function ind(id, name, area, direction, sourceType, displayFormat, aggregationMode, unitLabel, decimalPlaces, targetValues) {
  return { id, code: id, name, area, direction, sourceType, displayFormat, aggregationMode, unitLabel, decimalPlaces, targetValues, active: true };
}

export const strategicIndicatorCatalog = [
  // ===================== VENDAS — 22 =====================
  ind("SP-001", "Vendas Total", "Vendas", "increase", "Número", "integer", "sum", "veículos", 0, C(55)),
  ind("SP-002", "Vendas - Fluxo de Porta", "Vendas", "increase", "Número", "integer", "sum", "veículos", 0, C(15)),
  ind("SP-003", "Vendas - Indicação", "Vendas", "increase", "Número", "integer", "sum", "veículos", 0, C(5)),
  ind("SP-004", "Vendas - Carteira Empresa", "Vendas", "increase", "Número", "integer", "sum", "veículos", 0, C(5)),
  ind("SP-005", "Vendas - Carteira Vendedor", "Vendas", "increase", "Número", "integer", "sum", "veículos", 0, C(10)),
  ind("SP-006", "Vendas - Internet", "Vendas", "increase", "Número", "integer", "sum", "veículos", 0, C(20)),
  ind("SP-007", "Vendas - Outros", "Vendas", "increase", "Número", "integer", "sum", "veículos", 0, C(0)),
  ind("SP-008", "Volume de Vendedores", "Vendas", "increase", "Número", "integer", "last", "vendedores", 0, C(7)),
  ind("SP-009", "Média de Vendas por Vendedor", "Vendas", "increase", "Número", "decimal", "average", "vendas/vendedor", 1, C(7.9)),
  ind("SP-010", "Média de Leads por Vendedor", "Vendas", "increase", "Número", "decimal", "average", "leads/vendedor", 1, C(114.3)),
  ind("SP-011", "Volume de Carros Avaliados", "Vendas", "increase", "Número", "decimal", "sum", "veículos", 1, C(82.5)),
  ind("SP-012", "Volume de Vendas com Troca", "Vendas", "increase", "Número", "decimal", "sum", "veículos", 1, C(27.5)),
  ind("SP-013", "% de Vendas com Troca", "Vendas", "increase", "Porcentagem", "percentage", "average", "%", 0, C(50)),
  ind("SP-014", "Volume de Fichas Aprovadas", "Vendas", "increase", "Número", "decimal", "sum", "fichas", 1, C(36.3)),
  ind("SP-015", "Volume de Fichas Pagas", "Vendas", "increase", "Número", "decimal", "sum", "fichas", 1, C(33.0)),
  ind("SP-016", "% de Vendas Financiadas", "Vendas", "increase", "Porcentagem", "percentage", "average", "%", 0, C(60)),
  ind("SP-017", "Volume de Agendamentos", "Vendas", "increase", "Número", "decimal", "sum", "agendamentos", 1, C(160.0)),
  ind("SP-018", "Volume de Visitas", "Vendas", "increase", "Número", "decimal", "sum", "visitas", 1, C(52.8)),
  ind("SP-019", "Volume de Agendamentos por Venda", "Vendas", "decrease", "Número", "decimal", "average", "agendamentos/venda", 1, C(8.0)),
  ind("SP-020", "Conversão de Leads em Agendamentos", "Vendas", "increase", "Porcentagem", "percentage", "average", "%", 0, C(20)),
  ind("SP-021", "Conversão de Agendamentos em Visitas", "Vendas", "increase", "Porcentagem", "percentage", "average", "%", 0, C(33)),
  ind("SP-022", "Conversão de Visitas em Vendas", "Vendas", "increase", "Porcentagem", "percentage", "average", "%", 2, C(37.88)),

  // ===================== MARKETING — 6 =====================
  ind("SP-023", "Volume de Leads Recebidos", "Marketing", "increase", "Número", "integer", "sum", "leads", 0, C(800)),
  ind("SP-024", "Investimento Internet", "Marketing", "decrease", "Moeda", "currency", "sum", "R$", 0, C(16000)),
  ind("SP-025", "Custo por Venda na Internet", "Marketing", "decrease", "Moeda", "currency", "average", "R$", 0, C(800)),
  ind("SP-026", "Volume de Seguidores no Instagram", "Marketing", "increase", "Número", "integer", "last", "seguidores", 0, [43079, 43079, 43079, 43079, 43079, 43200, 43300, 43400, 43500, 43600, 43700, 43800]),
  ind("SP-027", "Avaliação Google Meu Negócio", "Marketing", "increase", "Número", "rating", "average", "nota", 1, C(4.9)),
  ind("SP-028", "Qualidade do Conteúdo", "Marketing", "increase", "Número", "rating", "average", "nota", 1, C(5.0)),

  // ===================== ESTOQUE — 7 =====================
  ind("SP-029", "Giro de Estoque", "Estoque", "increase", "Número", "percentage", "average", "%", 0, JAN_REST(59, 61)),
  ind("SP-030", "Estoque Ativo", "Estoque", "increase", "Número", "integer", "last", "veículos", 0, JAN_REST(61, 59)),
  ind("SP-031", "Estoque Total", "Estoque", "increase", "Número", "decimal", "last", "veículos", 2, JAN_REST(93.50, 90.75)),
  ind("SP-032", "Tempo de Estoque > 90 Dias", "Estoque", "decrease", "Número", "decimal", "last", "dias", 2, JAN_REST(14.03, 13.61)),
  ind("SP-033", "% do Estoque > 90 Dias", "Estoque", "decrease", "Porcentagem", "percentage", "last", "%", 0, C(15)),
  ind("SP-034", "Ticket Médio do Estoque", "Estoque", "increase", "Moeda", "currency", "average", "R$", 0, C(80000)),
  ind("SP-035", "Margem Média do Estoque", "Estoque", "increase", "Moeda", "currency", "average", "R$", 0, C(16000)),

  // ===================== FINANCEIRO — 5 =====================
  ind("SP-036", "Margem de Contribuição", "Financeiro", "increase", "Moeda", "currency", "sum", "R$", 0, C(440000)),
  ind("SP-037", "Receita Adicional", "Financeiro", "increase", "Moeda", "currency", "sum", "R$", 0, C(50000)),
  ind("SP-038", "Despesa Total", "Financeiro", "decrease", "Moeda", "currency", "sum", "R$", 0, C(300000)),
  ind("SP-039", "Lucro Líquido", "Financeiro", "increase", "Moeda", "currency", "sum", "R$", 0, C(190000)),
  ind("SP-040", "Margem Média de Venda", "Financeiro", "increase", "Moeda", "currency", "average", "R$", 0, C(8000)),

  // ===================== OPERACIONAL — 5 =====================
  ind("SP-041", "Custo Médio de Preparação", "Operacional", "decrease", "Moeda", "currency", "average", "R$", 0, C(2800)),
  ind("SP-042", "Custo Médio de Pós-Venda", "Operacional", "decrease", "Moeda", "currency", "average", "R$", 0, C(800)),
  ind("SP-043", "Volume de Pós-Venda", "Operacional", "decrease", "Número", "integer", "sum", "veículos", 0, C(11)),
  ind("SP-044", "% de Pós-Venda", "Operacional", "decrease", "Porcentagem", "percentage", "average", "%", 0, C(20)),
  ind("SP-045", "Quadro de Colaboradores", "Operacional", "decrease", "Número", "integer", "last", "colaboradores", 0, C(23)),
];

export const AREA_LIST = ["Vendas", "Marketing", "Estoque", "Financeiro", "Operacional"];

export const AREA_INDICATOR_COUNTS = AREA_LIST.reduce((acc, area) => {
  acc[area] = strategicIndicatorCatalog.filter((i) => i.area === area).length;
  return acc;
}, {});

export const DIRECTION_LABELS = { increase: "Aumentar", decrease: "Diminuir" };
export const AGGREGATION_LABELS = { sum: "Soma", average: "Média", last: "Último valor" };
export const FORMAT_LABELS = { integer: "Inteiro", decimal: "Decimal", percentage: "Percentual", currency: "Moeda", rating: "Avaliação" };
