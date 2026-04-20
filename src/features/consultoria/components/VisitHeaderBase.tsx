import React from 'react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
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
    <Card className="p-6 md:p-8 bg-white border border-border-default shadow-sm rounded-2xl relative overflow-hidden print:shadow-none print:border-border-default">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 print:hidden" />
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 rounded-lg">
            <Building2 className="w-5 h-5 text-brand-primary" />
          </div>
          <Typography variant="h3" className="font-black tracking-tight uppercase leading-none">Cabeçalho da Visita</Typography>
        </div>
        <Badge variant="outline" className="font-bold text-xs md:text-sm px-4 py-1.5 border-brand-primary/20 text-brand-primary whitespace-nowrap bg-brand-primary/5 shadow-sm">
          {clientName.toUpperCase()}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
        <div className="space-y-1.5">
          <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wider text-[10px] ml-1">Consultor Responsável</Typography>
          <Input value={data.consultant_name} onChange={e => onChange({ ...data, consultant_name: e.target.value })} className="h-11 font-bold text-sm bg-surface-alt/50 border-border-default focus:bg-white focus:border-brand-primary rounded-xl px-3 shadow-sm transition-colors" />
        </div>
        <div className="space-y-1.5">
          <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wider text-[10px] ml-1">Data da Visita</Typography>
          <Input type="date" value={data.visit_date} onChange={e => onChange({ ...data, visit_date: e.target.value })} className="h-11 font-bold text-sm bg-surface-alt/50 border-border-default focus:bg-white focus:border-brand-primary rounded-xl px-3 shadow-sm transition-colors" />
        </div>
        <div className="space-y-1.5">
          <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wider text-[10px] ml-1">Tempo da Visita</Typography>
          <Input value={data.tempo} onChange={e => onChange({ ...data, tempo: e.target.value })} className="h-11 font-bold text-sm bg-surface-alt/50 border-border-default focus:bg-white focus:border-brand-primary rounded-xl px-3 shadow-sm transition-colors" />
        </div>
        <div className="space-y-1.5">
          <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wider text-[10px] ml-1">Participantes (Alvo)</Typography>
          <Input value={data.alvo} onChange={e => onChange({ ...data, alvo: e.target.value })} className="h-11 font-bold text-sm bg-surface-alt/50 border-border-default focus:bg-white focus:border-brand-primary rounded-xl px-3 shadow-sm transition-colors" />
        </div>
        <div className="space-y-1.5">
          <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wider text-[10px] ml-1">Meta Mensal (Carros)</Typography>
          <Input type="number" value={data.meta_mensal} onChange={e => onChange({ ...data, meta_mensal: e.target.value })} placeholder="Ex: 25" className="h-11 font-bold text-sm bg-white border-border-default focus:border-brand-primary rounded-xl px-3 shadow-sm transition-colors" />
        </div>
        <div className="space-y-1.5">
          <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wider text-[10px] ml-1">Projeção Atual</Typography>
          <Input type="number" value={data.projecao} onChange={e => onChange({ ...data, projecao: e.target.value })} className="h-11 font-bold text-sm bg-white border-border-default focus:border-brand-primary rounded-xl px-3 shadow-sm transition-colors" />
        </div>
        <div className="space-y-1.5">
          <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wider text-[10px] ml-1">Leads no Mês</Typography>
          <Input type="number" value={data.leads_mes} onChange={e => onChange({ ...data, leads_mes: e.target.value })} className="h-11 font-bold text-sm bg-white border-border-default focus:border-brand-primary rounded-xl px-3 shadow-sm transition-colors" />
        </div>
        <div className="space-y-1.5">
          <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wider text-[10px] ml-1">Estoque Disponível</Typography>
          <Input type="number" value={data.estoque_disponivel} onChange={e => onChange({ ...data, estoque_disponivel: e.target.value })} className="h-11 font-bold text-sm bg-white border-border-default focus:border-brand-primary rounded-xl px-3 shadow-sm transition-colors" />
        </div>
      </div>
    </Card>
  )
}
