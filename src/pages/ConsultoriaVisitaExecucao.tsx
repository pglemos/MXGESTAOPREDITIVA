import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, CheckCircle2, Circle, Save, FileText, Send,
  AlertCircle, Info, Building2, User2, Calendar,
  Plus, Trash2, Download, Loader2, Paperclip, Image,
  ChevronDown, ChevronUp, ClipboardCheck, LayoutDashboard, Copy, Sparkles,
  BookOpen, ExternalLink, Target, Clock, MessageSquare, BarChart3, Users, Zap,
  TrendingUp, Timer, ShieldAlert, Award, Presentation, Rocket, Star,
  Smartphone, Eye, Printer, Share2, Calculator, PieChart, ShieldCheck,
  BarChart, LineChart, TrendingDown, Layers, MapPin, Gauge
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Textarea } from '@/components/atoms/Textarea'
import { useConsultingClientDetail, useConsultingMethodology } from '@/hooks/useConsultingClients'
import { usePmrDiagnostics } from '@/hooks/usePmrDiagnostics'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/organisms/Modal'

// Modular Components
import { VisitHeaderBase } from '@/features/consultoria/components/VisitHeaderBase'
import { VisitOneHighFidelity } from '@/features/consultoria/components/VisitOneHighFidelity'
import { 
  VisitTwoExecution, VisitThreeExecution, VisitFourExecution, 
  VisitFiveExecution, VisitSixExecution, VisitSevenExecution, 
  VisitEightExecution, VisitNineExecution 
} from '@/features/consultoria/components/VisitExecutionViews'

export default function ConsultoriaVisitaExecucao() {
  const { clientId, visitNumber } = useParams<{ clientId: string, visitNumber: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { client, loading: clientLoading, refetch } = useConsultingClientDetail(clientId)
  const { steps, loading: methodologyLoading } = useConsultingMethodology(client?.program_template_key || 'pmr_7')
  const { templates, responsesByTemplate, saveResponse } = usePmrDiagnostics(clientId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const visitNum = parseInt(visitNumber || '1')
  const step = useMemo(() => steps.find(s => s.visit_number === visitNum), [steps, visitNum])
  const visit = useMemo(() => client?.visits?.find(v => v.visit_number === visitNum), [client, visitNum])

  const [checklist, setChecklist] = useState<Array<{ task: string, completed: boolean }>>([])
  const [executiveSummary, setExecutiveSummary] = useState('')
  const [feedbackClient, setFeedbackClient] = useState('')
  const [attachments, setAttachments] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  const [headerBase, setHeaderBase] = useState({
    meta_mensal: '',
    projecao: '',
    leads_mes: '',
    estoque_disponivel: '',
    consultant_name: '',
    visit_date: new Date().toISOString().split('T')[0],
    tempo: '1 DIA',
    alvo: 'Todos'
  })

  const [quantData, setQuantData] = useState<any>({
    sales: [ { month: 'Jan', value: 26 }, { month: 'Fev', value: 18 }, { month: 'Mar', value: 16 } ],
    marketing: { investment: 15000, leads: 695, origin: [ { name: 'Porta', value: 25 }, { name: 'Internet', value: 3 }, { name: 'Carteira Vnd', value: 25 }, { name: 'Indicação', value: 8 }, { name: 'Carteira Empresa', value: 4 } ] },
    stock: { qty: 73, avg_price: 62000, fipe_delta: 0, mileage: 0, total_inv: 3700000 },
    sellerPerformance: [ { name: 'Leônidas', value: 8 }, { name: 'Phillip', value: 22 }, { name: 'Igor', value: 2 }, { name: 'Henrique', value: 16 }, { name: 'Junior', value: 12 } ]
  })

  useEffect(() => {
    if (visit) {
      setChecklist(visit.checklist_data || [])
      setExecutiveSummary(visit.executive_summary || '')
      setFeedbackClient(visit.feedback_client || '')
      setAttachments(visit.attachments || [])
      setHeaderBase({
        meta_mensal: (visit as any).meta_mensal || '',
        projecao: (visit as any).projecao || '',
        leads_mes: (visit as any).leads_mes || '',
        estoque_disponivel: (visit as any).estoque_disponivel || '',
        consultant_name: (visit as any).consultant_name_manual || user?.name || '',
        visit_date: (visit as any).effective_visit_date || new Date().toISOString().split('T')[0],
        tempo: step?.duration || '1 DIA',
        alvo: step?.target || 'Todos'
      })
      if ((visit as any).quant_data) setQuantData((visit as any).quant_data)
    } else if (step) {
      setChecklist((step.checklist_template || []).map(item => ({ 
        task: typeof item === 'string' ? item : (item as any).task, 
        completed: (item as any).completed || false 
      })))
      setHeaderBase(prev => ({ ...prev, consultant_name: user?.name || '', tempo: step.duration || '1 DIA', alvo: step.target || 'Todos' }))
    }
  }, [visit, step, user])

  const handleToggleCheck = (index: number) => {
    const newList = [...checklist]
    newList[index].completed = !newList[index].completed
    setChecklist(newList)
  }

  const handleSave = async (complete: boolean = false) => {
    if (!clientId || !visitNum) return
    setIsSaving(true)
    try {
      const payload = {
        client_id: clientId,
        visit_number: visitNum,
        checklist_data: checklist,
        executive_summary: executiveSummary,
        feedback_client: feedbackClient,
        status: complete ? 'concluída' : 'em_andamento',
        meta_mensal: headerBase.meta_mensal,
        projecao: headerBase.projecao,
        leads_mes: headerBase.leads_mes,
        estoque_disponivel: headerBase.estoque_disponivel,
        consultant_name_manual: headerBase.consultant_name,
        effective_visit_date: headerBase.visit_date,
        quant_data: quantData
      }
      const { error } = await supabase.from('consulting_visits').upsert(payload, { onConflict: 'client_id,visit_number' })
      if (error) throw error
      toast.success(complete ? 'Etapa Concluída!' : 'Progresso Salvo!'); refetch()
      if (complete) navigate(`/consultoria/clientes/${clientId}`)
    } catch (err: any) { toast.error(err.message) } finally { setIsSaving(false) }
  }

  const generateReportText = () => {
    return `📍 *RELATÓRIO DE VISITA ${visitNum}: ${step?.objective.toUpperCase()}*

--- *CABEÇALHO BASE* ---
*Consultor:* ${headerBase.consultant_name}
*Data:* ${new Date(headerBase.visit_date).toLocaleDateString('pt-BR')}
*Loja:* ${client?.name}
*Meta:* ${headerBase.meta_mensal} | *Projeção:* ${headerBase.projecao}
*Leads:* ${headerBase.leads_mes} | *Estoque:* ${headerBase.estoque_disponivel}

--- *RELATO DA VISITA* ---
${executiveSummary || '(Pendente)'}

--- *FEEDBACK E PRÓXIMOS PASSOS* ---
${feedbackClient || '(Nenhum feedback adicional registrado)'}

_Gerado via MX PERFORMANCE CRM_`
  }

  if (clientLoading || methodologyLoading) return <div className="min-h-screen flex items-center justify-center bg-mx-bg"><Loader2 className="w-10 h-10 animate-spin text-brand-primary" /></div>

  return (
    <main className="min-h-screen bg-mx-bg pb-20 print:bg-white print:pb-0">
      <header className="bg-white border-b border-mx-border sticky top-0 z-30 shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/consultoria/clientes/${clientId}`} className="p-2 hover:bg-mx-bg-secondary rounded-full transition-all"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <Typography variant="h3" className="text-brand-secondary font-black italic tracking-tighter uppercase leading-none">Cockpit Consultoria</Typography>
              <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-widest">Etapa {visitNum} • {step?.objective}</Typography>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => handleSave(false)} loading={isSaving}>SALVAR PROVISÓRIO</Button>
            <Button variant="primary" size="sm" onClick={() => handleSave(true)} loading={isSaving} className="shadow-lg shadow-brand-primary/20">CONCLUIR E REPORTE</Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:p-0">
        <div className="lg:col-span-2 space-y-8">
          <VisitHeaderBase clientName={client?.name || ''} data={headerBase} onChange={setHeaderBase} />
          
          {visitNum === 1 && (
            <VisitOneHighFidelity 
               visitId={visit?.id} templates={templates} responsesByTemplate={responsesByTemplate} 
               onSaveResponse={saveResponse} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)}
               quantData={quantData} onQuantChange={setQuantData}
            />
          )}

          {visitNum === 2 && <VisitTwoExecution clientId={clientId!} />}
          {visitNum === 3 && <VisitThreeExecution />}
          {visitNum === 4 && <VisitFourExecution storeId={client?.store_id || ''} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
          {visitNum === 5 && <VisitFiveExecution onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
          {visitNum === 6 && <VisitSixExecution clientId={clientId!} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
          {visitNum === 7 && <VisitSevenExecution storeId={client?.store_id || ''} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
          {visitNum === 8 && <VisitEightExecution clientId={clientId!} />}
          {visitNum === 9 && <VisitNineExecution financials={client?.financials || []} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}

          <Card className="p-8 shadow-mx-md border-2 border-mx-border bg-white print:shadow-none print:border-mx-border">
            <div className="flex items-center gap-2 mb-8 uppercase font-black tracking-widest text-mx-muted print:hidden"><ClipboardCheck size={18} /> Checklist Operacional</div>
            <Typography variant="h3" className="mb-6 font-black hidden print:block uppercase">Checklist Executado</Typography>
            <div className="space-y-3">{checklist.map((item, idx) => (<div key={idx} className={cn("flex items-start gap-4 p-5 rounded-3xl border-2 transition-all cursor-pointer shadow-sm", item.completed ? "bg-brand-primary/5 border-brand-primary/30" : "bg-white border-mx-border hover:border-brand-primary/20 shadow-sm print:border-none print:p-2")} onClick={() => handleToggleCheck(idx)}>{item.completed ? <CheckCircle2 className="w-6 h-6 text-brand-primary" /> : <Circle className="w-6 h-6 text-mx-muted opacity-20" />}<Typography variant="body" className={cn("flex-1 font-black", item.completed && "line-through text-mx-muted")}>{item.task}</Typography></div>))}</div>
          </Card>

          <Card className="p-8 shadow-mx-md border-2 border-mx-border bg-white print:shadow-none print:border-mx-border">
            <div className="flex items-center justify-between mb-6"><Typography variant="h3" className="font-black italic uppercase leading-none">Relato Executivo (CRM)</Typography><FileText className="opacity-10 print:hidden" /></div>
            <Textarea value={executiveSummary} onChange={(e) => setExecutiveSummary(e.target.value)} placeholder="Sintetize aqui o diagnóstico e os próximos passos..." className="min-h-[350px] font-mono text-sm leading-relaxed bg-mx-bg-secondary/20 border-2 focus:border-brand-primary print:bg-white print:border-none print:p-0" />
          </Card>

          <Card className="p-8 shadow-mx-md border-2 border-mx-border bg-white print:shadow-none print:border-mx-border">
            <Typography variant="h3" className="mb-4 font-black italic uppercase leading-none text-brand-primary">Feedback para o Cliente</Typography>
            <Textarea value={feedbackClient} onChange={(e) => setFeedbackClient(e.target.value)} placeholder="Pontos cruciais para o cliente atuar..." className="min-h-[120px] border-2 focus:border-brand-primary shadow-sm" />
          </Card>
        </div>

        <div className="space-y-6 print:hidden">
          <Card className="p-6 border-t-8 border-brand-secondary bg-brand-secondary text-white shadow-mx-xl overflow-hidden relative">
             <div className="absolute -right-8 -bottom-8 opacity-10"><Presentation size={120} /></div>
             <Typography variant="h4" tone="white" className="mb-4 uppercase font-black tracking-widest">Documento de Reporte</Typography>
             <Button className="w-full bg-white text-brand-secondary font-black h-14 shadow-lg hover:scale-[1.02] transition-all" icon={<Share2 />} onClick={() => setShowReportModal(true)}>GERAR RELATÓRIO FINAL</Button>
          </Card>
          <Card className="p-6 shadow-mx-md border-t-4 border-brand-primary"><Typography variant="h4" className="mb-4 uppercase font-black">Informações Alvo</Typography><div className="space-y-4"><div><Typography variant="tiny" tone="muted" className="uppercase font-black text-[9px]">Participantes</Typography><Typography variant="body" className="font-black text-brand-secondary">{step?.target}</Typography></div><div><Typography variant="tiny" tone="muted" className="uppercase font-black text-[9px]">Duração Estimada</Typography><Typography variant="body" className="font-black text-brand-secondary">{step?.duration}</Typography></div></div></Card>
        </div>
      </div>

      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="Relatório MX Performance" size="xl">
         <div className="p-8 space-y-6">
            <Card className="p-10 bg-mx-bg-secondary font-mono text-sm leading-relaxed whitespace-pre-wrap select-all border-4 border-double border-mx-muted/20 shadow-inner overflow-y-auto max-h-[600px] print:max-h-none print:bg-white print:border-none print:shadow-none">
{generateReportText()}
            </Card>
            <div className="flex gap-4 print:hidden">
               <Button className="flex-1 h-14 font-black bg-mx-bg-secondary text-brand-secondary border-2 border-brand-secondary hover:bg-brand-secondary hover:text-white" onClick={() => window.print()} icon={<Printer />}>IMPRIMIR / PDF</Button>
               <Button className="flex-1 h-14 font-black bg-mx-green-600 hover:bg-mx-green-700 text-white" onClick={() => { const t = encodeURIComponent(generateReportText()); window.open(`https://wa.me/?text=${t}`) }} icon={<Share2 />}>WHATSAPP</Button>
            </div>
         </div>
      </Modal>
    </main>
  )
}
