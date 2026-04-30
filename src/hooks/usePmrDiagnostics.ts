import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  parsePmrFormResponseArray,
  parsePmrFormTemplateArray,
  type PmrFormResponse,
  type PmrFormTemplate,
} from '@/lib/schemas/consulting-client.schema'

export function usePmrDiagnostics(clientId?: string) {
  const { profile } = useAuth()
  const [templates, setTemplates] = useState<PmrFormTemplate[]>([])
  const [responses, setResponses] = useState<PmrFormResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDiagnostics = useCallback(async () => {
    if (!clientId) {
      setTemplates([])
      setResponses([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const [templatesRes, responsesRes] = await Promise.all([
      supabase
        .from('modelos_formulario_pmr')
        .select('*')
        .eq('active', true)
        .order('form_key', { ascending: true }),
      supabase
        .from('respostas_formulario_pmr')
        .select('*, template:modelos_formulario_pmr(*)')
        .eq('client_id', clientId)
        .order('submitted_at', { ascending: false }),
    ])

    const fetchError = templatesRes.error || responsesRes.error
    if (fetchError) {
      setError(fetchError.message)
      setTemplates([])
      setResponses([])
    } else {
      setTemplates(parsePmrFormTemplateArray(templatesRes.data || []))
      setResponses(parsePmrFormResponseArray(responsesRes.data || []))
    }
    setLoading(false)
  }, [clientId])

  const saveResponse = useCallback(async (input: {
    template_id: string
    visit_id?: string | null
    respondent_name?: string
    respondent_role?: string
    answers: Record<string, unknown>
    summary?: string
  }) => {
    if (!clientId) return { error: 'Cliente nao informado.' }
    const { error: insertError } = await supabase.from('respostas_formulario_pmr').insert({
      client_id: clientId,
      visit_id: input.visit_id || null,
      template_id: input.template_id,
      respondent_name: input.respondent_name?.trim() || null,
      respondent_role: input.respondent_role?.trim() || null,
      answers: input.answers,
      summary: input.summary?.trim() || null,
      submitted_by: profile?.id || null,
    })

    if (insertError) return { error: insertError.message }
    await fetchDiagnostics()
    return { error: null }
  }, [clientId, fetchDiagnostics, profile?.id])

  useEffect(() => {
    fetchDiagnostics()
  }, [fetchDiagnostics])

  const responsesByTemplate = useMemo(() => {
    const map = new Map<string, PmrFormResponse[]>()
    for (const response of responses) {
      const list = map.get(response.template_id) || []
      list.push(response)
      map.set(response.template_id, list)
    }
    return map
  }, [responses])

  return { templates, responses, responsesByTemplate, loading, error, saveResponse, refetch: fetchDiagnostics }
}

