import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Car, ChevronLeft, ChevronRight, Handshake, Plus, RefreshCcw, Truck } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { EmptyState } from '@/components/atoms/EmptyState'
import { cn } from '@/lib/utils'
import { useAgendamentos, type AgendamentoComCliente } from '@/features/crm/hooks/useAgendamentos'
import { CRM_AGENDAMENTO_STATUS_LABEL, type CrmAgendamentoTipo } from '@/lib/schemas/crm.schema'

type Tone = 'info' | 'success' | 'warning' | 'neutral'

const TIPO_META: Record<CrmAgendamentoTipo, { label: string; tone: Tone; icon: React.ReactNode }> = {
  visita: { label: 'Visita', tone: 'success', icon: <CalendarDays size={16} /> },
  retorno: { label: 'Retorno', tone: 'warning', icon: <RefreshCcw size={16} /> },
  test_drive: { label: 'Test drive', tone: 'info', icon: <Car size={16} /> },
  entrega: { label: 'Entrega', tone: 'neutral', icon: <Truck size={16} /> },
  negociacao: { label: 'Negociação', tone: 'info', icon: <Handshake size={16} /> },
}

const toneClasses: Record<Tone, { badge: string; left: string; icon: string }> = {
  info: { badge: 'bg-status-info-surface text-status-info', left: 'bg-status-info', icon: 'bg-status-info-surface text-status-info' },
  success: { badge: 'bg-status-success-surface text-status-success', left: 'bg-status-success', icon: 'bg-status-success-surface text-status-success' },
  warning: { badge: 'bg-status-warning-surface text-status-warning', left: 'bg-status-warning', icon: 'bg-status-warning-surface text-status-warning' },
  neutral: { badge: 'bg-surface-alt text-text-secondary', left: 'bg-text-tertiary', icon: 'bg-surface-alt text-text-secondary' },
}

const monthLabels = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const dayShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

function NextCard({ title, tone, icon, item }: { title: string; tone: Tone; icon: React.ReactNode; item: AgendamentoComCliente | null }) {
  const classes = toneClasses[tone]
  return (
    <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
      <div className="flex items-center gap-mx-sm">
        <span className={cn('flex h-mx-9 w-mx-9 items-center justify-center rounded-mx-lg', classes.icon)} aria-hidden="true">
          {icon}
        </span>
        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">{title}</Typography>
      </div>
      {item ? (
        <>
          <Typography variant="h3" className="mt-mx-sm text-lg font-black">{item.cliente?.nome || 'Cliente não informado'}</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-bold normal-case">
            {new Date(item.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {timeLabel(item.data_hora)}
            {item.oportunidade?.veiculo_interesse ? ` · ${item.oportunidade.veiculo_interesse}` : ''}
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="h3" className="mt-mx-sm text-lg font-black text-text-tertiary">—</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-bold normal-case">Sem agendamento futuro</Typography>
        </>
      )}
    </Card>
  )
}

export default function AgendaVendedor() {
  const { agendamentos, metrics, loading, error } = useAgendamentos()
  const hoje = useMemo(() => new Date(), [])
  const [selected, setSelected] = useState<Date>(hoje)
  const [cursor, setCursor] = useState<Date>(new Date(hoje.getFullYear(), hoje.getMonth(), 1))

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

  const countsByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of agendamentos) {
      const key = dayKey(new Date(a.data_hora))
      map.set(key, (map.get(key) || 0) + 1)
    }
    return map
  }, [agendamentos])

  const doDia = useMemo(
    () => agendamentos.filter(a => sameDay(new Date(a.data_hora), selected)),
    [agendamentos, selected],
  )

  const proximoPorTipo = useMemo(() => {
    const agora = new Date()
    const futuros = agendamentos.filter(a =>
      new Date(a.data_hora) >= agora && (a.status === 'aguardando' || a.status === 'confirmado'))
    const next = (tipo: CrmAgendamentoTipo) => futuros.find(a => a.tipo === tipo) || null
    return { visita: next('visita'), retorno: next('retorno'), entrega: next('entrega') }
  }, [agendamentos])

  const isToday = (d: Date) => sameDay(d, hoje)
  const isSelected = (d: Date) => sameDay(d, selected)
  const selectedLabel = selected.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <div className="flex flex-col gap-mx-lg p-mx-lg pb-28">
      <header className="flex flex-col gap-mx-md border-b border-border-subtle pb-mx-lg lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Typography variant="h1" className="text-3xl md:text-4xl">Minha Agenda</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs">Organize seu dia e foque no que realmente importa.</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-black uppercase tracking-widest">{metrics.agendamentosHoje} agendamentos hoje</Typography>
        </div>
        <div className="flex flex-wrap gap-mx-sm">
          <Link
            to="/central-execucao"
            className="flex h-mx-11 items-center gap-mx-xs rounded-mx-xl bg-status-info px-mx-md text-sm font-black text-white hover:bg-status-info/90 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-info/30"
          >
            <Plus size={16} /> Novo Compromisso
          </Link>
        </div>
      </header>

      {error && <Typography className="text-status-error">{error}</Typography>}

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
              const hasItems = (countsByDay.get(dayKey(cell.date)) || 0) > 0
              return (
                <button
                  key={`cell-${i}`}
                  type="button"
                  onClick={() => setSelected(cell.date)}
                  className={cn(
                    'relative aspect-square rounded-mx-lg flex items-center justify-center text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30',
                    !cell.isCurrentMonth && 'text-text-tertiary/40',
                    cell.isCurrentMonth && !sel && !today && 'text-text-secondary hover:bg-surface-alt',
                    today && !sel && 'bg-status-info/10 text-status-info ring-2 ring-status-info/30',
                    sel && 'bg-status-info text-white shadow-mx-sm',
                  )}
                  aria-pressed={sel}
                  aria-label={`Selecionar ${cell.date.toLocaleDateString('pt-BR')}`}
                >
                  {cell.date.getDate()}
                  {hasItems && (
                    <span
                      className={cn('absolute bottom-1 h-1 w-1 rounded-full', sel ? 'bg-white' : 'bg-status-info')}
                      aria-hidden="true"
                    />
                  )}
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
              <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-black uppercase tracking-widest">
                {doDia.length} compromisso{doDia.length === 1 ? '' : 's'}
              </Typography>
            </div>
          </div>

          <div className="mt-mx-lg flex flex-col gap-mx-sm">
            {loading && doDia.length === 0 && (
              <Typography variant="p" tone="muted">Carregando agenda…</Typography>
            )}
            {!loading && doDia.length === 0 && (
              <EmptyState
                title="Nada agendado neste dia"
                description="Crie um compromisso na Central de Execução para organizar seu dia."
              />
            )}
            {doDia.map((item) => {
              const meta = TIPO_META[item.tipo] || TIPO_META.visita
              const tone = toneClasses[meta.tone]
              const veiculo = item.oportunidade?.veiculo_interesse
              return (
                <div key={item.id} className="flex gap-mx-sm rounded-mx-xl border border-border-default bg-white p-mx-sm">
                  <div className={cn('w-1 shrink-0 rounded-mx-full', tone.left)} aria-hidden="true" />
                  <div className="flex h-mx-11 w-mx-12 shrink-0 items-center justify-center rounded-mx-lg bg-surface-alt text-mx-tiny font-black uppercase text-text-secondary">
                    {timeLabel(item.data_hora)}
                  </div>
                  <span className={cn('flex h-mx-9 w-mx-9 shrink-0 items-center justify-center rounded-mx-lg', tone.icon)} aria-hidden="true">
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Typography variant="p" className="font-black leading-tight">
                      {meta.label}{veiculo ? ` - ${veiculo}` : ''}
                    </Typography>
                    <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-bold normal-case tracking-normal">
                      {item.cliente?.nome || 'Cliente não informado'}{item.proxima_acao ? ` · ${item.proxima_acao}` : ''}
                    </Typography>
                  </div>
                  <div className="flex flex-col items-end gap-mx-xs shrink-0">
                    <span className={cn('inline-flex rounded-mx-full px-mx-sm py-mx-tiny text-mx-tiny font-black uppercase tracking-tight', tone.badge)}>{meta.label}</span>
                    <span className="text-mx-tiny text-text-tertiary">{CRM_AGENDAMENTO_STATUS_LABEL[item.status]}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <Link
            to="/central-execucao"
            className="mt-mx-lg flex h-mx-12 w-full items-center justify-center gap-mx-xs rounded-mx-xl bg-status-info text-white text-sm font-black hover:bg-status-info/90 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-info/30"
          >
            <Plus size={16} /> Nova Atividade
          </Link>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-mx-md md:grid-cols-3">
        <NextCard title="Próxima visita" tone="success" icon={<CalendarDays size={18} />} item={proximoPorTipo.visita} />
        <NextCard title="Próximo retorno" tone="warning" icon={<RefreshCcw size={18} />} item={proximoPorTipo.retorno} />
        <NextCard title="Próxima entrega" tone="neutral" icon={<Truck size={18} />} item={proximoPorTipo.entrega} />
      </section>
    </div>
  )
}
