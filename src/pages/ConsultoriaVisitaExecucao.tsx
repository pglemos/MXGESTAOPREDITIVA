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
  BarChart, LineChart, TrendingDown
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
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, LineChart as ReLineChart, Line
} from 'recharts'

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

  // Novos estados para Visita 1 (Quantitative & Benchmark)
  const [quantData, setQuantData] = useState<any>({
    sales: [ { month: 'Jan', value: 0 }, { month: 'Fev', value: 0 }, { month: 'Mar', value: 0 } ],
    marketing: { investment: 0, leads: 0, origin: [ { name: 'Internet', value: 40 }, { name: 'Porta', value: 30 }, { name: 'Indicação', value: 15 }, { name: 'Carteira', value: 15 } ] },
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
        visit_date: (visit as any).effective_visit_date || new Date().toISOString().split('T')[0]
      })
      if ((visit as any).quant_data) setQuantData((visit as any).quant_data)
    } else if (step) {
      setChecklist((step.checklist_template || []).map(item => ({ 
        task: typeof item === 'string' ? item : (item as any).task, 
        completed: (item as any).completed || false 
      })))
      setHeaderBase(prev => ({ ...prev, consultant_name: user?.name || '' }))
    }
  }, [visit, step, user])

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
      toast.success(complete ? 'Visita finalizada!' : 'Salvo!'); refetch()
      if (complete) navigate(`/consultoria/clientes/${clientId}`)
    } catch (err: any) { toast.error(err.message) } finally { setIsSaving(false) }
  }

  if (clientLoading || methodologyLoading) return <div className="min-h-screen flex items-center justify-center bg-mx-bg"><Loader2 className="w-10 h-10 animate-spin text-brand-primary" /></div>

  return (
    <main className="min-h-screen bg-mx-bg pb-20">
      <header className="bg-white border-b border-mx-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/consultoria/clientes/${clientId}`} className="p-2 hover:bg-mx-bg-secondary rounded-full transition-all"><ArrowLeft className="w-5 h-5" /></Link>
            <div><Typography variant="h3" className="text-brand-secondary font-black">Visita {visitNum}: {step?.objective.toUpperCase()}</Typography></div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => handleSave(false)} loading={isSaving}>Salvar Progresso</Button>
            <Button variant="primary" size="sm" onClick={() => handleSave(true)} loading={isSaving}>Concluir Etapa</Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <VisitHeaderBase clientName={client?.name || ''} data={headerBase} onChange={setHeaderBase} />
          
          {visitNum === 1 && (
            <VisitOneDiagnosticDetailed 
               visitId={visit?.id} 
               templates={templates} 
               responsesByTemplate={responsesByTemplate} 
               onSaveResponse={saveResponse} 
               onGenerateSummary={(text: string) => setExecutiveSummary(prev => prev ? `${prev}\n\n${text}` : text)}
               quantData={quantData}
               onQuantChange={setQuantData}
            />
          )}

          {/* Checklist e Relato unificados */}
          <Card className="p-6 shadow-mx-md">
            <Typography variant="h3" className="mb-6 font-black italic">CHECKLIST DE CAMPO</Typography>
            <div className="space-y-3">{checklist.map((item, idx) => (<div key={idx} className={cn("flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer", item.completed ? "bg-brand-primary/5 border-brand-primary/20" : "bg-white border-mx-border")} onClick={() => handleToggleCheck(idx)}>{item.completed ? <CheckCircle2 className="w-5 h-5 text-brand-primary" /> : <Circle className="w-5 h-5 text-mx-muted opacity-30" />}<Typography variant="body" className={cn("flex-1 font-bold", item.completed && "line-through text-mx-muted")}>{item.task}</Typography></div>))}</div>
          </Card>

          <Card className="p-6 shadow-mx-md">
            <Typography variant="h3" className="mb-4 font-black italic uppercase">Resumo Executivo para o Plano Estratégico</Typography>
            <Textarea value={executiveSummary} onChange={(e) => setExecutiveSummary(e.target.value)} placeholder="Sintetize aqui os pontos chave para a reunião estratégica..." className="min-h-[250px] font-mono text-sm leading-relaxed bg-mx-bg-secondary/20" />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-t-8 border-brand-secondary bg-brand-secondary text-white shadow-mx-lg">
             <Typography variant="h4" tone="white" className="mb-4 uppercase font-black">Reporte Profissional</Typography>
             <Button className="w-full bg-white text-brand-secondary font-black h-12" onClick={() => setShowReportModal(true)}>GERAR RELATÓRIO PDF/CRM</Button>
          </Card>
          <Card className="p-6 shadow-mx-md border-t-4 border-brand-primary"><Typography variant="h4" className="mb-4 uppercase font-black">Informações Alvo</Typography><div className="space-y-4"><div><Typography variant="tiny" tone="muted" className="uppercase font-black">Participantes</Typography><Typography variant="body" className="font-bold">{step?.target}</Typography></div><div><Typography variant="tiny" tone="muted" className="uppercase font-black">Tempo Estimado</Typography><Typography variant="body" className="font-bold">{step?.duration}</Typography></div></div></Card>
        </div>
      </div>

      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="Relatório de Visita PMR" size="xl">
         <div className="p-8"><Card className="p-8 bg-mx-bg-secondary font-mono text-sm whitespace-pre-wrap leading-relaxed">{`📍 VISITA ${visitNum}: ${step?.objective}\n\nRESUMO EXECUTIVO:\n${executiveSummary}\n\nFEEDBACK:\n${feedbackClient}`}</Card></div>
      </Modal>
    </main>
  )
}

function VisitHeaderBase({ clientName, data, onChange }: any) {
  return (
    <Card className="p-6 border-l-8 border-brand-primary shadow-mx-md bg-white">
      <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3 font-black uppercase"><Building2 className="text-brand-primary" /> Cabeçalho Base</div><Badge variant="outline" className="font-black">{clientName}</Badge></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Input label="Consultor" value={data.consultant_name} onChange={e => onChange({ ...data, consultant_name: e.target.value })} />
        <Input label="Data" type="date" value={data.visit_date} onChange={e => onChange({ ...data, visit_date: e.target.value })} />
        <Input label="Meta Mensal" value={data.meta_mensal} onChange={e => onChange({ ...data, meta_mensal: e.target.value })} />
      </div>
    </Card>
  )
}

function VisitOneDiagnosticDetailed({ visitId, templates, responsesByTemplate, onSaveResponse, onGenerateSummary, quantData, onQuantChange }: any) {
  const [activeTab, setTab] = useState<'entrevistas' | 'quant' | 'benchmark'>('entrevistas')
  const [formTab, setFormTab] = useState<'gerente' | 'dono' | 'vendedor' | 'processo'>('gerente')
  const [form, setForm] = useState<Record<string, any>>({}); const [name, setName] = useState('')
  
  const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#8884d8'];

  const renderEntrevistas = () => {
    const current = templates.find((t: any) => t.form_key === formTab)
    const fieldsMap: any = {
      vendedor: [ { key: 'crm', label: 'Uso do CRM e Gestão de Funil' }, { key: 'online', label: 'Qualidade Atendimento Online' }, { key: 'conv', label: 'Conversão leads em agendamentos' }, { key: 'clima', label: 'Clima e Motivação' }, { key: 'limitador', label: 'Principal Limitador Individual' } ],
      gerente: [ { key: 'rotina', label: 'Rotina Gerencial Estruturada' }, { key: 'acompanhamento', label: 'Acompanhamento Diário de Vendas' }, { key: 'treinamento', label: 'Processo Treinamento Equipe' }, { key: 'lideranca', label: 'Perfil de Liderança e Autoridade' } ],
      dono: [ { key: 'visao', label: 'Visão Macro e Potencial do Negócio' }, { key: 'estagio', label: 'Estágio Atual (Sobrevivência/Escala)' }, { key: 'dependencia', label: 'Dependência do Dono na Operação' }, { key: 'clareza', label: 'Clareza Estratégica e Metas' } ],
      processo: [ { key: 'usado', label: 'Processo de Avaliação de Usado' }, { key: 'trafego', label: 'Estratégia de Tráfego e Captação' }, { key: 'pos_venda', label: 'Processo de Pós-Venda e Relacionamento' }, { key: 'estoque', label: 'Gestão de Estoque +90 dias' } ]
    }
    const fields = fieldsMap[formTab] || []

    return (
      <div className="space-y-6">
        <div className="flex gap-2 bg-mx-bg-secondary p-1 rounded-xl">
           {['gerente', 'dono', 'vendedor', 'processo'].map((t: any) => (
             <button key={t} onClick={() => setFormTab(t)} className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", formTab === t ? "bg-white shadow-sm text-brand-primary" : "opacity-40")}>{t}</button>
           ))}
        </div>
        <div className="p-6 bg-mx-bg-secondary rounded-3xl border-2 border-mx-border shadow-inner">
           <Typography variant="tiny" tone="muted" className="mb-2 font-black uppercase">Nome do Entrevistado</Typography>
           <Input value={name} onChange={e => setName(e.target.value)} className="bg-white mb-6 font-bold" />
           <div className="space-y-6">
              {fields.map((f: any) => (
                <div key={f.key} className="space-y-2">
                   <Typography variant="tiny" className="font-black uppercase text-[10px] text-brand-secondary">{f.label}</Typography>
                   <Textarea value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="bg-white min-h-[80px]" placeholder="Comentários qualitativos..." />
                </div>
              ))}
           </div>
           <Button className="w-full mt-8 h-14 font-black shadow-lg" onClick={() => { onSaveResponse({ template_id: current.id, respondent_name: name, respondent_role: current.target_role, answers: form, visit_id: visitId }); toast.success('Coletado!'); setForm({}); setName('') }}>SALVAR ENTREVISTA NO CRM</Button>
        </div>
      </div>
    )
  }

  const renderQuant = () => (
    <div className="space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6 bg-white border-2 border-mx-border">
             <Typography variant="h4" className="mb-6 font-black uppercase flex items-center gap-2"><BarChart3 size={18} className="text-brand-primary" /> Diagnóstico de Vendas</Typography>
             <div className="h-[200px] w-full"><ResponsiveContainer><ReBarChart data={quantData.sales}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><ReBarChart data={quantData.sales}><Bar dataKey="value" fill="#00C49F" radius={[4, 4, 0, 0]} /></ReBarChart></ReBarChart></ResponsiveContainer></div>
             <div className="grid grid-cols-3 gap-2 mt-6">
                {quantData.sales.map((s: any, i: number) => (
                  <div key={i}><Typography variant="tiny" className="font-bold">{s.month}</Typography><Input type="number" value={s.value} onChange={e => { const n = [...quantData.sales]; n[i].value = parseInt(e.target.value); onQuantChange({...quantData, sales: n}) }} /></div>
                ))}
             </div>
          </Card>
          <Card className="p-6 bg-white border-2 border-mx-border">
             <Typography variant="h4" className="mb-6 font-black uppercase flex items-center gap-2"><PieChart size={18} className="text-brand-primary" /> Origem das Vendas</Typography>
             <div className="h-[200px] w-full"><ResponsiveContainer><RePieChart><Pie data={quantData.marketing.origin} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{quantData.marketing.origin.map((_entry: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></RePieChart></ResponsiveContainer></div>
             <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                {quantData.marketing.origin.map((o: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-2"><Typography variant="tiny" className="font-bold truncate">{o.name}</Typography><input type="number" className="w-12 text-xs border rounded p-1" value={o.value} onChange={e => { const n = [...quantData.marketing.origin]; n[i].value = parseInt(e.target.value); onQuantChange({...quantData, marketing: {...quantData.marketing, origin: n}}) }} /></div>
                ))}
             </div>
          </Card>
       </div>
       <Card className="p-6 bg-white border-2 border-mx-border">
          <Typography variant="h4" className="mb-6 font-black uppercase flex items-center gap-2"><LayoutDashboard size={18} className="text-brand-primary" /> Análise de Estoque</Typography>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             <div><Typography variant="tiny" className="font-bold">TOTAL QTD</Typography><Input type="number" value={quantData.stock.qty} onChange={e => onQuantChange({...quantData, stock: {...quantData.stock, qty: e.target.value}})} /></div>
             <div><Typography variant="tiny" className="font-bold">PREÇO MÉDIO</Typography><Input type="number" value={quantData.stock.avg_price} onChange={e => onQuantChange({...quantData, stock: {...quantData.stock, avg_price: e.target.value}})} /></div>
             <div><Typography variant="tiny" className="font-bold">RELAÇÃO FIPE</Typography><Input type="number" value={quantData.stock.fipe_delta} onChange={e => onQuantChange({...quantData, stock: {...quantData.stock, fipe_delta: e.target.value}})} /></div>
             <div><Typography variant="tiny" className="font-bold">KM MÉDIA</Typography><Input type="number" value={quantData.stock.mileage} onChange={e => onQuantChange({...quantData, stock: {...quantData.stock, mileage: e.target.value}})} /></div>
             <div><Typography variant="tiny" className="font-bold">INV. TOTAL</Typography><Input type="number" value={quantData.stock.total_inv} onChange={e => onQuantChange({...quantData, stock: {...quantData.stock, total_inv: e.target.value}})} /></div>
          </div>
       </Card>
    </div>
  )

  const renderBenchmark = () => (
    <Card className="p-6 bg-white border-2 border-mx-border overflow-x-auto">
       <Typography variant="h4" className="mb-8 font-black uppercase text-center">Análise de Processos e Benchmark</Typography>
       <table className="w-full text-left border-collapse min-w-[600px]">
          <thead><tr className="border-b-2 border-mx-border"><th className="py-4 font-black uppercase text-xs">Indicador</th><th className="py-4 font-black uppercase text-xs text-center">Ruim</th><th className="py-4 font-black uppercase text-xs text-center">Médio</th><th className="py-4 font-black uppercase text-xs text-center">Boa Prática</th><th className="py-4 font-black uppercase text-xs">Comentários</th></tr></thead>
          <tbody>
             {['Plano de Remuneração', 'Rotina da Equipe', 'Capacidade Vendedores', 'Atendimento Online', 'Instagram e Tráfego', 'Gestão +90 Dias'].map(row => (
               <tr key={row} className="border-b border-mx-border/50">
                  <td className="py-4 font-bold text-sm text-brand-secondary">{row}</td>
                  <td className="py-4 text-center"><div className="w-4 h-4 rounded-full bg-mx-error mx-auto opacity-30 cursor-pointer hover:opacity-100" /></td>
                  <td className="py-4 text-center"><div className="w-4 h-4 rounded-full bg-mx-warning mx-auto opacity-30 cursor-pointer hover:opacity-100" /></td>
                  <td className="py-4 text-center"><div className="w-4 h-4 rounded-full bg-brand-primary mx-auto opacity-30 cursor-pointer hover:opacity-100" /></td>
                  <td className="py-4"><Input placeholder="Observação técnica..." className="h-8 text-xs" /></td>
               </tr>
             ))}
          </tbody>
       </table>
    </Card>
  )

  return (
    <div className="space-y-6">
       <div className="flex bg-white p-2 rounded-3xl shadow-mx-md border-2 border-mx-border">
          {['entrevistas', 'quant', 'benchmark'].map((t: any) => (
            <button key={t} onClick={() => setTab(t)} className={cn("flex-1 py-4 text-xs font-black uppercase rounded-2xl transition-all", activeTab === t ? "bg-brand-primary text-white shadow-lg scale-[1.02]" : "hover:bg-mx-bg-secondary opacity-40")}>{t}</button>
          ))}
       </div>
       {activeTab === 'entrevistas' && renderEntrevistas()}
       {activeTab === 'quant' && renderQuant()}
       {activeTab === 'benchmark' && renderBenchmark()}
    </div>
  )
}

function VisitTwoExecution({ clientId }: any) {
  const { latestPlan } = useConsultingStrategicPlan(clientId)
  return (<div className="space-y-6"><Card className="p-0 overflow-hidden border-mx-error shadow-mx-lg"><div className="bg-mx-error p-6 text-white"><Typography variant="h3" tone="white" className="font-black uppercase italic mb-2">🚨 TRAVA: SGAP OBRIGATÓRIO</Typography><Typography variant="body" tone="white" className="font-bold">Sem o formulário de Acompanhamento Diário instalado e a rotina validada, o trabalho não anda. Exija o print sistêmico.</Typography></div></Card><div className="grid grid-cols-2 gap-6"><Card className="p-6 space-y-3 border-t-8 border-brand-secondary"><Button className="w-full h-14 font-black" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=strategic`, '_blank')}><Target className="mr-2" />PLANEJAMENTO ESTRATÉGICO</Button><Button className="w-full h-14 font-black shadow-lg" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=daily`, '_blank')}><BarChart3 className="mr-2" />VALIDAR SGAP DIÁRIO</Button></Card><Card className="p-6 bg-brand-secondary text-white flex flex-col items-center justify-center text-center">{latestPlan ? <div className="space-y-2"><CheckCircle2 className="w-12 h-12 mx-auto text-brand-primary" /><Typography variant="h3" tone="white" className="font-black uppercase">P.E. VALIDADO ✓</Typography><Typography variant="tiny" tone="white" className="opacity-60 font-bold uppercase">{latestPlan.title}</Typography></div> : <Typography variant="body" tone="white" className="font-bold opacity-40">AGUARDANDO CRIAÇÃO DO PLANO ESTRATÉGICO NO SISTEMA</Typography>}</Card></div></div>)
}

function VisitThreeExecution() { return (<Card className="p-10 shadow-mx-lg border-2 border-mx-border relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full -mr-32 -mt-32" /><div className="flex items-center gap-3 mb-10"><Clock className="w-8 h-8 text-brand-primary" /><Typography variant="h2" className="font-black italic">RITUAL DE ROTINAS MX</Typography></div><div className="grid grid-cols-1 md:grid-cols-2 gap-10"><div className="p-8 bg-mx-bg-secondary rounded-[40px] border-2 border-brand-secondary/10 shadow-sm relative"><div className="absolute -top-4 left-10"><Badge className="px-6 py-2 font-black text-xs shadow-md">GERENTE</Badge></div><ul className="space-y-5 font-bold text-brand-secondary mt-2"><li>• 09:30 Cobrar SGAP</li><li>• 10:30 Reunião Matinal / Ranking</li><li>• 14:00 Auditoria CRM / Funil</li><li>• 17:00 Feedback Imediato</li></ul></div><div className="p-8 bg-mx-bg-secondary rounded-[40px] border-2 border-brand-primary/10 shadow-sm relative"><div className="absolute -top-4 left-10"><Badge className="px-6 py-2 font-black text-xs shadow-md" variant="secondary">VENDEDOR</Badge></div><ul className="space-y-5 font-bold text-brand-primary mt-2"><li>• Registro Leads Porta/Online</li><li>• Agendamentos Carteira</li><li>• Atendimento e Prospecção</li><li>• Lançamento Vendas Ontem</li></ul></div></div></Card>) }
function VisitFourExecution({ storeId, onGenerateSummary }: any) { 
  const { createFeedback } = useFeedbacks(storeId); const [s, setS] = useState(false); const [v, setV] = useState(''); const [p, setP] = useState(''); const [a, setA] = useState(''); const [m, setM] = useState(0)
  const save = async () => { if (!v) return toast.error('Vendedor?'); setS(true); try { await createFeedback({ seller_id: v, positives: p, attention_points: '...', action: a, meta_compromisso: m, store_id: storeId, week_reference: new Date().toISOString() }); onGenerateSummary(`--- FEEDBACK ---\nPositivos: ${p}\nAção: ${a}`); toast.success('Feedback Salvo!'); setP(''); setA('') } finally { setS(false) } }
  return (<Card className="p-10 shadow-mx-xl border-t-[12px] border-brand-primary"><div className="flex items-center gap-3 mb-10"><TrendingUp className="w-8 h-8 text-brand-primary" /><Typography variant="h2" className="font-black uppercase italic">Motor de Feedback Estruturado</Typography></div><div className="space-y-8"><div><Typography variant="tiny" tone="muted" className="uppercase font-black mb-1">ID do Vendedor</Typography><Input value={v} onChange={e => setV(e.target.value)} className="h-14 font-black text-xl border-2 focus:border-brand-primary" /></div><Textarea label="Pontos Positivos (O que foi bom na semana?)" value={p} onChange={e => setP(e.target.value)} className="bg-mx-bg-secondary min-h-[120px]" /><Textarea label="Acordo de Ação (O que será feito de diferente?)" value={a} onChange={e => setA(e.target.value)} className="bg-mx-bg-secondary min-h-[120px]" /><div className="flex gap-6"><div className="flex-1"><Typography variant="tiny" tone="muted" className="uppercase font-black mb-1">Meta Acordada (Carros)</Typography><Input type="number" value={m} onChange={e => setM(parseInt(e.target.value))} className="h-14 font-black text-2xl text-brand-primary text-center border-2 border-brand-primary" /></div><Button className="flex-[2] h-24 text-xl font-black shadow-xl active:scale-95 transition-all" onClick={save} loading={s}>REGISTRAR FEEDBACK</Button></div></div></Card>) 
}
function VisitFiveExecution({ onGenerateSummary }: any) { const [l, setL] = useState(''); const [a, setA] = useState(''); const conv = l && a ? ((parseInt(a)/parseInt(l))*100).toFixed(1) : '0'; return (<Card className="p-10 shadow-mx-lg"><Typography variant="h2" className="font-black mb-10 italic">CALCULADORA MKT</Typography><div className="grid grid-cols-3 gap-8"><Input label="Leads Recebidos" type="number" value={l} onChange={e => setL(e.target.value)} className="h-14 text-xl font-bold" /><Input label="Agendamentos" type="number" value={a} onChange={e => setA(e.target.value)} className="h-14 text-xl font-bold" /><div className="bg-brand-primary/10 rounded-[32px] flex flex-col items-center justify-center border-2 border-brand-primary/20"><Typography variant="tiny" className="font-black text-brand-primary uppercase">Conversão</Typography><Typography variant="h1" className="font-black text-brand-primary text-4xl">{conv}%</Typography></div></div><Button className="w-full h-16 font-black mt-10 border-4 border-brand-primary text-brand-primary text-lg" variant="outline" onClick={() => onGenerateSummary(`--- MKT --- Conv: ${conv}%`)}>GERAR RELATO MKT</Button></Card>) }
function VisitSixExecution({ clientId, onGenerateSummary }: any) { return (<Card className="p-10 shadow-mx-lg border-t-[12px] border-brand-secondary"><Typography variant="h2" className="font-black mb-8 italic uppercase">Processos Críticos</Typography><div className="p-6 bg-amber-50 rounded-[32px] border-2 border-amber-200 mb-10 font-bold text-amber-800 leading-relaxed uppercase italic">🚨 FOCO TOTAL: Oficina, Repasse, Financiamento e Veículos +90 dias travados no pátio.</div><Button className="w-full h-20 font-black shadow-xl text-xl uppercase" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=action_plan`, '_blank')}>ABRIR PLANO DE AÇÃO (P.E.)</Button></Card>) }
function VisitSevenExecution({ storeId, onGenerateSummary }: any) { const { createPDI } = usePDIs(storeId); const [s, setS] = useState(false); const [v, setV] = useState(''); const [o, setO] = useState(''); const save = async () => { if (!v) return toast.error('Selecione Vendedor'); setS(true); try { await createPDI({ seller_id: v, objective: o, store_id: storeId, status: 'aberto' }); onGenerateSummary(`--- PDI --- Objetivo: ${o}`); toast.success('PDI OK!'); setO('') } finally { setS(false) } }; return (<Card className="p-10 shadow-mx-xl"><Typography variant="h2" className="font-black mb-10 italic uppercase">Sessão PDI Individual</Typography><div className="space-y-8"><Input label="ID do Vendedor" value={v} onChange={e => setV(e.target.value)} className="h-14 text-xl font-bold" /><Textarea label="Objetivo de Vida / Carreira (Qual o sonho desse vendedor?)" value={o} onChange={e => setO(e.target.value)} className="min-h-[150px] bg-mx-bg-secondary" /><Button className="w-full h-20 font-black bg-brand-secondary text-white text-xl shadow-xl" onClick={save} loading={s}>SALVAR E ASSINAR PDI DIGITAL</Button></div></Card>) }
function VisitEightExecution({ clientId }: any) { return (<Card className="p-10 shadow-mx-lg border-2 border-mx-border relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full -mr-32 -mt-32" /><Typography variant="h2" className="font-black mb-10 italic uppercase">Avaliação de Performance</Typography><Typography variant="body" className="mb-10 font-bold text-brand-secondary text-xl leading-relaxed">Confronte o relatório de acessos à plataforma MX com os dados reais de conversão porta. Vendedor que não treina, não performa.</Typography><Button className="w-full h-20 font-black shadow-2xl border-4 border-brand-primary text-brand-primary text-xl uppercase italic" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=daily`, '_blank')}>AUDITORIA DE PERFORMANCE</Button></Card>) }
function VisitNineExecution({ financials, onGenerateSummary }: any) { const latest = financials[0] || {}; const roi = latest.roi || 0; return (<Card className="p-12 bg-mx-indigo-900 text-white shadow-mx-2xl border-t-[16px] border-brand-primary"><Typography variant="h2" tone="white" className="font-black mb-12 uppercase text-center tracking-widest italic">Fechamento Trimestral</Typography><div className="flex flex-col items-center mb-12"><Typography variant="h1" tone="white" className="text-[120px] font-black italic leading-none">{roi}x</Typography><Typography variant="h3" tone="white" className="opacity-40 uppercase font-black tracking-[12px]">ROI LÍQUIDO</Typography></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><Button className="h-20 font-black bg-brand-primary text-xl shadow-2xl" onClick={() => onGenerateSummary(`--- FECHAMENTO TRIMESTRAL ---\nROI: ${roi}x`)}>GERAR RESUMO FINAL</Button><Button className="h-20 border-4 border-white/20 font-black text-xl hover:bg-white/5 transition-all text-white italic">PITCH DE RENOVAÇÃO 🚀</Button></div></Card>) }
