import React from 'react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Input } from '@/components/atoms/Input'
import { Calendar, Clock, Target, Users } from 'lucide-react'

interface Props {
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
  onChange: (updates: Partial<Props['data']>) => void
  clientName: string
}

export function VisitHeaderBase({ data, onChange, clientName }: Props) {
  return (
    <Card className="p-mx-lg bg-white border border-border-default shadow-mx-xl rounded-mx-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-mx-lg opacity-5 group-hover:opacity-10 transition-opacity">
        <Users className="w-mx-20 h-mx-20 text-brand-primary" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-mx-md mb-mx-lg border-b border-border-subtle pb-mx-md">
          <div>
            <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-widest mb-1">Identificação do Cliente</Typography>
            <Typography variant="h1" className="text-3xl text-brand-primary">{clientName}</Typography>
          </div>
          <div className="flex flex-wrap gap-mx-md">
            <div className="space-y-mx-xs">
              <Typography variant="tiny" tone="muted" className="uppercase font-bold">Consultor</Typography>
              <Input value={data.consultant_name} onChange={e => onChange({ consultant_name: e.target.value })} className="h-mx-10 bg-surface-alt/50 border-none font-bold" />
            </div>
            <div className="space-y-mx-xs">
              <Typography variant="tiny" tone="muted" className="uppercase font-bold">Data</Typography>
              <Input type="date" value={data.visit_date} onChange={e => onChange({ visit_date: e.target.value })} className="h-mx-10 bg-surface-alt/50 border-none font-bold" />
            </div>
            <div className="space-y-mx-xs">
              <Typography variant="tiny" tone="muted" className="uppercase font-bold">Tempo</Typography>
              <Input value={data.tempo} onChange={e => onChange({ tempo: e.target.value })} className="h-mx-10 bg-surface-alt/50 border-none font-bold" />
            </div>
            <div className="space-y-mx-xs">
              <Typography variant="tiny" tone="muted" className="uppercase font-bold">Alvo</Typography>
              <Input value={data.alvo} onChange={e => onChange({ alvo: e.target.value })} className="h-mx-10 bg-surface-alt/50 border-none font-bold" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-md">
          <div className="space-y-mx-xs p-mx-md bg-brand-primary/5 rounded-mx-xl border border-brand-primary/10">
            <Typography variant="tiny" className="text-brand-primary font-black uppercase">Meta Mensal</Typography>
            <Input value={data.meta_mensal} onChange={e => onChange({ meta_mensal: e.target.value })} placeholder="Ex: 25" className="bg-transparent border-none p-0 text-xl font-black text-brand-primary focus-visible:ring-0" />
          </div>
          <div className="space-y-mx-xs p-mx-md bg-brand-secondary/5 rounded-mx-xl border border-brand-secondary/10">
            <Typography variant="tiny" className="text-brand-secondary font-black uppercase">Projeção</Typography>
            <Input value={data.projecao} onChange={e => onChange({ projecao: e.target.value })} className="bg-transparent border-none p-0 text-xl font-black text-brand-secondary focus-visible:ring-0" />
          </div>
          <div className="space-y-mx-xs p-mx-md bg-surface-alt rounded-mx-xl border border-border-default">
            <Typography variant="tiny" className="text-text-tertiary font-black uppercase">Leads (Mês)</Typography>
            <Input value={data.leads_mes} onChange={e => onChange({ leads_mes: e.target.value })} className="bg-transparent border-none p-0 text-xl font-black text-text-primary focus-visible:ring-0" />
          </div>
          <div className="space-y-mx-xs p-mx-md bg-surface-alt rounded-mx-xl border border-border-default">
            <Typography variant="tiny" className="text-text-tertiary font-black uppercase">Estoque</Typography>
            <Input value={data.estoque_disponivel} onChange={e => onChange({ estoque_disponivel: e.target.value })} className="bg-transparent border-none p-0 text-xl font-black text-text-primary focus-visible:ring-0" />
          </div>
        </div>
      </div>
    </Card>
  )
}
