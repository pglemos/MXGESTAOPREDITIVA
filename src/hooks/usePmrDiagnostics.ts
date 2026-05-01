import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  parsePmrFormResponseArray,
  parsePmrFormTemplateArray,
  type PmrFormResponse,
  type PmrFormTemplate,
} from '@/lib/schemas/consulting-client.schema'

const CANONICAL_FORM_ORDER = ['dono', 'gerente', 'processo', 'vendedor']

const FORM_KEY_ALIASES: Record<string, string> = {
  owner: 'dono',
  proprietario: 'dono',
  socio: 'dono',
  socios: 'dono',
  manager: 'gerente',
  process: 'processo',
  processos: 'processo',
  seller: 'vendedor',
  vendedores: 'vendedor',
}

export function getCanonicalPmrFormKey(value?: string | null) {
  const normalized = (value || '').trim().toLowerCase()
  return FORM_KEY_ALIASES[normalized] || normalized
}

function templatePriority(template: PmrFormTemplate) {
  const canonicalKey = getCanonicalPmrFormKey(template.form_key)
  let priority = template.form_key === canonicalKey ? 1000 : 0
  priority += template.fields.length
  return priority
}

function dedupeTemplates(templates: PmrFormTemplate[]) {
  const byCanonical = new Map<string, PmrFormTemplate>()

  for (const template of templates) {
    const canonicalKey = getCanonicalPmrFormKey(template.form_key)
    const current = byCanonical.get(canonicalKey)
    if (!current || templatePriority(template) > templatePriority(current)) {
      byCanonical.set(canonicalKey, template)
    }
  }

  return Array.from(byCanonical.entries())
    .sort(([keyA], [keyB]) => {
      const orderA = CANONICAL_FORM_ORDER.indexOf(keyA)
      const orderB = CANONICAL_FORM_ORDER.indexOf(keyB)
      return (orderA < 0 ? 99 : orderA) - (orderB < 0 ? 99 : orderB)
    })
    .map(([, template]) => template)
}

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
      setTemplates(dedupeTemplates(parsePmrFormTemplateArray(templatesRes.data || [])))
      setResponses(parsePmrFormResponseArray(responsesRes.data || []))
    }
    setLoading(false)
  }, [clientId])

  const saveResponse = useCallback(async (input: {
    response_id?: string
    template_id: string
    visit_id?: string | null
    respondent_name?: string
    respondent_role?: string
    answers: Record<string, unknown>
    summary?: string
  }) => {
    if (!clientId) return { error: 'Cliente nao informado.' }

    const payload = {
      client_id: clientId,
      visit_id: input.visit_id || null,
      template_id: input.template_id,
      respondent_name: input.respondent_name?.trim() || null,
      respondent_role: input.respondent_role?.trim() || null,
      answers: input.answers,
      summary: input.summary?.trim() || null,
      submitted_by: profile?.id || null,
    }

    const { error: writeError } = input.response_id
      ? await supabase
        .from('respostas_formulario_pmr')
        .update(payload)
        .eq('id', input.response_id)
      : await supabase.from('respostas_formulario_pmr').insert(payload)

    if (writeError) return { error: writeError.message }
    await fetchDiagnostics()
    return { error: null }
  }, [clientId, fetchDiagnostics, profile?.id])

  useEffect(() => {
    fetchDiagnostics()
  }, [fetchDiagnostics])

  const responsesByTemplate = useMemo(() => {
    const map = new Map<string, PmrFormResponse[]>()
    const canonicalTemplateId = new Map(
      templates.map((template) => [getCanonicalPmrFormKey(template.form_key), template.id])
    )

    for (const response of responses) {
      const canonicalKey = getCanonicalPmrFormKey(response.template?.form_key || response.respondent_role)
      const templateId = canonicalTemplateId.get(canonicalKey) || response.template_id
      const list = map.get(templateId) || []
      list.push(response)
      map.set(templateId, list)
    }
    return map
  }, [responses, templates])

  return { templates, responses, responsesByTemplate, loading, error, saveResponse, refetch: fetchDiagnostics }
}
