import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { parseAtendimentos, type Atendimento, type CrmCanal } from '@/lib/schemas/crm.schema'

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Atendimentos por canal do vendedor. Usado no Fechamento Diário para registrar
 * volume de atendimento (showroom/carteira/internet) com dados reais.
 */
export function useAtendimentos() {
  const { supabaseUser, activeStoreId, storeId } = useAuth()
  const effectiveStoreId = activeStoreId || storeId || null
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAtendimentos = useCallback(async () => {
    if (!supabaseUser) { setAtendimentos([]); setLoading(false); return }
    setLoading(true); setError(null)
    const { data, error: fetchError } = await supabase
      .from('atendimentos')
      .select('*')
      .eq('seller_user_id', supabaseUser.id)
      .gte('data', today())
      .order('created_at', { ascending: false })
    if (fetchError) { setError(fetchError.message); setAtendimentos([]) }
    else setAtendimentos(parseAtendimentos(data))
    setLoading(false)
  }, [supabaseUser])

  const registrarAtendimento = useCallback(async (canal: CrmCanal, clienteId?: string | null): Promise<{ error: string | null }> => {
    if (!supabaseUser) return { error: 'Sessão inválida.' }
    if (!effectiveStoreId) return { error: 'Loja não identificada para o vendedor.' }
    const { error: insertError } = await supabase.from('atendimentos').insert({
      cliente_id: clienteId || null,
      loja_id: effectiveStoreId,
      seller_user_id: supabaseUser.id,
      data: today(),
      canal,
    })
    if (insertError) return { error: insertError.message }
    await fetchAtendimentos()
    return { error: null }
  }, [supabaseUser, effectiveStoreId, fetchAtendimentos])

  useEffect(() => { fetchAtendimentos() }, [fetchAtendimentos])

  const porCanal = useMemo(() => {
    const count = (canal: CrmCanal) => atendimentos.filter(a => a.canal === canal && a.data === today()).length
    return {
      showroom: count('showroom'),
      carteira: count('carteira'),
      internet: count('internet'),
      porta: count('porta'),
      total: atendimentos.filter(a => a.data === today()).length,
    }
  }, [atendimentos])

  return { atendimentos, porCanal, loading, error, refetch: fetchAtendimentos, registrarAtendimento }
}
