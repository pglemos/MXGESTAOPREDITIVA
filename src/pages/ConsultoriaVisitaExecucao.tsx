import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
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
    meta_mensal: '', projecao: '', leads_mes: '', estoque_disponivel: '',
    consultant_name: '', visit_date: new Date().toISOString().split('T')[0],
    tempo: '1 DIA', alvo: 'Todos'
  })

  const [quantData, setQuantData] = useState<any>({
    sales: [ { month: 'Jan', value: 0 }, { month: 'Fev', value: 0 }, { month: 'Mar', value: 0 } ],
    marketing: { investment: 0, leads: 0, origin: [ { name: 'Porta', value: 0 }, { name: 'Internet', value: 0 }, { name: 'Carteira', value: 0 }, { name: 'Indicação', value: 0 } ] },
    stock: { qty: 0, avg_price: 0, fipe_delta: 0, mileage: 0, total_inv: 0 }
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
  }, [visit?.id, step?.id])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']
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
      toast.success('Evidências anexadas!'); refetch()
    } catch (err: any) { toast.error(err.message) } finally { setIsUploading(false) }
  }

  const handleDeleteAttachment = async (file: any) => {
    if(!confirm('Excluir evidência?')) return
    try {
      await supabase.storage.from('consulting-attachments').remove([file.storage_path])
      await supabase.from('consulting_visit_attachments').delete().eq('id', file.id)
      toast.success('Evidência removida!'); refetch()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleToggleCheck = (index: number) => {
    const newList = [...checklist]; newList[index].completed = !newList[index].completed
    setChecklist(newList)
  }

  const handleSave = async (complete: boolean = false) => {
    if (!clientId || !visitNum) return
    setIsSaving(true)
    try {
      const payload = {
        client_id: clientId, visit_number: visitNum, checklist_data: checklist,
        executive_summary: executiveSummary, feedback_client: feedbackClient,
        status: complete ? 'concluída' : 'em_andamento',
        meta_mensal: headerBase.meta_mensal, projecao: headerBase.projecao,
        leads_mes: headerBase.leads_mes, estoque_disponivel: headerBase.estoque_disponivel,
        consultant_name_manual: headerBase.consultant_name,
        effective_visit_date: headerBase.visit_date, quant_data: quantData
      }
      const { error } = await supabase.from('consulting_visits').upsert(payload, { onConflict: 'client_id,visit_number' })
      if (error) throw error
      toast.success(complete ? 'Etapa Concluída com Sucesso!' : 'Progresso salvo'); refetch()
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
${executiveSummary || '(Pendente)'}

--- *FEEDBACK E PRÓXIMOS PASSOS* ---
${feedbackClient || '(Nenhum feedback adicional)'}

_Gerado via MX PERFORMANCE_`
  }

  if (clientLoading || methodologyLoading) return <div className="min-h-screen flex items-center justify-center bg-mx-bg"><Loader2 className="w-10 h-10 animate-spin text-brand-primary" /></div>

  return (
    <main className="min-h-screen bg-mx-bg pb-20 print:bg-white print:pb-0">
      {/* Header Fixo e Elegante */}
      <header className="bg-white border-b border-border-default sticky top-0 z-40 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/consultoria/clientes/${clientId}`} className="p-2 hover:bg-mx-bg-secondary rounded-full transition-colors text-text-secondary hover:text-text-primary">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-6 w-[1px] bg-border-default" />
            <div className="flex items-center gap-3">
              <Typography variant="h3" className="text-text-primary font-black uppercase tracking-tight">Cockpit PMR</Typography>
              <Badge variant="outline" className="border-brand-primary text-brand-primary font-bold text-[10px] px-2 hidden sm:inline-flex">VISITA {visitNum}</Badge>
              <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wider hidden md:block">{step?.objective}</Typography>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => handleSave(false)} loading={isSaving} className="hidden sm:flex text-text-secondary">Salvar rascunho</Button>
            <Button variant="primary" size="sm" onClick={() => handleSave(true)} loading={isSaving} className="font-bold shadow-md shadow-brand-primary/20">CONCLUIR E REPORTE</Button>
          </div>
        </div>
        {/* Barra de progresso discreta */}
        <div className="h-1 w-full bg-mx-bg-secondary overflow-hidden">
          <div className="h-full bg-brand-primary transition-all duration-1000" style={{ width: `${(visitNum/9)*100}%` }} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:p-0">
        
        {/* Coluna Principal (Formulários e Gráficos) */}
        <div className="lg:col-span-2 space-y-8">
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

          <Card className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-border-subtle pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary"><ClipboardCheck size={20} /></div>
                <Typography variant="h3">Checklist da Etapa</Typography>
              </div>
              <Badge variant="secondary" className="font-bold w-fit">Mandatório</Badge>
            </div>
            <div className="space-y-3">
              {checklist.map((item, idx) => (
                <div key={idx} className={cn("flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer", item.completed ? "bg-brand-primary/5 border-brand-primary/20" : "bg-white border-border-default hover:border-border-hover")} onClick={() => handleToggleCheck(idx)}>
                  <div className="mt-0.5">
                    {item.completed ? <CheckCircle2 className="w-5 h-5 text-brand-primary" /> : <Circle className="w-5 h-5 text-text-tertiary opacity-30" />}
                  </div>
                  <Typography variant="p" className={cn("flex-1 text-sm font-bold", item.completed ? "text-text-tertiary line-through" : "text-text-primary")}>{item.task}</Typography>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary"><FileText size={20} /></div>
                <Typography variant="h3">Relato Executivo (CRM)</Typography>
              </div>
            </div>
            <Textarea 
              value={executiveSummary} 
              onChange={(e) => setExecutiveSummary(e.target.value)} 
              placeholder="Descreva aqui o diagnóstico profundo, as decisões tomadas e os planos de ação acordados..." 
              className="min-h-[300px] font-mono text-sm leading-relaxed bg-surface-alt/30 border border-border-default focus:border-brand-primary rounded-xl p-6 shadow-inner resize-none" 
            />
          </Card>

          <Card className="p-6 md:p-8">
            <Typography variant="h3" className="mb-4">Feedback Direto ao Cliente</Typography>
            <Textarea 
              value={feedbackClient} 
              onChange={(e) => setFeedbackClient(e.target.value)} 
              placeholder="Descreva aqui as 3 ações principais que o cliente precisa atuar..." 
              className="min-h-[120px] text-sm font-bold bg-white border border-border-default focus:border-brand-primary rounded-xl p-4 shadow-sm" 
            />
          </Card>
        </div>

        {/* Coluna Lateral (Informações e Ações) */}
        <div className="space-y-6 print:hidden">
          <Card className="p-6 md:p-8 bg-surface-alt/50 border-t-4 border-t-brand-primary shadow-sm relative overflow-hidden group">
             <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform"><Presentation size={140} /></div>
             <Typography variant="h3" className="mb-2">Reporte Oficial MX</Typography>
             <Typography variant="p" className="text-xs mb-6 text-text-tertiary">O relatório compila automaticamente todos os dados de BI e o diagnóstico qualitativo da visita.</Typography>
             <Button className="w-full shadow-md shadow-brand-primary/20 font-bold h-12" variant="primary" icon={<Share2 size={16} />} onClick={() => setShowReportModal(true)}>VER RELATÓRIO</Button>
          </Card>

          <Card className="p-6">
            <Typography variant="h4" className="mb-4 text-xs tracking-widest text-text-tertiary">ALVO DA ETAPA</Typography>
            <div className="space-y-4">
              <div>
                <Typography variant="tiny" tone="muted" className="mb-1 block">Participantes Requeridos</Typography>
                <Typography variant="p" className="font-bold text-text-primary">{step?.target}</Typography>
              </div>
              <div>
                <Typography variant="tiny" tone="muted" className="mb-1 block">Duração Estimada</Typography>
                <Typography variant="p" className="font-bold text-text-primary">{step?.duration}</Typography>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h4" className="text-xs tracking-widest text-text-tertiary">EVIDÊNCIAS ({attachments.length})</Typography>
              <Button variant="ghost" size="xs" className="h-8" icon={isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />} onClick={() => fileInputRef.current?.click()}>ADICIONAR</Button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
            </div>
            <div className="space-y-3">
              {attachments.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-border-subtle rounded-xl">
                  <Typography variant="tiny" tone="muted">Nenhuma evidência anexada.</Typography>
                </div>
              ) : (
                attachments.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-surface-alt/30 rounded-xl border border-border-subtle group hover:border-border-hover transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-white rounded-lg border border-border-subtle shrink-0"><FileText className="w-4 h-4 text-text-secondary" /></div>
                      <div className="truncate">
                        <Typography variant="tiny" className="font-bold text-text-primary truncate block">{file.filename}</Typography>
                        <Typography variant="tiny" tone="muted" className="text-[10px]">{formatFileSize(file.size_bytes)}</Typography>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button className="p-1.5 hover:bg-white rounded-md text-text-secondary transition-colors" onClick={() => window.open(supabase.storage.from('consulting-attachments').getPublicUrl(file.storage_path).data.publicUrl)}><Download className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 hover:bg-mx-error/10 hover:text-mx-error rounded-md text-text-tertiary transition-colors" onClick={() => handleDeleteAttachment(file)}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="Documento de Auditoria - MX Performance" size="xl">
         <div className="p-6 md:p-8 space-y-6">
            <Card className="p-6 md:p-10 bg-white font-mono text-sm md:text-base leading-relaxed whitespace-pre-wrap select-all border border-border-default shadow-inner overflow-y-auto max-h-[60vh] relative rounded-2xl print:max-h-none print:shadow-none print:border-none">
              <div className="relative z-10 text-text-primary">{generateReportText()}</div>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
               <Button variant="outline" className="h-12 font-bold w-full" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>IMPRIMIR / PDF</Button>
               <Button className="h-12 font-bold w-full bg-[#25D366] hover:bg-[#20bd5a] text-white border-none shadow-md" onClick={() => { const t = encodeURIComponent(generateReportText()); window.open(`https://wa.me/?text=${t}`) }} icon={<Share2 className="w-4 h-4" />}>ENVIAR VIA WHATSAPP</Button>
            </div>
         </div>
      </Modal>
    </main>
  )
}
