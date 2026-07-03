import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  CalendarDays,
  Check,
  CheckCircle,
  ChevronDown,
  Copy,
  FileText,
  Filter,
  Hourglass,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import {
  calcularPrioridadeCliente,
  calcularPrioridadeDia,
  calcularScoreCliente,
  classificacaoScore,
  derivarObjetivoEMentor,
  derivarSituacao,
  derivarTemperatura,
  explicacaoCliente,
  PRIORIDADE_LABEL,
  TEMPERATURA_LABEL,
  type Prioridade,
  type PrioridadeDia,
} from '@/features/crm/lib/mentorComercial'
import { Card } from '@/components/molecules/Card'
import { PageHeading } from '@/components/molecules/PageHeading'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { EmptyState } from '@/components/atoms/EmptyState'
import { FormField } from '@/components/molecules/FormField'
import { Modal } from '@/components/organisms/Modal'
import { PlanoAtaqueTab } from '@/features/crm/PlanoAtaqueTab'
import { ModoAtaqueView } from '@/features/crm/ModoAtaqueView'
import { AlterarProximoPasso } from '@/features/crm/AlterarProximoPasso'
import { useClientes, type ClienteInput } from '@/features/crm/hooks/useClientes'
import { useOportunidades, type OportunidadeComCliente } from '@/features/crm/hooks/useOportunidades'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import { useAuth } from '@/hooks/useAuth'
import {
  calcularPersistencia,
  derivarProgresso,
  type CadenciaResultadoAcao,
  type ProgressoCadencia,
} from '@/features/crm/lib/cadencia'
import { cn } from '@/lib/utils'
import {
  CRM_CANAIS,
  CRM_CANAL_LABEL,
  CRM_CLIENTE_STATUS,
  CRM_CLIENTE_STATUS_LABEL,
  CRM_RELACIONAMENTO,
  CRM_RELACIONAMENTO_LABEL,
  formatDateBR,
  toDateOnlyBR,
  type Cliente,
  type CrmCanal,
  type CrmClienteStatus,
} from '@/lib/schemas/crm.schema'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format

const STATUS_CLIENTE_LABEL: Record<CrmClienteStatus, string> = {
  oportunidade: 'Em andamento',
  ativo: 'Em andamento',
  aguardando_contato: 'Aguardando cliente',
  pos_venda: 'Vendido',
  inativo: 'Sem resposta',
}

const EMPTY_FORM: ClienteInput = {
  nome: '',
  telefone: '',
  empresa: '',
  canal_origem: null,
  status: 'aguardando_contato',
  relacionamento: 'neutro',
  proxima_acao: '',
  proxima_acao_em: '',
  potencial_negocio: 0,
  observacoes: '',
}

type StatusAcao = 'Pendente' | 'Agendada' | 'Feita' | 'Não respondeu' | 'Aguardando' | 'Reagendada' | 'Não feita' | 'Concluída'
const CLIENT_FLOW_STEPS = ['Lead', 'Contato', 'Agendamento', 'Visita', 'Negociação', 'Venda', 'Pós-venda']

const DEMO_TOTAL_CLIENTES = 128
const DEMO_KPIS = {
  total: 128,
  emAndamento: 78,
  aguardandoCliente: 22,
  semResposta: 16,
  vendidos: 12,
  persistencia: 71,
}

const DEMO_CLIENTES: Cliente[] = [
  makeDemoCliente('11111111-1111-4111-8111-111111111111', 'João Santos', '(11) 98765-4321', 'Compass Longitude', 'internet', 'oportunidade', 'bom', 'Apresentar proposta', '2026-06-17', 120000),
  makeDemoCliente('22222222-2222-4222-8222-222222222222', 'Maria Oliveira', '(11) 91234-5678', 'Compass Longitude', 'internet', 'aguardando_contato', 'neutro', 'Visita na concessionária', '2026-06-18', 120000),
  makeDemoCliente('33333333-3333-4333-8333-333333333333', 'Carlos Almeida', '(11) 99887-6655', 'Corolla Cross', 'carteira', 'oportunidade', 'bom', 'Fazer proposta', '2026-06-17', 145900),
  makeDemoCliente('44444444-4444-4444-8444-444444444444', 'Fernanda Lima', '(11) 97550-9876', 'HR-V Touring', 'porta', 'ativo', 'neutro', 'Ligação de follow-up', '2026-06-17', 132500),
  makeDemoCliente('55555555-5555-4555-8555-555555555555', 'Ricardo Souza', '(11) 94444-3353', 'Hilux SRX 2021', 'internet', 'inativo', 'critico', 'Recontato pós-visita', '2026-06-16', 155000),
  makeDemoCliente('66666666-6666-4666-8666-666666666666', 'Juliana Costa', '(11) 95335-2222', 'Creta Platinum', 'showroom', 'pos_venda', 'excelente', 'Pós-venda e pedido de indicação', '2026-06-18', 120000),
  makeDemoCliente('77777777-7777-4777-8777-777777777777', 'Bruno Ferreira', '(11) 96666-7777', 'Onix Premier', 'internet', 'oportunidade', 'ruim', 'Enviar proposta', '2026-06-18', 109900),
  makeDemoCliente('88888888-8888-4888-8888-888888888888', 'Patrícia Gomes', '(11) 97777-1212', 'T-Cross Highline', 'carteira', 'aguardando_contato', 'neutro', '', null, 139900),
]

const DEMO_OPORTUNIDADES: OportunidadeComCliente[] = [
  makeDemoOportunidade(DEMO_CLIENTES[0], 'negociacao', true, 'aprovado'),
  makeDemoOportunidade(DEMO_CLIENTES[1], 'apresentacao', false, 'pendente'),
  makeDemoOportunidade(DEMO_CLIENTES[2], 'negociacao', true, 'pendente'),
  makeDemoOportunidade(DEMO_CLIENTES[3], 'qualificacao', false, 'nao_aplica'),
  makeDemoOportunidade(DEMO_CLIENTES[4], 'negociacao', true, 'aprovado'),
  makeDemoOportunidade(DEMO_CLIENTES[5], 'ganho', true, 'aprovado'),
  makeDemoOportunidade(DEMO_CLIENTES[6], 'negociacao', false, 'nao_aplica'),
  makeDemoOportunidade(DEMO_CLIENTES[7], 'prospeccao', false, 'pendente'),
]

export function CarteiraClientes() {
  const { profile } = useAuth()
  const { clientes, metrics, loading, error, createCliente, updateCliente, registrarStatusCadencia } = useClientes()
  const { oportunidades } = useOportunidades()
  const { agendamentos } = useAgendamentos()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CrmClienteStatus | 'todos'>('todos')
  const [canalFilter, setCanalFilter] = useState<CrmCanal | 'todos'>('todos')
  const [carroFilter, setCarroFilter] = useState<'todos' | 'sim' | 'nao'>('todos')
  const [fichaFilter, setFichaFilter] = useState<'todos' | 'aprovada' | 'pendente' | 'recusada'>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<ClienteInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panelClosed, setPanelClosed] = useState(false)
  const [cadenciaSaving, setCadenciaSaving] = useState(false)
  const [naoRespondeuCliente, setNaoRespondeuCliente] = useState<Cliente | null>(null)
  const [activeTab, setActiveTab] = useState<'ativa' | 'ataque'>('ativa')
  const [modoAtaqueOpen, setModoAtaqueOpen] = useState(false)
  const [editandoProximoPasso, setEditandoProximoPasso] = useState<Cliente | null>(null)
  const [diaFiltro, setDiaFiltro] = useState<PrioridadeDia | 'todos'>('hoje')
  const hoje = useMemo(() => toDateOnlyBR(), [])
  const runtimeUserAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : ''
  const isAutomatedTest = (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') || runtimeUserAgent.includes('happy-dom') || runtimeUserAgent.includes('jsdom')
  const demoMode = clientes.length === 0 && !isAutomatedTest && import.meta.env.DEV
  const carteiraClientes = demoMode ? DEMO_CLIENTES : clientes
  const carteiraOportunidades = demoMode ? DEMO_OPORTUNIDADES : oportunidades

  const progressoPorCliente = useMemo(() => {
    const map = new Map<string, ProgressoCadencia>()
    for (const cliente of carteiraClientes) {
      map.set(cliente.id, derivarProgresso(cliente, carteiraOportunidades, agendamentos))
    }
    return map
  }, [agendamentos, carteiraClientes, carteiraOportunidades])

  const persistencia = useMemo(
    () => calcularPersistencia([...progressoPorCliente.values()]),
    [progressoPorCliente],
  )

  const selectedCliente = useMemo(
    () => (panelClosed ? null : carteiraClientes.find(cliente => cliente.id === selectedId) || null),
    [carteiraClientes, panelClosed, selectedId],
  )

  const oportunidadePorCliente = useMemo(() => {
    const map = new Map<string, OportunidadeComCliente>()
    for (const oportunidade of carteiraOportunidades) {
      const atual = map.get(oportunidade.cliente_id)
      if (!atual || new Date(oportunidade.updated_at).getTime() > new Date(atual.updated_at).getTime()) {
        map.set(oportunidade.cliente_id, oportunidade)
      }
    }
    return map
  }, [carteiraOportunidades])

  // ── Mentor Comercial: prioridade por dia + prioridade comercial (1:1 com Base44 Mentor Comercial) ──
  const diaPorCliente = useMemo(() => {
    const map = new Map<string, PrioridadeDia>()
    for (const cliente of carteiraClientes) map.set(cliente.id, calcularPrioridadeDia(cliente, hoje))
    return map
  }, [carteiraClientes, hoje])

  const prioridadePorCliente = useMemo(() => {
    const map = new Map<string, Prioridade>()
    for (const cliente of carteiraClientes) map.set(cliente.id, calcularPrioridadeCliente(cliente, oportunidadePorCliente.get(cliente.id), hoje))
    return map
  }, [carteiraClientes, hoje, oportunidadePorCliente])

  const contagemPorDia = useMemo(() => {
    const map: Record<PrioridadeDia, number> = { hoje: 0, amanha: 0, dia2: 0, dia3: 0, futuro: 0 }
    diaPorCliente.forEach(dia => { map[dia] += 1 })
    return map
  }, [diaPorCliente])

  const diaLabel = useMemo(() => {
    const nomeDia = (offset: number) => {
      const d = new Date(`${hoje}T12:00:00`)
      d.setDate(d.getDate() + offset)
      const nome = d.toLocaleDateString('pt-BR', { weekday: 'long' })
      return nome.charAt(0).toUpperCase() + nome.slice(1)
    }
    return { hoje: 'Hoje', amanha: 'Amanhã', dia2: nomeDia(2), dia3: nomeDia(3) }
  }, [hoje])

  const PRIORIDADE_ORDER: Record<Prioridade, number> = { maxima: 0, alta: 1, media: 2, baixa: 3 }
  const clientesOrdenadosPorPrioridade = useMemo(() => {
    const base = diaFiltro === 'todos' ? carteiraClientes : carteiraClientes.filter(cliente => diaPorCliente.get(cliente.id) === diaFiltro)
    return [...base].sort((a, b) => {
      const pa = PRIORIDADE_ORDER[prioridadePorCliente.get(a.id) || 'baixa']
      const pb = PRIORIDADE_ORDER[prioridadePorCliente.get(b.id) || 'baixa']
      if (pa !== pb) return pa - pb
      const sa = calcularScoreCliente(a, hoje).score
      const sb = calcularScoreCliente(b, hoje).score
      return sa - sb
    })
  }, [carteiraClientes, diaFiltro, diaPorCliente, hoje, prioridadePorCliente])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return carteiraClientes.filter(cliente => {
      if (statusFilter !== 'todos' && cliente.status !== statusFilter) return false
      if (canalFilter !== 'todos' && cliente.canal_origem !== canalFilter) return false
      const oportunidade = oportunidadePorCliente.get(cliente.id)
      if (carroFilter === 'sim' && !oportunidade?.carro_avaliado) return false
      if (carroFilter === 'nao' && oportunidade?.carro_avaliado) return false
      if (fichaFilter === 'aprovada' && oportunidade?.financiamento !== 'aprovado') return false
      if (fichaFilter === 'pendente' && oportunidade?.financiamento !== 'pendente') return false
      if (fichaFilter === 'recusada' && oportunidade?.financiamento !== 'reprovado') return false
      if (!q) return true
      return cliente.nome.toLowerCase().includes(q)
        || (cliente.telefone || '').includes(q)
        || (cliente.empresa || '').toLowerCase().includes(q)
        || (oportunidade?.veiculo_interesse || '').toLowerCase().includes(q)
    })
  }, [canalFilter, carroFilter, carteiraClientes, fichaFilter, oportunidadePorCliente, search, statusFilter])

  const totalClientes = demoMode ? DEMO_KPIS.total : metrics.total

  const listaBuscada = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clientesOrdenadosPorPrioridade
    return clientesOrdenadosPorPrioridade.filter(cliente => {
      const oportunidade = oportunidadePorCliente.get(cliente.id)
      return cliente.nome.toLowerCase().includes(q)
        || (cliente.telefone || '').includes(q)
        || (oportunidade?.veiculo_interesse || cliente.empresa || '').toLowerCase().includes(q)
    })
  }, [clientesOrdenadosPorPrioridade, oportunidadePorCliente, search])

  async function handleCreate() {
    if (!form.nome.trim()) {
      toast.error('Informe o nome do cliente.')
      return
    }
    setSaving(true)
    const { error: createError } = await createCliente(form)
    setSaving(false)
    if (createError) {
      toast.error(createError)
      return
    }
    toast.success('Cliente adicionado à carteira com cadência iniciada.')
    setForm(EMPTY_FORM)
    setModalOpen(false)
  }

  async function handleRegistrarStatusCadencia(clienteId: string, status: CadenciaResultadoAcao) {
    if (demoMode) {
      toast.success(status === 'nao_feito' ? 'Tentativa registrada e próxima ação enviada para a Central.' : 'Cadência atualizada no modo demonstração.')
      return
    }
    setCadenciaSaving(true)
    const { error: statusError } = await registrarStatusCadencia({ clienteId, status })
    setCadenciaSaving(false)
    if (statusError) {
      toast.error(statusError)
      return
    }
    toast.success(status === 'nao_feito' ? 'Tentativa registrada e próxima ação mantida no fluxo.' : 'Cadência atualizada.')
  }

  function executarProximoPasso(cliente: Cliente) {
    const progresso = progressoPorCliente.get(cliente.id)
    if (cliente.telefone && progresso) {
      const vendedorNome = (profile?.name || 'vendedor').split(' ')[0]
      const script = progresso.etapaAtual.script({ cliente: cliente.nome.split(' ')[0], vendedor: vendedorNome })
      const tel = cliente.telefone.replace(/\D/g, '')
      window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(script)}`, '_blank', 'noopener')
    }
    setPanelClosed(false)
    setSelectedId(cliente.id)
  }

  const tabNav = (
    <div className="flex w-fit gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
      {[
        { id: 'ativa' as const, label: 'Carteira Ativa' },
        { id: 'ataque' as const, label: 'Plano de Ataque' },
      ].map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => setActiveTab(t.id)}
          className={cn('rounded-xl px-5 py-2 text-sm font-bold transition-all', activeTab === t.id ? 'bg-[#005BFF] text-white shadow-sm' : 'text-slate-500 hover:text-[#031B3D]')}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  if (activeTab === 'ataque') {
    return (
      <main className="h-full w-full min-w-0 overflow-y-auto bg-surface-alt px-mx-sm pb-mx-sm pt-0 text-text-primary no-scrollbar sm:px-mx-md sm:pb-mx-md 2xl:px-mx-lg 2xl:pb-mx-lg">
        <div className="flex w-full min-w-0 flex-col gap-mx-xs">
          <header className="relative z-40 -mx-mx-sm shrink-0 border-b border-border-default/60 bg-surface-alt px-mx-sm pb-3 pt-2 shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:-mx-mx-md sm:px-mx-md md:sticky md:top-0 md:pt-3 2xl:-mx-mx-lg 2xl:px-mx-lg">
            <PageHeading
              title="Carteira de Clientes"
              subtitle="Missões calculadas a partir das situações reais da sua carteira."
            />
            {tabNav}
          </header>
          <section className="min-w-0 py-mx-sm">
            <PlanoAtaqueTab
              clientes={carteiraClientes}
              oportunidadePorCliente={oportunidadePorCliente}
              onAbrirFicha={clienteId => {
                setActiveTab('ativa')
                setPanelClosed(false)
                setSelectedId(clienteId)
              }}
            />
          </section>
        </div>
      </main>
    )
  }

  return (
  <main className="h-full w-full min-w-0 overflow-y-auto bg-[#F8FAFC] text-text-primary no-scrollbar">
    <div className="mx-auto flex w-full max-w-[1440px] min-w-0 flex-col gap-5 px-4 py-6 sm:px-4 xl:px-8">
        {tabNav}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-[#0F172A]">Mentor Comercial</h1>
            <p className="text-sm text-slate-500">Sua agenda comercial de hoje. Execute e registre resultados.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar cliente..."
                className="h-10 w-56 rounded-xl border border-slate-200 pl-9 pr-3 text-sm focus:border-[#005BFF] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </span>
            <button type="button" onClick={() => setStatusFilter('todos')} className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
              <Filter size={16} /> Filtros
            </button>
            <button type="button" onClick={() => setModalOpen(true)} className="flex h-10 items-center gap-1.5 rounded-xl bg-[#005BFF] px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700">
              <Plus size={16} /> Novo cliente
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {([
            { id: 'hoje' as const, label: 'Prioridade Hoje', sub: 'pendentes agora', count: contagemPorDia.hoje },
            { id: 'amanha' as const, label: 'Prioridade Amanhã', sub: 'próximas ações', count: contagemPorDia.amanha },
            { id: 'dia2' as const, label: `Prioridade ${diaLabel.dia2}`, sub: 'ações programadas', count: contagemPorDia.dia2 },
            { id: 'dia3' as const, label: `Prioridade ${diaLabel.dia3}`, sub: 'ações programadas', count: contagemPorDia.dia3 },
          ]).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDiaFiltro(tab.id)}
              className={cn('rounded-2xl border p-4 text-left transition-colors', diaFiltro === tab.id ? 'border-[#005BFF] bg-[#005BFF] text-white shadow-sm' : 'border-slate-200 bg-white text-[#0F172A] hover:border-[#005BFF]/40')}
            >
              <p className="text-2xl font-black">{tab.count}</p>
              <p className={cn('text-xs font-bold', diaFiltro === tab.id ? 'text-white' : 'text-[#0F172A]')}>{tab.label}</p>
              <p className={cn('text-[11px]', diaFiltro === tab.id ? 'text-white/80' : 'text-slate-400')}>{tab.sub}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDiaFiltro('todos')}
            className={cn('rounded-2xl border p-4 text-left transition-colors', diaFiltro === 'todos' ? 'border-[#005BFF] bg-[#005BFF] text-white shadow-sm' : 'border-slate-200 bg-white text-[#0F172A] hover:border-[#005BFF]/40')}
          >
            <p className="text-2xl font-black">{totalClientes}</p>
            <p className={cn('text-xs font-bold', diaFiltro === 'todos' ? 'text-white' : 'text-[#0F172A]')}>Ver Todos</p>
            <p className={cn('text-[11px]', diaFiltro === 'todos' ? 'text-white/80' : 'text-slate-400')}>lista por prioridade</p>
          </button>
        </div>

        <div className={cn('grid grid-cols-1 gap-4', selectedCliente && 'xl:grid-cols-[minmax(0,1fr)_440px] xl:items-start')}>
          <section className="min-w-0 space-y-3">
            <p className="text-sm font-bold text-[#0F172A]">{listaBuscada.length} clientes · {diaFiltro === 'todos' ? 'Todos' : `Prioridade ${diaFiltro === 'hoje' ? 'Hoje' : diaFiltro === 'amanha' ? 'Amanhã' : diaFiltro === 'dia2' ? diaLabel.dia2 : diaLabel.dia3}`}</p>

            {error && <Typography tone="muted" className="text-status-error">{error}</Typography>}
            {loading ? (
              <Typography tone="muted">Carregando carteira...</Typography>
            ) : listaBuscada.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <EmptyState
                  title={carteiraClientes.length === 0 ? 'Sua carteira está vazia' : 'Nenhum cliente encontrado'}
                  description={carteiraClientes.length === 0 ? 'Adicione seu primeiro cliente para iniciar cadência e próxima ação.' : 'Ajuste a busca ou o filtro de prioridade.'}
                />
              </div>
            ) : (
              listaBuscada.map(cliente => {
                const progresso = progressoPorCliente.get(cliente.id)
                const oportunidade = oportunidadePorCliente.get(cliente.id)
                const temperatura = derivarTemperatura(oportunidade)
                const prioridade = prioridadePorCliente.get(cliente.id) || 'baixa'
                const { score } = calcularScoreCliente(cliente, hoje)
                const classificacao = classificacaoScore(score)
                const situacao = derivarSituacao(cliente, oportunidade, progresso?.etapaAtual.label)
                const { objetivo, mentorRecomenda } = derivarObjetivoEMentor(cliente, oportunidade, progresso?.etapaAtual.objetivo || 'Definir próximo passo')
                const explicacao = explicacaoCliente(cliente, oportunidade, hoje, progresso?.etapaAtual.label)
                return (
                  <Card key={cliente.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <ClienteAvatar nome={cliente.nome} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-[#0F172A]">{cliente.nome}</p>
                            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold', temperatura === 'quente' ? 'border-red-100 bg-red-50 text-red-600' : temperatura === 'morno' ? 'border-amber-100 bg-amber-50 text-amber-600' : 'border-slate-200 bg-slate-100 text-slate-500')}>{TEMPERATURA_LABEL[temperatura]}</span>
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', prioridade === 'maxima' ? 'bg-red-100 text-red-700' : prioridade === 'alta' ? 'bg-red-50 text-red-600' : prioridade === 'media' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500')}>{PRIORIDADE_LABEL[prioridade]}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-400">{cliente.canal_origem ? CRM_CANAL_LABEL[cliente.canal_origem] : 'Sem origem'}</p>
                          <p className="text-xs text-slate-400">{oportunidade?.veiculo_interesse || cliente.empresa || 'Veículo não informado'}</p>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 lg:px-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Situação</p>
                        <p className="text-sm font-bold text-[#0F172A]">{situacao}</p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Objetivo</p>
                        <p className="text-sm text-slate-600">{objetivo}</p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Mentor recomenda</p>
                        <p className="text-sm font-bold text-[#005BFF]">{mentorRecomenda}</p>
                        <p className="mt-1 text-xs italic text-slate-400">{explicacao}</p>
                        <p className="mt-1 text-xs font-bold text-amber-500">★ {score} · {classificacao.label}</p>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 lg:w-[180px]">
                        <button type="button" onClick={() => executarProximoPasso(cliente)} className="flex items-center justify-center gap-1.5 rounded-xl bg-[#005BFF] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700">
                          <Sparkles size={14} /> Executar próximo passo
                        </button>
                        <button type="button" onClick={() => { setPanelClosed(false); setSelectedId(cliente.id) }} className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50">
                          <FileText size={14} /> Abrir ficha
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </section>

          {selectedCliente && (
            <FluxoClientePanel
              cliente={selectedCliente}
              oportunidade={oportunidadePorCliente.get(selectedCliente.id)}
                progresso={progressoPorCliente.get(selectedCliente.id) || derivarProgresso(selectedCliente, carteiraOportunidades, agendamentos)}
                vendedor={(profile?.name || 'vendedor').split(' ')[0]}
                positionLabel={`${Math.max(1, filtered.findIndex(cliente => cliente.id === selectedCliente.id) + 1)} de ${demoMode ? totalClientes : filtered.length}`}
                statusSaving={cadenciaSaving}
                onStatus={handleRegistrarStatusCadencia}
                onNaoRespondeu={cliente => setNaoRespondeuCliente(cliente)}
                onEditarProximoPasso={cliente => setEditandoProximoPasso(cliente)}
              onClose={() => { setSelectedId(null); setPanelClosed(true) }}
            />
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adicionar cliente"
        description="Cadastre o cliente, defina a origem e inicie a cadência da carteira."
        footer={(
          <div className="flex justify-end gap-mx-sm">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando...' : 'Salvar cliente'}</Button>
          </div>
        )}
      >
        <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2">
          <FormField label="Nome *" value={form.nome} onChange={event => setForm(current => ({ ...current, nome: event.target.value }))} placeholder="Nome do cliente" />
          <FormField label="Telefone" value={form.telefone || ''} onChange={event => setForm(current => ({ ...current, telefone: event.target.value }))} placeholder="(00) 00000-0000" />
          <FormField label="Veículo procurado" value={form.empresa || ''} onChange={event => setForm(current => ({ ...current, empresa: event.target.value }))} placeholder="Modelo de interesse" />
          <Select label="Canal de origem" value={form.canal_origem || ''} onChange={event => setForm(current => ({ ...current, canal_origem: (event.target.value || null) as ClienteInput['canal_origem'] }))}>
            <option value="">Selecione</option>
            {CRM_CANAIS.map(canal => <option key={canal} value={canal}>{CRM_CANAL_LABEL[canal]}</option>)}
          </Select>
          <Select label="Status do cliente" value={form.status} onChange={event => setForm(current => ({ ...current, status: event.target.value as CrmClienteStatus }))}>
            {CRM_CLIENTE_STATUS.map(status => <option key={status} value={status}>{STATUS_CLIENTE_LABEL[status] || CRM_CLIENTE_STATUS_LABEL[status]}</option>)}
          </Select>
          <Select label="Relacionamento" value={form.relacionamento} onChange={event => setForm(current => ({ ...current, relacionamento: event.target.value as ClienteInput['relacionamento'] }))}>
            {CRM_RELACIONAMENTO.map(relacionamento => <option key={relacionamento} value={relacionamento}>{CRM_RELACIONAMENTO_LABEL[relacionamento]}</option>)}
          </Select>
          <FormField label="Próxima ação" value={form.proxima_acao || ''} onChange={event => setForm(current => ({ ...current, proxima_acao: event.target.value }))} placeholder="Ex: Confirmar visita" />
          <FormField type="date" label="Data da próxima ação" value={form.proxima_acao_em || ''} onChange={event => setForm(current => ({ ...current, proxima_acao_em: event.target.value }))} />
          <FormField type="number" label="Valor previsto (R$)" value={String(form.potencial_negocio ?? 0)} onChange={event => setForm(current => ({ ...current, potencial_negocio: Number(event.target.value) || 0 }))} />
          <div className="space-y-mx-xs sm:col-span-2">
            <label htmlFor="crm-cliente-obs" className="ml-2 block"><Typography variant="caption" tone="muted">Histórico / observações</Typography></label>
            <Textarea id="crm-cliente-obs" value={form.observacoes || ''} onChange={event => setForm(current => ({ ...current, observacoes: event.target.value }))} placeholder="Notas, histórico inicial e contexto da próxima tentativa..." />
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(naoRespondeuCliente)}
        onClose={() => setNaoRespondeuCliente(null)}
        title="Cliente não respondeu"
        description={naoRespondeuCliente ? `Tentativa atual: 1/3 para ${naoRespondeuCliente.nome}` : undefined}
        footer={(
          <div className="flex flex-wrap justify-end gap-mx-sm">
            <Button variant="ghost" onClick={() => setNaoRespondeuCliente(null)}>Escolher outro horário</Button>
            <Button variant="outline" onClick={() => setNaoRespondeuCliente(null)}>Encerrar cadência</Button>
            <Button
              onClick={() => {
                if (naoRespondeuCliente) {
                  handleRegistrarStatusCadencia(naoRespondeuCliente.id, 'nao_feito')
                }
                setNaoRespondeuCliente(null)
              }}
            >
              Confirmar reagendamento
            </Button>
          </div>
        )}
      >
        <div className="space-y-mx-md">
          <div className="rounded-mx-lg border border-status-warning/20 bg-status-warning/5 p-mx-md">
            <Typography variant="caption" tone="muted" className="block font-bold uppercase tracking-normal">Próxima ação sugerida</Typography>
            <Typography variant="p" className="font-bold">Amanhã às 10:00 - Tentativa 2/3</Typography>
          </div>
          <div className="rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-md">
            <Typography variant="caption" tone="muted" className="block font-bold uppercase tracking-normal">Mensagem sugerida</Typography>
            <Typography variant="p" className="mt-mx-xs text-sm italic text-text-secondary">
              "Olá, Maria. Tudo bem? Estou passando para confirmar nossa visita e tirar qualquer dúvida."
            </Typography>
          </div>
        </div>
      </Modal>

      {modoAtaqueOpen && (
        <ModoAtaqueView
          clientes={carteiraClientes}
          oportunidadePorCliente={oportunidadePorCliente}
          registrarStatusCadencia={registrarStatusCadencia}
          onSair={() => setModoAtaqueOpen(false)}
          onAbrirFicha={clienteId => {
            setModoAtaqueOpen(false)
            setPanelClosed(false)
            setSelectedId(clienteId)
          }}
        />
      )}

      <AlterarProximoPasso
        open={!!editandoProximoPasso}
        cliente={editandoProximoPasso}
        onClose={() => setEditandoProximoPasso(null)}
        onSalvar={async ({ proxima_acao, proxima_acao_em }) => {
          if (!editandoProximoPasso) return { error: null }
          const { error } = await updateCliente(editandoProximoPasso.id, { proxima_acao, proxima_acao_em })
          if (error) { toast.error(error); return { error } }
          toast.success('Próximo passo atualizado.')
          return { error: null }
        }}
      />
    </main>
  )
}

function FluxoClientePanel({
  cliente,
  oportunidade,
  progresso,
  vendedor,
  positionLabel,
  statusSaving,
  onStatus,
  onNaoRespondeu,
  onEditarProximoPasso,
  onClose,
}: {
  cliente: Cliente
  oportunidade?: OportunidadeComCliente
  progresso: ProgressoCadencia
  vendedor: string
  positionLabel: string
  statusSaving: boolean
  onStatus: (clienteId: string, status: CadenciaResultadoAcao) => void
  onNaoRespondeu: (cliente: Cliente) => void
  onEditarProximoPasso: (cliente: Cliente) => void
  onClose: () => void
}) {
  const primeiroNome = cliente.nome.split(' ')[0]
  const script = progresso.etapaAtual.script({ cliente: primeiroNome, vendedor })
  const canalLabel = cliente.canal_origem ? CRM_CANAL_LABEL[cliente.canal_origem] : 'Sem origem'
  const whatsappHref = cliente.telefone ? `https://wa.me/55${cliente.telefone.replace(/\D/g, '')}` : null
  const tentativaAtual = Math.max(1, Math.min(3, Math.ceil(progresso.cadencia / 34) || 1))

  async function copiarScript() {
    try {
      await navigator.clipboard.writeText(script)
      toast.success('Script copiado.')
    } catch {
      toast.error('Não foi possível copiar o script.')
    }
  }

  return (
    <Card className="rounded-mx-xl border border-border-subtle bg-white p-mx-sm shadow-mx-md xl:sticky xl:top-mx-xs" aria-label={`Fluxo do cliente ${cliente.nome}`}>
      <div className="mb-mx-sm flex items-center justify-between border-b border-border-subtle pb-mx-xs">
        <Typography variant="caption" className="font-black uppercase tracking-normal">Cliente selecionado</Typography>
        <span className="flex items-center gap-mx-xs">
          <Typography variant="caption" tone="muted">{positionLabel}</Typography>
          <button type="button" aria-label="Fechar painel" onClick={onClose} className="rounded-mx-sm p-1 text-text-muted hover:bg-surface-alt">
            <X size={14} />
          </button>
        </span>
      </div>
      <div className="flex items-start justify-between gap-mx-sm">
        <div className="min-w-0">
          <span className="flex items-center gap-mx-xs">
            <ClienteAvatar nome={cliente.nome} />
            <span className="min-w-0">
              <Typography variant="h3" className="truncate text-lg">{cliente.nome}</Typography>
              <Badge variant="info" className="mt-1 px-2 py-0.5 text-[10px]">{canalLabel}</Badge>
            </span>
          </span>
          {cliente.telefone && (
            <span className="mt-mx-tiny inline-flex items-center gap-1 text-sm text-text-secondary">
              <Phone size={13} /> {cliente.telefone}
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Abrir WhatsApp" className="ml-1 text-status-success hover:opacity-80">
                  <MessageCircle size={15} />
                </a>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="mt-mx-sm rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-sm">
        <Typography variant="caption" tone="muted" className="mb-mx-xs block font-bold uppercase tracking-normal">Resumo do cliente</Typography>
        <div className="grid grid-cols-2 gap-mx-xs text-xs font-bold">
          <InfoItem label="Veículo de interesse" value={oportunidade?.veiculo_interesse || cliente.empresa || 'Não informado'} />
          <InfoItem label="Valor previsto" value={oportunidade?.valor_negociado ? BRL(oportunidade.valor_negociado) : BRL(cliente.potencial_negocio || 0)} />
          <InfoItem label="Carro na troca" value={oportunidade?.carro_avaliado ? 'Sim' : 'Não'} />
          <InfoItem label="Ficha do cliente" value={getFichaLabel(oportunidade?.financiamento)} />
          <InfoItem label="Status do cliente" value={STATUS_CLIENTE_LABEL[cliente.status] || CRM_CLIENTE_STATUS_LABEL[cliente.status]} />
          <InfoItem label="Origem" value={canalLabel} />
        </div>
      </div>

      <Typography variant="caption" tone="muted" className="mt-mx-sm block font-bold uppercase tracking-normal">Fluxo do Cliente</Typography>
      <ol className="mt-mx-sm flex items-center gap-1" aria-label="Etapas da cadência">
        {CLIENT_FLOW_STEPS.map((label, index) => {
          const etapaAtualVisual = getVisualStageIndex(progresso.etapaAtual.label, cliente.status)
          const concluida = index < etapaAtualVisual
          const atual = index === etapaAtualVisual
          return (
            <li key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold',
                concluida ? 'bg-status-success text-white' : atual ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20' : 'bg-surface-alt text-text-tertiary',
              )}>
                {concluida ? <Check size={13} /> : index + 1}
              </span>
              <span className={cn('w-full truncate text-center text-[9px] font-bold uppercase', atual ? 'text-brand-primary' : 'text-text-tertiary')}>{label}</span>
            </li>
          )
        })}
      </ol>

      <div className="mt-mx-sm flex items-center justify-between gap-mx-sm">
        <Typography variant="p" className="font-bold">
          Etapa {getVisualStageIndex(progresso.etapaAtual.label, cliente.status) + 1} de {CLIENT_FLOW_STEPS.length} - {CLIENT_FLOW_STEPS[getVisualStageIndex(progresso.etapaAtual.label, cliente.status)]}
        </Typography>
        <Badge variant={progresso.cadencia >= 70 ? 'success' : 'info'}>{progresso.cadencia}%</Badge>
      </div>

      <div className="mt-mx-sm grid grid-cols-2 gap-mx-xs rounded-mx-lg bg-brand-primary/5 p-mx-sm">
        <InfoItem label="Cadência" value="Fluxo ativo" />
        <InfoItem label="Tentativa atual" value={`${tentativaAtual}/3`} />
        <InfoItem label="Limite de tentativas" value="3" />
        <InfoItem label="Próxima regra" value="Se não responder, criar ação futura" />
      </div>

      <div className="mt-mx-sm grid gap-mx-sm 2xl:grid-cols-2">
        <div>
          <Typography variant="caption" tone="muted" className="font-bold uppercase tracking-normal">Objetivo da etapa</Typography>
          <Typography variant="p" className="mt-mx-tiny text-sm">{progresso.etapaAtual.objetivo}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted" className="font-bold uppercase tracking-normal">O que fazer</Typography>
          <ul className="mt-mx-tiny space-y-mx-tiny">
            {progresso.etapaAtual.oQueFazer.map(item => (
              <li key={item} className="flex items-start gap-mx-xs text-xs font-bold text-text-secondary">
                <Check size={14} className="mt-0.5 shrink-0 text-status-success" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-mx-lg border border-status-success/20 bg-status-success/5 p-mx-sm">
          <div className="flex items-center justify-between gap-mx-sm">
            <Typography variant="caption" tone="muted" className="font-bold uppercase tracking-normal">Próxima Melhor Ação</Typography>
            <Button variant="ghost" size="xs" onClick={() => onEditarProximoPasso(cliente)}>Editar</Button>
          </div>
          <Typography variant="p" className="mt-mx-tiny text-sm font-bold">{cliente.proxima_acao || progresso.etapaAtual.objetivo}</Typography>
          <Typography variant="caption" tone="muted" className="block">Motivo: manter cliente no fluxo e alimentar a Central de Execução.</Typography>
          <Typography variant="caption" tone="muted" className="block">Horário: {cliente.proxima_acao_em ? formatDateBR(cliente.proxima_acao_em) : 'Hoje - definir horário'}</Typography>
          <Typography variant="caption" tone="muted" className="block">Origem: Central de Execução</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted" className="font-bold uppercase tracking-normal">Resultado da ação</Typography>
          <div className="mt-mx-sm grid grid-cols-2 gap-mx-xs">
            <Button variant="outline" size="sm" disabled={statusSaving} onClick={() => onStatus(cliente.id, 'feito')}>
              <Check size={14} /> Feito
            </Button>
            <Button variant="outline" size="sm" disabled={statusSaving} onClick={() => onNaoRespondeu(cliente)}>
              <Phone size={14} /> Não respondeu
            </Button>
            <Button variant="outline" size="sm" disabled={statusSaving} onClick={() => onStatus(cliente.id, 'aguardando')}>
              <Hourglass size={14} /> Aguardando
            </Button>
            <Button variant="outline" size="sm" disabled={statusSaving} onClick={() => onStatus(cliente.id, 'aguardando')}>
              <CalendarDays size={14} /> Reagendar
            </Button>
            <Button variant="outline" size="sm" disabled={statusSaving} onClick={() => onStatus(cliente.id, 'nao_feito')}>
              <X size={14} /> Não feito
            </Button>
          </div>
        </div>
<div className="rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-sm">
          <div className="flex items-center justify-between gap-mx-sm">
            <Typography variant="caption" tone="muted" className="font-bold uppercase tracking-normal">Script sugerido</Typography>
            <Button variant="ghost" size="icon" aria-label="Copiar script" onClick={copiarScript}><Copy size={14} /></Button>
          </div>
          <Typography variant="p" className="mt-mx-tiny text-sm italic text-text-secondary">"{script}"</Typography>
        </div>
<div className="grid grid-cols-1 gap-mx-sm">
          <div className="rounded-mx-lg border border-border-subtle bg-white p-mx-sm">
            <div className="flex items-center justify-between gap-mx-sm">
              <Typography variant="caption" tone="muted" className="font-bold uppercase tracking-normal">Histórico de interações</Typography>
              <Button variant="ghost" size="xs">Ver todas</Button>
            </div>
            <TimelineItem title="Próxima ação gerada" detail={cliente.proxima_acao || 'Definir ação'} date={cliente.proxima_acao_em ? formatDateBR(cliente.proxima_acao_em) : 'Sem data'} />
            <TimelineItem title="Última interação" detail={cliente.observacoes || 'Histórico de cadastro e cadência'} date={cliente.ultima_interacao ? formatDateBR(cliente.ultima_interacao) : 'Sem registro'} />
          </div>
          <div className="rounded-mx-lg border border-border-subtle bg-white p-mx-sm">
            <Typography variant="caption" tone="muted" className="block font-bold uppercase tracking-normal">Orientações</Typography>
            <div className="mt-mx-sm space-y-mx-xs">
              {['Como negociar uma visita', 'Críticas do pós-venda: preservar', 'Objeções mais frequentes'].map(item => (
                <button key={item} type="button" className="flex w-full items-center justify-between rounded-mx-md border border-border-subtle px-mx-sm py-mx-xs text-left text-xs font-bold text-text-secondary">
                  {item}
                  <ChevronDown size={13} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'MX'
}

function ClienteAvatar({ nome }: { nome: string }) {
  const colors = ['bg-brand-primary', 'bg-status-success', 'bg-status-info', 'bg-status-warning', 'bg-status-error']
  const color = colors[nome.length % colors.length]
  return <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white', color)}>{getInitials(nome)}</span>
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0">
      <Typography variant="caption" tone="muted" className="block uppercase tracking-normal">{label}</Typography>
      <Typography variant="caption" className="block truncate font-bold">{value}</Typography>
    </span>
  )
}

function TimelineItem({ title, detail, date }: { title: string; detail: string; date: string }) {
  return (
    <div className="mt-mx-sm border-t border-border-subtle pt-mx-sm">
      <Typography variant="caption" className="block font-bold">{title}</Typography>
      <Typography variant="caption" tone="muted" className="block">{detail}</Typography>
      <Typography variant="caption" tone="muted" className="block">{date}</Typography>
    </div>
  )
}

function getFichaLabel(value?: string | null) {
  if (value === 'aprovado') return 'Aprovada'
  if (value === 'reprovado') return 'Recusada'
  if (value === 'pendente') return 'Não enviada'
  return 'Não aplica'
}

function getVisualStageIndex(label: string, status: CrmClienteStatus) {
  if (status === 'pos_venda') return 6
  const normalized = label.toLowerCase()
  if (normalized.includes('lead')) return 0
  if (normalized.includes('contato') || normalized.includes('atendimento')) return 1
  if (normalized.includes('agendamento')) return 2
  if (normalized.includes('visita') || normalized.includes('apresenta')) return 3
  if (normalized.includes('negocia') || normalized.includes('proposta')) return 4
  if (normalized.includes('venda')) return 5
  return 0
}


function makeDemoCliente(
  id: string,
  nome: string,
  telefone: string,
  empresa: string,
  canal_origem: CrmCanal,
  status: CrmClienteStatus,
  relacionamento: Cliente['relacionamento'],
  proxima_acao: string,
  proxima_acao_em: string | null,
  potencial_negocio: number,
): Cliente {
  return {
    id,
    loja_id: '99999999-9999-4999-8999-999999999999',
    seller_user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    nome,
    telefone,
    empresa,
    canal_origem,
    status,
    relacionamento,
    ultima_interacao: '2026-06-16',
    proxima_acao,
    proxima_acao_em,
    potencial_negocio,
    observacoes: null,
    created_at: '2026-06-16T12:00:00Z',
    updated_at: '2026-06-16T12:00:00Z',
  }
}

function makeDemoOportunidade(
  cliente: Cliente,
  etapa: OportunidadeComCliente['etapa'],
  carro_avaliado: boolean,
  financiamento: OportunidadeComCliente['financiamento'],
): OportunidadeComCliente {
  return {
    id: cliente.id.replace(/^./, '9'),
    cliente_id: cliente.id,
    loja_id: cliente.loja_id,
    seller_user_id: cliente.seller_user_id,
    veiculo_interesse: cliente.empresa,
    tipo_veiculo: 'carro',
    valor_negociado: cliente.potencial_negocio,
    etapa,
    canal: cliente.canal_origem,
    sinal: etapa === 'ganho' ? 5000 : 0,
    financiamento,
    carro_avaliado,
    motivo_perda: null,
    placa_veiculo: null,
    data_entrega_prevista: null,
    created_at: '2026-06-16T12:00:00Z',
    updated_at: '2026-06-16T12:00:00Z',
    closed_at: etapa === 'ganho' ? '2026-06-16T18:00:00Z' : null,
    cliente: { nome: cliente.nome, telefone: cliente.telefone },
  }
}

export default CarteiraClientes
