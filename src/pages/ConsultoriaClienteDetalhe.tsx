import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { 
  ArrowLeft, BriefcaseBusiness, Building2, Mail, Phone, User2, 
  Calendar, CheckCircle2, Clock, ChevronRight,
  Plus, FileText, CalendarDays
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { useConsultingClientDetail } from '@/hooks/useConsultingClients'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { GoogleCalendarView } from '@/features/consultoria/components/GoogleCalendarView'
import { DREView } from '@/features/consultoria/components/DREView'
import { Modal } from '@/components/organisms/Modal'
import { Select } from '@/components/atoms/Select'
import { DatePicker } from '@/components/atoms/DatePicker'

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
    refetch,
  } = useConsultingClientDetail(clientId)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'visits' || tab === 'financial' || tab === 'overview') {
      setActiveTab(tab as Tab)
    }
    if (searchParams.get('google_connected') === '1') {
      toast.success('Google Calendar conectado com sucesso!')
      window.history.replaceState({}, '', `/consultoria/clientes/${clientId}`)
    }
  }, [searchParams, clientId])
  const [savingUnit, setSavingUnit] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [unitForm, setUnitForm] = useState({ name: '', city: '', state: '', is_primary: false })
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', role: '', is_primary: false })
  const [assignmentForm, setAssignmentForm] = useState<{ user_id: string; assignment_role: 'responsavel' | 'auxiliar' | 'viewer' }>({
    user_id: '',
    assignment_role: 'responsavel',
  })
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [submittingVisit, setSubmittingVisit] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_at: '',
    scheduled_time: '09:00',
    duration_hours: '3',
    modality: 'Presencial',
    consultant_id: '',
    objective: '',
  })

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

  const handleOpenSchedule = () => {
    const nextNum = (client?.visits || []).reduce((max, v) => Math.max(max, v.visit_number), 0) + 1
    if (nextNum > 7) {
      toast.error('Todas as 7 visitas já foram criadas para este cliente.')
      return
    }
    setScheduleForm({
      scheduled_at: '',
      scheduled_time: '09:00',
      duration_hours: '3',
      modality: 'Presencial',
      consultant_id: '',
      objective: '',
    })
    setShowScheduleModal(true)
  }

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) return
    if (!scheduleForm.scheduled_at || !scheduleForm.scheduled_time) {
      toast.error('Informe data e horário.')
      return
    }

    const existingVisits = client?.visits || []
    const nextNum = existingVisits.reduce((max, v) => Math.max(max, v.visit_number), 0) + 1
    if (nextNum > 7) {
      toast.error('Todas as 7 visitas já foram criadas.')
      return
    }

    const scheduledAt = `${scheduleForm.scheduled_at}T${scheduleForm.scheduled_time}:00`

    setSubmittingVisit(true)
    const { error: insertError } = await supabase
      .from('consulting_visits')
      .insert({
        client_id: clientId,
        visit_number: nextNum,
        scheduled_at: scheduledAt,
        duration_hours: Number(scheduleForm.duration_hours) || 3,
        modality: scheduleForm.modality,
        consultant_id: scheduleForm.consultant_id || null,
        objective: scheduleForm.objective || null,
        status: 'agendada',
      })

    setSubmittingVisit(false)

    if (insertError) {
      toast.error('Erro ao agendar: ' + insertError.message)
      return
    }

    toast.success(`Visita ${nextNum} agendada com sucesso!`)
    setShowScheduleModal(false)
    await refetch()
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
                      <Select
                        id="consulting-assignment-user"
                        value={assignmentForm.user_id}
                        onChange={(event) => setAssignmentForm((current) => ({ ...current, user_id: event.target.value }))}
                      >
                        <option value="">Selecionar usuário...</option>
                        {availableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-mx-xs">
                      <Typography as="label" htmlFor="consulting-assignment-role" variant="caption">Papel no cliente</Typography>
                      <Select
                        id="consulting-assignment-role"
                        value={assignmentForm.assignment_role}
                        onChange={(event) => setAssignmentForm((current) => ({ ...current, assignment_role: event.target.value as 'responsavel' | 'auxiliar' | 'viewer' }))}
                      >
                        <option value="responsavel">Responsável</option>
                        <option value="auxiliar">Auxiliar</option>
                        <option value="viewer">Viewer</option>
                      </Select>
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
            <div className="flex items-center gap-mx-sm">
              <Button asChild variant="ghost" size="sm" className="rounded-mx-xl">
                <Link to="/agenda">
                  <CalendarDays size={16} className="mr-2" /> VER AGENDA MX
                </Link>
              </Button>
              {canManage && (
                <Button size="sm" className="rounded-mx-xl" onClick={handleOpenSchedule}>
                  <Plus size={16} className="mr-2" /> AGENDAR NOVA VISITA
                </Button>
              )}
            </div>
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
                    {visit?.status === 'concluída' ? <CheckCircle2 size={18} className="text-status-success" /> : <Clock size={18} className="text-text-label" />}
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

      {activeTab === 'financial' && clientId && (
        <DREView clientId={clientId} />
      )}

      <Modal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Agendar Visita"
        description={`${client?.name} — Visita ${(client?.visits || []).reduce((max, v) => Math.max(max, v.visit_number), 0) + 1}/7`}
        size="xl"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowScheduleModal(false)}>CANCELAR</Button>
            <Button type="submit" form="client-schedule-form" disabled={submittingVisit} className="bg-brand-secondary">
              {submittingVisit ? 'AGENDANDO...' : 'CONFIRMAR AGENDAMENTO'}
            </Button>
          </>
        }
      >
        <form id="client-schedule-form" onSubmit={handleSubmitSchedule} className="space-y-mx-lg">
          <div className="grid grid-cols-2 gap-mx-md">
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="client-schedule-date" variant="caption" className="font-black uppercase tracking-widest">Data *</Typography>
              <DatePicker
                id="client-schedule-date"
                value={scheduleForm.scheduled_at}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
              />
            </div>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="client-schedule-time" variant="caption" className="font-black uppercase tracking-widest">Horário *</Typography>
              <Input
                id="client-schedule-time"
                type="time"
                value={scheduleForm.scheduled_time}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduled_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-mx-md">
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="client-schedule-duration" variant="caption" className="font-black uppercase tracking-widest">Duração (horas)</Typography>
              <Input
                id="client-schedule-duration"
                type="number"
                min="1"
                max="12"
                value={scheduleForm.duration_hours}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, duration_hours: e.target.value }))}
              />
            </div>
            <Select
              id="client-schedule-modality"
              label="Modalidade"
              value={scheduleForm.modality}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, modality: e.target.value }))}
            >
              <option value="Presencial">Presencial</option>
              <option value="Online">Online</option>
            </Select>
          </div>

          <Select
            id="client-schedule-consultant"
            label="Consultor Responsável"
            value={scheduleForm.consultant_id}
            onChange={(e) => setScheduleForm((prev) => ({ ...prev, consultant_id: e.target.value }))}
          >
            <option value="">Sem consultor...</option>
            {activeAssignments.filter((a) => a.assignment_role === 'responsavel' && a.user).map((a) => (
              <option key={a.user_id} value={a.user_id}>{a.user?.name}</option>
            ))}
            {assignableUsers.filter((u) => u.role === 'admin').map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>

          <div className="space-y-mx-xs">
            <Typography as="label" htmlFor="client-schedule-objective" variant="caption" className="font-black uppercase tracking-widest">Objetivo da Visita</Typography>
            <Textarea
              id="client-schedule-objective"
              value={scheduleForm.objective}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, objective: e.target.value }))}
              placeholder="Descreva o objetivo principal desta visita..."
              className="min-h-mx-24"
            />
          </div>
        </form>
      </Modal>

    </main>
  )
}
