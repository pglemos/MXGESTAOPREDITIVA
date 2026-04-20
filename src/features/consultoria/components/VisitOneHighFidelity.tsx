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

export function VisitOneHighFidelity({ quantData, onQuantChange }: { quantData: any, onQuantChange: (d: any) => void }) {
  const sSales = quantData?.sales || []; 
  const sMkt = quantData?.marketing || { investment: 0, leads: 0, origin: [] }; 
  const sStk = quantData?.stock || { qty: 0, avg_price: 0, fipe_delta: 0, mileage: 0, total_inv: 0 }
  
  const totalSales = sSales.reduce((a: number, c: any) => a + (c.value || 0), 0)
  const avgSales = sSales.length > 0 ? (totalSales / sSales.length).toFixed(1) : '0'
  const bestMonth = [...sSales].sort((a,b) => (b.value || 0) - (a.value || 0))[0] || { value: 0 }
  const worstMonth = [...sSales].sort((a,b) => (a.value || 0) - (b.value || 0))[0] || { value: 0 }
  
  const COLORS = ['#00C49F', '#009B7D', '#00725C', '#004A3C', '#00221B'];
  const displayOrigin = sMkt.origin?.some((o:any)=>o.value>0) ? sMkt.origin : [{name: 'Sem Dados', value: 1, color: '#1e293b'}];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-w-0">
        {/* Vendas Trimestre */}
        <Card className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm min-w-0">
          <Typography variant="h4" className="text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-primary" /> Vendas Trimestre
          </Typography>
          <div className="h-[200px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={sSales} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" fill="#00C49F" radius={[4, 4, 0, 0]} barSize={32} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800">
            {sSales.map((s:any, i:number) => (
              <div key={i}>
                <Typography variant="tiny" className="text-slate-400 mb-1 block pl-1 text-[10px] font-bold uppercase">{s.month}</Typography>
                <Input type="number" value={s.value} onChange={e => { const n = [...sSales]; n[i].value = parseInt(e.target.value) || 0; onQuantChange({...quantData, sales: n}) }} className="h-10 bg-slate-800 border-slate-700 text-white text-sm font-bold focus:border-brand-primary focus:bg-slate-800 text-center px-1 rounded-lg" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800">
            <div className="text-center"><Typography variant="tiny" className="text-slate-400 text-[10px] font-bold">TOTAL</Typography><Typography variant="h4" className="font-black text-brand-primary">{totalSales}</Typography></div>
            <div className="text-center"><Typography variant="tiny" className="text-slate-400 text-[10px] font-bold">MÉDIA</Typography><Typography variant="h4" className="font-black text-brand-primary">{avgSales}</Typography></div>
            <div className="text-center"><Typography variant="tiny" className="text-slate-400 text-[10px] font-bold">MELHOR</Typography><Typography variant="h4" className="font-black text-brand-primary">{bestMonth.value}</Typography></div>
            <div className="text-center"><Typography variant="tiny" className="text-slate-400 text-[10px] font-bold">PIOR</Typography><Typography variant="h4" className="font-black text-status-error">{worstMonth.value}</Typography></div>
          </div>
        </Card>

        {/* Performance MKT */}
        <Card className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm min-w-0">
          <Typography variant="h4" className="text-white mb-6 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brand-primary" /> Performance MKT
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Typography variant="tiny" className="text-slate-400 mb-1 block text-[10px] font-bold uppercase pl-1">Investimento (R$)</Typography>
                <Input type="number" value={sMkt.investment} onChange={e => onQuantChange({...quantData, marketing: {...sMkt, investment: parseInt(e.target.value) || 0}})} className="h-10 bg-slate-800 border-slate-700 text-white text-sm font-bold focus:border-brand-primary focus:bg-slate-800 rounded-lg" />
              </div>
              <div>
                <Typography variant="tiny" className="text-slate-400 mb-1 block text-[10px] font-bold uppercase pl-1">Leads</Typography>
                <Input type="number" value={sMkt.leads} onChange={e => onQuantChange({...quantData, marketing: {...sMkt, leads: parseInt(e.target.value) || 0}})} className="h-10 bg-slate-800 border-slate-700 text-white text-sm font-bold focus:border-brand-primary focus:bg-slate-800 rounded-lg" />
              </div>
              <div className="pt-3 border-t border-slate-800 mt-2">
                <Typography variant="tiny" className="text-brand-primary mb-0.5 block text-[10px] font-bold">CPL REAL</Typography>
                <Typography variant="h3" className="text-brand-primary">R$ {((sMkt.investment || 0)/(sMkt.leads || 1)).toFixed(2)}</Typography>
              </div>
            </div>
            <div className="flex flex-col items-center justify-between">
              <div className="h-[140px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={displayOrigin} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                      {displayOrigin.map((entry: any, i: number) => <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mt-4">
                {(sMkt.origin || []).map((o:any, i:number) => (
                  <div key={i}>
                    <Typography variant="tiny" className="text-slate-400 text-[10px] font-bold flex items-center gap-1.5 mb-1 truncate"><div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background: COLORS[i%COLORS.length]}}/> {o.name}</Typography>
                    <Input type="number" value={o.value} onChange={e => { const arr = [...sMkt.origin]; arr[i].value = parseInt(e.target.value) || 0; onQuantChange({...quantData, marketing: {...sMkt, origin: arr}}) }} className="h-8 bg-slate-800 border-slate-700 text-white text-xs px-1 text-center focus:border-brand-primary focus:bg-slate-800 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Raio-X do Estoque */}
      <Card className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm min-w-0">
        <Typography variant="h4" className="text-white mb-6 flex items-center gap-2"><Layers className="w-4 h-4 text-brand-primary" /> Raio-X do Estoque</Typography>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { l: 'QTD (UN)', k: 'qty' }, { l: 'TICKET (R$)', k: 'avg_price' }, 
            { l: 'FIPE (+/-)', k: 'fipe_delta' }, { l: 'KM', k: 'mileage' }, { l: 'TOTAL (R$)', k: 'total_inv' }
          ].map(it => (
            <div key={it.k}>
              <Typography variant="tiny" className="text-slate-400 mb-1.5 block text-[10px] font-bold text-center uppercase tracking-wider">{it.l}</Typography>
              <Input type="number" value={sStk[it.k]} onChange={e => onQuantChange({...quantData, stock: {...sStk, [it.k]: parseFloat(e.target.value) || 0}})} className="h-10 bg-slate-800 border-slate-700 text-white text-sm text-center focus:border-brand-primary focus:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function VisitOneBenchmark() {
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
         <Typography variant="h3" className="mb-1 text-lg">Comparativo de Mercado</Typography>
         <Typography variant="p" className="text-xs text-text-tertiary">Auditoria baseada nas métricas do Slide 7 MX.</Typography>
       </div>
       <div className="overflow-x-auto border border-border-subtle rounded-xl">
         <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-surface-alt/50 border-b border-border-subtle">
                 <th className="p-4 text-[10px] font-bold text-text-secondary uppercase">Indicador Estratégico</th>
                 <th className="p-4 text-[10px] font-bold text-center border-l border-border-subtle w-32">Sua Loja</th>
                 <th className="p-4 text-[10px] font-bold text-center border-l border-border-subtle text-status-warning w-24 bg-status-warning/5">Mercado</th>
                 <th className="p-4 text-[10px] font-bold text-center border-l border-border-subtle text-brand-primary w-24 bg-brand-primary/5">MX Elite</th>
                 <th className="p-4 text-[10px] font-bold border-l border-border-subtle">Parecer Técnico</th>
              </tr>
            </thead>
            <tbody className="text-sm">
               {rows.map((it) => (
                 <tr key={it.label} className="border-b border-border-subtle last:border-0 hover:bg-surface-alt/20 transition-colors">
                    <td className="p-4 font-medium text-text-secondary text-xs">{it.label}</td>
                    <td className="p-3 border-l border-border-subtle"><Input className="h-10 text-center font-bold bg-white border-border-default shadow-sm focus:border-brand-primary rounded-lg text-sm" placeholder={it.p} /></td>
                    <td className="p-4 text-center font-medium text-status-warning border-l border-border-subtle bg-status-warning/5">{it.avg}</td>
                    <td className="p-4 text-center font-bold text-brand-primary border-l border-border-subtle bg-brand-primary/5">{it.best}</td>
                    <td className="p-3 border-l border-border-subtle"><Textarea className="min-h-[40px] h-10 resize-none text-xs py-2 bg-white border-border-default focus:border-brand-primary shadow-sm rounded-lg" placeholder="Onde está o gargalo?" /></td>
                 </tr>
               ))}
            </tbody>
         </table>
       </div>
    </Card>
  )
}

export function VisitOneInterviews({ templates, visitId, onSave }: { templates: any[], visitId?: string, onSave: (d: any) => Promise<void> }) {
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
    <Card className="p-6 md:p-8 border border-border-default rounded-2xl bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border-subtle pb-6">
        {['gerente', 'dono', 'vendedor', 'processo'].map((t) => (
          <Button key={t} size="sm" variant={active === t ? 'primary' : 'outline'} onClick={() => setActive(t)} className="capitalize text-xs px-4 h-9 rounded-lg font-bold">{t}</Button>
        ))}
      </div>
      <div className="space-y-6 max-w-3xl">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1.5 block ml-1">Nome do Entrevistado</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-11 bg-surface-alt/30 border-border-default focus:bg-white focus:border-brand-primary rounded-xl" placeholder="Nome completo..." />
        </div>
        {fields.map((f: any) => (
          <div key={f.k}>
            <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1.5 block flex items-center gap-1.5 ml-1"><Sparkles className="w-3 h-3 text-brand-primary" /> {f.l}</label>
            <Textarea value={form[f.k] || ''} onChange={e => setForm({...form, [f.k]: e.target.value})} className="min-h-[100px] text-sm resize-none bg-white border-border-default focus:border-brand-primary shadow-sm rounded-xl p-3" placeholder="Observações e diagnóstico qualitativo..." />
          </div>
        ))}
        <Button className="w-full sm:w-auto mt-4 shadow-sm h-11 px-8 rounded-xl font-bold" loading={load} variant="primary" onClick={async () => {
          if(!name) return toast.error('Nome obrigatório');
          setLoad(true);
          try {
            await onSave({ template_id: current?.id, respondent_name: name, respondent_role: current?.target_role, answers: form, visit_id: visitId });
            toast.success('Diagnóstico salvo!'); setForm({}); setName('')
          } finally { setLoad(false) }
        }}>Salvar Diagnóstico no CRM</Button>
      </div>
    </Card>
  )
}
