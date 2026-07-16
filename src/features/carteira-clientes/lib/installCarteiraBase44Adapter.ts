import { supabase } from '@/lib/supabase'
import {
  canalToDb,
  financingToDb,
  mapMxClientToCarteiraVisual,
  situationToStage,
} from './carteira-mappers'

type AnyRecord = Record<string, any>
type Base44Facade = { auth: { me: () => Promise<AnyRecord> }; entities: Record<string, any> }

const INSTALLED_KEY = Symbol.for('mx.carteira-base44-adapter.installed')
const pendingEvents = new Map<string, { eventId: string; createdAt: number }>()

function mutationKey(scope: string): string {
  const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${scope}:${uuid}`
}

function matchesQuery(row: AnyRecord, query?: AnyRecord | null): boolean {
  if (!query) return true
  return Object.entries(query).every(([key, expected]) => {
    const actual = row[key]
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('$gte' in expected && !(actual >= expected.$gte)) return false
      if ('$lte' in expected && !(actual <= expected.$lte)) return false
      if ('$gt' in expected && !(actual > expected.$gt)) return false
      if ('$lt' in expected && !(actual < expected.$lt)) return false
      if ('$in' in expected && !expected.$in.includes(actual)) return false
      return true
    }
    return actual === expected
  })
}

function sortRows<T extends AnyRecord>(rows: T[], order?: string | null): T[] {
  if (!order) return rows
  const descending = order.startsWith('-')
  const key = descending ? order.slice(1) : order
  return [...rows].sort((left, right) => {
    const a = left[key]
    const b = right[key]
    if (a == null && b == null) return 0
    if (a == null) return 1
    if (b == null) return -1
    const result = typeof a === 'string' ? a.localeCompare(String(b)) : Number(a) - Number(b)
    return descending ? -result : result
  })
}

function mapClientStatus(data: AnyRecord): string | undefined {
  const situation = String(data.situacao_atual || data.momento || '')
  const status = String(data.status_comercial || '')
  if (data.ativo === false || data.do_not_contact === true || status === 'Perdido' || situation === 'Cadência encerrada') return 'inativo'
  if (status === 'Vendido' || situation === 'Venda realizada') return 'pos_venda'
  if (data.ativo === true || data.nome || data.telefone || data.whatsapp) return 'oportunidade'
  return undefined
}

function mapEventType(data: AnyRecord, isCreate: boolean): string {
  const situation = String(data.situacao_atual || data.momento || '')
  const status = String(data.status_comercial || '')
  if (status === 'Vendido' || situation === 'Venda realizada') return 'venda_realizada'
  if (situation.includes('Proposta')) return 'proposta_enviada'
  if (data.visita_agendada_em) return 'agendamento_criado'
  return isCreate ? 'oportunidade_registrada' : 'retorno_realizado'
}

function put(target: AnyRecord, key: string, value: unknown): void {
  if (value !== undefined) target[key] = value
}

function buildRpcPayload(data: AnyRecord, clientId?: string): AnyRecord {
  const payload: AnyRecord = {}
  const nextAction = data.proximo_passo ?? data.proxima_acao
  const nextActionDate = data.proxima_acao_data ?? data.proxima_acao_em
  const channel = data.canal_comercial ?? data.canal_entrada ?? data.canal_origem
  const clientStatus = mapClientStatus(data)

  put(payload, 'cliente_id', clientId ?? data.cliente_id)
  put(payload, 'oportunidade_id', data.oportunidade_id)
  put(payload, 'agendamento_id', data.agendamento_id)
  put(payload, 'nome', data.nome)
  put(payload, 'telefone', data.telefone ?? data.whatsapp)
  if (channel !== undefined) {
    payload.canal_origem = canalToDb(channel)
    payload.canal = canalToDb(channel)
  }
  put(payload, 'cliente_status', clientStatus)
  put(payload, 'proxima_acao', nextAction)
  if (nextActionDate !== undefined && nextActionDate !== null && nextActionDate !== '') {
    payload.proxima_acao_em = String(nextActionDate).slice(0, 10)
  }
  put(payload, 'potencial_negocio', data.valor_negociado ?? data.potencial_negocio)
  put(payload, 'observacoes', data.observacoes ?? data.origem_detalhada)
  put(payload, 'do_not_contact', data.do_not_contact)
  put(payload, 'do_not_contact_reason', data.do_not_contact_reason)
  put(payload, 'reactivation_at', data.reactivation_at)
  put(payload, 'nova_oportunidade', data.nova_oportunidade)

  put(payload, 'veiculo_interesse', data.veiculo_interesse)
  put(payload, 'valor_negociado', data.valor_negociado)
  if (data.situacao_atual !== undefined || data.momento !== undefined || data.status_comercial !== undefined) {
    payload.etapa = situationToStage(data)
  }
  put(payload, 'sinal', data.sinal)
  if (data.financiamento !== undefined) payload.financiamento = financingToDb(data.financiamento)
  if (data.carro_avaliado !== undefined) payload.carro_avaliado = data.carro_avaliado === true || data.carro_avaliado === 'Sim'
  put(payload, 'motivo_perda', data.motivo_perda)

  if (data.visita_agendada_em) {
    payload.agendamento_data_hora = data.visita_agendada_em
    payload.agendamento_tipo = 'visita'
    payload.agendamento_status = 'confirmado'
  }

  payload.registrar_interacao = Boolean(data.ultimo_contato || data.registrar_interacao)
  payload.tipo_evento = mapEventType(data, !clientId)
  payload.evento_observacao = data.evento_observacao || (clientId ? 'Carteira atualizada.' : 'Cliente incluído na carteira.')
  payload.evento_metadata = {
    origem: 'base44_1to1_adapter',
    situacao_atual: data.situacao_atual ?? data.momento ?? null,
    status_comercial: data.status_comercial ?? null,
    temperatura: data.temperatura ?? null,
    proximo_passo: nextAction ?? null,
  }

  return payload
}

async function listVisualClients(query?: AnyRecord | null, order?: string | null, limit?: number): Promise<AnyRecord[]> {
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) return []

  const { data, error } = await supabase
    .from('clientes')
    .select('*, oportunidades(*), agendamentos(*)')
    .eq('seller_user_id', userId)

  if (error) throw error

  const mapped = (data || []).map(row => mapMxClientToCarteiraVisual(row as never))
  const filtered = mapped.filter(row => matchesQuery(row, query))
  const sorted = sortRows(filtered, order)
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
}

async function getVisualClient(id: string): Promise<AnyRecord | null> {
  const list = await listVisualClients({ id }, '-updated_date', 1)
  return list[0] ?? null
}

async function saveClient(data: AnyRecord, clientId?: string): Promise<AnyRecord> {
  const key = mutationKey(clientId ? `carteira:update:${clientId}` : 'carteira:create')
  const { data: result, error } = await supabase.rpc('carteira_salvar_cliente', {
    p_payload: buildRpcPayload(data, clientId),
    p_idempotency_key: key,
  })

  if (error) throw error
  if (!result?.ok) throw new Error(result?.error || 'Não foi possível salvar o cliente.')

  if (result.evento_id && result.cliente_id) {
    pendingEvents.set(result.cliente_id, { eventId: result.evento_id, createdAt: Date.now() })
  }

  const hydrated = await getVisualClient(result.cliente_id)
  if (!hydrated) throw new Error('Cliente salvo, mas não foi possível recarregar a ficha.')
  return hydrated
}

function historyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    oportunidade_registrada: 'Oportunidade registrada',
    cliente_qualificado: 'Cliente qualificado',
    agendamento_criado: 'Agendamento criado',
    atendimento_comercial_realizado: 'Atendimento comercial',
    venda_realizada: 'Venda realizada',
    proposta_enviada: 'Proposta enviada',
    retorno_realizado: 'Resultado registrado',
    entrega_realizada: 'Entrega realizada',
    garantia_registrada: 'Garantia registrada',
    pos_venda_realizado: 'Pós-venda realizado',
  }
  return labels[type] || 'Evento comercial'
}

function mapHistory(row: AnyRecord): AnyRecord {
  const metadata = row.metadata || {}
  return {
    id: row.id,
    cliente_id: row.cliente_id,
    vendedor_id: row.seller_user_id,
    tipo: metadata.tipo || historyTypeLabel(row.tipo_evento),
    descricao: row.observacao || metadata.descricao || '',
    resultado: metadata.resultado || null,
    momento_anterior: metadata.momento_anterior || metadata.situacao_anterior || null,
    momento_novo: metadata.momento_novo || metadata.situacao_nova || null,
    missao_id: metadata.missao_id || null,
    created_date: row.data_evento || row.created_at,
    updated_date: row.data_evento || row.created_at,
  }
}

async function createHistory(data: AnyRecord): Promise<AnyRecord> {
  const pending = pendingEvents.get(data.cliente_id)
  const metadata = {
    tipo: data.tipo || null,
    descricao: data.descricao || null,
    resultado: data.resultado || null,
    momento_anterior: data.momento_anterior || null,
    momento_novo: data.momento_novo || null,
    missao_id: data.missao_id || null,
  }

  if (pending && Date.now() - pending.createdAt < 10_000) {
    const { data: updated, error } = await supabase
      .from('eventos_comerciais')
      .update({ observacao: data.descricao || data.tipo || 'Evento comercial', metadata })
      .eq('id', pending.eventId)
      .select('*')
      .single()

    pendingEvents.delete(data.cliente_id)
    if (error) throw error
    return mapHistory(updated)
  }

  const client = await getVisualClient(data.cliente_id)
  if (!client) throw new Error('Cliente não encontrado para registrar o histórico.')

  const { data: created, error } = await supabase
    .from('eventos_comerciais')
    .insert({
      cliente_id: data.cliente_id,
      oportunidade_id: client.oportunidade_id || null,
      agendamento_id: client.agendamento_id || null,
      loja_id: client.loja_id,
      seller_user_id: client.vendedor_id,
      tipo_evento: 'retorno_realizado',
      data_evento: new Date().toISOString(),
      origem_modulo: 'carteira_base44',
      observacao: data.descricao || data.tipo || 'Evento comercial',
      metadata,
      created_by: client.vendedor_id,
      idempotency_key: mutationKey(`carteira:history:${data.cliente_id}`),
    })
    .select('*')
    .single()

  if (error) throw error
  return mapHistory(created)
}

export function installCarteiraBase44Adapter(base44: Base44Facade): void {
  const facade = base44 as Base44Facade & { [INSTALLED_KEY]?: boolean }
  if (facade[INSTALLED_KEY]) return

  facade.entities.CarteiraCliente = {
    filter: listVisualClients,
    list: (order?: string, limit?: number) => listVisualClients(null, order, limit),
    get: getVisualClient,
    create: (data: AnyRecord) => saveClient(data),
    update: (id: string, data: AnyRecord) => saveClient(data, id),
  }

  facade.entities.Client = facade.entities.CarteiraCliente

  facade.entities.CarteiraHistorico = {
    filter: async (query?: AnyRecord | null, order?: string | null, limit?: number) => {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) return []

      let request = supabase
        .from('eventos_comerciais')
        .select('*')
        .eq('seller_user_id', userId)

      if (query?.cliente_id) request = request.eq('cliente_id', query.cliente_id)
      const { data, error } = await request.order('data_evento', { ascending: false }).limit(limit || 100)
      if (error) throw error
      return sortRows((data || []).map(mapHistory).filter(row => matchesQuery(row, query)), order)
    },
    create: createHistory,
  }

  facade.entities.CarteiraMissao = {
    filter: async (query?: AnyRecord | null, order?: string | null, limit?: number) => {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) return []
      const { data, error } = await supabase
        .from('carteira_missoes')
        .select('*')
        .eq('seller_user_id', userId)
        .order('iniciada_em', { ascending: false })
      if (error) throw error
      const filtered = (data || []).filter(row => matchesQuery(row, query))
      const sorted = sortRows(filtered, order)
      return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
    },
    list: (order?: string, limit?: number) => facade.entities.CarteiraMissao.filter(null, order, limit),
    create: async (data: AnyRecord) => {
      const key = mutationKey('carteira:mission')
      const { data: result, error } = await supabase.rpc('carteira_iniciar_missao', {
        p_payload: data,
        p_idempotency_key: key,
      })
      if (error) throw error
      const { data: mission, error: loadError } = await supabase
        .from('carteira_missoes')
        .select('*')
        .eq('id', result.missao_id)
        .single()
      if (loadError) throw loadError
      return mission
    },
    update: async (id: string, data: AnyRecord) => {
      const { error } = await supabase.rpc('carteira_atualizar_missao', {
        p_missao_id: id,
        p_payload: data,
      })
      if (error) throw error
      const { data: mission, error: loadError } = await supabase
        .from('carteira_missoes')
        .select('*')
        .eq('id', id)
        .single()
      if (loadError) throw loadError
      return mission
    },
  }

  facade[INSTALLED_KEY] = true
}
