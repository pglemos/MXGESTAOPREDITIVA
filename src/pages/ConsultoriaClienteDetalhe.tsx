import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, BriefcaseBusiness, Building2, Mail, Phone, User2, 
  Calendar, CheckCircle2, Clock, ChevronRight,
  Plus, FileText, CalendarDays, TrendingUp, Download, ShieldCheck
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { 
  ConsultingClientDetail, 
  ConsultingVisit, 
  ConsultingAssignableUser 
} from '@/features/consultoria/types'
import { useConsultingClientDetailBySlug } from '@/hooks/useConsultingClientBySlug'
import { useConsultingModules } from '@/hooks/useConsultingModules'
import { useConsultingMethodology } from '@/hooks/useConsultingClients'
import { usePDIs } from '@/hooks/useData'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Button } from '@/components/atoms/Button'
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
import { Modal } from '@/components/organisms/Modal'
import { Select } from '@/components/atoms/Select'

type Tab = 'overview' | 'visits' | 'strategic' | 'action' | 'financial' | 'daily' | 'monthly' | 'roi' | 'pdis'

const tabLabels: Record<Tab, string> = {
  overview: 'Visão Geral',
  visits: 'Agenda/Visitas',
  strategic: 'Estratégico',
  action: 'Plano de Ação',
  financial: 'DRE/Financeiro',
  daily: 'Acomp. Diário',
  monthly: 'Fechamento',
  roi: 'ROI/Choque',
  pdis: 'Plano de Carreira (PDI)',
}

function ConsultingROIView({ client }: { client: ConsultingClientDetail }) {
  const initialData = client.visits?.find((v: any) => v.visit_number === 1)?.quant_data as any
  const financials = [...(client.financials || [])].sort((a, b) => new Date(a.reference_date).getTime() - new Date(b.reference_date).getTime())
  const currentData = financials.length > 0 ? financials[financials.length - 1] : null
  
  const handleDownloadROI = async () => {
    const html2pdf = (await import('html2pdf.js')).default
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
    await html2pdf().set(opt).from(element).save()
    toast.success('Relatório de ROI gerado!')
  }

  const chartData = financials.map(f => {
    const inv = (client.inventory_snapshots || []).find((s: any) => s.reference_month === f.reference_date.substring(0, 7))
    return {
      mes: format(new Date(f.reference_date), 'MMM', { locale: ptBR }).toUpperCase(),
      vendas: f.volume_vendas || 0,
      conversao: (f.volume_leads || 0) > 0 ? ((f.volume_vendas || 0) / (f.volume_leads || 1)) * 100 : 0,
      margem: f.revenue > 0 ? (f.net_profit / f.revenue) * 100 : 0,
      estoque: inv?.percent_over_90_days || 0
    }
  })

  const before = {
    sales: (initialData?.sales?.reduce((acc: number, c: any) => acc + (c.value || 0), 0) / 3) || 0,
    leads: initialData?.marketing?.leads || 0,
    conversion: (initialData?.marketing?.leads || 0) > 0 ? ((initialData?.sales?.reduce((acc: number, c: any) => acc + (c.value || 0), 0) / 3) / (initialData?.marketing?.leads || 1)) * 100 : 0
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
          <div className="absolute top-0 right-0 p-mx-lg opacity-10"><TrendingUp size={200} strokeWidth={1} /></div>
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
              <div className="h-mx-chart w-full">
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
        const canSellerSign = profile?.id === pdi.seller_id && !(pdi as any).seller_acknowledged_at
        const canManagerSign = (role === 'admin' || role === 'gerente') && !(pdi as any).manager_acknowledged_at
        
        return (
          <Card key={pdi.id} className="p-mx-lg bg-white border border-border-default shadow-mx-md hover:border-brand-primary/30 transition-all group rounded-mx-2xl">
            <div className="flex justify-between items-start mb-mx-md">
              <div>
                <Typography variant="h3" className="text-lg group-hover:text-brand-primary transition-colors">{(pdi as any).seller_name || 'Vendedor'}</Typography>
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
                 {(pdi as any).seller_acknowledged_at ? (
                   <div className="flex items-center gap-mx-xs text-status-success">
                     <ShieldCheck className="w-mx-4 h-mx-4" />
                     <Typography variant="tiny" className="font-black uppercase tracking-widest text-[8px]">Vendedor OK</Typography>
                   </div>
                 ) : canSellerSign ? (
                   <Button variant="primary" size="sm" className="w-full font-black text-[9px]" onClick={() => acknowledge(pdi.id, 'seller')}>ASSINAR VENDEDOR</Button>
                 ) : (
                   <Typography variant="tiny" className="uppercase font-bold text-[8px] opacity-30">Pendente Vendedor</Typography>
                 )}
               </div>

               <div className="space-y-mx-xs">
                 {(pdi as any).manager_acknowledged_at ? (
                   <div className="flex items-center gap-mx-xs text-status-success">
                     <ShieldCheck className="w-mx-4 h-mx-4" />
                     <Typography variant="tiny" className="font-black uppercase tracking-widest text-[8px]">Gestor OK</Typography>
                   </div>
                 ) : canManagerSign ? (
                   <Button variant="outline" size="sm" className="w-full font-black text-[9px] border-brand-primary text-brand-primary" onClick={() => acknowledge(pdi.id, 'manager')}>ASSINAR GESTOR</Button>
                 ) : (
                   <Typography variant="tiny" className="uppercase font-bold text-[8px] opacity-30">Pendente Gestor</Typography>
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
  
  const {
    client,
    loading,
    error,
    refetch,
    createUnit,
    createContact,
    upsertAssignment,
    toggleAssignment,
    upsertFinancial,
    deleteFinancial,
  } = useConsultingClientDetailBySlug(clientSlug)
  
  const clientId = client?.id
  const resolvedStoreId = client?.primary_store_id || client?.store_id || ''
  
  const {
    loading: modulesLoading,
    isEnabled: isModuleEnabled,
  } = useConsultingModules(clientId)

  const { steps: methodologySteps } = useConsultingMethodology(client?.program_template_key || 'pmr_7')
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab
    if (tab && tabLabels[tab]) {
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
      case 'overview': return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
             <Card className="p-mx-lg bg-white border border-border-default shadow-mx-md rounded-mx-2xl">
                <Typography variant="h3" className="mb-mx-md uppercase font-black tracking-widest">Dados do Cliente</Typography>
                <div className="space-y-mx-md">
                   <div>
                      <Typography variant="tiny" tone="muted" className="uppercase font-bold tracking-tighter">Produto Comercial</Typography>
                      <Typography variant="p" className="font-black text-brand-primary">{client.product_name || '-'}</Typography>
                   </div>
                   <div>
                      <Typography variant="tiny" tone="muted" className="uppercase font-bold tracking-tighter">Razão Social</Typography>
                      <Typography variant="p" className="font-bold text-black">{client.legal_name || '-'}</Typography>
                   </div>
                </div>
             </Card>
             <Card className="p-mx-lg bg-white border border-border-default shadow-mx-md rounded-mx-2xl">
                <Typography variant="h3" className="mb-mx-md uppercase font-black tracking-widest">Resumo Operacional</Typography>
                <div className="space-y-mx-md">
                   <div className="flex justify-between">
                      <Typography variant="p" className="font-bold">Total de Visitas</Typography>
                      <Typography variant="h3" className="text-brand-primary">{client.visits?.filter(v => v.status === 'concluída').length || 0} / 7</Typography>
                   </div>
                   <div className="flex justify-between">
                      <Typography variant="p" className="font-bold">Ações Pendentes</Typography>
                      <Typography variant="h3" className="text-status-warning">Auditando...</Typography>
                   </div>
                </div>
             </Card>
          </div>
      )
      case 'visits': return (
        <div className="space-y-mx-lg">
          {methodologySteps.map((step) => {
             const v = client.visits?.find(v => v.visit_number === step.visit_number)
             return (
               <Link key={step.id} to={`/consultoria/clientes/${clientSlug}/visitas/${step.visit_number}`} className="block">
                 <Card className="p-mx-lg bg-white border border-border-default shadow-mx-sm hover:border-brand-primary transition-all flex justify-between items-center rounded-mx-2xl">
                    <div className="flex items-center gap-mx-md">
                       <div className="w-mx-12 h-mx-12 rounded-mx-full bg-surface-alt flex items-center justify-center font-black">V{step.visit_number}</div>
                       <div>
                          <Typography variant="h3" className="text-sm font-black uppercase">{step.objective}</Typography>
                          <Typography variant="tiny" tone="muted" className="font-bold">{step.target} • {step.duration}</Typography>
                       </div>
                    </div>
                    <Badge variant={v?.status === 'concluída' ? 'success' : 'outline'}>{v?.status?.toUpperCase() || 'PENDENTE'}</Badge>
                 </Card>
               </Link>
             )
          })}
        </div>
      )
      case 'strategic': return <ConsultingStrategicView clientId={clientId!} />
      case 'action': return <ConsultingActionPlanView clientId={clientId!} />
      case 'financial': return <DREView clientId={clientId!} />
      case 'daily': return <ConsultingDailyTrackingView clientId={clientId!} />
      case 'monthly': return <div className="p-mx-lg text-center opacity-50 py-mx-20"><Typography variant="h3">Módulo de Fechamento Mensal em Breve</Typography></div>
      case 'roi': return <ConsultingROIView client={client} />
      case 'pdis': return <ConsultingPDIsView storeId={resolvedStoreId} />
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

      <nav className="flex gap-mx-xs border-b border-border-subtle mb-mx-md overflow-x-auto no-scrollbar">
         {(['overview', 'visits', 'strategic', 'action', 'financial', 'daily', 'roi', 'pdis'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => handleTabChange(tab)} className={cn("px-mx-md py-mx-sm text-xs font-black uppercase tracking-mx-widest transition-all border-b-2 whitespace-nowrap", activeTab === tab ? "border-brand-primary text-brand-primary bg-brand-primary/5" : "border-transparent text-text-tertiary hover:text-text-primary hover:bg-surface-alt")}>
               {tabLabels[tab]}
            </button>
         ))}
      </nav>

      {renderTabContent()}
    </main>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
