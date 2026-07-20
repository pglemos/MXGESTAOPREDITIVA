import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import type { OwnerPerformanceAlert } from '../PerformanceAlerts'
import { toneClasses, type KpiTone } from './types'
import { SectionTitle, SideList } from './primitives'

export function AgendaView({ alerts }: { alerts: OwnerPerformanceAlert[] }) {
  const today = new Date()
  const currentMonthYear = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())
  const currentDayFull = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())
  const currentDayOfMonth = today.getDate()

  const agenda = alerts.map((alert, index) => {
    const baseHour = 8 + Math.floor(index * 1.5)
    const timeStr = `${String(baseHour).padStart(2, '0')}:00`
    
    let tone: KpiTone = 'info'
    if (alert.variant === 'success') tone = 'success'
    else if (alert.variant === 'danger') tone = 'danger'
    else if (alert.variant === 'warning') tone = 'warning'
    
    return {
      time: timeStr,
      title: alert.title,
      detail: alert.description,
      tone
    }
  })

  const priorities = agenda.length > 0 
    ? agenda.slice(0, 3).map(item => item.title) 
    : ['Nenhuma prioridade crítica hoje']

  return (
    <div className="space-y-mx-md">
      <div className="flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between">
        <SectionTitle title="Agenda Executiva" subtitle="Visão diária, semanal e mensal dos compromissos e prioridades." />
      </div>
      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Card className="rounded-mx-2xl p-mx-lg">
          <Typography variant="h3" className="text-xl font-black">{currentMonthYear}</Typography>
          <div className="mt-mx-md grid grid-cols-7 gap-mx-xs text-center text-xs font-black">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <span key={`${day}-${index}`} className="text-text-tertiary">{day}</span>)}
            {Array.from({ length: 35 }, (_, index) => {
              const dayNum = index + 1
              const isValidDay = dayNum <= 31
              const isToday = isValidDay && dayNum === currentDayOfMonth
              return (
                <span 
                  key={index} 
                  className={cn(
                    'rounded-mx-lg py-mx-xs', 
                    isToday ? 'bg-brand-primary text-white font-bold' : 'text-text-primary'
                  )}
                >
                  {isValidDay ? dayNum : ''}
                </span>
              )
            })}
          </div>
          <SideList className="mt-mx-lg" title="Calendários" items={['Agenda Executiva', 'Reuniões', 'Visitas / Avaliações', 'Lembretes']} />
        </Card>
        <Card className="rounded-mx-2xl p-mx-lg">
          <Typography variant="h3" className="text-xl font-black">{currentDayFull}</Typography>
          <div className="mt-mx-md space-y-mx-sm">
            {agenda.length === 0 ? (
              <div className="owner-base44-exact__empty-state" role="status">
                <strong className="text-base font-black text-text-primary">Nenhum evento na agenda executiva</strong>
                <p className="text-sm text-text-secondary">Todos os indicadores e rotinas estão em conformidade.</p>
              </div>
            ) : (
              agenda.map(item => {
                const classes = toneClasses[item.tone]
                return (
                  <div key={`${item.time}-${item.title}`} className={cn('grid grid-cols-[64px_minmax(0,1fr)] gap-mx-sm rounded-mx-xl border p-mx-md', classes.soft)}>
                    <Typography variant="p" className="font-black tabular-nums">{item.time}</Typography>
                    <div className="min-w-0">
                      <Typography variant="p" className="font-black">{item.title}</Typography>
                      <Typography variant="tiny" className="mt-mx-xs block font-bold opacity-80">{item.detail}</Typography>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
        <div className="space-y-mx-md">
          <SideList title="Prioridades do Dia" items={priorities} />
          <SideList title="Próximos Compromissos" items={['Reunião Diretores', 'Visita a Concessionária', 'Treinamento Equipe', 'Reunião Conselho']} />
          <SideList title="Lembretes" items={['Enviar relatório semanal', 'Renovar seguro dos veículos', 'Revisar contratos de financiamento']} />
        </div>
      </div>
    </div>
  )
}
