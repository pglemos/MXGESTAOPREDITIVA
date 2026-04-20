import React, { useState } from 'react'
import { 
  BarChart3, TrendingUp, MessageSquare, Sparkles, 
  BarChart, PieChart, Info, ChevronRight, Activity,
  Target, Users, Zap, Search, ArrowUpRight, Layers, MousePointer2, Calculator, Gauge, ShieldCheck
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
      <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-8 bg-[#111827] text-white border-none shadow-2xl relative">
               <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                 <Typography variant="h3" tone="white" className="font-black uppercase italic flex items-center gap-3">
                    <Activity className="text-brand-primary" /> Diagnóstico de Vendas
                 </Typography>
                 <Badge variant="outline" className="border-brand-primary text-brand-primary font-black uppercase text-[10px]">Trimestre</Badge>
               </div>
               
               <div className="h-[250px] w-full mt-4">
                  <ResponsiveContainer>
                    <ReBarChart data={safeSales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} fontWeight="bold" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '16px' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} />
                      <Bar dataKey="value" fill="#00C49F" radius={[8, 8, 0, 0]} barSize={40} />
                    </ReBarChart>
                  </ResponsiveContainer>
               </div>

               {/* INPUTS DE VENDAS */}
               <div className="grid grid-cols-3 gap-3 mt-6 border-t border-white/10 pt-6">
                  {safeSales.map((s:any, i:number) => (
                    <div key={i} className="flex flex-col gap-1">
                      <Typography variant="tiny" className="font-black text-[9px] opacity-40 uppercase pl-2">{s.month}</Typography>
                      <Input type="number" value={s.value} onChange={e => { const n = [...safeSales]; n[i].value = parseInt(e.target.value) || 0; onQuantChange({...quantData, sales: n}) }} className="h-10 bg-white/5 border-white/10 text-white font-black text-center focus:border-brand-primary rounded-xl" />
                    </div>
                  ))}
               </div>
               
               <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10">
                  <div className="text-center"><Typography variant="tiny" className="font-black text-[9px] opacity-40">TOTAL</Typography><Typography variant="h4" className="font-black text-brand-primary">{totalSales}</Typography></div>
                  <div className="text-center"><Typography variant="tiny" className="font-black text-[9px] opacity-40">MÉDIA</Typography><Typography variant="h4" className="font-black text-brand-primary">{avgSales}</Typography></div>
                  <div className="text-center"><Typography variant="tiny" className="font-black text-[9px] opacity-40">MELHOR</Typography><Typography variant="h4" className="font-black text-brand-primary">{bestMonth.value}</Typography></div>
                  <div className="text-center"><Typography variant="tiny" className="font-black text-[9px] opacity-40">PIOR</Typography><Typography variant="h4" className="font-black text-mx-error">{worstMonth.value}</Typography></div>
               </div>
            </Card>

            <Card className="p-8 bg-[#111827] text-white border-none shadow-2xl relative">
               <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                 <Typography variant="h3" tone="white" className="font-black uppercase italic flex items-center gap-3">
                    <Zap className="text-brand-primary" /> Performance de MKT
                 </Typography>
                 <Badge variant="outline" className="border-brand-primary text-brand-primary font-black uppercase text-[10px]">Origem</Badge>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {/* INPUTS DE MKT: INVESTIMENTO E LEADS */}
                  <div className="flex flex-col gap-4">
                     <div>
                        <Typography variant="tiny" className="font-black text-[9px] opacity-40 uppercase pl-2 mb-1 block">Investimento (R$)</Typography>
                        <Input type="number" value={safeMarketing.investment} onChange={e => onQuantChange({...quantData, marketing: {...safeMarketing, investment: parseInt(e.target.value) || 0}})} className="h-12 bg-white/5 border-white/10 text-white font-black text-xl rounded-xl focus:border-brand-primary" />
                     </div>
                     <div>
                        <Typography variant="tiny" className="font-black text-[9px] opacity-40 uppercase pl-2 mb-1 block">Leads Recebidos</Typography>
                        <Input type="number" value={safeMarketing.leads} onChange={e => onQuantChange({...quantData, marketing: {...safeMarketing, leads: parseInt(e.target.value) || 0}})} className="h-12 bg-white/5 border-white/10 text-white font-black text-xl rounded-xl focus:border-brand-primary" />
                     </div>
                     <div className="p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 text-center mt-2">
                        <Typography variant="tiny" className="font-black text-brand-primary opacity-60 uppercase text-[9px] mb-1 block">CPL REAL</Typography>
                        <Typography variant="h3" className="font-black text-brand-primary">R$ {((safeMarketing.investment || 0) / (safeMarketing.leads || 1)).toFixed(2)}</Typography>
                     </div>
                  </div>

                  <div className="flex flex-col items-center">
                     <div className="h-[180px] w-full">
                       <ResponsiveContainer>
                         <RePieChart>
                           <Pie data={safeMarketing.origin || []} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                             {(safeMarketing.origin || []).map((_e: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                           </Pie>
                           <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                         </RePieChart>
                       </ResponsiveContainer>
                     </div>
                     {/* INPUTS DE ORIGEM (PIZZA) */}
                     <div className="grid grid-cols-2 gap-2 w-full mt-2">
                        {(safeMarketing.origin || []).map((o:any, i:number) => (
                          <div key={i} className="flex flex-col">
                            <Typography variant="tiny" className="font-black text-[8px] uppercase flex items-center gap-1 mb-1"><div className="w-2 h-2 rounded-full" style={{background: COLORS[i%COLORS.length]}}/> {o.name}</Typography>
                            <Input type="number" value={o.value} onChange={e => { const oArr = [...safeMarketing.origin]; oArr[i].value = parseInt(e.target.value) || 0; onQuantChange({...quantData, marketing: {...safeMarketing, origin: oArr}}) }} className="h-8 bg-white/5 border-white/10 text-white font-bold text-center text-xs focus:border-brand-primary px-1" />
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </Card>
         </div>

         <Card className="p-10 bg-[#111827] text-white border-none shadow-2xl relative">
            <Typography variant="h3" tone="white" className="mb-8 font-black uppercase italic border-b border-white/10 pb-6 flex items-center gap-4">
               <Search className="text-brand-primary" size={24} /> Raio-X do Estoque & Auditoria
            </Typography>
            {/* INPUTS DE ESTOQUE */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
               {[
                 { label: 'QTD TOTAL (UN)', val: safeStock.qty, key: 'qty', sub: 'Peças' },
                 { label: 'PREÇO MÉDIO (R$)', val: safeStock.avg_price, key: 'avg_price', sub: 'Ticket' },
                 { label: 'RELAÇÃO FIPE', val: safeStock.fipe_delta, key: 'fipe_delta', sub: 'Spread' },
                 { label: 'KM MÉDIA', val: safeStock.mileage, key: 'mileage', sub: 'Perfil' },
                 { label: 'INV. TOTAL (R$)', val: safeStock.total_inv, key: 'total_inv', sub: 'Capital' }
               ].map(it => (
                 <div key={it.label} className="p-4 bg-white/5 rounded-[24px] border border-white/10 flex flex-col gap-2">
                    <Typography variant="tiny" className="font-black opacity-40 uppercase text-[9px] text-center">{it.label}</Typography>
                    <Input type="number" value={it.val} onChange={e => onQuantChange({...quantData, stock: {...safeStock, [it.key]: parseFloat(e.target.value) || 0}})} className="h-14 bg-black/40 border-white/10 text-white font-black text-center text-xl focus:border-brand-primary rounded-xl" />
                 </div>
               ))}
            </div>
         </Card>
      </div>
    )
  }

  const renderBenchmark = () => (
    <Card className="p-16 bg-white border-4 border-mx-border shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[80px] overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
       <div className="flex flex-col items-center mb-20 text-center">
          <div className="bg-brand-primary/10 px-8 py-3 rounded-full mb-6 border-2 border-brand-primary/20">
             <Typography variant="tiny" className="text-brand-primary font-black uppercase italic tracking-[4px]">PMR Methodology - Slide 7</Typography>
          </div>
          <Typography variant="h1" className="font-black uppercase italic text-brand-secondary text-5xl tracking-tighter leading-none mb-4">Comparativo de Mercado</Typography>
          <Typography variant="p" className="max-w-2xl text-mx-muted font-bold">Confronte os dados da loja com a média nacional e as metas de elite estabelecidas pela metodologia MX.</Typography>
       </div>

       <div className="overflow-x-auto rounded-[48px] border-4 border-mx-border shadow-inner">
         <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-mx-bg-secondary">
                 <th className="p-10 font-black uppercase text-xs tracking-[4px] text-brand-secondary">Indicador Estratégico</th>
                 <th className="p-10 font-black uppercase text-xs tracking-[4px] text-center border-l-2 border-mx-border">Sua Loja</th>
                 <th className="p-10 font-black uppercase text-xs tracking-[4px] text-center border-l-2 border-mx-border text-mx-warning bg-mx-warning/5 italic">Média Mercado</th>
                 <th className="p-10 font-black uppercase text-xs tracking-[4px] text-center border-l-2 border-mx-border text-brand-primary bg-brand-primary/5 italic">Boa Prática MX</th>
                 <th className="p-10 font-black uppercase text-xs tracking-[4px] border-l-2 border-mx-border">Parecer Técnico</th>
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
                 <tr key={it.label} className="border-t-2 border-mx-border hover:bg-mx-bg-secondary/20 transition-all group">
                    <td className="p-10 font-black text-brand-secondary text-lg italic tracking-tight group-hover:pl-12 transition-all">{it.label}</td>
                    <td className="p-10 border-l-2 border-mx-border">
                       <Input className="h-16 text-center text-3xl font-black border-4 border-brand-primary/10 focus:border-brand-primary rounded-3xl bg-mx-bg-secondary/10 shadow-inner group-hover:bg-white transition-all" placeholder={it.placeholder} />
                    </td>
                    <td className="p-10 text-center font-black text-2xl opacity-40 bg-mx-warning/5 border-l-2 border-mx-border">{it.avg}</td>
                    <td className="p-10 text-center font-black text-2xl text-brand-primary bg-brand-primary/5 border-l-2 border-mx-border">{it.best}</td>
                    <td className="p-10 border-l-2 border-mx-border">
                       <Textarea placeholder="Qual o plano de correção para este desvio?" className="min-h-[120px] font-bold border-2 focus:border-brand-primary rounded-[32px] p-6 text-sm bg-mx-bg-secondary/10 group-hover:bg-white transition-all shadow-sm" />
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
        { key: 'funcao', label: 'QUAL SUA FUNÇÃO ATUAL?' }, 
        { key: 'tempo', label: 'TEMPO DE MERCADO (ANOS)' }, 
        { key: 'remuneracao', label: 'PLANO DE REMUNERAÇÃO: ENTENDIMENTO E JUSTIÇA' },
        { key: 'rotina', label: 'DISCIPLINA COM ROTINA MX (SGAP, MATINAL)' },
        { key: 'capacidade', label: 'CAPACIDADE TÉCNICA E DOMÍNIO DE PRODUTO' },
        { key: 'online', label: 'QUALIDADE DO ATENDIMENTO ONLINE' },
        { key: 'presencial', label: 'QUALIDADE DO ATENDIMENTO PRESENCIAL' },
        { key: 'clima', label: 'CLIMA, MOTIVAÇÃO E UNIDADE DA EQUIPE' },
        { key: 'limitador', label: 'QUAL SEU MAIOR LIMITADOR INDIVIDUAL HOJE?' } 
      ],
      gerente: [ 
        { key: 'tempo', label: 'TEMPO DE EXPERIÊNCIA COMO GESTOR' }, 
        { key: 'contratacao', label: 'PROCESSO DE CONTRATAÇÃO E ONBOARDING' }, 
        { key: 'treinamento', label: 'FREQUÊNCIA DE TREINAMENTO DA EQUIPE' }, 
        { key: 'acompanhamento', label: 'RIGOR NO ACOMPANHAMENTO DIÁRIO (SGAP)' }, 
        { key: 'feedback', label: 'ROTINA DE FEEDBACK ESTRUTURADO' },
        { key: 'sinergia', label: 'SINERGIA REAL GERENTE X EQUIPE' },
        { key: 'comunicacao', label: 'QUALIDADE DA COMUNICAÇÃO ESTRATÉGICA' },
        { key: 'gargalo', label: 'QUAL SEU MAIOR GARGALO OPERACIONAL HOJE?' } 
      ],
      dono: [ 
        { key: 'mercado', label: 'TEMPO DE OPERAÇÃO DA LOJA (ESTÁGIO)' }, 
        { key: 'meta', label: 'META MENSAL QUE TRARIA FELICIDADE' }, 
        { key: 'estagio', label: 'ESTÁGIO DO NEGÓCIO (SOBREVIVÊNCIA X ESCALA)' }, 
        { key: 'cultura', label: 'CULTURA DESEJADA VS CULTURA REAL' }, 
        { key: 'decisoes', label: 'CENTRALIZAÇÃO DE DECISÕES (O QUE PASSA PELO DONO)' }, 
        { key: 'dependencia', label: 'DEPENDÊNCIA DA OPERAÇÃO NO SÓCIO' }, 
        { key: 'visao', label: 'VISÃO DE FUTURO (PRÓXIMOS 12 MESES)' },
        { key: 'travas', label: 'MAIORES TRAVAS DE INVESTIMENTO HOJE' } 
      ],
      processo: [ 
        { key: 'usado', label: 'PROCESSO DE AVALIAÇÃO DE USADO (SLA EM MINUTOS)' }, 
        { key: 'troca', label: 'PODER DE NEGOCIAÇÃO DE TROCA NA PONTA' }, 
        { key: 'preparacao', label: 'QUALIDADE DA PREPARAÇÃO (CHECKLIST DE SAÍDA)' }, 
        { key: 'pos_venda', label: 'PROCESSO DE PÓS-VENDA E RELACIONAMENTO' }, 
        { key: 'precificacao', label: 'RIGOR NA PRECIFICAÇÃO DE COMPRA E VENDA' }, 
        { key: 'trafego', label: 'ESTRATÉGIA DE TRÁFEGO PAGO E CAPTAÇÃO' }, 
        { key: 'origem', label: 'CONTROLE DE ORIGEM DAS VENDAS (MKT)' },
        { key: 'estoque', label: 'ESTRATÉGIA AGRESSIVA PARA VEÍCULOS +90 DIAS' } 
      ]
    }
    const current = templates.find((t: any) => t.form_key === interviewTab)
    const fields = fieldsMap[interviewTab] || []

    return (
      <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
        <div className="flex gap-4 bg-mx-bg-secondary p-3 rounded-[40px] border-4 border-mx-border shadow-inner">
           {['gerente', 'dono', 'vendedor', 'processo'].map((t: any) => (
             <button 
                key={t} 
                onClick={() => setInterviewTab(t as any)} 
                className={cn(
                  "flex-1 py-5 text-xs font-black uppercase rounded-[28px] transition-all flex items-center justify-center gap-3", 
                  interviewTab === t 
                    ? "bg-brand-secondary text-white shadow-xl scale-[1.02] border-4 border-brand-secondary" 
                    : "opacity-30 hover:opacity-100 hover:bg-white hover:shadow-md"
                )}
             >
                {t === 'processo' ? <ShieldCheck size={18} /> : <Users size={18} />} {t}
             </button>
           ))}
        </div>
        <div className="p-16 bg-mx-bg-secondary rounded-[80px] border-4 border-mx-border shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-5"><MessageSquare size={250} /></div>
           
           <div className="relative z-10 mb-20">
             <Typography variant="tiny" tone="muted" className="mb-4 font-black uppercase tracking-[8px] text-brand-primary">Identificação Base</Typography>
             <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="bg-white h-24 text-4xl font-black border-4 focus:border-brand-primary rounded-[40px] shadow-2xl px-10 tracking-tighter" 
                placeholder="NOME DO ENTREVISTADO..." 
             />
           </div>

           <div className="space-y-16 relative z-10">
              {fields.map((f: any) => (
                <div key={f.key} className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary shadow-inner">
                         <Sparkles size={20} />
                      </div>
                      <Typography variant="tiny" className="font-black uppercase tracking-[3px] text-[12px] text-brand-secondary">
                         {f.label}
                      </Typography>
                   </div>
                   <Textarea 
                      value={form[f.key] || ''} 
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} 
                      className="bg-white min-h-[180px] rounded-[48px] border-4 focus:border-brand-primary shadow-xl font-bold text-xl p-10 transition-all hover:shadow-brand-primary/10" 
                      placeholder="DIAGNOSTIQUE O CENÁRIO REAL..." 
                   />
                </div>
              ))}
           </div>

           <div className="mt-24 pt-16 border-t-4 border-mx-border/30">
              <Button 
                 className="w-full h-32 text-4xl font-black shadow-[0_30px_60px_rgba(0,196,159,0.3)] bg-brand-secondary text-white rounded-[60px] hover:scale-[1.02] active:scale-95 transition-all uppercase italic tracking-tighter border-none" 
                 loading={loading}
                 onClick={async () => {
                    if(!name) return toast.error('NOME OBRIGATÓRIO');
                    setLoading(true);
                    try {
                      await onSaveResponse({ 
                         template_id: current.id, 
                         respondent_name: name, 
                         respondent_role: current.target_role, 
                         answers: form, 
                         visit_id: visitId 
                      });
                      toast.success('Diagnóstico Qualitativo Salvo!');
                      setForm({}); setName('')
                    } finally { setLoading(false) }
                 }}
              >
                 SALVAR NO CRM MX
              </Button>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 pb-20">
       <div className="flex bg-white/80 backdrop-blur-xl p-4 rounded-[60px] shadow-2xl border-4 border-mx-border sticky top-20 z-20 print:hidden overflow-hidden mx-auto max-w-5xl">
          {[
            { id: 'dashboards', label: 'DASHBOARDS BI', icon: BarChart3 },
            { id: 'benchmark', label: 'BENCHMARK ELITE', icon: TrendingUp },
            { id: 'entrevistas', label: 'ENTREVISTAS PMR', icon: MessageSquare }
          ].map((t: any) => (
            <button 
               key={t.id} 
               onClick={() => setTab(t.id as any)} 
               className={cn(
                  "flex-1 py-6 text-sm font-black uppercase rounded-[40px] transition-all flex items-center justify-center gap-5", 
                  tab === t.id 
                    ? "bg-brand-secondary text-white shadow-xl scale-[1.02] border-4 border-brand-secondary" 
                    : "opacity-40 hover:opacity-100 hover:bg-mx-bg-secondary"
               )}
            >
               <t.icon size={24} /> {t.label}
            </button>
          ))}
       </div>
       
       <div className="transition-all duration-700">
          {tab === 'dashboards' && renderDashboards()}
          {tab === 'benchmark' && renderBenchmark()}
          {tab === 'entrevistas' && renderEntrevistas()}
       </div>
    </div>
  )
}
