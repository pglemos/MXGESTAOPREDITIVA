import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlarmClock,
  AlertTriangle,
  BookOpen,
  Brain,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  FolderOpen,
  Headphones,
  Inbox,
  Info,
  ListChecks,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Target,
  Truck,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  UserX,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/atoms/Button'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Select } from '@/components/atoms/Select'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { FormField } from '@/components/molecules/FormField'
import { SellerPageHeader } from '@/components/seller/SellerPageHeader'
import { TabNav } from '@/components/molecules/TabNav'
import { Modal } from '@/components/organisms/Modal'
import { cn } from '@/lib/utils'
import {
  normalizarTelefone,
  toDateOnlyBR,
  CRM_AGENDAMENTO_TIPO,
  CRM_AGENDAMENTO_TIPO_LABEL,
  type Cliente,
  type CrmAgendamentoStatus,
  type CrmAgendamentoTipo,
  type CrmCanal,
  type CrmFinanciamento,
  type CrmTipoVeiculo,
} from '@/lib/schemas/crm.schema'
import { timestampMatchesDateOnly } from '@/features/checkin/lib/clientes-list-from-crm'
import { getSPHoursMinutes } from '@/features/checkin/hooks/useCheckinPage'
import type { DailyRoutineAutoSlotKey } from '@/lib/daily-routine'
import { useAgendamentos, type AgendamentoComCliente } from '@/features/crm/hooks/useAgendamentos'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { useVendedorPerfil } from '@/features/crm/hooks/useVendedorPerfil'
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

// ── Aba "Hoje" — tipo de agendamento: ícone + cor do badge (paleta 1:1 com o Base44 AbaHoje.jsx) ──
const TIPO_ICON: Record<CrmAgendamentoTipo, LucideIcon> = {
  visita: Calendar,
  negociacao: Calendar,
  test_drive: Calendar,
  retorno: RefreshCw,
  entrega: Truck,
  garantia: Shield,
  pos_venda: Users,
}
const TIPO_BAR: Record<CrmAgendamentoTipo, string> = {
  visita: 'bg-blue-500',
  negociacao: 'bg-blue-500',
  test_drive: 'bg-blue-500',
  retorno: 'bg-amber-500',
  entrega: 'bg-purple-500',
  garantia: 'bg-orange-500',
  pos_venda: 'bg-teal-500',
}
const TIPO_BADGE: Record<CrmAgendamentoTipo, string> = {
  visita: 'bg-blue-50 text-blue-700',
  negociacao: 'bg-blue-50 text-blue-700',
  test_drive: 'bg-blue-50 text-blue-700',
  retorno: 'bg-amber-50 text-amber-700',
  entrega: 'bg-purple-50 text-purple-700',
  garantia: 'bg-orange-50 text-orange-700',
  pos_venda: 'bg-teal-50 text-teal-700',
}
// Prioridade base por tipo (menor = mais urgente) — mesma ordem do Base44
const TIPO_PRIORIDADE_BASE: Record<CrmAgendamentoTipo, number> = {
  visita: 1,
  negociacao: 1,
  test_drive: 1,
  entrega: 2,
  garantia: 3,
  retorno: 4,
  pos_venda: 5,
}
const FILTROS_TIPO: { id: CrmAgendamentoTipo | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todas' },
  ...CRM_AGENDAMENTO_TIPO.map(tipo => ({ id: tipo, label: CRM_AGENDAMENTO_TIPO_LABEL[tipo] })),
]
type OrdenarHoje = 'prioridade' | 'horario' | 'tipo' | 'cliente'

// Ícone por etapa da Rotina do Dia — 1:1 com o Base44 AbaRotina.jsx (ROUTINE_STEPS).
const STEP_ICON: Record<DailyRoutineAutoSlotKey, LucideIcon> = {
  mentalidade: Brain,
  organizacao: FolderOpen,
  novos_leads: UserPlus,
  prospeccao: Phone,
  atendimento: Headphones,
  lista_quente: ListChecks,
  fechamento: CheckCircle2,
}

function avatarIniciais(nome: string) {
  if (!nome) return '?'
  return nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

function sortAgendaHoje(lista: AgendaHojeItem[], ordenar: OrdenarHoje): AgendaHojeItem[] {
  const copia = [...lista]
  if (ordenar === 'horario') return copia.sort((a, b) => a.horario.localeCompare(b.horario))
  if (ordenar === 'tipo') return copia.sort((a, b) => a.agendamento.tipo.localeCompare(b.agendamento.tipo))
  if (ordenar === 'cliente') return copia.sort((a, b) => a.clienteNome.localeCompare(b.clienteNome))
  // Prioridade (padrão): atrasado primeiro, depois por tipo, depois horário
  return copia.sort((a, b) => {
    if (a.atrasadoNaoTratado !== b.atrasadoNaoTratado) return a.atrasadoNaoTratado ? -1 : 1
    const pa = TIPO_PRIORIDADE_BASE[a.agendamento.tipo as CrmAgendamentoTipo] ?? 9
    const pb = TIPO_PRIORIDADE_BASE[b.agendamento.tipo as CrmAgendamentoTipo] ?? 9
    if (pa !== pb) return pa - pb
    return a.horario.localeCompare(b.horario)
  })
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

function toDateTimeLocalInput(value?: string | null) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const byType = new Map(parts.map(part => [part.type, part.value]))
  return `${byType.get('year')}-${byType.get('month')}-${byType.get('day')}T${byType.get('hour')}:${byType.get('minute')}`
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

function OportunidadeCard({
  item,
  onWhatsApp,
  onAbrirCliente,
  onResolver,
  onReagendar,
}: {
  item: AgendaHojeItem
  onWhatsApp: (item: AgendaHojeItem) => void
  onAbrirCliente: (item: AgendaHojeItem) => void
  onResolver: (item: AgendaHojeItem) => void
  onReagendar: (item: AgendaHojeItem) => void
}) {
  const tipo = item.agendamento.tipo as CrmAgendamentoTipo
  const Icon = TIPO_ICON[tipo] || Calendar
  const isVencido = item.atrasadoNaoTratado
  const tel = onlyDigits(item.clienteTelefone)

  return (
    <div className={cn('group flex overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md', isVencido ? 'border-red-200' : 'border-slate-200')}>
      <div className={cn('w-1.5 shrink-0', TIPO_BAR[tipo])} />
      <div className="flex min-w-0 flex-1 items-center gap-4 px-5 py-4">
        <button type="button" onClick={() => onReagendar(item)} className="w-12 shrink-0 text-center outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-primary/30" aria-label={`Alterar horário de ${item.clienteNome || 'cliente'}`}>
          <div className={cn('mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-xl', TIPO_BADGE[tipo])}>
            <Icon size={16} />
          </div>
          <p className={cn('text-[10px] font-bold', isVencido ? 'text-red-500' : 'text-slate-400')}>{fmtHora(item.horario)}</p>
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-black text-slate-500">
            {avatarIniciais(item.clienteNome)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => onAbrirCliente(item)} className="truncate text-left text-[14px] font-bold text-slate-900 underline-offset-2 outline-none hover:text-brand-primary hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary/30">
                {item.clienteNome || 'Cliente sem nome'}
              </button>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', TIPO_BADGE[tipo])}>{CRM_AGENDAMENTO_TIPO_LABEL[tipo]}</span>
              {isVencido && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">Vencido</span>}
            </div>
            {item.veiculoInteresse && <p className="truncate text-[12px] text-slate-400">{item.veiculoInteresse}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" title="WhatsApp" onClick={() => onWhatsApp(item)} className="rounded-xl bg-green-50 p-2 text-green-600 transition-colors hover:bg-green-100">
            <MessageCircle size={16} />
          </button>
          {tel && (
            <a href={`tel:${tel}`} title="Ligar" className="rounded-xl bg-slate-50 p-2 text-slate-500 transition-colors hover:bg-slate-100">
              <Phone size={16} />
            </a>
          )}
          <Link to="/carteira-clientes" onClick={() => onAbrirCliente(item)} title="Abrir cliente" className="rounded-xl bg-blue-50 p-2 text-blue-700 transition-colors hover:bg-blue-100">
            <UserRound size={16} />
          </Link>
          <button type="button" onClick={() => onResolver(item)} className="ml-1 flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-blue-700">
            Resolver
          </button>
        </div>
      </div>
    </div>
  )
}

function AtalhoButton({ atalho, onTabChange, onInfo }: { atalho: RoutineAtalho; onTabChange: (tab: CentralTab) => void; onInfo: (label: string) => void }) {
  const secondaryClass = 'flex items-center gap-1.5 rounded-xl border border-blue-700 px-3.5 py-2 text-[12px] font-bold text-blue-700 transition-colors hover:bg-blue-50'
  if (atalho.type === 'tab') {
    return (
      <button type="button" className={secondaryClass} onClick={() => onTabChange(atalho.target as CentralTab)}>
        <ExternalLink size={12} />{atalho.label}
      </button>
    )
  }
  if (atalho.type === 'route' && atalho.target) {
    return (
      <Link to={atalho.target} className={secondaryClass}>
        <ExternalLink size={12} />{atalho.label}
      </Link>
    )
  }
  return (
    <button type="button" className="text-[12px] font-bold text-slate-400 hover:text-slate-600" onClick={() => onInfo(atalho.label)}>
      {atalho.label}
    </button>
  )
}

export function CentralExecucao() {
  const navigate = useNavigate()
  const { oportunidades, updateOportunidade } = useOportunidades()
  const { agendamentos, createAgendamento, updateAgendamento, updateStatus } = useAgendamentos()
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

  const [filtroTipo, setFiltroTipo] = useState<CrmAgendamentoTipo | 'todos'>('todos')
  const [ordenar, setOrdenar] = useState<OrdenarHoje>('prioridade')
  const [pendenciasOpen, setPendenciasOpen] = useState(false)
  const [novaAtividadeOpen, setNovaAtividadeOpen] = useState(false)
  const [novaAtividadeStep, setNovaAtividadeStep] = useState<'tipo' | 'form'>('tipo')
  const [novaAtividadeTipo, setNovaAtividadeTipo] = useState<CrmAgendamentoTipo | null>(null)
  const [novaAtividadeTelefone, setNovaAtividadeTelefone] = useState('')
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null)
  const [clienteNaoEncontrado, setClienteNaoEncontrado] = useState(false)
  const [novaAtividadeNome, setNovaAtividadeNome] = useState('')
  const [novaAtividadeForm, setNovaAtividadeForm] = useState({
    data: '',
    hora: '',
    veiculo: '',
    observacoes: '',
  })

  const hoje = useMemo(() => new Date(), [])
  const hojeStr = useMemo(() => toDateOnlyBR(), [])

  const agendaHojeItems = useMemo(
    () => deriveAgendaHojeFromCrm(oportunidades, agendamentos, hojeStr, hoje),
    [oportunidades, agendamentos, hojeStr, hoje],
  )

  // Pendências de dias anteriores: agendamentos ainda não tratados (aguardando/confirmado) com data já passada.
  const pendenciasAnteriores = useMemo(
    () => agendamentos.filter(a => {
      if (a.status === 'compareceu' || a.status === 'nao_compareceu') return false
      return new Date(a.data_hora) < hoje && !timestampMatchesDateOnly(a.data_hora, hojeStr)
    }),
    [agendamentos, hoje, hojeStr],
  )

  const contagemPorTipo = useMemo(() => {
    const map: Partial<Record<CrmAgendamentoTipo, number>> = {}
    agendaHojeItems.forEach(item => {
      const tipo = item.agendamento.tipo as CrmAgendamentoTipo
      map[tipo] = (map[tipo] || 0) + 1
    })
    return map
  }, [agendaHojeItems])

  const listaFiltrada = useMemo(() => {
    const filtrada = filtroTipo === 'todos' ? agendaHojeItems : agendaHojeItems.filter(item => item.agendamento.tipo === filtroTipo)
    return sortAgendaHoje(filtrada, ordenar)
  }, [agendaHojeItems, filtroTipo, ordenar])

  const { slots, currentSlot, prospeccaoHoje, storyIdeaHoje, conflitoCliente } = useRoutinePlaybook({
    workStartTime: perfil.hora_entrada,
    lunchEndTime: perfil.hora_almoco_fim,
    workEndTime: perfil.hora_saida,
    agendaHojeItems,
  })

  const [expandedStep, setExpandedStep] = useState<DailyRoutineAutoSlotKey | null>(null)
  useEffect(() => {
    if (currentSlot) setExpandedStep(currentSlot.key)
  }, [currentSlot?.key])

  const nowMinutesForTimeline = useMemo(() => {
    const { hours, minutes } = getSPHoursMinutes()
    return hours * 60 + minutes
  }, [])

  async function handleMarcarStatus(item: AgendaHojeItem, status: CrmAgendamentoStatus) {
    setSaving(true)
    const { error } = await updateStatus(item.agendamento.id, status)
    setSaving(false)
    if (error) { toast.error(error); return }
    setMaisAcoesItem(null)
    toast.success(status === 'compareceu' ? 'Marcado como compareceu.' : 'Marcado como não compareceu.')
  }

  function resetarNovaAtividade() {
    setNovaAtividadeStep('tipo')
    setNovaAtividadeTipo(null)
    setNovaAtividadeTelefone('')
    setClienteEncontrado(null)
    setClienteNaoEncontrado(false)
    setNovaAtividadeNome('')
    setNovaAtividadeForm({ data: toDateOnlyBR(), hora: new Date().toTimeString().slice(0, 5), veiculo: '', observacoes: '' })
  }

  function abrirNovaAtividade() {
    resetarNovaAtividade()
    setNovaAtividadeOpen(true)
  }

  function fecharNovaAtividade() {
    resetarNovaAtividade()
    setNovaAtividadeOpen(false)
  }

  function escolherTipoNovaAtividade(tipo: CrmAgendamentoTipo) {
    setNovaAtividadeTipo(tipo)
    setNovaAtividadeStep('form')
  }

  function buscarClienteNovaAtividade() {
    const termo = novaAtividadeTelefone.trim()
    const tel = normalizarTelefone(termo)
    const normalizarNomeBusca = (valor: string) => valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    const nomeBusca = normalizarNomeBusca(termo)
    if (!termo) return
    const found = clientes.find(c => {
      const clienteTelefone = normalizarTelefone(c.telefone)
      const clienteNome = normalizarNomeBusca(c.nome)
      return (tel && clienteTelefone === tel) || clienteNome.includes(nomeBusca)
    })
    if (found) {
      setClienteEncontrado(found)
      setClienteNaoEncontrado(false)
      setNovaAtividadeNome('')
    } else {
      setClienteEncontrado(null)
      setClienteNaoEncontrado(true)
      if (!tel) setNovaAtividadeNome(termo)
    }
  }

  async function confirmarNovaAtividade() {
    if (!novaAtividadeTipo || !novaAtividadeForm.data || !novaAtividadeForm.hora) {
      toast.error('Selecione o tipo, a data e o horário.')
      return
    }
    const nomeAvulso = novaAtividadeNome.trim()
    const telefoneAvulso = novaAtividadeTelefone.trim()
    if (telefoneAvulso && !clienteEncontrado && !nomeAvulso) {
      setClienteNaoEncontrado(true)
      toast.error('Informe o nome do cliente para salvar uma atividade avulsa.')
      return
    }
    setSaving(true)
    // Sem cliente na base, agendamentos não tem nome_snapshot — preserva nome/telefone
    // na observação para o registro não virar "atividade sem dono".
    const clientePrefix = !clienteEncontrado && (nomeAvulso || telefoneAvulso)
      ? `Cliente: ${nomeAvulso || 'Sem nome'}${telefoneAvulso ? ` (${telefoneAvulso})` : ''}.`
      : ''
    const detalhes = novaAtividadeForm.veiculo
      ? `Veículo: ${novaAtividadeForm.veiculo}.${novaAtividadeForm.observacoes ? ` ${novaAtividadeForm.observacoes}` : ''}`
      : novaAtividadeForm.observacoes || ''
    const observacoes = [clientePrefix, detalhes].filter(Boolean).join(' ').trim() || null
    const { error } = await createAgendamento({
      cliente_id: clienteEncontrado?.id || null,
      data_hora: `${novaAtividadeForm.data}T${novaAtividadeForm.hora}`,
      tipo: novaAtividadeTipo,
      status: 'aguardando',
      observacoes,
    })
    setSaving(false)
    if (error) { toast.error(error); return }
    fecharNovaAtividade()
    toast.success('Atividade criada com sucesso.')
  }

  function openReagendar(item: AgendaHojeItem) {
    setReagendarItem(item)
 setReagendarValor(toDateTimeLocalInput(item.horario))
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
    if (!item.oportunidade) { toast.error('Esta atividade não está vinculada a uma oportunidade do funil.'); return }
    setVendaItem(item)
    setVendaForm({
      valorNegociado: item.oportunidade.valor_negociado ? String(item.oportunidade.valor_negociado) : '',
      financiamento: (item.oportunidade.financiamento as CrmFinanciamento) || 'nao_aplica',
      carroAvaliado: item.oportunidade.carro_avaliado,
      sinal: item.oportunidade.sinal ? String(item.oportunidade.sinal) : '',
    })
  }

  async function confirmVenda() {
    if (!vendaItem || !vendaItem.oportunidade) return
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
    if (!item.oportunidade) { toast.error('Esta atividade não está vinculada a uma oportunidade do funil.'); return }
    setPerdaItem(item)
    setPerdaMotivo(item.oportunidade.motivo_perda || '')
  }

  async function confirmPerda() {
    if (!perdaItem || !perdaItem.oportunidade) return
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

  const weekdayLabel = hoje.toLocaleDateString('pt-BR', { weekday: 'long' })
  const dayAndMonthLabel = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  const dateFormatted = `Hoje · ${weekdayLabel.toLowerCase()}, ${dayAndMonthLabel}`

  return (
    <main className="h-full w-full min-w-0 overflow-y-auto bg-surface-alt no-scrollbar px-mx-sm py-mx-md sm:px-mx-md lg:px-mx-lg">
      <div className="mx-auto flex min-w-0 max-w-[1500px] w-full flex-col pb-20 gap-4">
<SellerPageHeader icon={Target} title="Rotina do Dia" subtitle="Organize e execute seu dia com foco" actions={(
<div className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] sm:h-9">
  <CalendarDays size={14} className="text-[#005BFF]" />
  <span className="truncate font-semibold text-slate-900">{dateFormatted}</span>
</div>
)} />

        {/* Tabs — 1:1 com Base44 */}
<div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 shadow-sm">
          <div className="flex gap-0">
            {CENTRAL_TABS.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'border-b-2 px-5 py-3.5 text-[13px] font-bold transition-all',
                  tab === t.key ? 'border-blue-700 bg-white text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 lg:p-6">
        {tab === 'hoje' ? (
          <div className="flex min-w-0 flex-col gap-5">
            {pendenciasAnteriores.length > 0 && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertTriangle size={16} className="shrink-0 text-amber-500" />
                <p className="flex-1 text-[13px] font-semibold text-amber-800">
                  Você possui {pendenciasAnteriores.length} pendência{pendenciasAnteriores.length > 1 ? 's' : ''} de dias anteriores.
                </p>
                <button type="button" onClick={() => setPendenciasOpen(true)} className="shrink-0 text-[12px] font-bold text-blue-700 hover:underline">
                  Ver pendências
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-[14px] font-black text-slate-900">O que você não pode deixar de fazer hoje</h3>
                <p className="text-[12px] text-slate-400">Atividades vencidas ou previstas para hoje. Execute e registre o resultado.</p>
              </div>
              <div className="flex items-center gap-2">
                <Select aria-label="Ordenar" value={ordenar} onChange={event => setOrdenar(event.target.value as OrdenarHoje)} className="h-8 w-[150px] rounded-xl border-slate-200 text-[12px] font-semibold">
                  <option value="prioridade">Prioridade</option>
                  <option value="horario">Horário</option>
                  <option value="tipo">Tipo</option>
                  <option value="cliente">Cliente</option>
                </Select>
                <button type="button" onClick={abrirNovaAtividade} className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-[12px] font-bold text-white shadow-sm shadow-blue-100 transition-colors hover:bg-blue-700">
                  <Plus className="h-4 w-4" /> Nova atividade
                </button>
              </div>
            </div>

            {agendaHojeItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {FILTROS_TIPO.map(f => {
                  const count = f.id === 'todos' ? agendaHojeItems.length : (contagemPorTipo[f.id as CrmAgendamentoTipo] || 0)
                  if (f.id !== 'todos' && count === 0) return null
                  const ativo = filtroTipo === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFiltroTipo(f.id)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-bold transition-colors',
                        ativo ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-700 hover:text-blue-700',
                      )}
                    >
                      {f.label}
                      <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-black', ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500')}>{count}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {listaFiltrada.length === 0 ? (
              agendaHojeItems.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                    <CheckCircle2 className="h-7 w-7 text-blue-700" />
                  </div>
                  <p className="mb-1 text-[16px] font-black text-slate-900">Tela limpa por hoje.</p>
                  <p className="mx-auto mb-5 max-w-sm text-[13px] text-slate-400">Você não possui oportunidades pendentes para executar agora.</p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button type="button" onClick={() => setTab('rotina')} className="flex items-center gap-1.5 rounded-xl border border-blue-700 px-4 py-2 text-[13px] font-bold text-blue-700 transition-colors hover:bg-blue-50">
                      <Sparkles className="h-4 w-4" /> Ver Rotina do Dia
                    </button>
                    <Link to="/carteira-clientes" className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50">
                      <Users className="h-4 w-4" /> Abrir Carteira
                    </Link>
                    <button type="button" onClick={abrirNovaAtividade} className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-blue-700">
                      <Plus className="h-4 w-4" /> Nova atividade
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-[13px] text-slate-400">Nenhuma oportunidade do tipo <strong>{filtroTipo !== 'todos' ? CRM_AGENDAMENTO_TIPO_LABEL[filtroTipo] : ''}</strong> para hoje.</p>
                  <button type="button" onClick={() => setFiltroTipo('todos')} className="mt-2 text-[12px] font-bold text-blue-700 hover:underline">Ver todas</button>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-3">
                {listaFiltrada.map(item => (
                  <OportunidadeCard
                    key={item.id}
 item={item}
 onWhatsApp={openWhatsApp}
 onAbrirCliente={(clienteItem) => navigate(`/carteira-clientes?busca=${encodeURIComponent(clienteItem.clienteNome || '')}`)}
 onResolver={setMaisAcoesItem}
 onReagendar={openReagendar}
 />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {conflitoCliente && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                  <p className="text-[13px] font-medium text-amber-800">Você possui um cliente agendado neste horário. Priorize o atendimento e retome sua rotina depois.</p>
                </div>
              )}

              {slots.map((slot: RoutineSlot) => {
                const StepIcon = STEP_ICON[slot.key]
                const isExpanded = expandedStep === slot.key
                const isPast = !slot.isCurrent && slotMinutes(slot.time) < nowMinutesForTimeline
                const preview = slot.template?.objetivo || ''
                return (
                  <div key={slot.key} className={cn('rounded-2xl border bg-white shadow-sm transition-all', slot.isCurrent ? 'border-blue-700 shadow-blue-100' : 'border-slate-200')}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 px-5 py-4 text-left"
                      onClick={() => setExpandedStep(isExpanded ? null : slot.key)}
                    >
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', slot.isCurrent ? 'bg-blue-700 text-white' : isPast ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400')}>
                        <StepIcon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn('rounded-lg px-2 py-0.5 text-[11px] font-bold', slot.isCurrent ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500')}>{slot.time}</span>
                          <span className={cn('text-[14px] font-bold', slot.isCurrent ? 'text-slate-900' : 'text-slate-600')}>{slot.template?.nome || slot.key}</span>
                          {slot.isCurrent && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">Agora</span>}
                        </div>
                        {!isExpanded && preview && (
                          <p className={cn('mt-0.5 truncate text-[12px]', slot.isCurrent ? 'font-semibold text-blue-700' : 'text-slate-400')}>{preview}</p>
                        )}
                      </div>
                      {isExpanded ? <ChevronDown size={16} className="shrink-0 text-slate-400" /> : <ChevronRight size={16} className="shrink-0 text-slate-400" />}
                    </button>

                    {isExpanded && slot.template && (
                      <div className="border-t border-slate-100 px-5 pb-5">
                        <p className="mb-4 mt-3 text-[13px] text-slate-500">{slot.template.objetivo}</p>

                        {slot.key === 'prospeccao' ? (
                          <div>
                            <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-400">Ações de hoje</p>
                            {prospeccaoHoje.length === 0 ? (
                              <p className="text-[13px] text-slate-400">Sem ações programadas para hoje. Aproveite para avançar na carteira.</p>
                            ) : (
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {prospeccaoHoje.map((acao: ProspectingScheduleRow) => (
                                  <div key={acao.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-[13px] font-bold text-slate-900">{TIPO_ACAO_LABEL[acao.tipo_acao] || acao.tipo_acao}</p>
                                    {acao.publico && <p className="text-[11px] text-slate-400">{acao.publico}</p>}
                                    {acao.objetivo && <p className="mt-1 text-[12px] text-slate-500">{acao.objetivo}</p>}
                                    {acao.quantidade && <p className="mt-1.5 text-[11px] font-bold text-blue-700">Meta: {acao.quantidade} {acao.periodicidade}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {storyIdeaHoje && (
                              <button type="button" onClick={() => setVerComoFazerOpen(true)} className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-blue-700 hover:underline">
                                <BookOpen size={14} /> Ver como fazer
                              </button>
                            )}
                          </div>
                        ) : (
                          slot.template.instrucoes.length > 0 && (
                            <div className="mb-4">
                              <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-400">Faça agora</p>
                              <ol className="space-y-2">
                                {slot.template.instrucoes.map((inst, i) => (
                                  <li key={i} className="flex items-start gap-2.5">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">{i + 1}</span>
                                    <span className="text-[13px] text-slate-700">{inst}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )
                        )}

                        {slot.template.meta_sugerida && (
                          <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2">
                            <p className="text-[12px] font-bold text-blue-700">{slot.template.meta_sugerida}</p>
                          </div>
                        )}

                        {slot.template.atalhos.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {slot.template.atalhos.map(atalho => (
                              <AtalhoButton key={atalho.label} atalho={atalho} onTabChange={setTab} onInfo={(label) => toast.info(label)} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Linha do Tempo</p>
              <div className="space-y-0.5">
                {slots.map((slot: RoutineSlot, idx) => {
                  const isPast = !slot.isCurrent && slotMinutes(slot.time) < nowMinutesForTimeline
                  const StepIcon = STEP_ICON[slot.key]
                  return (
                    <div key={slot.key} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', slot.isCurrent ? 'bg-blue-700 text-white' : isPast ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400')}>
                          <StepIcon size={14} />
                        </div>
                        {idx < slots.length - 1 && <div className={cn('h-5 w-px', isPast ? 'bg-green-200' : 'bg-slate-100')} />}
                      </div>
                      <div className="pb-3 pt-0.5">
                        <p className={cn('text-[11px] font-bold', slot.isCurrent ? 'text-blue-700' : 'text-slate-400')}>{slot.time}</p>
                        <p className={cn('text-[12px] font-semibold leading-tight', slot.isCurrent ? 'text-slate-900' : 'text-slate-500')}>{slot.template?.nome || slot.key}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </aside>
          </div>
        )}
        </div>
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
        title={maisAcoesItem?.clienteNome || 'Registrar resultado'}
        description="Como foi resolvido este atendimento?"
      >
        <div className="flex flex-col gap-mx-xs">
          <Button variant="outline" className="justify-start bg-white" disabled={saving} onClick={() => { if (maisAcoesItem) handleMarcarStatus(maisAcoesItem, 'compareceu') }}><CheckCircle2 size={16} /> Compareceu</Button>
          <Button variant="outline" className="justify-start bg-white" disabled={saving} onClick={() => { if (maisAcoesItem) handleMarcarStatus(maisAcoesItem, 'nao_compareceu') }}><AlertTriangle size={16} /> Não compareceu</Button>
          <Button variant="outline" className="justify-start bg-white" onClick={() => { if (maisAcoesItem) openReagendar(maisAcoesItem); setMaisAcoesItem(null) }}><RotateCcw size={16} /> Reagendar</Button>
          {maisAcoesItem?.oportunidade && (
            <>
              <Button variant="outline" className="justify-start bg-white" onClick={() => { if (maisAcoesItem) openVenda(maisAcoesItem); setMaisAcoesItem(null) }}><CircleDollarSign size={16} /> Registrar Venda</Button>
              <Button variant="outline" className="justify-start bg-white" onClick={() => { if (maisAcoesItem) openPerda(maisAcoesItem); setMaisAcoesItem(null) }}><AlarmClock size={16} /> Registrar Perda</Button>
            </>
          )}
          <Button asChild variant="outline" className="justify-start bg-white"><Link to="/carteira-clientes" onClick={() => setMaisAcoesItem(null)}><Target size={16} /> Abrir na Carteira de Clientes</Link></Button>
        </div>
      </Modal>

      <Modal
        open={novaAtividadeOpen}
        onClose={fecharNovaAtividade}
        title="Nova atividade"
        size="sm"
        footer={novaAtividadeStep === 'form' ? (
          <div className="flex justify-end gap-3">
            <button type="button" onClick={fecharNovaAtividade} disabled={saving} className="rounded-xl border border-slate-200 px-5 py-2.5 text-[13px] font-semibold text-slate-500 transition-colors hover:bg-slate-50">Cancelar</button>
            <button
              type="button"
              onClick={confirmarNovaAtividade}
              disabled={saving || !novaAtividadeForm.data || !novaAtividadeForm.hora || (!!novaAtividadeTelefone.trim() && !clienteEncontrado && !novaAtividadeNome.trim())}
              className="rounded-xl bg-blue-700 px-6 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar atividade'}
            </button>
          </div>
        ) : undefined}
      >
        {novaAtividadeStep === 'tipo' ? (
          <div className="mt-3 space-y-2">
            <p className="mb-3 text-[13px] text-slate-500">Selecione o tipo de atividade comercial:</p>
            {CRM_AGENDAMENTO_TIPO.map(tipo => (
              <button
                key={tipo}
                type="button"
                onClick={() => escolherTipoNovaAtividade(tipo)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-[13px] font-semibold text-slate-900 transition-colors hover:border-blue-700 hover:bg-blue-50"
              >
                {CRM_AGENDAMENTO_TIPO_LABEL[tipo]}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[12px] font-bold text-blue-700">{novaAtividadeTipo && CRM_AGENDAMENTO_TIPO_LABEL[novaAtividadeTipo]}</span>
              <button type="button" onClick={() => setNovaAtividadeStep('tipo')} className="text-[12px] text-slate-400 underline hover:text-slate-600">Mudar tipo</button>
            </div>

            <div>
              <label htmlFor="nova-atividade-telefone" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cliente ou Telefone</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="nova-atividade-telefone"
                  value={novaAtividadeTelefone}
                        onChange={event => { setNovaAtividadeTelefone(event.target.value); setClienteEncontrado(null); setClienteNaoEncontrado(false) }}
                        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); buscarClienteNovaAtividade() } }}
                        placeholder="Nome ou telefone"
                  className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-[13px] focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button type="button" onClick={buscarClienteNovaAtividade} className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white transition-colors hover:bg-blue-700">
                  <Search className="h-4 w-4" />
                </button>
              </div>
              {clienteEncontrado && (
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                  <UserCheck className="h-4 w-4 shrink-0 text-green-600" />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold text-green-800">{clienteEncontrado.nome}</p>
                  </div>
                </div>
              )}
              {clienteNaoEncontrado && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <UserX className="h-4 w-4 shrink-0 text-amber-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-amber-800">Cliente não encontrado.</p>
                      <Link to="/carteira-clientes" onClick={fecharNovaAtividade} className="text-[11px] text-blue-700 underline">Abrir Carteira de Clientes para cadastrar</Link>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="nova-atividade-nome" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nome do cliente</label>
                    <input
                      id="nova-atividade-nome"
                      value={novaAtividadeNome}
                      onChange={event => setNovaAtividadeNome(event.target.value)}
                      placeholder="Nome de quem você vai atender"
                      className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="nova-atividade-data" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Data</label>
                <input id="nova-atividade-data" type="date" value={novaAtividadeForm.data} onChange={event => setNovaAtividadeForm(current => ({ ...current, data: event.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label htmlFor="nova-atividade-hora" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hora</label>
                <input id="nova-atividade-hora" type="time" value={novaAtividadeForm.hora} onChange={event => setNovaAtividadeForm(current => ({ ...current, hora: event.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>

            <div>
              <label htmlFor="nova-atividade-veiculo" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Veículo (opcional)</label>
              <input id="nova-atividade-veiculo" value={novaAtividadeForm.veiculo} onChange={event => setNovaAtividadeForm(current => ({ ...current, veiculo: event.target.value }))} placeholder="Ex: HB20 1.0 Comfort" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>

            <div>
              <label htmlFor="nova-atividade-observacoes" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Observação</label>
              <input id="nova-atividade-observacoes" value={novaAtividadeForm.observacoes} onChange={event => setNovaAtividadeForm(current => ({ ...current, observacoes: event.target.value }))} placeholder="Descreva o objetivo desta atividade..." className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={pendenciasOpen}
        onClose={() => setPendenciasOpen(false)}
        title={`Pendências anteriores (${pendenciasAnteriores.length})`}
        description="Atividades de dias anteriores que ainda não foram tratadas."
      >
        {pendenciasAnteriores.length === 0 ? (
          <Typography variant="caption" tone="muted" className="block py-mx-lg text-center">Nenhuma pendência anterior.</Typography>
        ) : (
          <div className="flex flex-col gap-mx-sm">
            {pendenciasAnteriores.map((ag: AgendamentoComCliente) => {
              const tipo = ag.tipo as CrmAgendamentoTipo
              const atraso = Math.max(0, Math.floor((hoje.getTime() - new Date(ag.data_hora).getTime()) / 86400000))
              return (
                <Card key={ag.id} className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
                  <div className="flex items-center gap-mx-xs">
                    <Pill className={TIPO_BADGE[tipo]}>{CRM_AGENDAMENTO_TIPO_LABEL[tipo]}</Pill>
                    <Pill className="border-status-error/20 bg-status-error-surface text-status-error">{atraso === 0 ? 'Hoje' : `${atraso}d atraso`}</Pill>
                  </div>
                  <Typography variant="p" className="mt-mx-xs font-bold text-text-primary">{ag.cliente?.nome || 'Cliente sem nome'}</Typography>
                  <Typography variant="caption" tone="muted">{new Date(ag.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Typography>
                  <div className="mt-mx-sm flex flex-wrap items-center gap-mx-tiny">
                    {ag.cliente?.telefone && (
                      <Button variant="outline" size="sm" className="h-8 border-status-success/30 bg-status-success-surface text-status-success" onClick={() => window.open(`https://wa.me/55${onlyDigits(ag.cliente?.telefone)}`, '_blank', 'noopener')}><MessageCircle size={13} /> WhatsApp</Button>
                    )}
                    <Button asChild variant="outline" size="sm" className="h-8"><Link to="/carteira-clientes" onClick={() => setPendenciasOpen(false)}><UserRound size={13} /> Abrir cliente</Link></Button>
                    <Button size="sm" className="ml-auto h-8" onClick={async () => { setSaving(true); const { error } = await updateStatus(ag.id, 'compareceu'); setSaving(false); if (error) toast.error(error); else toast.success('Marcado como compareceu.') }}>Resolver</Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
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
