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
import { useConsultingClientDetailBySlug } from '@/hooks/useConsultingClientBySlug'
import { useConsultingMethodology } from '@/hooks/useConsultingClients'
import { usePmrDiagnostics } from '@/hooks/usePmrDiagnostics'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/organisms/Modal'

import { VisitHeaderBase } from '@/features/consultoria/components/VisitHeaderBase'
import { VisitOneHighFidelity } from '@/features/consultoria/components/VisitOneHighFidelity'
import { 
  VisitTwoExecution, VisitThreeExecution, VisitFourExecution, 
  VisitFiveExecution, VisitSixExecution, VisitSevenExecution, 
  VisitEightExecution, VisitNineExecution 
} from '@/features/consultoria/components/VisitExecutionViews'
import { VisitReportTemplate } from '@/features/consultoria/components/VisitReportTemplate'

export default function ConsultoriaVisitaExecucao() {
  const { clientSlug, visitNumber } = useParams<{ clientSlug: string, visitNumber: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { client, loading: clientLoading, refetch } = useConsultingClientDetailBySlug(clientSlug)
  
  const clientId = client?.id
  const { steps, loading: methodologyLoading } = useConsultingMethodology(client?.program_template_key || 'pmr_7')
  const { templates, responsesByTemplate, saveResponse } = usePmrDiagnostics(clientId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const visitNum = parseInt(visitNumber || '1')
  const step = useMemo(() => steps.find(s => s.visit_number === visitNum), [steps, visitNum])
  const visit = useMemo(() => client?.visits?.find(v => v.visit_number === visitNum), [client, visitNum])

  useEffect(() => {
    if (client && client.slug && clientSlug && client.slug !== clientSlug) {
      window.history.replaceState({}, '', `/consultoria/clientes/${client.slug}/visitas/${visitNumber}${window.location.search}`)
    }
  }, [client, clientSlug, visitNumber])

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

  const [tab, setTab] = useState<'dashboards' | 'benchmark' | 'entrevistas'>('dashboards')

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
        consultant_name: (visit as any).consultant_name_manual || profile?.name || '',
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
      setHeaderBase(prev => ({ ...prev, consultant_name: profile?.name || '', tempo: step.duration || '1 DIA', alvo: step.target || 'Todos' }))
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
      if (complete) navigate(`/consultoria/clientes/${client?.slug}`)
    } catch (err: any) { toast.error(err.message) } finally { setIsSaving(false) }
  }

  const handleAcknowledge = async () => {
    if (!visit?.id) return
    try {
      const { error } = await supabase.from('consulting_visits').update({ 
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: profile?.id 
      }).eq('id', visit.id)
      if (error) throw error
      toast.success('Visita assinada/confirmada pelo gestor!'); refetch()
    } catch (err: any) { toast.error(err.message) }
  }

  const generateReportText = () => {
    const safeSales = quantData?.sales || []
    const safeMarketing = quantData?.marketing || { investment: 0, leads: 0, origin: [] }
    const safeStock = quantData?.stock || { qty: 0, avg_price: 0, fipe_delta: 0, mileage: 0, total_inv: 0 }
    
    const totalSales = safeSales.reduce((acc: number, cur: any) => acc + (cur.value || 0), 0)
    const cpl = (safeMarketing.investment / (safeMarketing.leads || 1)).toFixed(2)
    return `📍 RELATÓRIO DE VISITA ${visitNum}: ${step?.objective?.toUpperCase()}

--- CABEÇALHO BASE ---
Consultor: ${headerBase.consultant_name}
Data: ${new Date(headerBase.visit_date).toLocaleDateString('pt-BR')}
Loja: ${client?.name}
Meta: ${headerBase.meta_mensal} | Projeção: ${headerBase.projecao}
Leads: ${headerBase.leads_mes} | Estoque: ${headerBase.estoque_disponivel}

${visitNum === 1 ? `--- INDICADORES QUANTITATIVOS ---
Vendas Trimestre: ${totalSales} carros
Marketing (CPL): R$ ${cpl}
Volume Leads: ${safeMarketing.leads}/mês
Estoque: ${safeStock.qty} carros\n` : ''}
--- RELATO DA VISITA ---
${executiveSummary || '(Pendente)'}

--- FEEDBACK E PRÓXIMOS PASSOS ---
${feedbackClient || '(Nenhum)'}

Gerado via MX PERFORMANCE`
  }

  const handleDownloadPDF = async () => {
    // Import dynamically to keep bundle small
    const html2pdf = (await import('html2pdf.js')).default
    
    const element = document.getElementById('report-template-render')
    if (!element) return

    const opt = {
      margin: 0,
      filename: `Relatorio-Visita-${visitNum}-${client?.slug || 'cliente'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    } as const

    try {
      toast.loading('Gerando PDF Oficial...')
      await html2pdf().set(opt).from(element).save()
      toast.success('Relatório gerado com sucesso!')
    } catch (err) {
      toast.error('Erro ao gerar PDF')
      console.error(err)
    }
  }

  if (clientLoading || methodologyLoading) return <div className="flex w-full items-center justify-center p-mx-20"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>

  if (!client) return <div>Cliente não localizado.</div>

  return (
    <div className="w-full pb-mx-xl relative z-0">
      {/* Elemento oculto para renderização do PDF */}
      <div className="fixed -left-[9999px] top-0 overflow-hidden pointer-events-none">
         <div id="report-template-render">
            <VisitReportTemplate client={client} visit={visit || { visit_number: visitNum } as any} headerBase={headerBase} quantData={quantData} />
         </div>
      </div>
      
      {/* Header Fixo da Visita - Limpo e sem conflito de Z-index */}
      <div className="bg-transparent px-mx-md py-mx-sm flex flex-col md:flex-row md:items-center justify-between gap-mx-sm mb-mx-md print:hidden">
        <div className="flex items-center gap-mx-md">
          <Link to={`/consultoria/clientes/${client?.slug}`} className="p-mx-xs border border-border-subtle rounded-lg hover:bg-surface-alt/50 transition-colors text-text-secondary">
            <ArrowLeft className="w-mx-4 h-mx-4" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-mx-xs">
              <Typography variant="h3" className="text-text-primary text-lg leading-none">COCKPIT PMR</Typography>
              <Badge variant="outline" className="bg-brand-primary/10 text-brand-primary border-none px-2 py-0.5 text-[10px]">VISITA {visitNum}</Badge>
            </div>
            <Typography variant="tiny" tone="muted" className="text-xs font-medium">{step?.objective}</Typography>
          </div>
        </div>
        
        <div className="flex items-center gap-mx-sm w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none h-mx-10 text-sm font-bold bg-white" onClick={() => handleSave(false)} loading={isSaving}>SALVAR</Button>
          <Button variant="primary" className="flex-1 md:flex-none h-mx-10 text-sm font-bold shadow-sm" onClick={() => handleSave(true)} loading={isSaving}>CONCLUIR</Button>
        </div>
      </div>

      <div className="w-full px-mx-md lg:px-mx-xl grid grid-cols-1 lg:grid-cols-3 gap-mx-lg print:block print:p-0">
        
        {/* Coluna Principal - 2 colunas */}
        <div className="lg:col-span-2 space-y-mx-lg">
          
          <VisitHeaderBase clientName={client?.name || ''} data={headerBase} onChange={setHeaderBase} />
          
          <div className="animate-in fade-in duration-300">
            {visitNum === 1 && (
              <div className="space-y-mx-lg min-w-0">
                <VisitOneHighFidelity quantData={quantData} onQuantChange={setQuantData} templates={templates} visitId={visit?.id} clientId={clientId} onSaveResponse={saveResponse} />              </div>
            )}
            {visitNum === 2 && <VisitTwoExecution clientId={clientId!} clientSlug={clientSlug!} />}
            {visitNum === 3 && <VisitThreeExecution />}
            {visitNum === 4 && <VisitFourExecution storeId={client?.store_id || ''} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
            {visitNum === 5 && <VisitFiveExecution onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
            {visitNum === 6 && <VisitSixExecution clientId={clientId!} clientSlug={clientSlug!} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
            {visitNum === 7 && <VisitSevenExecution storeId={client?.store_id || ''} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
            {visitNum === 8 && <VisitEightExecution clientId={clientId!} clientSlug={clientSlug!} />}
            {visitNum === 9 && <VisitNineExecution financials={client?.financials || []} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
          </div>

          <Card className="p-mx-lg border border-border-default shadow-sm rounded-2xl bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-border-subtle pb-4 gap-mx-md">
              <div className="flex items-center gap-mx-sm">
                <div className="p-mx-xs bg-brand-primary/10 rounded-lg text-brand-primary"><ClipboardCheck size={20} /></div>
                <Typography variant="h3" className="text-lg">Checklist Operacional</Typography>
              </div>
            </div>
            <div className="space-y-mx-xs">
              {checklist.map((item, idx) => (
                <div key={idx} className={cn("flex items-start gap-mx-md p-mx-md rounded-xl border transition-all cursor-pointer", item.completed ? "bg-brand-primary/5 border-brand-primary/20" : "bg-white border-border-default hover:border-border-hover")} onClick={() => handleToggleCheck(idx)}>
                  <div className="mt-0.5">
                    {item.completed ? <CheckCircle2 className="w-mx-5 h-mx-5 text-brand-primary" /> : <Circle className="w-mx-5 h-mx-5 text-text-tertiary opacity-30 hover:opacity-50" />}
                  </div>
                  <Typography variant="p" className={cn("flex-1 text-sm font-bold transition-colors", item.completed ? "text-text-tertiary line-through" : "text-text-primary")}>{item.task}</Typography>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-mx-lg">
            <Card className="p-mx-lg border border-border-default shadow-sm rounded-2xl bg-white">
              <div className="flex items-center gap-mx-sm mb-4">
                <FileText className="w-mx-5 h-mx-5 text-text-secondary" />
                <Typography variant="h3" className="text-lg">Relato Executivo (CRM)</Typography>
              </div>
              <Textarea 
                value={executiveSummary} 
                onChange={(e) => setExecutiveSummary(e.target.value)} 
                placeholder="Insira o diagnóstico profundo, as decisões tomadas e os planos de ação acordados..." 
                className="min-h-[250px] text-sm bg-surface-alt/30 border border-border-default focus:border-brand-primary focus:bg-white rounded-xl p-mx-md shadow-inner resize-y transition-colors" 
              />
            </Card>
            
            <Card className="p-mx-lg border border-border-default shadow-sm rounded-2xl bg-white">
              <div className="flex items-center gap-mx-sm mb-4">
                <MessageSquare className="w-mx-5 h-mx-5 text-text-secondary" />
                <Typography variant="h3" className="text-lg">Feedback Direto ao Cliente</Typography>
              </div>
              <Textarea 
                value={feedbackClient} 
                onChange={(e) => setFeedbackClient(e.target.value)} 
                placeholder="Pontos de atenção emergenciais..." 
                className="min-h-[100px] text-sm font-medium bg-white border border-border-default focus:border-brand-primary shadow-sm resize-y rounded-xl p-mx-md" 
              />
            </Card>
          </div>
        </div>

        {/* Coluna Lateral - 1 coluna lg */}
        <div className="lg:col-span-1 space-y-mx-lg print:hidden">
          
          <Card className="p-mx-lg bg-white border border-border-default shadow-sm rounded-2xl text-center">
             <div className="w-mx-12 h-mx-12 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
               <Presentation className="w-mx-6 h-mx-6 text-brand-primary" />
             </div>
             <Typography variant="h3" className="text-lg mb-2">Reporte Oficial MX</Typography>
             <Typography variant="p" className="text-xs text-text-tertiary mb-6">O relatório compila os dados e o diagnóstico da visita.</Typography>
             <div className="space-y-3">
               <Button className="w-full shadow-sm font-bold h-11" variant="primary" icon={<Share2 size={14} />} onClick={() => setShowReportModal(true)}>VER RELATÓRIO</Button>
               
               {visit?.status === 'concluída' && (
                 <Button 
                   className={cn("w-full shadow-sm font-bold h-11", (visit as any).acknowledged_at ? "bg-status-success/10 text-status-success border-status-success/20 hover:bg-status-success/20" : "")} 
                   variant="outline" 
                   icon={(visit as any).acknowledged_at ? <ShieldCheck size={14} /> : <Award size={14} />} 
                   onClick={handleAcknowledge}
                   disabled={!!(visit as any).acknowledged_at}
                 >
                   {(visit as any).acknowledged_at ? 'VISITA ASSINADA' : 'ASSINAR VISITA'}
                 </Button>
               )}
             </div>
          </Card>

          <Card className="p-mx-md border border-border-default shadow-sm rounded-2xl bg-white">
            <Typography variant="tiny" tone="muted" className="mb-4 block tracking-widest text-[10px]">INFORMAÇÕES DA ETAPA</Typography>
            <div className="space-y-mx-md">
              <div className="flex items-center gap-mx-sm">
                <Users className="w-mx-4 h-mx-4 text-text-tertiary shrink-0" />
                <div>
                  <Typography variant="tiny" tone="muted" className="text-[10px]">Participantes</Typography>
                  <Typography variant="p" className="text-sm font-bold">{step?.target}</Typography>
                </div>
              </div>
              <div className="flex items-center gap-mx-sm">
                <Timer className="w-mx-4 h-mx-4 text-text-tertiary shrink-0" />
                <div>
                  <Typography variant="tiny" tone="muted" className="text-[10px]">Duração</Typography>
                  <Typography variant="p" className="text-sm font-bold">{step?.duration}</Typography>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-mx-lg border border-border-default shadow-sm rounded-3xl bg-white">
            <div className="flex items-center justify-between mb-6 border-b border-border-subtle pb-4">
              <Typography variant="tiny" tone="muted" className="text-[10px] tracking-widest font-bold uppercase">EVIDÊNCIAS ({attachments.length})</Typography>
              <Button variant="ghost" size="xs" className="h-8 border border-border-subtle hover:bg-brand-primary/10 text-brand-primary font-bold px-3 rounded-lg" icon={isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} onClick={() => fileInputRef.current?.click()}>ADD</Button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
            </div>
            <div className="space-y-3">
              {attachments.length === 0 ? (
                <div className="py-10 text-center border border-border-default rounded-2xl bg-surface-alt/30 flex flex-col items-center justify-center gap-mx-xs">
                  <Image className="w-mx-6 h-mx-6 text-text-tertiary opacity-50" />
                  <Typography variant="tiny" tone="muted" className="font-bold">Nenhuma evidência.</Typography>
                </div>
              ) : (
                attachments.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-surface-alt/30 rounded-xl border border-border-subtle group hover:border-border-hover transition-colors">
                    <div className="flex items-center gap-mx-sm overflow-hidden">
                      <div className="p-mx-xs bg-white rounded-lg shadow-sm border border-border-subtle shrink-0"><FileText className="w-mx-4 h-mx-4 text-text-tertiary" /></div>
                      <div className="truncate">
                        <Typography variant="tiny" className="font-bold text-text-secondary truncate block">{file.filename}</Typography>
                        <Typography variant="tiny" tone="muted" className="text-[9px]">{formatFileSize(file.size_bytes)}</Typography>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                      <button className="p-1.5 hover:bg-white rounded-md text-text-secondary shadow-sm border border-transparent hover:border-border-subtle transition-all" onClick={() => window.open(supabase.storage.from('consulting-attachments').getPublicUrl(file.storage_path).data.publicUrl)}><Download className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 hover:bg-mx-error/10 hover:text-mx-error rounded-md text-text-tertiary shadow-sm border border-transparent hover:border-status-error/30 transition-all" onClick={() => handleDeleteAttachment(file)}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="Documento de Auditoria" size="lg">
         <div className="p-mx-lg space-y-mx-md bg-surface-alt/20">
            <Card className="p-mx-lg bg-white font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap select-all border border-border-default shadow-inner overflow-y-auto max-h-[60vh] relative rounded-xl print:max-h-none print:shadow-none print:border-none print:bg-white">
              <div className="relative z-10 text-text-primary">{generateReportText()}</div>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-sm print:hidden">
               <Button variant="outline" className="h-11 text-sm font-bold bg-white" onClick={() => window.print()} icon={<Printer className="w-mx-4 h-mx-4" />}>Imprimir PDF</Button>
               <Button className="h-11 text-sm font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white border-none shadow-sm" onClick={() => { const t = encodeURIComponent(generateReportText()); window.open(`https://wa.me/?text=${t}`) }} icon={<Share2 className="w-mx-4 h-mx-4" />}>Enviar WhatsApp</Button>
               <Button variant="secondary" className="h-11 text-sm font-bold bg-brand-primary text-white border-none shadow-mx-sm col-span-1 sm:col-span-2" onClick={handleDownloadPDF} icon={<Download className="w-mx-4 h-mx-4" />}>BAIXAR PDF OFICIAL (A4)</Button>
            </div>
         </div>
      </Modal>
    </div>
  )
}
