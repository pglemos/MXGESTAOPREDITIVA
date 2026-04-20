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
import { useConsultingClientDetail, useConsultingMethodology } from '@/hooks/useConsultingClients'
import { useConsultingModules } from '@/hooks/useConsultingModules'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { GoogleCalendarView } from '@/features/consultoria/components/GoogleCalendarView'
import { DREView } from '@/features/consultoria/components/DREView'
import { ConsultingActionPlanView } from '@/features/consultoria/components/ConsultingActionPlanView'
import { ConsultingModulesPanel } from '@/features/consultoria/components/ConsultingModulesPanel'
import { ConsultingStrategicView } from '@/features/consultoria/components/ConsultingStrategicView'
import { ConsultingDailyTrackingView } from '@/features/consultoria/components/ConsultingDailyTrackingView'
import { Modal } from '@/components/organisms/Modal'
import { Select } from '@/components/atoms/Select'
import { DatePicker } from '@/components/atoms/DatePicker'

type Tab = 'overview' | 'visits' | 'strategic' | 'action' | 'financial' | 'daily' | 'monthly'

const tabLabels: Record<Tab, string> = {
  overview: 'Visão Geral',
  visits: 'Agenda/Visitas',
  strategic: 'Estratégico',
  action: 'Plano de Ação',
  financial: 'DRE/Financeiro',
  daily: 'Acompanhamento Diário',
  monthly: 'Fechamento Mensal',
}

export default function ConsultoriaClienteDetalhe() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const {
    client,
    loading,
    error,
    refetch,
  } = useConsultingClientDetailBySlug(clientSlug)
  
  const clientId = client?.id
  const {
    modules,
    loading: modulesLoading,
    canManage: canManageModules,
    isEnabled: isModuleEnabled,
    upsertModule,
  } = useConsultingModules(clientId)
  const { steps: methodologySteps, program } = useConsultingMethodology(client?.program_template_key || 'pmr_7')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'visits' || tab === 'financial' || tab === 'overview' || tab === 'strategic' || tab === 'action' || tab === 'daily' || tab === 'monthly') {
      setActiveTab(tab as Tab)
    }
    if (searchParams.get('google_connected') === '1') {
      toast.success('Google Calendar conectado com sucesso!')
      window.history.replaceState({}, '', `/consultoria/clientes/${clientId}`)
    }
  }, [searchParams, clientId])

  useEffect(() => {
    if (modulesLoading) return
    if (activeTab === 'strategic' && !isModuleEnabled('strategic_plan')) setActiveTab('overview')
    if (activeTab === 'action' && !isModuleEnabled('action_plan')) setActiveTab('overview')
    if (activeTab === 'financial' && !isModuleEnabled('dre')) setActiveTab('overview')
    if (activeTab === 'daily' && !isModuleEnabled('daily_tracking')) setActiveTab('overview')
    if (activeTab === 'monthly' && !isModuleEnabled('monthly_close')) setActiveTab('overview')
  }, [activeTab, isModuleEnabled, modulesLoading])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setSearchParams({ tab }, { replace: true })
  }
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

  const visitSteps = useMemo(() => {
    if (methodologySteps.length > 0) return methodologySteps
    return [1, 2, 3, 4, 5, 6, 7].map((visitNumber) => ({
      id: `fallback-${visitNumber}`,
      visit_number: visitNumber,
      title: `Visita ${visitNumber}`,
      objective: `Aguardando agendamento da etapa ${visitNumber}...`,
      target: null,
      duration: null,
      evidence_required: null,
      checklist_template: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
  }, [methodologySteps])

  const maxVisits = program?.total_visits || visitSteps.length || 7
  const visibleTabs = useMemo(() => {
    const tabs: Tab[] = ['overview', 'visits']
    if (isModuleEnabled('strategic_plan')) tabs.push('strategic')
    if (isModuleEnabled('action_plan')) tabs.push('action')
    if (isModuleEnabled('daily_tracking')) tabs.push('daily')
    if (isModuleEnabled('monthly_close')) tabs.push('monthly')
    if (isModuleEnabled('dre')) tabs.push('financial')
    return tabs
  }, [isModuleEnabled])

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
    if (nextNum > maxVisits) {
      toast.error(`Todas as ${maxVisits} visitas já foram criadas para este cliente.`)
      return
    }
    const nextStep = visitSteps.find((step) => step.visit_number === nextNum)
    setScheduleForm({
      scheduled_at: '',
      scheduled_time: '09:00',
      duration_hours: '3',
      modality: 'Presencial',
      consultant_id: '',
      objective: nextStep?.objective || '',
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

    const scheduledAt = `${scheduleForm.scheduled_at}T${scheduleForm.scheduled_time}:00`

    setSubmittingVisit(true)
    const { error: insertError } = await supabase
      .from('consulting_visits')
      .insert({
        client_id: clientId,
        visit_number: (client?.visits || []).reduce((max, v) => Math.max(max, v.visit_number), 0) + 1,
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

    toast.success(`Visita agendada com sucesso!`)
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
          <Typography variant="p">Carregando...</Typography>
        </Card>
      </main>
    )
  }

  if (error || !client) {
    return (
      <main className="w-full h-full p-mx-lg bg-surface-alt">
        <Card className="p-mx-lg border-none shadow-mx-md bg-white">
          <Typography variant="h2" tone="error">Cliente não disponível</Typography>
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <Link to="/consultoria/clientes">VOLTAR</Link>
          </Button>
        </Card>
      </main>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <ConsultingModulesPanel
              modules={modules}
              loading={modulesLoading}
              canManage={canManageModules}
              onToggle={upsertModule}
            />

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-mx-lg">
              <Card className="p-mx-lg border-none shadow-mx-md bg-white xl:col-span-2">
                <Typography variant="h3" className="mb-mx-md uppercase">Dados Cadastrais</Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
                  <div className="space-y-mx-xs">
                    <Typography variant="tiny" tone="muted">RAZÃO SOCIAL</Typography>
                    <Typography variant="p" className="font-bold">{client.legal_name || 'Não informada'}</Typography>
                  </div>
                  <div className="space-y-mx-xs">
                    <Typography variant="tiny" tone="muted">CNPJ</Typography>
                    <Typography variant="p" className="font-bold">{client.cnpj || 'Não informado'}</Typography>
                  </div>
                  <div className="space-y-mx-xs">
                    <Typography variant="tiny" tone="muted">PRODUTO</Typography>
                    <Typography variant="p" className="font-bold">{client.product_name || 'Não definido'}</Typography>
                  </div>
                  <div className="space-y-mx-xs">
                    <Typography variant="tiny" tone="muted">STATUS</Typography>
                    <Badge variant={client.status === 'ativo' ? 'success' : 'warning'}>{client.status.toUpperCase()}</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-mx-lg border-none shadow-mx-md bg-white">
                <Typography variant="h3" className="mb-mx-md uppercase">Equipe MX</Typography>
                <div className="space-y-mx-sm">
                  {activeAssignments.map((assignment) => (
                    <div key={assignment.id} className="p-mx-md rounded-mx-lg bg-surface-alt border border-border-default">
                      <div className="flex items-center justify-between">
                        <Typography variant="p" className="font-bold">{assignment.user?.name}</Typography>
                        <Badge variant="outline">{assignment.assignment_role.toUpperCase()}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </>
        )

      case 'visits':
        return (
          <section className="space-y-mx-lg">
            <div className="flex items-center justify-between">
              <Typography variant="h3" className="font-black italic uppercase">Agenda e Cronograma</Typography>
              <Button onClick={handleOpenSchedule} className="bg-brand-secondary h-12 px-8 font-black">
                <Plus size={18} className="mr-2" />
                AGENDAR VISITA
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-mx-lg">
              {visitSteps.map((step) => {
                const visit = client.visits?.find((v) => v.visit_number === step.visit_number)
                return (
                  <Card key={step.visit_number} className={cn("p-mx-lg border-none shadow-mx-md bg-white flex flex-col justify-between transition-all", visit?.status === 'concluída' ? "opacity-80" : "hover:shadow-mx-lg hover:-translate-y-1")}>
                    <div className="space-y-mx-sm">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-black">ETAPA {step.visit_number}</Badge>
                        {visit && <Badge variant={visit.status === 'concluída' ? 'success' : 'warning'}>{visit.status.toUpperCase()}</Badge>}
                      </div>
                      <Typography variant="h4" className="font-bold min-h-mx-12">{step.objective}</Typography>
                      {visit ? (
                        <div className="pt-2 text-text-tertiary">
                          <Typography variant="tiny" className="flex items-center gap-1 font-bold"><Calendar size={12} /> {new Date(visit.scheduled_at).toLocaleDateString('pt-BR')}</Typography>
                          <Typography variant="tiny" className="flex items-center gap-1 font-bold"><Clock size={12} /> {visit.duration_hours}H • {visit.modality}</Typography>
                        </div>
                      ) : <Typography variant="tiny" tone="muted">Pendente de agendamento</Typography>}
                    </div>
                    <div className="pt-mx-lg space-y-mx-xs">
                      <Button asChild className="w-full font-black" variant={visit?.status === 'concluída' ? 'outline' : 'secondary'}>
                        <Link to={`/consultoria/clientes/${clientSlug}/visitas/${step.visit_number}`}>
                          {visit?.status === 'concluída' ? 'VER RELATÓRIO' : 'EXECUTAR AGORA'}
                          <ChevronRight size={16} className="ml-2" />
                        </Link>
                      </Button>
                      {!visit && (
                        <Button className="w-full text-mx-micro" variant="ghost" onClick={handleOpenSchedule}>
                          AGENDAR VISITA
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
            
            <Card className="p-mx-lg border-none shadow-mx-md bg-white">
              <Typography variant="h3" className="mb-4 font-black">CALENDÁRIO GOOGLE</Typography>
              <GoogleCalendarView clientId={clientId!} />
            </Card>
          </section>
        )

      case 'strategic': return <ConsultingStrategicView clientId={clientId!} />
      case 'action': return <ConsultingActionPlanView clientId={clientId!} />
      case 'financial': return <DREView clientId={clientId!} />
      case 'daily': return <ConsultingDailyTrackingView clientId={clientId!} />

      default: return null
    }
  }

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="space-y-mx-sm">
          <Button asChild variant="ghost" size="sm" className="pl-0 text-brand-secondary hover:text-brand-primary">
            <Link to="/consultoria/clientes"><ArrowLeft size={16} className="mr-2" />VOLTAR</Link>
          </Button>
          <div className="flex items-center gap-mx-sm">
            <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" />
            <Typography variant="h1" className="font-black italic">{client.name.toUpperCase()}</Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md uppercase font-bold tracking-widest text-text-tertiary">
            {client.product_name || 'PMR'} • {client.status.toUpperCase()}
          </Typography>
        </div>

        <nav className="flex items-center gap-mx-tiny bg-white p-1.5 rounded-2xl border border-border-default shadow-mx-sm overflow-x-auto no-scrollbar">
          {visibleTabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange(tab)}
              className="rounded-mx-full px-6 h-mx-lg uppercase font-black whitespace-nowrap text-xs"
            >
              {tabLabels[tab]}
            </Button>
          ))}
        </nav>
      </header>

      {renderTabContent()}

      <Modal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Agendar Nova Visita" size="xl">
        <form onSubmit={handleSubmitSchedule} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1"><Typography variant="tiny" className="font-black">DATA</Typography><DatePicker value={scheduleForm.scheduled_at} onChange={e => setScheduleForm(p => ({ ...p, scheduled_at: e.target.value }))} /></div>
            <div className="space-y-1"><Typography variant="tiny" className="font-black">HORA</Typography><Input type="time" value={scheduleForm.scheduled_time} onChange={e => setScheduleForm(p => ({ ...p, scheduled_time: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1"><Typography variant="tiny" className="font-black">DURAÇÃO (H)</Typography><Input type="number" value={scheduleForm.duration_hours} onChange={e => setScheduleForm(p => ({ ...p, duration_hours: e.target.value }))} /></div>
            <div className="space-y-1"><Typography variant="tiny" className="font-black">MODALIDADE</Typography><Select value={scheduleForm.modality} onChange={e => setScheduleForm(p => ({ ...p, modality: e.target.value }))}><option value="Presencial">Presencial</option><option value="Online">Online</option></Select></div>
          </div>
          <div className="space-y-1"><Typography variant="tiny" className="font-black">OBJETIVO</Typography><Textarea value={scheduleForm.objective} onChange={e => setScheduleForm(p => ({ ...p, objective: e.target.value }))} className="min-h-mx-24" /></div>
          <div className="flex justify-end pt-4"><Button type="submit" disabled={submittingVisit} className="bg-brand-secondary h-14 px-12 font-black">CONFIRMAR AGENDAMENTO</Button></div>
        </form>
      </Modal>
    </main>
  )
}
