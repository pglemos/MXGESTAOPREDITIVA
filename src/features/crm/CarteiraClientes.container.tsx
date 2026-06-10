import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertCircle,
  Bell,
  CalendarDays,
  Car,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Filter,
  Globe2,
  Hourglass,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { EmptyState } from '@/components/atoms/EmptyState'
import { FormField } from '@/components/molecules/FormField'
import { Modal } from '@/components/organisms/Modal'
import { useClientes, type ClienteInput } from '@/features/crm/hooks/useClientes'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import { useAuth } from '@/hooks/useAuth'
import { derivarProgresso, calcularPersistencia, type ProgressoCadencia } from '@/features/crm/lib/cadencia'
import { cn } from '@/lib/utils'
import {
  CRM_CANAIS, CRM_CANAL_LABEL,
  CRM_CLIENTE_STATUS, CRM_CLIENTE_STATUS_LABEL,
  CRM_RELACIONAMENTO, CRM_RELACIONAMENTO_LABEL,
  formatDateBR,
  type Cliente,
  type CrmCanal,
  type CrmClienteStatus,
} from '@/lib/schemas/crm.schema'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const STATUS_VARIANT: Record<CrmClienteStatus, 'brand' | 'success' | 'warning' | 'info' | 'outline'> = {
  oportunidade: 'info',
  ativo: 'success',
  pos_venda: 'brand',
  aguardando_contato: 'warning',
  inativo: 'outline',
}

function MetricCard({ icon, label, value, hint, accent = 'blue' }: { icon: React.ReactNode; label: string; value: string; hint?: string; accent?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' }) {
  const accents = {
    blue: 'bg-brand-primary/10 text-brand-primary',
    green: 'bg-status-success/10 text-status-success',
    yellow: 'bg-status-warning/15 text-status-warning',
    red: 'bg-status-error/10 text-status-error',
    purple: 'bg-accent-purple/10 text-accent-purple',
  }
  return (
    <Card className="min-h-[92px] border border-border-subtle bg-white p-mx-md shadow-mx-sm">
      <div className="flex items-center gap-mx-sm">
        <span className={cn('flex h-mx-11 w-mx-11 items-center justify-center rounded-full', accents[accent])}>{icon}</span>
        <div className="min-w-0">
          <Typography variant="caption" tone="muted" className="uppercase tracking-wide">{label}</Typography>
          <Typography variant="h2" className="text-2xl leading-tight">{value}</Typography>
          {hint && <Typography variant="caption" tone="muted">{hint}</Typography>}
        </div>
      </div>
    </Card>
  )
}

const EMPTY_FORM: ClienteInput = {
  nome: '', telefone: '', empresa: '', canal_origem: null,
  status: 'aguardando_contato', relacionamento: 'neutro',
  proxima_acao: '', proxima_acao_em: '', potencial_negocio: 0, observacoes: '',
}

export function CarteiraClientes() {
  const { profile } = useAuth()
  const { clientes, metrics, loading, error, createCliente, deleteCliente } = useClientes()
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

  const progressoPorCliente = useMemo(() => {
    const map = new Map<string, ProgressoCadencia>()
    for (const c of clientes) map.set(c.id, derivarProgresso(c, oportunidades, agendamentos))
    return map
  }, [agendamentos, clientes, oportunidades])

  const persistencia = useMemo(
    () => calcularPersistencia([...progressoPorCliente.values()]),
    [progressoPorCliente],
  )

  const selectedCliente = useMemo(
    () => clientes.find(c => c.id === selectedId) || (!panelClosed ? clientes[0] : null),
    [clientes, panelClosed, selectedId],
  )

  const oportunidadePorCliente = useMemo(() => {
    const map = new Map<string, typeof oportunidades[number]>()
    for (const oportunidade of oportunidades) {
      const atual = map.get(oportunidade.cliente_id)
      if (!atual || new Date(oportunidade.updated_at).getTime() > new Date(atual.updated_at).getTime()) {
        map.set(oportunidade.cliente_id, oportunidade)
      }
    }
    return map
  }, [oportunidades])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return clientes.filter(c => {
      if (statusFilter !== 'todos' && c.status !== statusFilter) return false
      if (canalFilter !== 'todos' && c.canal_origem !== canalFilter) return false
      const oportunidade = oportunidadePorCliente.get(c.id)
      if (carroFilter === 'sim' && !oportunidade?.carro_avaliado) return false
      if (carroFilter === 'nao' && oportunidade?.carro_avaliado) return false
      if (fichaFilter === 'aprovada' && oportunidade?.financiamento !== 'aprovado') return false
      if (fichaFilter === 'pendente' && oportunidade?.financiamento !== 'pendente') return false
      if (fichaFilter === 'recusada' && oportunidade?.financiamento !== 'reprovado') return false
      if (!q) return true
      return c.nome.toLowerCase().includes(q)
        || (c.telefone || '').includes(q)
        || (c.empresa || '').toLowerCase().includes(q)
        || (oportunidade?.veiculo_interesse || '').toLowerCase().includes(q)
    })
  }, [canalFilter, carroFilter, clientes, fichaFilter, oportunidadePorCliente, search, statusFilter])

  const clientesPaginados = filtered.slice(0, 8)
  const vendidos = useMemo(
    () => [...progressoPorCliente.values()].filter(p => p.encerramento === 'ganho').length,
    [progressoPorCliente],
  )
  const emAndamento = clientes.filter(c => c.status === 'oportunidade' || c.status === 'ativo' || c.status === 'aguardando_contato').length
  const semResposta = clientes.filter(c => c.relacionamento === 'critico' || c.status === 'inativo').length
  const canalCounts = CRM_CANAIS.map(canal => ({ canal, count: clientes.filter(c => c.canal_origem === canal).length }))
  const carroSim = [...oportunidadePorCliente.values()].filter(o => o.carro_avaliado).length
  const fichaAprovada = [...oportunidadePorCliente.values()].filter(o => o.financiamento === 'aprovado').length
  const fichaPendente = [...oportunidadePorCliente.values()].filter(o => o.financiamento === 'pendente').length
  const fichaRecusada = [...oportunidadePorCliente.values()].filter(o => o.financiamento === 'reprovado').length

  async function handleCreate() {
    if (!form.nome.trim()) { toast.error('Informe o nome do cliente.'); return }
    setSaving(true)
    const { error: createError } = await createCliente(form)
    setSaving(false)
    if (createError) { toast.error(createError); return }
    toast.success('Cliente adicionado à carteira.')
    setForm(EMPTY_FORM)
    setModalOpen(false)
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Remover "${nome}" da sua carteira?`)) return
    const { error: delError } = await deleteCliente(id)
    if (delError) { toast.error(delError); return }
    toast.success('Cliente removido.')
  }

  return (
    <main className="h-full w-full overflow-y-auto bg-white no-scrollbar">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-mx-md px-mx-md pb-mx-xl md:px-mx-xl">
        <header className="flex min-h-[104px] items-center justify-between border-b border-border-default bg-white">
          <div className="flex min-w-0 items-center gap-mx-sm">
            <Users size={34} className="shrink-0 text-text-primary" />
            <div className="min-w-0">
              <Typography variant="h1" className="truncate text-3xl uppercase tracking-normal">Carteira de Clientes</Typography>
              <Typography variant="p" tone="muted" className="truncate font-bold">
                Acompanhe sua carteira, siga a cadência e conduza cada cliente até a venda.
              </Typography>
            </div>
          </div>
          <div className="hidden items-center gap-mx-md lg:flex">
            <span className="inline-flex items-center gap-mx-xs text-sm font-black text-text-primary">
              <CalendarDays size={18} /> {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' }).format(new Date())}
            </span>
            <Button variant="outline" onClick={() => setStatusFilter('todos')}><Filter size={16} /> Filtros</Button>
            <button type="button" className="relative rounded-full p-mx-xs text-text-primary">
              <Bell size={23} />
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-error px-1 text-[10px] font-black text-white">3</span>
            </button>
            <div className="flex items-center gap-mx-sm">
              <span className="flex h-mx-12 w-mx-12 items-center justify-center rounded-full bg-brand-primary text-sm font-black text-white">
                {getInitials(profile?.name || 'João Silva')}
              </span>
              <div>
                <Typography variant="p" className="font-black">{profile?.name || 'João Silva'}</Typography>
                <Typography variant="caption" tone="muted">Vendedor</Typography>
              </div>
              <ChevronDown size={18} className="text-text-muted" />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-mx-sm md:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_1.4fr]" aria-label="Indicadores da carteira">
          <MetricCard icon={<Users size={22} />} label="Total de Clientes" value={String(metrics.total)} hint="100%" accent="blue" />
          <MetricCard icon={<Clock size={22} />} label="Em andamento" value={String(emAndamento)} hint={`${percent(emAndamento, metrics.total)}%`} accent="blue" />
          <MetricCard icon={<Hourglass size={22} />} label="Aguardando cliente" value={String(metrics.aguardando)} hint={`${percent(metrics.aguardando, metrics.total)}%`} accent="yellow" />
          <MetricCard icon={<Phone size={22} />} label="Sem resposta" value={String(semResposta)} hint={`${percent(semResposta, metrics.total)}%`} accent="red" />
          <MetricCard icon={<CheckCircle size={22} />} label="Vendidos" value={String(vendidos)} hint={`${percent(vendidos, metrics.total)}%`} accent="green" />
          <Card className="border border-status-success/20 bg-status-success/5 p-mx-md shadow-mx-sm">
            <div className="flex items-start justify-between gap-mx-sm">
              <div>
                <span className="inline-flex items-center gap-mx-xs">
                  <Typography variant="caption" tone="muted" className="uppercase tracking-wide">Persistência Comercial</Typography>
                  <AlertCircle size={14} className="text-text-muted" />
                </span>
                <Typography variant="h2" className="text-3xl">{persistencia === null ? '—' : `${persistencia}%`}</Typography>
                <Typography variant="caption" className="font-black text-status-success">
                  {persistencia === null ? 'Sem base encerrada' : 'Você está acima da média!'}
                </Typography>
              </div>
              <TrendingUp size={44} className="text-status-success" />
            </div>
          </Card>
        </section>

        <div className={cn('grid grid-cols-1 gap-mx-md', selectedCliente && 'xl:grid-cols-[minmax(0,1fr)_410px] xl:items-start')}>
          <section className="min-w-0 space-y-mx-md">
            <Card className="border border-border-subtle bg-white p-mx-md shadow-mx-sm">
              <div className="grid grid-cols-1 gap-mx-sm xl:grid-cols-[180px_180px_200px_170px_minmax(220px,1fr)_150px]">
                <FilterSelect label="Origem" value={canalFilter} onChange={value => setCanalFilter(value as CrmCanal | 'todos')}>
                  <option value="todos">Todos</option>
                  {CRM_CANAIS.map(canal => <option key={canal} value={canal}>{CRM_CANAL_LABEL[canal]}</option>)}
                </FilterSelect>
                <FilterSelect label="Carro na troca" value={carroFilter} onChange={value => setCarroFilter(value as typeof carroFilter)}>
                  <option value="todos">Todos</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </FilterSelect>
                <FilterSelect label="Ficha do cliente" value={fichaFilter} onChange={value => setFichaFilter(value as typeof fichaFilter)}>
                  <option value="todos">Todos</option>
                  <option value="aprovada">Aprovada</option>
                  <option value="pendente">Não enviada</option>
                  <option value="recusada">Recusada</option>
                </FilterSelect>
                <FilterSelect label="Status" value={statusFilter} onChange={value => setStatusFilter(value as CrmClienteStatus | 'todos')}>
                  <option value="todos">Todos</option>
                  {CRM_CLIENTE_STATUS.map(s => <option key={s} value={s}>{CRM_CLIENTE_STATUS_LABEL[s]}</option>)}
                </FilterSelect>
                <label className="block">
                  <Typography variant="caption" tone="muted" className="mb-mx-xs block uppercase tracking-wide">Buscar</Typography>
                  <span className="relative block">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente ou veículo..." className="h-11 pl-9" />
                  </span>
                </label>
                <div className="flex items-end">
                  <Button className="h-11 w-full" onClick={() => setModalOpen(true)}><Plus size={16} /> Novo Cliente</Button>
                </div>
              </div>

              <div className="mt-mx-md flex flex-wrap gap-mx-xs">
                <SourceTab active={statusFilter === 'todos' && canalFilter === 'todos'} onClick={() => { setStatusFilter('todos'); setCanalFilter('todos') }}>
                  Todos ({clientes.length})
                </SourceTab>
                <SourceTab active={canalFilter === 'internet'} onClick={() => setCanalFilter('internet')}>
                  <Globe2 size={15} /> Internet ({canalCounts.find(c => c.canal === 'internet')?.count || 0})
                </SourceTab>
                <SourceTab active={canalFilter === 'carteira'} onClick={() => setCanalFilter('carteira')}>
                  <Users size={15} /> Carteira ({canalCounts.find(c => c.canal === 'carteira')?.count || 0})
                </SourceTab>
                <SourceTab active={canalFilter === 'porta'} onClick={() => setCanalFilter('porta')}>
                  <CalendarDays size={15} /> Porta ({canalCounts.find(c => c.canal === 'porta')?.count || 0})
                </SourceTab>
              </div>

              <div className="mt-mx-sm overflow-x-auto">
                {error && <Typography tone="muted" className="text-status-error">{error}</Typography>}
                {loading ? (
                  <Typography tone="muted">Carregando carteira...</Typography>
                ) : filtered.length === 0 ? (
                  <EmptyState
                    title={clientes.length === 0 ? 'Sua carteira está vazia' : 'Nenhum cliente encontrado'}
                    description={clientes.length === 0 ? 'Adicione seu primeiro cliente para começar a acompanhar relacionamentos.' : 'Ajuste a busca ou o filtro de status.'}
                  />
                ) : (
                  <table className="w-full min-w-[1120px] text-left text-sm">
                    <thead>
                      <tr className="border-y border-border-subtle bg-surface-alt/40 text-[11px] uppercase tracking-wide text-text-muted">
                        <th className="px-mx-sm py-mx-xs font-black">Cliente</th>
                        <th className="px-mx-sm py-mx-xs font-black">Veículo Procurado</th>
                        <th className="px-mx-sm py-mx-xs font-black">Origem</th>
                        <th className="px-mx-sm py-mx-xs font-black">Etapa Atual</th>
                        <th className="px-mx-sm py-mx-xs font-black">Cadência</th>
                        <th className="px-mx-sm py-mx-xs font-black">Próxima Ação</th>
                        <th className="px-mx-sm py-mx-xs font-black">Carro na troca</th>
                        <th className="px-mx-sm py-mx-xs font-black">Ficha</th>
                        <th className="px-mx-sm py-mx-xs font-black">Status</th>
                        <th className="px-mx-sm py-mx-xs text-right font-black" aria-label="Ações" />
                      </tr>
                    </thead>
                    <tbody>
                      {clientesPaginados.map(c => {
                        const progresso = progressoPorCliente.get(c.id)
                        const oportunidade = oportunidadePorCliente.get(c.id)
                        return (
                          <tr
                            key={c.id}
                            onClick={() => {
                              setPanelClosed(false)
                              setSelectedId(current => current === c.id ? null : c.id)
                            }}
                            className={cn('cursor-pointer border-b border-border-subtle transition-colors hover:bg-brand-primary/5', selectedCliente?.id === c.id && 'bg-brand-primary/5')}
                          >
                            <td className="px-mx-sm py-mx-sm">
                              <span className="flex items-center gap-mx-xs">
                                <ClienteAvatar nome={c.nome} />
                                <span className="min-w-0">
                                  <Typography variant="p" className="truncate font-black">{c.nome}</Typography>
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary">
                                    {c.telefone || 'Sem telefone'}
                                    {c.telefone && <MessageCircle size={13} className="text-status-success" />}
                                  </span>
                                </span>
                              </span>
                            </td>
                            <td className="px-mx-sm py-mx-sm">
                              <Typography variant="p" className="font-black">{oportunidade?.veiculo_interesse || c.empresa || 'Não informado'}</Typography>
                              <Typography variant="caption" tone="muted">{oportunidade?.valor_negociado ? BRL(oportunidade.valor_negociado) : 'Interesse em aberto'}</Typography>
                            </td>
                            <td className="px-mx-sm py-mx-sm"><CanalBadge canal={c.canal_origem} /></td>
                            <td className="px-mx-sm py-mx-sm">
                              <span className="inline-flex items-start gap-mx-xs">
                                <CalendarDays size={18} className="mt-0.5 text-brand-primary" />
                                <span>
                                  <Typography variant="p" className="font-black">{progresso?.etapaAtual.label || 'Lead'}</Typography>
                                  <Typography variant="caption" tone="muted">Etapa {progresso ? progresso.etapaAtualIndex + 1 : 1} de {progresso?.etapas.length || 5}</Typography>
                                </span>
                              </span>
                            </td>
                            <td className="px-mx-sm py-mx-sm">
                              <ProgressInline value={progresso?.cadencia || 0} />
                            </td>
                            <td className="px-mx-sm py-mx-sm">
                              <Typography variant="p" className="font-black">{c.proxima_acao || progresso?.etapaAtual.objetivo || 'Definir ação'}</Typography>
                              <Typography variant="caption" tone="muted">{c.proxima_acao_em ? formatDateBR(c.proxima_acao_em) : 'Hoje'}</Typography>
                            </td>
                            <td className="px-mx-sm py-mx-sm">
                              <span className={cn('inline-flex items-center gap-1 font-black', oportunidade?.carro_avaliado ? 'text-status-success' : 'text-status-error')}>
                                {oportunidade?.carro_avaliado ? <Car size={16} /> : <X size={16} />} {oportunidade?.carro_avaliado ? 'Sim' : 'Não'}
                              </span>
                            </td>
                            <td className="px-mx-sm py-mx-sm"><FichaBadge value={oportunidade?.financiamento} /></td>
                            <td className="px-mx-sm py-mx-sm"><Badge variant={STATUS_VARIANT[c.status]} className="px-2 py-0.5 text-[10px]">{CRM_CLIENTE_STATUS_LABEL[c.status]}</Badge></td>
                            <td className="px-mx-sm py-mx-sm text-right">
                              <Button variant="ghost" size="icon" aria-label="Remover" onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.nome) }}>
                                <MoreHorizontal size={17} />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="mt-mx-md flex flex-col gap-mx-sm text-sm font-bold text-text-secondary sm:flex-row sm:items-center sm:justify-between">
                <span>Mostrando 1 a {clientesPaginados.length} de {filtered.length} clientes</span>
                <span className="inline-flex items-center gap-mx-xs">
                  {[1, 2, 3, 4, 5].map(page => (
                    <button key={page} type="button" className={cn('h-8 w-8 rounded-mx-md border text-xs font-black', page === 1 ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-border-subtle text-text-secondary')}>{page}</button>
                  ))}
                  <button type="button" className="h-8 rounded-mx-md border border-border-subtle px-2"><ChevronRight size={14} /></button>
                  <span className="ml-mx-sm rounded-mx-md border border-border-subtle px-3 py-1.5">8 por página</span>
                </span>
              </div>
            </Card>

            <section className="grid grid-cols-1 gap-mx-sm md:grid-cols-2 xl:grid-cols-4">
              <AnalyticsCard title="Evolução da Cadência">
                <div className="flex items-center gap-mx-md">
                  <Donut value={persistencia ?? 0} />
                  <div>
                    <Typography variant="p" tone="muted" className="text-sm">Sua média de execução da cadência está ótima!</Typography>
                    <Badge variant="success" className="mt-mx-xs px-2 py-0.5">Excelente!</Badge>
                  </div>
                </div>
              </AnalyticsCard>
              <AnalyticsCard title="Origem dos Clientes">
                <div className="flex items-center gap-mx-md">
                  <SourceDonut counts={canalCounts.map(c => c.count)} />
                  <div className="space-y-mx-xs text-xs font-black">
                    {canalCounts.filter(c => c.count > 0).slice(0, 3).map(c => (
                      <div key={c.canal} className="flex items-center gap-mx-xs"><span className="h-2 w-2 rounded-full bg-brand-primary" /> {CRM_CANAL_LABEL[c.canal]} {c.count} ({percent(c.count, metrics.total)}%)</div>
                    ))}
                  </div>
                </div>
              </AnalyticsCard>
              <AnalyticsCard title="Carro na Troca">
                <MiniBar label="Sim" value={carroSim} total={Math.max(oportunidadePorCliente.size, 1)} tone="green" />
                <MiniBar label="Não" value={Math.max(oportunidadePorCliente.size - carroSim, 0)} total={Math.max(oportunidadePorCliente.size, 1)} tone="red" />
              </AnalyticsCard>
              <AnalyticsCard title="Ficha do Cliente">
                <MiniBar label="Aprovada" value={fichaAprovada} total={Math.max(oportunidadePorCliente.size, 1)} tone="green" />
                <MiniBar label="Não enviada" value={fichaPendente} total={Math.max(oportunidadePorCliente.size, 1)} tone="yellow" />
                <MiniBar label="Recusada" value={fichaRecusada} total={Math.max(oportunidadePorCliente.size, 1)} tone="red" />
              </AnalyticsCard>
            </section>

            <div className="flex items-center justify-between gap-mx-md rounded-mx-lg border border-status-success/20 bg-status-success/5 px-mx-lg py-mx-md">
              <span className="flex min-w-0 items-center gap-mx-md">
                <span className="flex h-mx-11 w-mx-11 shrink-0 items-center justify-center rounded-full bg-status-success/10 text-status-success"><CheckCircle size={22} /></span>
                <Typography variant="p" className="truncate font-black text-status-success">Dica do dia</Typography>
                <Typography variant="p" tone="muted" className="hidden truncate font-bold lg:block">
                  Clientes que recebem 5 ou mais contatos têm mais chances de agendar uma visita. Continue seguindo sua cadência!
                </Typography>
              </span>
              <Button variant="outline">Ver mais dicas</Button>
            </div>
          </section>

          {selectedCliente && (
            <FluxoClientePanel
              cliente={selectedCliente}
              progresso={progressoPorCliente.get(selectedCliente.id) || derivarProgresso(selectedCliente, oportunidades, agendamentos)}
              vendedor={(profile?.name || 'vendedor').split(' ')[0]}
              onClose={() => { setSelectedId(null); setPanelClosed(true) }}
            />
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adicionar cliente"
        description="Cadastre um novo cliente na sua carteira."
        footer={
          <div className="flex justify-end gap-mx-sm">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando...' : 'Salvar cliente'}</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2">
          <FormField label="Nome *" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do cliente" />
          <FormField label="Telefone" value={form.telefone || ''} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
          <FormField label="Empresa" value={form.empresa || ''} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} placeholder="Empresa / loja" />
          <Select label="Canal de origem" value={form.canal_origem || ''} onChange={e => setForm(f => ({ ...f, canal_origem: (e.target.value || null) as ClienteInput['canal_origem'] }))}>
            <option value="">Selecione</option>
            {CRM_CANAIS.map(c => <option key={c} value={c}>{CRM_CANAL_LABEL[c]}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CrmClienteStatus }))}>
            {CRM_CLIENTE_STATUS.map(s => <option key={s} value={s}>{CRM_CLIENTE_STATUS_LABEL[s]}</option>)}
          </Select>
          <Select label="Relacionamento" value={form.relacionamento} onChange={e => setForm(f => ({ ...f, relacionamento: e.target.value as ClienteInput['relacionamento'] }))}>
            {CRM_RELACIONAMENTO.map(r => <option key={r} value={r}>{CRM_RELACIONAMENTO_LABEL[r]}</option>)}
          </Select>
          <FormField label="Próxima ação" value={form.proxima_acao || ''} onChange={e => setForm(f => ({ ...f, proxima_acao: e.target.value }))} placeholder="Ex: Enviar proposta" />
          <FormField type="date" label="Data da próxima ação" value={form.proxima_acao_em || ''} onChange={e => setForm(f => ({ ...f, proxima_acao_em: e.target.value }))} />
          <FormField type="number" label="Potencial de negócio (R$)" value={String(form.potencial_negocio ?? 0)} onChange={e => setForm(f => ({ ...f, potencial_negocio: Number(e.target.value) || 0 }))} />
          <div className="sm:col-span-2 space-y-mx-xs">
            <label htmlFor="crm-cliente-obs" className="block ml-2"><Typography variant="caption" tone="muted">Observações</Typography></label>
            <Textarea id="crm-cliente-obs" value={form.observacoes || ''} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Notas sobre o cliente..." />
          </div>
        </div>
      </Modal>
    </main>
  )
}

function FluxoClientePanel({ cliente, progresso, vendedor, onClose }: { cliente: Cliente; progresso: ProgressoCadencia; vendedor: string; onClose: () => void }) {
  const primeiroNome = cliente.nome.split(' ')[0]
  const script = progresso.etapaAtual.script({ cliente: primeiroNome, vendedor })
  const canalLabel = cliente.canal_origem ? CRM_CANAL_LABEL[cliente.canal_origem] : 'Sem canal'
  const whatsappHref = cliente.telefone ? `https://wa.me/55${cliente.telefone.replace(/\D/g, '')}` : null

  async function copiarScript() {
    try {
      await navigator.clipboard.writeText(script)
      toast.success('Script copiado.')
    } catch {
      toast.error('Não foi possível copiar o script.')
    }
  }

  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-md xl:sticky xl:top-mx-md" aria-label={`Fluxo do cliente ${cliente.nome}`}>
      <div className="flex items-start justify-between gap-mx-sm">
        <div className="min-w-0">
          <span className="flex items-center gap-mx-xs">
            <Typography variant="h3" className="truncate text-lg">{cliente.nome}</Typography>
            <Badge variant="info">{canalLabel}</Badge>
          </span>
          {cliente.telefone && (
            <span className="mt-mx-tiny inline-flex items-center gap-1 text-sm text-text-secondary">
              <Phone size={13} /> {cliente.telefone}
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Abrir WhatsApp" className="ml-1 text-status-success hover:opacity-80"><MessageCircle size={15} /></a>
              )}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" aria-label="Fechar painel" onClick={onClose}><X size={16} /></Button>
      </div>

      <Typography variant="caption" tone="muted" className="mt-mx-md block font-black uppercase tracking-widest">Fluxo do Cliente</Typography>
      <ol className="mt-mx-sm flex items-center gap-1" aria-label="Etapas da cadência">
        {progresso.etapas.map((etapa, index) => {
          const concluida = index < progresso.concluidas
          const atual = index === progresso.etapaAtualIndex && progresso.concluidas < progresso.etapas.length
          return (
            <li key={etapa.id} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black',
                concluida ? 'bg-status-success text-white' : atual ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20' : 'bg-surface-alt text-text-tertiary',
              )}>
                {concluida ? <Check size={13} /> : index + 1}
              </span>
              <span className={cn('w-full truncate text-center text-[9px] font-bold uppercase', atual ? 'text-brand-primary' : 'text-text-tertiary')}>{etapa.label}</span>
            </li>
          )
        })}
      </ol>

      <div className="mt-mx-md flex items-center justify-between gap-mx-sm">
        <Typography variant="p" className="font-black">
          Etapa {Math.min(progresso.etapaAtualIndex + 1, progresso.etapas.length)} de {progresso.etapas.length} — {progresso.etapaAtual.label}
        </Typography>
        <Badge variant={progresso.cadencia >= 70 ? 'success' : 'info'}>{progresso.cadencia}% da cadência</Badge>
      </div>

      <div className="mt-mx-md space-y-mx-md">
        <div>
          <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">Objetivo da etapa</Typography>
          <Typography variant="p" className="mt-mx-tiny text-sm">{progresso.etapaAtual.objetivo}</Typography>
        </div>
        <div>
          <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">O que fazer</Typography>
          <ul className="mt-mx-tiny space-y-mx-tiny">
            {progresso.etapaAtual.oQueFazer.map(item => (
              <li key={item} className="flex items-start gap-mx-xs text-sm text-text-secondary">
                <Check size={14} className="mt-0.5 shrink-0 text-status-success" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-mx-lg bg-brand-primary/5 p-mx-md">
          <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">Próxima ação</Typography>
          <Typography variant="p" className="mt-mx-tiny text-sm font-bold">
            {cliente.proxima_acao || progresso.etapaAtual.objetivo}
            {cliente.proxima_acao_em && <span className="block text-xs font-bold text-text-tertiary">{formatDateBR(cliente.proxima_acao_em)}</span>}
          </Typography>
        </div>
        <div className="rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-md">
          <div className="flex items-center justify-between gap-mx-sm">
            <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">Script sugerido</Typography>
            <Button variant="ghost" size="icon" aria-label="Copiar script" onClick={copiarScript}><Copy size={14} /></Button>
          </div>
          <Typography variant="p" className="mt-mx-tiny text-sm italic text-text-secondary">"{script}"</Typography>
        </div>
      </div>
    </Card>
  )
}

function percent(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'MX'
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <Typography variant="caption" tone="muted" className="mb-mx-xs block uppercase tracking-wide">{label}</Typography>
      <Select value={value} onChange={event => onChange(event.target.value)} className="h-11 py-2">
        {children}
      </Select>
    </label>
  )
}

function SourceTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-mx-xs rounded-mx-md border px-mx-sm text-sm font-black transition-colors',
        active ? 'border-brand-primary bg-brand-primary text-white shadow-mx-sm' : 'border-border-subtle bg-white text-text-secondary hover:bg-surface-alt',
      )}
    >
      {children}
    </button>
  )
}

function ClienteAvatar({ nome }: { nome: string }) {
  const colors = ['bg-brand-primary', 'bg-status-success', 'bg-accent-purple', 'bg-status-warning', 'bg-status-info', 'bg-status-error']
  const color = colors[nome.length % colors.length]
  return <span className={cn('flex h-mx-9 w-mx-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white', color)}>{getInitials(nome)}</span>
}

function CanalBadge({ canal }: { canal: CrmCanal | null }) {
  if (!canal) return <Badge variant="outline" className="px-2 py-0.5 text-[10px]">Sem origem</Badge>
  const variant: Record<CrmCanal, 'brand' | 'success' | 'warning' | 'info'> = {
    internet: 'brand',
    carteira: 'success',
    porta: 'warning',
    showroom: 'info',
  }
  return <Badge variant={variant[canal]} className="px-2 py-0.5 text-[10px]">{CRM_CANAL_LABEL[canal]}</Badge>
}

function FichaBadge({ value }: { value?: string | null }) {
  if (value === 'aprovado') return <Badge variant="success" className="px-2 py-0.5 text-[10px]">Aprovada</Badge>
  if (value === 'reprovado') return <Badge variant="danger" className="px-2 py-0.5 text-[10px]">Recusada</Badge>
  if (value === 'pendente') return <Badge variant="warning" className="px-2 py-0.5 text-[10px]">Não enviada</Badge>
  return <Badge variant="outline" className="px-2 py-0.5 text-[10px]">Não aplica</Badge>
}

function ProgressInline({ value }: { value: number }) {
  const tone = value >= 70 ? 'bg-status-success' : value >= 40 ? 'bg-brand-primary' : 'bg-status-error'
  return (
    <span className="flex items-center gap-mx-xs">
      <span className="text-xs font-black text-text-primary">{value}%</span>
      <span className="h-1.5 w-16 rounded-full bg-surface-alt">
        <span className={cn('block h-1.5 rounded-full', tone)} style={{ width: `${Math.max(value, 5)}%` }} />
      </span>
    </span>
  )
}

function AnalyticsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="min-h-[160px] border border-border-subtle bg-white p-mx-md shadow-mx-sm">
      <Typography variant="caption" tone="muted" className="mb-mx-sm block uppercase tracking-wide">{title}</Typography>
      {children}
    </Card>
  )
}

function Donut({ value }: { value: number }) {
  return (
    <div
      className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(var(--color-status-success) ${value * 3.6}deg, var(--color-surface-alt) 0deg)` }}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
        <Typography variant="h2" className="text-2xl">{value}%</Typography>
      </div>
    </div>
  )
}

function SourceDonut({ counts }: { counts: number[] }) {
  const total = counts.reduce((sum, item) => sum + item, 0) || 1
  const first = (counts[0] || 0) / total * 360
  const second = first + (counts[1] || 0) / total * 360
  return (
    <div
      className="h-24 w-24 shrink-0 rounded-full"
      style={{
        background: `conic-gradient(var(--color-brand-primary) 0deg ${first}deg, var(--color-status-success) ${first}deg ${second}deg, var(--color-accent-purple) ${second}deg 360deg)`,
      }}
    />
  )
}

function MiniBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: 'green' | 'yellow' | 'red' }) {
  const tones = {
    green: 'bg-status-success',
    yellow: 'bg-status-warning',
    red: 'bg-status-error',
  }
  const pct = percent(value, total)
  return (
    <div className="mb-mx-sm last:mb-0">
      <div className="mb-mx-tiny flex items-center justify-between text-xs font-black text-text-secondary">
        <span>{label}</span>
        <span>{value} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-surface-alt">
        <div className={cn('h-2 rounded-full', tones[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default CarteiraClientes
