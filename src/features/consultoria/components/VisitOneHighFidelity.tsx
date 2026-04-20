import React, { useState } from 'react'
import { 
  BarChart3, TrendingUp, MessageSquare, Sparkles, 
  PieChart, Layers
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
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
    <div className="space-y-mx-md pb-mx-xl">
       <div className="flex flex-wrap gap-mx-xs bg-white p-mx-xs rounded-mx-lg border border-border-default shadow-mx-sm print:hidden">
          {[
            { id: 'dashboards', label: 'Dashboards BI', icon: BarChart3 },
            { id: 'benchmark', label: 'Comparativo Mercado', icon: TrendingUp },
            { id: 'entrevistas', label: 'Entrevistas PMR', icon: MessageSquare }
          ].map((t: any) => (
            <button 
               key={t.id} 
               onClick={() => setTab(t.id as any)} 
               className={cn(
                  "flex-1 py-mx-xs px-mx-sm text-mx-tiny md:text-sm font-bold uppercase rounded-mx-sm transition-all flex items-center justify-center gap-mx-xs min-w-[140px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20", 
                  tab === t.id 
                    ? "bg-brand-primary text-white shadow-mx-md" 
                    : "text-text-tertiary hover:text-text-secondary hover:bg-surface-alt/50"
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
  const displayOrigin = sMkt.origin?.some((o:any)=>o.value>0) ? sMkt.origin : [{name: 'Sem Dados', value: 1, color: '#e2e8f0'}];
  
  const cpl = sMkt.investment > 0 && sMkt.leads > 0 ? (sMkt.investment / sMkt.leads).toFixed(2) : '0.00'

  return (
    <div className="space-y-mx-md">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-mx-md min-w-0">
        <Card>
          <CardHeader className="flex flex-row items-center gap-mx-sm bg-transparent border-b border-border-subtle p-mx-lg">
            <div className="p-mx-xs bg-brand-primary/10 rounded-mx-md">
              <BarChart3 className="w-5 h-5 text-brand-primary" />
            </div>
            <CardTitle>Vendas Trimestre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full min-w-0 mb-mx-md bg-surface-alt/30 rounded-mx-lg p-mx-sm border border-border-subtle flex items-center justify-center">
              {sSales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={sSales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', fontWeight: 'bold', boxShadow: 'var(--shadow-mx-md)' }} />
                    <Bar dataKey="value" fill="#00C49F" radius={[6, 6, 0, 0]} barSize={40} />
                  </ReBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center text-text-tertiary">
                  <BarChart3 className="w-10 h-10 mb-2 opacity-50" />
                  <Typography variant="tiny" tone="muted">Insira dados abaixo para visualizar</Typography>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-mx-sm mb-mx-md">
              {sSales.map((s:any, i:number) => (
                <div key={i} className="space-y-1">
                  <Typography variant="tiny" tone="muted" as="label" className="text-center w-full block">{s.month}</Typography>
                  <Input type="number" value={s.value} onChange={e => { const n = [...sSales]; n[i].value = parseInt(e.target.value) || 0; onChange({...data, sales: n}) }} className="text-center" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-mx-xs pt-mx-md border-t border-border-subtle">
              <div className="text-center"><Typography variant="tiny" tone="muted">TOTAL</Typography><Typography variant="h3" tone="brand" className="mt-1">{totalSales}</Typography></div>
              <div className="text-center"><Typography variant="tiny" tone="muted">MÉDIA</Typography><Typography variant="h3" tone="brand" className="mt-1">{avgSales}</Typography></div>
              <div className="text-center"><Typography variant="tiny" tone="muted">MELHOR</Typography><Typography variant="h3" tone="brand" className="mt-1">{bestMonth.value}</Typography></div>
              <div className="text-center"><Typography variant="tiny" tone="muted">PIOR</Typography><Typography variant="h3" tone="error" className="mt-1">{worstMonth.value}</Typography></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-mx-sm bg-transparent border-b border-border-subtle p-mx-lg">
            <div className="p-mx-xs bg-brand-primary/10 rounded-mx-md">
              <PieChart className="w-5 h-5 text-brand-primary" />
            </div>
            <CardTitle>Performance MKT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-lg">
              <div className="space-y-mx-sm">
                <div className="space-y-1">
                  <Typography variant="tiny" tone="muted" as="label">INVESTIMENTO (R$)</Typography>
                  <Input type="number" value={sMkt.investment || ''} onChange={e => onChange({...data, marketing: {...sMkt, investment: parseInt(e.target.value) || 0}})} />
                </div>
                <div className="space-y-1">
                  <Typography variant="tiny" tone="muted" as="label">LEADS</Typography>
                  <Input type="number" value={sMkt.leads || ''} onChange={e => onChange({...data, marketing: {...sMkt, leads: parseInt(e.target.value) || 0}})} />
                </div>
                <div className="pt-mx-sm border-t border-border-subtle mt-mx-sm">
                  <Typography variant="tiny" tone="brand">CPL REAL</Typography>
                  <Typography variant="h2" tone="brand" className="mt-1">R$ {cpl}</Typography>
                </div>
              </div>
              <div className="flex flex-col items-center justify-between">
                <div className="h-[160px] w-full min-w-0 bg-surface-alt/30 rounded-mx-lg border border-border-subtle flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={displayOrigin} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                        {displayOrigin.map((entry: any, i: number) => <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', fontWeight: 'bold', boxShadow: 'var(--shadow-mx-md)' }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-mx-sm w-full mt-mx-md">
                  {(sMkt.origin || []).map((o:any, i:number) => (
                    <div key={i} className="space-y-1">
                      <Typography variant="tiny" tone="muted" as="label" className="flex items-center gap-1.5 truncate" title={o.name}>
                        <div className="w-2 h-2 rounded-mx-full shrink-0" style={{background: COLORS[i%COLORS.length]}}/> 
                        <span className="truncate">{o.name}</span>
                      </Typography>
                      <Input type="number" value={o.value || ''} onChange={e => { const arr = [...sMkt.origin]; arr[i].value = parseInt(e.target.value) || 0; onChange({...data, marketing: {...sMkt, origin: arr}}) }} className="text-center px-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-mx-sm bg-transparent border-b border-border-subtle p-mx-lg">
          <div className="p-mx-xs bg-brand-primary/10 rounded-mx-md">
            <Layers className="w-5 h-5 text-brand-primary" />
          </div>
          <CardTitle>Raio-X do Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-mx-md">
            {[
              { l: 'QTD (UN)', k: 'qty' }, { l: 'TICKET (R$)', k: 'avg_price' }, 
              { l: 'FIPE (+/-)', k: 'fipe_delta' }, { l: 'KM', k: 'mileage' }, { l: 'TOTAL (R$)', k: 'total_inv' }
            ].map(it => (
              <div key={it.k} className="space-y-1">
                <Typography variant="tiny" tone="muted" as="label" className="text-center w-full block">{it.l}</Typography>
                <Input type="number" value={sStk[it.k] || ''} onChange={e => onChange({...data, stock: {...sStk, [it.k]: parseFloat(e.target.value) || 0}})} className="text-center text-lg font-black h-mx-14" />
              </div>
            ))}
          </div>
        </CardContent>
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
    <Card className="overflow-hidden">
      <CardHeader className="bg-transparent border-b border-border-subtle p-mx-lg">
        <CardTitle>Comparativo de Mercado</CardTitle>
        <Typography variant="p" tone="muted" className="mt-2">Auditoria baseada nas métricas do Slide 7 MX.</Typography>
      </CardHeader>
      <div className="overflow-x-auto p-mx-lg pt-0">
        <div className="border border-border-subtle rounded-mx-xl overflow-hidden mt-mx-md">
          <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-surface-alt border-b border-border-subtle">
                  <th className="p-mx-sm text-mx-tiny font-black text-text-secondary uppercase tracking-widest">Indicador Estratégico</th>
                  <th className="p-mx-sm text-mx-tiny font-black text-center border-l border-border-subtle w-40 text-text-primary uppercase tracking-widest">Sua Loja</th>
                  <th className="p-mx-sm text-mx-tiny font-black text-center border-l border-border-subtle text-status-warning w-32 bg-status-warning-surface uppercase tracking-widest">Mercado</th>
                  <th className="p-mx-sm text-mx-tiny font-black text-center border-l border-border-subtle text-brand-primary w-32 bg-brand-primary/5 uppercase tracking-widest">MX Elite</th>
                  <th className="p-mx-sm text-mx-tiny font-black border-l border-border-subtle text-text-tertiary uppercase tracking-widest">Parecer Técnico</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((it) => (
                  <tr key={it.label} className="border-b border-border-subtle last:border-0 hover:bg-surface-alt/50 transition-colors">
                      <td className="p-mx-sm"><Typography variant="p" className="text-xs">{it.label}</Typography></td>
                      <td className="p-mx-xs border-l border-border-subtle"><Input className="text-center font-black" placeholder={it.p} /></td>
                      <td className="p-mx-sm text-center border-l border-border-subtle bg-status-warning-surface"><Typography variant="h3" tone="warning">{it.avg}</Typography></td>
                      <td className="p-mx-sm text-center border-l border-border-subtle bg-brand-primary/5"><Typography variant="h3" tone="brand">{it.best}</Typography></td>
                      <td className="p-mx-xs border-l border-border-subtle"><Textarea className="min-h-[48px] h-mx-12 resize-none" placeholder="Onde está o gargalo?" /></td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
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
    <Card>
      <CardHeader className="bg-transparent border-b border-border-subtle p-mx-lg">
        <div className="flex flex-wrap gap-mx-xs">
          {['gerente', 'dono', 'vendedor', 'processo'].map((t) => (
            <Button key={t} size="sm" variant={active === t ? 'primary' : 'outline'} onClick={() => setActive(t)} className={cn(active !== t && "border-transparent bg-surface-alt/50")}>{t}</Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-mx-md">
        <div className="max-w-3xl space-y-mx-md">
          <div className="p-mx-md bg-surface-alt rounded-mx-lg border border-border-subtle space-y-1">
            <Typography variant="tiny" tone="muted" as="label">Nome do Respondente</Typography>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-mx-14 text-lg" placeholder="Qual o nome do entrevistado?" />
          </div>
          <div className="space-y-mx-md">
            {fields.map((f: any) => (
              <div key={f.k} className="p-mx-md border border-border-subtle rounded-mx-lg hover:border-brand-primary/30 transition-all bg-white shadow-sm hover:shadow-mx-md space-y-2">
                <Typography variant="caption" className="flex items-center gap-mx-xs text-text-secondary"><div className="p-1 bg-brand-primary/10 rounded-mx-sm text-brand-primary"><Sparkles className="w-3.5 h-3.5" /></div> {f.l}</Typography>
                <Textarea value={form[f.k] || ''} onChange={e => setForm({...form, [f.k]: e.target.value})} className="min-h-[120px] bg-surface-alt/30" placeholder="Descreva as observações técnicas..." />
              </div>
            ))}
          </div>
          <div className="pt-mx-md border-t border-border-subtle">
            <Button className="w-full sm:w-auto" size="lg" loading={load} onClick={async () => {
              if(!name) return toast.error('O nome do respondente é obrigatório para salvar.');
              setLoad(true);
              try {
                await onSave({ template_id: current?.id, respondent_name: name, respondent_role: current?.target_role, answers: form, visit_id: visitId });
                toast.success('Entrevista salva com sucesso!'); setForm({}); setName('')
              } finally { setLoad(false) }
            }}>SALVAR DIAGNÓSTICO NO CRM</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
