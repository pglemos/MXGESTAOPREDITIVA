import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calcularPerfil, type RespostaInput } from '../lib/perfil'

export {
  calcularPerfil,
  dimensoesDe,
  perfilEntries,
  type RespostaInput,
  type Questao,
  type QuestaoInsert,
  type BancoTalento,
  type BancoTalentoInsert,
} from '../lib/perfil'

import type { Questao, QuestaoInsert, BancoTalento, BancoTalentoInsert } from '../lib/perfil'

/** Catálogo de questões + cadastro. */
export function useQuestoes() {
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('comportamental_questoes')
      .select('*')
      .eq('ativo', true)
      .order('ordem')
    if (!error && data) setQuestoes(data as Questao[])
    setLoading(false)
  }, [])

  useEffect(() => { void reload() }, [reload])

  const adicionarQuestao = useCallback(async (input: QuestaoInsert) => {
    const { error } = await supabase.from('comportamental_questoes').insert(input)
    if (error) return { error: error.message }
    await reload()
    return { error: null }
  }, [reload])

  return { questoes, loading, reload, adicionarQuestao }
}

/** Aplica o teste para o usuário autenticado (onboarding): sessão + respostas + perfil. */
export async function aplicarTeste(respostas: RespostaInput[]): Promise<{ error: string | null }> {
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  const uid = userData?.user?.id
  if (userErr || !uid) return { error: 'Sessão inválida. Faça login novamente.' }

  const { data: sessao, error: sErr } = await supabase
    .from('comportamental_sessoes')
    .insert({ usuario_id: uid, status: 'concluido', iniciado_em: new Date().toISOString(), concluido_em: new Date().toISOString() })
    .select('id')
    .single()
  if (sErr || !sessao) return { error: sErr?.message ?? 'Falha ao criar sessão.' }

  const rows = respostas.map(r => ({ sessao_id: sessao.id, questao_id: r.questaoId, valor: r.valor }))
  const { error: rErr } = await supabase.from('comportamental_respostas').insert(rows)
  if (rErr) return { error: rErr.message }

  const perfil = calcularPerfil(respostas)
  const { error: pErr } = await supabase
    .from('comportamental_perfis')
    .upsert({ usuario_id: uid, sessao_id: sessao.id, perfil }, { onConflict: 'usuario_id' })
  if (pErr) return { error: pErr.message }

  return { error: null }
}

/** Banco de talentos (perfis vencedores agregados) + cadastro. */
export function useBancoTalentos() {
  const [talentos, setTalentos] = useState<BancoTalento[]>([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('banco_talentos')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setTalentos(data as BancoTalento[])
    setLoading(false)
  }, [])

  useEffect(() => { void reload() }, [reload])

  const adicionarTalento = useCallback(async (input: BancoTalentoInsert) => {
    const { error } = await supabase.from('banco_talentos').insert(input)
    if (error) return { error: error.message }
    await reload()
    return { error: null }
  }, [reload])

  return { talentos, loading, reload, adicionarTalento }
}
