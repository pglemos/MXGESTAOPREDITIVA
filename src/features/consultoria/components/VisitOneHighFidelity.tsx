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

  return (
    <div className="space-y-6 pb-10">
       <div className="flex flex-wrap gap-2 bg-surface-alt/30 p-1.5 rounded-xl border border-border-default print:hidden">
          {[
            { id: 'dashboards', label: 'Dashboards BI', icon: BarChart3 },
            { id: 'benchmark', label: 'Comparativo Mercado', icon: TrendingUp },
            { id: 'entrevistas', label: 'Entrevistas PMR', icon: MessageSquare }
          ].map((t: any) => (
            <button 
               key={t.id} 
               onClick={() => setTab(t.id as any)} 
               className={cn(
                  "flex-1 py-2 px-4 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 min-w-[140px]", 
                  tab === t.id 
                    ? "bg-white text-brand-primary shadow-sm border border-border-subtle" 
                    : "text-text-tertiary hover:text-text-primary hover:bg-white/50"
               )}
            >
               <t.icon size={16} /> {t.label}
            </button>
          ))}
       </div>
       
       <div className="transition-opacity duration-300">
          {tab === 'dashboards' && <VisitOneDashboards data={quantData} onChange={onQuantChange} />}
          {tab === 'benchmark' && <VisitOneBenchmark />}
          {tab === 'entrevistas' && <VisitOneInterviews templates={templates} visitId={visitId} onSave={onSaveResponse} />}
       </div>
    </div>
  )
}

function VisitOneDashboards({ data, onChange }: { data: any, onChange: (d: any) => void }) {
  const sSales = data?.sales || []; const sMkt = data?.marketing || { investment: 0, leads: 0, origin: [] }; const sStk = data?.stock || { qty: 0, avg_price: 0, fipe_delta: 0, mileage: 0, total_inv: 0 }
  const totalSales = sSales.reduce((a: number, c: any) => a + (c.value || 0), 0)
  const COLORS = ['#0ea5e9', '#3b82f6', '#06b6d4', '#0284c7', '#0369a1'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-sm min-w-0">
          <Typography variant="h4" className="text-white mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-sky-400" /> Vendas Trimestre</Typography>
          <div className="h-[200px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={sSales} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={24} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#1e293b]">
            {sSales.map((s:any, i:number) => (
              <div key={i}>
                <Typography variant="tiny" className="text-slate-400 mb-1 block pl-1 text-[9px]">{s.month}</Typography>
                <Input type="number" value={s.value} onChange={e => { const n = [...sSales]; n[i].value = parseInt(e.target.value) || 0; onChange({...data, sales: n}) }} className="h-9 bg-[#1e293b] border-[#334155] text-white text-sm focus:border-sky-400 text-center px-1 rounded-lg" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-sm min-w-0">
          <Typography variant="h4" className="text-white mb-4 flex items-center gap-2"><PieChart className="w-4 h-4 text-sky-400" /> Performance MKT</Typography>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Typography variant="tiny" className="text-slate-400 mb-1 block text-[9px]">INVESTIMENTO (R$)</Typography>
                <Input type="number" value={sMkt.investment} onChange={e => onChange({...data, marketing: {...sMkt, investment: parseInt(e.target.value) || 0}})} className="h-9 bg-[#1e293b] border-[#334155] text-white text-sm focus:border-sky-400 rounded-lg" />
              </div>
              <div>
                <Typography variant="tiny" className="text-slate-400 mb-1 block text-[9px]">LEADS</Typography>
                <Input type="number" value={sMkt.leads} onChange={e => onChange({...data, marketing: {...sMkt, leads: parseInt(e.target.value) || 0}})} className="h-9 bg-[#1e293b] border-[#334155] text-white text-sm focus:border-sky-400 rounded-lg" />
              </div>
              <div className="pt-2">
                <Typography variant="tiny" className="text-sky-400 mb-0.5 block text-[9px]">CPL REAL</Typography>
                <Typography variant="h3" className="text-sky-400">R$ {((sMkt.investment || 0)/(sMkt.leads || 1)).toFixed(2)}</Typography>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="h-[120px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={sMkt.origin || []} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                      {(sMkt.origin || []).map((_e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1 w-full mt-2">
                {(sMkt.origin || []).map((o:any, i:number) => (
                  <div key={i}>
                    <Typography variant="tiny" className="text-slate-400 text-[8px] mb-0.5 truncate">{o.name}</Typography>
                    <Input type="number" value={o.value} onChange={e => { const arr = [...sMkt.origin]; arr[i].value = parseInt(e.target.value) || 0; onChange({...data, marketing: {...sMkt, origin: arr}}) }} className="h-7 bg-[#1e293b] border-[#334155] text-white text-xs px-1 text-center focus:border-sky-400 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-sm min-w-0">
        <Typography variant="h4" className="text-white mb-6 flex items-center gap-2"><Layers className="w-4 h-4 text-sky-400" /> Raio-X do Estoque</Typography>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { l: 'QTD (UN)', k: 'qty' }, { l: 'TICKET (R$)', k: 'avg_price' }, 
            { l: 'FIPE (+/-)', k: 'fipe_delta' }, { l: 'KM', k: 'mileage' }, { l: 'TOTAL (R$)', k: 'total_inv' }
          ].map(it => (
            <div key={it.k}>
              <Typography variant="tiny" className="text-slate-400 mb-1.5 block text-[9px] text-center">{it.l}</Typography>
              <Input type="number" value={sStk[it.k]} onChange={e => onChange({...data, stock: {...sStk, [it.k]: parseFloat(e.target.value) || 0}})} className="h-10 bg-[#1e293b] border-[#334155] text-white text-sm text-center focus:border-sky-400 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function VisitOneBenchmark() {
  const rows = [ 
    { label: 'Vendas Totais em relação ao Estoque', avg: '28%', best: '48%', p: 'Ex: 32%' },
    { label: 'Venda média por vendedor', avg: '6,7', best: '8,0', p: 'Ex: 5,5' },
    { label: '% Vendas Origem Internet', avg: '52%', best: '65%', p: 'Ex: 48%' },
    { label: 'Leads recebidos / mês', avg: '480', best: '820', p: 'Ex: 520' },
    { label: 'Leads por vendedor', avg: '90', best: '180', p: 'Ex: 120' },
    { label: 'Giro de Estoque', avg: '0,45', best: '0,65', p: 'Ex: 0,38' },
    { label: '% Veículos +90 dias', avg: '26%', best: '15%', p: 'Ex: 35%' }
  ]
  return (
    <Card className="p-6 border border-border-default rounded-2xl bg-white shadow-sm overflow-hidden">
       <div className="mb-6">
         <Typography variant="h3" className="mb-1">Comparativo de Mercado</Typography>
         <Typography variant="p" className="text-xs text-text-tertiary">Auditoria baseada nas métricas de mercado MX.</Typography>
       </div>
       <div className="overflow-x-auto border border-border-subtle rounded-xl">
         <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-surface-alt/50 border-b border-border-subtle">
                 <th className="p-3 text-[10px] font-bold text-text-secondary uppercase">Indicador Estratégico</th>
                 <th className="p-3 text-[10px] font-bold text-center border-l border-border-subtle w-32">Sua Loja</th>
                 <th className="p-3 text-[10px] font-bold text-center border-l border-border-subtle text-status-warning w-24">Mercado</th>
                 <th className="p-3 text-[10px] font-bold text-center border-l border-border-subtle text-brand-primary w-24">MX Elite</th>
                 <th className="p-3 text-[10px] font-bold border-l border-border-subtle">Parecer Técnico</th>
              </tr>
            </thead>
            <tbody className="text-sm">
               {rows.map((it) => (
                 <tr key={it.label} className="border-b border-border-subtle last:border-0 hover:bg-surface-alt/20">
                    <td className="p-3 font-medium text-text-secondary text-xs">{it.label}</td>
                    <td className="p-2 border-l border-border-subtle"><Input className="h-9 text-center font-bold bg-white border-border-default shadow-sm text-sm" placeholder={it.p} /></td>
                    <td className="p-3 text-center font-medium text-status-warning border-l border-border-subtle">{it.avg}</td>
                    <td className="p-3 text-center font-bold text-brand-primary border-l border-border-subtle">{it.best}</td>
                    <td className="p-2 border-l border-border-subtle"><Textarea className="min-h-[36px] h-9 resize-none text-xs py-2 bg-white border-border-default shadow-sm" placeholder="Onde está o gargalo?" /></td>
                 </tr>
               ))}
            </tbody>
         </table>
       </div>
    </Card>
  )
}

function VisitOneInterviews({ templates, visitId, onSave }: { templates: any[], visitId?: string, onSave: (d: any) => Promise<void> }) {
  const [active, setActive] = useState('gerente')
  const [form, setForm] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  const [load, setLoad] = useState(false)

  const maps: any = {
    vendedor: [{k:'crm', l:'Uso CRM e Funil'}, {k:'online', l:'Qualidade Online'}, {k:'clima', l:'Clima e Motivação'}, {k:'limite', l:'Maior Limitador'}],
    gerente: [{k:'lider', l:'Perfil de Liderança'}, {k:'sgap', l:'Rigor no SGAP'}, {k:'feedback', l:'Rotina de Feedback'}, {k:'gargalo', l:'Gargalo Operacional'}],
    dono: [{k:'meta', l:'Meta Mensal Desejada'}, {k:'estagio', l:'Estágio do Negócio'}, {k:'dependencia', l:'Dependência do Sócio'}, {k:'trava', l:'Travas de Investimento'}],
    processo: [{k:'usado', l:'Avaliação de Usado (SLA)'}, {k:'prep', l:'Preparação (Checklist)'}, {k:'pos', l:'Pós-Venda'}, {k:'estoque', l:'Veículos +90 dias'}]
  }
  const current = templates.find((t: any) => t.form_key === active)
  const fields = maps[active] || []

  return (
    <Card className="p-6 border border-border-default rounded-2xl bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border-subtle pb-6">
        {['gerente', 'dono', 'vendedor', 'processo'].map((t) => (
          <Button key={t} size="sm" variant={active === t ? 'primary' : 'outline'} onClick={() => setActive(t)} className="capitalize text-xs px-4 h-8">{t}</Button>
        ))}
      </div>
      <div className="space-y-4 max-w-3xl">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block">Nome do Entrevistado</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-10 bg-white border-border-default shadow-sm" placeholder="Nome completo..." />
        </div>
        {fields.map((f: any) => (
          <div key={f.k}>
            <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-brand-primary" /> {f.l}</label>
            <Textarea value={form[f.k] || ''} onChange={e => setForm({...form, [f.k]: e.target.value})} className="min-h-[80px] text-sm resize-none bg-white border-border-default shadow-sm" placeholder="Observações e diagnóstico qualitativo..." />
          </div>
        ))}
        <Button className="w-full sm:w-auto mt-4 shadow-sm h-10" loading={load} variant="primary" onClick={async () => {
          if(!name) return toast.error('Nome obrigatório');
          setLoad(true);
          try {
            await onSave({ template_id: current?.id, respondent_name: name, respondent_role: current?.target_role, answers: form, visit_id: visitId });
            toast.success('Salvo!'); setForm({}); setName('')
          } finally { setLoad(false) }
        }}>Salvar Diagnóstico</Button>
      </div>
    </Card>
  )
}
