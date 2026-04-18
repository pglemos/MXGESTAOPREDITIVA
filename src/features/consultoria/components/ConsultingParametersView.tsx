import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { useConsultingParameters } from '@/hooks/useConsultingParameters'

function toInputValue(value?: number | null) {
  return value == null ? '' : String(value)
}

function parseOptionalNumber(value: string) {
  if (value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function ConsultingParametersView() {
  const { catalog, values, valueByMetric, activeSet, loading, error, canManage, updateParameterValue } = useConsultingParameters()
  const [metricKey, setMetricKey] = useState('')
  const [form, setForm] = useState({
    market_average: '',
    best_practice: '',
    target_default: '',
    red_threshold: '',
    yellow_threshold: '',
    green_threshold: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const selectedMetric = useMemo(() => {
    return catalog.find((metric) => metric.metric_key === (metricKey || catalog[0]?.metric_key))
  }, [catalog, metricKey])

  useEffect(() => {
    if (!selectedMetric) return
    const value = valueByMetric.get(selectedMetric.metric_key)
    setForm({
      market_average: toInputValue(value?.market_average),
      best_practice: toInputValue(value?.best_practice),
      target_default: toInputValue(value?.target_default),
      red_threshold: toInputValue(value?.red_threshold),
      yellow_threshold: toInputValue(value?.yellow_threshold),
      green_threshold: toInputValue(value?.green_threshold),
      notes: value?.notes || '',
    })
  }, [selectedMetric, valueByMetric])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedMetric) return
    const parsed = {
      market_average: parseOptionalNumber(form.market_average),
      best_practice: parseOptionalNumber(form.best_practice),
      target_default: parseOptionalNumber(form.target_default),
      red_threshold: parseOptionalNumber(form.red_threshold),
      yellow_threshold: parseOptionalNumber(form.yellow_threshold),
      green_threshold: parseOptionalNumber(form.green_threshold),
    }
    if (Object.values(parsed).some((value) => typeof value === 'undefined')) {
      toast.error('Revise os campos numericos antes de salvar o parametro PMR.')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await updateParameterValue({
      metric_key: selectedMetric.metric_key,
      market_average: parsed.market_average ?? null,
      best_practice: parsed.best_practice ?? null,
      target_default: parsed.target_default ?? null,
      red_threshold: parsed.red_threshold ?? null,
      yellow_threshold: parsed.yellow_threshold ?? null,
      green_threshold: parsed.green_threshold ?? null,
      notes: form.notes,
    })
    setSubmitting(false)

    if (updateError) {
      toast.error(updateError)
      return
    }

    toast.success('Parametro PMR atualizado.')
  }

  if (loading) {
    return (
      <Card className="p-mx-lg border-none shadow-mx-md bg-white">
        <Typography variant="p">Carregando parametros PMR...</Typography>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-mx-lg border-none shadow-mx-md bg-white">
        <Typography variant="h3" tone="error">Parametros indisponiveis</Typography>
        <Typography variant="p" tone="muted">{error}</Typography>
      </Card>
    )
  }

  return (
    <section className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-mx-md border-b border-border-default pb-10">
        <div className="space-y-mx-sm">
          <Typography variant="h1">Parametros PMR</Typography>
          <Typography variant="caption">
            Indicadores, benchmarks, limites de cor e formulas editaveis da consultoria.
          </Typography>
        </div>
        <Badge variant="outline" className="rounded-mx-full px-4 py-1">
          {activeSet ? `${activeSet.name} ${activeSet.version}` : 'SEM CONJUNTO ATIVO'}
        </Badge>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-mx-lg">
        <Card className="p-mx-lg border-none shadow-mx-md bg-white xl:col-span-2">
          <Typography variant="h3" className="mb-mx-md">CATALOGO DE INDICADORES</Typography>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="py-mx-sm pr-mx-md"><Typography variant="tiny" tone="muted">INDICADOR</Typography></th>
                  <th className="py-mx-sm pr-mx-md"><Typography variant="tiny" tone="muted">AREA</Typography></th>
                  <th className="py-mx-sm pr-mx-md"><Typography variant="tiny" tone="muted">MERCADO</Typography></th>
                  <th className="py-mx-sm pr-mx-md"><Typography variant="tiny" tone="muted">BOA PRATICA</Typography></th>
                  <th className="py-mx-sm"><Typography variant="tiny" tone="muted">FONTE</Typography></th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((metric) => {
                  const value = valueByMetric.get(metric.metric_key)
                  return (
                    <tr key={metric.metric_key} className="border-b border-border-subtle">
                      <td className="py-mx-sm pr-mx-md">
                        <button type="button" className="text-left" onClick={() => setMetricKey(metric.metric_key)}>
                          <Typography variant="p" className="font-black">{metric.label}</Typography>
                          <Typography variant="tiny" tone="muted">{metric.metric_key}</Typography>
                        </button>
                      </td>
                      <td className="py-mx-sm pr-mx-md"><Typography variant="p">{metric.area}</Typography></td>
                      <td className="py-mx-sm pr-mx-md"><Typography variant="p">{value?.market_average ?? '-'}</Typography></td>
                      <td className="py-mx-sm pr-mx-md"><Typography variant="p">{value?.best_practice ?? '-'}</Typography></td>
                      <td className="py-mx-sm"><Typography variant="p">{metric.source_scope}</Typography></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-mx-lg border-none shadow-mx-md bg-white">
          <Typography variant="h3" className="mb-mx-md">EDITAR PARAMETRO</Typography>
          <form onSubmit={handleSubmit} className="space-y-mx-md">
            <Select
              label="Indicador"
              value={selectedMetric?.metric_key || ''}
              onChange={(event) => setMetricKey(event.target.value)}
            >
              {catalog.map((metric) => (
                <option key={metric.metric_key} value={metric.metric_key}>{metric.label}</option>
              ))}
            </Select>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
              <div className="space-y-mx-xs">
                <Typography as="label" htmlFor="pmr-param-market" variant="caption">Media mercado</Typography>
                <Input id="pmr-param-market" type="number" step="0.01" value={form.market_average} onChange={(event) => setForm((current) => ({ ...current, market_average: event.target.value }))} disabled={!canManage} />
              </div>
              <div className="space-y-mx-xs">
                <Typography as="label" htmlFor="pmr-param-best" variant="caption">Boa pratica</Typography>
                <Input id="pmr-param-best" type="number" step="0.01" value={form.best_practice} onChange={(event) => setForm((current) => ({ ...current, best_practice: event.target.value }))} disabled={!canManage} />
              </div>
              <div className="space-y-mx-xs">
                <Typography as="label" htmlFor="pmr-param-target" variant="caption">Meta padrao</Typography>
                <Input id="pmr-param-target" type="number" step="0.01" value={form.target_default} onChange={(event) => setForm((current) => ({ ...current, target_default: event.target.value }))} disabled={!canManage} />
              </div>
              <div className="space-y-mx-xs">
                <Typography as="label" htmlFor="pmr-param-red" variant="caption">Limite vermelho</Typography>
                <Input id="pmr-param-red" type="number" step="0.01" value={form.red_threshold} onChange={(event) => setForm((current) => ({ ...current, red_threshold: event.target.value }))} disabled={!canManage} />
              </div>
              <div className="space-y-mx-xs">
                <Typography as="label" htmlFor="pmr-param-yellow" variant="caption">Limite amarelo</Typography>
                <Input id="pmr-param-yellow" type="number" step="0.01" value={form.yellow_threshold} onChange={(event) => setForm((current) => ({ ...current, yellow_threshold: event.target.value }))} disabled={!canManage} />
              </div>
              <div className="space-y-mx-xs">
                <Typography as="label" htmlFor="pmr-param-green" variant="caption">Limite verde</Typography>
                <Input id="pmr-param-green" type="number" step="0.01" value={form.green_threshold} onChange={(event) => setForm((current) => ({ ...current, green_threshold: event.target.value }))} disabled={!canManage} />
              </div>
            </div>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="pmr-param-notes" variant="caption">Observacoes</Typography>
              <Textarea id="pmr-param-notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} disabled={!canManage} />
            </div>
            <Button type="submit" className="w-full" disabled={!canManage || submitting || !selectedMetric}>
              {submitting ? 'SALVANDO...' : 'SALVAR PARAMETRO'}
            </Button>
            {!canManage && (
              <Typography variant="tiny" tone="muted">Somente administradores podem editar parametros.</Typography>
            )}
          </form>
        </Card>
      </div>
    </section>
  )
}
