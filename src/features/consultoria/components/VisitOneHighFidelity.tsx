import React, { useEffect, useMemo, useState, useRef } from 'react'
import {
  BarChart3, TrendingUp, MessageSquare, Sparkles,
  PieChart, Layers, ChevronRight, ChevronLeft,
  Paperclip, Trash2, Camera, Loader2, CheckCircle2, Circle, Save,
  FileText, Plus, Info, Globe, Smartphone,
  Users, Target, Award, Zap, ShieldAlert,
  ArrowRight, MousePointer2, LayoutDashboard
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Card, CardContent } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import {
  ResponsiveContainer, PieChart as RePie, Pie, Cell,
  BarChart as ReBar, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line
} from 'recharts'
import { usePmrDiagnostics } from '@/hooks/usePmrDiagnostics'
import type { PmrFormField } from '@/lib/schemas/consulting-client.schema'
import type { VisitOneQuantData } from '@/features/consultoria/types'
import { cn } from '@/lib/utils'

type VisitOneTab = 'dashboards' | 'benchmark' | 'entrevistas'
type VisitOneStockKey = keyof VisitOneQuantData['stock']

const VISIT_ONE_TABS: Array<{ id: VisitOneTab; label: string; icon: LucideIcon }> = [
  { id: 'dashboards', label: 'DASHBOARDS BI', icon: LayoutDashboard },
  { id: 'benchmark', label: 'COMPARATIVO MERCADO', icon: Globe },
  { id: 'entrevistas', label: 'ENTREVISTAS PMR', icon: Users },
]

export function VisitOneHighFidelity({ clientId, clientSlug, data, onChange }: { clientId: string, clientSlug: string, data: VisitOneQuantData, onChange: (d: VisitOneQuantData) => void }) {
  const [tab, setTab] = useState<VisitOneTab>('dashboards')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navegação de Contexto */}
      <div className="flex bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-gray-100 shadow-inner">
        {VISIT_ONE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
              tab === t.id ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-white"
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

function VisitOneDashboards({ data, onChange }: { data: VisitOneQuantData, onChange: (d: VisitOneQuantData) => void }) {
  const COLORS = ['#071822', '#00A89D', '#FACC15', '#6B7280']

  const handleSalesChange = (index: number, value: number) => {
    const newSales = [...data.sales]
    newSales[index] = { ...newSales[index], value }
    onChange({ ...data, sales: newSales })
  }

  const totalSales = data.sales.reduce((acc, s) => acc + (s.value || 0), 0)
  const cpl = data.marketing?.leads > 0 ? (data.marketing.investment / data.marketing.leads).toFixed(2) : '0,00'

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendas Trimestre */}
        <Card className="p-8 bg-white border border-gray-100 shadow-sm overflow-hidden relative rounded-2xl group/card">
          <div className="absolute -top-4 -right-4 p-6 opacity-[0.03] group-hover/card:opacity-[0.06] transition-opacity pointer-events-none text-emerald-600">
            <BarChart3 size={140} />
          </div>
          <div className="relative z-10 mb-6 flex items-center gap-4">
            <div className="p-2 bg-emerald-600/10 rounded-2xl text-emerald-600"><TrendingUp size={20} /></div>
            <div>
              <Typography variant="h3" className="text-lg font-black text-gray-800">Vendas Trimestre</Typography>
              <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-widest opacity-60">Volume de emplacamentos/entregas</Typography>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             {data.sales.map((s, i) => (
                <div key={s.month} className="space-y-2">
                   <Typography variant="tiny" className="font-black text-gray-500">{s.month.toUpperCase()}</Typography>
                   <Input
                      id={`sales-${s.month}-${i}`}
                      name={`sales-${s.month}`}
                      type="number"
                      value={s.value}
                      onChange={e => handleSalesChange(i, parseInt(e.target.value) || 0)}
                      className="h-12 font-black text-xl text-center border-gray-100 bg-gray-50/20 focus:bg-white focus:border-emerald-600 transition-all shadow-sm"
                   />
                </div>
             ))}
          </div>

          <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
             <div>
                <Typography variant="tiny" className="font-bold text-gray-500 uppercase">Total Trimestre</Typography>
                <Typography variant="h2" className="text-3xl text-emerald-600">{totalSales} <span className="text-sm font-bold text-gray-500">CARROS</span></Typography>
             </div>
             <div className="text-right">
                <Typography variant="tiny" className="font-bold text-gray-500 uppercase">Média Mensal</Typography>
                <Typography variant="h2" className="text-3xl">{(totalSales / 3).toFixed(1)}</Typography>
             </div>
          </div>
        </Card>

        {/* Marketing ROI */}
        <Card className="p-8 bg-white border border-gray-100 shadow-sm overflow-hidden relative rounded-2xl group/card">
          <div className="absolute -top-4 -right-4 p-6 opacity-[0.03] group-hover/card:opacity-[0.06] transition-opacity pointer-events-none text-gray-900">
            <PieChart size={140} />
          </div>
          <div className="relative z-10 mb-6 flex items-center gap-4">
            <div className="p-2 bg-gray-900/10 rounded-2xl text-gray-900"><Zap size={20} /></div>
            <div>
              <Typography variant="h3" className="text-lg font-black text-gray-800">Performance MKT</Typography>
              <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-widest opacity-60">CPL e Origem de Leads</Typography>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
             <div className="space-y-2">
                <Typography variant="tiny" className="font-black text-gray-500 uppercase">Investimento Total (R$)</Typography>
                <Input
                  id="marketing-investment"
                  name="marketing-investment"
                  type="number"
                  value={data.marketing?.investment}
                  onChange={e => onChange({ ...data, marketing: { ...data.marketing, investment: parseFloat(e.target.value) || 0 } })}
                  className="h-12 font-black text-xl border-gray-100 bg-gray-50/20 focus:bg-white focus:border-emerald-600 transition-all"
                  placeholder="Ex: 5000"
                />
             </div>
             <div className="space-y-2">
                <Typography variant="tiny" className="font-black text-gray-500 uppercase">Leads Totais (UN)</Typography>
                <Input
                  id="marketing-leads"
                  name="marketing-leads"
                  type="number"
                  value={data.marketing?.leads}
                  onChange={e => onChange({ ...data, marketing: { ...data.marketing, leads: parseInt(e.target.value) || 0 } })}
                  className="h-12 font-black text-xl border-gray-100 bg-gray-50/20 focus:bg-white focus:border-emerald-600 transition-all"
                  placeholder="Ex: 250"
                />
             </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-gray-900/5 rounded-2xl border border-gray-900/10">
             <div>
                <Typography variant="tiny" className="font-bold text-gray-900 uppercase">Custo por Lead (CPL)</Typography>
                <Typography variant="h1" className="text-3xl text-gray-900">R$ {cpl}</Typography>
             </div>
             <div className="h-14 w-14 overflow-visible">
                <ResponsiveContainer width={56} height={56}>
                   <RePie>
                      <Pie data={data.marketing?.origin} innerRadius={20} outerRadius={28} paddingAngle={5} dataKey="value">
                         {data.marketing.origin.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                   </RePie>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-2">
             {data.marketing.origin.map((o, i) => (
                <div key={o.name} className="text-center">
                   <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                   <Typography variant="tiny" className="text-[9px] font-black uppercase opacity-60">{o.name}</Typography>
                   <Typography variant="p" className="text-xs font-black">{o.value}</Typography>
                </div>
             ))}
          </div>
        </Card>
      </div>

      {/* Raio-X do Estoque */}
      <Card className="p-8 bg-white border border-gray-100 shadow-sm overflow-hidden relative rounded-2xl group/card">
          <div className="absolute -top-4 -right-4 p-6 opacity-[0.03] group-hover/card:opacity-[0.06] transition-opacity pointer-events-none text-amber-600">
            <Layers size={140} />
          </div>
          <div className="relative z-10 mb-6 flex items-center gap-4">
            <div className="p-2 bg-amber-500/10 rounded-2xl text-amber-600"><Layers size={20} /></div>
            <div>
              <Typography variant="h3" className="text-lg font-black text-gray-800">Raio-X do Estoque</Typography>
              <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-widest opacity-60">Saúde financeira do pátio</Typography>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
             {([
               { k: 'qty', l: 'QTD (UN)', p: 'Ex: 45' },
               { k: 'avg_price', l: 'TICKET (R$)', p: 'Ex: 65000' },
               { k: 'fipe_delta', l: 'FIPE (+/-)', p: 'Ex: -2000' },
               { k: 'mileage', l: 'KM MÉDIA', p: 'Ex: 65000' },
               { k: 'total_inv', l: 'INVESTIMENTO (R$)', p: 'Ex: 2.5M' }
             ] satisfies Array<{ k: VisitOneStockKey; l: string; p: string }>).map(f => (
                <div key={f.k} className="space-y-2">
                   <Typography variant="tiny" className="font-black text-gray-500 uppercase tracking-widest text-[10px]">{f.l}</Typography>
                   <Input
                      id={`stock-${f.k}`}
                      name={`stock-${f.k}`}
                      type="number"
                      value={data.stock?.[f.k]}
                      onChange={e => onChange({ ...data, stock: { ...data.stock, [f.k]: parseFloat(e.target.value) || 0 } })}
                      className="h-10 font-bold border-gray-100 bg-gray-50/20 focus:bg-white focus:border-emerald-600 transition-all shadow-sm"
                      placeholder={f.p}
                   />
                </div>
             ))}
          </div>
      </Card>
    </div>
  )
}

function VisitOneBenchmark({ data }: { data: VisitOneQuantData }) {
  return (
    <Card className="p-20 text-center bg-white border border-gray-100 rounded-2xl border-dashed relative overflow-hidden group">
       <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-transparent to-gray-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
       <div className="relative z-10">
         <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 group-hover:scale-110 transition-transform">
           <Globe size={48} className="text-emerald-600 opacity-40" />
         </div>
         <Typography variant="h3" className="text-xl font-black text-gray-800 uppercase tracking-widest mb-2">Comparativo de Mercado</Typography>
         <Typography variant="p" className="text-sm text-gray-500 max-w-80 mx-auto font-medium uppercase tracking-tighter">
           Inteligência preditiva em processamento. Os dados de benchmarking regional serão liberados após a consolidação do primeiro ciclo mensal.
         </Typography>
       </div>
    </Card>
  )
}

function getInterviewLabel(formKey: string, fallback: string) {
  const labels: Record<string, string> = {
    dono: 'Dono / Sócio',
    gerente: 'Gerente',
    processo: 'Processos',
    vendedor: 'Vendedores',
  }
  return labels[formKey] || fallback
}

function emptyInterviewAnswers(fields: PmrFormField[]) {
  return Object.fromEntries(fields.map(field => [field.key, field.type === 'boolean' ? false : '']))
}

function parseInterviewValue(field: PmrFormField, value: string | boolean | number) {
  if (field.type === 'boolean') return Boolean(value)
  if (field.type === 'number' || field.type === 'scale') {
    if (value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return String(value)
}

function VisitOneInterviews({ clientId }: { clientId: string }) {
  const { templates, responsesByTemplate, saveResponse } = usePmrDiagnostics(clientId)
  const [activeTmpl, setActiveTmpl] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [respondentName, setRespondentName] = useState('')
  const [summary, setSummary] = useState('')
  const [saving, setSaving] = useState(false)

  const currentTmpl = useMemo(() => {
    return templates.find(t => t.id === activeTmpl) || templates[0]
  }, [activeTmpl, templates])

  const currentResp = currentTmpl ? responsesByTemplate.get(currentTmpl.id)?.[0] : undefined
  const currentResponses = currentTmpl ? responsesByTemplate.get(currentTmpl.id) || [] : []
  const completedInterviews = templates.filter(template => (responsesByTemplate.get(template.id)?.length || 0) > 0).length

  useEffect(() => {
    if (!currentTmpl) return
    setAnswers({
      ...emptyInterviewAnswers(currentTmpl.fields),
      ...(currentResp?.answers || {}),
    })
    setRespondentName(currentResp?.respondent_name || '')
    setSummary(currentResp?.summary || '')
  }, [currentTmpl?.id, currentResp?.id])

  if (!templates.length || !currentTmpl) {
    return <div className="p-8 text-center opacity-50">Carregando formulários de entrevista...</div>
  }

  const updateField = (field: PmrFormField, value: string | boolean | number) => {
    setAnswers(current => ({
      ...current,
      [field.key]: parseInterviewValue(field, value),
    }))
  }

  const handleSaveInterview = async () => {
    const missingRequired = currentTmpl.fields.some(field => {
      if (!field.required) return false
      const value = answers[field.key]
      return value === '' || value === null || typeof value === 'undefined'
    })

    if (missingRequired) {
      toast.error('Preencha os campos obrigatórios antes de salvar.')
      return
    }

    setSaving(true)
    const { error } = await saveResponse({
      response_id: currentResp?.id,
      template_id: currentTmpl.id,
      respondent_name: respondentName,
      respondent_role: getInterviewLabel(currentTmpl.form_key, currentTmpl.target_role),
      answers,
      summary,
    })
    setSaving(false)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(currentResp ? 'Entrevista atualizada.' : 'Entrevista salva.')
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {templates.map(t => {
          const responses = responsesByTemplate.get(t.id) || []
          const isActive = currentTmpl.id === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTmpl(t.id)}
              className={cn(
                "text-left p-6 rounded-2xl border transition-all relative overflow-hidden shadow-sm min-h-28",
                isActive
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-white border-gray-100 hover:border-emerald-600/30 hover:bg-gray-50"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Typography variant="tiny" className={cn("uppercase font-black tracking-widest text-[10px]", isActive ? "text-white/70" : "text-gray-500")}>
                    Entrevista
                  </Typography>
                  <Typography variant="h3" className={cn("text-base font-black leading-tight", isActive ? "text-white" : "text-gray-800")}>
                    {getInterviewLabel(t.form_key, t.title)}
                  </Typography>
                </div>
                {responses.length ? (
                  <CheckCircle2 className={cn("w-5 h-5 shrink-0", isActive ? "text-white/70" : "text-emerald-600")} />
                ) : (
                  <Circle className={cn("w-5 h-5 shrink-0", isActive ? "text-white/40" : "text-gray-500/50")} />
                )}
              </div>
              <Typography variant="tiny" className={cn("mt-6 block font-bold", isActive ? "text-white/70" : "text-gray-500")}>
                {responses.length ? `${responses.length} resposta(s) agrupada(s)` : 'Pendente'}
              </Typography>
            </button>
          )
        })}
      </div>

      <Card className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 border-b border-gray-100 pb-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-emerald-600/10 rounded-2xl text-emerald-600"><Users size={20} /></div>
            <div>
              <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-widest">
                Visita 1 - Diagnóstico PMR
              </Typography>
              <Typography variant="h3" className="text-xl font-black text-gray-800 uppercase tracking-tight">
                {getInterviewLabel(currentTmpl.form_key, currentTmpl.title)}
              </Typography>
            </div>
          </div>
          <Badge variant={currentResponses.length ? 'success' : 'outline'} className="self-start xl:self-auto rounded-full px-6 py-2">
            {completedInterviews}/{templates.length} entrevistas com resposta
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <Typography as="label" htmlFor={`interview-${currentTmpl.id}-respondent`} variant="tiny" className="font-black uppercase tracking-widest text-gray-500">
              Respondente
            </Typography>
            <Input
              id={`interview-${currentTmpl.id}-respondent`}
              name={`interview-${currentTmpl.id}-respondent`}
              className="bg-gray-50/30 border-gray-100 focus:bg-white"
              value={respondentName}
              onChange={e => setRespondentName(e.target.value)}
              placeholder="Nome da pessoa entrevistada"
            />
          </div>
          <div className="space-y-2">
            <Typography variant="tiny" className="font-black uppercase tracking-widest text-gray-500">
              Escopo
            </Typography>
            <div className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-6 flex items-center">
              <Typography variant="p" className="text-sm font-bold text-gray-600">
                Diagnóstico consolidado da Visita 1.
              </Typography>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentTmpl.fields.map(field => {
            const value = answers[field.key]
            return (
              <div key={field.key} className={cn("space-y-2 p-6 bg-gray-50/30 rounded-2xl border border-gray-100", field.type === 'textarea' ? 'md:col-span-2' : '')}>
                <Typography as="label" htmlFor={`interview-${currentTmpl.id}-${field.key}`} variant="p" className="font-black text-xs text-gray-600 uppercase">
                  {field.label}{field.required ? ' *' : ''}
                </Typography>

                {field.type === 'textarea' ? (
                  <Textarea
                    id={`interview-${currentTmpl.id}-${field.key}`}
                    name={`interview-${currentTmpl.id}-${field.key}`}
                    className="bg-white border-none shadow-inner min-h-24"
                    placeholder="Resposta do entrevistado..."
                    value={String(value || '')}
                    onChange={e => updateField(field, e.target.value)}
                  />
                ) : field.type === 'scale' ? (
                  <div className="flex flex-wrap gap-4 pt-2">
                    {[1, 2, 3, 4, 5].map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField(field, option)}
                        className={cn(
                          "h-10 w-10 min-w-10 sm:h-12 sm:w-12 sm:min-w-12 rounded-2xl font-black transition-all border-2 flex items-center justify-center text-lg",
                          value === option
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-sm scale-105"
                            : "bg-white border-gray-100 text-gray-500 hover:border-emerald-600/40 hover:text-emerald-600"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : field.type === 'boolean' ? (
                  <label className="h-12 rounded-2xl bg-white border border-gray-100 px-6 flex items-center gap-4 font-bold text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={e => updateField(field, e.target.checked)}
                    />
                    Sim
                  </label>
                ) : field.type === 'select' ? (
                  <Select
                    id={`interview-${currentTmpl.id}-${field.key}`}
                    name={`interview-${currentTmpl.id}-${field.key}`}
                    className="bg-white border-none shadow-inner"
                    value={String(value || '')}
                    onChange={e => updateField(field, e.target.value)}
                  >
                    <option value="">Selecionar...</option>
                    {(field.options || []).map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id={`interview-${currentTmpl.id}-${field.key}`}
                    name={`interview-${currentTmpl.id}-${field.key}`}
                    type={field.type === 'number' ? 'number' : 'text'}
                    className="bg-white border-none shadow-inner"
                    value={String(value ?? '')}
                    onChange={e => updateField(field, e.target.value)}
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 space-y-2">
          <Typography as="label" htmlFor={`interview-${currentTmpl.id}-summary`} variant="p" className="font-black text-xs text-gray-600 uppercase">
            Resumo para planejamento
          </Typography>
          <Textarea
            id={`interview-${currentTmpl.id}-summary`}
            name={`interview-${currentTmpl.id}-summary`}
            className="bg-gray-50/30 border-gray-100 focus:bg-white min-h-28"
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="Síntese consultiva para alimentar o planejamento estratégico e o plano de ação..."
          />
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            type="button"
            variant="primary"
            className="h-11 px-8 font-black uppercase tracking-widest text-xs shadow-sm"
            loading={saving}
            onClick={handleSaveInterview}
            icon={<Save size={16} />}
          >
            {currentResp ? 'Atualizar Entrevista' : 'Salvar Entrevista'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
