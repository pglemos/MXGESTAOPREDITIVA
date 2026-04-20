import React, { useState } from 'react'
import { 
  BarChart3, TrendingUp, MessageSquare, Sparkles, 
  BarChart, PieChart, Info, ChevronRight, Activity,
  Target, Users, Zap, Search, ArrowUpRight, Layers, MousePointer2, Calculator, Gauge, ShieldCheck,
  CheckCircle2, Circle
} from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { cn } from '@/lib/utils'
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts'

interface VisitOneProps {
  visitId?: string
  templates: any[]
  responsesByTemplate: Map<string, any[]>
  onSaveResponse: (data: any) => Promise<void>
  onGenerateSummary: (text: string) => void
  quantData: any
  onQuantChange: (data: any) => void
}

export function VisitOneHighFidelity({ 
  visitId, templates, responsesByTemplate, onSaveResponse, onGenerateSummary, quantData, onQuantChange 
}: VisitOneProps) {
  const [tab, setTab] = useState<'dashboards' | 'benchmark' | 'entrevistas'>('dashboards')
  const [interviewTab, setInterviewTab] = useState<'gerente' | 'dono' | 'vendedor' | 'processo'>('gerente')
  const [form, setForm] = useState<Record<string, any>>({})
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  
  const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#8884d8'];

  const renderDashboards = () => {
    const safeSales = quantData?.sales || []
    const safeMarketing = quantData?.marketing || { investment: 0, leads: 0, origin: [] }
    const safeStock = quantData?.stock || { qty: 0, avg_price: 0, fipe_delta: 0, mileage: 0, total_inv: 0 }

    const totalSales = safeSales.reduce((acc: number, cur: any) => acc + (cur.value || 0), 0)
    const avgSales = safeSales.length > 0 ? (totalSales / safeSales.length).toFixed(1) : '0'
    const bestMonth = [...safeSales].sort((a,b) => (b.value || 0) - (a.value || 0))[0] || { value: 0 }
    const worstMonth = [...safeSales].sort((a,b) => (a.value || 0) - (b.value || 0))[0] || { value: 0 }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="p-6 md:p-8 bg-slate-900 text-white border border-slate-800 shadow-md rounded-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5"><BarChart size={100} /></div>
               <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 relative z-10">
                 <Typography variant="h3" tone="white" className="font-black uppercase tracking-tight flex items-center gap-2">
                    <Activity className="text-brand-primary w-5 h-5" /> Diagnóstico de Vendas
                 </Typography>
                 <Badge variant="outline" className="border-brand-primary/30 text-brand-primary font-bold text-[10px] uppercase bg-brand-primary/10">Trimestre</Badge>
               </div>
               
               <div className="h-[220px] w-full mt-4 relative z-10">
                  <ResponsiveContainer>
                    <ReBarChart data={safeSales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} />
                      <Bar dataKey="value" fill="#00C49F" radius={[6, 6, 0, 0]} barSize={32} />
                    </ReBarChart>
                  </ResponsiveContainer>
               </div>

               <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800 relative z-10">
                  {safeSales.map((s:any, i:number) => (
                    <div key={i} className="flex flex-col gap-1">
                      <Typography variant="tiny" className="font-bold text-[9px] opacity-50 uppercase pl-1">{s.month}</Typography>
                      <Input type="number" value={s.value} onChange={e => { const n = [...safeSales]; n[i].value = parseInt(e.target.value) || 0; onQuantChange({...quantData, sales: n}) }} className="h-10 bg-slate-800 border-slate-700 text-white font-bold text-center focus:bg-slate-700 focus:border-brand-primary rounded-xl transition-colors" />
                    </div>
                  ))}
               </div>
               
               <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800 relative z-10">
                  <div className="text-center"><Typography variant="tiny" className="font-bold text-[9px] opacity-50">TOTAL</Typography><Typography variant="h4" className="font-black text-brand-primary">{totalSales}</Typography></div>
                  <div className="text-center"><Typography variant="tiny" className="font-bold text-[9px] opacity-50">MÉDIA</Typography><Typography variant="h4" className="font-black text-brand-primary">{avgSales}</Typography></div>
                  <div className="text-center"><Typography variant="tiny" className="font-bold text-[9px] opacity-50">MELHOR</Typography><Typography variant="h4" className="font-black text-brand-primary">{bestMonth.value}</Typography></div>
                  <div className="text-center"><Typography variant="tiny" className="font-bold text-[9px] opacity-50">PIOR</Typography><Typography variant="h4" className="font-black text-mx-error">{worstMonth.value}</Typography></div>
               </div>
            </Card>

            <Card className="p-6 md:p-8 bg-slate-900 text-white border border-slate-800 shadow-md rounded-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5"><PieChart size={100} /></div>
               <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 relative z-10">
                 <Typography variant="h3" tone="white" className="font-black uppercase tracking-tight flex items-center gap-2">
                    <Zap className="text-brand-primary w-5 h-5" /> Performance de MKT
                 </Typography>
                 <Badge variant="outline" className="border-brand-primary/30 text-brand-primary font-bold text-[10px] uppercase bg-brand-primary/10">Origem</Badge>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                  <div className="flex flex-col gap-4">
                     <div>
                        <Typography variant="tiny" className="font-bold text-[9px] opacity-50 uppercase mb-1 block pl-1">Investimento (R$)</Typography>
                        <Input type="number" value={safeMarketing.investment} onChange={e => onQuantChange({...quantData, marketing: {...safeMarketing, investment: parseInt(e.target.value) || 0}})} className="h-11 bg-slate-800 border-slate-700 text-white font-bold text-sm rounded-xl focus:bg-slate-700 focus:border-brand-primary transition-colors" />
                     </div>
                     <div>
                        <Typography variant="tiny" className="font-bold text-[9px] opacity-50 uppercase mb-1 block pl-1">Leads Recebidos</Typography>
                        <Input type="number" value={safeMarketing.leads} onChange={e => onQuantChange({...quantData, marketing: {...safeMarketing, leads: parseInt(e.target.value) || 0}})} className="h-11 bg-slate-800 border-slate-700 text-white font-bold text-sm rounded-xl focus:bg-slate-700 focus:border-brand-primary transition-colors" />
                     </div>
                     <div className="p-3 bg-brand-primary/10 rounded-xl border border-brand-primary/20 text-center mt-1">
                        <Typography variant="tiny" className="font-bold text-brand-primary opacity-80 uppercase text-[9px] mb-0.5 block">CPL REAL</Typography>
                        <Typography variant="h3" className="font-black text-brand-primary">R$ {((safeMarketing.investment || 0) / (safeMarketing.leads || 1)).toFixed(2)}</Typography>
                     </div>
                  </div>

                  <div className="flex flex-col items-center">
                     <div className="h-[150px] w-full">
                       <ResponsiveContainer>
                         <RePieChart>
                           <Pie data={safeMarketing.origin || []} innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                             {(safeMarketing.origin || []).map((_e: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                           </Pie>
                           <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b' }} />
                         </RePieChart>
                       </ResponsiveContainer>
                     </div>
                     <div className="grid grid-cols-2 gap-2 w-full mt-2">
                        {(safeMarketing.origin || []).map((o:any, i:number) => (
                          <div key={i} className="flex flex-col">
                            <Typography variant="tiny" className="font-bold text-[8px] uppercase flex items-center gap-1.5 mb-1 opacity-80 pl-1"><div className="w-1.5 h-1.5 rounded-full" style={{background: COLORS[i%COLORS.length]}}/> {o.name}</Typography>
                            <Input type="number" value={o.value} onChange={e => { const oArr = [...safeMarketing.origin]; oArr[i].value = parseInt(e.target.value) || 0; onQuantChange({...quantData, marketing: {...safeMarketing, origin: oArr}}) }} className="h-8 bg-slate-800 border-slate-700 text-white font-bold text-center text-xs focus:bg-slate-700 focus:border-brand-primary px-1 rounded-lg transition-colors" />
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </Card>
         </div>

         <Card className="p-6 md:p-8 bg-slate-900 text-white border border-slate-800 shadow-md rounded-3xl relative overflow-hidden">
            <Typography variant="h3" tone="white" className="mb-6 pb-4 font-black uppercase tracking-tight border-b border-slate-800 flex items-center gap-2">
               <Search className="text-brand-primary w-5 h-5" /> Raio-X do Estoque & Auditoria
            </Typography>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
               {[
                 { label: 'QTD TOTAL (UN)', val: safeStock.qty, key: 'qty', sub: 'Peças em pátio' },
                 { label: 'PREÇO MÉDIO (R$)', val: safeStock.avg_price, key: 'avg_price', sub: 'Ticket médio' },
                 { label: 'RELAÇÃO FIPE', val: safeStock.fipe_delta, key: 'fipe_delta', sub: 'Spread comercial' },
                 { label: 'KM MÉDIA', val: safeStock.mileage, key: 'mileage', sub: 'Perfil de uso' },
                 { label: 'INV. TOTAL (R$)', val: safeStock.total_inv, key: 'total_inv', sub: 'Capital alocado' }
               ].map(it => (
                 <div key={it.label} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex flex-col gap-2 relative group hover:bg-slate-800 transition-colors">
                    <Typography variant="tiny" className="font-bold opacity-50 uppercase text-[9px] text-center">{it.label}</Typography>
                    <Input type="number" value={it.val} onChange={e => onQuantChange({...quantData, stock: {...safeStock, [it.key]: parseFloat(e.target.value) || 0}})} className="h-12 bg-slate-900 border-slate-700 text-white font-black text-center text-lg focus:bg-slate-800 focus:border-brand-primary rounded-xl transition-colors" />
                    <Typography variant="tiny" className="font-bold opacity-30 uppercase text-[8px] text-center tracking-widest">{it.sub}</Typography>
                 </div>
               ))}
            </div>
         </Card>
      </div>
    )
  }

  const renderBenchmark = () => (
    <Card className="p-6 md:p-10 bg-white border border-border-default shadow-sm rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
       <div className="flex flex-col items-center mb-10 text-center">
          <Badge className="mb-3 px-4 py-1 bg-brand-primary/10 text-brand-primary font-bold border-none uppercase tracking-widest text-[10px]">PMR Methodology - Slide 7</Badge>
          <Typography variant="h2" className="font-black uppercase tracking-tight text-text-primary leading-none mb-2">Comparativo de Mercado</Typography>
          <Typography variant="p" className="max-w-xl text-text-secondary text-sm">Confronte os dados da loja com a média nacional e as metas de elite estabelecidas pela metodologia MX.</Typography>
       </div>

       <div className="overflow-x-auto rounded-2xl border border-border-subtle">
         <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-alt/50 border-b border-border-subtle">
                 <th className="p-6 font-bold uppercase text-[10px] tracking-wider text-text-secondary">Indicador Estratégico</th>
                 <th className="p-6 font-bold uppercase text-[10px] tracking-wider text-center border-l border-border-subtle w-48">Sua Loja</th>
                 <th className="p-6 font-bold uppercase text-[10px] tracking-wider text-center border-l border-border-subtle text-status-warning bg-status-warning/5 w-36">Média Mercado</th>
                 <th className="p-6 font-bold uppercase text-[10px] tracking-wider text-center border-l border-border-subtle text-brand-primary bg-brand-primary/5 w-36">Boa Prática MX</th>
                 <th className="p-6 font-bold uppercase text-[10px] tracking-wider border-l border-border-subtle">Parecer Técnico</th>
              </tr>
            </thead>
            <tbody>
               {[ 
                 { label: 'Vendas Totais em relação ao Estoque', avg: '28%', best: '48%', placeholder: 'Ex: 32%' },
                 { label: 'Venda média por vendedor', avg: '6,7', best: '8,0', placeholder: 'Ex: 5,5' },
                 { label: '% Vendas Origem Internet', avg: '52%', best: '65%', placeholder: 'Ex: 48%' },
                 { label: 'Leads recebidos / mês', avg: '480', best: '820', placeholder: 'Ex: 520' },
                 { label: 'Leads por vendedor', avg: '90', best: '180', placeholder: 'Ex: 120' },
                 { label: 'Giro de Estoque (Índice)', avg: '0,45', best: '0,65', placeholder: 'Ex: 0,38' },
                 { label: '% Veículos +90 dias no pátio', avg: '26%', best: '15%', placeholder: 'Ex: 35%' }
               ].map((it, i) => (
                 <tr key={it.label} className="border-t border-border-subtle hover:bg-surface-alt/30 transition-colors">
                    <td className="p-6 font-bold text-text-primary text-sm">{it.label}</td>
                    <td className="p-6 border-l border-border-subtle">
                       <Input className="h-12 text-center text-lg font-black border-border-default focus:border-brand-primary rounded-xl bg-white shadow-sm" placeholder={it.placeholder} />
                    </td>
                    <td className="p-6 text-center font-bold text-lg text-text-tertiary bg-status-warning/5 border-l border-border-subtle">{it.avg}</td>
                    <td className="p-6 text-center font-black text-lg text-brand-primary bg-brand-primary/5 border-l border-border-subtle">{it.best}</td>
                    <td className="p-6 border-l border-border-subtle">
                       <Textarea placeholder="Qual o plano de correção para este desvio?" className="min-h-[80px] text-sm font-medium border-border-default focus:border-brand-primary rounded-xl p-3 bg-white shadow-sm resize-none" />
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
       </div>
    </Card>
  )

  const renderEntrevistas = () => {
    const fieldsMap: any = {
      vendedor: [ 
        { key: 'funcao', label: 'Função atual' }, 
        { key: 'tempo', label: 'Tempo de mercado (anos)' }, 
        { key: 'remuneracao', label: 'Plano de Remuneração: Entendimento e Justiça' },
        { key: 'rotina', label: 'Disciplina com Rotina MX (SGAP, Matinal)' },
        { key: 'capacidade', label: 'Capacidade Técnica e Domínio de Produto' },
        { key: 'online', label: 'Qualidade do Atendimento Online' },
        { key: 'presencial', label: 'Qualidade do Atendimento Presencial' },
        { key: 'clima', label: 'Clima, Motivação e Unidade da Equipe' },
        { key: 'limitador', label: 'Maior limitador individual hoje' } 
      ],
      gerente: [ 
        { key: 'tempo', label: 'Tempo de experiência como Gestor' }, 
        { key: 'contratacao', label: 'Processo de Contratação e Onboarding' }, 
        { key: 'treinamento', label: 'Frequência de Treinamento da Equipe' }, 
        { key: 'acompanhamento', label: 'Rigor no Acompanhamento Diário (SGAP)' }, 
        { key: 'feedback', label: 'Rotina de Feedback Estruturado' },
        { key: 'sinergia', label: 'Sinergia Real Gerente x Equipe' },
        { key: 'comunicacao', label: 'Qualidade da Comunicação Estratégica' },
        { key: 'gargalo', label: 'Maior gargalo operacional hoje' } 
      ],
      dono: [ 
        { key: 'mercado', label: 'Tempo de operação da loja' }, 
        { key: 'meta', label: 'Meta Mensal ideal' }, 
        { key: 'estagio', label: 'Estágio do Negócio (Sobrevivência x Escala)' }, 
        { key: 'cultura', label: 'Cultura Desejada vs Cultura Real' }, 
        { key: 'decisoes', label: 'Centralização de Decisões' }, 
        { key: 'dependencia', label: 'Dependência da Operação no Sócio' }, 
        { key: 'visao', label: 'Visão de Futuro (Próximos 12 meses)' },
        { key: 'travas', label: 'Maiores travas de investimento hoje' } 
      ],
      processo: [ 
        { key: 'usado', label: 'Processo de Avaliação de Usado (SLA minutos)' }, 
        { key: 'troca', label: 'Poder de Negociação de Troca na ponta' }, 
        { key: 'preparacao', label: 'Qualidade da Preparação (Checklist de Saída)' }, 
        { key: 'pos_venda', label: 'Processo de Pós-Venda e Relacionamento' }, 
        { key: 'precificacao', label: 'Rigor na Precificação de Compra e Venda' }, 
        { key: 'trafego', label: 'Estratégia de Tráfego Pago e Captação' }, 
        { key: 'origem', label: 'Controle de Origem das Vendas (MKT)' },
        { key: 'estoque', label: 'Estratégia para Veículos +90 dias' } 
      ]
    }
    const current = templates.find((t: any) => t.form_key === interviewTab)
    const fields = fieldsMap[interviewTab] || []

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
        <div className="flex flex-wrap gap-2 bg-surface-alt/30 p-1.5 rounded-2xl border border-border-default">
           {['gerente', 'dono', 'vendedor', 'processo'].map((t: any) => (
             <button 
                key={t} 
                onClick={() => setInterviewTab(t as any)} 
                className={cn(
                  "flex-1 py-2.5 px-4 text-[11px] font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2", 
                  interviewTab === t 
                    ? "bg-white text-brand-primary shadow-sm border border-border-subtle" 
                    : "text-text-tertiary hover:text-text-primary hover:bg-white/50"
                )}
             >
                {t === 'processo' ? <ShieldCheck size={14} /> : <Users size={14} />} {t}
             </button>
           ))}
        </div>

        <Card className="p-6 md:p-10 bg-white border border-border-default shadow-sm rounded-3xl relative overflow-hidden">
           <div className="mb-10 border-b border-border-subtle pb-6">
             <Typography variant="tiny" tone="muted" className="mb-2 font-bold uppercase tracking-widest text-[10px]">Identificação do Respondente</Typography>
             <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="bg-surface-alt/30 h-14 text-xl font-black border-border-default focus:bg-white focus:border-brand-primary rounded-xl shadow-sm px-4" 
                placeholder="Nome completo do entrevistado..." 
             />
           </div>

           <div className="space-y-8">
              {fields.map((f: any) => (
                <div key={f.key} className="space-y-3">
                   <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-brand-primary/10 rounded-md text-brand-primary">
                         <Sparkles size={14} />
                      </div>
                      <Typography variant="tiny" className="font-bold uppercase tracking-wider text-[10px] text-text-secondary">
                         {f.label}
                      </Typography>
                   </div>
                   <Textarea 
                      value={form[f.key] || ''} 
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} 
                      className="bg-white min-h-[100px] rounded-xl border border-border-default focus:border-brand-primary shadow-sm font-medium text-sm p-4 resize-none transition-colors" 
                      placeholder="Diagnostique o cenário real observado..." 
                   />
                </div>
              ))}
           </div>

           <div className="mt-12 pt-8 border-t border-border-subtle">
              <Button 
                 className="w-full h-14 text-base font-bold shadow-md rounded-xl" 
                 variant="primary"
                 loading={loading}
                 onClick={async () => {
                    if(!name) return toast.error('Nome do respondente é obrigatório');
                    setLoading(true);
                    try {
                      await onSaveResponse({ 
                         template_id: current.id, 
                         respondent_name: name, 
                         respondent_role: current.target_role, 
                         answers: form, 
                         visit_id: visitId 
                      });
                      toast.success('Diagnóstico qualitativo salvo!');
                      setForm({}); setName('')
                    } finally { setLoading(false) }
                 }}
              >
                 SALVAR DIAGNÓSTICO NO CRM
              </Button>
           </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
       <div className="flex flex-wrap gap-2 bg-surface-alt/30 p-2 rounded-2xl border border-border-default print:hidden">
          {[
            { id: 'dashboards', label: 'Dashboards BI', icon: BarChart3 },
            { id: 'benchmark', label: 'Comparativo Mercado', icon: TrendingUp },
            { id: 'entrevistas', label: 'Entrevistas PMR', icon: MessageSquare }
          ].map((t: any) => (
            <button 
               key={t.id} 
               onClick={() => setTab(t.id as any)} 
               className={cn(
                  "flex-1 py-3 px-4 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 min-w-[140px]", 
                  tab === t.id 
                    ? "bg-white text-brand-primary shadow-sm border border-border-subtle" 
                    : "text-text-tertiary hover:text-text-primary hover:bg-white/50"
               )}
            >
               <t.icon size={16} /> {t.label}
            </button>
          ))}
       </div>
       
       <div className="transition-all duration-300">
          {tab === 'dashboards' && renderDashboards()}
          {tab === 'benchmark' && renderBenchmark()}
          {tab === 'entrevistas' && renderEntrevistas()}
       </div>
    </div>
  )
}
