import { z } from 'zod'

// ============================================================================
// CRM do Vendedor — schemas (cliente, oportunidade, agendamento, atendimento)
// Espelha supabase/migrations/20260609120000_mx_crm_vendedor_foundation.sql
// ============================================================================

export const CRM_CANAIS = ['carteira', 'internet', 'showroom', 'porta'] as const
export const CRM_CLIENTE_STATUS = ['oportunidade', 'ativo', 'pos_venda', 'aguardando_contato', 'inativo'] as const
export const CRM_RELACIONAMENTO = ['excelente', 'bom', 'neutro', 'ruim', 'critico'] as const
export const CRM_ETAPAS_FUNIL = ['prospeccao', 'qualificacao', 'apresentacao', 'negociacao', 'fechamento', 'ganho', 'perdido'] as const
export const CRM_FINANCIAMENTO = ['aprovado', 'reprovado', 'nao_aplica', 'pendente'] as const
export const CRM_AGENDAMENTO_TIPO = ['visita', 'retorno', 'test_drive', 'entrega', 'negociacao'] as const
export const CRM_AGENDAMENTO_STATUS = ['confirmado', 'aguardando', 'compareceu', 'nao_compareceu'] as const

export type CrmCanal = (typeof CRM_CANAIS)[number]
export type CrmClienteStatus = (typeof CRM_CLIENTE_STATUS)[number]
export type CrmRelacionamento = (typeof CRM_RELACIONAMENTO)[number]
export type CrmEtapaFunil = (typeof CRM_ETAPAS_FUNIL)[number]
export type CrmFinanciamento = (typeof CRM_FINANCIAMENTO)[number]
export type CrmAgendamentoTipo = (typeof CRM_AGENDAMENTO_TIPO)[number]
export type CrmAgendamentoStatus = (typeof CRM_AGENDAMENTO_STATUS)[number]

// Etapas que compõem o funil "vivo" (exclui terminais ganho/perdido)
export const CRM_ETAPAS_ATIVAS: CrmEtapaFunil[] = ['prospeccao', 'qualificacao', 'apresentacao', 'negociacao', 'fechamento']

export const CRM_ETAPA_LABEL: Record<CrmEtapaFunil, string> = {
  prospeccao: 'Prospecção',
  qualificacao: 'Qualificação',
  apresentacao: 'Apresentação',
  negociacao: 'Negociação',
  fechamento: 'Fechamento',
  ganho: 'Vendas Realizadas',
  perdido: 'Perdido',
}

export const CRM_CANAL_LABEL: Record<CrmCanal, string> = {
  carteira: 'Carteira',
  internet: 'Internet',
  showroom: 'Showroom',
  porta: 'Porta',
}

export const CRM_CLIENTE_STATUS_LABEL: Record<CrmClienteStatus, string> = {
  oportunidade: 'Oportunidade',
  ativo: 'Ativo',
  pos_venda: 'Pós-venda',
  aguardando_contato: 'Aguardando contato',
  inativo: 'Inativo',
}

export const CRM_RELACIONAMENTO_LABEL: Record<CrmRelacionamento, string> = {
  excelente: 'Excelente',
  bom: 'Bom',
  neutro: 'Neutro',
  ruim: 'Ruim',
  critico: 'Crítico',
}

export const CRM_AGENDAMENTO_STATUS_LABEL: Record<CrmAgendamentoStatus, string> = {
  confirmado: 'Confirmado',
  aguardando: 'Aguardando',
  compareceu: 'Compareceu',
  nao_compareceu: 'Não compareceu',
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
export const ClienteSchema = z.object({
  id: z.string().uuid(),
  loja_id: z.string().uuid(),
  seller_user_id: z.string().uuid(),
  nome: z.string(),
  telefone: z.string().nullable(),
  empresa: z.string().nullable(),
  canal_origem: z.enum(CRM_CANAIS).nullable(),
  status: z.enum(CRM_CLIENTE_STATUS),
  relacionamento: z.enum(CRM_RELACIONAMENTO),
  ultima_interacao: z.string().nullable(),
  proxima_acao: z.string().nullable(),
  proxima_acao_em: z.string().nullable(),
  potencial_negocio: z.coerce.number().default(0),
  observacoes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Cliente = z.infer<typeof ClienteSchema>

export const OportunidadeSchema = z.object({
  id: z.string().uuid(),
  cliente_id: z.string().uuid(),
  loja_id: z.string().uuid(),
  seller_user_id: z.string().uuid(),
  veiculo_interesse: z.string().nullable(),
  valor_negociado: z.coerce.number().default(0),
  etapa: z.enum(CRM_ETAPAS_FUNIL),
  canal: z.enum(CRM_CANAIS).nullable(),
  sinal: z.coerce.number().default(0),
  financiamento: z.enum(CRM_FINANCIAMENTO),
  carro_avaliado: z.boolean(),
  motivo_perda: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().nullable(),
})
export type Oportunidade = z.infer<typeof OportunidadeSchema>

export const AgendamentoSchema = z.object({
  id: z.string().uuid(),
  cliente_id: z.string().uuid().nullable(),
  oportunidade_id: z.string().uuid().nullable(),
  loja_id: z.string().uuid(),
  seller_user_id: z.string().uuid(),
  data_hora: z.string(),
  canal: z.enum(CRM_CANAIS).nullable(),
  tipo: z.enum(CRM_AGENDAMENTO_TIPO),
  status: z.enum(CRM_AGENDAMENTO_STATUS),
  proxima_acao: z.string().nullable(),
  observacoes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Agendamento = z.infer<typeof AgendamentoSchema>

export const AtendimentoSchema = z.object({
  id: z.string().uuid(),
  cliente_id: z.string().uuid().nullable(),
  loja_id: z.string().uuid(),
  seller_user_id: z.string().uuid(),
  data: z.string(),
  canal: z.enum(CRM_CANAIS),
  observacoes: z.string().nullable(),
  created_at: z.string(),
})
export type Atendimento = z.infer<typeof AtendimentoSchema>

// ---------------------------------------------------------------------------
// Parse helpers (tolerantes — descartam linhas fora do contrato sem quebrar UI)
// ---------------------------------------------------------------------------
function parseArray<T>(schema: z.ZodType<T>, data: unknown): T[] {
  if (!Array.isArray(data)) return []
  const out: T[] = []
  for (const row of data) {
    const parsed = schema.safeParse(row)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

/**
 * Formata datas para pt-BR sem o deslocamento de fuso típico de strings
 * date-only (`YYYY-MM-DD`), que `new Date('YYYY-MM-DD')` interpreta como UTC
 * meia-noite e exibe -1 dia em fusos negativos (ex.: America/Sao_Paulo).
 */
export function formatDateBR(value: string | null | undefined): string {
  if (!value) return '—'
  const dateOnly = value.length === 10 ? `${value}T12:00:00` : value
  const d = new Date(dateOnly)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}

export const parseClientes = (d: unknown) => parseArray(ClienteSchema, d)
export const parseOportunidades = (d: unknown) => parseArray(OportunidadeSchema, d)
export const parseAgendamentos = (d: unknown) => parseArray(AgendamentoSchema, d)
export const parseAtendimentos = (d: unknown) => parseArray(AtendimentoSchema, d)
