import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  parseClientes,
  toDateOnlyBR,
  type Cliente,
  type CrmCanal,
  type CrmClienteStatus,
  type CrmRelacionamento,
} from '@/lib/schemas/crm.schema'
import { resolverPrimeiraAcaoCadencia, type CadenciaResultadoAcao } from '@/features/crm/lib/cadencia'

export type ClienteInput = {
  nome: string
  telefone?: string | null
  empresa?: string | null
  canal_origem?: CrmCanal | null
  status?: CrmClienteStatus
  relacionamento?: CrmRelacionamento
  proxima_acao?: string | null
  proxima_acao_em?: string | null
  potencial_negocio?: number
  observacoes?: string | null
}

export function buildClientePayload(
  input: ClienteInput,
  context: { lojaId: string; sellerUserId: string },
  now: Date = new Date(),
) {
  const proximaAcaoManual = input.proxima_acao?.trim() || null
  const acaoInicialCadencia = resolverPrimeiraAcaoCadencia(input.canal_origem, now)
  return {
    loja_id: context.lojaId,
    seller_user_id: context.sellerUserId,
    nome: input.nome.trim(),
    telefone: input.telefone?.trim() || null,
    empresa: input.empresa?.trim() || null,
    canal_origem: input.canal_origem || null,
    status: input.status || 'aguardando_contato',
    relacionamento: input.relacionamento || 'neutro',
    proxima_acao: proximaAcaoManual || acaoInicialCadencia.proximaAcao,
    proxima_acao_em: input.proxima_acao_em || (!proximaAcaoManual ? acaoInicialCadencia.proximaAcaoEm : null),
    potencial_negocio: input.potencial_negocio ?? 0,
    observacoes: input.observacoes?.trim() || null,
    ultima_interacao: toDateOnlyBR(now),
  }
}

/**
 * Carteira de clientes do vendedor logado. Escopo garantido pela RLS
 * (seller_user_id = auth.uid()); o filtro aqui é defensivo/explicito.
 */
export function useClientes() {
  const { supabaseUser, activeStoreId, storeId } = useAuth()
  const effectiveStoreId = activeStoreId || storeId || null
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClientes = useCallback(async () => {
    if (!supabaseUser) {
      setClientes([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('clientes')
      .select('*')
      .eq('seller_user_id', supabaseUser.id)
      .order('updated_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setClientes([])
    } else {
      setClientes(parseClientes(data))
    }
    setLoading(false)
  }, [supabaseUser])

  const createCliente = useCallback(async (input: ClienteInput): Promise<{ error: string | null; id?: string }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    if (!effectiveStoreId) return { error: 'Loja não identificada para o vendedor.' }
    if (!input.nome?.trim()) return { error: 'Nome do cliente é obrigatório.' }

    const payload = buildClientePayload(input, { lojaId: effectiveStoreId, sellerUserId: supabaseUser.id })

    const { data, error: insertError } = await supabase
      .from('clientes')
      .insert(payload)
      .select('id')
      .single()

    if (insertError) return { error: insertError.message }
    if (data?.id) {
      await supabase.rpc('inicializar_cadencia_cliente', { p_cliente_id: data.id })
    }
    await fetchClientes()
    return { error: null, id: data?.id }
  }, [supabaseUser, effectiveStoreId, fetchClientes])

  const updateCliente = useCallback(async (id: string, patch: Partial<ClienteInput>): Promise<{ error: string | null }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    const { error: updateError } = await supabase
      .from('clientes')
      .update({ ...patch, ultima_interacao: toDateOnlyBR() })
      .eq('id', id)
    if (updateError) return { error: updateError.message }
    await fetchClientes()
    return { error: null }
  }, [supabaseUser, fetchClientes])

  const deleteCliente = useCallback(async (id: string): Promise<{ error: string | null }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    const { error: deleteError } = await supabase.from('clientes').delete().eq('id', id)
    if (deleteError) return { error: deleteError.message }
    await fetchClientes()
    return { error: null }
  }, [supabaseUser, fetchClientes])

  const registrarStatusCadencia = useCallback(async (input: {
    clienteId: string
    status: CadenciaResultadoAcao
    observacao?: string | null
  }): Promise<{ error: string | null }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    const { error: rpcError } = await supabase.rpc('registrar_status_acao_cadencia', {
      p_cliente_id: input.clienteId,
      p_status: input.status,
      p_observacao: input.observacao?.trim() || null,
    })
    if (rpcError) return { error: rpcError.message }
    await fetchClientes()
    return { error: null }
  }, [supabaseUser, fetchClientes])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  const metrics = useMemo(() => {
    const total = clientes.length
    const ativos = clientes.filter(c => c.status === 'ativo').length
    const oportunidades = clientes.filter(c => c.status === 'oportunidade').length
    const posVenda = clientes.filter(c => c.status === 'pos_venda').length
    const aguardando = clientes.filter(c => c.status === 'aguardando_contato').length
    const inativos = clientes.filter(c => c.status === 'inativo').length
    const potencialTotal = clientes.reduce((acc, c) => acc + (c.potencial_negocio || 0), 0)
    return { total, ativos, oportunidades, posVenda, aguardando, inativos, potencialTotal }
  }, [clientes])

  return { clientes, metrics, loading, error, refetch: fetchClientes, createCliente, updateCliente, deleteCliente, registrarStatusCadencia }
}
