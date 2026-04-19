import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, CheckCircle2, Circle, Save, FileText, Send,
  AlertCircle, Info, Building2, User2, Calendar,
  Plus, Trash2, Download, Loader2, Paperclip, Image,
  ChevronDown, ChevronUp, ClipboardCheck, LayoutDashboard, Copy, Sparkles,
  BookOpen, ExternalLink, Target, Clock, MessageSquare, BarChart3, Users, Zap,
  TrendingUp, Timer, ShieldAlert, Award, Presentation, Rocket, Star,
  Smartphone, Eye, Printer, Share2, Calculator, PieChart, ShieldCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Textarea } from '@/components/atoms/Textarea'
import { Input } from '@/components/atoms/Input'
import { useConsultingClientDetail, useConsultingMethodology } from '@/hooks/useConsultingClients'
import { usePmrDiagnostics } from '@/hooks/usePmrDiagnostics'
import { useAuth } from '@/hooks/useAuth'
import { useFeedbacks, usePDIs } from '@/hooks/useData'
import { useConsultingStrategicPlan } from '@/hooks/useConsultingStrategicPlan'
import type { ConsultingVisitAttachment, PmrFormField } from '@/features/consultoria/types'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/organisms/Modal'

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
  const [attachments, setAttachments] = useState<ConsultingVisitAttachment[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  const [headerBase, setHeaderBase] = useState({
    meta_mensal: '',
    projecao: '',
    leads_mes: '',
    estoque_disponivel: '',
    consultant_name: '',
    visit_date: new Date().toISOString().split('T')[0]
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
        visit_date: (visit as any).effective_visit_date || new Date().toISOString().split('T')[0]
      })
    } else if (step) {
      const initialChecklist = (step.checklist_template || []).map(item => ({ 
        task: typeof item === 'string' ? item : (item as any).task, 
        completed: (item as any).completed || false 
      }))
      setChecklist(initialChecklist)
      setHeaderBase(prev => ({ ...prev, consultant_name: user?.name || '' }))
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
        effective_visit_date: headerBase.visit_date
      }
      const { error } = await supabase.from('consulting_visits').upsert(payload, { onConflict: 'client_id,visit_number' })
      if (error) throw error
      toast.success(complete ? 'Visita concluída!' : 'Progresso salvo!')
      refetch()
      if (complete) navigate(`/consultoria/clientes/${clientId}`)
    } catch (err: any) { toast.error(err.message) } finally { setIsSaving(false) }
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
      toast.success('Arquivos enviados!'); refetch()
    } catch (err: any) { toast.error(err.message) } finally { setIsUploading(false) }
  }

  if (clientLoading || methodologyLoading) return <div className="min-h-screen flex items-center justify-center bg-mx-bg"><Loader2 className="w-10 h-10 animate-spin text-brand-primary" /></div>
  if (!client || !step) return <div className="min-h-screen flex items-center justify-center bg-mx-bg"><Card className="p-8 text-center max-w-md"><AlertCircle className="w-12 h-12 text-mx-error mx-auto mb-4" /><Typography variant="h2">Não encontrado</Typography><Link to={`/consultoria/clientes/${clientId}`}><Button className="mt-4">Voltar</Button></Link></Card></div>

  return (
    <main className="min-h-screen bg-mx-bg pb-20">
      <header className="bg-white border-b border-mx-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/consultoria/clientes/${clientId}`} className="p-2 hover:bg-mx-bg-secondary rounded-full transition-all"><ArrowLeft className="w-5 h-5" /></Link>
            <div><Typography variant="h3" className="text-brand-secondary font-black italic">Visita {visitNum}: {step.objective.toUpperCase()}</Typography><Badge variant={visit?.status === 'concluída' ? 'success' : 'warning'} className="font-bold">{visit?.status === 'concluída' ? 'CONCLUÍDA' : 'EM EXECUÇÃO'}</Badge></div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" icon={<Save />} onClick={() => handleSave(false)} loading={isSaving}>Salvar</Button>
            <Button variant="primary" size="sm" icon={<CheckCircle2 />} onClick={() => handleSave(true)} loading={isSaving}>Concluir</Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <VisitHeaderBase clientName={client.name} data={headerBase} onChange={setHeaderBase} />
          
          {visitNum === 1 && <VisitOneDiagnostic visitId={visit?.id} templates={templates} responsesByTemplate={responsesByTemplate} onSaveResponse={saveResponse} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
          {visitNum === 2 && <VisitTwoExecution clientId={clientId!} />}
          {visitNum === 3 && <VisitThreeExecution />}
          {visitNum === 4 && <VisitFourExecution clientId={clientId!} storeId={client.store_id || ''} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
          {visitNum === 5 && <VisitFiveExecution onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
          {visitNum === 6 && <VisitSixExecution clientId={clientId!} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
          {visitNum === 7 && <VisitSevenExecution clientId={clientId!} storeId={client.store_id || ''} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}
          {visitNum === 8 && <VisitEightExecution clientId={clientId!} />}
          {visitNum === 9 && <VisitNineExecution financials={client.financials || []} onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)} />}

          <Card className="p-6 shadow-mx-md">
            <div className="flex items-center gap-2 mb-6"><ClipboardCheck className="w-5 h-5 text-brand-primary" /><Typography variant="h3">Checklist Mandatório</Typography></div>
            <div className="space-y-4">{checklist.map((item, idx) => (<div key={idx} className={cn("flex items-start gap-3 p-4 rounded-xl border cursor-pointer", item.completed ? "bg-brand-primary/5 border-brand-primary/20" : "bg-white border-mx-border")} onClick={() => handleToggleCheck(idx)}><div className="mt-0.5">{item.completed ? <CheckCircle2 className="w-5 h-5 text-brand-primary" /> : <Circle className="w-5 h-5 text-mx-muted" />}</div><Typography variant="body" className={cn("flex-1", item.completed && "line-through text-mx-muted")}>{item.task}</Typography></div>))}</div>
          </Card>

          <Card className="p-6 shadow-mx-md">
            <div className="flex items-center justify-between mb-4"><Typography variant="h3">Relato da Visita (CRM)</Typography><FileText className="w-5 h-5 opacity-20" /></div>
            <Textarea value={executiveSummary} onChange={(e) => setExecutiveSummary(e.target.value)} placeholder="Descreva aqui o cenário base, o que foi coletado e as decisões tomadas..." className="min-h-[250px] font-mono text-sm leading-relaxed bg-mx-bg-secondary/30" />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-t-8 border-brand-secondary bg-brand-secondary text-white shadow-mx-lg">
            <Typography variant="h4" tone="white" className="mb-4 font-black">RELATÓRIO PADRÃO MX</Typography>
            <Button className="w-full bg-white text-brand-secondary font-black h-12 shadow-lg" icon={<Presentation />} onClick={() => setShowReportModal(true)}>GERAR DOCUMENTO</Button>
          </Card>
          <Card className="p-6 border-t-4 border-brand-secondary shadow-mx-md"><div className="flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5 text-brand-secondary" /><Typography variant="h4">Manuais PMR</Typography></div><div className="space-y-2">{['Manual_Gestor_AltaPerformance', 'Manual_Vendedor_AltaPerformance', 'SISTEMA DE GESTÃO DE ALTA PERFORMANCE apresentação'].map(f => (<Button key={f} variant="ghost" size="sm" className="w-full justify-start text-xs h-10 font-bold" onClick={() => window.open(`/ARQUIVOS_MX/${f}.pdf`, '_blank')}><FileText className="w-4 h-4 mr-2" /> {f.replace(/_/g, ' ').toUpperCase()}</Button>))}</div></Card>
          <Card className="p-6 shadow-mx-md"><Typography variant="h4" className="mb-4 uppercase text-xs font-black">Informações</Typography><div className="space-y-4"><div><Typography variant="tiny" tone="muted" className="uppercase tracking-wider">Alvo</Typography><Typography variant="body" className="font-bold">{step.target}</Typography></div><div><Typography variant="tiny" tone="muted" className="uppercase tracking-wider">Duração</Typography><Typography variant="body" className="font-bold">{step.duration}</Typography></div></div></Card>
        </div>
      </div>

      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="Relatório de Visita - PMR" size="xl">
         <div className="p-8 space-y-6">
            <Card className="p-8 bg-mx-bg-secondary font-mono text-sm leading-relaxed whitespace-pre-wrap select-all border-2 border-dashed border-mx-muted/30">
{`📍 VISITA ${visitNum}: ${step.objective.toUpperCase()}

CABEÇALHO:
Consultor: ${headerBase.consultant_name} | Data: ${new Date(headerBase.visit_date).toLocaleDateString('pt-BR')}
Meta: ${headerBase.meta_mensal} | Projeção: ${headerBase.projecao} | Leads: ${headerBase.leads_mes} | Estoque: ${headerBase.estoque_disponivel}

RESUMO:
${executiveSummary || '(Pendente)'}

--- GERADO VIA MX PERFORMANCE CRM ---`}
            </Card>
            <div className="flex gap-4">
               <Button className="flex-1 h-12 font-black" icon={<Copy />} onClick={() => { navigator.clipboard.writeText(executiveSummary); toast.success('Copiado!') }}>COPIAR RELATO</Button>
               <Button className="flex-1 h-12 font-black bg-mx-green-600" icon={<Share2 />} onClick={() => { const text = encodeURIComponent(`*RELATÓRIO VISITA ${visitNum}*\n\n${executiveSummary}`); window.open(`https://wa.me/?text=${text}`) }}>ENVIAR WHATSAPP</Button>
            </div>
         </div>
      </Modal>
    </main>
  )
}

function VisitHeaderBase({ clientName, data, onChange }: any) {
  return (
    <Card className="p-6 border-l-8 border-brand-primary shadow-mx-md bg-white">
      <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><Building2 className="w-7 h-7 text-brand-primary" /><Typography variant="h3" className="font-black uppercase tracking-tighter">Cabeçalho Mandatório</Typography></div><Badge variant="outline" className="font-black">{clientName.toUpperCase()}</Badge></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1"><Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Consultor</Typography><Input value={data.consultant_name} onChange={e => onChange({ ...data, consultant_name: e.target.value })} className="h-11 font-bold border-2 focus:border-brand-primary" /></div>
        <div className="space-y-1"><Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Data Efetiva</Typography><Input type="date" value={data.visit_date} onChange={e => onChange({ ...data, visit_date: e.target.value })} className="h-11 font-bold border-2 focus:border-brand-primary" /></div>
        <div className="space-y-1"><Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Meta Mensal</Typography><Input value={data.meta_mensal} onChange={e => onChange({ ...data, meta_mensal: e.target.value })} placeholder="Ex: 25" className="h-11 font-bold border-2" /></div>
        <div className="space-y-1"><Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Projeção</Typography><Input value={data.projecao} onChange={e => onChange({ ...data, projecao: e.target.value })} className="h-11 font-bold border-2" /></div>
        <div className="space-y-1"><Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Leads Mês</Typography><Input value={data.leads_mes} onChange={e => onChange({ ...data, leads_mes: e.target.value })} className="h-11 font-bold border-2" /></div>
        <div className="space-y-1"><Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Estoque</Typography><Input value={data.estoque_disponivel} onChange={e => onChange({ ...data, estoque_disponivel: e.target.value })} className="h-11 font-bold border-2" /></div>
      </div>
    </Card>
  )
}

function VisitOneDiagnostic({ visitId, templates, responsesByTemplate, onSaveResponse, onGenerateSummary }: any) {
  const [tab, setTab] = useState<'gerente' | 'dono' | 'vendedor' | 'processo'>('gerente')
  const [form, setForm] = useState<Record<string, any>>({}); const [name, setName] = useState(''); const [loading, setLoading] = useState(false)
  const current = templates.find((t: any) => t.form_key === tab); const responses = current ? (responsesByTemplate.get(current.id) || []) : []

  // FORMULÁRIOS COMPLETOS - MAPEAMENTO EXAUSTIVO DOS LINKS GOOGLE
  const sellerFields = [
    { key: 'funcao', label: 'Função atual', type: 'select', options: ["Vendedor", "Pré-vendedor / Lead manager", "Marketing", "Outro"] },
    { key: 'tempo_mercado', label: 'Tempo de mercado (anos)', type: 'number' },
    { key: 'limitador', label: 'Principal limitador hoje para você vender mais?', type: 'textarea' },
    { key: 'crm', label: 'Uso do CRM e Gestão de Funil (1-5)', type: 'scale' },
    { key: 'online', label: 'Qualidade do Atendimento Online (1-5)', type: 'scale' },
    { key: 'presencial', label: 'Qualidade do Atendimento Presencial (1-5)', type: 'scale' },
    { key: 'conv', label: 'Conversão de Leads em Agendamentos (1-5)', type: 'scale' },
    { key: 'indicacao', label: 'Canal de Vendas – Indicação (1-5)', type: 'scale' },
    { key: 'carteira', label: 'Canal de Vendas – Carteira (1-5)', type: 'scale' },
    { key: 'cultura', label: 'Cultura de Resultado (1-5)', type: 'scale' },
    { key: 'clima', label: 'Clima e Motivação (1-5)', type: 'scale' },
    { key: 'remuneracao', label: 'Satisfação com Plano de Remuneração (1-5)', type: 'scale' }
  ]

  const managerFields = [
    { key: 'tempo_gerencia', label: 'Tempo como gerente nesta loja?', type: 'select', options: ["Menos de 6 meses", "Entre 6 meses e 1 ano", "Entre 1 e 3 anos", "Mais de 3 anos"] },
    { key: 'lideranca_ant', label: 'Já atuou em cargos de liderança antes?', type: 'boolean' },
    { key: 'vendedor_ant', label: 'Já atuou como vendedor antes?', type: 'boolean' },
    { key: 'qtd_vendedores', label: 'Quantos vendedores sob sua liderança?', type: 'number' },
    { key: 'metas', label: 'Metas claras para a equipe (1-5)', type: 'scale' },
    { key: 'leads', label: 'Acompanhamento de leads (1-5)', type: 'scale' },
    { key: 'rotina', label: 'Rotina gerencial estruturada (1-5)', type: 'scale' },
    { key: 'autonomia', label: 'Autonomia Gerencial e Preço (1-5)', type: 'scale' },
    { key: 'treinamento', label: 'Processo de Treinamento da Equipe (1-5)', type: 'scale' },
    { key: 'sinergia', label: 'Sinergia entre Equipe e Gerente (1-5)', type: 'scale' }
  ]

  const ownerFields = [
    { key: 'visao', label: 'Visão Macro e Potencial do Negócio', type: 'textarea' },
    { key: 'estagio', label: 'Em qual fase você enxerga a empresa hoje?', type: 'select', options: ["Sobrevivência", "Intermediário / Crescimento", "Escala / Boa Prática"] },
    { key: 'cultura_desejada', label: 'Qual a cultura que você deseja para sua empresa?', type: 'textarea' },
    { key: 'vendas_dono', label: 'Todas as negociações passam pelo dono?', type: 'boolean' },
    { key: 'reunioes', label: 'Existem reuniões periódicas com o time?', type: 'boolean' },
    { key: 'dependencia', label: 'Dependência do Dono (1-5)', type: 'scale' },
    { key: 'alinhamento', label: 'Alinhamento e Sinergia Societária (1-5)', type: 'scale' },
    { key: 'clareza', label: 'Clareza Estratégica (1-5)', type: 'scale' },
    { key: 'longa_prazo', label: 'Visão de Longo Prazo (1-5)', type: 'scale' }
  ]

  const processFields = [
    { key: 'tempo_usado', label: 'Avaliação de Usado: Tempo médio real (minutos)', type: 'number' },
    { key: 'vendedor_negocia', label: 'Vendedor negocia a troca diretamente?', type: 'boolean' },
    { key: 'limite_desconto', label: 'Política de Preço: Limite de desconto do gerente (R$)', type: 'text' },
    { key: 'pos_venda', label: 'Existe um responsável único pelo Pós-venda?', type: 'boolean' },
    { key: 'crm_inbox', label: 'CRM funciona apenas como caixa de entrada?', type: 'boolean' },
    { key: 'trafego', label: 'Estratégia de Tráfego Pago e Leads (1-5)', type: 'scale' },
    { key: 'insta', label: 'Instagram: Frequência, Qualidade e Inovação (1-5)', type: 'scale' },
    { key: 'preparacao', label: 'Processo de Preparação de Veículos (1-5)', type: 'scale' },
    { key: 'estoque_90', label: 'Gestão de Veículos +90 dias no Estoque (1-5)', type: 'scale' },
    { key: 'precificacao', label: 'Processo de Precificação e Margem (1-5)', type: 'scale' },
    { key: 'info', label: 'Controle da Informação da Origem das Vendas (1-5)', type: 'scale' },
    { key: 'conflitos', label: 'Conflitos Estruturais e Governança (1-5)', type: 'scale' }
  ]

  const activeFields = tab === 'vendedor' ? sellerFields : tab === 'gerente' ? managerFields : tab === 'dono' ? ownerFields : processFields

  const handleSave = async () => { if (!name) return toast.error('Nome obrigatório'); setLoading(true); try { await onSaveResponse({ template_id: current.id, respondent_name: name, respondent_role: current.target_role, answers: form, visit_id: visitId }); toast.success('Coletado!'); setForm({}); setName('') } finally { setLoading(false) } }
  const handleGen = () => { let s = `\n--- DIAGNÓSTICO: ${tab.toUpperCase()} (${name}) ---\n`; activeFields.forEach((f: any) => { const v = form[f.key]; if (v !== undefined) s += `• ${f.label}: ${typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : v}\n` }); onGenerateSummary(s); toast.success('Adicionado!') }

  return (<Card className=\"p-0 overflow-hidden shadow-mx-lg border-2 border-mx-border\"><div className=\"bg-brand-secondary p-6 text-white flex justify-between items-center\"><div><Typography variant=\"h3\" tone=\"white\" className=\"font-black uppercase\">📍 VISITA 1: Diagnóstico Integrado</Typography></div><Sparkles className=\"text-brand-primary\" /></div><div className=\"flex bg-mx-bg-secondary\">{['gerente', 'dono', 'vendedor', 'processo'].map((t: any) => (<button key={t} onClick={() => setTab(t as any)} className={cn(\"flex-1 py-4 text-xs font-black border-b-4 transition-all\", tab === t ? \"border-brand-primary bg-white text-brand-primary\" : \"border-transparent opacity-40 hover:opacity-100\")}>{t.toUpperCase()}</button>))}</div><div className=\"p-8\">{current ? (<div className=\"space-y-6\"><div className=\"p-6 bg-mx-bg-secondary rounded-2xl border-2 border-mx-border shadow-inner\"><Typography variant=\"tiny\" tone=\"muted\" className=\"mb-2 font-black uppercase tracking-widest\">Nome do Entrevistado *</Typography><Input value={name} onChange={e => setName(e.target.value)} className=\"h-12 text-lg font-bold border-2 focus:border-brand-primary bg-white mb-6\" /><div className=\"grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4\">{activeFields.map((f: any) => (<div key={f.key} className={cn(f.type === 'textarea' && \"md:col-span-2\")}>{f.type === 'scale' ? (<div className=\"space-y-1\"><Typography variant=\"tiny\" className=\"font-bold uppercase text-[10px]\">{f.label}</Typography><div className=\"flex gap-2\">{[1,2,3,4,5].map(v => (<button key={v} onClick={() => setForm(p => ({ ...p, [f.key]: v }))} className={cn(\"w-11 h-11 rounded-lg border-2 font-black transition-all\", form[f.key] === v ? \"bg-brand-primary text-white border-brand-primary scale-110 shadow-lg\" : \"bg-white hover:border-brand-primary/30 text-mx-muted\")}>{v}</button>))}</div></div>) : f.type === 'boolean' ? (<div className=\"space-y-1\"><Typography variant=\"tiny\" className=\"font-bold uppercase text-[10px]\">{f.label}</Typography><div className=\"flex gap-4\"><Button size=\"sm\" variant={form[f.key] === true ? 'primary' : 'outline'} onClick={() => setForm(p => ({...p, [f.key]: true}))}>SIM</Button><Button size=\"sm\" variant={form[f.key] === false ? 'primary' : 'outline'} onClick={() => setForm(p => ({...p, [f.key]: false}))}>NÃO</Button></div></div>) : f.type === 'select' ? (<div className=\"space-y-1\"><Typography variant=\"tiny\" className=\"font-bold uppercase text-[10px]\">{f.label}</Typography><select className=\"w-full h-11 px-4 rounded-xl border-2 bg-white font-bold\" value={form[f.key] || ''} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}><option value=\"\">Selecione...</option>{f.options.map((o:any) => <option key={o} value={o}>{o}</option>)}</select></div>) : <Input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} label={f.label} className=\"bg-white\" />}</div>))}</div><div className=\"flex gap-4 mt-8\"><Button className=\"flex-[2] h-14 font-black text-lg shadow-xl shadow-brand-primary/20\" onClick={handleSave} loading={loading}>SALVAR DADOS NO CRM</Button><Button variant=\"outline\" className=\"flex-1 h-14 border-2 font-black\" icon={<Sparkles />} onClick={handleGen}>GERAR RELATO</Button></div></div></div>) : <Loader2 className=\"animate-spin mx-auto\" />}</div></Card>)
}

function VisitTwoExecution({ clientId }: any) {
  const { latestPlan } = useConsultingStrategicPlan(clientId)
  return (<div className=\"space-y-6\"><Card className=\"p-0 overflow-hidden border-mx-error/30 shadow-mx-lg\"><div className=\"bg-mx-error p-6 text-white\"><div className=\"flex items-center gap-2 mb-2\"><AlertCircle className=\"w-7 h-7\" /><Typography variant=\"h3\" tone=\"white\" className=\"font-black uppercase\">🚨 TRAVA: Instalação do SGAP</Typography></div><Typography variant=\"body\" tone=\"white\" className=\"font-bold text-lg\">Sem o Acompanhamento Diário instalado no celular e a rotina validada, o trabalho não anda.</Typography></div></Card><div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\"><Card className=\"p-6 space-y-4 shadow-mx-md\"><div className=\"flex items-center gap-2\"><Zap className=\"w-5 h-5 text-brand-primary\" /><Typography variant=\"h3\">Implementação</Typography></div><div className=\"space-y-3\"><Button className=\"w-full justify-between h-14 text-md font-black\" variant=\"outline\" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=strategic`, '_blank')}><div className=\"flex items-center gap-3\"><Target className=\"w-5 h-5 text-brand-secondary\" />PLANEJAMENTO ESTRATÉGICO</div><ExternalLink className=\"w-4 h-4\" /></Button><Button className=\"w-full justify-between h-14 text-md font-black shadow-lg shadow-brand-primary/10\" variant=\"outline\" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=daily`, '_blank')}><div className=\"flex items-center gap-3\"><BarChart3 className=\"w-5 h-5 text-brand-primary\" />VALIDAR SGAP DIÁRIO</div><ExternalLink className=\"w-4 h-4\" /></Button></div></Card><Card className=\"p-6 bg-brand-secondary text-white shadow-mx-md\">{latestPlan ? <div className=\"text-center\"><CheckCircle2 className=\"w-10 h-10 mx-auto mb-3\" /><Typography variant=\"h3\" tone=\"white\">VALIDADO ✓</Typography></div> : <Typography variant=\"body\" tone=\"white\" className=\"text-center opacity-60\">Pendente de criação.</Typography>}</Card></div></div>)
}

function VisitThreeExecution() { return (<Card className=\"p-8 shadow-mx-lg\"><Typography variant=\"h3\" className=\"font-black mb-8\">RITUAL DE ROTINAS</Typography><div className=\"grid grid-cols-2 gap-8\"><div className=\"p-6 bg-mx-bg-secondary rounded-3xl border-2 font-bold\"><ul><li>• 09:30 Cobrar SGAP</li><li>• 10:30 Matinal</li><li>• 14:00 Auditoria CRM</li></ul></div><div className=\"p-6 bg-mx-bg-secondary rounded-3xl border-2 font-bold\"><ul><li>• Início Leads</li><li>• Manhã Agendamentos</li><li>• Tarde Atendimento</li></ul></div></div></Card>) }
function VisitFourExecution({ storeId, onGenerateSummary }: any) { const { createFeedback } = useFeedbacks(storeId); const [s, setS] = useState(false); const [v, setV] = useState(''); const [p, setP] = useState(''); const [a, setA] = useState(''); const save = async () => { if (!v) return toast.error('Vendedor?'); setS(true); try { await createFeedback({ seller_id: v, positives: p, attention_points: '...', action: a, store_id: storeId, week_reference: new Date().toISOString() }); onGenerateSummary(`--- FEEDBACK ---\nPositivos: ${p}\nAção: ${a}`); toast.success('Salvo!'); setP(''); setA('') } finally { setS(false) } }; return (<Card className=\"p-8 shadow-mx-xl\"><Typography variant=\"h3\" className=\"font-black uppercase mb-8\">Feedback Estruturado</Typography><div className=\"space-y-6\"><Input label=\"Vendedor ID\" value={v} onChange={e => setV(e.target.value)} /><Textarea label=\"Positivos\" value={p} onChange={e => setP(e.target.value)} /><Textarea label=\"Ação\" value={a} onChange={e => setA(e.target.value)} /><Button className=\"w-full h-16 font-black\" onClick={save} loading={s}>SALVAR NO SISTEMA</Button></div></Card>) }
function VisitFiveExecution({ onGenerateSummary }: any) { const [l, setL] = useState(''); const [a, setA] = useState(''); const conv = l && a ? ((parseInt(a)/parseInt(l))*100).toFixed(1) : '0'; return (<Card className=\"p-8\"><Typography variant=\"h3\" className=\"font-black mb-8\">Calculadora MKT</Typography><div className=\"grid grid-cols-3 gap-6\"><Input label=\"Leads\" type=\"number\" value={l} onChange={e => setL(e.target.value)} /><Input label=\"Agend.\" type=\"number\" value={a} onChange={e => setA(e.target.value)} /><div className=\"bg-brand-primary/10 rounded-xl flex items-center justify-center font-black text-2xl\">{conv}%</div></div><Button className=\"w-full h-12 font-black mt-8\" variant=\"outline\" onClick={() => onGenerateSummary(`--- MKT --- Conv: ${conv}%`)}>GERAR RELATO</Button></Card>) }
function VisitSixExecution({ clientId, onGenerateSummary }: any) { return (<Card className=\"p-8\"><Typography variant=\"h3\" className=\"font-black mb-6\">Processos Críticos</Typography><Button className=\"w-full h-14 font-black shadow-lg\" variant=\"outline\" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=action_plan`, '_blank')}>ATUALIZAR PLANO DE AÇÃO</Button></Card>) }
function VisitSevenExecution({ storeId, onGenerateSummary }: any) { const { createPDI } = usePDIs(storeId); const [s, setS] = useState(false); const [v, setV] = useState(''); const [o, setO] = useState(''); const save = async () => { if (!v) return toast.error('Vendedor?'); setS(true); try { await createPDI({ seller_id: v, objective: o, store_id: storeId, status: 'aberto' }); onGenerateSummary(`--- PDI --- Objetivo: ${o}`); toast.success('Salvo!'); setO('') } finally { setS(false) } }; return (<Card className=\"p-8 shadow-mx-xl\"><Typography variant=\"h3\" className=\"font-black mb-8\">Novo PDI</Typography><div className=\"space-y-6\"><Input label=\"Vendedor ID\" value={v} onChange={e => setV(e.target.value)} /><Textarea label=\"Objetivo\" value={o} onChange={e => setO(e.target.value)} /><Button className=\"w-full h-16 font-black bg-brand-secondary text-white\" onClick={save} loading={s}>SALVAR PDI</Button></div></Card>) }
function VisitEightExecution({ clientId }: any) { return (<Card className=\"p-8\"><Typography variant=\"h3\" className=\"font-black mb-6\">Ranking Performance</Typography><Button className=\"w-full h-14 font-black shadow-lg\" variant=\"outline\" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=daily`, '_blank')}>VER RANKING PERFORMANCE</Button></Card>) }
function VisitNineExecution({ financials, onGenerateSummary }: any) { const latest = financials[0] || {}; const roi = latest.roi || 0; return (<Card className=\"p-8 bg-mx-indigo-900 text-white shadow-mx-xl\"><Typography variant=\"h3\" tone=\"white\" className=\"font-black mb-8\">Encerramento Trimestral</Typography><div className=\"text-center mb-8\"><Typography variant=\"h1\" tone=\"white\" className=\"text-6xl font-black\">{roi}x</Typography><Typography variant=\"tiny\" tone=\"white\" className=\"opacity-40 uppercase\">ROI Líquido</Typography></div><div className=\"flex gap-4\"><Button className=\"flex-1 h-14 font-black bg-brand-primary\" onClick={() => onGenerateSummary(`--- FECHAMENTO ---\nROI: ${roi}x`)}>GERAR RELATO</Button></div></Card>) }
