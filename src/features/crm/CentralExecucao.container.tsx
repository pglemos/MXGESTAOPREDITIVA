import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlarmClock,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  CircleDollarSign,
  Info,
  MessageCircle,
  MoreHorizontal,
  RotateCcw,
  Target,
} from 'lucide-react'

import { Button } from '@/components/atoms/Button'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Select } from '@/components/atoms/Select'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { FormField } from '@/components/molecules/FormField'
import { PageHeading } from '@/components/molecules/PageHeading'
import { TabNav } from '@/components/molecules/TabNav'
import { Modal } from '@/components/organisms/Modal'
import { calculateReferenceDate, useCheckinsToday } from '@/hooks/checkins'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  toDateOnlyBR,
  CRM_AGENDAMENTO_STATUS_LABEL,
  type CrmAgendamentoStatus,
  type CrmAgendamentoTipo,
  type CrmCanal,
  type CrmFinanciamento,
  type CrmTipoVeiculo,
} from '@/lib/schemas/crm.schema'
import { timestampMatchesDateOnly } from '@/features/checkin/lib/clientes-list-from-crm'
import { getSPHoursMinutes } from '@/features/checkin/hooks/useCheckinPage'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { useVendedorPerfil } from '@/features/crm/hooks/useVendedorPerfil'
import { useScoreRotina, type ScoreRotinaItem } from '@/features/crm/hooks/useScoreRotina'
import {
  TIPO_ACAO_LABEL,
  useRoutinePlaybook,
  type ProspectingScheduleRow,
  type RoutineAtalho,
  type RoutineSlot,
} from '@/features/crm/hooks/useRoutinePlaybook'
import { deriveAgendaHojeFromCrm, type AgendaHojeItem } from '@/features/crm/lib/agenda-hoje'

const CENTRAL_TABS = [
  { key: 'hoje' as const, label: 'Hoje' },
  { key: 'rotina' as const, label: 'Rotina do Dia' },
]
type CentralTab = (typeof CENTRAL_TABS)[number]['key']

const MOTIVOS_PERDA = [
  'Cliente parou de responder',
  'Avaliação do usado não agradou',
  'Parcela acima da expectativa',
  'Comprou na concorrência',
  'Irá comprar em outro momento',
  'Não gostou do carro',
  'Outros',
]

const CANAL_TONE: Record<string, string> = {
  Carteira: 'bg-status-success-surface text-status-success border-status-success/20',
  Internet: 'bg-status-info-surface text-status-info border-status-info/20',
  Showroom: 'bg-status-warning-surface text-status-warning border-status-warning/20',
}

const STATUS_TONE: Record<CrmAgendamentoStatus, string> = {
  confirmado: 'bg-status-success-surface text-status-success border-status-success/20',
  aguardando: 'bg-status-info-surface text-status-info border-status-info/20',
  compareceu: 'bg-status-success-surface text-status-success border-status-success/20',
  nao_compareceu: 'bg-status-error-surface text-status-error border-status-error/20',
}

function Pill({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={cn('inline-flex shrink-0 rounded-mx-sm border px-2.5 py-1 text-xs font-bold', className)}>{children}</span>
}

function onlyDigits(value: string | null | undefined) {
  return (value || '').replace(/\D/g, '')
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function slotMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

function fmtMoeda(value: number | null) {
  if (!value) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function getDateLabel(date: Date) {
  const dateLabel = date.toLocaleDateString('pt-BR')
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' })
  return `${dateLabel} (${weekday.charAt(0).toUpperCase()}${weekday.slice(1)})`
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  tone: 'green' | 'red' | 'orange' | 'blue'
}) {
  const toneClass = {
    green: 'bg-status-success-surface text-status-success',
    red: 'bg-status-error-surface text-status-error',
    orange: 'bg-status-warning-surface text-status-warning',
    blue: 'bg-status-info-surface text-status-info',
  }[tone]

  return (
    <Card className="h-full min-h-[116px] rounded-mx-lg border border-border-subtle bg-white p-mx-xs shadow-mx-sm">
      <div className="flex h-full min-w-0 flex-col justify-center gap-mx-xs">
        <Typography variant="caption" className="block min-w-0 whitespace-normal text-center text-[11px] font-bold leading-snug tracking-normal text-text-primary">{label}</Typography>
        <div className="flex min-w-0 items-center gap-mx-xs">
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4', toneClass)}>{icon}</span>
          <div className="min-w-0">
            <Typography variant="h2" className="text-2xl leading-none text-text-primary">{value}</Typography>
            <Typography variant="caption" tone="muted" className="mt-mx-xs block text-[11px] font-bold leading-tight tracking-normal">{hint}</Typography>
          </div>
        </div>
      </div>
    </Card>
  )
}

function ScoreCard({ score, items }: { score: number; items: ScoreRotinaItem[] }) {
  return (
    <Card className="h-full min-h-[116px] rounded-mx-lg border border-border-subtle bg-white p-mx-xs shadow-mx-sm">
      <div className="grid h-full grid-cols-[72px_minmax(0,1fr)] items-center gap-mx-xs">
        <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--color-brand-primary) ${score * 3.6}deg, var(--color-border-subtle) 0deg)` }}>
          <div className="flex h-[54px] w-[54px] flex-col items-center justify-center rounded-full bg-white">
            <Typography variant="h2" className="text-2xl leading-none text-brand-primary">{score}%</Typography>
            <Typography variant="tiny" className="font-bold leading-none tracking-normal text-brand-primary">{score >= 70 ? 'Bom!' : 'Foco!'}</Typography>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-mx-tiny">
            <Typography variant="caption" className="font-bold tracking-normal text-text-primary">Score da Rotina</Typography>
            <Info size={12} className="shrink-0 text-text-tertiary" />
          </div>
          <div className="mt-2 space-y-1.5">
            {items.map(item => (
              <div key={item.label} className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-1.5 text-[11px]">
                <span className={cn('flex h-3 w-3 items-center justify-center rounded-full text-white', item.done ? 'bg-status-success' : 'border border-border-strong bg-white')} />
                <span className="font-semibold leading-tight text-text-secondary">{item.compactLabel || item.label}</span>
                <span className={cn('font-bold', item.done ? 'text-brand-primary' : 'text-text-tertiary')}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function AtalhoButton({ atalho, onTabChange, onInfo }: { atalho: RoutineAtalho; onTabChange: (tab: CentralTab) => void; onInfo: (label: string) => void }) {
  if (atalho.type === 'tab') {
    return (
      <Button variant="outline" size="sm" className="h-mx-9 bg-white text-xs" onClick={() => onTabChange(atalho.target as CentralTab)}>
        {atalho.label}
      </Button>
    )
  }
  if (atalho.type === 'route' && atalho.target) {
    return (
      <Button asChild variant="outline" size="sm" className="h-mx-9 bg-white text-xs">
        <Link to={atalho.target}>{atalho.label}</Link>
      </Button>
    )
  }
  return (
    <Button variant="ghost" size="sm" className="h-mx-9 text-xs text-text-tertiary" onClick={() => onInfo(atalho.label)}>
      {atalho.label}
    </Button>
  )
}

export function CentralExecucao() {
  const { profile, activeStoreId, storeId } = useAuth()
  const effectiveStoreId = activeStoreId || storeId || null
  const referenceDate = calculateReferenceDate()
  const { todayCheckin } = useCheckinsToday(profile, effectiveStoreId, referenceDate)

  const { oportunidades, updateOportunidade } = useOportunidades()
  const { agendamentos, updateAgendamento } = useAgendamentos()
  const { clientes } = useClientes()
  const { perfil } = useVendedorPerfil()

  const [tab, setTab] = useState<CentralTab>('hoje')
  const [reagendarItem, setReagendarItem] = useState<AgendaHojeItem | null>(null)
  const [reagendarValor, setReagendarValor] = useState('')
  const [vendaItem, setVendaItem] = useState<AgendaHojeItem | null>(null)
  const [vendaForm, setVendaForm] = useState({ valorNegociado: '', financiamento: 'nao_aplica' as CrmFinanciamento, carroAvaliado: false, sinal: '' })
  const [perdaItem, setPerdaItem] = useState<AgendaHojeItem | null>(null)
  const [perdaMotivo, setPerdaMotivo] = useState('')
  const [maisAcoesItem, setMaisAcoesItem] = useState<AgendaHojeItem | null>(null)
  const [verComoFazerOpen, setVerComoFazerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const hoje = useMemo(() => new Date(), [])
  const hojeStr = useMemo(() => toDateOnlyBR(), [])

  const agendaHojeItems = useMemo(
    () => deriveAgendaHojeFromCrm(oportunidades, agendamentos, hojeStr, hoje),
    [oportunidades, agendamentos, hojeStr, hoje],
  )

  const clientesCriadosHoje = useMemo(
    () => clientes.filter(c => timestampMatchesDateOnly(c.created_at, hojeStr)).length,
    [clientes, hojeStr],
  )

  const { score, items: scoreItems } = useScoreRotina({ clientesCriadosHoje, fechamentoFeito: Boolean(todayCheckin) })

  const agendamentosHojeTodos = useMemo(
    () => agendamentos.filter(a => timestampMatchesDateOnly(a.data_hora, hojeStr)),
    [agendamentos, hojeStr],
  )
  const compareceramHoje = agendamentosHojeTodos.filter(a => a.status === 'compareceu').length
  const vendasRealizadasHoje = useMemo(
    () => oportunidades.filter(o => o.etapa === 'ganho' && timestampMatchesDateOnly(o.closed_at, hojeStr)).length,
    [oportunidades, hojeStr],
  )

  const { slots, currentSlot, prospeccaoHoje, storyIdeaHoje, conflitoCliente } = useRoutinePlaybook({
    workStartTime: perfil.hora_entrada,
    lunchEndTime: perfil.hora_almoco_fim,
    workEndTime: perfil.hora_saida,
    agendaHojeItems,
  })
  const nowMinutesForTimeline = useMemo(() => {
    const { hours, minutes } = getSPHoursMinutes()
    return hours * 60 + minutes
  }, [])

  function openReagendar(item: AgendaHojeItem) {
    setReagendarItem(item)
    setReagendarValor(new Date(item.horario).toISOString().slice(0, 16))
  }

  async function confirmReagendar() {
    if (!reagendarItem || !reagendarValor) return
    setSaving(true)
    const ag = reagendarItem.agendamento
    const { error } = await updateAgendamento(ag.id, {
      cliente_id: ag.cliente_id,
      oportunidade_id: ag.oportunidade_id,
      data_hora: reagendarValor,
      canal: ag.canal as CrmCanal | null,
      tipo: ag.tipo as CrmAgendamentoTipo,
      status: ag.status as CrmAgendamentoStatus,
      proxima_acao: ag.proxima_acao,
      observacoes: ag.observacoes,
    })
    setSaving(false)
    if (error) { toast.error(error); return }
    setReagendarItem(null)
    const novaData = toDateOnlyBR(new Date(reagendarValor))
    if (novaData !== hojeStr) {
      toast.success('Cliente reagendado. Ele continuará disponível na Carteira de Clientes.')
    } else {
      toast.success('Agendamento atualizado.')
    }
  }

  function openVenda(item: AgendaHojeItem) {
    setVendaItem(item)
    setVendaForm({
      valorNegociado: item.oportunidade.valor_negociado ? String(item.oportunidade.valor_negociado) : '',
      financiamento: (item.oportunidade.financiamento as CrmFinanciamento) || 'nao_aplica',
      carroAvaliado: item.oportunidade.carro_avaliado,
      sinal: item.oportunidade.sinal ? String(item.oportunidade.sinal) : '',
    })
  }

  async function confirmVenda() {
    if (!vendaItem) return
    const valor = Number(vendaForm.valorNegociado.replace(/\D/g, '')) || 0
    if (valor <= 0) { toast.error('Informe o valor negociado.'); return }
    setSaving(true)
    const op = vendaItem.oportunidade
    const { error } = await updateOportunidade(op.id, {
      cliente_id: op.cliente_id,
      veiculo_interesse: op.veiculo_interesse,
      tipo_veiculo: op.tipo_veiculo as CrmTipoVeiculo | null,
      valor_negociado: valor,
      etapa: 'ganho',
      canal: op.canal as CrmCanal | null,
      sinal: Number(vendaForm.sinal.replace(/\D/g, '')) || 0,
      financiamento: vendaForm.financiamento,
      carro_avaliado: vendaForm.carroAvaliado,
      closed_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) { toast.error(error); return }
    setVendaItem(null)
    toast.success('Venda registrada com sucesso.')
  }

  function openPerda(item: AgendaHojeItem) {
    setPerdaItem(item)
    setPerdaMotivo(item.oportunidade.motivo_perda || '')
  }

  async function confirmPerda() {
    if (!perdaItem) return
    if (!perdaMotivo) { toast.error('Selecione o motivo da perda.'); return }
    setSaving(true)
    const op = perdaItem.oportunidade
    const { error } = await updateOportunidade(op.id, {
      cliente_id: op.cliente_id,
      veiculo_interesse: op.veiculo_interesse,
      tipo_veiculo: op.tipo_veiculo as CrmTipoVeiculo | null,
      valor_negociado: op.valor_negociado,
      etapa: 'perdido',
      canal: op.canal as CrmCanal | null,
      sinal: op.sinal,
      financiamento: op.financiamento as CrmFinanciamento,
      carro_avaliado: op.carro_avaliado,
      motivo_perda: perdaMotivo,
      closed_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) { toast.error(error); return }
    setPerdaItem(null)
    toast.success('Perda registrada.')
  }

  function openWhatsApp(item: AgendaHojeItem) {
    const tel = onlyDigits(item.clienteTelefone)
    if (!tel) { toast.error('Cliente sem telefone cadastrado.'); return }
    const num = tel.length <= 11 ? `55${tel}` : tel
    window.open(`https://wa.me/${num}`, '_blank', 'noopener')
  }

  return (
    <main className="h-full w-full min-w-0 overflow-y-auto bg-surface-alt px-mx-sm pb-mx-sm pt-0 no-scrollbar sm:px-mx-md sm:pb-mx-md 2xl:px-mx-lg 2xl:pb-mx-lg">
      <div className="flex min-w-0 flex-col gap-mx-lg pb-20">
        <header className="relative z-40 -mx-mx-sm shrink-0 border-b border-border-default/60 bg-surface-alt px-mx-sm pb-3 pt-2 shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:-mx-mx-md sm:px-mx-md md:sticky md:top-0 md:pt-3 2xl:-mx-mx-lg 2xl:px-mx-lg">
          <PageHeading
            title="Central de Execução"
            subtitle="Organize seu dia e foque no que gera resultado."
            actions={(
              <span className="inline-flex h-10 shrink-0 items-center gap-mx-xs whitespace-nowrap rounded-mx-md border border-border-subtle bg-white px-2 text-[11px] font-bold text-text-primary shadow-mx-sm">
                <Calendar size={14} className="text-text-secondary" />
                {getDateLabel(hoje)}
              </span>
            )}
          />
        </header>

        <TabNav tabs={CENTRAL_TABS} activeTab={tab} onTabChange={setTab} />

        {tab === 'hoje' ? (
          <div className="flex min-w-0 flex-col gap-mx-md">
            <div>
              <Typography variant="h3" className="tracking-normal text-text-primary">Agenda do Dia</Typography>
              <Typography variant="caption" tone="muted">Clientes e negociações que precisam da sua atenção hoje.</Typography>
            </div>

            <section className="grid min-w-0 grid-cols-2 gap-mx-sm md:grid-cols-3 xl:grid-cols-[repeat(4,minmax(112px,1fr))_minmax(220px,1.05fr)]" aria-label="Indicadores do dia">
              <MetricCard icon={<CalendarCheck size={24} />} label="Agendados Hoje" value={String(agendamentosHojeTodos.length)} hint="Compromissos do dia" tone="blue" />
              <MetricCard icon={<CheckCircle2 size={24} />} label="Compareceram" value={String(compareceramHoje)} hint="Atendimentos feitos" tone="green" />
              <MetricCard icon={<Clock size={24} />} label="Em Negociação" value={String(agendaHojeItems.length)} hint="Aguardando você hoje" tone="orange" />
              <MetricCard icon={<CircleDollarSign size={24} />} label="Vendas Realizadas Hoje" value={String(vendasRealizadasHoje)} hint="Fechadas hoje" tone="green" />
              <ScoreCard score={score} items={scoreItems} />
            </section>

            {agendaHojeItems.length === 0 ? (
              <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-xl shadow-mx-sm">
                <EmptyState
                  title="Nenhum cliente agendado para hoje."
                  description="Use este momento para avançar na sua Rotina do Dia ou trabalhar sua Carteira de Clientes."
                  action={(
                    <div className="flex flex-wrap justify-center gap-mx-sm">
                      <Button variant="outline" onClick={() => setTab('rotina')}>Ver Rotina do Dia</Button>
                      <Button asChild><Link to="/carteira-clientes">Abrir Carteira de Clientes</Link></Button>
                    </div>
                  )}
                />
              </Card>
            ) : (
              <>
                <Card className="hidden overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-md md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] table-fixed text-left text-sm">
                      <thead className="bg-surface-alt/70 text-text-secondary">
                        <tr>
                          <th className="px-mx-sm py-mx-sm text-[13px] font-bold">Horário</th>
                          <th className="px-mx-sm py-mx-sm text-[13px] font-bold">Cliente / Contato</th>
                          <th className="px-mx-sm py-mx-sm text-[13px] font-bold">Veículo de Interesse</th>
                          <th className="px-mx-sm py-mx-sm text-[13px] font-bold">Canal</th>
                          <th className="px-mx-sm py-mx-sm text-[13px] font-bold">Status</th>
                          <th className="px-mx-sm py-mx-sm text-[13px] font-bold">Próxima Ação</th>
                          <th className="px-mx-sm py-mx-sm text-right text-[13px] font-bold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agendaHojeItems.map(item => (
                          <tr key={item.id} className={cn('border-t border-border-subtle align-middle hover:bg-surface-alt/60', item.atrasadoNaoTratado && 'bg-status-error-surface/20')}>
                            <td className="px-mx-sm py-mx-md">
                              <Typography variant="p" className={cn('font-bold', item.atrasadoNaoTratado ? 'text-status-error' : 'text-brand-primary')}>{fmtHora(item.horario)}</Typography>
                            </td>
                            <td className="px-mx-sm py-mx-md">
                              <Typography variant="p" className="font-bold leading-tight text-text-primary">{item.clienteNome || 'Cliente sem nome'}</Typography>
                              <Typography variant="caption" tone="muted">{item.clienteTelefone || 'Telefone não cadastrado'}</Typography>
                            </td>
                            <td className="px-mx-sm py-mx-md">
                              <Typography variant="p" className="font-bold leading-tight text-text-primary">{item.veiculoInteresse || '—'}</Typography>
                              <Typography variant="caption" tone="muted">{fmtMoeda(item.valorNegociado)}</Typography>
                            </td>
                            <td className="px-mx-sm py-mx-md"><Pill className={CANAL_TONE[item.canal]}>{item.canal}</Pill></td>
                            <td className="px-mx-sm py-mx-md"><Pill className={STATUS_TONE[item.agendamento.status as CrmAgendamentoStatus] || STATUS_TONE.aguardando}>{CRM_AGENDAMENTO_STATUS_LABEL[item.agendamento.status as CrmAgendamentoStatus] || item.agendamento.status}</Pill></td>
                            <td className="px-mx-sm py-mx-md"><Typography variant="caption" className="font-bold text-text-secondary">{item.proximaAcao || 'Definir próxima ação'}</Typography></td>
                            <td className="px-mx-sm py-mx-md">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="outline" size="icon" aria-label="WhatsApp" title="WhatsApp" onClick={() => openWhatsApp(item)} className="h-7 w-7 rounded-mx-sm border-status-success/30 bg-white text-status-success [&_svg]:size-3.5"><MessageCircle size={14} /></Button>
                                <Button variant="outline" size="icon" aria-label="Reagendar" title="Reagendar" onClick={() => openReagendar(item)} className="h-7 w-7 rounded-mx-sm border-brand-primary/30 bg-white text-brand-primary [&_svg]:size-3.5"><RotateCcw size={14} /></Button>
                                <Button variant="ghost" size="icon" aria-label="Mais ações" title="Mais ações" onClick={() => setMaisAcoesItem(item)} className="h-7 w-7 rounded-mx-sm border border-border-subtle bg-white [&_svg]:size-3.5"><MoreHorizontal size={15} /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <div className="flex flex-col gap-mx-sm md:hidden">
                  {agendaHojeItems.map(item => (
                    <Card key={item.id} className={cn('rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm', item.atrasadoNaoTratado && 'border-status-error/30 bg-status-error-surface/20')}>
                      <div className="flex items-start justify-between gap-mx-sm">
                        <div className="min-w-0">
                          <Typography variant="p" className={cn('font-bold', item.atrasadoNaoTratado ? 'text-status-error' : 'text-brand-primary')}>{fmtHora(item.horario)}</Typography>
                          <Typography variant="p" className="font-bold leading-tight text-text-primary">{item.clienteNome || 'Cliente sem nome'}</Typography>
                          <Typography variant="caption" tone="muted">{item.clienteTelefone || 'Telefone não cadastrado'}</Typography>
                          <Typography variant="caption" className="mt-mx-xs block text-text-secondary">{item.veiculoInteresse || '—'} · {item.canal}</Typography>
                        </div>
                        <Pill className={STATUS_TONE[item.agendamento.status as CrmAgendamentoStatus] || STATUS_TONE.aguardando}>{CRM_AGENDAMENTO_STATUS_LABEL[item.agendamento.status as CrmAgendamentoStatus] || item.agendamento.status}</Pill>
                      </div>
                      <Typography variant="caption" className="mt-mx-sm block font-bold text-text-secondary">{item.proximaAcao || 'Definir próxima ação'}</Typography>
                      <div className="mt-mx-sm flex items-center gap-mx-xs">
                        <Button variant="outline" size="sm" onClick={() => openWhatsApp(item)} className="h-9 flex-1 border-status-success/30 bg-white text-status-success"><MessageCircle size={14} /> WhatsApp</Button>
                        <Button variant="outline" size="sm" onClick={() => openReagendar(item)} className="h-9 flex-1 border-brand-primary/30 bg-white text-brand-primary"><RotateCcw size={14} /> Reagendar</Button>
                        <Button variant="ghost" size="icon" aria-label="Mais ações" onClick={() => setMaisAcoesItem(item)} className="h-9 w-9 border border-border-subtle bg-white"><MoreHorizontal size={16} /></Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-mx-md">
              {conflitoCliente && (
                <Card className="rounded-mx-lg border border-status-warning/25 bg-status-warning-surface/35 p-mx-md shadow-mx-sm">
                  <Typography variant="p" className="text-sm font-bold text-status-warning">Você possui um cliente agendado neste horário. Priorize o atendimento e retome sua rotina depois.</Typography>
                </Card>
              )}

              {currentSlot?.template ? (
                <Card className="rounded-mx-lg border border-brand-primary/20 bg-white p-mx-lg shadow-mx-md">
                  <div className="flex items-center justify-between gap-mx-sm">
                    <Pill className="border-brand-primary/20 bg-brand-primary/10 text-brand-primary">Agora · {currentSlot.time}</Pill>
                    {currentSlot.template.duracao_minutos && <Typography variant="caption" tone="muted">{currentSlot.template.duracao_minutos} min sugeridos</Typography>}
                  </div>
                  <Typography variant="h2" className="mt-mx-sm text-xl text-text-primary">{currentSlot.template.nome}</Typography>
                  <Typography variant="p" tone="muted" className="mt-mx-tiny">{currentSlot.template.objetivo}</Typography>

                  {currentSlot.template.instrucoes.length > 0 && (
                    <ul className="mt-mx-md space-y-mx-xs">
                      {currentSlot.template.instrucoes.map((instrucao, index) => (
                        <li key={index} className="flex items-start gap-mx-xs text-sm text-text-secondary">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                          {instrucao}
                        </li>
                      ))}
                    </ul>
                  )}

                  {currentSlot.key === 'prospeccao' && (
                    <div className="mt-mx-md space-y-mx-sm">
                      {prospeccaoHoje.length === 0 ? (
                        <Typography variant="caption" tone="muted">Nenhuma ação de prospecção configurada para hoje.</Typography>
                      ) : prospeccaoHoje.map((acao: ProspectingScheduleRow) => (
                        <div key={acao.id} className="rounded-mx-md border border-border-subtle bg-surface-alt/60 p-mx-sm">
                          <Typography variant="p" className="font-bold text-text-primary">{TIPO_ACAO_LABEL[acao.tipo_acao] || acao.tipo_acao}</Typography>
                          <Typography variant="caption" tone="muted">{acao.objetivo}</Typography>
                          {acao.quantidade && <Typography variant="caption" className="mt-mx-tiny block font-bold text-text-secondary">Meta: {acao.quantidade} {acao.periodicidade} · Público: {acao.publico}</Typography>}
                        </div>
                      ))}
                      {storyIdeaHoje && (
                        <Button variant="outline" size="sm" className="bg-white" onClick={() => setVerComoFazerOpen(true)}>
                          <ChevronRight size={14} /> Ver como fazer
                        </Button>
                      )}
                    </div>
                  )}

                  {currentSlot.template.meta_sugerida && (
                    <div className="mt-mx-md rounded-mx-md border border-brand-primary/15 bg-brand-primary/5 px-mx-md py-mx-sm">
                      <Typography variant="caption" className="font-bold text-brand-primary">{currentSlot.template.meta_sugerida}</Typography>
                    </div>
                  )}

                  {currentSlot.template.atalhos.length > 0 && (
                    <div className="mt-mx-md flex flex-wrap gap-mx-xs">
                      {currentSlot.template.atalhos.map(atalho => (
                        <AtalhoButton key={atalho.label} atalho={atalho} onTabChange={setTab} onInfo={(label) => toast.info(label)} />
                      ))}
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
                  <Typography tone="muted">Carregando rotina do dia...</Typography>
                </Card>
              )}
            </div>

            <aside className="flex flex-col gap-mx-sm">
              <Typography variant="caption" tone="muted" className="font-bold uppercase tracking-mx-widest">Linha do tempo</Typography>
              {slots.map((slot: RoutineSlot) => {
                const isPast = !slot.isCurrent && slotMinutes(slot.time) < nowMinutesForTimeline
                return (
                  <div
                    key={slot.key}
                    className={cn(
                      'flex items-center gap-mx-sm rounded-mx-md border px-mx-sm py-mx-xs',
                      slot.isCurrent
                        ? 'border-brand-primary/30 bg-brand-primary/5'
                        : isPast
                          ? 'border-status-success/20 bg-status-success/5'
                          : 'border-border-subtle bg-white',
                    )}
                  >
                    <span className="flex w-12 shrink-0 items-center gap-1">
                      {isPast && <CheckCircle2 size={12} className="shrink-0 text-status-success" />}
                      <Typography variant="caption" className={cn('font-bold', slot.isCurrent ? 'text-brand-primary' : isPast ? 'text-status-success' : 'text-text-secondary')}>{slot.time}</Typography>
                    </span>
                    <Typography variant="caption" className={cn('font-semibold', isPast ? 'text-status-success' : 'text-text-primary')}>{slot.template?.nome || slot.key}</Typography>
                  </div>
                )
              })}
            </aside>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(reagendarItem)}
        onClose={() => setReagendarItem(null)}
        title="Reagendar"
        description="Escolha a nova data e horário do agendamento."
        footer={(
          <div className="flex justify-end gap-mx-sm">
            <Button variant="ghost" onClick={() => setReagendarItem(null)}>Cancelar</Button>
            <Button onClick={confirmReagendar} disabled={saving}>{saving ? 'Salvando...' : 'Confirmar'}</Button>
          </div>
        )}
      >
        <FormField type="datetime-local" label="Nova data e hora *" value={reagendarValor} onChange={event => setReagendarValor(event.target.value)} />
      </Modal>

      <Modal
        open={Boolean(vendaItem)}
        onClose={() => setVendaItem(null)}
        title="Registrar Venda"
        description="Confirme os dados da venda para atualizar o funil e o faturamento."
        footer={(
          <div className="flex justify-end gap-mx-sm">
            <Button variant="ghost" onClick={() => setVendaItem(null)}>Cancelar</Button>
            <Button onClick={confirmVenda} disabled={saving}>{saving ? 'Salvando...' : 'Confirmar venda'}</Button>
          </div>
        )}
      >
        <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2">
          <FormField label="Valor negociado *" value={vendaForm.valorNegociado} onChange={event => setVendaForm(current => ({ ...current, valorNegociado: event.target.value }))} placeholder="R$ 0,00" />
          <FormField label="Sinal (R$)" value={vendaForm.sinal} onChange={event => setVendaForm(current => ({ ...current, sinal: event.target.value }))} placeholder="R$ 0,00" />
          <Select label="Financiamento" value={vendaForm.financiamento} onChange={event => setVendaForm(current => ({ ...current, financiamento: event.target.value as CrmFinanciamento }))}>
            <option value="aprovado">Aprovado</option>
            <option value="reprovado">Recusado</option>
            <option value="nao_aplica">Não se aplica</option>
          </Select>
          <Select label="Carro avaliado" value={vendaForm.carroAvaliado ? 'sim' : 'nao'} onChange={event => setVendaForm(current => ({ ...current, carroAvaliado: event.target.value === 'sim' }))}>
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </Select>
        </div>
      </Modal>

      <Modal
        open={Boolean(perdaItem)}
        onClose={() => setPerdaItem(null)}
        title="Registrar Perda"
        description="Selecione o motivo para manter o histórico atualizado."
        footer={(
          <div className="flex justify-end gap-mx-sm">
            <Button variant="ghost" onClick={() => setPerdaItem(null)}>Cancelar</Button>
            <Button onClick={confirmPerda} disabled={saving}>{saving ? 'Salvando...' : 'Confirmar perda'}</Button>
          </div>
        )}
      >
        <Select label="Motivo da perda *" value={perdaMotivo} onChange={event => setPerdaMotivo(event.target.value)}>
          <option value="">Selecione</option>
          {MOTIVOS_PERDA.map(motivo => <option key={motivo} value={motivo}>{motivo}</option>)}
        </Select>
      </Modal>

      <Modal
        open={Boolean(maisAcoesItem)}
        onClose={() => setMaisAcoesItem(null)}
        title={maisAcoesItem?.clienteNome || 'Mais ações'}
        description="Escolha a próxima ação para este cliente."
      >
        <div className="flex flex-col gap-mx-xs">
          <Button variant="outline" className="justify-start bg-white" onClick={() => { if (maisAcoesItem) openVenda(maisAcoesItem); setMaisAcoesItem(null) }}><CircleDollarSign size={16} /> Registrar Venda</Button>
          <Button variant="outline" className="justify-start bg-white" onClick={() => { if (maisAcoesItem) openPerda(maisAcoesItem); setMaisAcoesItem(null) }}><AlarmClock size={16} /> Registrar Perda</Button>
          <Button asChild variant="outline" className="justify-start bg-white"><Link to="/carteira-clientes" onClick={() => setMaisAcoesItem(null)}><Target size={16} /> Abrir na Carteira de Clientes</Link></Button>
        </div>
      </Modal>

      <Modal
        open={verComoFazerOpen}
        onClose={() => setVerComoFazerOpen(false)}
        title={storyIdeaHoje?.titulo || 'Ver como fazer'}
        description="Roteiro sugerido para hoje."
      >
        <ol className="space-y-mx-xs">
          {(storyIdeaHoje?.passos || []).map((passo, index) => (
            <li key={index} className="flex items-start gap-mx-xs text-sm text-text-secondary">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-[11px] font-bold text-brand-primary">{index + 1}</span>
              {passo}
            </li>
          ))}
        </ol>
        {storyIdeaHoje?.chamada_para_acao && (
          <Typography variant="caption" className="mt-mx-md block font-bold text-brand-primary">Chamada para ação: {storyIdeaHoje.chamada_para_acao}</Typography>
        )}
      </Modal>
    </main>
  )
}

export default CentralExecucao
