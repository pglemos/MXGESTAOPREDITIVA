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

  if (clientLoading || methodologyLoading) return <div className="flex w-full items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>

  return (
    <div className="w-full pb-24 print:bg-white print:pb-0">
      
      {/* Header Local Clean UI */}
      <div className="bg-white border-b border-border-default px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Link to={`/consultoria/clientes/${clientId}`} className="p-2 border border-border-subtle rounded-lg hover:bg-surface-alt/50 transition-colors text-text-secondary">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Typography variant="h3" className="text-text-primary text-lg md:text-xl leading-none">COCKPIT PMR</Typography>
              <Badge variant="outline" className="bg-brand-primary/10 text-brand-primary border-none px-2 py-0.5 text-[10px]">VISITA {visitNum}</Badge>
            </div>
            <Typography variant="tiny" tone="muted" className="text-xs">{step?.objective}</Typography>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none h-10 text-sm font-bold bg-white" onClick={() => handleSave(false)} loading={isSaving}>SALVAR</Button>
          <Button variant="primary" className="flex-1 md:flex-none h-10 text-sm font-bold shadow-sm" onClick={() => handleSave(true)} loading={isSaving}>CONCLUIR</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:p-0">
        
        {/* Coluna Principal - 8 colunas de largura */}
        <div className="lg:col-span-8 space-y-6">
          
          <VisitHeaderBase clientName={client?.name || ''} data={headerBase} onChange={setHeaderBase} />
          
          <div className="animate-in fade-in duration-300">
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

          <Card className="p-6 border border-border-default shadow-sm rounded-2xl bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-border-subtle pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary"><ClipboardCheck size={20} /></div>
                <Typography variant="h3" className="text-lg">Checklist Operacional</Typography>
              </div>
              <Badge variant="secondary" className="font-bold w-fit">Mandatório</Badge>
            </div>
            <div className="space-y-2">
              {checklist.map((item, idx) => (
                <div key={idx} className={cn("flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer", item.completed ? "bg-brand-primary/5 border-brand-primary/20" : "bg-white border-border-default hover:border-border-hover")} onClick={() => handleToggleCheck(idx)}>
                  <div className="mt-0.5">
                    {item.completed ? <CheckCircle2 className="w-5 h-5 text-brand-primary" /> : <Circle className="w-5 h-5 text-text-tertiary opacity-30" />}
                  </div>
                  <Typography variant="p" className={cn("flex-1 text-sm font-bold", item.completed ? "text-text-tertiary line-through" : "text-text-primary")}>{item.task}</Typography>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6">
            <Card className="p-6 border border-border-default shadow-sm rounded-2xl bg-white">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-text-secondary" />
                <Typography variant="h3" className="text-lg">Relato Executivo (CRM)</Typography>
              </div>
              <Textarea 
                value={executiveSummary} 
                onChange={(e) => setExecutiveSummary(e.target.value)} 
                placeholder="Insira o diagnóstico profundo, as decisões tomadas e os planos de ação acordados..." 
                className="min-h-[250px] font-mono text-sm leading-relaxed bg-surface-alt/30 border border-border-default focus:border-brand-primary rounded-xl p-4 shadow-inner resize-none" 
              />
            </Card>
            
            <Card className="p-6 border border-border-default shadow-sm rounded-2xl bg-white">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-5 h-5 text-text-secondary" />
                <Typography variant="h3" className="text-lg">Feedback Direto ao Cliente</Typography>
              </div>
              <Textarea 
                value={feedbackClient} 
                onChange={(e) => setFeedbackClient(e.target.value)} 
                placeholder="Pontos de atenção emergenciais e ações principais..." 
                className="min-h-[120px] text-sm font-bold bg-white border border-border-default focus:border-brand-primary rounded-xl p-4 shadow-sm resize-none" 
              />
            </Card>
          </div>
        </div>

        {/* Coluna Lateral - 4 colunas de largura */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          
          <Card className="p-6 bg-surface-alt/50 border border-border-default shadow-sm rounded-2xl text-center relative overflow-hidden group">
             <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform"><Presentation size={140} /></div>
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-border-subtle mx-auto mb-4 relative z-10">
               <Presentation className="w-6 h-6 text-brand-primary" />
             </div>
             <Typography variant="h3" className="text-lg mb-2 relative z-10">Reporte Oficial MX</Typography>
             <Typography variant="p" className="text-xs text-text-tertiary mb-6 relative z-10">O relatório compila automaticamente todos os dados de BI e o diagnóstico qualitativo da visita.</Typography>
             <Button className="w-full shadow-sm font-bold h-11 relative z-10" variant="primary" icon={<Share2 size={16} />} onClick={() => setShowReportModal(true)}>VER RELATÓRIO</Button>
          </Card>

          <Card className="p-6 border border-border-default shadow-sm rounded-2xl">
            <Typography variant="tiny" tone="muted" className="mb-4 block">INFORMAÇÕES DA ETAPA</Typography>
            <div className="space-y-4">
              <div>
                <Typography variant="tiny" tone="muted" className="text-[10px]">Participantes</Typography>
                <Typography variant="p" className="text-sm font-bold">{step?.target}</Typography>
              </div>
              <div>
                <Typography variant="tiny" tone="muted" className="text-[10px]">Duração Estimada</Typography>
                <Typography variant="p" className="text-sm font-bold">{step?.duration}</Typography>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-border-default shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <Typography variant="tiny" tone="muted" className="text-[10px]">EVIDÊNCIAS ({attachments.length})</Typography>
              <Button variant="ghost" size="xs" className="h-8 border border-border-subtle hover:bg-surface-alt/50" icon={isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} onClick={() => fileInputRef.current?.click()}>ADICIONAR</Button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
            </div>
            <div className="space-y-3">
              {attachments.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-border-subtle rounded-xl bg-surface-alt/10">
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
                      <button className="p-1.5 hover:bg-white rounded-md text-text-secondary transition-colors shadow-sm border border-transparent hover:border-border-subtle" onClick={() => window.open(supabase.storage.from('consulting-attachments').getPublicUrl(file.storage_path).data.publicUrl)}><Download className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 hover:bg-mx-error/10 hover:text-mx-error rounded-md text-text-tertiary transition-colors shadow-sm border border-transparent hover:border-border-subtle" onClick={() => handleDeleteAttachment(file)}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Relatório */}
      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="Documento de Auditoria - MX Performance" size="xl">
         <div className="p-6 md:p-8 space-y-6">
            <Card className="p-6 md:p-8 bg-white font-mono text-sm leading-relaxed whitespace-pre-wrap select-all border border-border-default shadow-inner overflow-y-auto max-h-[60vh] relative rounded-xl print:max-h-none print:shadow-none print:border-none">
              <div className="relative z-10 text-text-primary">{generateReportText()}</div>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
               <Button variant="outline" className="h-12 font-bold w-full bg-white shadow-sm" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>IMPRIMIR / PDF</Button>
               <Button className="h-12 font-bold w-full bg-[#25D366] hover:bg-[#20bd5a] text-white border-none shadow-md" onClick={() => { const t = encodeURIComponent(generateReportText()); window.open(`https://wa.me/?text=${t}`) }} icon={<Share2 className="w-4 h-4" />}>ENVIAR VIA WHATSAPP</Button>
            </div>
         </div>
      </Modal>
    </div>
  )
}
