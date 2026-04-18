import type React from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { usePmrDiagnostics } from '@/hooks/usePmrDiagnostics'
import type { PmrFormField, PmrFormTemplate } from '@/lib/schemas/consulting-client.schema'

type Props = {
  clientId: string
}

const formLabels: Record<string, string> = {
  owner: 'Socio / Dono',
  manager: 'Gerente',
  seller: 'Vendedor',
  process: 'Processos',
}

function emptyAnswers(template?: PmrFormTemplate) {
  return Object.fromEntries((template?.fields || []).map((field) => [field.key, field.type === 'boolean' ? false : '']))
}

function parseAnswerValue(field: PmrFormField, value: string | boolean) {
  if (field.type === 'boolean') return Boolean(value)
  if (field.type === 'number' || field.type === 'scale') {
    if (value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return value
}

export function PmrDiagnosticsView({ clientId }: Props) {
  const { templates, responsesByTemplate, loading, error, saveResponse } = usePmrDiagnostics(clientId)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const selectedTemplate = useMemo(() => {
    return templates.find((template) => template.id === (selectedTemplateId || templates[0]?.id))
  }, [selectedTemplateId, templates])
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [respondentName, setRespondentName] = useState('')
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentAnswers = Object.keys(answers).length ? answers : emptyAnswers(selectedTemplate)

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId)
    setSelectedTemplateId(templateId)
    setAnswers(emptyAnswers(template))
    setRespondentName('')
    setSummary('')
  }

  const handleFieldChange = (field: PmrFormField, value: string | boolean) => {
    setAnswers((current) => ({
      ...emptyAnswers(selectedTemplate),
      ...current,
      [field.key]: parseAnswerValue(field, value),
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedTemplate) return

    const requiredMissing = selectedTemplate.fields.some((field) => {
      if (!field.required) return false
      const value = currentAnswers[field.key]
      return value === '' || value === null || typeof value === 'undefined'
    })

    if (requiredMissing) {
      toast.error('Preencha os campos obrigatorios do diagnostico.')
      return
    }

    setSubmitting(true)
    const { error: saveError } = await saveResponse({
      template_id: selectedTemplate.id,
      respondent_name: respondentName,
      respondent_role: formLabels[selectedTemplate.form_key] || selectedTemplate.form_key,
      answers: currentAnswers,
      summary,
    })
    setSubmitting(false)

    if (saveError) {
      toast.error(saveError)
      return
    }

    toast.success('Diagnostico PMR salvo.')
    setAnswers(emptyAnswers(selectedTemplate))
    setRespondentName('')
    setSummary('')
  }

  if (loading) {
    return (
      <Card className="p-mx-lg border-none shadow-mx-md bg-white">
        <Typography variant="p">Carregando formularios PMR...</Typography>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-mx-lg border-none shadow-mx-md bg-white">
        <Typography variant="h3" tone="error">Diagnostico indisponivel</Typography>
        <Typography variant="p" tone="muted">{error}</Typography>
      </Card>
    )
  }

  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-mx-lg">
      <Card className="p-mx-lg border-none shadow-mx-md bg-white xl:col-span-2">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-mx-md mb-mx-lg">
          <div>
            <Typography variant="h3">DIAGNOSTICO PMR NATIVO</Typography>
            <Typography variant="caption" tone="muted">
              Visita 1: donos, gerentes, vendedores e processos sem links externos.
            </Typography>
          </div>
          <Select
            aria-label="Selecionar formulario"
            value={selectedTemplate?.id || ''}
            onChange={(event) => handleTemplateChange(event.target.value)}
            className="md:w-mx-64"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))}
          </Select>
        </div>

        {selectedTemplate ? (
          <form onSubmit={handleSubmit} className="space-y-mx-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
              <div className="space-y-mx-xs">
                <Typography as="label" htmlFor="pmr-respondent" variant="caption">Respondente</Typography>
                <Input
                  id="pmr-respondent"
                  value={respondentName}
                  onChange={(event) => setRespondentName(event.target.value)}
                  placeholder="Nome da pessoa entrevistada"
                />
              </div>
              <div className="space-y-mx-xs">
                <Typography variant="caption">Tipo</Typography>
                <div className="h-mx-14 sm:h-12 rounded-mx-md border border-border-default bg-surface-alt px-5 flex items-center">
                  <Typography variant="p" className="font-black">
                    {formLabels[selectedTemplate.form_key] || selectedTemplate.title}
                  </Typography>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
              {selectedTemplate.fields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2 space-y-mx-xs' : 'space-y-mx-xs'}>
                  <Typography as="label" htmlFor={`pmr-field-${field.key}`} variant="caption">
                    {field.label}{field.required ? ' *' : ''}
                  </Typography>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={`pmr-field-${field.key}`}
                      value={String(currentAnswers[field.key] || '')}
                      onChange={(event) => handleFieldChange(field, event.target.value)}
                      className="min-h-mx-24"
                    />
                  ) : field.type === 'boolean' ? (
                    <label className="h-mx-14 sm:h-12 rounded-mx-md border border-border-default bg-white px-5 flex items-center gap-mx-sm font-bold">
                      <input
                        type="checkbox"
                        checked={Boolean(currentAnswers[field.key])}
                        onChange={(event) => handleFieldChange(field, event.target.checked)}
                      />
                      Sim
                    </label>
                  ) : field.type === 'select' ? (
                    <Select
                      id={`pmr-field-${field.key}`}
                      value={String(currentAnswers[field.key] || '')}
                      onChange={(event) => handleFieldChange(field, event.target.value)}
                    >
                      <option value="">Selecionar...</option>
                      {(field.options || []).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id={`pmr-field-${field.key}`}
                      type={field.type === 'number' || field.type === 'scale' ? 'number' : 'text'}
                      min={field.type === 'scale' ? 0 : undefined}
                      max={field.type === 'scale' ? 5 : undefined}
                      value={String(currentAnswers[field.key] ?? '')}
                      onChange={(event) => handleFieldChange(field, event.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="pmr-summary" variant="caption">Resumo da entrevista</Typography>
              <Textarea
                id="pmr-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Sintese para alimentar o planejamento estrategico e o plano de acao..."
                className="min-h-mx-28"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'SALVANDO...' : 'SALVAR DIAGNOSTICO'}
              </Button>
            </div>
          </form>
        ) : (
          <Typography variant="p" tone="muted">Nenhum formulario ativo encontrado.</Typography>
        )}
      </Card>

      <Card className="p-mx-lg border-none shadow-mx-md bg-white">
        <Typography variant="h3" className="mb-mx-md">RESPOSTAS COLETADAS</Typography>
        <div className="space-y-mx-sm">
          {templates.map((template) => {
            const responses = responsesByTemplate.get(template.id) || []
            return (
              <div key={template.id} className="p-mx-md rounded-mx-lg bg-surface-alt border border-border-default">
                <div className="flex items-center justify-between gap-mx-sm">
                  <Typography variant="p" className="font-black">{template.title}</Typography>
                  <Badge variant={responses.length ? 'success' : 'outline'} className="rounded-mx-full px-3 py-1">
                    {responses.length}
                  </Badge>
                </div>
                {responses[0] ? (
                  <Typography variant="tiny" tone="muted">
                    Ultima resposta: {new Date(responses[0].submitted_at).toLocaleDateString('pt-BR')}
                  </Typography>
                ) : (
                  <Typography variant="tiny" tone="muted">Pendente na Visita 1.</Typography>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </section>
  )
}
