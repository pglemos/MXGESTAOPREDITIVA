import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import type { OwnerPerformanceAlert } from '../PerformanceAlerts'
import { toneClasses, type KpiTone } from './types'
import { SectionTitle, SideList } from './primitives'

export function AgendaView({ alerts }: { alerts: OwnerPerformanceAlert[] }) {
  const agenda = [
    { time: '07:30', title: 'Revisão de Indicadores Diários', detail: 'Análise dos principais indicadores da loja', tone: 'info' as KpiTone },
    { time: '08:00', title: 'Reunião Matinal - Comercial', detail: 'Alinhamento de metas e ações da equipe comercial', tone: 'success' as KpiTone },
    { time: '09:00', title: 'Avaliação de Veículos', detail: 'Avaliação de estoque e precificação', tone: 'brand' as KpiTone },
    { time: '13:30', title: 'Revisão de Planos de Ação', detail: 'Acompanhamento das ações em andamento', tone: 'info' as KpiTone },
    { time: '16:00', title: alerts[0]?.title || 'Follow-up Clientes Prioritários', detail: alerts[0]?.action || 'Contato com clientes e negociações ativas', tone: alerts[0]?.variant === 'danger' ? 'danger' : 'warning' as KpiTone },
  ]

  return (
    <div className="space-y-mx-md">
      <div className="flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between">
        <SectionTitle title="Agenda Executiva" subtitle="Visão diária, semanal e mensal dos compromissos e prioridades." />
        {/* Criar compromisso / sincronizar Google ainda não implementados nesta seção
            (useCentralMxAgenda é read-only). Botões sem handler removidos para não
            exibir ações sem efeito ao usuário; criar evento é um épico separado. */}
      </div>
      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Card className="rounded-mx-2xl p-mx-lg">
          <Typography variant="h3" className="text-xl font-black">Maio 2026</Typography>
          <div className="mt-mx-md grid grid-cols-7 gap-mx-xs text-center text-xs font-black">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <span key={`${day}-${index}`} className="text-text-tertiary">{day}</span>)}
            {Array.from({ length: 35 }, (_, index) => (
              <span key={index} className={cn('rounded-mx-lg py-mx-xs', index === 18 ? 'bg-brand-primary text-white' : 'text-text-primary')}>{index + 1 <= 31 ? index + 1 : ''}</span>
            ))}
          </div>
          <SideList className="mt-mx-lg" title="Calendários" items={['Agenda Executiva', 'Reuniões', 'Visitas / Avaliações', 'Lembretes']} />
        </Card>
        <Card className="rounded-mx-2xl p-mx-lg">
          <Typography variant="h3" className="text-xl font-black">Segunda-feira, 19 de Maio</Typography>
          <div className="mt-mx-md space-y-mx-sm">
            {agenda.map(item => {
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
            })}
          </div>
        </Card>
        <div className="space-y-mx-md">
          <SideList title="Prioridades do Dia" items={agenda.slice(0, 3).map(item => item.title)} />
          <SideList title="Próximos Compromissos" items={['Reunião Diretores', 'Visita a Concessionária', 'Treinamento Equipe', 'Reunião Conselho']} />
          <SideList title="Lembretes" items={['Enviar relatório semanal', 'Renovar seguro dos veículos', 'Revisar contratos de financiamento']} />
        </div>
      </div>
    </div>
  )
}
