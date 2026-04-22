import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, CheckCircle2, Circle, Save, FileText, Send,
  AlertCircle, Info, Building2, User2, Calendar,
  Plus, Trash2, Download, Loader2, Paperclip, Image,
  ChevronDown, ChevronUp, ClipboardCheck, Copy, Sparkles,
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
  VisitEightExecution, VisitNineExecution, VisitChecklist 
} from '@/features/consultoria/components/VisitExecutionViews'
import { VisitReportTemplate } from '@/features/consultoria/components/VisitReportTemplate'

import { VisitActionQuickAdd } from '@/features/consultoria/components/VisitActionQuickAdd'

export default function ConsultoriaVisitaExecucao() {
  const { clientSlug, visitNumber } = useParams<{ clientSlug: string, visitNumber: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { client, loading: clientLoading, refetch } = useConsultingClientDetailBySlug(clientSlug)
  
  const clientId = client?.id
  const resolvedStoreId = client?.primary_store_id || client?.store_id || ''
  
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
  const [nextCycleGoal, setNextCycleGoal] = useState('')
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
      setNextCycleGoal((visit as any).next_cycle_goal || '')
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
  }, [visit?.id, step?.id, profile?.name])

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

  const hasRequiredEvidence = useMemo(() => {
    if (!step?.evidence_required) return true
    return (attachments || []).length > 0
  }, [step?.evidence_required, attachments])

  const handleSave = async (complete: boolean = false) => {
    if (!clientId || !visitNum) return
    
    if (complete && !hasRequiredEvidence) {
      toast.error(`Evidência Obrigatória: Esta etapa exige o upload de: ${step?.evidence_required}`, {
        duration: 5000,
        description: 'Por favor, adicione um anexo antes de concluir.'
      })
      return
    }

    setIsSaving(true)
    try {
      const payload: any = {
        client_id: clientId, visit_number: visitNum, checklist_data: checklist,
        executive_summary: executiveSummary, feedback_client: feedbackClient,
        status: complete ? 'concluída' : 'em_andamento',
        meta_mensal: headerBase.meta_mensal, projecao: headerBase.projecao,
        leads_mes: headerBase.leads_mes, estoque_disponivel: headerBase.estoque_disponivel,
        consultant_name_manual: headerBase.consultant_name,
        effective_visit_date: headerBase.visit_date, quant_data: quantData,
        next_cycle_goal: nextCycleGoal
      }
      
      const { error } = await supabase.from('consulting_visits').upsert(payload, { onConflict: 'client_id,visit_number' })
      
      if (error && (error.code === 'PGRST204' || error.message.includes('consultant_name_manual'))) {
        console.warn('Schema mismatch detected, retrying without extended fields...')
        const legacyPayload = { ...payload }
        delete legacyPayload.consultant_name_manual
        delete legacyPayload.effective_visit_date
        delete legacyPayload.acknowledged_at
        delete legacyPayload.acknowledged_by
        delete legacyPayload.next_cycle_goal
        
        const { error: retryError } = await supabase.from('consulting_visits').upsert(legacyPayload, { onConflict: 'client_id,visit_number' })
        if (retryError) throw retryError
      } else if (error) {
        throw error
      }

      toast.success(complete ? 'Etapa Concluída com Sucesso!' : 'Progresso salvo'); refetch()
      if (complete) navigate(`/consultoria/clientes/${client?.slug}`)
    } catch (err: any) { 
      console.error(err)
      toast.error('Erro ao salvar: ' + err.message) 
    } finally { setIsSaving(false) }
  }

  const handleAcknowledge = async () => {
    if (!visit?.id) return
    try {
      const { error } = await supabase.from('consulting_visits').update({ 
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: profile?.id 
      }).eq('id', visit.id)
      
      if (error && (error.code === 'PGRST204' || error.message.includes('acknowledged_at'))) {
         toast.error('Sistema em atualização: Coluna de assinatura ainda não disponível no banco de dados.')
         return
      }
      
      if (error) throw error
      toast.success('Visita assinada/confirmada pelo gestor!')
      
      try {
        supabase.functions.invoke('send-visit-report', {
          body: { visitId: visit.id }
        })
      } catch (e) {
        console.warn('Silent fail on email trigger:', e)
      }

      refetch()
    } catch (err: any) { toast.error(err.message) }
  }

  const generateReportText = () => {
    const safeSales = quantData?.sales || []
    const safeMarketing = quantData?.marketing || { investment: 0, leads: 0, origin: [] }
    const safeStock = quantData?.stock || { qty: 0, avg_price: 0, fipe_delta: 0, mileage: 0, total_inv: 0 }
    
    const totalSales = safeSales.reduce((acc: number, s: any) => acc + (s.value || 0), 0)
    const cpl = safeMarketing.leads > 0 ? (safeMarketing.investment / safeMarketing.leads).toFixed(2) : '0.00'

    return `📍 RELATÓRIO DE VISITA ${visitNum}: ${step?.objective?.toUpperCase()}

--- CABEÇALHO BASE ---
Consultor: ${headerBase.consultant_name}
Data: ${headerBase.visit_date ? new Date(headerBase.visit_date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
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

--- OBJETIVO PRÓXIMO CICLO ---
${nextCycleGoal || '(A definir)'}

Gerado via MX PERFORMANCE`
  }

  const handleDownloadPDF = async () => {
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

  if (clientLoading || methodologyLoading) return <div className="flex w-full items-center justify-center p-mx-20"><Loader2 className="w-mx-8 h-mx-8 animate-spin text-brand-primary" /></div>

  if (!client) return <div className="p-mx-20 text-center opacity-50"><Typography variant="h3">Cliente não localizado.</Typography></div>

  return (
    <div className="w-full pb-mx-xl relative z-0">
      <div className="fixed -left-[2000px] top-0 overflow-hidden pointer-events-none">
         <div id="report-template-render">
            <VisitReportTemplate 
              client={client} 
              visit={visit ? { ...visit, next_cycle_goal: nextCycleGoal, attachments } as any : { visit_number: visitNum, next_cycle_goal: nextCycleGoal, attachments } as any} 
              headerBase={headerBase} 
              quantData={quantData} 
            />
         </div>
      </div>
      
      <div className="sticky top-0 z-40 bg-surface-alt/80 backdrop-blur-md px-mx-md py-mx-sm flex flex-col md:flex-row md:items-center justify-between gap-mx-sm mb-mx-md print:hidden border-b border-border-subtle shadow-mx-sm">
        <div className="flex items-center gap-mx-md">
          <Link to={`/consultoria/clientes/${client?.slug}`} className="p-mx-xs border border-border-subtle rounded-mx-lg hover:bg-surface-alt/50 transition-colors text-text-secondary bg-white shadow-mx-sm">
            <ArrowLeft className="w-mx-5 h-mx-5" />
          </Link>
          <div>
            <div className="flex items-center gap-mx-xs">
               <Typography variant="h1" className="text-xl text-black">Visita {visitNum}</Typography>
               <Badge variant={visit?.status === 'concluída' ? 'success' : 'warning'} className="text-mx-micro h-mx-5 uppercase font-black tracking-widest">{visit?.status || 'EM ABERTO'}</Badge>
            </div>
            <Typography variant="tiny" tone="muted" className="font-black tracking-mx-widest uppercase">{step?.objective}</Typography>
          </div>
        </div>

        <div className="flex items-center gap-mx-sm w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none h-mx-10 text-sm font-bold bg-white" onClick={() => handleSave(false)} loading={isSaving}>SALVAR</Button>
          <div className="relative flex-1 md:flex-none">
            <Button 
              variant="primary" 
              className={cn("w-full md:w-auto h-mx-10 text-sm font-bold shadow-sm transition-all", !hasRequiredEvidence ? "opacity-70 grayscale" : "")} 
              onClick={() => handleSave(true)} 
              loading={isSaving}
              icon={!hasRequiredEvidence ? <AlertCircle className="w-mx-4 h-mx-4" /> : <CheckCircle2 className="w-mx-4 h-mx-4" />}
            >
              CONCLUIR
            </Button>
            {!hasRequiredEvidence && step?.evidence_required && (
              <span className="absolute -top-1 -right-1 flex h-mx-4 w-mx-4 animate-pulse">
                <span className="relative inline-flex rounded-mx-full h-mx-4 w-mx-4 bg-status-error items-center justify-center text-mx-micro text-white font-black">!</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-mx-md lg:px-mx-xl grid grid-cols-1 lg:grid-cols-3 gap-mx-lg print:block print:p-0">
        
        <div className="lg:col-span-2 space-y-mx-lg">
          
          <VisitHeaderBase 
            data={headerBase} 
            onChange={(u) => setHeaderBase(prev => ({ ...prev, ...u }))} 
            clientName={client.name} 
          />

          <Card className="p-mx-lg border border-border-default shadow-mx-md rounded-mx-2xl bg-white overflow-hidden">
             <div className="flex items-center gap-mx-sm mb-mx-lg border-b border-border-subtle pb-mx-md">
                <div className="p-mx-xs bg-brand-primary/10 rounded-mx-lg text-brand-primary"><ClipboardCheck size={20} /></div>
                <Typography variant="h3" className="text-lg uppercase font-black tracking-widest">Execução Metodológica</Typography>
             </div>
             
             {visitNum === 1 && <VisitOneHighFidelity clientId={clientId!} clientSlug={clientSlug!} data={quantData} onChange={setQuantData} />}
             {visitNum === 2 && <VisitTwoExecution clientId={clientId!} clientSlug={clientSlug!} />}
             {visitNum === 3 && <VisitThreeExecution />}
             {visitNum === 4 && <VisitFourExecution storeId={resolvedStoreId} onGenerateSummary={(t) => setExecutiveSummary(prev => prev + '\n' + t)} />}
             {visitNum === 5 && <VisitFiveExecution onGenerateSummary={(t) => setExecutiveSummary(prev => prev + '\n' + t)} />}
             {visitNum === 6 && <VisitSixExecution clientId={clientId!} clientSlug={clientSlug!} onGenerateSummary={(t) => setExecutiveSummary(prev => prev + '\n' + t)} />}
             {visitNum === 7 && <VisitSevenExecution storeId={resolvedStoreId} onGenerateSummary={(t) => setExecutiveSummary(prev => prev + '\n' + t)} />}
             {visitNum === 8 && <VisitEightExecution clientId={clientId!} clientSlug={clientSlug!} />}
             {visitNum === 9 && <VisitNineExecution financials={client.financials || []} onGenerateSummary={(t) => setExecutiveSummary(prev => prev + '\n' + t)} />}

             <div className="mt-mx-lg pt-mx-lg border-t border-border-subtle">
                <Typography variant="tiny" tone="muted" className="mb-mx-sm block font-black tracking-mx-widest uppercase">Checklist de Tarefas</Typography>
                <VisitChecklist items={checklist} onToggle={handleToggleCheck} />
             </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
            <Card className="p-mx-lg border border-border-default shadow-mx-md rounded-mx-2xl bg-white">
              <div className="flex items-center gap-mx-sm mb-mx-md">
                <FileText className="w-mx-5 h-mx-5 text-text-secondary" />
                <Typography variant="h3" className="text-lg uppercase font-black tracking-widest">Relato Executivo (CRM)</Typography>
              </div>
              <Textarea 
                value={executiveSummary} 
                onChange={(e) => setExecutiveSummary(e.target.value)} 
                placeholder="Insira o diagnóstico profundo, as decisões tomadas e os planos de ação acordados..." 
                className="min-h-mx-64 text-sm bg-surface-alt/30 border border-border-default focus:border-brand-primary focus:bg-white rounded-mx-xl p-mx-md shadow-mx-inner resize-y transition-colors mb-mx-md font-medium" 
              />
              <VisitActionQuickAdd clientId={clientId!} visitNumber={visitNum} />
            </Card>

            <div className="space-y-mx-lg">
              <Card className="p-mx-lg border border-border-default shadow-mx-md rounded-mx-2xl bg-white">
                <div className="flex items-center gap-mx-sm mb-mx-md">
                  <MessageSquare className="w-mx-5 h-mx-5 text-text-secondary" />
                  <Typography variant="h3" className="text-lg uppercase font-black tracking-widest">Feedback ao Cliente</Typography>
                </div>
                <Textarea 
                  value={feedbackClient} 
                  onChange={(e) => setFeedbackClient(e.target.value)} 
                  placeholder="Pontos de atenção emergenciais..." 
                  className="min-h-mx-20 text-sm font-medium bg-white border border-border-default focus:border-brand-primary shadow-sm resize-y rounded-mx-xl p-mx-md" 
                />
              </Card>

              <Card className="p-mx-lg border border-border-default shadow-mx-md rounded-mx-2xl bg-white">
                <div className="flex items-center gap-mx-sm mb-mx-md">
                  <Target className="w-mx-5 h-mx-5 text-status-warning" />
                  <Typography variant="h3" className="text-lg uppercase font-black tracking-widest text-status-warning">Objetivo Próximo Ciclo</Typography>
                </div>
                <Textarea 
                  value={nextCycleGoal} 
                  onChange={(e) => setNextCycleGoal(e.target.value)} 
                  placeholder="O que deve ser o foco da loja até a próxima visita da consultoria?" 
                  className="min-h-mx-20 text-sm font-bold bg-status-warning/5 border-status-warning/20 focus:border-status-warning shadow-mx-inner resize-y rounded-mx-xl p-mx-md" 
                />
              </Card>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-mx-lg print:hidden">
          <Card className="p-mx-lg border border-border-default shadow-mx-md rounded-mx-2xl bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-mx-md opacity-mx-5"><Info size={80} /></div>
            <Typography variant="tiny" tone="muted" className="mb-mx-md block tracking-mx-widest text-mx-micro uppercase font-black">Informações da Etapa</Typography>
            <div className="space-y-mx-md">
              <div className="p-mx-md bg-surface-alt rounded-mx-xl border border-border-subtle">
                <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-micro mb-1">Participantes</Typography>
                <Typography variant="p" className="text-sm font-bold text-black">{step?.target || 'Todos'}</Typography>
              </div>
              <div className="p-mx-md bg-surface-alt rounded-mx-xl border border-border-subtle">
                <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-micro mb-1">Duração Estimada</Typography>
                <div className="flex items-center gap-mx-xs">
                   <Clock className="w-mx-4 h-mx-4 text-text-tertiary" />
                   <Typography variant="p" className="text-sm font-bold text-black">{step?.duration || '4 horas'}</Typography>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-mx-lg border border-border-default shadow-mx-md rounded-mx-2xl bg-white">
            <div className="flex items-center justify-between mb-mx-md">
               <Typography variant="tiny" tone="muted" className="tracking-mx-widest text-mx-micro uppercase font-black">Evidências ({attachments.length})</Typography>
               <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,application/pdf" />
               <Button size="xs" variant="secondary" onClick={() => fileInputRef.current?.click()} loading={isUploading} className="h-mx-8 font-black uppercase text-mx-micro tracking-widest" icon={<Plus size={12} />}>ADICIONAR</Button>
            </div>
            
            {attachments.length === 0 ? (
               <div className="p-mx-md border border-dashed border-border-subtle rounded-mx-xl text-center opacity-50">
                  <Paperclip className="w-mx-6 h-mx-6 mx-auto mb-mx-xs text-text-tertiary" />
                  <Typography variant="tiny" className="font-bold uppercase text-mx-micro">Nenhuma evidência anexada.</Typography>
               </div>
            ) : (
               <div className="space-y-mx-md">
                  {attachments.map(att => (
                     <div key={att.id} className="group p-mx-xs bg-surface-alt rounded-mx-xl border border-border-default flex items-center justify-between hover:bg-white transition-colors shadow-sm">
                        <div className="flex items-center gap-mx-sm min-w-0">
                           <div className="w-mx-10 h-mx-10 rounded-mx-lg bg-white flex items-center justify-center border border-border-subtle shadow-sm shrink-0">
                              {att.content_type?.includes('image') ? <Image className="w-mx-5 h-mx-5 text-brand-primary" /> : <FileText className="w-mx-5 h-mx-5 text-text-tertiary" />}
                           </div>
                           <div className="min-w-0">
                              <Typography variant="p" className="text-xs font-bold truncate max-w-[120px] text-black">{att.filename}</Typography>
                              <Typography variant="tiny" className="opacity-50 text-mx-micro">{formatFileSize(att.size_bytes)}</Typography>
                           </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-mx-8 w-mx-8 opacity-0 group-hover:opacity-100 text-status-error" onClick={() => handleDeleteAttachment(att)} icon={<Trash2 size={14} />} />
                     </div>
                  ))}
               </div>
            )}
            
            {step?.evidence_required && (
               <div className="mt-mx-md p-mx-md bg-status-error/5 border border-status-error/20 rounded-mx-xl flex gap-mx-sm">
                  <ShieldAlert className="w-mx-5 h-mx-5 text-status-error shrink-0" />
                  <Typography variant="tiny" className="text-status-error font-black leading-tight uppercase tracking-tighter">OBRIGATÓRIO: {step.evidence_required}</Typography>
               </div>
            )}
          </Card>

          <Card className="p-mx-lg bg-white border border-border-default shadow-mx-md rounded-mx-2xl text-center">
             <div className="w-mx-12 h-mx-12 bg-brand-primary/10 rounded-mx-full flex items-center justify-center mx-auto mb-mx-md">
               <Presentation className="w-mx-6 h-mx-6 text-brand-primary" />
             </div>
             <Typography variant="h3" className="text-lg mb-mx-xs uppercase font-black">Reporte Oficial MX</Typography>
             <Typography variant="p" className="text-mx-micro text-text-tertiary mb-mx-lg leading-tight uppercase font-bold tracking-tighter">O relatório compila os dados e o diagnóstico da visita.</Typography>
             <div className="space-y-mx-md">
               <Button className="w-full shadow-mx-md font-black h-mx-11 uppercase tracking-widest text-xs" variant="primary" icon={<Eye size={14} />} onClick={() => setShowReportModal(true)}>VER RELATÓRIO</Button>
               
               {visit?.status === 'concluída' && (
                 <Button 
                   className={cn("w-full shadow-mx-md font-black h-mx-11 uppercase tracking-widest text-xs", (visit as any).acknowledged_at ? "bg-status-success/10 text-status-success border-status-success/20 hover:bg-status-success/20" : "")} 
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
        </div>
      </div>

      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="DOCUMENTO DE AUDITORIA">
         <div className="p-mx-md">
            <div className="p-mx-lg bg-surface-alt rounded-mx-2xl font-mono text-xs whitespace-pre-wrap border border-border-subtle max-h-mx-96 overflow-y-auto mb-mx-md">
               <div className="relative z-10 text-text-primary">{generateReportText()}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
               <Button className="h-mx-11 text-sm font-black border-border-default shadow-mx-sm bg-white uppercase tracking-widest" variant="outline" onClick={() => window.print()} icon={<Printer className="w-mx-4 h-mx-4" />}>IMPRIMIR PDF</Button>
               <Button className="h-mx-11 text-sm font-black bg-[#25D366] hover:bg-[#20bd5a] text-white border-none shadow-mx-md uppercase tracking-widest" onClick={() => { const t = encodeURIComponent(generateReportText()); window.open(`https://wa.me/?text=${t}`) }} icon={<Share2 className="w-mx-4 h-mx-4" />}>Enviar WhatsApp</Button>
               <Button variant="secondary" className="h-mx-11 text-sm font-black bg-brand-primary text-white border-none shadow-mx-lg col-span-1 sm:col-span-2 uppercase tracking-widest" onClick={handleDownloadPDF} icon={<Download className="w-mx-4 h-mx-4" />}>BAIXAR PDF OFICIAL (A4)</Button>
            </div>
         </div>
      </Modal>
    </div>
  )
}
