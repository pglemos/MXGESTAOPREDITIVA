import { supabase } from '@/lib/supabase'
import {
  canalToDb,
  financingToDb,
  mapMxClientToCarteiraVisual,
  situationToStage,
} from './carteira-mappers'
import { carteiraMutationCoordinator } from './carteira-mutation-coordinator'

const INSTALLED_KEY = '__mxCarteiraBase44AdapterInstalled'
const missionCache = new Map()

// Cacheado em vez de chamar supabase.auth.getUser() a cada operação: fazer
// isso logo após um supabase.rpc() (ex.: saveClient -> getVisualClient) faz o
// getUser() travar indefinidamente — a chamada RPC e o getUser() disputam o
// mesmo lock interno de sessão do supabase-js quando encadeados na mesma
// tick. useExecutionActions (Central de Execução) evita o problema lendo o
// id do usuário já resolvido via useAuth(); este módulo roda fora de
// componentes React (instalado uma vez no import), então cacheamos aqui.
let cachedUserIdPromise = null

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
    cachedUserIdPromise = null
  }
})

function getCurrentUserId() {
  if (!cachedUserIdPromise) {
    cachedUserIdPromise = supabase.auth.getUser().then(({ data }) => data.user?.id ?? null)
  }
  return cachedUserIdPromise
}

function yieldSupabaseClient() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

function matchesQuery(row, query) {
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

function sortRows(rows, order) {
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

function mapClientStatus(data) {
  const situation = String(data.situacao_atual || data.momento || '')
  const status = String(data.status_comercial || '')
  if (data.ativo === false || data.do_not_contact === true || status === 'Perdido' || situation === 'Cadência encerrada') return 'inativo'
  if (status === 'Vendido' || situation === 'Venda realizada') return 'pos_venda'
  if (data.ativo === true || data.nome || data.telefone || data.whatsapp) return 'oportunidade'
  return undefined
}

function mapEventType(data, isCreate) {
  const situation = String(data.situacao_atual || data.momento || '')
  const status = String(data.status_comercial || '')
  if (status === 'Vendido' || situation === 'Venda realizada') return 'venda_realizada'
  if (situation.includes('Proposta')) return 'proposta_enviada'
  if (data.visita_agendada_em) return 'agendamento_criado'
  return isCreate ? 'oportunidade_registrada' : 'retorno_realizado'
}

function put(target, key, value) {
  if (value !== undefined) target[key] = value
}

function buildRpcPayload(data, clientId) {
  const payload = {}
  const history = data.historico || null
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

  payload.registrar_interacao = Boolean(data.ultimo_contato || data.registrar_interacao || history)
  payload.tipo_evento = mapEventType(data, !clientId)
  payload.evento_observacao = history?.descricao || data.evento_observacao || (clientId ? 'Carteira atualizada.' : 'Cliente incluído na carteira.')
  payload.evento_metadata = {
    origem: 'base44_1to1_adapter',
    situacao_atual: data.situacao_atual ?? data.momento ?? null,
    status_comercial: data.status_comercial ?? null,
    temperatura: data.temperatura ?? null,
    proximo_passo: nextAction ?? null,
    ...(history ? {
      tipo: history.tipo || null,
      descricao: history.descricao || null,
      resultado: history.resultado || null,
      momento_anterior: history.momento_anterior || null,
      momento_novo: history.momento_novo || null,
      missao_id: history.missao_id || null,
    } : {}),
  }

  return payload
}

async function listVisualClients(query, order, limit) {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const { data, error } = await supabase
    .from('clientes')
    .select('*, oportunidades(*), agendamentos(*)')
    .eq('seller_user_id', userId)

  if (error) throw error

  const mapped = (data || []).map(row => mapMxClientToCarteiraVisual(row))
  const filtered = mapped.filter(row => matchesQuery(row, query))
  const sorted = sortRows(filtered, order)
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
}

async function getVisualClient(id) {
  const list = await listVisualClients({ id }, '-updated_date', 1)
  return list[0] ?? null
}

async function saveClient(data, clientId) {
  const scope = clientId ? `carteira:update:${clientId}` : 'carteira:create'
  const payload = buildRpcPayload(data, clientId)
  return carteiraMutationCoordinator.run(scope, payload, async key => {
    const { data: result, error } = await supabase.rpc('carteira_salvar_cliente_v2', {
      p_payload: payload,
      p_idempotency_key: key,
    })

    if (error) throw error
    if (!result?.ok) throw new Error(result?.error || 'Não foi possível salvar o cliente.')

    // Evita contenção do lock interno de sessão do supabase-js entre RPC e
    // a leitura de hidratação executada imediatamente depois.
    await yieldSupabaseClient()

    const hydrated = await getVisualClient(result.cliente_id)
    if (!hydrated) throw new Error('Cliente salvo, mas não foi possível recarregar a ficha.')
    return hydrated
  })
}

function historyTypeLabel(type) {
  const labels = {
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

function mapHistory(row) {
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

async function createHistory(data) {
  // Compatibilidade para históricos independentes. Mutações de cliente que
  // também registram histórico usam `historico` no mesmo RPC transacional.
  return carteiraMutationCoordinator.run(`carteira:history:${data.cliente_id}`, data, async key => {
    await yieldSupabaseClient()

    const metadata = {
      tipo: data.tipo || null,
      descricao: data.descricao || null,
      resultado: data.resultado || null,
      momento_anterior: data.momento_anterior || null,
      momento_novo: data.momento_novo || null,
      missao_id: data.missao_id || null,
    }

    const client = await getVisualClient(data.cliente_id)
    if (!client) throw new Error('Cliente não encontrado para registrar o histórico.')

    const eventPayload = {
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
      idempotency_key: key,
    }
    const { data: inserted, error } = await supabase
      .from('eventos_comerciais')
      .upsert(eventPayload, { onConflict: 'idempotency_key', ignoreDuplicates: true })
      .select('*')
      .maybeSingle()

    if (error) throw error
    let created = inserted
    if (!created) {
      const { data: existing, error: existingError } = await supabase
        .from('eventos_comerciais')
        .select('*')
        .eq('idempotency_key', key)
        .single()
      if (existingError) throw existingError
      created = existing
    }
    return mapHistory(created)
  })
}

async function getSellerStoreContext() {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const { data, error } = await supabase
    .from('vinculos_loja')
    .select('store_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('role', ['vendedor', 'seller'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.store_id ? { userId, storeId: data.store_id } : null
}

async function listArrivedVehicles(query, order, limit) {
  const context = await getSellerStoreContext()
  if (!context) return []

  const { data, error } = await supabase
    .from('veiculos_estoque')
    .select('*')
    .eq('loja_id', context.storeId)

  if (error) throw error
  const mapped = (data || []).map(row => ({
    ...row,
    vendedor_id: row.created_by,
    ativo: row.status !== 'vendido',
  }))
  const filtered = mapped.filter(row => matchesQuery(row, query))
  const sorted = sortRows(filtered, order)
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
}

async function createArrivedVehicle(data) {
  const context = await getSellerStoreContext()
  if (!context) throw new Error('Vendedor sem vínculo ativo com loja.')

  const price = data.preco === undefined || data.preco === null || data.preco === ''
    ? null
    : Number(data.preco)
  if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error('Preço do veículo inválido.')

  const payload = {
    loja_id: context.storeId,
    created_by: context.userId,
    marca: data.marca,
    modelo: data.modelo,
    versao: data.versao || null,
    ano: data.ano || null,
    preco: price,
    data_entrada: data.data_entrada || new Date().toISOString().slice(0, 10),
    observacao: data.observacao || null,
    status: 'disponivel',
  }

  return carteiraMutationCoordinator.run('carteira:vehicle:create', payload, async key => {
    const { data: created, error } = await supabase
      .from('veiculos_estoque')
      .upsert({ ...payload, idempotency_key: key }, { onConflict: 'created_by,idempotency_key' })
      .select('*')
      .single()

    if (error) throw error
    return { ...created, vendedor_id: created.created_by, ativo: true }
  })
}

async function loadMission(id) {
  await yieldSupabaseClient()
  const { data: mission, error } = await supabase
    .from('carteira_missoes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  missionCache.set(mission.id, mission)
  return mission
}

export function installCarteiraBase44Adapter(base44) {
  if (base44[INSTALLED_KEY]) return

  base44.entities.CarteiraCliente = {
    filter: listVisualClients,
    list: (order, limit) => listVisualClients(null, order, limit),
    get: getVisualClient,
    create: data => saveClient(data),
    update: (id, data) => saveClient(data, id),
  }

  base44.entities.Client = base44.entities.CarteiraCliente

  base44.entities.CarteiraHistorico = {
    filter: async (query, order, limit) => {
      const userId = await getCurrentUserId()
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

  base44.entities.CarteiraMissao = {
    filter: async (query, order, limit) => {
      const userId = await getCurrentUserId()
      if (!userId) return []
      const { data, error } = await supabase
        .from('carteira_missoes')
        .select('*')
        .eq('seller_user_id', userId)
        .order('iniciada_em', { ascending: false })
      if (error) throw error
      for (const mission of data || []) missionCache.set(mission.id, mission)
      const filtered = (data || []).filter(row => matchesQuery(row, query))
      const sorted = sortRows(filtered, order)
      return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
    },
    list: (order, limit) => base44.entities.CarteiraMissao.filter(null, order, limit),
    create: async data => {
      return carteiraMutationCoordinator.run('carteira:mission:start', data, async key => {
        const { data: result, error } = await supabase.rpc('carteira_iniciar_missao_v2', {
          p_payload: data,
          p_idempotency_key: key,
        })
        if (error) throw error
        return loadMission(result.missao_id)
      })
    },
    update: async (id, data) => {
      const cached = missionCache.get(id) || await loadMission(id)
      const payload = {
        ...data,
        expected_revision: data.expected_revision ?? cached.revision,
      }
      return carteiraMutationCoordinator.run(`carteira:mission:update:${id}`, payload, async key => {
        const { error } = await supabase.rpc('carteira_atualizar_missao_v2', {
          p_missao_id: id,
          p_payload: payload,
          p_idempotency_key: key,
        })
        if (error) throw error
        return loadMission(id)
      })
    },
  }

  base44.entities.VeiculoChegado = {
    filter: listArrivedVehicles,
    list: (order, limit) => listArrivedVehicles(null, order, limit),
    create: createArrivedVehicle,
  }

  base44[INSTALLED_KEY] = true
}
