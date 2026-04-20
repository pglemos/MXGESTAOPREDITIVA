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

export function VisitOneHighFidelity({ quantData, onQuantChange, templates, visitId, onSaveResponse }: { quantData: any, onQuantChange: (d: any) => void, templates: any[], visitId?: string, onSaveResponse: (d: any) => Promise<void> }) {
  const [tab, setTab] = useState<'dashboards' | 'benchmark' | 'entrevistas'>('dashboards')

  return (
    <div className="space-y-6 pb-10">
       <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl border border-border-default shadow-sm print:hidden">
          {[
            { id: 'dashboards', label: 'Dashboards BI', icon: BarChart3 },
            { id: 'benchmark', label: 'Comparativo Mercado', icon: TrendingUp },
            { id: 'entrevistas', label: 'Entrevistas PMR', icon: MessageSquare }
          ].map((t: any) => (
            <button 
               key={t.id} 
               onClick={() => setTab(t.id as any)} 
               className={cn(
                  "flex-1 py-2 px-4 text-[11px] md:text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-2 min-w-[140px]", 
                  tab === t.id 
                    ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-sm" 
                    : "text-text-tertiary hover:text-text-primary hover:bg-surface-alt/50"
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
  const avgSales = sSales.length > 0 ? (totalSales / sSales.length).toFixed(1) : '0'
  const bestMonth = [...sSales].sort((a,b) => (b.value || 0) - (a.value || 0))[0] || { value: 0 }
  const worstMonth = [...sSales].sort((a,b) => (a.value || 0) - (b.value || 0))[0] || { value: 0 }
  
  const COLORS = ['#00C49F', '#009B7D', '#00725C', '#004A3C', '#00221B'];
  const displayOrigin = sMkt.origin?.some((o:any)=>o.value>0) ? sMkt.origin : [{name: 'Sem Dados', value: 1, color: '#1e293b'}];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-w-0">
        <Card className="p-6 md:p-8 bg-white border border-border-default rounded-3xl shadow-sm min-w-0">
          <Typography variant="h4" className="text-text-primary mb-6 flex items-center gap-3"><BarChart3 className="w-5 h-5 text-brand-primary" /> Vendas Trimestre</Typography>
          <div className="h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={sSales} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="value" fill="#00C49F" radius={[6, 6, 0, 0]} barSize={36} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border-subtle">
            {sSales.map((s:any, i:number) => (
              <div key={i}>
                <Typography variant="tiny" className="text-text-tertiary mb-2 block font-bold text-[11px] uppercase tracking-wider">{s.month}</Typography>
                <Input type="number" value={s.value} onChange={e => { const n = [...sSales]; n[i].value = parseInt(e.target.value) || 0; onChange({...data, sales: n}) }} className="h-12 bg-white border border-border-default text-text-primary text-lg font-black focus:border-brand-primary text-center rounded-xl shadow-sm transition-all" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border-subtle">
            <div className="text-center"><Typography variant="tiny" className="text-text-tertiary text-[10px] font-bold tracking-widest uppercase">TOTAL</Typography><Typography variant="h3" className="font-black text-brand-primary mt-1">{totalSales}</Typography></div>
            <div className="text-center"><Typography variant="tiny" className="text-text-tertiary text-[10px] font-bold tracking-widest uppercase">MÉDIA</Typography><Typography variant="h3" className="font-black text-brand-primary mt-1">{avgSales}</Typography></div>
            <div className="text-center"><Typography variant="tiny" className="text-text-tertiary text-[10px] font-bold tracking-widest uppercase">MELHOR</Typography><Typography variant="h3" className="font-black text-brand-primary mt-1">{bestMonth.value}</Typography></div>
            <div className="text-center"><Typography variant="tiny" className="text-text-tertiary text-[10px] font-bold tracking-widest uppercase">PIOR</Typography><Typography variant="h3" className="font-black text-status-error mt-1">{worstMonth.value}</Typography></div>
          </div>
        </Card>

        <Card className="p-6 md:p-8 bg-white border border-border-default rounded-3xl shadow-sm min-w-0">
          <Typography variant="h4" className="text-text-primary mb-6 flex items-center gap-3"><PieChart className="w-5 h-5 text-brand-primary" /> Performance MKT</Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <Typography variant="tiny" className="text-text-tertiary mb-2 block font-bold text-[11px] uppercase tracking-wider pl-1">INVESTIMENTO (R$)</Typography>
                <Input type="number" value={sMkt.investment} onChange={e => onChange({...data, marketing: {...sMkt, investment: parseInt(e.target.value) || 0}})} className="h-12 bg-white border border-border-default text-text-primary text-lg font-black focus:border-brand-primary rounded-xl shadow-sm transition-all" />
              </div>
              <div>
                <Typography variant="tiny" className="text-text-tertiary mb-2 block font-bold text-[11px] uppercase tracking-wider pl-1">LEADS</Typography>
                <Input type="number" value={sMkt.leads} onChange={e => onChange({...data, marketing: {...sMkt, leads: parseInt(e.target.value) || 0}})} className="h-12 bg-white border border-border-default text-text-primary text-lg font-black focus:border-brand-primary rounded-xl shadow-sm transition-all" />
              </div>
              <div className="pt-4 border-t border-border-subtle mt-2">
                <Typography variant="tiny" className="text-brand-primary mb-1 block font-black text-xs tracking-widest uppercase">CPL REAL</Typography>
                <Typography variant="h2" className="text-brand-primary font-black">R$ {((sMkt.investment || 0)/(sMkt.leads || 1)).toFixed(2)}</Typography>
              </div>
            </div>
            <div className="flex flex-col items-center justify-between">
              <div className="h-[140px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={displayOrigin} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                      {displayOrigin.map((entry: any, i: number) => <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full mt-6">
                {(sMkt.origin || []).map((o:any, i:number) => (
                  <div key={i}>
                    <Typography variant="tiny" className="text-text-secondary text-[10px] font-bold mb-1.5 flex items-center gap-1.5 truncate"><div className="w-2 h-2 rounded-full shrink-0" style={{background: COLORS[i%COLORS.length]}}/> {o.name}</Typography>
                    <Input type="number" value={o.value} onChange={e => { const arr = [...sMkt.origin]; arr[i].value = parseInt(e.target.value) || 0; onChange({...data, marketing: {...sMkt, origin: arr}}) }} className="h-10 bg-white border border-border-default text-text-primary text-sm font-black px-2 text-center focus:border-brand-primary rounded-lg shadow-sm transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-8 bg-white border border-border-default rounded-3xl shadow-sm min-w-0">
        <Typography variant="h4" className="text-text-primary mb-8 flex items-center gap-3"><Layers className="w-5 h-5 text-brand-primary" /> Raio-X do Estoque</Typography>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {[
            { l: 'QTD (UN)', k: 'qty' }, { l: 'TICKET (R$)', k: 'avg_price' }, 
            { l: 'FIPE (+/-)', k: 'fipe_delta' }, { l: 'KM', k: 'mileage' }, { l: 'TOTAL (R$)', k: 'total_inv' }
          ].map(it => (
            <div key={it.k}>
              <Typography variant="tiny" className="text-text-tertiary mb-2 block font-bold text-[10px] text-center tracking-widest uppercase">{it.l}</Typography>
              <Input type="number" value={sStk[it.k]} onChange={e => onChange({...data, stock: {...sStk, [it.k]: parseFloat(e.target.value) || 0}})} className="h-14 bg-white border border-border-default text-text-primary text-xl font-black text-center focus:border-brand-primary rounded-2xl shadow-sm transition-all" />
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
    <Card className="p-6 md:p-10 border border-border-default rounded-3xl bg-white shadow-sm overflow-hidden">
       <div className="mb-8 border-b border-border-subtle pb-6">
         <Typography variant="h3" className="mb-2 text-2xl font-black uppercase tracking-tight text-text-primary">Comparativo de Mercado</Typography>
         <Typography variant="p" className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Auditoria baseada nas métricas do Slide 7 MX.</Typography>
       </div>
       <div className="overflow-x-auto border border-border-subtle rounded-2xl">
         <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-surface-alt/50 border-b border-border-subtle">
                 <th className="p-5 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Indicador Estratégico</th>
                 <th className="p-5 text-[10px] font-bold text-center border-l border-border-subtle w-40 text-text-primary uppercase tracking-widest">Sua Loja</th>
                 <th className="p-5 text-[10px] font-bold text-center border-l border-border-subtle text-status-warning w-32 bg-status-warning/5 uppercase tracking-widest">Mercado</th>
                 <th className="p-5 text-[10px] font-bold text-center border-l border-border-subtle text-brand-primary w-32 bg-brand-primary/5 uppercase tracking-widest">MX Elite</th>
                 <th className="p-5 text-[10px] font-bold border-l border-border-subtle text-text-tertiary uppercase tracking-widest">Parecer Técnico</th>
              </tr>
            </thead>
            <tbody className="text-sm">
               {rows.map((it) => (
                 <tr key={it.label} className="border-b border-border-subtle last:border-0 hover:bg-surface-alt/20 transition-colors">
                    <td className="p-5 font-bold text-text-secondary text-xs">{it.label}</td>
                    <td className="p-4 border-l border-border-subtle"><Input className="h-12 text-center font-black bg-white border-border-default shadow-sm focus:border-brand-primary rounded-xl text-base" placeholder={it.p} /></td>
                    <td className="p-5 text-center font-black text-lg text-status-warning border-l border-border-subtle bg-status-warning/5">{it.avg}</td>
                    <td className="p-5 text-center font-black text-lg text-brand-primary border-l border-border-subtle bg-brand-primary/5">{it.best}</td>
                    <td className="p-4 border-l border-border-subtle"><Textarea className="min-h-[48px] h-12 resize-none text-xs py-3 bg-white border-border-default focus:border-brand-primary shadow-sm rounded-xl font-medium" placeholder="Onde está o gargalo?" /></td>
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
  const current = templates?.find((t: any) => t.form_key === active)
  const fields = maps[active] || []

  return (
    <Card className="p-6 md:p-10 border border-border-default rounded-3xl bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 mb-8 border-b border-border-subtle pb-8">
        {['gerente', 'dono', 'vendedor', 'processo'].map((t) => (
          <Button key={t} size="sm" variant={active === t ? 'primary' : 'outline'} onClick={() => setActive(t)} className={cn("capitalize text-xs px-6 h-10 rounded-xl font-bold transition-all", active !== t && "text-text-tertiary bg-surface-alt/30 border-transparent hover:bg-surface-alt hover:text-text-primary")}>{t}</Button>
        ))}
      </div>
      <div className="space-y-6 max-w-3xl">
        <div className="p-6 bg-surface-alt/30 border border-border-subtle rounded-2xl">
          <label className="text-[10px] font-bold text-text-tertiary uppercase mb-2 block tracking-widest ml-1">Nome do Respondente</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-14 text-lg font-black bg-white border-border-default focus:border-brand-primary rounded-xl shadow-sm px-4" placeholder="Qual o nome do entrevistado?" />
        </div>
        <div className="space-y-6">
          {fields.map((f: any) => (
            <div key={f.k} className="p-6 border border-border-subtle rounded-2xl hover:border-brand-primary/30 transition-colors bg-white">
              <label className="text-[11px] font-black text-text-secondary uppercase mb-3 block flex items-center gap-2 tracking-wide"><div className="p-1.5 bg-brand-primary/10 rounded-md text-brand-primary"><Sparkles className="w-4 h-4" /></div> {f.l}</label>
              <Textarea value={form[f.k] || ''} onChange={e => setForm({...form, [f.k]: e.target.value})} className="min-h-[120px] text-sm font-medium resize-y bg-surface-alt/10 border-border-default focus:border-brand-primary focus:bg-white shadow-sm rounded-xl p-4 transition-colors" placeholder="Descreva as observações técnicas..." />
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-border-subtle">
          <Button className="w-full sm:w-auto shadow-sm h-14 px-10 rounded-xl font-black text-base" loading={load} variant="primary" onClick={async () => {
            if(!name) return toast.error('O nome do respondente é obrigatório para salvar.');
            setLoad(true);
            try {
              await onSave({ template_id: current?.id, respondent_name: name, respondent_role: current?.target_role, answers: form, visit_id: visitId });
              toast.success('Entrevista salva com sucesso!'); setForm({}); setName('')
            } finally { setLoad(false) }
          }}>SALVAR DIAGNÓSTICO NO CRM</Button>
        </div>
      </div>
    </Card>
  )
}
