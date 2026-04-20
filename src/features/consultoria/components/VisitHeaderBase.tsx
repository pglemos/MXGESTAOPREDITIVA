import React from 'react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Input } from '@/components/atoms/Input'
import { Building2 } from 'lucide-react'

interface VisitHeaderBaseProps {
  clientName: string
  data: {
    meta_mensal: string
    projecao: string
    leads_mes: string
    estoque_disponivel: string
    consultant_name: string
    visit_date: string
    tempo: string
    alvo: string
  }
  onChange: (data: any) => void
}

export function VisitHeaderBase({ clientName, data, onChange }: VisitHeaderBaseProps) {
  return (
    <Card className="p-6 border border-border-default shadow-sm rounded-2xl bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 rounded-lg">
            <Building2 className="w-5 h-5 text-brand-primary" />
          </div>
          <Typography variant="h3" className="font-black tracking-tight uppercase leading-none text-xl">Identificação do Cliente</Typography>
        </div>
        <div className="px-4 py-1.5 bg-surface-alt/50 border border-border-default rounded-lg">
          <Typography variant="p" className="font-bold text-sm text-text-primary">{clientName.toUpperCase()}</Typography>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-1">Consultor</label>
          <Input value={data.consultant_name} onChange={e => onChange({ ...data, consultant_name: e.target.value })} className="h-10 font-medium text-sm bg-white border-border-default focus:border-brand-primary rounded-lg px-3 shadow-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-1">Data</label>
          <Input type="date" value={data.visit_date} onChange={e => onChange({ ...data, visit_date: e.target.value })} className="h-10 font-medium text-sm bg-white border-border-default focus:border-brand-primary rounded-lg px-3 shadow-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-1">Tempo</label>
          <Input value={data.tempo} onChange={e => onChange({ ...data, tempo: e.target.value })} className="h-10 font-medium text-sm bg-white border-border-default focus:border-brand-primary rounded-lg px-3 shadow-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-1">Alvo</label>
          <Input value={data.alvo} onChange={e => onChange({ ...data, alvo: e.target.value })} className="h-10 font-medium text-sm bg-white border-border-default focus:border-brand-primary rounded-lg px-3 shadow-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-1">Meta Mensal</label>
          <Input type="number" value={data.meta_mensal} onChange={e => onChange({ ...data, meta_mensal: e.target.value })} placeholder="Ex: 25" className="h-10 font-medium text-sm bg-white border-border-default focus:border-brand-primary rounded-lg px-3 shadow-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-1">Projeção</label>
          <Input type="number" value={data.projecao} onChange={e => onChange({ ...data, projecao: e.target.value })} className="h-10 font-medium text-sm bg-white border-border-default focus:border-brand-primary rounded-lg px-3 shadow-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-1">Leads (Mês)</label>
          <Input type="number" value={data.leads_mes} onChange={e => onChange({ ...data, leads_mes: e.target.value })} className="h-10 font-medium text-sm bg-white border-border-default focus:border-brand-primary rounded-lg px-3 shadow-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider ml-1">Estoque</label>
          <Input type="number" value={data.estoque_disponivel} onChange={e => onChange({ ...data, estoque_disponivel: e.target.value })} className="h-10 font-medium text-sm bg-white border-border-default focus:border-brand-primary rounded-lg px-3 shadow-sm" />
        </div>
      </div>
    </Card>
  )
}
