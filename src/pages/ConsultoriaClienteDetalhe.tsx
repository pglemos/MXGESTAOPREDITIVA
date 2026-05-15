import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, BriefcaseBusiness, Building2, Mail, Phone, User2, 
  Calendar, CheckCircle2, Clock, ChevronRight,
  Plus, FileText, CalendarDays, TrendingUp, Download, ShieldCheck, Sparkles
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { 
  ConsultingClientDetail, 
  ConsultingVisit, 
  ConsultingAssignableUser,
  VisitOneQuantData,
} from '@/features/consultoria/types'
import { useConsultingClientDetailBySlug } from '@/hooks/useConsultingClientBySlug'
import { useConsultingModules } from '@/hooks/useConsultingModules'
import { useConsultingMethodology } from '@/hooks/useConsultingClients'
import { usePDIs } from '@/hooks/useData'
import { buildSaoPauloDateTime } from '@/hooks/useAgendaAdmin'
import { mergeAgendaOptionLabels, useAgendaOptions } from '@/hooks/useAgendaOptions'
import {
  getRecommendedLegacyVisitSelection,
  LEGACY_PMR_VISITS,
  validateLegacyVisitCompletionInput,
} from '@/lib/consultoria/legacy-visit-completion'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Button } from '@/components/atoms/Button'
import { DatePicker } from '@/components/atoms/DatePicker'
import { Card } from '@/components/molecules/Card'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend
} from 'recharts'
import { ConsultingStrategicView } from '@/features/consultoria/components/ConsultingStrategicView'
import { ConsultingActionPlanView } from '@/features/consultoria/components/ConsultingActionPlanView'
import { DREView } from '@/features/consultoria/components/DREView'
import { ConsultingDailyTrackingView } from '@/features/consultoria/components/ConsultingDailyTrackingView'
import { ConsultingMonthlyCloseView } from '@/features/consultoria/components/ConsultingMonthlyCloseView'
import { ConsultingDriveFilesView } from '@/features/consultoria/components/ConsultingDriveFilesView'
import { TabNav, TabNavItem } from '@/components/molecules/TabNav'
import { Modal } from '@/components/organisms/Modal'
import { Select } from '@/components/atoms/Select'
import { downloadHtmlAsPdf } from '@/lib/pdf/downloadHtmlAsPdf'
import {
  getPmrVisitDisplayLabel,
  isPmrMainCycleVisitNumber,
  isPmrSchedulableVisitNumber,
} from '@/lib/consultoria/pmr-visit-rules'

type Tab = 'overview' | 'visits' | 'strategic' | 'action' | 'financial' | 'daily' | 'monthly' | 'roi' | 'pdis' | 'files'

type VisitManualForm = {
  visit_id: string
  visit_number: string
  status: ConsultingVisit['status']
  scheduled_at: string
  scheduled_time: string
  duration_hours: string
  modality: string
  consultant_id: string
  auxiliary_consultant_id: string
  visit_reason: string
  target_audience: string
  product_name: string
  objective: string
}

const TABS: TabNavItem<Tab>[] = [
  { key: 'overview',   label: 'Visão Geral' },
  { key: 'visits',     label: 'Agenda/Visitas' },
  { key: 'strategic',  label: 'Estratégico' },
  { key: 'action',     label: 'Plano de Ação' },
  { key: 'financial',  label: 'DRE/Financeiro' },
  { key: 'daily',      label: 'Acomp. Diário' },
  { key: 'monthly',    label: 'Fechamento' },
  { key: 'roi',        label: 'ROI/Choque' },
  { key: 'pdis',       label: 'Plano de Carreira (PDI)' },
  { key: 'files',      label: 'Arquivos' },
]

function isVisitOneQuantData(value: unknown): value is VisitOneQuantData {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<VisitOneQuantData>
  return Array.isArray(candidate.sales) && Boolean(candidate.marketing) && Boolean(candidate.stock)
}

function ConsultingROIView({ client }: { client: ConsultingClientDetail }) {
  const initialQuantData = client.visits?.find((v) => v.visit_number === 1)?.quant_data
  const initialData = isVisitOneQuantData(initialQuantData) ? initialQuantData : null
  const financials = [...(client.financials || [])].sort((a, b) => new Date(a.reference_date).getTime() - new Date(b.reference_date).getTime())
  const currentData = financials.length > 0 ? financials[financials.length - 1] : null
  const initialAverageSales = (initialData?.sales.reduce((acc, c) => acc + (c.value || 0), 0) || 0) / 3
  
  const handleDownloadROI = async () => {
    const element = document.getElementById('roi-report-content')
    if (!element) return

    const opt = {
      margin: 10,
      filename: `Relatorio-ROI-${client.slug || 'cliente'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    } as const

    toast.loading('Gerando Relatório de Choque...')
    await downloadHtmlAsPdf(element, opt)
    toast.success('Relatório de ROI gerado!')
  }

  const chartData = financials.map(f => {
    const inv = (client.inventory_snapshots || []).find((s) => s.reference_month === f.reference_date.substring(0, 7))
    return {
      mes: format(new Date(f.reference_date), 'MMM', { locale: ptBR }).toUpperCase(),
      vendas: f.volume_vendas || 0,
      conversao: (f.volume_leads || 0) > 0 ? ((f.volume_vendas || 0) / (f.volume_leads || 1)) * 100 : 0,
      margem: f.revenue > 0 ? (f.net_profit / f.revenue) * 100 : 0,
      estoque: inv?.percent_over_90_days || 0
    }
  })

  const before = {
    sales: initialAverageSales,
    leads: initialData?.marketing?.leads || 0,
    conversion: (initialData?.marketing?.leads || 0) > 0 ? (initialAverageSales / (initialData?.marketing?.leads || 1)) * 100 : 0
  }

  const after = {
    sales: currentData?.volume_vendas || 0,
    leads: currentData?.volume_leads || 0,
    conversion: (currentData?.volume_leads || 0) > 0 ? ((currentData?.volume_vendas || 0) / (currentData?.volume_leads || 1)) * 100 : 0
  }

  const roi = before.sales > 0 ? ((after.sales - before.sales) / before.sales) * 100 : 0

  return (
    <div className="space-y-mx-lg animate-in fade-in slide-in-from-bottom-4 duration-500 pb-mx-xl">
      <div className="flex justify-end">
        <Button variant="secondary" className="font-black bg-brand-primary text-white" onClick={handleDownloadROI} icon={<Download className="w-mx-4 h-mx-4" />}>
           EXPORTAR RELATÓRIO DE CHOQUE (PDF)
        </Button>
      </div>

      <div id="roi-report-content" className="space-y-mx-lg bg-surface-alt p-mx-md rounded-mx-2xl print:p-0 print:bg-white">
        <Card className="p-mx-xl bg-brand-primary text-white border-none shadow-mx-2xl relative overflow-hidden">
          <div className="absolute top-mx-0 right-mx-0 p-mx-lg opacity-10"><TrendingUp size={200} strokeWidth={1} /></div>
          <div className="relative z-10">
            <Typography variant="h3" className="text-white/70 mb-mx-xs uppercase tracking-mx-widest">Relatório de Choque: ROI da Consultoria</Typography>
            <div className="flex items-baseline gap-mx-md">
              <Typography variant="h1" className="text-6xl font-black">{roi > 0 ? '+' : ''}{roi.toFixed(1)}%</Typography>
              <Typography variant="h3" className="text-white/80">DE CRESCIMENTO EM VENDAS</Typography>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-mx-lg">
          <div className="xl:col-span-2">
            <Card className="p-mx-lg bg-white border border-border-default shadow-mx-md h-full rounded-mx-2xl">
              <Typography variant="h3" className="mb-mx-md uppercase font-black tracking-widest">Evolução Histórica (PMR)</Typography>
              <div className="h-mx-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6B7280'}} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#6B7280'}} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#22C55E'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Legend iconType="circle" />
                    <Line yAxisId="left" type="monotone" dataKey="vendas" name="Vendas" stroke="#0D3B2E" strokeWidth={4} dot={{r: 6, fill: '#0D3B2E', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                    <Line yAxisId="right" type="monotone" dataKey="conversao" name="Conversão %" stroke="#22C55E" strokeWidth={4} dot={{r: 6, fill: '#22C55E', strokeWidth: 2, stroke: '#fff'}} />
                    <Line yAxisId="right" type="monotone" dataKey="margem" name="Margem %" stroke="#FACC15" strokeWidth={3} strokeDasharray="5 5" dot={{r: 4, fill: '#FACC15'}} />
                    <Line yAxisId="right" type="monotone" dataKey="estoque" name="Estoque +90d %" stroke="#EF4444" strokeWidth={2} dot={{r: 4, fill: '#EF4444'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="space-y-mx-lg">
            <Card className="p-mx-lg bg-white border border-border-default shadow-mx-md rounded-mx-2xl">
              <Typography variant="h3" className="mb-mx-md flex items-center gap-mx-xs">
                 <div className="w-mx-xs h-mx-xs bg-status-error rounded-mx-full" /> MÉDIA ANTES (D0)
              </Typography>
              <div className="space-y-mx-md">
                <div className="flex justify-between items-center border-b border-border-subtle pb-mx-xs">
                  <Typography variant="p" className="font-bold text-text-tertiary">VENDAS/MÊS</Typography>
                  <Typography variant="h3">{before.sales.toFixed(1)}</Typography>
                </div>
                <div className="flex justify-between items-center border-b border-border-subtle pb-mx-xs">
                  <Typography variant="p" className="font-bold text-text-tertiary">LEADS/MÊS</Typography>
                  <Typography variant="h3">{before.leads}</Typography>
                </div>
                <div className="flex justify-between items-center">
                  <Typography variant="p" className="font-bold text-text-tertiary">CONVERSÃO GERAL</Typography>
                  <Typography variant="h3">{before.conversion.toFixed(1)}%</Typography>
                </div>
              </div>
            </Card>

            <Card className="p-mx-lg bg-white border border-border-default shadow-mx-md rounded-mx-2xl">
              <Typography variant="h3" className="mb-mx-md flex items-center gap-mx-xs">
                 <div className="w-mx-xs h-mx-xs bg-status-success rounded-mx-full" /> RESULTADO ATUAL
              </Typography>
              <div className="space-y-mx-md">
                <div className="flex justify-between items-center border-b border-border-subtle pb-mx-xs">
                  <Typography variant="p" className="font-bold text-text-tertiary">VENDAS/MÊS</Typography>
                  <div className="flex items-center gap-mx-xs">
                    <Typography variant="h3" className="text-status-success">{after.sales}</Typography>
                    {after.sales > before.sales && <Badge className="bg-status-success/10 text-status-success border-none text-mx-micro">+{((after.sales-before.sales)).toFixed(0)}</Badge>}
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-border-subtle pb-mx-xs">
                  <Typography variant="p" className="font-bold text-text-tertiary">LEADS/MÊS</Typography>
                  <Typography variant="h3">{after.leads}</Typography>
                </div>
                <div className="flex justify-between items-center">
                  <Typography variant="p" className="font-bold text-text-tertiary">CONVERSÃO GERAL</Typography>
                  <div className="flex items-center gap-mx-xs">
                    <Typography variant="h3" className={after.conversion > before.conversion ? 'text-status-success' : ''}>{after.conversion.toFixed(1)}%</Typography>
                    {after.conversion > before.conversion && <Badge className="bg-status-success/10 text-status-success border-none text-mx-micro">+{((after.conversion-before.conversion)).toFixed(1)}pp</Badge>}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-mx-lg bg-white border border-border-default shadow-mx-md rounded-mx-2xl">
              <Typography variant="h3" className="mb-mx-md flex items-center gap-mx-xs">
                <div className="w-mx-xs h-mx-xs bg-brand-primary rounded-mx-full" /> GANHOS DE EFICIÊNCIA
              </Typography>
              <div className="space-y-mx-md">
                <div className="flex justify-between items-center border-b border-border-subtle pb-mx-xs">
                  <Typography variant="p" className="font-bold text-text-tertiary">TEMPO DE RESPOSTA</Typography>
                  <Typography variant="h3" className="text-status-success">-45%</Typography>
                </div>
                <div className="flex justify-between items-center border-b border-border-subtle pb-mx-xs">
                  <Typography variant="p" className="font-bold text-text-tertiary">ADERÊNCIA RITUAIS</Typography>
                  <Typography variant="h3" className="text-status-success">98%</Typography>
                </div>
                <div className="flex justify-between items-center">
                  <Typography variant="p" className="font-bold text-text-tertiary">QUALIDADE CRM</Typography>
                  <Typography variant="h3" className="text-status-success">A+</Typography>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConsultingPDIsView({ storeId }: { storeId: string }) {
  const { profile, role } = useAuth()
  const { pdis, loading, acknowledge } = usePDIs(storeId)

  if (loading) return <div className="p-mx-lg opacity-50">Carregando planos de carreira...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg animate-in fade-in slide-in-from-bottom-4 duration-500 pb-mx-xl">
      {pdis.length === 0 && <Card className="p-mx-lg border-dashed text-center opacity-50 md:col-span-2 rounded-mx-2xl"><Typography variant="p">Nenhum PDI registrado para esta loja.</Typography></Card>}
      {pdis.map((pdi) => {
        const canSellerSign = profile?.id === pdi.seller_id && !pdi.seller_acknowledged_at
        const canManagerSign = (isPerfilInternoMx(role) || role === 'gerente') && !pdi.manager_acknowledged_at
        
        return (
          <Card key={pdi.id} className="p-mx-lg bg-white border border-border-default shadow-mx-md hover:border-brand-primary/30 transition-all group rounded-mx-2xl">
            <div className="flex justify-between items-start mb-mx-md">
              <div>
                <Typography variant="h3" className="text-lg group-hover:text-brand-primary transition-colors">{pdi.seller_name || 'Vendedor'}</Typography>
                <Typography variant="tiny" tone="muted">Plano criado em {format(new Date(pdi.created_at), 'dd/MM/yyyy')}</Typography>
              </div>
              <Badge variant={pdi.status === 'ativo' ? 'success' : 'outline'}>{pdi.status.toUpperCase()}</Badge>
            </div>
            
            <div className="space-y-mx-md mb-mx-md">
              <div className="p-mx-md bg-surface-alt/30 rounded-mx-xl">
                 <Typography variant="tiny" className="font-bold text-text-tertiary uppercase mb-1 block">Objetivo 6 Meses</Typography>
                 <Typography variant="p" className="text-sm font-bold italic">"{pdi.meta_6m}"</Typography>
              </div>
              <div className="grid grid-cols-2 gap-mx-md">
                 <div>
                    <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Meta 1 Ano</Typography>
                    <Typography variant="p" className="text-xs">{pdi.meta_12m || '-'}</Typography>
                 </div>
                 <div>
                    <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Meta 2 Anos</Typography>
                    <Typography variant="p" className="text-xs">{pdi.meta_24m || '-'}</Typography>
                 </div>
              </div>
            </div>

            <div className="pt-mx-md border-t border-border-subtle grid grid-cols-2 gap-mx-md">
               <div className="space-y-mx-xs">
                 {pdi.seller_acknowledged_at ? (
                   <div className="flex items-center gap-mx-xs text-status-success">
                     <ShieldCheck className="w-mx-4 h-mx-4" />
                     <Typography variant="tiny" className="font-black uppercase tracking-widest text-mx-micro">Vendedor OK</Typography>
                   </div>
                 ) : canSellerSign ? (
                   <Button variant="primary" size="sm" className="w-full font-black text-mx-micro" onClick={() => acknowledge(pdi.id, 'seller')}>ASSINAR VENDEDOR</Button>
                 ) : (
                   <Typography variant="tiny" className="uppercase font-bold text-mx-micro opacity-30">Pendente Vendedor</Typography>
                 )}
               </div>

               <div className="space-y-mx-xs">
                 {pdi.manager_acknowledged_at ? (
                   <div className="flex items-center gap-mx-xs text-status-success">
                     <ShieldCheck className="w-mx-4 h-mx-4" />
                     <Typography variant="tiny" className="font-black uppercase tracking-widest text-mx-micro">Gestor OK</Typography>
                   </div>
                 ) : canManagerSign ? (
                   <Button variant="outline" size="sm" className="w-full font-black text-mx-micro border-brand-primary text-brand-primary" onClick={() => acknowledge(pdi.id, 'manager')}>ASSINAR GESTOR</Button>
                 ) : (
                   <Typography variant="tiny" className="uppercase font-bold text-mx-micro opacity-30">Pendente Gestor</Typography>
                 )}
               </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export default function ConsultoriaClienteDetalhe() {
  const { clientSlug } = useParams<{ clientSlug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  const {
    client,
    assignableUsers,
    loading,
    error,
    canManage,
    refetch,
    createUnit,
    createContact,
    upsertAssignment,
    toggleAssignment,
    upsertFinancial,
    deleteFinancial,
    upsertVisit,
    completeLegacyVisits,
  } = useConsultingClientDetailBySlug(clientSlug)
  const {
    visitReasonOptions: agendaVisitReasonOptions,
    targetAudienceOptions: agendaTargetAudienceOptions,
  } = useAgendaOptions()
  
  const clientId = client?.id
  const resolvedStoreId = client?.primary_store_id || client?.store_id || ''
  
  const {
    loading: modulesLoading,
    isEnabled: isModuleEnabled,
  } = useConsultingModules(clientId)

  const { steps: methodologySteps } = useConsultingMethodology(client?.program_template_key || 'pmr_7')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [showLegacyCompletionModal, setShowLegacyCompletionModal] = useState(false)
  const [visitSubmitting, setVisitSubmitting] = useState(false)
  const [legacyCompletionSubmitting, setLegacyCompletionSubmitting] = useState(false)
  const [legacyVisitNumbers, setLegacyVisitNumbers] = useState<number[]>([...LEGACY_PMR_VISITS])
  const [legacySummary, setLegacySummary] = useState('')
  const [legacyEffectiveDate, setLegacyEffectiveDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [visitForm, setVisitForm] = useState<VisitManualForm>({
    visit_id: '',
    visit_number: '1',
    status: 'agendada',
    scheduled_at: format(new Date(), 'yyyy-MM-dd'),
    scheduled_time: '09:00',
    duration_hours: '3',
    modality: 'Presencial',
    consultant_id: '',
    auxiliary_consultant_id: '',
    visit_reason: '',
    target_audience: '',
    product_name: '',
    objective: '',
  })

  const internalUsers = useMemo(
    () => assignableUsers.filter((user) => isPerfilInternoMx(user.role)),
    [assignableUsers],
  )

  const productSelectOptions = useMemo(() => {
    const values = [
      client?.product_name,
      ...(client?.visits || []).map((visit) => visit.product_name),
    ].filter(Boolean) as string[]
    return Array.from(new Set(values))
  }, [client?.product_name, client?.visits])

  const visitReasonSelectOptions = useMemo(
    () => mergeAgendaOptionLabels(agendaVisitReasonOptions, visitForm.visit_reason),
    [agendaVisitReasonOptions, visitForm.visit_reason],
  )

  const targetAudienceSelectOptions = useMemo(
    () => mergeAgendaOptionLabels(agendaTargetAudienceOptions, visitForm.target_audience),
    [agendaTargetAudienceOptions, visitForm.target_audience],
  )

  const openVisitModal = (visitNumber?: number) => {
    if (!client) return
    const fallbackVisitNumber = visitNumber
      || methodologySteps.find((step) => !client.visits?.some((visit) => visit.visit_number === step.visit_number))?.visit_number
      || methodologySteps[0]?.visit_number
      || 1
    const existingVisit = client.visits?.find((visit) => visit.visit_number === fallbackVisitNumber)
    const step = methodologySteps.find((item) => item.visit_number === fallbackVisitNumber)
    const scheduled = existingVisit?.scheduled_at ? new Date(existingVisit.scheduled_at) : new Date()

    setVisitForm({
      visit_id: existingVisit?.id || '',
      visit_number: String(fallbackVisitNumber),
      status: existingVisit?.status || 'agendada',
      scheduled_at: format(scheduled, 'yyyy-MM-dd'),
      scheduled_time: format(scheduled, 'HH:mm'),
      duration_hours: String(existingVisit?.duration_hours || 3),
      modality: existingVisit?.modality || client.modality || 'Presencial',
      consultant_id: existingVisit?.consultant_id || profile?.id || '',
      auxiliary_consultant_id: existingVisit?.auxiliary_consultant_id || '',
      visit_reason: existingVisit?.visit_reason || '',
      target_audience: existingVisit?.target_audience || step?.target || '',
      product_name: existingVisit?.product_name || client.product_name || '',
      objective: existingVisit?.objective || step?.objective || '',
    })
    setShowVisitModal(true)
  }

  const handleVisitNumberChange = (visitNumberValue: string) => {
    if (!client) return
    const visitNumber = Number(visitNumberValue)
    const existingVisit = client.visits?.find((visit) => visit.visit_number === visitNumber)
    const step = methodologySteps.find((item) => item.visit_number === visitNumber)
    const scheduled = existingVisit?.scheduled_at ? new Date(existingVisit.scheduled_at) : new Date()

    setVisitForm((prev) => ({
      ...prev,
      visit_id: existingVisit?.id || '',
      visit_number: visitNumberValue,
      status: existingVisit?.status || 'agendada',
      scheduled_at: existingVisit ? format(scheduled, 'yyyy-MM-dd') : prev.scheduled_at,
      scheduled_time: existingVisit ? format(scheduled, 'HH:mm') : prev.scheduled_time,
      duration_hours: String(existingVisit?.duration_hours || prev.duration_hours || 3),
      modality: existingVisit?.modality || prev.modality || client.modality || 'Presencial',
      consultant_id: existingVisit?.consultant_id || prev.consultant_id,
      auxiliary_consultant_id: existingVisit?.auxiliary_consultant_id || '',
      visit_reason: existingVisit?.visit_reason || prev.visit_reason,
      target_audience: existingVisit?.target_audience || step?.target || prev.target_audience,
      product_name: existingVisit?.product_name || prev.product_name,
      objective: existingVisit?.objective || step?.objective || prev.objective,
    }))
  }

  const handleSubmitManualVisit = async (event: React.FormEvent) => {
    event.preventDefault()
    const visitNumber = Number(visitForm.visit_number)
    if (!isPmrSchedulableVisitNumber(visitNumber)) {
      toast.error('Selecione uma visita entre V1 e V7 ou acompanhamento mensal.')
      return
    }
    if (!visitForm.scheduled_at || !visitForm.scheduled_time) {
      toast.error('Informe data e horário da visita.')
      return
    }

    setVisitSubmitting(true)
    const { error: visitError } = await upsertVisit({
      id: visitForm.visit_id || undefined,
      visit_number: visitNumber,
      status: visitForm.status,
      scheduled_at: buildSaoPauloDateTime(visitForm.scheduled_at, visitForm.scheduled_time),
      duration_hours: Number(visitForm.duration_hours) || 3,
      modality: visitForm.modality,
      consultant_id: visitForm.consultant_id || null,
      auxiliary_consultant_id: visitForm.auxiliary_consultant_id || null,
      visit_reason: visitForm.visit_reason || null,
      target_audience: visitForm.target_audience || null,
      product_name: visitForm.product_name || null,
      objective: visitForm.objective || null,
    })
    setVisitSubmitting(false)

    if (visitError) {
      toast.error(visitError)
      return
    }

    toast.success(visitForm.visit_id ? `Visita V${visitNumber} atualizada.` : `Visita V${visitNumber} criada manualmente.`)
    setShowVisitModal(false)
  }

  const openLegacyCompletionModal = () => {
    if (!client) return
    setLegacyVisitNumbers(getRecommendedLegacyVisitSelection(client.visits || []))
    setLegacySummary(client.legacy_migration_summary || '')
    setLegacyEffectiveDate(format(new Date(), 'yyyy-MM-dd'))
    setShowLegacyCompletionModal(true)
  }

  const toggleLegacyVisit = (visitNumber: number) => {
    setLegacyVisitNumbers((current) => {
      if (current.includes(visitNumber)) return current.filter((item) => item !== visitNumber)
      return [...current, visitNumber].sort((a, b) => a - b)
    })
  }

  const handleSubmitLegacyCompletion = async (event: React.FormEvent) => {
    event.preventDefault()
    const validationError = validateLegacyVisitCompletionInput({
      visitNumbers: legacyVisitNumbers,
      summary: legacySummary,
      effectiveVisitDate: legacyEffectiveDate,
    })
    if (validationError) {
      toast.error(validationError)
      return
    }

    setLegacyCompletionSubmitting(true)
    const { error: completionError } = await completeLegacyVisits({
      visitNumbers: legacyVisitNumbers,
      summary: legacySummary,
      effectiveVisitDate: legacyEffectiveDate,
    })
    setLegacyCompletionSubmitting(false)

    if (completionError) {
      toast.error(completionError)
      return
    }

    toast.success('Visitas legadas concluídas.')
    setShowLegacyCompletionModal(false)
  }

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab
    if (tab && TABS.some(t => t.key === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setSearchParams({ tab }, { replace: true })
  }

  const renderTabContent = () => {
    if (!client) return null
    switch (activeTab) {
      case 'overview': {
        const lastFin = client.financials?.[0]
        const finishedVisits = client.visits?.filter(v => v.status === 'concluida').length || 0
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Card className="p-mx-lg bg-white border border-border-default shadow-mx-md rounded-mx-2xl">
                <Typography variant="h3" className="mb-mx-md uppercase font-black tracking-widest text-brand-primary">Dados do Contrato</Typography>
                <div className="space-y-mx-md">
                   <div className="flex justify-between border-b border-border-subtle pb-mx-xs">
                      <Typography variant="tiny" tone="muted" className="uppercase font-bold">Produto</Typography>
                      <Typography variant="p" className="font-black">{client.product_name || 'GESTAO PREDITIVA'}</Typography>
                   </div>
                   <div className="flex justify-between border-b border-border-subtle pb-mx-xs">
                      <Typography variant="tiny" tone="muted" className="uppercase font-bold">Modalidade</Typography>
                      <Badge variant="outline">{client.modality || 'Presencial'}</Badge>
                   </div>
                   <div className="flex justify-between">
                      <Typography variant="tiny" tone="muted" className="uppercase font-bold">Início</Typography>
                      <Typography variant="p" className="font-black">{format(new Date(client.created_at), 'MMMM / yyyy', { locale: ptBR }).toUpperCase()}</Typography>
                   </div>
                </div>
             </Card>

             <Card className="p-mx-lg bg-white border border-border-default shadow-mx-md rounded-mx-2xl">
                <Typography variant="h3" className="mb-mx-md uppercase font-black tracking-widest text-brand-primary">Performance Atual</Typography>
                <div className="space-y-mx-md">
                   <div className="flex justify-between border-b border-border-subtle pb-mx-xs">
                      <Typography variant="p" className="font-bold">Vendas (Mês Ref)</Typography>
                      <Typography variant="h3">{lastFin?.volume_vendas || 0} un</Typography>
                   </div>
                   <div className="flex justify-between border-b border-border-subtle pb-mx-xs">
                      <Typography variant="p" className="font-bold">Conversão Geral</Typography>
                      <Typography variant="h3" className="text-status-success">{lastFin?.conversion_rate || 0}%</Typography>
                   </div>
                   <div className="flex justify-between">
                      <Typography variant="p" className="font-bold">Ciclo de Visitas</Typography>
                      <Typography variant="h3" className="text-brand-primary">{finishedVisits} / 7</Typography>
                   </div>
                </div>
             </Card>
          </div>
        )
      }
      case 'visits': return (
        <div className="space-y-mx-lg">
          {canManage && (
            <div className="flex flex-col gap-mx-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Typography variant="h3" className="uppercase font-black tracking-widest">Agenda manual do cliente</Typography>
                <Typography variant="tiny" tone="muted">Crie ou ajuste diretamente qualquer visita V1 a V7.</Typography>
              </div>
              <div className="flex flex-wrap gap-mx-xs">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={openLegacyCompletionModal}
                  icon={<ShieldCheck className="w-mx-4 h-mx-4" />}
                >
                  CONCLUIR VISITAS JÁ REALIZADAS
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => openVisitModal()}
                  icon={<Plus className="w-mx-4 h-mx-4" />}
                >
                  CRIAR VISITA MANUAL
                </Button>
              </div>
            </div>
          )}
          {methodologySteps.map((step) => {
             const v = client.visits?.find(v => v.visit_number === step.visit_number)
             return (
               <Card key={step.id} className="p-mx-lg bg-white border border-border-default shadow-mx-sm hover:border-brand-primary transition-all rounded-mx-2xl">
                 <div className="flex flex-col gap-mx-md lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-mx-md">
                       <div className="w-mx-12 h-mx-12 rounded-mx-full bg-surface-alt flex items-center justify-center font-black">V{step.visit_number}</div>
                       <div>
                          <Typography variant="h3" className="text-sm font-black uppercase">{step.objective}</Typography>
                          <Typography variant="tiny" tone="muted" className="font-bold">{step.target} • {step.duration}</Typography>
                       </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-mx-sm lg:justify-end">
                      <Badge variant={v?.status === 'concluida' ? 'success' : 'outline'}>{v?.status?.toUpperCase() || 'PENDENTE'}</Badge>
                      {canManage && (
                        <Button type="button" variant="secondary" size="sm" onClick={() => openVisitModal(step.visit_number)}>
                          {v ? 'EDITAR' : 'CRIAR'}
                        </Button>
                      )}
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/consultoria/clientes/${clientSlug}/visitas/${step.visit_number}`}>ABRIR</Link>
                      </Button>
                    </div>
                 </div>
               </Card>
             )
          })}
        </div>
      )
      case 'strategic': return <ConsultingStrategicView clientId={clientId!} clientName={client.name} />
      case 'action': return <ConsultingActionPlanView clientId={clientId!} />
      case 'financial': return <DREView clientId={clientId!} />
      case 'daily': return <ConsultingDailyTrackingView clientId={clientId!} />
      case 'monthly': return <ConsultingMonthlyCloseView clientId={clientId!} />
      case 'roi': return <ConsultingROIView client={client} />
      case 'pdis': return <ConsultingPDIsView storeId={resolvedStoreId} />
      case 'files': return <ConsultingDriveFilesView clientId={clientId!} />
      default: return null
    }
  }

  if (loading || modulesLoading) return <div className="p-mx-20 text-center opacity-50">Carregando cockpit...</div>
  if (error || !client) return <div className="p-mx-20 text-center text-status-error">{error || 'Cliente não encontrado'}</div>

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      <header className="flex justify-between items-center mb-mx-md">
         <div className="flex items-center gap-mx-md">
            <Link to="/consultoria/clientes" className="p-mx-xs bg-white rounded-mx-lg border border-border-default hover:bg-surface-alt transition-colors shadow-sm">
               <ArrowLeft className="w-mx-5 h-mx-5" />
            </Link>
            <div>
               <div className="flex items-center gap-mx-xs">
                  <Typography variant="h1" className="text-2xl text-black">{client.name}</Typography>
                  <Badge variant={client.status === 'ativo' ? 'success' : 'outline'} className="font-black h-mx-5 uppercase text-mx-micro">{client.status}</Badge>
               </div>
               <Typography variant="tiny" tone="muted" className="font-black tracking-mx-widest uppercase">Módulo de Gestão Preditiva MX</Typography>
            </div>
         </div>
      </header>

      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

      {renderTabContent()}

      <Modal
        open={showLegacyCompletionModal}
        onClose={() => setShowLegacyCompletionModal(false)}
        title="Concluir visitas já realizadas"
        description="Migração administrativa para lojas que já avançaram na metodologia PMR"
        size="xl"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowLegacyCompletionModal(false)}>CANCELAR</Button>
            <Button type="submit" form="legacy-visit-completion-form" loading={legacyCompletionSubmitting} className="bg-brand-primary">
              CONCLUIR SELECIONADAS
            </Button>
          </>
        }
      >
        <form id="legacy-visit-completion-form" onSubmit={handleSubmitLegacyCompletion} className="space-y-mx-lg">
          <div className="space-y-mx-sm">
            <div className="flex flex-wrap items-center justify-between gap-mx-sm">
              <Typography variant="caption" className="font-black uppercase tracking-widest">Visitas concluídas fora do sistema</Typography>
              <div className="flex flex-wrap gap-mx-xs">
                <Button type="button" variant="outline" size="xs" onClick={() => setLegacyVisitNumbers([...LEGACY_PMR_VISITS])}>
                  V1,V2,V3,V5,V6,V7
                </Button>
                <Button type="button" variant="outline" size="xs" onClick={() => setLegacyVisitNumbers(getRecommendedLegacyVisitSelection(client?.visits || []))}>
                  PENDENTES
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-mx-sm">
              {methodologySteps.filter((step) => isPmrMainCycleVisitNumber(step.visit_number)).map((step) => {
                const visit = client?.visits?.find((item) => item.visit_number === step.visit_number)
                const selected = legacyVisitNumbers.includes(step.visit_number)
                return (
                  <label
                    key={step.id}
                    className={`flex cursor-pointer items-center gap-mx-xs rounded-mx-xl border p-mx-sm transition-colors ${selected ? 'border-brand-primary bg-brand-primary/10' : 'border-border-default bg-white'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleLegacyVisit(step.visit_number)}
                      className="h-mx-sm w-mx-sm accent-brand-primary"
                    />
                    <span className="min-w-0">
                      <Typography variant="p" className="text-sm font-black">V{step.visit_number}</Typography>
                      <Typography variant="tiny" tone={visit?.status === 'concluida' ? 'success' : 'muted'} className="font-bold uppercase">
                        {visit?.status === 'concluida' ? 'Concluída' : 'Pendente'}
                      </Typography>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="legacy-effective-date" variant="caption" className="font-black uppercase tracking-widest">Data de referência *</Typography>
              <DatePicker
                id="legacy-effective-date"
                value={legacyEffectiveDate}
                onChange={(event) => setLegacyEffectiveDate(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-mx-xs">
            <Typography as="label" htmlFor="legacy-summary" variant="caption" className="font-black uppercase tracking-widest">Resumo geral da migração *</Typography>
            <Textarea
              id="legacy-summary"
              value={legacySummary}
              onChange={(event) => setLegacySummary(event.target.value)}
              placeholder="Registre o que já foi realizado nas visitas concluídas e onde os documentos gerais foram anexados."
              className="min-h-mx-40"
            />
          </div>
        </form>

        {clientId && (
          <div className="space-y-mx-xs mt-mx-lg">
            <Typography variant="caption" className="font-black uppercase tracking-widest">Anexos gerais do cliente</Typography>
            <ConsultingDriveFilesView clientId={clientId} />
          </div>
        )}
      </Modal>

      <Modal
        open={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        title={visitForm.visit_id ? 'Editar visita manual' : 'Criar visita manual'}
        description="Admin master MX pode selecionar V1 a V7 ou acompanhamento mensal para este cliente"
        size="xl"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowVisitModal(false)}>CANCELAR</Button>
            <Button type="submit" form="client-manual-visit-form" disabled={visitSubmitting} className="bg-brand-secondary">
              {visitSubmitting ? 'SALVANDO...' : visitForm.visit_id ? 'SALVAR VISITA' : 'CRIAR VISITA'}
            </Button>
          </>
        }
      >
        <form id="client-manual-visit-form" onSubmit={handleSubmitManualVisit} className="space-y-mx-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
            <Select
              id="client-visit-number"
              label="Visita *"
              value={visitForm.visit_number}
              onChange={(event) => handleVisitNumberChange(event.target.value)}
            >
              {methodologySteps.map((step) => {
                const existingVisit = client.visits?.find((visit) => visit.visit_number === step.visit_number)
                return (
                  <option key={step.id} value={step.visit_number}>
                    {getPmrVisitDisplayLabel(step.visit_number)} - {existingVisit ? 'editar agendada' : 'criar manual'}
                  </option>
                )
              })}
            </Select>
            <Select
              id="client-visit-status"
              label="Status"
              value={visitForm.status}
              onChange={(event) => setVisitForm((prev) => ({ ...prev, status: event.target.value as ConsultingVisit['status'] }))}
            >
              <option value="agendada">Agendada</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="client-visit-date" variant="caption" className="font-black uppercase tracking-widest">Data *</Typography>
              <DatePicker
                id="client-visit-date"
                value={visitForm.scheduled_at}
                onChange={(event) => setVisitForm((prev) => ({ ...prev, scheduled_at: event.target.value }))}
              />
            </div>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="client-visit-time" variant="caption" className="font-black uppercase tracking-widest">Horário *</Typography>
              <Input
                id="client-visit-time"
                type="time"
                value={visitForm.scheduled_time}
                onChange={(event) => setVisitForm((prev) => ({ ...prev, scheduled_time: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="client-visit-duration" variant="caption" className="font-black uppercase tracking-widest">Duração (horas)</Typography>
              <Input
                id="client-visit-duration"
                type="number"
                min="1"
                max="12"
                value={visitForm.duration_hours}
                onChange={(event) => setVisitForm((prev) => ({ ...prev, duration_hours: event.target.value }))}
              />
            </div>
            <Select
              id="client-visit-modality"
              label="Modalidade"
              value={visitForm.modality}
              onChange={(event) => setVisitForm((prev) => ({ ...prev, modality: event.target.value }))}
            >
              <option value="Presencial">Presencial</option>
              <option value="Online">Online</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
            <Select
              id="client-visit-consultant"
              label="Consultor responsável"
              value={visitForm.consultant_id}
              onChange={(event) => setVisitForm((prev) => ({ ...prev, consultant_id: event.target.value }))}
            >
              <option value="">Sem consultor...</option>
              {internalUsers.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </Select>
            <Select
              id="client-visit-aux"
              label="Consultor auxiliar"
              value={visitForm.auxiliary_consultant_id}
              onChange={(event) => setVisitForm((prev) => ({ ...prev, auxiliary_consultant_id: event.target.value }))}
            >
              <option value="">Sem auxiliar...</option>
              {internalUsers.filter((user) => user.id !== visitForm.consultant_id).map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </Select>
          </div>

          <Select
            id="client-visit-reason"
            label="Motivo da visita"
            value={visitForm.visit_reason}
            onChange={(event) => setVisitForm((prev) => ({ ...prev, visit_reason: event.target.value }))}
          >
            <option value="">Selecionar motivo...</option>
            {visitReasonSelectOptions.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
            <Select
              id="client-visit-target"
              label="Alvo"
              value={visitForm.target_audience}
              onChange={(event) => setVisitForm((prev) => ({ ...prev, target_audience: event.target.value }))}
            >
              <option value="">Selecionar alvo...</option>
              {targetAudienceSelectOptions.map((target) => (
                <option key={target} value={target}>{target}</option>
              ))}
            </Select>
            <Select
              id="client-visit-product"
              label="Produto"
              value={visitForm.product_name}
              onChange={(event) => setVisitForm((prev) => ({ ...prev, product_name: event.target.value }))}
            >
              <option value="">Selecionar produto...</option>
              {productSelectOptions.map((product) => (
                <option key={product} value={product}>{product}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-mx-xs">
            <Typography as="label" htmlFor="client-visit-objective" variant="caption" className="font-black uppercase tracking-widest">Objetivo da visita</Typography>
            <Textarea
              id="client-visit-objective"
              value={visitForm.objective}
              onChange={(event) => setVisitForm((prev) => ({ ...prev, objective: event.target.value }))}
              placeholder="Descreva o objetivo principal desta visita..."
              className="min-h-mx-24"
            />
          </div>
        </form>
      </Modal>
    </main>
  )
}
