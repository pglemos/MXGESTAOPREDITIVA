import React, { useState, useRef } from 'react'
import { 
  BarChart3, TrendingUp, MessageSquare, Sparkles, 
  PieChart, Layers, ChevronRight, ChevronLeft, 
  Paperclip, Trash2, Camera, Loader2, CheckCircle2,
  FileText, Plus, Info, Globe, Smartphone,
  Users, Target, Award, Zap, ShieldAlert,
  ArrowRight, MousePointer2, LayoutDashboard
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { 
  ResponsiveContainer, PieChart as RePie, Pie, Cell, 
  BarChart as ReBar, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line
} from 'recharts'
import { usePmrDiagnostics } from '@/hooks/usePmrDiagnostics'
import { cn } from '@/lib/utils'

export function VisitOneHighFidelity({ clientId, clientSlug, data, onChange }: { clientId: string, clientSlug: string, data: any, onChange: (d: any) => void }) {
  const [tab, setTab] = useState<'dashboards' | 'benchmark' | 'entrevistas'>('dashboards')

  return (
    <div className="space-y-mx-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navegação de Contexto */}
      <div className="flex bg-white/50 backdrop-blur-sm p-mx-xs rounded-mx-xl border border-border-default shadow-mx-inner">
        {[
          { id: 'dashboards', label: 'DASHBOARDS BI', icon: LayoutDashboard },
          { id: 'benchmark', label: 'COMPARATIVO MERCADO', icon: Globe },
          { id: 'entrevistas', label: 'ENTREVISTAS PMR', icon: Users }
        ].map((t: any) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-mx-xs py-mx-sm px-mx-md rounded-mx-lg text-xs font-black uppercase tracking-mx-wider transition-all",
              tab === t.id ? "bg-brand-primary text-white shadow-mx-md" : "text-text-tertiary hover:text-text-primary hover:bg-white"
            )}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboards' && <VisitOneDashboards data={data} onChange={onChange} />}
      {tab === 'benchmark' && <VisitOneBenchmark data={data} />}
      {tab === 'entrevistas' && <VisitOneInterviews clientId={clientId} />}
    </div>
  )
}

function VisitOneDashboards({ data, onChange }: { data: any, onChange: (d: any) => void }) {
  const COLORS = ['#0D3B2E', '#22C55E', '#FACC15', '#6B7280']
  
  const handleSalesChange = (index: number, value: number) => {
    const newSales = [...(data.sales || [])]
    newSales[index] = { ...newSales[index], value }
    onChange({ ...data, sales: newSales })
  }

  const totalSales = (data.sales || []).reduce((acc: number, s: any) => acc + (s.value || 0), 0)
  const cpl = data.marketing?.leads > 0 ? (data.marketing.investment / data.marketing.leads).toFixed(2) : '0,00'

  return (
    <div className="space-y-mx-lg">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-mx-lg">
        {/* Vendas Trimestre */}
        <Card className="p-mx-lg bg-white border border-border-default shadow-mx-md overflow-hidden relative rounded-mx-2xl group/card">
          <div className="absolute -top-mx-4 -right-mx-4 p-mx-md opacity-[0.03] group-hover/card:opacity-[0.06] transition-opacity pointer-events-none text-brand-primary">
            <BarChart3 size={140} />
          </div>
          <div className="relative z-10 mb-mx-md flex items-center gap-mx-sm">
            <div className="p-mx-xs bg-brand-primary/10 rounded-mx-lg text-brand-primary"><TrendingUp size={20} /></div>
            <div>
              <Typography variant="h3" className="text-lg font-black text-text-primary">Vendas Trimestre</Typography>
              <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-mx-widest opacity-60">Volume de emplacamentos/entregas</Typography>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-md mb-mx-lg">
             {(data.sales || []).map((s: any, i: number) => (
                <div key={s.month} className="space-y-mx-xs">
                   <Typography variant="tiny" className="font-black text-text-tertiary">{s.month.toUpperCase()}</Typography>
                   <Input 
                      id={`sales-${s.month}-${i}`}
                      name={`sales-${s.month}`}
                      type="number" 
                      value={s.value} 
                      onChange={e => handleSalesChange(i, parseInt(e.target.value) || 0)}
                      className="h-mx-12 font-black text-xl text-center border-border-default bg-surface-alt/20 focus:bg-white focus:border-brand-primary transition-all shadow-sm"
                   />
                </div>
             ))}
          </div>

          <div className="flex items-center justify-between p-mx-md bg-surface-alt rounded-mx-xl border border-border-default">
             <div>
                <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Total Trimestre</Typography>
                <Typography variant="h2" className="text-3xl text-brand-primary">{totalSales} <span className="text-sm font-bold text-text-tertiary">CARROS</span></Typography>
             </div>
             <div className="text-right">
                <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Média Mensal</Typography>
                <Typography variant="h2" className="text-3xl">{(totalSales / 3).toFixed(1)}</Typography>
             </div>
          </div>
        </Card>

        {/* Marketing ROI */}
        <Card className="p-mx-lg bg-white border border-border-default shadow-mx-md overflow-hidden relative rounded-mx-2xl group/card">
          <div className="absolute -top-mx-4 -right-mx-4 p-mx-md opacity-[0.03] group-hover/card:opacity-[0.06] transition-opacity pointer-events-none text-brand-secondary">
            <PieChart size={140} />
          </div>
          <div className="relative z-10 mb-mx-md flex items-center gap-mx-sm">
            <div className="p-mx-xs bg-brand-secondary/10 rounded-mx-lg text-brand-secondary"><Zap size={20} /></div>
            <div>
              <Typography variant="h3" className="text-lg font-black text-text-primary">Performance MKT</Typography>
              <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-mx-widest opacity-60">CPL e Origem de Leads</Typography>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-mx-md mb-mx-lg">
             <div className="space-y-mx-xs">
                <Typography variant="tiny" className="font-black text-text-tertiary uppercase">Investimento Total (R$)</Typography>
                <Input 
                  id="marketing-investment"
                  name="marketing-investment"
                  type="number" 
                  value={data.marketing?.investment} 
                  onChange={e => onChange({ ...data, marketing: { ...data.marketing, investment: parseFloat(e.target.value) || 0 } })}
                  className="h-mx-12 font-black text-xl border-border-default bg-surface-alt/20 focus:bg-white focus:border-brand-primary transition-all"
                  placeholder="Ex: 5000"
                />
             </div>
             <div className="space-y-mx-xs">
                <Typography variant="tiny" className="font-black text-text-tertiary uppercase">Leads Totais (UN)</Typography>
                <Input 
                  id="marketing-leads"
                  name="marketing-leads"
                  type="number" 
                  value={data.marketing?.leads} 
                  onChange={e => onChange({ ...data, marketing: { ...data.marketing, leads: parseInt(e.target.value) || 0 } })}
                  className="h-mx-12 font-black text-xl border-border-default bg-surface-alt/20 focus:bg-white focus:border-brand-primary transition-all"
                  placeholder="Ex: 250"
                />
             </div>
          </div>

          <div className="flex items-center justify-between p-mx-md bg-brand-secondary/5 rounded-mx-xl border border-brand-secondary/10">
             <div>
                <Typography variant="tiny" className="font-bold text-brand-secondary uppercase">Custo por Lead (CPL)</Typography>
                <Typography variant="h1" className="text-3xl text-brand-secondary">R$ {cpl}</Typography>
             </div>
             <div className="h-mx-14 w-mx-14 overflow-visible">
                <ResponsiveContainer width={56} height={56}>
                   <RePie>
                      <Pie data={data.marketing?.origin} innerRadius={20} outerRadius={28} paddingAngle={5} dataKey="value">
                         {data.marketing?.origin?.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                   </RePie>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="mt-mx-md grid grid-cols-4 gap-mx-xs">
             {data.marketing?.origin?.map((o: any, i: number) => (
                <div key={o.name} className="text-center">
                   <div className="w-mx-2 h-mx-2 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                   <Typography variant="tiny" className="text-mx-micro font-black uppercase opacity-60">{o.name}</Typography>
                   <Typography variant="p" className="text-xs font-black">{o.value}</Typography>
                </div>
             ))}
          </div>
        </Card>
      </div>

      {/* Raio-X do Estoque */}
      <Card className="p-mx-lg bg-white border border-border-default shadow-mx-md overflow-hidden relative rounded-mx-2xl group/card">
          <div className="absolute -top-mx-4 -right-mx-4 p-mx-md opacity-[0.03] group-hover/card:opacity-[0.06] transition-opacity pointer-events-none text-status-warning">
            <Layers size={140} />
          </div>
          <div className="relative z-10 mb-mx-md flex items-center gap-mx-sm">
            <div className="p-mx-xs bg-status-warning/10 rounded-mx-lg text-status-warning"><Layers size={20} /></div>
            <div>
              <Typography variant="h3" className="text-lg font-black text-text-primary">Raio-X do Estoque</Typography>
              <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-mx-widest opacity-60">Saúde financeira do pátio</Typography>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-mx-md">
             {[
               { k: 'qty', l: 'QTD (UN)', p: 'Ex: 45' },
               { k: 'avg_price', l: 'TICKET (R$)', p: 'Ex: 65000' },
               { k: 'fipe_delta', l: 'FIPE (+/-)', p: 'Ex: -2000' },
               { k: 'mileage', l: 'KM MÉDIA', p: 'Ex: 65000' },
               { k: 'total_inv', l: 'INVESTIMENTO (R$)', p: 'Ex: 2.5M' }
             ].map(f => (
                <div key={f.k} className="space-y-mx-xs">
                   <Typography variant="tiny" className="font-black text-text-tertiary uppercase tracking-mx-widest text-[10px]">{f.l}</Typography>
                   <Input 
                      id={`stock-${f.k}`}
                      name={`stock-${f.k}`}
                      type="number" 
                      value={data.stock?.[f.k]} 
                      onChange={e => onChange({ ...data, stock: { ...data.stock, [f.k]: parseFloat(e.target.value) || 0 } })}
                      className="h-mx-10 font-bold border-border-default bg-surface-alt/20 focus:bg-white focus:border-brand-primary transition-all shadow-sm"
                      placeholder={f.p}
                   />
                </div>
             ))}
          </div>
      </Card>
    </div>
  )
}

function VisitOneBenchmark({ data }: { data: any }) {
  return (
    <Card className="p-mx-20 text-center bg-white border border-border-default rounded-mx-2xl border-dashed relative overflow-hidden group">
       <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
       <div className="relative z-10">
         <div className="w-mx-16 h-mx-16 bg-surface-alt rounded-mx-full flex items-center justify-center mx-auto mb-mx-md border border-border-subtle group-hover:scale-110 transition-transform">
           <Globe size={48} className="text-brand-primary opacity-40" />
         </div>
         <Typography variant="h3" className="text-xl font-black text-text-primary uppercase tracking-mx-widest mb-mx-xs">Comparativo de Mercado</Typography>
         <Typography variant="p" className="text-sm text-text-tertiary max-w-mx-80 mx-auto font-medium uppercase tracking-tighter">
           Inteligência preditiva em processamento. Os dados de benchmarking regional serão liberados após a consolidação do primeiro ciclo mensal.
         </Typography>
       </div>
    </Card>
  )
}

function VisitOneInterviews({ clientId }: { clientId: string }) {
  const { templates, responsesByTemplate, saveResponse } = usePmrDiagnostics(clientId)
  const [activeTmpl, setActiveTmpl] = useState<string | null>(null)
  
  if (!templates.length) return <div className="p-mx-lg text-center opacity-50">Carregando formulários de entrevista...</div>

  const currentTmpl = templates.find(t => t.id === activeTmpl) || templates[0]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-mx-lg">
        <div className="lg:col-span-1 space-y-mx-sm">
          {templates.map(t => {
             const hasResp = responsesByTemplate.has(t.id) && responsesByTemplate.get(t.id)!.length > 0
             const isActive = currentTmpl.id === t.id
             return (
                <button 
                  key={t.id} 
                  onClick={() => setActiveTmpl(t.id)}
                  className={cn(
                    "w-full text-left p-mx-md rounded-mx-xl border transition-all relative overflow-hidden group shadow-sm",
                    isActive 
                      ? "bg-brand-primary border-brand-primary text-white shadow-mx-lg translate-x-mx-1" 
                      : "bg-white border-border-default hover:border-brand-primary/30 hover:bg-surface-alt"
                  )}
                >
                   {hasResp && (
                     <div className={cn("absolute top-mx-sm right-mx-sm", isActive ? "text-white/50" : "text-status-success")}>
                       <CheckCircle2 size={16} />
                     </div>
                   )}
                   <Typography variant="tiny" className={cn("uppercase font-black tracking-mx-widest text-[10px]", isActive ? "text-white/70" : "text-text-tertiary")}>
                     {t.target_role}
                   </Typography>
                   <Typography variant="h3" className={cn("text-sm font-black", isActive ? "text-white" : "text-text-primary")}>
                     {t.title}
                   </Typography>
                </button>
             )
          })}
       </div>

        <Card className="lg:col-span-3 p-mx-lg bg-white border border-border-default shadow-mx-md rounded-mx-2xl">
           <div className="flex items-center gap-mx-sm mb-mx-lg border-b border-border-subtle pb-mx-md">
              <div className="p-mx-xs bg-brand-primary/10 rounded-mx-lg text-brand-primary"><Users size={20} /></div>
              <Typography variant="h3" className="text-xl font-black text-text-primary uppercase tracking-tight">Entrevista: {currentTmpl.title}</Typography>
           </div>

          <div className="space-y-mx-md">
             {currentTmpl.fields.map(f => {
                const currentResp = responsesByTemplate.get(currentTmpl.id)?.[0]
                return (
                  <div key={f.key} className="space-y-mx-xs p-mx-md bg-surface-alt/30 rounded-mx-xl border border-border-default hover:border-brand-primary/20 transition-colors">
                    <Typography variant="p" className="font-black text-xs text-text-secondary uppercase">{f.label}</Typography>
                    {f.type === 'textarea' ? (
                        <Textarea 
                          id={`interview-${currentTmpl.id}-${f.key}`}
                          name={`interview-${currentTmpl.id}-${f.key}`}
                          className="bg-white border-none shadow-mx-inner min-h-mx-20" 
                          placeholder="Resposta do entrevistado..." 
                          value={(currentResp?.answers?.[f.key] as string) || ''}
                          onChange={e => saveResponse({ template_id: currentTmpl.id, answers: { ...(currentResp?.answers || {}), [f.key]: e.target.value } })}
                        />
                    ) : f.type === 'scale' ? (
                        <div className="flex gap-mx-sm pt-mx-xs">
                          {[1,2,3,4,5].map(v => (
                              <button 
                                key={v} 
                                onClick={() => saveResponse({ template_id: currentTmpl.id, answers: { ...(currentResp?.answers || {}), [f.key]: v } })}
                                className={cn(
                                  "w-mx-12 h-mx-12 rounded-mx-xl font-black transition-all border-2 flex items-center justify-center text-lg",
                                  currentResp?.answers?.[f.key] === v 
                                    ? "bg-brand-primary border-brand-primary text-white shadow-mx-lg scale-110" 
                                    : "bg-white border-border-default text-text-tertiary hover:border-brand-primary/40 hover:text-brand-primary"
                                )}
                              >
                                {v}
                              </button>
                          ))}
                        </div>
                    ) : (
                        <Input 
                          id={`interview-${currentTmpl.id}-${f.key}`}
                          name={`interview-${currentTmpl.id}-${f.key}`}
                          className="bg-white border-none shadow-mx-inner" 
                          value={(currentResp?.answers?.[f.key] as string) || ''}
                          onChange={e => saveResponse({ template_id: currentTmpl.id, answers: { ...(currentResp?.answers || {}), [f.key]: e.target.value } })}
                        />
                    )}
                  </div>
                )
             })}
          </div>
       </Card>
    </div>
  )
}
