import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isAdministradorMx, useAuth } from '@/hooks/useAuth'
import { AGENDA_TARGET_OPTIONS, VISIT_REASON_OPTIONS } from '@/features/agenda/constants'

export type AgendaOptionKind = 'visit_reason' | 'target_audience'
export type AgendaOptionStatus = 'ativo' | 'arquivado'

export type AgendaOption = {
  id: string
  kind: AgendaOptionKind
  label: string
  status: AgendaOptionStatus
  sort_order: number
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export type AgendaOptionInput = {
  kind: AgendaOptionKind
  label: string
  status?: AgendaOptionStatus
  sort_order?: number
}

const DEFAULT_OPTIONS: Record<AgendaOptionKind, readonly string[]> = {
  visit_reason: VISIT_REASON_OPTIONS,
  target_audience: AGENDA_TARGET_OPTIONS,
}

function normalizeOption(option: Partial<AgendaOption>): AgendaOption {
  return {
    id: option.id || `${option.kind}:${option.label}`,
    kind: option.kind || 'visit_reason',
    label: String(option.label || '').trim(),
    status: option.status || 'ativo',
    sort_order: Number(option.sort_order ?? 0),
    created_by: option.created_by ?? null,
    created_at: option.created_at,
    updated_at: option.updated_at,
  }
}

function sortOptions(options: AgendaOption[]) {
  return [...options].sort((a, b) => {
    const order = (a.sort_order ?? 0) - (b.sort_order ?? 0)
    if (order !== 0) return order
    return a.label.localeCompare(b.label, 'pt-BR')
  })
}

function fallbackRows() {
  return (Object.entries(DEFAULT_OPTIONS) as Array<[AgendaOptionKind, readonly string[]]>)
    .flatMap(([kind, labels]) => labels.map((label, index): AgendaOption => ({
      id: `fallback:${kind}:${label}`,
      kind,
      label,
      status: 'ativo',
      sort_order: (index + 1) * 10,
    })))
}

export function mergeAgendaOptionLabels(baseLabels: string[], ...currentValues: Array<string | null | undefined>) {
  const labels = new Set(baseLabels.filter(Boolean))
  for (const value of currentValues) {
    const trimmed = value?.trim()
    if (trimmed) labels.add(trimmed)
  }
  return Array.from(labels).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function useAgendaOptions() {
  const { role, supabaseUser } = useAuth()
  const canManage = isAdministradorMx(role)
  const [options, setOptions] = useState<AgendaOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('opcoes_agenda_consultoria')
      .select('id, kind, label, status, sort_order, created_by, created_at, updated_at')
      .order('sort_order', { ascending: true })
      .order('label', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setOptions(fallbackRows())
      setLoading(false)
      return
    }

    const rows = ((data || []) as Partial<AgendaOption>[])
      .map(normalizeOption)
      .filter((option) => option.label)

    setOptions(rows.length ? sortOptions(rows) : fallbackRows())
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchOptions()
  }, [fetchOptions])

  const activeOptions = useMemo(
    () => sortOptions(options.filter((option) => option.status === 'ativo')),
    [options],
  )

  const visitReasonOptions = useMemo(
    () => activeOptions.filter((option) => option.kind === 'visit_reason').map((option) => option.label),
    [activeOptions],
  )

  const targetAudienceOptions = useMemo(
    () => activeOptions.filter((option) => option.kind === 'target_audience').map((option) => option.label),
    [activeOptions],
  )

  const createOption = useCallback(async (input: AgendaOptionInput) => {
    if (!canManage || !supabaseUser) return { error: 'Apenas Administrador MX e Admin Master podem gerenciar assuntos da agenda.' }
    const label = input.label.trim()
    if (!label) return { error: 'Informe o nome da opção.' }

    const { error: insertError } = await supabase.from('opcoes_agenda_consultoria').insert({
      kind: input.kind,
      label,
      status: input.status || 'ativo',
      sort_order: input.sort_order ?? 0,
      created_by: supabaseUser.id,
    })
    if (insertError) return { error: insertError.message }
    await fetchOptions()
    return { error: null }
  }, [canManage, fetchOptions, supabaseUser])

  const updateOption = useCallback(async (id: string, input: AgendaOptionInput) => {
    if (!canManage) return { error: 'Apenas Administrador MX e Admin Master podem gerenciar assuntos da agenda.' }
    const label = input.label.trim()
    if (!label) return { error: 'Informe o nome da opção.' }

    const { error: updateError } = await supabase
      .from('opcoes_agenda_consultoria')
      .update({
        kind: input.kind,
        label,
        status: input.status || 'ativo',
        sort_order: input.sort_order ?? 0,
      })
      .eq('id', id)

    if (updateError) return { error: updateError.message }
    await fetchOptions()
    return { error: null }
  }, [canManage, fetchOptions])

  const archiveOption = useCallback(async (id: string) => {
    if (!canManage) return { error: 'Apenas Administrador MX e Admin Master podem gerenciar assuntos da agenda.' }
    const { error: updateError } = await supabase
      .from('opcoes_agenda_consultoria')
      .update({ status: 'arquivado' satisfies AgendaOptionStatus })
      .eq('id', id)

    if (updateError) return { error: updateError.message }
    await fetchOptions()
    return { error: null }
  }, [canManage, fetchOptions])

  const deleteOption = useCallback(async (id: string) => {
    if (!canManage) return { error: 'Apenas Administrador MX e Admin Master podem gerenciar assuntos da agenda.' }
    const { error: deleteError } = await supabase
      .from('opcoes_agenda_consultoria')
      .delete()
      .eq('id', id)

    if (deleteError) return { error: deleteError.message }
    await fetchOptions()
    return { error: null }
  }, [canManage, fetchOptions])

  return {
    options,
    activeOptions,
    visitReasonOptions,
    targetAudienceOptions,
    loading,
    error,
    canManage,
    refetch: fetchOptions,
    createOption,
    updateOption,
    archiveOption,
    deleteOption,
  }
}
