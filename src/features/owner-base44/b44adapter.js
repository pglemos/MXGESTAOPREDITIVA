// Adapter mínimo que substitui o SDK @base44/sdk nos componentes portados do export.
// Entidades com efeito real são mapeadas para o Supabase do MX; o restante vira no-op
// seguro (retorna listas vazias) para código legado do export que não é exercitado na UI.
import { supabase } from '@/lib/supabase'

async function resolveFallbackStoreId() {
  const { data } = await supabase
    .from('lojas')
    .select('id')
    .eq('active', true)
    .order('name')
    .limit(1)
  return data?.[0]?.id || null
}

const ConsultantRequest = {
  async create(payload) {
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth?.user?.id || payload.created_by || null
    const storeId = payload.unit_id || (await resolveFallbackStoreId())
    if (!storeId || !userId) throw new Error('Loja ou usuário não identificados')

    const { data, error } = await supabase
      .from('solicitacoes_consultoria')
      .insert({
        store_id: storeId,
        created_by: userId,
        request_type: payload.request_type || 'question',
        subject: payload.subject || '',
        message: payload.message || '',
        priority: payload.priority || 'medium',
        context_type: payload.context_type || 'general',
        context_id: payload.context_id || null,
        context_snapshot: payload.context_snapshot
          ? { snapshot: payload.context_snapshot }
          : null,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },
  async filter() {
    return []
  },
}

const noopEntity = {
  async filter() {
    return []
  },
  async list() {
    return []
  },
  async get() {
    return null
  },
  async create(payload) {
    return { id: `local-${Date.now()}`, ...payload }
  },
  async update(id, payload) {
    return { id, ...payload }
  },
  async delete() {
    return null
  },
}

const entities = new Proxy(
  { ConsultantRequest },
  {
    get(target, prop) {
      return target[prop] || noopEntity
    },
  },
)

export const base44 = {
  entities,
  asServiceRole: { entities },
}
