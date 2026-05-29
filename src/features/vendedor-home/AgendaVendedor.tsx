import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Phone, Handshake, RefreshCcw, Truck } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'
import { useVendedorHomePage } from './hooks/useVendedorHomePage'

type AgendaItem = {
  time: string
  title: string
  detail: string
  badge: string
  tone: 'info' | 'success' | 'warning' | 'neutral'
  icon: React.ReactNode
  durationMin: number
}

const baseAgenda: AgendaItem[] = [
  { time: '09:00', title: 'Reunião com cliente - Onix LT 1.0', detail: 'João Pereira - Negociação', badge: 'Negociação', tone: 'info', icon: <Handshake size={16} />, durationMin: 60 },
  { time: '10:30', title: 'Visita agendada - Tracker Premier', detail: 'Maria Souza - Agendado', badge: 'Agendado', tone: 'success', icon: <CalendarDays size={16} />, durationMin: 45 },
  { time: '14:00', title: 'Retorno - S10 LTZ', detail: 'Carlos Lima - Retorno', badge: 'Retorno', tone: 'warning', icon: <RefreshCcw size={16} />, durationMin: 30 },
  { time: '15:30', title: 'Negociação - Compass Longitude', detail: 'Ana Costa - Negociação', badge: 'Negociação', tone: 'info', icon: <Handshake size={16} />, durationMin: 60 },
  { time: '17:00', title: 'Entrega - Onix Plus LT', detail: 'Fernando Alves - Entrega', badge: 'Entrega', tone: 'neutral', icon: <Truck size={16} />, durationMin: 45 },
]

const toneClasses: Record<AgendaItem['tone'], { badge: string; left: string; icon: string }> = {
  info: { badge: 'bg-status-info-surface text-status-info', left: 'bg-status-info', icon: 'bg-status-info-surface text-status-info' },
  success: { badge: 'bg-status-success-surface text-status-success', left: 'bg-status-success', icon: 'bg-status-success-surface text-status-success' },
  warning: { badge: 'bg-status-warning-surface text-status-warning', left: 'bg-status-warning', icon: 'bg-status-warning-surface text-status-warning' },
  neutral: { badge: 'bg-surface-alt text-text-secondary', left: 'bg-text-tertiary', icon: 'bg-surface-alt text-text-secondary' },
}

const monthLabels = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const dayShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export default function AgendaVendedor() {
  const { metrics, referenceDate, referenceDateLabel } = useVendedorHomePage()
  const agendamentosHoje = metrics?.agendamentosHoje ?? 0
  const atividadesHoje = baseAgenda.length
  const referenceMoment = useMemo(() => {
    const [y, m, d] = referenceDate.split('-').map(Number)
    return new Date(y, (m || 1) - 1, d || 1)
  }, [referenceDate])
  const [selected, setSelected] = useState<Date>(referenceMoment)
  const [cursor, setCursor] = useState<Date>(new Date(referenceMoment.getFullYear(), referenceMoment.getMonth(), 1))

  const calendarDays = useMemo(() => {
    const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const dayOfWeek = firstDay.getDay()
    const cells: Array<{ date: Date; isCurrentMonth: boolean }> = []
    // previous month padding
    for (let i = 0; i < dayOfWeek; i++) {
      const d = new Date(firstDay)
      d.setDate(d.getDate() - (dayOfWeek - i))
      cells.push({ date: d, isCurrentMonth: false })
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), day), isCurrentMonth: true })
    }
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date
      const next = new Date(last)
      next.setDate(next.getDate() + 1)
      cells.push({ date: next, isCurrentMonth: false })
    }
    return cells
  }, [cursor])

  const isToday = (d: Date) => {
    const today = new Date()
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }
  const isSelected = (d: Date) => d.getDate() === selected.getDate() && d.getMonth() === selected.getMonth() && d.getFullYear() === selected.getFullYear()
  const selectedLabel = `${dayShort[selected.getDay()].toLowerCase() === 'd' ? 'Domingo' : ''}${selected.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}`
  const totalMinutes = baseAgenda.reduce((acc, item) => acc + item.durationMin, 0)
  const hours = Math.floor(totalMinutes / 60)
  const remaining = totalMinutes % 60

  return (
    <div className="flex flex-col gap-mx-lg p-mx-lg pb-28">
      <header className="flex flex-col gap-mx-md border-b border-border-subtle pb-mx-lg lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Typography variant="h1" className="text-3xl md:text-4xl">Minha Agenda</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs">Organize seu dia e foque no que realmente importa.</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-black uppercase tracking-widest">Referência: {referenceDateLabel}</Typography>
        </div>
        <div className="flex flex-wrap gap-mx-sm">
          <Link
            to="/lancamento-diario"
            className="flex h-mx-11 items-center gap-mx-xs rounded-mx-xl bg-status-info px-mx-md text-sm font-black text-white hover:bg-status-info/90 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-info/30"
          >
            <Plus size={16} /> Novo Compromisso
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-mx-md xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        {/* Calendário mensal */}
        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center justify-between mb-mx-sm">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="h-mx-9 w-mx-9 rounded-mx-lg flex items-center justify-center text-text-tertiary hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
            >
              <ChevronLeft size={16} />
            </button>
            <Typography variant="h3" className="text-base font-black">{monthLabels[cursor.getMonth()]} {cursor.getFullYear()}</Typography>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="h-mx-9 w-mx-9 rounded-mx-lg flex items-center justify-center text-text-tertiary hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-mx-tiny text-center">
            {dayShort.map((d, i) => (
              <div key={`hdr-${i}`} className="text-mx-tiny font-black uppercase text-text-tertiary py-mx-xs">{d}</div>
            ))}
            {calendarDays.map((cell, i) => {
              const today = isToday(cell.date)
              const sel = isSelected(cell.date)
              return (
                <button
                  key={`cell-${i}`}
                  type="button"
                  onClick={() => setSelected(cell.date)}
                  className={cn(
                    'aspect-square rounded-mx-lg flex items-center justify-center text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30',
                    !cell.isCurrentMonth && 'text-text-tertiary/40',
                    cell.isCurrentMonth && !sel && !today && 'text-text-secondary hover:bg-surface-alt',
                    today && !sel && 'bg-status-info/10 text-status-info ring-2 ring-status-info/30',
                    sel && 'bg-status-info text-white shadow-mx-sm',
                  )}
                  aria-pressed={sel}
                  aria-label={`Selecionar ${cell.date.toLocaleDateString('pt-BR')}`}
                >
                  {cell.date.getDate()}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Timeline do dia selecionado */}
        <Card className="rounded-mx-2xl bg-white p-mx-lg shadow-mx-sm border-none">
          <div className="flex items-center justify-between gap-mx-md flex-wrap">
            <div>
              <Typography variant="h3" className="text-xl font-black capitalize">{selectedLabel}</Typography>
              <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-black uppercase tracking-widest">{baseAgenda.length} compromissos · {hours}h{remaining ? ` ${remaining}min` : ''}</Typography>
            </div>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">
              {agendamentosHoje} agendamentos · {atividadesHoje} atividades
            </Typography>
          </div>

          <div className="mt-mx-lg flex flex-col gap-mx-sm">
            {baseAgenda.map((item) => {
              const tone = toneClasses[item.tone]
              return (
                <div key={`${item.time}-${item.title}`} className="flex gap-mx-sm rounded-mx-xl border border-border-default bg-white p-mx-sm">
                  <div className={cn('w-1 shrink-0 rounded-mx-full', tone.left)} aria-hidden="true" />
                  <div className="flex h-mx-11 w-mx-12 shrink-0 items-center justify-center rounded-mx-lg bg-surface-alt text-mx-tiny font-black uppercase text-text-secondary">
                    {item.time}
                  </div>
                  <span className={cn('flex h-mx-9 w-mx-9 shrink-0 items-center justify-center rounded-mx-lg', tone.icon)} aria-hidden="true">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Typography variant="p" className="font-black leading-tight">{item.title}</Typography>
                    <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-bold normal-case tracking-normal">{item.detail}</Typography>
                  </div>
                  <div className="flex flex-col items-end gap-mx-xs shrink-0">
                    <span className={cn('inline-flex rounded-mx-full px-mx-sm py-mx-tiny text-mx-tiny font-black uppercase tracking-tight', tone.badge)}>{item.badge}</span>
                    <span className="text-mx-tiny text-text-tertiary">{item.durationMin}min</span>
                  </div>
                </div>
              )
            })}
          </div>

          <Link
            to="/lancamento-diario"
            className="mt-mx-lg flex h-mx-12 w-full items-center justify-center gap-mx-xs rounded-mx-xl bg-status-info text-white text-sm font-black hover:bg-status-info/90 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-info/30"
          >
            <Plus size={16} /> Nova Atividade
          </Link>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-mx-md md:grid-cols-3">
        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-9 w-mx-9 items-center justify-center rounded-mx-lg bg-status-info-surface text-status-info" aria-hidden="true">
              <Phone size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Próxima ligação</Typography>
          </div>
          <Typography variant="h3" className="mt-mx-sm text-lg font-black">João Pereira</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-bold normal-case">09:00 · Onix LT 1.0</Typography>
        </Card>

        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-9 w-mx-9 items-center justify-center rounded-mx-lg bg-status-success-surface text-status-success" aria-hidden="true">
              <CalendarDays size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Próxima visita</Typography>
          </div>
          <Typography variant="h3" className="mt-mx-sm text-lg font-black">Maria Souza</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-bold normal-case">10:30 · Tracker Premier</Typography>
        </Card>

        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-9 w-mx-9 items-center justify-center rounded-mx-lg bg-status-warning-surface text-status-warning" aria-hidden="true">
              <Truck size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Próxima entrega</Typography>
          </div>
          <Typography variant="h3" className="mt-mx-sm text-lg font-black">Fernando Alves</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-bold normal-case">17:00 · Onix Plus LT</Typography>
        </Card>
      </section>
    </div>
  )
}
