import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Users, UserCheck, Target, TrendingUp, Wallet, Plus, Search, Phone, Trash2 } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { PageHeader } from '@/components/molecules/PageHeader'
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
import {
  CRM_CANAIS, CRM_CANAL_LABEL,
  CRM_CLIENTE_STATUS, CRM_CLIENTE_STATUS_LABEL,
  CRM_RELACIONAMENTO, CRM_RELACIONAMENTO_LABEL,
  formatDateBR,
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

const RELACIONAMENTO_DOT: Record<string, string> = {
  excelente: 'bg-status-success',
  bom: 'bg-status-info',
  neutro: 'bg-status-warning',
  ruim: 'bg-orange-500',
  critico: 'bg-status-error',
}

function MetricCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-md">
      <div className="flex items-center gap-mx-sm text-text-secondary">
        {icon}
        <Typography variant="caption" tone="muted" className="uppercase tracking-wide">{label}</Typography>
      </div>
      <Typography variant="h2" className="mt-mx-sm text-3xl">{value}</Typography>
      {hint && <Typography variant="caption" tone="muted">{hint}</Typography>}
    </Card>
  )
}

const EMPTY_FORM: ClienteInput = {
  nome: '', telefone: '', empresa: '', canal_origem: null,
  status: 'aguardando_contato', relacionamento: 'neutro',
  proxima_acao: '', proxima_acao_em: '', potencial_negocio: 0, observacoes: '',
}

export function CarteiraClientes() {
  const { clientes, metrics, loading, error, createCliente, deleteCliente } = useClientes()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CrmClienteStatus | 'todos'>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<ClienteInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return clientes.filter(c => {
      if (statusFilter !== 'todos' && c.status !== statusFilter) return false
      if (!q) return true
      return c.nome.toLowerCase().includes(q) || (c.telefone || '').includes(q) || (c.empresa || '').toLowerCase().includes(q)
    })
  }, [clientes, search, statusFilter])

  const ticketMedio = metrics.total > 0 ? metrics.potencialTotal / metrics.total : 0

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
    <main className="w-full h-full overflow-y-auto bg-surface-alt p-mx-md md:p-mx-lg no-scrollbar">
      <div className="flex flex-col gap-mx-lg pb-28">
        <PageHeader
          title="Carteira de Clientes"
          description="Gerencie seus clientes e mantenha relacionamentos que geram resultados."
          actions={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Adicionar cliente</Button>}
        />

        <section className="grid grid-cols-2 gap-mx-md md:grid-cols-3 xl:grid-cols-5" aria-label="Indicadores da carteira">
          <MetricCard icon={<Users size={18} />} label="Total de Clientes" value={String(metrics.total)} hint="em sua carteira" />
          <MetricCard icon={<UserCheck size={18} />} label="Clientes Ativos" value={String(metrics.ativos)} hint={`${metrics.total ? Math.round(metrics.ativos / metrics.total * 100) : 0}% da carteira`} />
          <MetricCard icon={<Target size={18} />} label="Oportunidades" value={String(metrics.oportunidades)} hint="em negociação" />
          <MetricCard icon={<TrendingUp size={18} />} label="Pós-venda" value={String(metrics.posVenda)} hint="relacionamento ativo" />
          <MetricCard icon={<Wallet size={18} />} label="Ticket Médio" value={BRL(ticketMedio)} hint="potencial por cliente" />
        </section>

        <Card className="border-none bg-white p-mx-lg shadow-mx-md">
          <div className="flex flex-col gap-mx-md lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-mx-xs">
              <FilterPill active={statusFilter === 'todos'} onClick={() => setStatusFilter('todos')}>Todos</FilterPill>
              {CRM_CLIENTE_STATUS.map(s => (
                <FilterPill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{CRM_CLIENTE_STATUS_LABEL[s]}</FilterPill>
              ))}
            </div>
          </div>

          <div className="mt-mx-lg overflow-x-auto">
            {error && <Typography tone="muted" className="text-status-error">{error}</Typography>}
            {loading ? (
              <Typography tone="muted">Carregando carteira...</Typography>
            ) : filtered.length === 0 ? (
              <EmptyState
                title={clientes.length === 0 ? 'Sua carteira está vazia' : 'Nenhum cliente encontrado'}
                description={clientes.length === 0 ? 'Adicione seu primeiro cliente para começar a acompanhar relacionamentos.' : 'Ajuste a busca ou o filtro de status.'}
              />
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-text-muted">
                    <th className="pb-mx-sm font-semibold">Cliente</th>
                    <th className="pb-mx-sm font-semibold">Contato</th>
                    <th className="pb-mx-sm font-semibold">Status</th>
                    <th className="pb-mx-sm font-semibold">Última interação</th>
                    <th className="pb-mx-sm font-semibold">Próxima ação</th>
                    <th className="pb-mx-sm font-semibold">Relacionamento</th>
                    <th className="pb-mx-sm font-semibold text-right">Potencial</th>
                    <th className="pb-mx-sm font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-t border-border-subtle">
                      <td className="py-mx-sm">
                        <Typography variant="p" className="font-semibold">{c.nome}</Typography>
                        {c.empresa && <Typography variant="caption" tone="muted">{c.empresa}</Typography>}
                      </td>
                      <td className="py-mx-sm">
                        {c.telefone ? (
                          <span className="inline-flex items-center gap-1 text-text-secondary"><Phone size={13} /> {c.telefone}</span>
                        ) : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="py-mx-sm">
                        <Badge variant={STATUS_VARIANT[c.status]}>{CRM_CLIENTE_STATUS_LABEL[c.status]}</Badge>
                      </td>
                      <td className="py-mx-sm text-text-secondary">{formatDateBR(c.ultima_interacao)}</td>
                      <td className="py-mx-sm text-text-secondary">
                        {c.proxima_acao || '—'}
                        {c.proxima_acao_em && <Typography variant="caption" tone="muted" className="block">{formatDateBR(c.proxima_acao_em)}</Typography>}
                      </td>
                      <td className="py-mx-sm">
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${RELACIONAMENTO_DOT[c.relacionamento] || 'bg-text-muted'}`} />
                          {CRM_RELACIONAMENTO_LABEL[c.relacionamento]}
                        </span>
                      </td>
                      <td className="py-mx-sm text-right font-semibold">{c.potencial_negocio ? BRL(c.potencial_negocio) : '—'}</td>
                      <td className="py-mx-sm text-right">
                        <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => handleDelete(c.id, c.nome)}><Trash2 size={16} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
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

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-mx-md px-3 py-1.5 text-sm font-semibold transition-colors ${active ? 'bg-brand-secondary text-white' : 'bg-surface-alt text-text-secondary hover:bg-surface'}`}
    >
      {children}
    </button>
  )
}

export default CarteiraClientes
