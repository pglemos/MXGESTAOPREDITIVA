import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from '@/lib/toast'
import {
  CalendarDays,
  Check,
  CheckCircle,
  ChevronDown,
  Copy,
  Edit2,
  FileText,
  Hourglass,
  MessageCircle,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Trophy,
  Users,
  X,
  Zap,
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
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { FormField } from '@/components/molecules/FormField'
import { Modal } from '@/components/organisms/Modal'
import { PlanoAtaqueTab } from '@/features/crm/PlanoAtaqueTab'
import { ModoAtaqueView } from '@/features/crm/ModoAtaqueView'
import { AlterarProximoPasso } from '@/features/crm/AlterarProximoPasso'
import { useClientes, type ClienteInput } from '@/features/crm/hooks/useClientes'
import { useOportunidades, type OportunidadeComCliente } from '@/features/crm/hooks/useOportunidades'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import { SellerPageHeader } from '@/components/seller/SellerPageHeader'
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
  formatarMoedaBRInput,
  formatarTelefoneBR,
  isTelefoneBRValido,
  moedaBRParaNumero,
  formatDateBR,
  toDateOnlyBR,
  type Cliente,
  type CrmCanal,
  type CrmClienteStatus,
  type CrmRelacionamento,
} from '@/lib/schemas/crm.schema'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format

function scoreBadgeClass(score: number): string {
  if (score >= 90) return 'bg-green-50 text-green-600'
  if (score >= 75) return 'bg-blue-50 text-blue-600'
  if (score >= 50) return 'bg-amber-50 text-amber-600'
  return 'bg-red-50 text-red-600'
}

const MODO_ATAQUE_ACEITO_KEY = 'mx_modo_ataque_aceito'

type ProximaInfo = { cliente: Cliente; nome: string; veiculo: string | null; proximoPasso: string; objetivo: string }

/** Canal usado ao executar o próximo passo (planilha #9 — não força mais WhatsApp). */
type CanalContato = 'whatsapp' | 'ligacao' | 'presencial'

type FiltroPrioridade = 'alta' | 'media' | 'baixa'
type FiltroSituacao = 'sem_visita' | 'visita_agendada' | 'proposta_enviada' | 'recuperacao' | 'sem_proximo_passo' | 'proximo_passo_vencido'
type FiltroPeriodo = 'hoje' | 'amanha' | 'proximos_7_dias' | 'vencidos' | 'sem_data'

type FiltrosAvancados = {
  veiculo?: string
  origens?: CrmCanal[]
  situacoes?: FiltroSituacao[]
  periodos?: FiltroPeriodo[]
  prioridades?: FiltroPrioridade[]
}

const ORIGENS_FILTRO: CrmCanal[] = ['internet', 'porta', 'carteira', 'showroom']
const SITUACOES_FILTRO: Array<{ value: FiltroSituacao; label: string }> = [
  { value: 'sem_visita', label: 'Sem visita' },
  { value: 'visita_agendada', label: 'Visita agendada' },
  { value: 'proposta_enviada', label: 'Proposta enviada' },
  { value: 'recuperacao', label: 'Recuperação' },
  { value: 'sem_proximo_passo', label: 'Sem próximo passo' },
  { value: 'proximo_passo_vencido', label: 'Próximo passo vencido' },
]
const PERIODOS_FILTRO: Array<{ value: FiltroPeriodo; label: string }> = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'amanha', label: 'Amanhã' },
  { value: 'proximos_7_dias', label: 'Próximos 7 dias' },
  { value: 'vencidos', label: 'Vencidos' },
  { value: 'sem_data', label: 'Sem data' },
]
const PRIORIDADES_FILTRO: Array<{ value: FiltroPrioridade; label: string }> = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
]

function temFiltrosAtivos(filtros: FiltrosAvancados): boolean {
  return Boolean(filtros.veiculo) || Boolean(filtros.origens?.length) || Boolean(filtros.situacoes?.length) || Boolean(filtros.periodos?.length) || Boolean(filtros.prioridades?.length)
}

function removerFiltro(key: string, setFiltros: (updater: (prev: FiltrosAvancados) => FiltrosAvancados) => void) {
  const [campo, valor] = key.split(':')
  setFiltros(prev => {
    if (!valor) {
      const next = { ...prev }
      delete next[campo as keyof FiltrosAvancados]
      return next
    }
    if (campo === 'origens') return { ...prev, origens: (prev.origens || []).filter(v => v !== valor) }
    if (campo === 'situacoes') return { ...prev, situacoes: (prev.situacoes || []).filter(v => v !== valor) as FiltroSituacao[] }
    if (campo === 'periodos') return { ...prev, periodos: (prev.periodos || []).filter(v => v !== valor) as FiltroPeriodo[] }
    if (campo === 'prioridades') return { ...prev, prioridades: (prev.prioridades || []).filter(v => v !== valor) as FiltroPrioridade[] }
    return prev
  })
}

function ChipsFiltrosAtivos({ filtros, onRemover }: { filtros: FiltrosAvancados; onRemover: (key: string) => void }) {
  const chips: Array<{ key: string; label: string }> = []
  if (filtros.veiculo) chips.push({ key: 'veiculo', label: `Veículo: ${filtros.veiculo}` })
  for (const origem of filtros.origens || []) chips.push({ key: `origens:${origem}`, label: CRM_CANAL_LABEL[origem] })
  for (const situacao of filtros.situacoes || []) chips.push({ key: `situacoes:${situacao}`, label: SITUACOES_FILTRO.find(s => s.value === situacao)?.label || situacao })
  for (const periodo of filtros.periodos || []) chips.push({ key: `periodos:${periodo}`, label: PERIODOS_FILTRO.find(p => p.value === periodo)?.label || periodo })
  for (const prioridade of filtros.prioridades || []) chips.push({ key: `prioridades:${prioridade}`, label: `Prioridade: ${PRIORIDADES_FILTRO.find(p => p.value === prioridade)?.label || prioridade}` })
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map(chip => (
        <span key={chip.key} className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#005BFF]">
          {chip.label}
          <button type="button" onClick={() => onRemover(chip.key)}><X size={12} /></button>
        </span>
      ))}
    </div>
  )
}

function PainelFiltros({ filtrosAtivos, onAplicar, onFechar }: { filtrosAtivos: FiltrosAvancados; onAplicar: (filtros: FiltrosAvancados) => void; onFechar: () => void }) {
  const [local, setLocal] = useState<FiltrosAvancados>({ ...filtrosAtivos })

  function toggle<K extends 'origens' | 'situacoes' | 'periodos' | 'prioridades'>(campo: K, valor: NonNullable<FiltrosAvancados[K]>[number]) {
    setLocal(prev => {
      const arr = (prev[campo] as typeof valor[]) || []
      return { ...prev, [campo]: arr.includes(valor) ? arr.filter(v => v !== valor) : [...arr, valor] }
    })
  }

  function chipClass(ativo: boolean) {
    return cn('cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all', ativo ? 'border-[#005BFF] bg-[#005BFF] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300')
  }

  return (
    <div className="fixed inset-0 z-[220] flex">
      <div className="flex-1 bg-black/30" onClick={onFechar} />
      <div className="flex w-80 flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="font-black text-[#031B3D]">Filtros</p>
          <button type="button" onClick={onFechar}><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="flex-1 space-y-5 px-5 py-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Veículo de interesse</p>
            <input
              value={local.veiculo || ''}
              onChange={event => setLocal(prev => ({ ...prev, veiculo: event.target.value }))}
              placeholder="Ex: HR-V, Corolla..."
              className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#005BFF]"
            />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Origem</p>
            <div className="flex flex-wrap gap-1.5">
              {ORIGENS_FILTRO.map(origem => (
                <button key={origem} type="button" onClick={() => toggle('origens', origem)} className={chipClass((local.origens || []).includes(origem))}>{CRM_CANAL_LABEL[origem]}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Situação</p>
            <div className="flex flex-wrap gap-1.5">
              {SITUACOES_FILTRO.map(situacao => (
                <button key={situacao.value} type="button" onClick={() => toggle('situacoes', situacao.value)} className={chipClass((local.situacoes || []).includes(situacao.value))}>{situacao.label}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Período</p>
            <div className="flex flex-wrap gap-1.5">
              {PERIODOS_FILTRO.map(periodo => (
                <button key={periodo.value} type="button" onClick={() => toggle('periodos', periodo.value)} className={chipClass((local.periodos || []).includes(periodo.value))}>{periodo.label}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Prioridade</p>
            <div className="flex flex-wrap gap-1.5">
              {PRIORIDADES_FILTRO.map(prioridade => (
                <button key={prioridade.value} type="button" onClick={() => toggle('prioridades', prioridade.value)} className={chipClass((local.prioridades || []).includes(prioridade.value))}>{prioridade.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
          <Button variant="outline" className="flex-1 rounded-xl text-sm" onClick={() => { setLocal({}); onAplicar({}) }}>Limpar</Button>
          <Button className="flex-1 rounded-xl bg-[#005BFF] text-sm text-white hover:bg-blue-700" onClick={() => onAplicar(local)}>Aplicar filtros</Button>
        </div>
      </div>
    </div>
  )
}

function aplicarFiltrosAvancados(
  clientes: Cliente[],
  filtros: FiltrosAvancados,
  oportunidadePorCliente: Map<string, OportunidadeComCliente>,
  prioridadePorCliente: Map<string, Prioridade>,
  hoje: string,
): Cliente[] {
  let lista = clientes
  if (filtros.veiculo) {
    const termo = filtros.veiculo.toLowerCase()
    lista = lista.filter(cliente => (oportunidadePorCliente.get(cliente.id)?.veiculo_interesse || '').toLowerCase().includes(termo))
  }
  if (filtros.origens?.length) {
    lista = lista.filter(cliente => cliente.canal_origem && filtros.origens?.includes(cliente.canal_origem))
  }
  if (filtros.prioridades?.length) {
    lista = lista.filter(cliente => {
      const prioridade = prioridadePorCliente.get(cliente.id)
      return prioridade === 'alta' || prioridade === 'media' || prioridade === 'baixa' ? filtros.prioridades?.includes(prioridade) : false
    })
  }
  if (filtros.situacoes?.length) {
    lista = lista.filter(cliente => {
      const oportunidade = oportunidadePorCliente.get(cliente.id)
      const etapa = oportunidade?.etapa
      return filtros.situacoes?.some(situacao => {
        if (situacao === 'sem_visita') return etapa === 'prospeccao' || etapa === 'qualificacao'
        if (situacao === 'visita_agendada') return etapa === 'apresentacao'
        if (situacao === 'proposta_enviada') return etapa === 'fechamento'
        if (situacao === 'recuperacao') return etapa === 'perdido'
        if (situacao === 'sem_proximo_passo') return !cliente.proxima_acao_em
        if (situacao === 'proximo_passo_vencido') return Boolean(cliente.proxima_acao_em && cliente.proxima_acao_em.slice(0, 10) < hoje)
        return false
      })
    })
  }
  if (filtros.periodos?.length) {
    lista = lista.filter(cliente => {
      const data = cliente.proxima_acao_em ? cliente.proxima_acao_em.slice(0, 10) : null
      return filtros.periodos?.some(periodo => {
        if (periodo === 'sem_data') return !data
        if (!data) return false
        if (periodo === 'hoje') return data === hoje
        if (periodo === 'vencidos') return data < hoje
        const dias = Math.round((new Date(`${data}T00:00:00`).getTime() - new Date(`${hoje}T00:00:00`).getTime()) / 86400000)
        if (periodo === 'amanha') return dias === 1
        if (periodo === 'proximos_7_dias') return dias >= 0 && dias <= 7
        return false
      })
    })
  }
  return lista
}

const STATUS_CLIENTE_LABEL: Record<CrmClienteStatus, string> = {
  oportunidade: 'Oportunidade',
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
  const [filtrosPanelOpen, setFiltrosPanelOpen] = useState(false)
  const [filtrosAvancados, setFiltrosAvancados] = useState<FiltrosAvancados>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<ClienteInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
    return params.get('cliente_id')
  })
  const [panelClosed, setPanelClosed] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
    const busca = params.get('busca')
    if (busca) setSearch(busca)
  }, [])
  const [cadenciaSaving, setCadenciaSaving] = useState(false)
  const [naoRespondeuCliente, setNaoRespondeuCliente] = useState<Cliente | null>(null)
  const [activeTab, setActiveTab] = useState<'ativa' | 'ataque'>('ativa')
  const [modoAtaqueOpen, setModoAtaqueOpen] = useState(false)
  const [editandoProximoPasso, setEditandoProximoPasso] = useState<Cliente | null>(null)
  const [diaFiltro, setDiaFiltro] = useState<PrioridadeDia | 'todos'>('hoje')
  const [proximaModalOpen, setProximaModalOpen] = useState(false)
  const [proximaOportunidade, setProximaOportunidade] = useState<ProximaInfo | null>(null)
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

  const totalClientes = demoMode ? DEMO_KPIS.total : metrics.total

  const listaBuscada = useMemo(() => {
    const q = search.trim().toLowerCase()
    let lista = q
      ? clientesOrdenadosPorPrioridade.filter(cliente => {
        const oportunidade = oportunidadePorCliente.get(cliente.id)
        return cliente.nome.toLowerCase().includes(q)
          || (cliente.telefone || '').includes(q)
          || (oportunidade?.veiculo_interesse || cliente.empresa || '').toLowerCase().includes(q)
      })
      : clientesOrdenadosPorPrioridade
    lista = aplicarFiltrosAvancados(lista, filtrosAvancados, oportunidadePorCliente, prioridadePorCliente, hoje)
    return lista
  }, [clientesOrdenadosPorPrioridade, filtrosAvancados, hoje, oportunidadePorCliente, prioridadePorCliente, search])

  async function handleCreate() {
    if (!form.nome.trim()) {
      toast.error('Informe o nome do cliente.')
      return
    }
    if (form.telefone && !isTelefoneBRValido(form.telefone)) {
      toast.error('Informe um telefone brasileiro válido com DDD.')
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

  function abrirProximaOportunidade(handledId: string) {
    const ordem: Record<Prioridade, number> = { maxima: 0, alta: 1, media: 2, baixa: 3 }
    const proxima = [...carteiraClientes]
      .filter(cliente => cliente.id !== handledId)
      .sort((a, b) => (ordem[prioridadePorCliente.get(a.id) || 'baixa']) - (ordem[prioridadePorCliente.get(b.id) || 'baixa']))[0]
    if (proxima) {
      const oport = oportunidadePorCliente.get(proxima.id)
      const prog = progressoPorCliente.get(proxima.id)
      const { objetivo, mentorRecomenda } = derivarObjetivoEMentor(proxima, oport, prog?.etapaAtual.objetivo || 'Definir próximo passo')
      setProximaOportunidade({
        cliente: proxima,
        nome: proxima.nome,
        veiculo: oport?.veiculo_interesse || proxima.empresa || null,
        proximoPasso: proxima.proxima_acao || mentorRecomenda,
        objetivo,
      })
    } else {
      setProximaOportunidade(null)
    }
    setSelectedId(null)
    setPanelClosed(true)
    setProximaModalOpen(true)
  }

  async function handleRegistrarStatusCadencia(clienteId: string, status: CadenciaResultadoAcao, canalContato?: CanalContato) {
    if (demoMode) {
      toast.success(status === 'nao_feito' ? 'Tentativa registrada e próxima ação enviada para a Central.' : 'Cadência atualizada no modo demonstração.')
      abrirProximaOportunidade(clienteId)
      return
    }
    setCadenciaSaving(true)
    const { error: statusError } = await registrarStatusCadencia({ clienteId, status, canalContato: canalContato ?? null })
    setCadenciaSaving(false)
    if (statusError) {
      toast.error(statusError)
      return
    }
    toast.success(status === 'nao_feito' ? 'Tentativa registrada e próxima ação mantida no fluxo.' : 'Cadência atualizada.')
    abrirProximaOportunidade(clienteId)
  }

  function executarProximoPasso(cliente: Cliente) {
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
      <main className="h-full w-full min-w-0 overflow-y-auto bg-surface-alt text-text-primary no-scrollbar px-mx-sm py-mx-md sm:px-mx-md lg:px-mx-lg">
        <div className="mx-auto flex w-full max-w-[1500px] min-w-0 flex-col gap-4">
<SellerPageHeader icon={Users} title="Mentor Comercial" subtitle="Plano de ataque da carteira" actions={tabNav} />
          <PlanoAtaqueTab
            clientes={carteiraClientes}
            oportunidadePorCliente={oportunidadePorCliente}
            progressoPorCliente={progressoPorCliente}
            agendamentos={agendamentos}
          vendedorNome={(profile?.name || 'Vendedor').split(' ')[0]}
          onAbrirFicha={clienteId => {
            setActiveTab('ativa')
            setPanelClosed(false)
            setSelectedId(clienteId)
          }}
        />
        {modoAtaqueOpen && (
          <ModoAtaqueView
            clientes={carteiraClientes}
            oportunidadePorCliente={oportunidadePorCliente}
            registrarStatusCadencia={registrarStatusCadencia}
            onSair={() => setModoAtaqueOpen(false)}
            onPlanoAtaque={() => setModoAtaqueOpen(false)}
            onAbrirFicha={clienteId => {
              setModoAtaqueOpen(false)
              setActiveTab('ativa')
              setPanelClosed(false)
              setSelectedId(clienteId)
            }}
          />
        )}
      </div>
    </main>
  )
  }

  return (
  <main className="h-full w-full min-w-0 overflow-y-auto bg-surface-alt text-text-primary no-scrollbar px-mx-sm py-mx-md sm:px-mx-md lg:px-mx-lg">
    <div className="mx-auto flex w-full max-w-[1500px] min-w-0 flex-col gap-4">
        <SellerPageHeader icon={Users} title="Mentor Comercial" subtitle="Plano de ataque da carteira" actions={tabNav} />

<div className="flex flex-wrap justify-end gap-2">
            <span className="relative block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar cliente..."
                className="h-9 w-44 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#005BFF]"
              />
            </span>
            <button
              type="button"
              onClick={() => setFiltrosPanelOpen(true)}
              className={cn('flex h-9 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition-all', temFiltrosAtivos(filtrosAvancados) ? 'border-[#005BFF] bg-[#005BFF] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300')}
            >
              <SlidersHorizontal size={16} /> Filtros
            </button>
            <button type="button" onClick={() => setModalOpen(true)} className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#005BFF] px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700">
              <Plus size={16} /> Novo cliente
</button>
</div>

{temFiltrosAtivos(filtrosAvancados) && (
          <ChipsFiltrosAtivos filtros={filtrosAvancados} onRemover={key => removerFiltro(key, setFiltrosAvancados)} />
        )}

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
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
              className={cn('rounded-2xl border p-3.5 text-left transition-all', diaFiltro === tab.id ? 'border-[#005BFF] bg-blue-50 shadow-sm' : 'border-slate-100 bg-white hover:border-blue-100 hover:bg-blue-50/30')}
            >
              <p className={cn('mb-0.5 text-2xl font-black', diaFiltro === tab.id ? 'text-[#005BFF]' : 'text-[#031B3D]')}>{tab.count}</p>
              <p className={cn('text-xs font-bold leading-snug', diaFiltro === tab.id ? 'text-[#005BFF]' : 'text-slate-600')}>{tab.label}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">{tab.sub}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDiaFiltro('todos')}
            className={cn('rounded-2xl border p-3.5 text-left transition-all', diaFiltro === 'todos' ? 'border-[#005BFF] bg-blue-50 shadow-sm' : 'border-slate-100 bg-white hover:border-blue-100 hover:bg-blue-50/30')}
          >
            <p className={cn('mb-0.5 text-2xl font-black', diaFiltro === 'todos' ? 'text-[#005BFF]' : 'text-[#031B3D]')}>{totalClientes}</p>
            <p className={cn('text-xs font-bold leading-snug', diaFiltro === 'todos' ? 'text-[#005BFF]' : 'text-slate-600')}>Ver Todos</p>
            <p className="mt-0.5 text-[10px] text-slate-400">lista por prioridade</p>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <section className="min-w-0 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">{listaBuscada.length} cliente{listaBuscada.length !== 1 ? 's' : ''} · {diaFiltro === 'todos' ? 'Ver Todos' : `Prioridade ${diaFiltro === 'hoje' ? 'Hoje' : diaFiltro === 'amanha' ? 'Amanhã' : diaFiltro === 'dia2' ? diaLabel.dia2 : diaLabel.dia3}`}</p>
              {diaFiltro !== 'hoje' && (
                <button type="button" onClick={() => setDiaFiltro('hoje')} className="text-xs text-[#005BFF] hover:underline">Prioridade hoje</button>
              )}
            </div>

            {error && <Typography tone="muted" className="text-status-error">{error}</Typography>}
            {loading ? (
              <Typography tone="muted">Carregando carteira...</Typography>
            ) : listaBuscada.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
                <p className="mb-3 text-4xl">{diaFiltro === 'hoje' ? '✅' : '📋'}</p>
                <p className="text-sm font-semibold text-slate-500">
                  {carteiraClientes.length === 0 ? 'Sua carteira está vazia.' : diaFiltro === 'hoje' ? 'Você concluiu as prioridades de hoje.' : 'Nenhum cliente encontrado para este filtro.'}
                </p>
                {diaFiltro === 'hoje' && (
                  <button type="button" onClick={() => setDiaFiltro('todos')} className="mx-auto mt-2 block text-xs text-[#005BFF] hover:underline">Ver todos os clientes</button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
              {listaBuscada.map(cliente => {
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
                  <div key={cliente.id} className={cn('overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-sm', prioridade === 'maxima' ? 'border-red-200' : prioridade === 'alta' ? 'border-orange-100' : 'border-slate-100')}>
                    <div className="flex flex-col lg:flex-row lg:items-stretch lg:divide-x lg:divide-slate-100">
                      <div className="flex items-center gap-3 px-4 py-3.5 lg:w-52 lg:shrink-0">
                        <ClienteAvatar nome={cliente.nome} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{cliente.nome}</p>
                          <p className="truncate text-[11px] text-slate-400">{cliente.canal_origem ? CRM_CANAL_LABEL[cliente.canal_origem] : 'Sem origem'}</p>
                          <p className="truncate text-[11px] text-slate-400">{oportunidade?.veiculo_interesse || cliente.empresa || 'Sem veículo'}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 px-4 py-3.5 lg:w-52 lg:shrink-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-bold', temperatura === 'quente' ? 'border-red-100 bg-red-50 text-red-600' : temperatura === 'morno' ? 'border-amber-100 bg-amber-50 text-amber-600' : 'border-slate-200 bg-slate-100 text-slate-500')}>{TEMPERATURA_LABEL[temperatura]}</span>
                          <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', prioridade === 'maxima' ? 'bg-red-100 text-red-700' : prioridade === 'alta' ? 'bg-red-50 text-red-600' : prioridade === 'media' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500')}>{PRIORIDADE_LABEL[prioridade]}</span>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Situação</p>
                          <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-700">{situacao}</p>
                        </div>
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', scoreBadgeClass(score))}>
                          <Star size={10} /> {score} · {classificacao.label}
                        </span>
                      </div>

                      <div className="flex-1 space-y-1.5 bg-blue-50/30 px-4 py-3.5">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Objetivo</p>
                          <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-600">{objetivo}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wide text-[#005BFF]">Mentor recomenda</p>
                          <p className="mt-0.5 text-[11px] font-bold leading-snug text-[#031B3D]">{mentorRecomenda}</p>
                        </div>
                        <p className="text-[10px] italic leading-snug text-slate-400">{explicacao}</p>
                      </div>

                      <div className="flex shrink-0 flex-col justify-center gap-1.5 px-4 py-3.5 lg:w-40">
                        <button type="button" onClick={() => executarProximoPasso(cliente)} className="flex items-center justify-center gap-1.5 rounded-xl bg-[#005BFF] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700">
                          <Zap size={14} /> Executar próximo passo
                        </button>
                        <button type="button" onClick={() => { setPanelClosed(false); setSelectedId(cliente.id) }} className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50">
                          <FileText size={14} /> Ver cliente
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              </div>
            )}
          </section>

          {selectedCliente && (
            <FluxoClientePanel
              cliente={selectedCliente}
              oportunidade={oportunidadePorCliente.get(selectedCliente.id)}
                progresso={progressoPorCliente.get(selectedCliente.id) || derivarProgresso(selectedCliente, carteiraOportunidades, agendamentos)}
                vendedor={(profile?.name || 'vendedor').split(' ')[0]}
                statusSaving={cadenciaSaving}
                onStatus={handleRegistrarStatusCadencia}
                onNaoRespondeu={cliente => setNaoRespondeuCliente(cliente)}
                onEditarProximoPasso={cliente => setEditandoProximoPasso(cliente)}
                onSalvarEdicao={(clienteId, patch) => updateCliente(clienteId, patch)}
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
          <FormField label="Telefone" value={formatarTelefoneBR(form.telefone)} onChange={event => setForm(current => ({ ...current, telefone: formatarTelefoneBR(event.target.value) }))} inputMode="tel" maxLength={15} placeholder="(00) 00000-0000" />
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
          <FormField type="text" inputMode="numeric" label="Valor previsto (R$)" value={formatarMoedaBRInput(Math.round((form.potencial_negocio ?? 0) * 100))} onChange={event => setForm(current => ({ ...current, potencial_negocio: moedaBRParaNumero(event.target.value) }))} />
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
          onPlanoAtaque={() => { setModoAtaqueOpen(false); setActiveTab('ataque') }}
          onAbrirFicha={clienteId => {
            setModoAtaqueOpen(false)
            setPanelClosed(false)
            setSelectedId(clienteId)
          }}
        />
      )}

      {filtrosPanelOpen && (
        <PainelFiltros
          filtrosAtivos={filtrosAvancados}
          onAplicar={filtros => { setFiltrosAvancados(filtros); setFiltrosPanelOpen(false) }}
          onFechar={() => setFiltrosPanelOpen(false)}
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

      <ProximaOportunidadeModal
        open={proximaModalOpen}
        proxima={proximaOportunidade}
        onExecutar={cliente => { setProximaModalOpen(false); executarProximoPasso(cliente) }}
        onVoltarCarteira={() => setProximaModalOpen(false)}
        onEntrarModoAtaque={() => { setProximaModalOpen(false); setModoAtaqueOpen(true) }}
      />
    </main>
  )
}

function calcularQualidadeFicha(oportunidade?: OportunidadeComCliente, cliente?: Cliente): { label: string; className: string } {
  const etapa = oportunidade?.etapa
  if (etapa === 'ganho' || etapa === 'perdido') {
    return etapa === 'ganho'
      ? { label: 'Excelente oportunidade', className: 'border-green-200 bg-green-50 text-green-700' }
      : { label: 'Recuperação', className: 'border-red-200 bg-red-50 text-red-700' }
  }
  if (oportunidade?.financiamento === 'aprovado' || etapa === 'negociacao' || etapa === 'fechamento') {
    return { label: 'Excelente oportunidade', className: 'border-green-200 bg-green-50 text-green-700' }
  }
  if (etapa === 'apresentacao') {
    return { label: 'Boa oportunidade', className: 'border-blue-200 bg-blue-50 text-blue-700' }
  }
  const temVeiculo = Boolean(oportunidade?.veiculo_interesse || cliente?.empresa)
  const temValor = Boolean(oportunidade?.valor_negociado || cliente?.potencial_negocio)
  const temContato = Boolean(cliente?.ultima_interacao)
  if (temVeiculo && (temValor || cliente?.proxima_acao_em)) {
    return { label: 'Em desenvolvimento', className: 'border-amber-200 bg-amber-50 text-amber-700' }
  }
  if (temContato && temVeiculo) {
    return { label: 'Precisa de informação', className: 'border-orange-200 bg-orange-50 text-orange-700' }
  }
  return { label: 'Nova oportunidade', className: 'border-slate-200 bg-slate-50 text-slate-600' }
}

function calcularUrgenciaFicha(cliente: Cliente, oportunidade: OportunidadeComCliente | undefined, hoje: string): { label: string; className: string } {
  const proxData = cliente.proxima_acao_em ? cliente.proxima_acao_em.slice(0, 10) : null
  if (cliente.status === 'aguardando_contato' || oportunidade?.financiamento === 'aprovado') {
    return { label: 'Ação imediata', className: 'border-red-200 bg-red-50 text-red-700' }
  }
  if (proxData && proxData < hoje) {
    return { label: 'Próximo passo vencido', className: 'border-red-200 bg-red-50 text-red-700' }
  }
  if (proxData === hoje) {
    return { label: 'Ação para hoje', className: 'border-orange-200 bg-orange-50 text-orange-700' }
  }
  if (oportunidade?.etapa === 'apresentacao') {
    return { label: 'Visita próxima', className: 'border-blue-200 bg-blue-50 text-blue-700' }
  }
  if (proxData) {
    const amanha = new Date(`${hoje}T12:00:00`)
    amanha.setDate(amanha.getDate() + 1)
    if (proxData === toDateOnlyBR(amanha)) {
      return { label: 'Acompanhar amanhã', className: 'border-amber-200 bg-amber-50 text-amber-700' }
    }
  }
  return { label: 'Sem urgência imediata', className: 'border-slate-200 bg-slate-50 text-slate-500' }
}

function FluxoClientePanel({
  cliente,
  oportunidade,
  progresso,
  vendedor,
  statusSaving,
  onStatus,
  onNaoRespondeu,
  onEditarProximoPasso,
  onSalvarEdicao,
  onClose,
}: {
  cliente: Cliente
  oportunidade?: OportunidadeComCliente
  progresso: ProgressoCadencia
  vendedor: string
  statusSaving: boolean
  onStatus: (clienteId: string, status: CadenciaResultadoAcao, canalContato?: CanalContato) => void
  onNaoRespondeu: (cliente: Cliente) => void
  onEditarProximoPasso: (cliente: Cliente) => void
  onSalvarEdicao: (clienteId: string, patch: Partial<ClienteInput>) => Promise<{ error: string | null }>
  onClose: () => void
}) {
  const primeiroNome = cliente.nome.split(' ')[0]
  const script = progresso.etapaAtual.script({ cliente: primeiroNome, vendedor })
  const canalLabel = cliente.canal_origem ? CRM_CANAL_LABEL[cliente.canal_origem] : 'Sem origem'
  const [editando, setEditando] = useState(false)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [form, setForm] = useState<ClienteInput>({
    nome: cliente.nome,
    telefone: cliente.telefone,
    empresa: cliente.empresa,
    canal_origem: cliente.canal_origem,
    status: cliente.status,
    relacionamento: cliente.relacionamento,
    proxima_acao: cliente.proxima_acao,
    proxima_acao_em: cliente.proxima_acao_em,
    potencial_negocio: cliente.potencial_negocio,
    observacoes: cliente.observacoes,
  })

  async function salvarEdicao() {
    setSalvandoEdicao(true)
    const { error } = await onSalvarEdicao(cliente.id, form)
    setSalvandoEdicao(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Ficha atualizada.')
    setEditando(false)
  }
  const whatsappHref = cliente.telefone ? `https://wa.me/55${cliente.telefone.replace(/\D/g, '')}` : null
  const telefoneHref = cliente.telefone ? `tel:+55${cliente.telefone.replace(/\D/g, '')}` : null
  // Planilha #9: executar o próximo passo pede o canal (WhatsApp/ligação/presencial)
  // em vez de forçar WhatsApp. O canal escolhido é registrado no histórico da cadência.
  const [escolhendoCanal, setEscolhendoCanal] = useState(false)

  function executarComCanal(canal: CanalContato) {
    if (canal === 'whatsapp' && whatsappHref) window.open(`${whatsappHref}?text=${encodeURIComponent(script)}`, '_blank', 'noopener,noreferrer')
    if (canal === 'ligacao' && telefoneHref) window.open(telefoneHref, '_self')
    setEscolhendoCanal(false)
    onStatus(cliente.id, 'feito', canal)
  }
  const tentativaAtual = Math.max(1, Math.min(3, Math.ceil(progresso.cadencia / 34) || 1))
  const hojeFicha = toDateOnlyBR()
  const [openKnow, setOpenKnow] = useState(false)
  const [openHistory, setOpenHistory] = useState(false)
  const pendencias = [
    !oportunidade?.valor_negociado && 'Confirmar orçamento',
    !oportunidade?.financiamento || oportunidade.financiamento === 'nao_aplica' ? 'Definir forma de pagamento' : null,
    !oportunidade?.carro_avaliado && 'Entender se possui troca',
    !cliente.proxima_acao_em && 'Agendar próximo contato',
  ].filter(Boolean) as string[]
  const qualidade = calcularQualidadeFicha(oportunidade, cliente)
  const urgencia = calcularUrgenciaFicha(cliente, oportunidade, hojeFicha)
  const temperatura = derivarTemperatura(oportunidade)
  const situacaoAtual = derivarSituacao(cliente, oportunidade, progresso.etapaAtual.label)
  const motivo = explicacaoCliente(cliente, oportunidade, hojeFicha, progresso.etapaAtual.label)

  async function copiarScript() {
    try {
      await navigator.clipboard.writeText(script)
      toast.success('Script copiado.')
    } catch {
      toast.error('Não foi possível copiar o script.')
    }
  }

  return (
    <div className="fixed inset-0 z-[210] grid place-items-center bg-black/40 p-4 backdrop-blur-[2px]" aria-label={`Fluxo do cliente ${cliente.nome}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <aside className="relative flex w-full max-w-2xl max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        <button type="button" aria-label="Fechar painel" onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
          <X size={18} />
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3 border-b border-slate-100 px-5 pb-4 pt-5">
            <div className="flex items-start gap-3">
              <ClienteAvatar nome={cliente.nome} size="lg" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[17px] font-black leading-tight text-mx-dark-2">{cliente.nome}</h3>
                <p className="mt-0.5 text-xs text-slate-400">{canalLabel} · Cadastrado {formatDateBR(cliente.created_at.slice(0, 10))}</p>
                {cliente.telefone && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    📱 {cliente.telefone}
                    {whatsappHref && (
                      <a href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Abrir WhatsApp" className="ml-1 text-green-600 hover:opacity-80">
                        <MessageCircle size={14} />
                      </a>
                    )}
                  </p>
                )}
                {(oportunidade?.veiculo_interesse || cliente.empresa) && (
                  <p className="mt-1 text-xs font-semibold text-mx-dark">🚗 {oportunidade?.veiculo_interesse || cliente.empresa}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', temperatura === 'quente' ? 'border-red-100 bg-red-50 text-red-600' : temperatura === 'morno' ? 'border-amber-100 bg-amber-50 text-amber-600' : 'border-slate-200 bg-slate-100 text-slate-500')}>{TEMPERATURA_LABEL[temperatura]}</span>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{situacaoAtual}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className={cn('rounded-xl border px-3 py-2', qualidade.className)}>
                <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide opacity-60">Qualidade</p>
                <p className="text-xs font-bold">{qualidade.label}</p>
              </div>
              <div className={cn('rounded-xl border px-3 py-2', urgencia.className)}>
                <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide opacity-60">Urgência</p>
                <p className="text-xs font-bold">{urgencia.label}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 px-5 py-4">
            {editando && (
              <FormularioEdicaoFicha form={form} setForm={setForm} onSalvar={salvarEdicao} onCancelar={() => { setEditando(false); setForm({ nome: cliente.nome, telefone: cliente.telefone, empresa: cliente.empresa, canal_origem: cliente.canal_origem, status: cliente.status, relacionamento: cliente.relacionamento, proxima_acao: cliente.proxima_acao, proxima_acao_em: cliente.proxima_acao_em, potencial_negocio: cliente.potencial_negocio, observacoes: cliente.observacoes }) }} salvando={salvandoEdicao} />
            )}

            {!editando && (
              <>
                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-status-info" />
                    <p className="text-xs font-black uppercase tracking-wide text-status-info">Mentor Comercial</p>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Mentor recomenda</p>
                      <p className="mt-0.5 text-sm font-bold text-mx-dark">{cliente.proxima_acao || progresso.etapaAtual.objetivo}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Objetivo</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-600">{progresso.etapaAtual.objetivo}</p>
                    </div>
                    {motivo && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Motivo</p>
                        <p className="mt-0.5 text-xs italic text-slate-500">{motivo}</p>
                      </div>
                    )}
                    {cliente.proxima_acao_em && (
                      <p className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={13} /> Programado para {formatDateBR(cliente.proxima_acao_em)}</p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button className="flex-1 rounded-xl bg-status-info text-sm text-white hover:opacity-90" disabled={statusSaving} onClick={() => setEscolhendoCanal(true)}>
                      <Zap size={14} /> Executar
                    </Button>
                    <Button variant="outline" className="rounded-xl border-slate-200 text-sm text-slate-600" onClick={() => onEditarProximoPasso(cliente)}>
                      <Edit2 size={13} /> Alterar próximo passo
                    </Button>
                  </div>
                  {escolhendoCanal && (
                    <div className="mt-3 rounded-xl border border-blue-200 bg-white p-3" role="group" aria-label="Escolher canal de contato">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Por qual canal você vai executar?</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" disabled={statusSaving || !whatsappHref} onClick={() => executarComCanal('whatsapp')} className="flex flex-col items-center gap-1 rounded-xl border border-green-200 bg-green-50 py-2.5 text-[11px] font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-40">
                          <MessageCircle size={16} /> WhatsApp
                        </button>
                        <button type="button" disabled={statusSaving || !telefoneHref} onClick={() => executarComCanal('ligacao')} className="flex flex-col items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-40">
                          <Phone size={16} /> Ligação
                        </button>
                        <button type="button" disabled={statusSaving} onClick={() => executarComCanal('presencial')} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-100">
                          <Users size={16} /> Presencial
                        </button>
                      </div>
                      <button type="button" onClick={() => setEscolhendoCanal(false)} className="mt-2 w-full text-center text-[11px] font-semibold text-slate-400 hover:text-slate-600">Cancelar</button>
                    </div>
                  )}
                </section>

                {pendencias.length > 0 ? (
                  <BlocoFicha title="O que falta para evoluir" icon="⚠️">
                    <div className="space-y-2">
                      {pendencias.map(item => (
                        <div key={item} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-slate-600">{item}</span>
                          <button type="button" onClick={() => onEditarProximoPasso(cliente)} className="shrink-0 text-[11px] font-semibold text-[#005BFF] hover:underline">Definir →</button>
                        </div>
                      ))}
                    </div>
                  </BlocoFicha>
                ) : (
                  <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
                    <CheckCircle size={16} className="shrink-0 text-green-500" />
                    <p className="text-sm font-medium text-green-700">Oportunidade bem qualificada. Execute o próximo passo.</p>
                  </div>
                )}

                <BlocoFicha title="O que sabemos" icon="📋" open={openKnow} onToggle={() => setOpenKnow(v => !v)}>
                  <div className="space-y-5">
                    <FichaSection title="Interesse">
                      <InfoItem label="Veículo" value={oportunidade?.veiculo_interesse || cliente.empresa || 'Não informado'} />
                      <InfoItem label="Orçamento" value={oportunidade?.valor_negociado ? BRL(oportunidade.valor_negociado) : BRL(cliente.potencial_negocio || 0)} />
                      {cliente.observacoes && <p className="col-span-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">{cliente.observacoes}</p>}
                    </FichaSection>
                    <FichaSection title="Compra">
                      <InfoItem label="Possui troca" value={oportunidade?.carro_avaliado ? 'Sim' : 'Não'} />
                      <InfoItem label="Financiamento" value={getFichaLabel(oportunidade?.financiamento)} />
                      <InfoItem label="Status do cliente" value={STATUS_CLIENTE_LABEL[cliente.status] || CRM_CLIENTE_STATUS_LABEL[cliente.status]} />
                      <InfoItem label="Origem" value={canalLabel} />
                    </FichaSection>
                    <FichaSection title="Contato">
                      <InfoItem label="WhatsApp" value={cliente.telefone || 'Não informado'} />
                      <InfoItem label="Telefone" value={cliente.telefone || 'Não informado'} />
                      <InfoItem label="Último contato" value={cliente.ultima_interacao ? formatDateBR(cliente.ultima_interacao) : 'Sem registro'} />
                      <InfoItem label="Tentativa atual" value={`${tentativaAtual}/3`} />
                    </FichaSection>
                  </div>
                </BlocoFicha>

                <BlocoFicha title="Histórico da oportunidade" icon="🕐" open={openHistory} onToggle={() => setOpenHistory(v => !v)}>
                  <div className="space-y-0">
                    <TimelineItem title="Próxima ação gerada" detail={cliente.proxima_acao || 'Definir ação'} date={cliente.proxima_acao_em ? formatDateBR(cliente.proxima_acao_em) : 'Sem data'} />
                    <TimelineItem title="Última interação" detail={cliente.observacoes || 'Histórico de cadastro e cadência'} date={cliente.ultima_interacao ? formatDateBR(cliente.ultima_interacao) : 'Sem registro'} />
                  </div>
                </BlocoFicha>

                <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Script sugerido</p>
                    <Button variant="ghost" size="icon" aria-label="Copiar script" onClick={copiarScript}><Copy size={14} /></Button>
                  </div>
                  <p className="mt-1 text-sm italic leading-snug text-slate-600">"{script}"</p>
                </section>
              </>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-slate-100 bg-white px-5 py-3">
          <Button variant="outline" className="rounded-xl border-slate-200 text-sm" onClick={() => setEditando(v => !v)}>
            <Edit2 size={14} /> {editando ? 'Cancelar edição' : 'Editar'}
          </Button>
          {!editando && (
            <Button className="flex-1 rounded-xl bg-status-info text-sm text-white hover:opacity-90" disabled={statusSaving} onClick={() => setEscolhendoCanal(true)}>
              <Zap size={14} /> Executar próximo passo
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label="Fechar ficha" className="text-slate-400 hover:text-slate-600" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="sr-only">
          <button type="button" disabled={statusSaving} onClick={() => onStatus(cliente.id, 'feito')}>Feito</button>
          <button type="button" disabled={statusSaving} onClick={() => onNaoRespondeu(cliente)}>Não respondeu</button>
          <button type="button" disabled={statusSaving} onClick={() => onStatus(cliente.id, 'aguardando')}>Aguardando</button>
          <button type="button" disabled={statusSaving} onClick={() => onStatus(cliente.id, 'aguardando')}>Reagendar</button>
          <button type="button" disabled={statusSaving} onClick={() => onStatus(cliente.id, 'nao_feito')}>Não feito</button>
        </div>
      </aside>
    </div>
  )
}

function FormularioEdicaoFicha({
  form,
  setForm,
  onSalvar,
  onCancelar,
  salvando,
}: {
  form: ClienteInput
  setForm: (updater: (prev: ClienteInput) => ClienteInput) => void
  onSalvar: () => void
  onCancelar: () => void
  salvando: boolean
}) {
  return (
    <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">Editar informações</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nome</label>
          <input value={form.nome} onChange={event => setForm(prev => ({ ...prev, nome: event.target.value }))} className="h-8 w-full rounded-xl border border-slate-200 px-3 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Telefone</label>
          <input value={form.telefone || ''} onChange={event => setForm(prev => ({ ...prev, telefone: event.target.value }))} className="h-8 w-full rounded-xl border border-slate-200 px-3 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Potencial de negócio</label>
          <input type="number" value={form.potencial_negocio ?? 0} onChange={event => setForm(prev => ({ ...prev, potencial_negocio: Number(event.target.value) }))} className="h-8 w-full rounded-xl border border-slate-200 px-3 text-sm" />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Veículo de interesse</label>
          <input value={form.empresa || ''} onChange={event => setForm(prev => ({ ...prev, empresa: event.target.value }))} className="h-8 w-full rounded-xl border border-slate-200 px-3 text-sm" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Origem (canal)</label>
        <select value={form.canal_origem || ''} onChange={event => setForm(prev => ({ ...prev, canal_origem: event.target.value as CrmCanal }))} className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
          {CRM_CANAIS.map(canal => <option key={canal} value={canal}>{CRM_CANAL_LABEL[canal]}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status do cliente</label>
        <select value={form.status || 'aguardando_contato'} onChange={event => setForm(prev => ({ ...prev, status: event.target.value as CrmClienteStatus }))} className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
          {CRM_CLIENTE_STATUS.map(status => <option key={status} value={status}>{CRM_CLIENTE_STATUS_LABEL[status]}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Relacionamento</label>
        <select value={form.relacionamento || 'neutro'} onChange={event => setForm(prev => ({ ...prev, relacionamento: event.target.value as CrmRelacionamento }))} className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
          {CRM_RELACIONAMENTO.map(relacionamento => <option key={relacionamento} value={relacionamento}>{CRM_RELACIONAMENTO_LABEL[relacionamento]}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Próximo passo</label>
          <input value={form.proxima_acao || ''} onChange={event => setForm(prev => ({ ...prev, proxima_acao: event.target.value }))} className="h-8 w-full rounded-xl border border-slate-200 px-3 text-sm" />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Data do próximo passo</label>
          <input type="datetime-local" value={form.proxima_acao_em ? form.proxima_acao_em.slice(0, 16) : ''} onChange={event => setForm(prev => ({ ...prev, proxima_acao_em: event.target.value }))} className="h-8 w-full rounded-xl border border-slate-200 px-3 text-sm" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Observações</label>
        <textarea value={form.observacoes || ''} onChange={event => setForm(prev => ({ ...prev, observacoes: event.target.value }))} rows={2} className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-status-info" />
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onCancelar} className="flex-1 rounded-xl" disabled={salvando}>Cancelar</Button>
        <Button onClick={onSalvar} className="flex-1 rounded-xl bg-status-info text-white hover:opacity-90" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </div>
  )
}

function BlocoFicha({
  title,
  icon,
  children,
  open,
  onToggle,
}: {
  title: string
  icon: string
  children: React.ReactNode
  open?: boolean
  onToggle?: () => void
}) {
  const controlled = typeof open === 'boolean'
  const [internalOpen, setInternalOpen] = useState(true)
  const isOpen = controlled ? open : internalOpen
  const toggle = onToggle || (() => setInternalOpen(v => !v))

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100">
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100">
        <span className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">{title}</span>
        </span>
        <ChevronDown size={16} className={cn('text-slate-400 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && <div className="px-4 py-4">{children}</div>}
    </section>
  )
}

function FichaSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">{title}</p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
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

function ClienteAvatar({ nome, size = 'md' }: { nome: string; size?: 'md' | 'lg' }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-blue-50 font-black text-status-info', size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm')}>
      {getInitials(nome)}
    </span>
  )
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

function ProximaOportunidadeModal({
  open,
  proxima,
  onExecutar,
  onVoltarCarteira,
  onEntrarModoAtaque,
}: {
  open: boolean
  proxima: ProximaInfo | null
  onExecutar: (cliente: Cliente) => void
  onVoltarCarteira: () => void
  onEntrarModoAtaque: () => void
}) {
  if (!open) return null

  const session = typeof window !== 'undefined' ? window.sessionStorage : null
  const modoAtaqueAceito = session?.getItem(MODO_ATAQUE_ACEITO_KEY) === 'true'

  const overlay = (children: ReactNode) => (
    <div className="fixed inset-0 z-[220] grid place-items-center bg-black/40 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" onClick={onVoltarCarteira}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]" onClick={event => event.stopPropagation()}>
        {children}
      </div>
    </div>
  )

  if (!proxima) {
    return overlay(
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <Trophy className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <p className="text-lg font-black text-[#031B3D]">🎉 Excelente!</p>
          <p className="mt-1 text-sm text-slate-500">Você concluiu todas as oportunidades prioritárias de hoje.</p>
        </div>
        <button type="button" onClick={onVoltarCarteira} className="w-full rounded-xl bg-[#005BFF] py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700">Voltar para Carteira</button>
      </div>,
    )
  }

  if (modoAtaqueAceito) {
    return overlay(
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-bold">Resultado registrado</span>
        </div>
        <hr className="border-slate-100" />
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">Próxima oportunidade</p>
          <div className="space-y-3 rounded-xl bg-blue-50 p-4">
            <div>
              <p className="text-base font-black text-[#031B3D]">{proxima.nome}</p>
              {proxima.veiculo && <p className="mt-0.5 text-xs text-slate-500">{proxima.veiculo}</p>}
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#005BFF]">Próximo passo</p>
              <p className="text-sm font-bold text-[#031B3D]">{proxima.proximoPasso}</p>
              {proxima.objetivo && <p className="mt-0.5 text-[11px] text-slate-400">{proxima.objetivo}</p>}
            </div>
          </div>
        </div>
        <div className="mt-1 flex gap-2">
          <button type="button" onClick={onVoltarCarteira} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">Voltar</button>
          <button type="button" onClick={() => onExecutar(proxima.cliente)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#005BFF] py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"><Zap className="h-4 w-4" /> Executar</button>
        </div>
      </div>,
    )
  }

  return overlay(
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-5 w-5 shrink-0" />
        <span className="text-sm font-bold">Resultado registrado</span>
      </div>
      <hr className="border-slate-100" />
      <div className="space-y-3 rounded-2xl bg-gradient-to-br from-[#031B3D] to-[#005BFF] p-5 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20"><Zap className="h-4 w-4 text-white" /></div>
          <p className="text-base font-black">🎯 Deseja entrar no Modo Ataque?</p>
        </div>
        <p className="text-sm leading-snug text-blue-100">No Modo Ataque o sistema entrega automaticamente a próxima oportunidade. Você apenas executa e registra o resultado.</p>
        <p className="text-[11px] text-blue-300">Próxima: <span className="font-bold text-white">{proxima.nome}</span></p>
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => { sessionStorage.setItem(MODO_ATAQUE_ACEITO_KEY, 'true'); onEntrarModoAtaque() }} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#005BFF] text-sm font-bold text-white transition-colors hover:bg-blue-700"><Zap className="h-4 w-4" /> Entrar no Modo Ataque</button>
        <button type="button" onClick={onVoltarCarteira} className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">Voltar para Carteira</button>
      </div>
    </div>,
  )
}

export default CarteiraClientes
