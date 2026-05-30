import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface LojaOption {
  id: string
  name: string
}

/** Lojas que o usuário autenticado enxerga (RLS limita ao escopo dele). */
export function useLojasDoUsuario() {
  const [lojas, setLojas] = useState<LojaOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase.from('lojas').select('id, name').order('name')
      if (!alive) return
      if (!error && data) setLojas(data as LojaOption[])
      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  return { lojas, loading }
}
