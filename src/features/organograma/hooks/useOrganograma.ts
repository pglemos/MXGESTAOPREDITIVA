import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { buildTree } from '../lib/tree'
import type { OrganogramaNo, OrganogramaNoInsert, CarreiraNivel, CarreiraNivelInsert } from '../lib/tree'

export { buildTree } from '../lib/tree'
export type { OrganogramaNo, OrganogramaNoInsert, CarreiraNivel, CarreiraNivelInsert, OrgNode } from '../lib/tree'

export function useOrganograma(lojaId: string | null) {
  const [nos, setNos] = useState<OrganogramaNo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!lojaId) { setNos([]); return }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('organograma_nos')
      .select('*')
      .eq('loja_id', lojaId)
      .order('ordem')
    if (error) setError(error.message)
    else setNos((data ?? []) as OrganogramaNo[])
    setLoading(false)
  }, [lojaId])

  useEffect(() => { void reload() }, [reload])

  const adicionarNo = useCallback(async (input: OrganogramaNoInsert) => {
    const { error } = await supabase.from('organograma_nos').insert(input)
    if (error) return { error: error.message }
    await reload()
    return { error: null }
  }, [reload])

  const removerNo = useCallback(async (id: string) => {
    const { error } = await supabase.from('organograma_nos').delete().eq('id', id)
    if (error) return { error: error.message }
    await reload()
    return { error: null }
  }, [reload])

  const tree = useMemo(() => buildTree(nos), [nos])

  return { nos, tree, loading, error, reload, adicionarNo, removerNo }
}

/** Trilha de carreira agrupada por cargo. */
export function useCarreira() {
  const [niveis, setNiveis] = useState<CarreiraNivel[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('carreira_niveis')
      .select('*')
      .order('cargo')
      .order('nivel')
    if (!error && data) setNiveis(data as CarreiraNivel[])
    setLoading(false)
  }, [])

  useEffect(() => { void reload() }, [reload])

  const adicionarNivel = useCallback(async (input: CarreiraNivelInsert) => {
    const { error } = await supabase
      .from('carreira_niveis')
      .upsert(input, { onConflict: 'cargo,nivel' })
    if (error) return { error: error.message }
    await reload()
    return { error: null }
  }, [reload])

  const porCargo = useMemo(() => {
    const m = new Map<string, CarreiraNivel[]>()
    for (const n of niveis) {
      const arr = m.get(n.cargo) ?? []
      arr.push(n)
      m.set(n.cargo, arr)
    }
    return m
  }, [niveis])

  return { niveis, porCargo, loading, reload, adicionarNivel }
}
