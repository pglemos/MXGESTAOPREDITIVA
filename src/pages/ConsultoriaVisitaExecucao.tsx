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
    sales: [ { month: 'Jan', value: 0 }, { month: 'Fev', value: 0 }, { month: 'Mar', value: 0 } ],
    marketing: { investment: 0, leads: 0, origin: [ { name: 'Porta', value: 0 }, { name: 'Internet', value: 0 }, { name: 'Carteira', value: 0 }, { name: 'Indicação', value: 0 } ] },
    stock: { qty: 0, avg_price: 0, fipe_delta: 0, mileage: 0, total_inv: 0 },
    sellerPerformance: []
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files || files.length === 0 || !visit) return
    setIsUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const filePath = `${clientId}/visita-${visitNum}/${Math.random().toString(36).substring(2)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('consulting-attachments').upload(filePath, file)
        if (uploadError) throw uploadError
        await supabase.from('consulting_visit_attachments').insert({ visit_id: visit.id, filename: file.name, storage_path: filePath, content_type: file.type, size_bytes: file.size })
      }
      toast.success('Evidências enviadas!'); refetch()
    } catch (err: any) { toast.error(err.message) } finally { setIsUploading(false) }
  }

  const handleDeleteAttachment = async (file: any) => {
    if(!confirm('Excluir evidência?')) return
    try {
      await supabase.storage.from('consulting-attachments').remove([file.storage_path])
      await supabase.from('consulting_visit_attachments').delete().eq('id', file.id)
      toast.success('Excluído!'); refetch()
    } catch (err: any) { toast.error(err.message) }
  }

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
    const totalSales = quantData.sales.reduce((acc: number, cur: any) => acc + (cur.value || 0), 0)
    const cpl = (quantData.marketing.investment / (quantData.marketing.leads || 1)).toFixed(2)
    return `📍 *RELATÓRIO DE VISITA ${visitNum}: ${step?.objective.toUpperCase()}*

--- *CABEÇALHO BASE* ---
*Consultor:* ${headerBase.consultant_name}
*Data:* ${new Date(headerBase.visit_date).toLocaleDateString('pt-BR')}
*Loja:* ${client?.name}
*Meta:* ${headerBase.meta_mensal} | *Projeção:* ${headerBase.projecao}
*Leads:* ${headerBase.leads_mes} | *Estoque:* ${headerBase.estoque_disponivel}

${visitNum === 1 ? `--- *INDICADORES QUANTITATIVOS* ---
*Vendas Trimestre:* ${totalSales} carros
*Marketing (CPL):* R$ ${cpl}
*Volume Leads:* ${quantData.marketing.leads}/mês
*Estoque:* ${quantData.stock.qty} carros` : ''}

--- *RELATO DA VISITA* ---
${executiveSummary || '(Pendente de preenchimento no sistema)'}

--- *FEEDBACK E PRÓXIMOS PASSOS* ---
${feedbackClient || '(Nenhum feedback adicional registrado)'}

_Gerado via MX PERFORMANCE CRM - Metodologia PMR_`
  }

  if (clientLoading || methodologyLoading) return <div className="min-h-screen flex items-center justify-center bg-mx-bg"><Loader2 className="w-10 h-10 animate-spin text-brand-primary" /></div>

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-20 print:bg-white print:pb-0">
      <header className="bg-white border-b-2 border-mx-border sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to={`/consultoria/clientes/${clientId}`} className="p-3 hover:bg-mx-bg-secondary rounded-2xl transition-all border-2 border-transparent hover:border-mx-border active:scale-90"><ArrowLeft className="w-6 h-6 text-brand-secondary" /></Link>
            <div className="h-10 w-[2px] bg-mx-border" />
            <div>
              <Typography variant="h3" className="text-brand-secondary font-black italic tracking-tighter uppercase leading-none mb-1">Cockpit PMR</Typography>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary border-none font-black text-[10px] px-3">VISITA {visitNum}</Badge>
                <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-widest text-[9px]">{step?.objective}</Typography>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="h-12 px-6 font-black border-2 hover:bg-mx-bg-secondary active:scale-95 transition-all" onClick={() => handleSave(false)} loading={isSaving}>SALVAR RASCUNHO</Button>
            <Button variant="primary" className="h-12 px-8 font-black shadow-xl shadow-brand-primary/20 active:scale-95 transition-all" onClick={() => handleSave(true)} loading={isSaving}>CONCLUIR E GERAR REPORTE</Button>
          </div>
        </div>
        <div className="h-1.5 w-full bg-mx-bg-secondary">
          <div className="h-full bg-brand-primary transition-all duration-1000 shadow-[0_0_10px_rgba(0,196,159,0.5)]" style={{ width: `${(visitNum/9)*100}%` }} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10 print:block print:p-0">
        <div className="lg:col-span-2 space-y-10">
          <VisitHeaderBase clientName={client?.name || ''} data={headerBase} onChange={setHeaderBase} />
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          </div>

          <Card className="p-10 shadow-mx-xl border-4 border-mx-border bg-white rounded-[40px]">
            <div className="flex items-center justify-between mb-10 border-b-2 border-mx-bg-secondary pb-6">
              <div className="flex items-center gap-4 uppercase font-black tracking-[4px] text-mx-muted print:hidden">
                <div className="p-3 bg-mx-bg-secondary rounded-2xl"><ClipboardCheck size={24} /></div> Checklist da Etapa
              </div>
              <Badge className="font-black px-6 py-2 bg-mx-bg-secondary text-mx-muted border-none">MANDATÓRIO</Badge>
            </div>
            <div className="space-y-4">{checklist.map((item, idx) => (<div key={idx} className={cn("flex items-start gap-5 p-6 rounded-[32px] border-4 transition-all cursor-pointer shadow-sm", item.completed ? "bg-brand-primary/5 border-brand-primary/30" : "bg-white border-mx-border hover:border-brand-primary/20 shadow-sm")} onClick={() => handleToggleCheck(idx)}>{item.completed ? <div className="p-1 bg-brand-primary rounded-full shadow-lg shadow-brand-primary/30"><CheckCircle2 className="w-6 h-6 text-white" /></div> : <Circle className="w-8 h-8 text-mx-muted opacity-20" />}<Typography variant="body" className={cn("flex-1 font-black text-lg", item.completed && "line-through text-mx-muted opacity-50")}>{item.task}</Typography></div>))}</div>
          </Card>

          <Card className="p-10 shadow-mx-xl border-4 border-mx-border bg-white rounded-[40px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><FileText size={150} /></div>
            <div className="flex items-center justify-between mb-10 border-b-2 border-mx-bg-secondary pb-6 relative z-10">
              <Typography variant="h2" className="font-black italic uppercase leading-none tracking-tighter">Relato Executivo (CRM)</Typography>
              <Sparkles className="text-brand-primary animate-pulse" />
            </div>
            <div className="relative z-10">
              <Textarea 
                value={executiveSummary} 
                onChange={(e) => setExecutiveSummary(e.target.value)} 
                placeholder="Descreva aqui o diagnóstico profundo, decisões tomadas e planos de ação acordados..." 
                className="min-h-[400px] font-mono text-base leading-relaxed bg-mx-bg-secondary/20 border-4 focus:border-brand-primary rounded-[32px] p-10 shadow-inner resize-none" 
              />
            </div>
          </Card>

          <Card className="p-10 shadow-mx-xl border-4 border-mx-border bg-white rounded-[40px]">
            <Typography variant="h3" className="mb-6 font-black italic uppercase leading-none text-brand-primary tracking-tighter">Direcionamento para o Cliente</Typography>
            <Textarea 
              value={feedbackClient} 
              onChange={(e) => setFeedbackClient(e.target.value)} 
              placeholder="Quais as 3 ações que o cliente deve focar imediatamente?" 
              className="min-h-[150px] border-4 border-brand-primary/10 focus:border-brand-primary rounded-[32px] p-8 text-lg font-bold bg-mx-bg-secondary/5" 
            />
          </Card>
        </div>

        <div className="space-y-8 print:hidden">
          <Card className="p-8 border-t-[16px] border-brand-secondary bg-[#1e293b] text-white shadow-2xl overflow-hidden relative rounded-[40px] group hover:scale-[1.02] transition-all">
             <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:rotate-12 transition-transform"><Presentation size={200} /></div>
             <Typography variant="h4" tone="white" className="mb-4 uppercase font-black tracking-[40px] text-[8px] opacity-40">OUTPUT</Typography>
             <Typography variant="h2" tone="white" className="mb-6 font-black italic uppercase leading-none tracking-tighter">Reporte<br/>Oficial MX</Typography>
             <Typography variant="body" tone="white" className="text-sm mb-10 opacity-70 leading-relaxed font-medium">O relatório compila automaticamente todos os dados de BI e o diagnóstico qualitativo da visita.</Typography>
             <Button className="w-full bg-white text-brand-secondary font-black h-16 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-white/10 transition-all rounded-3xl text-lg uppercase italic tracking-tighter" icon={<Share2 className="mr-2" />} onClick={() => setShowReportModal(true)}>GERAR RELATÓRIO FINAL</Button>
          </Card>

          <Card className="p-8 shadow-mx-xl border-4 border-mx-border bg-white rounded-[40px]">
            <div className="flex items-center gap-4 mb-8 font-black uppercase text-xs tracking-[4px] text-mx-muted border-b-2 border-mx-bg-secondary pb-4">
              <div className="p-2 bg-mx-bg-secondary rounded-lg"><Target size={16} className="text-brand-primary" /></div> Alvo da Etapa
            </div>
            <div className="space-y-6">
              <div className="group">
                <Typography variant="tiny" tone="muted" className="uppercase font-black text-[9px] tracking-widest mb-1 block group-hover:text-brand-primary transition-colors">Participantes</Typography>
                <Typography variant="body" className="font-black text-brand-secondary text-xl tracking-tight leading-tight">{step?.target}</Typography>
              </div>
              <div className="group">
                <Typography variant="tiny" tone="muted" className="uppercase font-black text-[9px] tracking-widest mb-1 block group-hover:text-brand-primary transition-colors">Duração Estimada</Typography>
                <Typography variant="body" className="font-black text-brand-secondary text-xl tracking-tight leading-tight">{step?.duration}</Typography>
              </div>
            </div>
          </Card>

          <Card className="p-8 shadow-mx-xl border-4 border-mx-border bg-white rounded-[40px]">
            <div className="flex items-center justify-between mb-8 border-b-2 border-mx-bg-secondary pb-4 font-black uppercase text-xs tracking-[4px] text-mx-muted">
              <div className="flex items-center gap-3"><Paperclip size={16} className="text-brand-primary" /> Evidências ({attachments.length})</div>
              <Button variant="ghost" size="xs" className="hover:bg-brand-primary/10 text-brand-primary" icon={isUploading ? <Loader2 className="animate-spin" /> : <Plus />} onClick={() => fileInputRef.current?.click()}>ADD</Button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
            </div>
            <div className="space-y-4">
              {attachments.length === 0 ? (
                <div className="py-10 text-center border-4 border-dashed border-mx-border rounded-[32px] opacity-30">
                  <Image size={40} className="mx-auto mb-4" />
                  <Typography variant="tiny" className="font-black uppercase tracking-widest">Nenhuma evidência</Typography>
                </div>
              ) : (
                attachments.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-5 bg-mx-bg-secondary rounded-3xl border-2 border-mx-border group hover:border-brand-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-xl shadow-sm"><FileText className="w-5 h-5 text-brand-secondary" /></div>
                      <div>
                        <Typography variant="tiny" className="font-black truncate max-w-[120px] block">{file.filename}</Typography>
                        <Typography variant="tiny" tone="muted" className="text-[8px] font-bold">{formatFileSize(file.size_bytes)}</Typography>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-white hover:bg-brand-primary hover:text-white rounded-xl shadow-sm transition-all" onClick={() => window.open(supabase.storage.from('consulting-attachments').getPublicUrl(file.storage_path).data.publicUrl)}><Download className="w-4 h-4" /></button>
                      <button className="p-2 bg-white hover:bg-mx-error hover:text-white rounded-xl shadow-sm transition-all" onClick={() => handleDeleteAttachment(file)}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="Documento de Auditoria - MX Performance" size="xl">
         <div className="p-10 space-y-8">
            <Card className="p-16 bg-white font-mono text-base leading-relaxed whitespace-pre-wrap select-all border-4 border-mx-border shadow-inner overflow-y-auto max-h-[700px] relative rounded-[40px] print:max-h-none print:shadow-none">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Presentation size={400} /></div>
              <div className="relative z-10">{generateReportText()}</div>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
               <Button className="h-16 font-black bg-mx-bg-secondary text-brand-secondary border-4 border-brand-secondary hover:bg-brand-secondary hover:text-white rounded-[24px] text-lg uppercase italic tracking-tighter transition-all" onClick={() => window.print()} icon={<Printer className="mr-2" />}>IMPRIMIR / GERAR PDF</Button>
               <Button className="h-16 font-black bg-mx-green-600 hover:bg-mx-green-700 text-white rounded-[24px] text-lg uppercase italic tracking-tighter shadow-xl shadow-mx-green-600/20 active:scale-95 transition-all" onClick={() => { const t = encodeURIComponent(generateReportText()); window.open(`https://wa.me/?text=${t}`) }} icon={<Share2 className="mr-2" />}>ENVIAR VIA WHATSAPP</Button>
            </div>
         </div>
      </Modal>
    </main>
  )
}
