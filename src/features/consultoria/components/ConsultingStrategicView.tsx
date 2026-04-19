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
import { FileText } from 'lucide-react'
import { useConsultingMetrics } from '@/hooks/useConsultingMetrics'
import { useConsultingParameters } from '@/hooks/useConsultingParameters'
import { useConsultingStrategicPlan } from '@/hooks/useConsultingStrategicPlan'

type Props = {
  clientId: string
}

function formatMetricValue(value: number, valueType?: string) {
  if (valueType === 'percent') return `${(value * 100).toFixed(1)}%`
  if (valueType === 'currency') return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return value.toLocaleString('pt-BR')
}

function classifyMetric(result: number, direction?: string, green?: number | null, yellow?: number | null) {
  if (green == null && yellow == null) return 'outline'
  if (direction === 'decrease') {
    if (green != null && result <= green) return 'success'
    if (yellow != null && result <= yellow) return 'warning'
    return 'danger'
  }
  if (green != null && result >= green) return 'success'
  if (yellow != null && result >= yellow) return 'warning'
  return 'danger'
}

type MetricStatus = ReturnType<typeof classifyMetric>

const statusVariant: Record<MetricStatus, 'outline' | 'warning' | 'success' | 'danger'> = {
  outline: 'outline',
  warning: 'warning',
  success: 'success',
  danger: 'danger',
}

function parseFiniteNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function ConsultingStrategicView({ clientId }: Props) {
  const metrics = useConsultingMetrics(clientId)
  const parameters = useConsultingParameters()
  const strategic = useConsultingStrategicPlan(clientId)
  const [metricKey, setMetricKey] = useState('')
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().slice(0, 10))
  const [resultValue, setResultValue] = useState('')
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7))
  const [targetValue, setTargetValue] = useState('')
  const [planSummary, setPlanSummary] = useState('')
  const [swot, setSwot] = useState({
    strengths: '',
    weaknesses: '',
    opportunities: '',
    threats: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const selectedMetric = metrics.catalog.find((metric) => metric.metric_key === metricKey) || metrics.catalog[0]
  const strategicRows = useMemo(() => {
    return metrics.catalog
      .map((metric) => {
        const result = metrics.latestResults.get(metric.metric_key)
        const params = parameters.valueByMetric.get(metric.metric_key)
        return { metric, result, params }
      })
      .filter((row) => row.result || row.params)
      .slice(0, 12)
  }, [metrics.catalog, metrics.latestResults, parameters.valueByMetric])

  const handleSaveResult = async (event: React.FormEvent) => {
    event.preventDefault()
    const currentMetricKey = selectedMetric?.metric_key || metricKey
    if (!currentMetricKey || resultValue === '') {
      toast.error('Informe indicador e valor realizado.')
      return
    }
    const parsedResult = parseFiniteNumber(resultValue)
    if (parsedResult == null) {
      toast.error('Informe um valor realizado numerico valido.')
      return
    }

    setSubmitting(true)
    const { error } = await metrics.upsertResult({
      metric_key: currentMetricKey,
      reference_date: referenceDate,
      result_value: parsedResult,
      source: 'manual',
    })
    setSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('Resultado atualizado.')
    setMetricKey(currentMetricKey)
    setResultValue('')
  }

  const handleSaveTarget = async (event: React.FormEvent) => {
    event.preventDefault()
    const currentMetricKey = selectedMetric?.metric_key || metricKey
    if (!currentMetricKey || targetValue === '') {
      toast.error('Informe indicador e meta.')
      return
    }
    const parsedTarget = parseFiniteNumber(targetValue)
    if (parsedTarget == null) {
      toast.error('Informe uma meta numerica valida.')
      return
    }

    setSubmitting(true)
    const { error } = await metrics.upsertTarget({
      metric_key: currentMetricKey,
      reference_month: `${targetMonth}-01`,
      target_value: parsedTarget,
      source: 'manual',
    })
    setSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('Meta atualizada.')
    setTargetValue('')
  }

  const handleCreatePlan = async () => {
    const title = `Planejamento PMR - ${new Date().toLocaleDateString('pt-BR')}`
    const payload = {
      metrics: strategicRows.map((row) => ({
        metric_key: row.metric.metric_key,
        label: row.metric.label,
        latest_result: row.result?.result_value ?? null,
        market_average: row.params?.market_average ?? null,
        best_practice: row.params?.best_practice ?? null,
      })),
      swot,
      generated_from: 'ui',
    }

    setSubmitting(true)
    const { error } = await strategic.createPlan({
      title,
      diagnosis_summary: planSummary || 'Planejamento gerado a partir dos diagnosticos PMR, metas e resultados lancados no cliente.',
      market_comparison: payload,
      generated_payload: payload,
    })
    setSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success('Planejamento estrategico criado.')
    setPlanSummary('')
    setSwot({ strengths: '', weaknesses: '', opportunities: '', threats: '' })
  }

  if (metrics.loading || parameters.loading || strategic.loading) {
    return (
      <Card className="p-mx-lg border-none shadow-mx-md bg-white">
        <Typography variant="p">Carregando dados estrategicos...</Typography>
      </Card>
    )
  }

  const error = metrics.error || parameters.error || strategic.error
  if (error) {
    return (
      <Card className="p-mx-lg border-none shadow-mx-md bg-white">
        <Typography variant="h3" tone="error">Estrategico indisponivel</Typography>
        <Typography variant="p" tone="muted">{error}</Typography>
      </Card>
    )
  }

  return (
    <section className="space-y-mx-lg">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-mx-lg">
        <Card className="p-mx-lg border-none shadow-mx-md bg-white xl:col-span-2">
          <div className="flex items-start justify-between gap-mx-md mb-mx-md">
            <div>
              <Typography variant="h3">ESTRATEGICO PMR</Typography>
              <Typography variant="caption" tone="muted">
                Metas, realizados e comparativo com mercado e boa pratica.
              </Typography>
            </div>
            <Badge variant="outline" className="rounded-mx-full px-3 py-1">
              {parameters.activeSet?.version || 'SEM VERSAO'}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="py-mx-sm pr-mx-md"><Typography variant="tiny" tone="muted">INDICADOR</Typography></th>
                  <th className="py-mx-sm pr-mx-md"><Typography variant="tiny" tone="muted">REALIZADO</Typography></th>
                  <th className="py-mx-sm pr-mx-md"><Typography variant="tiny" tone="muted">MERCADO</Typography></th>
                  <th className="py-mx-sm pr-mx-md"><Typography variant="tiny" tone="muted">BOA PRATICA</Typography></th>
                  <th className="py-mx-sm"><Typography variant="tiny" tone="muted">STATUS</Typography></th>
                </tr>
              </thead>
              <tbody>
                {strategicRows.map(({ metric, result, params }) => {
                  const status = typeof result?.result_value === 'number'
                    ? classifyMetric(result.result_value, metric.direction, params?.green_threshold, params?.yellow_threshold)
                    : 'outline'
                  return (
                    <tr key={metric.metric_key} className="border-b border-border-subtle">
                      <td className="py-mx-sm pr-mx-md">
                        <Typography variant="p" className="font-black">{metric.label}</Typography>
                        <Typography variant="tiny" tone="muted">{metric.area}</Typography>
                      </td>
                      <td className="py-mx-sm pr-mx-md">
                        <Typography variant="p">
                          {result ? formatMetricValue(result.result_value, metric.value_type) : '-'}
                        </Typography>
                      </td>
                      <td className="py-mx-sm pr-mx-md">
                        <Typography variant="p">
                          {params?.market_average != null ? formatMetricValue(params.market_average, metric.value_type) : '-'}
                        </Typography>
                      </td>
                      <td className="py-mx-sm pr-mx-md">
                        <Typography variant="p">
                          {params?.best_practice != null ? formatMetricValue(params.best_practice, metric.value_type) : '-'}
                        </Typography>
                      </td>
                      <td className="py-mx-sm">
                        <Badge variant={statusVariant[status]} className="rounded-mx-full px-3 py-1">
                          {status === 'success' ? 'ACIMA' : status === 'warning' ? 'MERCADO' : status === 'danger' ? 'ATENCAO' : 'SEM DADO'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-mx-lg border-none shadow-mx-md bg-white">
          <Typography variant="h3" className="mb-mx-md">PLANEJAMENTO</Typography>
          {strategic.latestPlan ? (
            <div className="p-mx-md rounded-mx-lg bg-surface-alt border border-border-default mb-mx-md">
              <Typography variant="p" className="font-black">{strategic.latestPlan.title}</Typography>
              <Typography variant="tiny" tone="muted">
                Gerado em {new Date(strategic.latestPlan.generated_at).toLocaleDateString('pt-BR')}
              </Typography>
              <Typography variant="p" className="mt-mx-sm text-sm">{strategic.latestPlan.diagnosis_summary || 'Sem resumo.'}</Typography>
            </div>
          ) : (
            <Typography variant="p" tone="muted" className="mb-mx-md">Nenhum planejamento gerado ainda.</Typography>
          )}

          <div className="space-y-mx-md mb-mx-md pt-4 border-t border-border-default">
            <Typography variant="h3" className="uppercase text-xs font-black text-text-tertiary">Entregáveis Disponíveis</Typography>
            {strategic.artifacts.length === 0 && (
                <Typography variant="tiny" tone="muted">Nenhum arquivo gerado via CLI ainda.</Typography>
            )}
            {strategic.artifacts.map(art => (
                <div key={art.id} className="flex items-center justify-between p-2 rounded-lg border border-border-subtle bg-surface-alt/50">
                    <div className="min-w-0">
                        <Typography variant="p" className="text-xs font-bold truncate">{art.title}</Typography>
                        <Typography variant="tiny" tone="muted" className="block capitalize">{art.artifact_type.replace('_', ' ')}</Typography>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={`#artifact-${art.id}`} title="Ver Markdown">
                            <FileText size={14} />
                        </a>
                    </Button>
                </div>
            ))}
          </div>

          <Textarea
            value={planSummary}
            onChange={(event) => setPlanSummary(event.target.value)}
            placeholder="Resumo executivo do planejamento..."
            className="min-h-mx-28 mb-mx-md"
          />

          <div className="space-y-mx-md mb-mx-md pt-4 border-t border-border-default">
            <Typography variant="h3" className="uppercase text-xs font-black text-text-tertiary">Análise SWOT (Forças e Fraquezas)</Typography>
            <div className="grid grid-cols-1 gap-mx-sm">
                <div className="space-y-mx-xs">
                  <Typography as="label" variant="caption">Forças (Pontos Fortes)</Typography>
                  <Textarea 
                      value={swot.strengths} 
                      onChange={e => setSwot(prev => ({ ...prev, strengths: e.target.value }))}
                      placeholder="Experiência do sócio, qualidade do estoque..."
                  />
                </div>
                <div className="space-y-mx-xs">
                  <Typography as="label" variant="caption">Fraquezas (Pontos de Melhoria)</Typography>
                  <Textarea 
                      value={swot.weaknesses} 
                      onChange={e => setSwot(prev => ({ ...prev, weaknesses: e.target.value }))}
                      placeholder="Falta de clareza nos processos, baixo foco em vendas..."
                  />
                </div>
                <div className="space-y-mx-xs">
                  <Typography as="label" variant="caption">Oportunidades (Crescimento)</Typography>
                  <Textarea 
                      value={swot.opportunities} 
                      onChange={e => setSwot(prev => ({ ...prev, opportunities: e.target.value }))}
                      placeholder="Aumento do ticket médio, diversificação de canais..."
                  />
                </div>
                <div className="space-y-mx-xs">
                  <Typography as="label" variant="caption">Ameaças (Riscos)</Typography>
                  <Textarea 
                      value={swot.threats} 
                      onChange={e => setSwot(prev => ({ ...prev, threats: e.target.value }))}
                      placeholder="Aumento de custos, volatilidade econômica..."
                  />
                </div>
            </div>
          </div>

          <Button type="button" className="w-full" onClick={handleCreatePlan} disabled={submitting}>
            GERAR PLANEJAMENTO
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-mx-lg">
        <Card className="p-mx-lg border-none shadow-mx-md bg-white">
          <Typography variant="h3" className="mb-mx-md">LANÇAR REALIZADO</Typography>
          <form onSubmit={handleSaveResult} className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
            <Select
              label="Indicador"
              value={selectedMetric?.metric_key || ''}
              onChange={(event) => setMetricKey(event.target.value)}
            >
              {metrics.catalog.map((metric) => (
                <option key={metric.metric_key} value={metric.metric_key}>{metric.label}</option>
              ))}
            </Select>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="pmr-result-date" variant="caption">Data</Typography>
              <Input id="pmr-result-date" type="date" value={referenceDate} onChange={(event) => setReferenceDate(event.target.value)} />
            </div>
            <div className="space-y-mx-xs md:col-span-2">
              <Typography as="label" htmlFor="pmr-result-value" variant="caption">Valor realizado</Typography>
              <Input id="pmr-result-value" type="number" step="0.01" value={resultValue} onChange={(event) => setResultValue(event.target.value)} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" size="sm" disabled={submitting}>SALVAR REALIZADO</Button>
            </div>
          </form>
        </Card>

        <Card className="p-mx-lg border-none shadow-mx-md bg-white">
          <Typography variant="h3" className="mb-mx-md">LANÇAR META</Typography>
          <form onSubmit={handleSaveTarget} className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
            <Select
              label="Indicador"
              value={selectedMetric?.metric_key || ''}
              onChange={(event) => setMetricKey(event.target.value)}
            >
              {metrics.catalog.map((metric) => (
                <option key={metric.metric_key} value={metric.metric_key}>{metric.label}</option>
              ))}
            </Select>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="pmr-target-month" variant="caption">Mes</Typography>
              <Input id="pmr-target-month" type="month" value={targetMonth} onChange={(event) => setTargetMonth(event.target.value)} />
            </div>
            <div className="space-y-mx-xs md:col-span-2">
              <Typography as="label" htmlFor="pmr-target-value" variant="caption">Meta</Typography>
              <Input id="pmr-target-value" type="number" step="0.01" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" size="sm" disabled={submitting}>SALVAR META</Button>
            </div>
          </form>
        </Card>
      </div>
    </section>
  )
}
