import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { getSPHoursMinutes } from '@/features/checkin/hooks/useCheckinPage'
import {
  ROUTINE_OFFSET_SLOT_ORDER,
  resolveCurrentRoutineSlotKey,
  resolveRoutineOffsets,
  type DailyRoutineAutoSlotKey,
} from '@/lib/daily-routine'
import type { AgendaHojeItem } from '../lib/agenda-hoje'

export type RoutineAtalho = { label: string; type: 'route' | 'tab' | 'info'; target: string | null }

export type RoutineActivityTemplateRow = {
  tipo: DailyRoutineAutoSlotKey
  nome: string
  objetivo: string
  ordem: number
  duracao_minutos: number | null
  instrucoes: string[]
  meta_sugerida: string | null
  atalhos: RoutineAtalho[]
}

export type ProspectingScheduleRow = {
  id: string
  tipo_acao: string
  periodicidade: string | null
  quantidade: number | null
  publico: string | null
  objetivo: string | null
}

export type StoryIdeaRow = {
  titulo: string
  passos: string[]
  chamada_para_acao: string | null
}

export type RoutineSlot = {
  key: DailyRoutineAutoSlotKey
  time: string
  template: RoutineActivityTemplateRow | null
  isCurrent: boolean
}

const TIPO_ACAO_LABEL: Record<string, string> = {
  instagram_stories: 'Instagram Stories',
  status_whatsapp: 'Status WhatsApp',
  instagram_feed: 'Instagram Feed',
  instagram_reels: 'Instagram Reels',
  marketplace: 'Marketplace',
  catalogo_whatsapp: 'Catálogo WhatsApp',
  grupo_ofertas: 'Grupo de Ofertas',
  indicacao_amigos: 'Indicação de Amigos',
  indicacao_clientes: 'Indicação de Clientes',
  intermediadores: 'Intermediadores',
  parceria_consorcio: 'Parceria com Vendedores de Consórcio',
  conteudo_humanizacao: 'Conteúdo de Humanização',
}

export { TIPO_ACAO_LABEL }

function semanaDoMes(date: Date): number {
  return Math.min(4, Math.ceil(date.getDate() / 7))
}

const STATUS_TRATADO = new Set<AgendaHojeItem['compareceu']>(['Sim', 'Não'])

export function useRoutinePlaybook(input: {
  workStartTime?: string | null
  lunchEndTime?: string | null
  workEndTime?: string | null
  agendaHojeItems: AgendaHojeItem[]
}) {
  const { supabaseUser } = useAuth()
  const [templates, setTemplates] = useState<RoutineActivityTemplateRow[]>([])
  const [prospeccaoHoje, setProspeccaoHoje] = useState<ProspectingScheduleRow[]>([])
  const [storyIdeaHoje, setStoryIdeaHoje] = useState<StoryIdeaRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlaybook = useCallback(async () => {
    if (!supabaseUser) { setLoading(false); return }
    setLoading(true)
    setError(null)
    const hoje = new Date()
    const diaSemana = hoje.getDay()
    const semanaMes = semanaDoMes(hoje)

    const [templatesRes, prospeccaoRes, storyRes] = await Promise.all([
      supabase.from('routine_activity_templates').select('*').eq('ativo', true).order('ordem', { ascending: true }),
      supabase.from('prospecting_schedule').select('*').eq('ativo', true).eq('dia_semana', diaSemana),
      supabase.from('story_ideas').select('*').eq('ativo', true).eq('dia_semana', diaSemana).maybeSingle(),
    ])

    if (templatesRes.error || prospeccaoRes.error || storyRes.error) {
      setError(templatesRes.error?.message || prospeccaoRes.error?.message || storyRes.error?.message || 'Erro ao carregar rotina.')
      setLoading(false)
      return
    }

    setTemplates((templatesRes.data || []) as RoutineActivityTemplateRow[])
    setProspeccaoHoje(((prospeccaoRes.data || []) as Array<ProspectingScheduleRow & { semana_mes: number | null }>).filter(
      row => row.semana_mes === null || row.semana_mes === semanaMes,
    ))
    setStoryIdeaHoje((storyRes.data as StoryIdeaRow | null) || null)
    setLoading(false)
  }, [supabaseUser])

  useEffect(() => { fetchPlaybook() }, [fetchPlaybook])

  const schedule = useMemo(() => resolveRoutineOffsets({
    workStartTime: input.workStartTime,
    lunchEndTime: input.lunchEndTime,
    workEndTime: input.workEndTime,
  }), [input.workStartTime, input.lunchEndTime, input.workEndTime])

  const nowMinutes = useMemo(() => {
    const { hours, minutes } = getSPHoursMinutes()
    return hours * 60 + minutes
  }, [])

  const currentSlotKey = useMemo(() => resolveCurrentRoutineSlotKey(schedule, nowMinutes), [schedule, nowMinutes])

  const slots: RoutineSlot[] = useMemo(() => ROUTINE_OFFSET_SLOT_ORDER.map(key => ({
    key,
    time: schedule[key],
    template: templates.find(t => t.tipo === key) || null,
    isCurrent: key === currentSlotKey,
  })), [schedule, templates, currentSlotKey])

  const currentSlot = useMemo(() => slots.find(s => s.isCurrent) || null, [slots])

  const nextSlotStartMinutes = useMemo(() => {
    const idx = ROUTINE_OFFSET_SLOT_ORDER.indexOf(currentSlotKey)
    const nextKey = ROUTINE_OFFSET_SLOT_ORDER[idx + 1]
    if (!nextKey) return 24 * 60
    const [h, m] = schedule[nextKey].split(':').map(Number)
    return h * 60 + m
  }, [currentSlotKey, schedule])

  const currentSlotStartMinutes = useMemo(() => {
    const [h, m] = schedule[currentSlotKey].split(':').map(Number)
    return h * 60 + m
  }, [currentSlotKey, schedule])

  // Conflito (spec §5.3): cliente agendado no horário da etapa atual da rotina.
  // Só avisa — não bloqueia nem penaliza.
  const conflitoCliente = useMemo(() => {
    return input.agendaHojeItems.find((item) => {
      if (STATUS_TRATADO.has(item.compareceu)) return false
      const horario = new Date(item.horario)
      if (Number.isNaN(horario.getTime())) return false
      const { hours, minutes } = getSPHoursMinutes(horario)
      const itemMinutes = hours * 60 + minutes
      return itemMinutes >= currentSlotStartMinutes && itemMinutes < nextSlotStartMinutes
    }) || null
  }, [input.agendaHojeItems, currentSlotStartMinutes, nextSlotStartMinutes])

  return {
    slots,
    currentSlot,
    prospeccaoHoje,
    storyIdeaHoje,
    conflitoCliente,
    loading,
    error,
    refetch: fetchPlaybook,
  }
}
