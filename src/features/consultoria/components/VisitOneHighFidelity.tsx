import React, { useState } from 'react'
import { 
  BarChart3, TrendingUp, MessageSquare, Sparkles, 
  BarChart, PieChart, Info, ChevronRight, Activity,
  Target, Users, Zap, Search, ArrowUpRight
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
  PieChart as RePieChart, Pie, Cell
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
    const totalSales = quantData.sales.reduce((acc: number, cur: any) => acc + cur.value, 0)
    const avgSales = (totalSales / quantData.sales.length).toFixed(1)
    const bestMonth = [...quantData.sales].sort((a,b) => b.value - a.value)[0]
    const worstMonth = [...quantData.sales].sort((a,b) => a.value - b.value)[0]

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 bg-[#1a1f2e] text-white border-none shadow-2xl overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><BarChart size={120} /></div>
               <Typography variant="h3" tone="white" className="mb-8 font-black uppercase italic border-b border-white/10 pb-4 flex items-center gap-3">
                  <Activity className="text-brand-primary" /> Diagnóstico de Vendas
               </Typography>
               <div className="h-[280px] w-full"><ResponsiveContainer><ReBarChart data={quantData.sales}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} /><XAxis dataKey="month" stroke="#fff" fontSize={12} fontWeight="bold" /><YAxis stroke="#fff" fontSize={12} /><Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #ffffff20', borderRadius: '16px' }} /><Bar dataKey="value" fill="#00C49F" radius={[10, 10, 0, 0]} label={{ position: 'top', fill: '#fff', fontSize: 14, fontWeight: 'black' }} /></ReBarChart></ResponsiveContainer></div>
               <div className="grid grid-cols-4 gap-3 mt-8">
                  {[
                    { label: 'TOTAL', val: totalSales, color: 'text-brand-primary' },
                    { label: 'MÉDIA', val: avgSales, color: 'text-brand-primary' },
                    { label: 'MAIOR', val: bestMonth.value, color: 'text-brand-primary' },
                    { label: 'MENOR', val: worstMonth.value, color: 'text-mx-error' }
                  ].map(stat => (
                    <div key={stat.label} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center shadow-inner">
                       <Typography variant="tiny" className="font-black text-[9px] opacity-40 uppercase tracking-widest">{stat.label}</Typography>
                       <Typography variant="h4" className={cn("font-black mt-1", stat.color)}>{stat.val}</Typography>
                    </div>
                  ))}
               </div>
            </Card>

            <Card className="p-8 bg-[#1a1f2e] text-white border-none shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><PieChart size={120} /></div>
               <Typography variant="h3" tone="white" className="mb-8 font-black uppercase italic border-b border-white/10 pb-4 flex items-center gap-3">
                  <Zap className="text-brand-primary" /> Performance MKT
               </Typography>
               <div className="grid grid-cols-2 gap-4 h-[280px]">
                  <div className="flex flex-col justify-center gap-4">
                     <div className="p-5 bg-white/5 rounded-[32px] border border-white/10 shadow-inner">
                        <Typography variant="tiny" className="font-black opacity-40 uppercase text-[8px] tracking-widest">Investimento</Typography>
                        <Typography variant="body" className="font-black text-xl">R$ {quantData.marketing.investment.toLocaleString()}</Typography>
                     </div>
                     <div className="p-5 bg-white/5 rounded-[32px] border border-white/10 shadow-inner">
                        <Typography variant="tiny" className="font-black opacity-40 uppercase text-[8px] tracking-widest">CPL Real</Typography>
                        <Typography variant="h4" className="font-black text-brand-primary">R$ {(quantData.marketing.investment / (quantData.marketing.leads || 1)).toFixed(2)}</Typography>
                     </div>
                  </div>
                  <ResponsiveContainer><RePieChart><Pie data={quantData.marketing.origin} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">{quantData.marketing.origin.map((_e: any, i: number) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}</Pie><Tooltip /></RePieChart></ResponsiveContainer>
               </div>
               <div className="flex flex-wrap gap-2 mt-4">
                  {quantData.marketing.origin.map((o:any, i:number) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-tighter">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{background: COLORS[i%COLORS.length]}}/> {o.name}
                    </div>
                  ))}
               </div>
            </Card>
         </div>

         <Card className="p-10 bg-[#1a1f2e] text-white border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5"><Layers size={150} /></div>
            <Typography variant="h3" tone="white" className="mb-12 font-black uppercase italic border-b border-white/10 pb-6 flex items-center gap-3">
               <Search className="text-brand-primary" /> Raio-X do Estoque & Gestão
            </Typography>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
               {[
                 { label: 'QTD TOTAL', val: quantData.stock.qty, sub: 'Veículos', icon: MousePointer2 },
                 { label: 'PREÇO MÉDIO', val: `R$ ${(quantData.stock.avg_price / 1000).toFixed(1)}k`, sub: 'Posicionamento', icon: TrendingUp },
                 { label: 'RELAÇÃO FIPE', val: `+R$ ${quantData.stock.fipe_delta}`, sub: 'Margem Bruta', icon: ShieldCheck },
                 { label: 'KM MÉDIA', val: '000.000', sub: 'Perfil de Compra', icon: Gauge },
                 { label: 'INV. TOTAL', val: 'R$ 3.7M', sub: 'Capital Imobilizado', icon: Calculator }
               ].map(it => (
                 <div key={it.label} className="p-8 bg-white/5 rounded-[40px] border border-white/10 text-center shadow-inner group hover:bg-brand-primary/10 transition-all">
                    <Typography variant="tiny" className="font-black opacity-30 block mb-3 uppercase tracking-[3px] text-[8px]">{it.label}</Typography>
                    <Typography variant="h2" className="font-black mb-1 group-hover:scale-110 transition-transform">{it.val}</Typography>
                    <Typography variant="tiny" className="font-bold opacity-20 uppercase text-[9px]">{it.sub}</Typography>
                 </div>
               ))}
            </div>
         </Card>
      </div>
    )
  }

  const renderBenchmark = () => (
    <Card className="p-12 bg-white border-4 border-mx-border shadow-2xl rounded-[60px] overflow-x-auto animate-in slide-in-from-bottom duration-700">
       <div className="flex flex-col items-center mb-16">
          <Badge className="mb-4 px-8 py-2 bg-brand-primary/10 text-brand-primary font-black border-none uppercase italic tracking-widest">Slide 7: Paridade de Mercado</Badge>
          <Typography variant="h1" className="font-black uppercase italic text-center text-brand-secondary tracking-tighter leading-none">Comparativo com o Mercado</Typography>
       </div>
       <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b-8 border-mx-border bg-mx-bg-secondary">
               <th className="p-8 font-black uppercase text-xs tracking-widest">Indicador Estratégico</th>
               <th className="p-8 font-black uppercase text-xs tracking-widest text-center">Sua Loja</th>
               <th className="p-8 font-black uppercase text-xs tracking-widest text-center text-mx-warning bg-mx-warning/5 italic">Média Mercado</th>
               <th className="p-8 font-black uppercase text-xs tracking-widest text-center text-brand-primary bg-brand-primary/5 italic">Boa Prática MX</th>
               <th className="p-8 font-black uppercase text-xs tracking-widest">Comentários e Desvios</th>
            </tr>
          </thead>
          <tbody>
             {[ 
               { label: 'Vendas Totais em relação ao Estoque', avg: '28', best: '48' },
               { label: 'Venda média/vendedor', avg: '6,7', best: '8' },
               { label: '% Vendas Internet', avg: '52%', best: '65%' },
               { label: 'Leads recebidos/mês', avg: '480', best: '820' },
               { label: 'Leads por vendedor', avg: '90', best: '180' },
               { label: 'Giro de Estoque', avg: '0,45', best: '0,65' },
               { label: '% Carros > 90 dias no pátio', avg: '26%', best: '15%' }
             ].map((it, i) => (
               <tr key={it.label} className="border-b-2 border-mx-border/30 hover:bg-mx-bg-secondary/20 transition-all">
                  <td className="p-8 font-black text-brand-secondary text-lg italic tracking-tight">{it.label}</td>
                  <td className="p-8"><Input className="h-14 text-center text-2xl font-black border-4 border-brand-primary/20 rounded-2xl bg-mx-bg-secondary/10 shadow-inner" placeholder="0" /></td>
                  <td className="p-8 text-center font-black text-xl opacity-40 bg-mx-warning/5">{it.avg}</td>
                  <td className="p-8 text-center font-black text-xl text-brand-primary bg-brand-primary/5">{it.best}</td>
                  <td className="p-8"><Textarea placeholder="Qual o gargalo aqui?" className="min-h-[100px] font-bold border-2 focus:border-brand-primary rounded-[24px] p-4 text-sm" /></td>
               </tr>
             ))}
          </tbody>
       </table>
    </Card>
  )

  const renderEntrevistas = () => {
    const fieldsMap: any = {
      vendedor: [ 
        { key: 'funcao', label: 'Qual sua função atual?' }, 
        { key: 'tempo', label: 'Tempo de mercado (anos)' }, 
        { key: 'remuneracao', label: 'Plano de Remuneração: Entendimento e Justiça' },
        { key: 'rotina', label: 'Disciplina com Rotina MX (SGAP, Matinal)' },
        { key: 'capacidade', label: 'Capacidade Técnica e Domínio de Produto' },
        { key: 'online', label: 'Qualidade do Atendimento Online' },
        { key: 'presencial', label: 'Qualidade do Atendimento Presencial' },
        { key: 'clima', label: 'Clima, Motivação e Unidade da Equipe' },
        { key: 'limitador', label: 'Qual seu maior limitador individual hoje?' } 
      ],
      gerente: [ 
        { key: 'tempo', label: 'Tempo de experiência como Gestor' }, 
        { key: 'contratacao', label: 'Processo de Contratação e Onboarding' }, 
        { key: 'treinamento', label: 'Frequência de Treinamento da Equipe' }, 
        { key: 'acompanhamento', label: 'Rigor no Acompanhamento Diário' }, 
        { key: 'feedback', label: 'Rotina de Feedback Estruturado' },
        { key: 'sinergia', label: 'Sinergia Gerente x Equipe' },
        { key: 'comunicacao', label: 'Qualidade da Comunicação Estratégica' },
        { key: 'gargalo', label: 'Qual seu maior gargalo operacional?' } 
      ],
      dono: [ 
        { key: 'mercado', label: 'Tempo de operação da loja' }, 
        { key: 'meta', label: 'Meta Mensal que traria felicidade' }, 
        { key: 'estagio', label: 'Estágio do Negócio (Sobrevivência x Escala)' }, 
        { key: 'cultura', label: 'Cultura Desejada vs Cultura Real' }, 
        { key: 'decisoes', label: 'Centralização de Decisões (O que passa pelo dono)' }, 
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
        { key: 'origem', label: 'Controle de Origem das Vendas' },
        { key: 'estoque', label: 'Estratégia para Veículos +90 dias' } 
      ]
    }
    const current = templates.find((t: any) => t.form_key === interviewTab)
    const fields = fieldsMap[interviewTab] || []

    return (
      <div className="space-y-8 animate-in slide-in-from-right duration-500">
        <div className="flex gap-2 bg-mx-bg-secondary p-2 rounded-[32px] border-4 border-mx-border shadow-inner">
           {['gerente', 'dono', 'vendedor', 'processo'].map((t: any) => (
             <button key={t} onClick={() => setInterviewTab(t as any)} className={cn("flex-1 py-4 text-xs font-black uppercase rounded-[24px] transition-all flex items-center justify-center gap-3", interviewTab === t ? "bg-brand-primary text-white shadow-2xl scale-105" : "opacity-30 hover:opacity-100")}>
                {t === 'processo' ? <ShieldCheck size={16} /> : <Users size={16} />} {t}
             </button>
           ))}
        </div>
        <div className="p-12 bg-mx-bg-secondary rounded-[60px] border-4 border-mx-border shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5"><MessageSquare size={200} /></div>
           <Typography variant="tiny" tone="muted" className="mb-3 font-black uppercase tracking-[5px] text-brand-primary">Identificação Base</Typography>
           <Input value={name} onChange={e => setName(e.target.value)} className="bg-white mb-16 h-20 text-3xl font-black border-4 focus:border-brand-primary rounded-[32px] shadow-xl px-8" placeholder="Quem estamos ouvindo?" />
           <div className="space-y-12">
              {fields.map((f: any) => (
                <div key={f.key} className="space-y-4 relative">
                   <div className="flex items-center gap-3"><div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary"><Sparkles size={16} /></div><Typography variant="tiny" className="font-black uppercase tracking-widest text-[11px] text-brand-secondary">{f.label}</Typography></div>
                   <Textarea value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="bg-white min-h-[140px] rounded-[40px] border-4 focus:border-brand-primary shadow-lg font-bold text-lg p-8 transition-all hover:shadow-brand-primary/5" placeholder="Digite o parecer técnico detalhado aqui..." />
                </div>
              ))}
           </div>
           <Button className="w-full mt-20 h-28 text-3xl font-black shadow-[0_20px_50px_rgba(0,196,159,0.3)] bg-brand-secondary text-white rounded-[48px] hover:scale-[1.02] active:scale-95 transition-all uppercase italic tracking-tighter" onClick={() => { onSaveResponse({ template_id: current.id, respondent_name: name, respondent_role: current.target_role, answers: form, visit_id: visitId }); toast.success('Diagnóstico Salvo com Sucesso!'); setForm({}); setName('') }}>SALVAR NO CRM</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
       <div className="flex bg-white p-4 rounded-[48px] shadow-mx-2xl border-4 border-mx-border sticky top-20 z-20 print:hidden overflow-hidden">
          {[
            { id: 'dashboards', label: 'DASHBOARDS BI', icon: BarChart3 },
            { id: 'benchmark', label: 'BENCHMARK MERCADO', icon: TrendingUp },
            { id: 'entrevistas', label: 'ENTREVISTAS PMR', icon: MessageSquare }
          ].map((t: any) => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={cn("flex-1 py-5 text-sm font-black uppercase rounded-[32px] transition-all flex items-center justify-center gap-4", tab === t.id ? "bg-brand-primary text-white shadow-[0_10px_30px_rgba(0,196,159,0.4)] scale-105" : "opacity-30 hover:opacity-100 hover:bg-mx-bg-secondary")}>
               <t.icon size={22} /> {t.label}
            </button>
          ))}
       </div>
       <div className="animate-in fade-in zoom-in-95 duration-500">
          {tab === 'dashboards' && renderDashboards()}
          {tab === 'benchmark' && renderBenchmark()}
          {tab === 'entrevistas' && renderEntrevistas()}
       </div>
    </div>
  )
}
