import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { 
  ArrowLeft, BriefcaseBusiness, Building2, Mail, Phone, User2, 
  Calendar, CheckCircle2, Clock, ChevronRight,
  Plus, FileText, X, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/atoms/Input'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { useConsultingClientDetail } from '@/hooks/useConsultingClients'
import { cn } from '@/lib/utils'
import { GoogleCalendarView } from '@/features/consultoria/components/GoogleCalendarView'
import type { ConsultingFinancial } from '@/features/consultoria/types'

type Tab = 'overview' | 'visits' | 'financial'

export default function ConsultoriaClienteDetalhe() {
  const { clientId } = useParams<{ clientId: string }>()
  const {
    client,
    assignableUsers,
    loading,
    error,
    canManage,
    createUnit,
    createContact,
    upsertAssignment,
    toggleAssignment,
    upsertFinancial,
    deleteFinancial,
  } = useConsultingClientDetail(clientId)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [savingUnit, setSavingUnit] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [unitForm, setUnitForm] = useState({ name: '', city: '', state: '', is_primary: false })
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', role: '', is_primary: false })
  const [assignmentForm, setAssignmentForm] = useState<{ user_id: string; assignment_role: 'responsavel' | 'auxiliar' | 'viewer' }>({
    user_id: '',
    assignment_role: 'responsavel',
  })
  const [financialModal, setFinancialModal] = useState<{ open: boolean; editing?: ConsultingFinancial }>({ open: false })
  const [savingFinancial, setSavingFinancial] = useState(false)
  const [financialForm, setFinancialForm] = useState({
    reference_date: '',
    revenue: 0,
    fixed_expenses: 0,
    marketing_expenses: 0,
    investments: 0,
    financing: 0,
  })

  const openFinancialModal = (fin?: ConsultingFinancial) => {
    if (fin) {
      setFinancialForm({
        reference_date: fin.reference_date?.slice(0, 7) || '',
        revenue: fin.revenue,
        fixed_expenses: fin.fixed_expenses,
        marketing_expenses: fin.marketing_expenses,
        investments: fin.investments,
        financing: fin.financing,
      })
      setFinancialModal({ open: true, editing: fin })
    } else {
      setFinancialForm({
        reference_date: new Date().toISOString().slice(0, 7),
        revenue: 0,
        fixed_expenses: 0,
        marketing_expenses: 0,
        investments: 0,
        financing: 0,
      })
      setFinancialModal({ open: true })
    }
  }

  const handleSaveFinancial = async () => {
    if (!financialForm.reference_date) {
      toast.error('Informe o mes de referencia.')
      return
    }
    setSavingFinancial(true)
    const { error: saveError } = await upsertFinancial({
      id: financialModal.editing?.id,
      reference_date: financialForm.reference_date + '-01',
      revenue: Number(financialForm.revenue),
      fixed_expenses: Number(financialForm.fixed_expenses),
      marketing_expenses: Number(financialForm.marketing_expenses),
      investments: Number(financialForm.investments),
      financing: Number(financialForm.financing),
    })
    setSavingFinancial(false)
    if (saveError) {
      toast.error(saveError)
    } else {
      toast.success(financialModal.editing ? 'Dados atualizados!' : 'Mes lancado!')
      setFinancialModal({ open: false })
    }
  }

  const handleDeleteFinancial = async (finId: string) => {
    const { error: delError } = await deleteFinancial(finId)
    if (delError) {
      toast.error(delError)
    } else {
      toast.success('Registro excluido.')
      setFinancialModal({ open: false })
    }
  }

  const activeAssignments = useMemo(() => {
    return (client?.assignments || []).filter((assignment) => assignment.active)
  }, [client?.assignments])

  const availableUsers = useMemo(() => {
    const assignedIds = new Set((client?.assignments || []).map((assignment) => assignment.user_id))
    return assignableUsers.filter((user) => !assignedIds.has(user.id))
  }, [assignableUsers, client?.assignments])

  const handleCreateUnit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!unitForm.name.trim()) {
      toast.error('Nome da unidade é obrigatório.')
      return
    }

    setSavingUnit(true)
    const { error: createError } = await createUnit(unitForm)
    setSavingUnit(false)

    if (createError) {
      toast.error(createError)
      return
    }

    toast.success('Unidade cadastrada.')
    setUnitForm({ name: '', city: '', state: '', is_primary: false })
  }

  const handleCreateContact = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!contactForm.name.trim()) {
      toast.error('Nome do contato é obrigatório.')
      return
    }

    setSavingContact(true)
    const { error: createError } = await createContact(contactForm)
    setSavingContact(false)

    if (createError) {
      toast.error(createError)
      return
    }

    toast.success('Contato cadastrado.')
    setContactForm({ name: '', email: '', phone: '', role: '', is_primary: false })
  }

  const handleCreateAssignment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!assignmentForm.user_id) {
      toast.error('Selecione um usuário.')
      return
    }

    setSavingAssignment(true)
    const { error: createError } = await upsertAssignment(assignmentForm)
    setSavingAssignment(false)

    if (createError) {
      toast.error(createError)
      return
    }

    toast.success('Consultor vinculado ao cliente.')
    setAssignmentForm({ user_id: '', assignment_role: 'responsavel' })
  }

  const handleToggleAssignment = async (assignmentId: string, nextActive: boolean) => {
    const { error: updateError } = await toggleAssignment(assignmentId, nextActive)
    if (updateError) {
      toast.error(updateError)
      return
    }
    toast.success(nextActive ? 'Vínculo reativado.' : 'Vínculo desativado.')
  }

  if (loading) {
    return (
      <main className="w-full h-full p-mx-lg bg-surface-alt">
        <Card className="p-mx-lg border-none shadow-mx-md bg-white">
          <Typography variant="p">Carregando cliente da consultoria...</Typography>
        </Card>
      </main>
    )
  }

  if (error || !client) {
    return (
      <main className="w-full h-full p-mx-lg bg-surface-alt">
        <Card className="p-mx-lg border-none shadow-mx-md bg-white space-y-mx-sm">
          <Typography variant="h2" tone="error">Cliente não disponível</Typography>
          <Typography variant="p" tone="muted">{error || 'Você não tem acesso a este cliente ou ele não existe.'}</Typography>
          <Button asChild variant="secondary" size="sm">
            <Link to="/consultoria/clientes">VOLTAR</Link>
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="space-y-mx-sm">
          <Button asChild variant="ghost" size="sm" className="pl-0">
            <Link to="/consultoria/clientes">
              <ArrowLeft size={16} className="mr-2" />
              VOLTAR PARA CLIENTES
            </Link>
          </Button>
          <div className="flex items-center gap-mx-sm">
            <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">{client.name}</Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md">
            {client.product_name || 'PRODUTO NÃO DEFINIDO'} • {client.status.toUpperCase()}
          </Typography>
        </div>

        <div className="flex items-center gap-mx-sm">
          <nav className="flex items-center gap-mx-tiny bg-white p-mx-tiny rounded-mx-full border border-border-default shadow-mx-sm">
            {(['overview', 'visits', 'financial'] as Tab[]).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className="rounded-mx-full px-6 h-mx-lg uppercase font-black"
              >
                {tab === 'overview' ? 'Visão Geral' : tab === 'visits' ? 'Agenda/Visitas' : 'DRE/Financeiro'}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      {activeTab === 'overview' && (
        <>
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-mx-lg">
            <Card className="p-mx-lg border-none shadow-mx-md bg-white xl:col-span-2">
              <Typography variant="h3" className="mb-mx-md">DADOS CADASTRAIS</Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
                <div className="space-y-mx-xs">
                  <Typography variant="tiny" tone="muted">RAZÃO SOCIAL</Typography>
                  <Typography variant="p">{client.legal_name || 'Não informada'}</Typography>
                </div>
                <div className="space-y-mx-xs">
                  <Typography variant="tiny" tone="muted">CNPJ</Typography>
                  <Typography variant="p">{client.cnpj || 'Não informado'}</Typography>
                </div>
                <div className="space-y-mx-xs">
                  <Typography variant="tiny" tone="muted">PRODUTO</Typography>
                  <Typography variant="p">{client.product_name || 'Não definido'}</Typography>
                </div>
                <div className="space-y-mx-xs">
                  <Typography variant="tiny" tone="muted">CRIADO EM</Typography>
                  <Typography variant="p">{new Date(client.created_at).toLocaleDateString('pt-BR')}</Typography>
                </div>
                <div className="space-y-mx-xs md:col-span-2">
                  <Typography variant="tiny" tone="muted">NOTAS</Typography>
                  <Typography variant="p">{client.notes || 'Sem observações iniciais.'}</Typography>
                </div>
              </div>
            </Card>

            <Card className="p-mx-lg border-none shadow-mx-md bg-white">
              <Typography variant="h3" className="mb-mx-md">CONSULTORES</Typography>
              <div className="space-y-mx-sm">
                {activeAssignments.length === 0 && (
                  <Typography variant="p" tone="muted">Nenhum consultor vinculado ainda.</Typography>
                )}
                {activeAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-mx-md rounded-mx-lg bg-surface-alt border border-border-default space-y-mx-xs">
                    <div className="flex items-center justify-between gap-mx-sm">
                      <div className="flex items-center gap-mx-xs min-w-0">
                        <User2 size={16} className="text-brand-primary shrink-0" />
                        <Typography variant="p" className="truncate">{assignment.user?.name || assignment.user_id}</Typography>
                      </div>
                      <Badge variant="outline" className="rounded-mx-full px-3 py-1">
                        {assignment.assignment_role.toUpperCase()}
                      </Badge>
                    </div>
                    <Typography variant="tiny" tone="muted">{assignment.user?.email || 'Sem e-mail'}</Typography>
                    {canManage && (
                      <div className="pt-mx-xs">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-mx-lg"
                          onClick={() => handleToggleAssignment(assignment.id, false)}
                        >
                          DESATIVAR
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {canManage && client.assignments?.filter((assignment) => !assignment.active).map((assignment) => (
                  <div key={assignment.id} className="p-mx-md rounded-mx-lg bg-surface-alt border border-border-default opacity-70 space-y-mx-xs">
                    <div className="flex items-center justify-between gap-mx-sm">
                      <Typography variant="p">{assignment.user?.name || assignment.user_id}</Typography>
                      <Badge variant="outline" className="rounded-mx-full px-3 py-1">INATIVO</Badge>
                    </div>
                    <Typography variant="tiny" tone="muted">{assignment.user?.email || 'Sem e-mail'}</Typography>
                    <div className="pt-mx-xs">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-mx-lg"
                        onClick={() => handleToggleAssignment(assignment.id, true)}
                      >
                        REATIVAR
                      </Button>
                    </div>
                  </div>
                ))}
                {canManage && (
                  <form onSubmit={handleCreateAssignment} className="mt-mx-md border border-border-default rounded-mx-lg p-mx-md bg-surface-alt space-y-mx-sm">
                    <Typography variant="tiny" tone="muted">NOVO VÍNCULO</Typography>
                    <div className="space-y-mx-xs">
                      <Typography as="label" htmlFor="consulting-assignment-user" variant="caption">Usuário</Typography>
                      <select
                        id="consulting-assignment-user"
                        value={assignmentForm.user_id}
                        onChange={(event) => setAssignmentForm((current) => ({ ...current, user_id: event.target.value }))}
                        className="w-full h-mx-12 px-4 bg-white border border-border-default rounded-mx-lg text-sm font-bold text-text-primary outline-none"
                      >
                        <option value="">Selecionar usuário...</option>
                        {availableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-mx-xs">
                      <Typography as="label" htmlFor="consulting-assignment-role" variant="caption">Papel no cliente</Typography>
                      <select
                        id="consulting-assignment-role"
                        value={assignmentForm.assignment_role}
                        onChange={(event) => setAssignmentForm((current) => ({ ...current, assignment_role: event.target.value as 'responsavel' | 'auxiliar' | 'viewer' }))}
                        className="w-full h-mx-12 px-4 bg-white border border-border-default rounded-mx-lg text-sm font-bold text-text-primary outline-none"
                      >
                        <option value="responsavel">Responsável</option>
                        <option value="auxiliar">Auxiliar</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" size="sm" disabled={savingAssignment || availableUsers.length === 0}>
                        {savingAssignment ? 'SALVANDO...' : 'VINCULAR'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-mx-lg">
            <Card className="p-mx-lg border-none shadow-mx-md bg-white">
              <Typography variant="h3" className="mb-mx-md">UNIDADES</Typography>
              <div className="space-y-mx-sm">
                {(client.units || []).length === 0 && (
                  <Typography variant="p" tone="muted">Nenhuma unidade cadastrada ainda.</Typography>
                )}
                {(client.units || []).map((unit) => (
                  <div key={unit.id} className="p-mx-md rounded-mx-lg bg-surface-alt border border-border-default">
                    <div className="flex items-center justify-between gap-mx-sm">
                      <div className="flex items-center gap-mx-xs min-w-0">
                        <Building2 size={16} className="text-brand-primary shrink-0" />
                        <Typography variant="p" className="truncate">{unit.name}</Typography>
                      </div>
                      {unit.is_primary && (
                        <Badge variant="success" className="rounded-mx-full px-3 py-1 border-none">PRINCIPAL</Badge>
                      )}
                    </div>
                    <Typography variant="tiny" tone="muted">
                      {[unit.city, unit.state].filter(Boolean).join(' / ') || 'Localização não informada'}
                    </Typography>
                  </div>
                ))}
                {canManage && (
                  <form onSubmit={handleCreateUnit} className="mt-mx-md border border-border-default rounded-mx-lg p-mx-md bg-surface-alt grid grid-cols-1 md:grid-cols-2 gap-mx-sm">
                    <div className="space-y-mx-xs md:col-span-2">
                      <Typography as="label" htmlFor="consulting-unit-name" variant="caption">Nome da unidade</Typography>
                      <Input
                        id="consulting-unit-name"
                        value={unitForm.name}
                        onChange={(event) => setUnitForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Ex: DNA Veículos - Matriz"
                      />
                    </div>
                    <div className="space-y-mx-xs">
                      <Typography as="label" htmlFor="consulting-unit-city" variant="caption">Cidade</Typography>
                      <Input
                        id="consulting-unit-city"
                        value={unitForm.city}
                        onChange={(event) => setUnitForm((current) => ({ ...current, city: event.target.value }))}
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="space-y-mx-xs">
                      <Typography as="label" htmlFor="consulting-unit-state" variant="caption">UF</Typography>
                      <Input
                        id="consulting-unit-state"
                        value={unitForm.state}
                        onChange={(event) => setUnitForm((current) => ({ ...current, state: event.target.value.toUpperCase() }))}
                        placeholder="UF"
                      />
                    </div>
                    <label className="md:col-span-2 flex items-center gap-mx-xs text-sm font-bold text-text-primary">
                      <input
                        type="checkbox"
                        checked={unitForm.is_primary}
                        onChange={(event) => setUnitForm((current) => ({ ...current, is_primary: event.target.checked }))}
                      />
                      Definir como unidade principal
                    </label>
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit" size="sm" disabled={savingUnit}>
                        {savingUnit ? 'SALVANDO...' : 'ADICIONAR UNIDADE'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>

            <Card className="p-mx-lg border-none shadow-mx-md bg-white">
              <Typography variant="h3" className="mb-mx-md">CONTATOS</Typography>
              <div className="space-y-mx-sm">
                {(client.contacts || []).length === 0 && (
                  <Typography variant="p" tone="muted">Nenhum contato cadastrado ainda.</Typography>
                )}
                {(client.contacts || []).map((contact) => (
                  <div key={contact.id} className="p-mx-md rounded-mx-lg bg-surface-alt border border-border-default">
                    <div className="flex items-center justify-between gap-mx-sm">
                      <Typography variant="p">{contact.name}</Typography>
                      {contact.is_primary && (
                        <Badge variant="outline" className="rounded-mx-full px-3 py-1">PRINCIPAL</Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-mx-xs mt-mx-xs">
                      <div className="flex items-center gap-mx-xs">
                        <BriefcaseBusiness size={14} className="text-text-tertiary" />
                        <Typography variant="tiny" tone="muted">{contact.role || 'Função não informada'}</Typography>
                      </div>
                      <div className="flex items-center gap-mx-xs">
                        <Mail size={14} className="text-text-tertiary" />
                        <Typography variant="tiny" tone="muted">{contact.email || 'Sem e-mail'}</Typography>
                      </div>
                      <div className="flex items-center gap-mx-xs">
                        <Phone size={14} className="text-text-tertiary" />
                        <Typography variant="tiny" tone="muted">{contact.phone || 'Sem telefone'}</Typography>
                      </div>
                    </div>
                  </div>
                ))}
                {canManage && (
                  <form onSubmit={handleCreateContact} className="mt-mx-md border border-border-default rounded-mx-lg p-mx-md bg-surface-alt grid grid-cols-1 md:grid-cols-2 gap-mx-sm">
                    <div className="space-y-mx-xs md:col-span-2">
                      <Typography as="label" htmlFor="consulting-contact-name" variant="caption">Nome do contato</Typography>
                      <Input
                        id="consulting-contact-name"
                        value={contactForm.name}
                        onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Nome"
                      />
                    </div>
                    <div className="space-y-mx-xs">
                      <Typography as="label" htmlFor="consulting-contact-email" variant="caption">E-mail</Typography>
                      <Input
                        id="consulting-contact-email"
                        value={contactForm.email}
                        onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
                        placeholder="email@cliente.com"
                      />
                    </div>
                    <div className="space-y-mx-xs">
                      <Typography as="label" htmlFor="consulting-contact-phone" variant="caption">Telefone</Typography>
                      <Input
                        id="consulting-contact-phone"
                        value={contactForm.phone}
                        onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))}
                        placeholder="Telefone"
                      />
                    </div>
                    <div className="space-y-mx-xs md:col-span-2">
                      <Typography as="label" htmlFor="consulting-contact-role" variant="caption">Função</Typography>
                      <Input
                        id="consulting-contact-role"
                        value={contactForm.role}
                        onChange={(event) => setContactForm((current) => ({ ...current, role: event.target.value }))}
                        placeholder="Ex: Diretor comercial"
                      />
                    </div>
                    <label className="md:col-span-2 flex items-center gap-mx-xs text-sm font-bold text-text-primary">
                      <input
                        type="checkbox"
                        checked={contactForm.is_primary}
                        onChange={(event) => setContactForm((current) => ({ ...current, is_primary: event.target.checked }))}
                      />
                      Definir como contato principal
                    </label>
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit" size="sm" disabled={savingContact}>
                        {savingContact ? 'SALVANDO...' : 'ADICIONAR CONTATO'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          </section>
        </>
      )}

      {activeTab === 'visits' && (
        <section className="flex flex-col gap-mx-lg">
          {clientId && (
            <GoogleCalendarView clientId={clientId} />
          )}

          <div className="flex items-center justify-between">
            <Typography variant="h3">CRONOGRAMA DE VISITAS (MÉTODO 7 PASSOS)</Typography>
            <Button size="sm" className="rounded-mx-xl">
              <Plus size={16} className="mr-2" /> AGENDAR NOVA VISITA
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-mx-md">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => {
              const visit = client.visits?.find(v => v.visit_number === num)
              return (
                <Card key={num} className={cn(
                  "p-mx-md border-none shadow-mx-sm transition-all",
                  visit?.status === 'concluída' ? 'bg-status-success-surface/20' : 'bg-white'
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={visit?.status === 'concluída' ? 'success' : 'outline'} className="rounded-mx-full">
                      VISITA {num}
                    </Badge>
                    {visit?.status === 'concluída' ? <CheckCircle2 size={18} className="text-status-success" /> : <Clock size={18} className="text-text-tertiary opacity-40" />}
                  </div>
                  
                  <div className="min-h-mx-24 mb-6">
                    <Typography variant="p" className="text-xs leading-snug">
                      {visit?.objective || `Aguardando agendamento da etapa ${num}...`}
                    </Typography>
                  </div>

                  <div className="space-y-mx-xs pt-4 border-t border-border-subtle">
                    <div className="flex items-center gap-mx-xs">
                      <Calendar size={12} className="text-text-tertiary" />
                      <Typography variant="tiny" tone="muted">
                        {visit?.scheduled_at ? new Date(visit.scheduled_at).toLocaleDateString('pt-BR') : 'Sem data'}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-mx-xs">
                      <User2 size={12} className="text-text-tertiary" />
                      <Typography variant="tiny" tone="muted" className="truncate">
                        {visit?.consultant?.name || 'Não definido'}
                      </Typography>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="w-full mt-6 rounded-mx-lg text-xs" asChild>
                    <Link to={`/consultoria/clientes/${clientId}/visitas/${num}`}>
                      DETALHES <ChevronRight size={14} className="ml-1" />
                    </Link>
                  </Button>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {activeTab === 'financial' && (
        <section className="flex flex-col gap-mx-lg">
          <div className="flex items-center justify-between">
            <Typography variant="h3">DRE & EVOLUÇÃO FINANCEIRA</Typography>
            <Button size="sm" className="rounded-mx-xl" onClick={() => openFinancialModal()}>
              <Plus size={16} className="mr-2" /> LANÇAR MÊS
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-md">
            <Card className="p-mx-lg bg-brand-secondary text-white border-none shadow-mx-xl">
              <Typography variant="caption" tone="white" className="opacity-60 mb-2 block">LUCRO LÍQUIDO (MÊS ATUAL)</Typography>
              <div className="flex items-baseline gap-mx-xs">
                <Typography variant="h1" tone="white" className="text-4xl">R$ {(client.financials?.[0]?.net_profit || 0).toLocaleString('pt-BR')}</Typography>
                <Badge variant="success" className="bg-white/20 text-white border-none">+12%</Badge>
              </div>
            </Card>
            <Card className="p-mx-lg bg-white border-none shadow-mx-sm">
              <Typography variant="caption" tone="muted" className="mb-2 block">ROI DA CONSULTORIA</Typography>
              <div className="flex items-baseline gap-mx-xs">
                <Typography variant="h1" className="text-4xl">{(client.financials?.[0]?.roi || 0)}x</Typography>
                <Typography variant="tiny" tone="muted" className="uppercase font-black opacity-40">Retorno</Typography>
              </div>
            </Card>
            <Card className="p-mx-lg bg-white border-none shadow-mx-sm">
              <Typography variant="caption" tone="muted" className="mb-2 block">TAXA DE CONVERSÃO</Typography>
              <div className="flex items-baseline gap-mx-xs">
                <Typography variant="h1" className="text-4xl">{(client.financials?.[0]?.conversion_rate || 0)}%</Typography>
                <Typography variant="tiny" tone="muted" className="uppercase font-black opacity-40">Global</Typography>
              </div>
            </Card>
          </div>

          <Card className="border-none shadow-mx-md bg-white overflow-hidden">
            <div className="p-mx-lg border-b border-border-subtle flex items-center justify-between">
              <Typography variant="h3">HISTÓRICO MENSAL</Typography>
              <Button variant="outline" size="sm" className="rounded-mx-lg">
                <FileText size={16} className="mr-2" /> EXPORTAR PDF
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-alt/50 border-b border-border-default">
                  <tr>
                    <th className="p-mx-md"><Typography variant="tiny" tone="muted">MÊS</Typography></th>
                    <th className="p-mx-md"><Typography variant="tiny" tone="muted">FATURAMENTO</Typography></th>
                    <th className="p-mx-md"><Typography variant="tiny" tone="muted">DESPESAS FIXAS</Typography></th>
                    <th className="p-mx-md"><Typography variant="tiny" tone="muted">MARKETING</Typography></th>
                    <th className="p-mx-md"><Typography variant="tiny" tone="muted">LUCRO</Typography></th>
                    <th className="p-mx-md text-right"><Typography variant="tiny" tone="muted">AÇÃO</Typography></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {(client.financials || []).map((fin) => (
                    <tr key={fin.id} className="hover:bg-surface-alt/30 transition-colors">
                      <td className="p-mx-md font-black text-sm">{new Date(fin.reference_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()}</td>
                      <td className="p-mx-md font-bold text-sm">R$ {fin.revenue.toLocaleString('pt-BR')}</td>
                      <td className="p-mx-md font-bold text-sm">R$ {fin.fixed_expenses.toLocaleString('pt-BR')}</td>
                      <td className="p-mx-md font-bold text-sm">R$ {fin.marketing_expenses.toLocaleString('pt-BR')}</td>
                      <td className="p-mx-md font-black text-sm text-brand-primary">R$ {fin.net_profit.toLocaleString('pt-BR')}</td>
                      <td className="p-mx-md text-right">
                        <Button variant="ghost" size="sm" onClick={() => openFinancialModal(fin)}>EDITAR</Button>
                      </td>
                    </tr>
                  ))}
                  {(client.financials || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-mx-lg text-center opacity-40">Nenhum dado financeiro lançado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      {financialModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-mx-md" onClick={() => setFinancialModal({ open: false })}>
          <div className="bg-white rounded-mx-2xl shadow-mx-xl w-full max-w-lg p-mx-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-mx-lg">
              <Typography variant="h3">{financialModal.editing ? 'Editar DRE' : 'Lancar Mes'}</Typography>
              <button onClick={() => setFinancialModal({ open: false })} className="text-text-tertiary hover:text-text-primary"><X size={20} /></button>
            </div>

            <div className="space-y-mx-md">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">Mes de Referencia</label>
                <Input type="month" value={financialForm.reference_date} onChange={(e) => setFinancialForm({ ...financialForm, reference_date: e.target.value })} className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-mx-md">
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">Faturamento (R$)</label>
                  <Input type="number" value={financialForm.revenue || ''} onChange={(e) => setFinancialForm({ ...financialForm, revenue: Number(e.target.value) })} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">Despesas Fixas (R$)</label>
                  <Input type="number" value={financialForm.fixed_expenses || ''} onChange={(e) => setFinancialForm({ ...financialForm, fixed_expenses: Number(e.target.value) })} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">Marketing (R$)</label>
                  <Input type="number" value={financialForm.marketing_expenses || ''} onChange={(e) => setFinancialForm({ ...financialForm, marketing_expenses: Number(e.target.value) })} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">Investimentos (R$)</label>
                  <Input type="number" value={financialForm.investments || ''} onChange={(e) => setFinancialForm({ ...financialForm, investments: Number(e.target.value) })} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">Financiamento (R$)</label>
                  <Input type="number" value={financialForm.financing || ''} onChange={(e) => setFinancialForm({ ...financialForm, financing: Number(e.target.value) })} placeholder="0" />
                </div>
                <div className="flex items-end">
                  <div className="bg-brand-primary/10 rounded-mx-lg p-mx-md w-full">
                    <Typography variant="tiny" className="text-text-tertiary uppercase">Lucro Liquido</Typography>
                    <Typography variant="h3" className="text-brand-primary font-black">
                      R$ {(financialForm.revenue - financialForm.fixed_expenses - financialForm.marketing_expenses - financialForm.investments - financialForm.financing).toLocaleString('pt-BR')}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-mx-xl">
              <div>
                {financialModal.editing && (
                  <Button variant="ghost" size="sm" className="text-status-error" onClick={() => handleDeleteFinancial(financialModal.editing!.id)}>
                    <Trash2 size={14} className="mr-1" /> Excluir
                  </Button>
                )}
              </div>
              <div className="flex gap-mx-sm">
                <Button variant="outline" size="sm" onClick={() => setFinancialModal({ open: false })}>Cancelar</Button>
                <Button size="sm" className="bg-brand-primary text-white" onClick={handleSaveFinancial} disabled={savingFinancial}>
                  {savingFinancial ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
