// Status helpers — texto + cor, sem depender só de cor

export const STATUS_META = {
  on_track: { label: "Dentro do esperado", tone: "green" },
  attention: { label: "Atenção", tone: "amber" },
  critical: { label: "Crítico", tone: "red" },
  no_data: { label: "Sem dados", tone: "slate" },
  done: { label: "Concluído", tone: "green" },
  paused: { label: "Pausado", tone: "slate" },
  pending: { label: "Pendente", tone: "slate" },
  in_progress: { label: "Em andamento", tone: "blue" },
  completed: { label: "Concluído", tone: "green" },
  delayed: { label: "Atrasado", tone: "amber" },
  blocked: { label: "Bloqueado", tone: "red" },
  awaiting_decision: { label: "Aguardando decisão", tone: "amber" },
  approved: { label: "Aprovado", tone: "green" },
  delegated: { label: "Delegado", tone: "blue" },
  converted_action: { label: "Convertida em ação", tone: "blue" },
  deferred: { label: "Adiada", tone: "slate" },
  declined: { label: "Recusado", tone: "red" },
  scheduled: { label: "Agendado", tone: "blue" },
  confirmed: { label: "Confirmado", tone: "green" },
  open: { label: "Aberto", tone: "slate" },
  active: { label: "Ativo", tone: "green" },
};

export const TONE_CLASSES = {
  green: "bg-primary/10 text-primary border-primary/20",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-600 border-red-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  slate: "bg-muted text-muted-foreground border-border",
};

export const DOT_CLASSES = {
  green: "bg-primary",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  slate: "bg-muted-foreground/60",
};

export const getStatusMeta = (status) => STATUS_META[status] || { label: status || "—", tone: "slate" };

export const DEPARTMENT_LABELS = {
  commercial: "Comercial",
  marketing: "Marketing",
  product_stock: "Produto e Estoque",
  people_hr: "Pessoas — RH",
  financial: "Financeiro",
  operations: "Operações",
  executive: "Executivo",
};

export const IMPACT_LABELS = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
};

export const PHASE_LABELS = {
  survival: "Sobrevivência",
  organization: "Organização",
  growth: "Crescimento",
  scale: "Escala",
  consolidation: "Consolidação",
};

export const REQUEST_TYPE_LABELS = {
  question: "Tirar uma dúvida",
  analysis: "Solicitar análise",
  decision_discussion: "Discutir uma decisão",
  review_action: "Revisar uma ação",
  schedule_meeting: "Agendar encontro",
  send_info: "Enviar informação",
  urgent: "Situação urgente",
};

export const PRIORITY_LABELS = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};