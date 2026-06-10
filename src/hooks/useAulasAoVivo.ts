import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

/**
 * Aulas ao Vivo (Treinamentos §11): agenda, gravações e presença validada
 * por prova (correção server-side via RPC submeter_prova_aula — o gabarito
 * nunca chega ao cliente).
 */

const AulaSchema = z.object({
  id: z.string(),
  loja_id: z.string().nullable(),
  titulo: z.string(),
  descricao: z.string().nullable(),
  instrutor: z.string().nullable(),
  inicio: z.string(),
  duracao_minutos: z.number(),
  link_transmissao: z.string().nullable(),
  gravacao_url: z.string().nullable(),
  status: z.enum(['agendada', 'ao_vivo', 'encerrada', 'cancelada']),
})
export type AulaAoVivo = z.infer<typeof AulaSchema>

const PresencaSchema = z.object({
  id: z.string(),
  aula_id: z.string(),
  nota: z.number().nullable(),
  aprovado: z.boolean(),
  pontos: z.number(),
  created_at: z.string(),
})
export type AulaPresenca = z.infer<typeof PresencaSchema>

const ProvaSchema = z.object({
  nota_minima: z.number(),
  pontos_score: z.number(),
  questoes: z.array(z.object({
    pergunta: z.string(),
    opcoes: z.array(z.string()),
  })),
})
export type ProvaAula = z.infer<typeof ProvaSchema>

const parseArray = <T,>(schema: z.ZodType<T>, data: unknown): T[] => {
  if (!Array.isArray(data)) return []
  const out: T[] = []
  for (const row of data) {
    const r = schema.safeParse(row)
    if (r.success) out.push(r.data)
  }
  return out
}

export function useAulasAoVivo() {
  const { supabaseUser } = useAuth()
  const [aulas, setAulas] = useState<AulaAoVivo[]>([])
  const [presencas, setPresencas] = useState<AulaPresenca[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!supabaseUser) {
      setAulas([])
      setPresencas([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const [aulasRes, presencasRes] = await Promise.all([
      supabase.from('aulas_ao_vivo').select('*').neq('status', 'cancelada').order('inicio', { ascending: true }),
      supabase.from('aula_presencas').select('id, aula_id, nota, aprovado, pontos, created_at').eq('user_id', supabaseUser.id),
    ])
    if (aulasRes.error) {
      setError(aulasRes.error.message)
      setAulas([])
    } else {
      setAulas(parseArray(AulaSchema, aulasRes.data))
    }
    if (!presencasRes.error) setPresencas(parseArray(PresencaSchema, presencasRes.data))
    setLoading(false)
  }, [supabaseUser])

  useEffect(() => { fetchAll() }, [fetchAll])

  const getProva = useCallback(async (aulaId: string): Promise<{ prova: ProvaAula | null; error: string | null }> => {
    const { data, error: rpcError } = await supabase.rpc('get_prova_aula', { p_aula_id: aulaId })
    if (rpcError) return { prova: null, error: rpcError.message }
    if (!data) return { prova: null, error: 'Esta aula ainda não tem prova cadastrada.' }
    const parsed = ProvaSchema.safeParse(data)
    if (!parsed.success) return { prova: null, error: 'Prova em formato inválido.' }
    return { prova: parsed.data, error: null }
  }, [])

  const submeterProva = useCallback(async (
    aulaId: string,
    respostas: number[],
  ): Promise<{ resultado: { nota: number; aprovado: boolean; pontos: number } | null; error: string | null }> => {
    const { data, error: rpcError } = await supabase.rpc('submeter_prova_aula', { p_aula_id: aulaId, p_respostas: respostas })
    if (rpcError) return { resultado: null, error: rpcError.message }
    const parsed = z.object({ nota: z.number(), aprovado: z.boolean(), pontos: z.number() }).safeParse(data)
    if (!parsed.success) return { resultado: null, error: 'Resposta inesperada do servidor.' }
    await fetchAll()
    return { resultado: parsed.data, error: null }
  }, [fetchAll])

  const presencaPorAula = useMemo(() => {
    const map = new Map<string, AulaPresenca>()
    for (const p of presencas) map.set(p.aula_id, p)
    return map
  }, [presencas])

  const derived = useMemo(() => {
    const agora = new Date()
    const futuras = aulas.filter(a => (a.status === 'agendada' || a.status === 'ao_vivo') && new Date(a.inicio).getTime() + a.duracao_minutos * 60000 >= agora.getTime())
    const proximaAula = futuras[0] || null
    const gravacoes = aulas
      .filter(a => a.gravacao_url && (a.status === 'encerrada' || new Date(a.inicio) < agora))
      .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())

    const validadas = presencas.filter(p => p.aprovado)
    const comNota = presencas.filter(p => p.nota !== null)
    const indicadores = {
      presencasValidadas: validadas.length,
      mediaProvas: comNota.length > 0 ? Math.round(comNota.reduce((acc, p) => acc + (p.nota || 0), 0) / comNota.length) : null,
      pontos: presencas.reduce((acc, p) => acc + p.pontos, 0),
    }
    return { proximaAula, futuras, gravacoes, indicadores }
  }, [aulas, presencas])

  return { aulas, presencas, presencaPorAula, ...derived, loading, error, refetch: fetchAll, getProva, submeterProva }
}
