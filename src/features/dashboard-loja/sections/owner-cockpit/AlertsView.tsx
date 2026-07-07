import { AlertTriangle, Bell, CheckCircle2, Clock3, MoreVertical, TrendingUp } from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import type { OwnerPerformanceAlert } from '../PerformanceAlerts'
import { toneClasses, type KpiTone } from './types'
import { SectionTitle, SideList, SummaryCard, ToolbarPlaceholder } from './primitives'

export function AlertsView({ alerts }: { alerts: OwnerPerformanceAlert[] }) {
  const critical = alerts.filter(alert => alert.variant === 'danger').length
  const warning = alerts.filter(alert => alert.variant === 'warning').length
  const positive = alerts.filter(alert => alert.variant === 'success').length
  return (
    <div className="space-y-mx-md">
      <SectionTitle title="Alertas Inteligentes" subtitle="Monitore riscos, desvios e oportunidades em tempo real." />
      <div className="grid grid-cols-1 gap-mx-md md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Críticos" value={critical} detail="exigem ação imediata" icon={<AlertTriangle size={22} />} tone="danger" />
        <SummaryCard title="Atenção" value={warning} detail="precisam de atenção" icon={<Clock3 size={22} />} tone="warning" />
        <SummaryCard title="Informativos" value={Math.max(alerts.length - critical - warning - positive, 0)} detail="para acompanhamento" icon={<Bell size={22} />} tone="info" />
        <SummaryCard title="Positivos" value={positive} detail="pontos positivos" icon={<CheckCircle2 size={22} />} tone="success" />
        <SummaryCard title="Tendência de Risco" value={critical + warning > 0 ? 'Alta' : 'Baixa'} detail="atenção redobrada" icon={<TrendingUp size={22} />} tone={critical + warning > 0 ? 'danger' : 'success'} />
      </div>
      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-mx-2xl p-mx-lg">
          <ToolbarPlaceholder searchPlaceholder="Buscar alerta..." />
          <div className="mt-mx-md divide-y divide-border-subtle">
            {alerts.map((alert, index) => {
              const tone: KpiTone = alert.variant === 'danger' ? 'danger' : alert.variant === 'warning' ? 'warning' : alert.variant === 'success' ? 'success' : 'info'
              const classes = toneClasses[tone]
              return (
                <div key={`${alert.title}-${index}`} className="grid grid-cols-1 gap-mx-sm py-mx-md lg:grid-cols-[120px_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_90px_80px_40px] lg:items-center">
                  <span className={cn('w-fit rounded-mx-md border px-mx-sm py-mx-xs text-mx-tiny font-black', classes.soft)}>{tone === 'danger' ? 'Crítico' : tone === 'warning' ? 'Atenção' : tone === 'success' ? 'Positivo' : 'Informativo'}</span>
                  <div>
                    <Typography variant="p" className="font-black">{alert.title}</Typography>
                    <Typography variant="tiny" tone="muted" className="block">{alert.description}</Typography>
                  </div>
                  <Typography variant="p" tone="brand" className="font-black">{alert.recommendation}</Typography>
                  <Typography variant="p" className="font-bold text-text-secondary">{alert.action}</Typography>
                  <Typography variant="tiny" className={cn('font-black', classes.text)}>Impacto {alert.impact}</Typography>
                  <Typography variant="tiny" className={cn('font-black', classes.text)}>Sistema</Typography>
                  <MoreVertical size={18} className="text-text-tertiary" />
                </div>
              )
            })}
          </div>
        </Card>
        <div className="space-y-mx-md">
          <SideList title="Indicadores mais críticos" items={alerts.slice(0, 5).map(alert => alert.title)} />
          <Card className="rounded-mx-2xl bg-mx-indigo-50 p-mx-lg">
            <Typography variant="h3" className="font-black text-brand-primary">Dica do Consultor MX</Typography>
            <Typography variant="p" tone="muted" className="mt-mx-sm font-bold">Foque nas ações críticas para evitar impacto no resultado do mês.</Typography>
          </Card>
        </div>
      </div>
    </div>
  )
}
