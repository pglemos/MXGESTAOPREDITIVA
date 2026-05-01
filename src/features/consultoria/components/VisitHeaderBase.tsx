import React from 'react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Input } from '@/components/atoms/Input'
import { Users } from 'lucide-react'

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
      <div className="absolute top-mx-0 right-mx-0 p-mx-lg opacity-5 group-hover:opacity-10 transition-opacity">
        <Users className="w-mx-20 h-mx-20 text-brand-primary" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-mx-md mb-mx-lg border-b border-border-subtle pb-mx-md">
          <div className="min-w-0">
            <Typography variant="tiny" tone="muted" className="mb-0 block font-black tracking-mx-widest uppercase opacity-60">Identificação do Cliente</Typography>
            <Typography variant="h1" className="text-2xl sm:text-3xl lg:text-4xl font-black text-brand-primary leading-tight uppercase break-words">
              {clientName}
            </Typography>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-mx-md w-full lg:w-auto">
            <div className="space-y-mx-xs">
              <Typography variant="tiny" tone="muted" className="uppercase font-bold">Consultor</Typography>
              <Input id="header-consultant" name="header-consultant" value={data.consultant_name} onChange={e => onChange({ consultant_name: e.target.value })} className="h-mx-10 bg-surface-alt/50 border border-border-subtle focus:bg-white focus:border-brand-primary font-bold transition-all shadow-sm" />
            </div>
            <div className="space-y-mx-xs">
              <Typography variant="tiny" tone="muted" className="uppercase font-bold">Data</Typography>
              <Input id="header-date" name="header-date" type="date" value={data.visit_date} onChange={e => onChange({ visit_date: e.target.value })} className="h-mx-10 bg-surface-alt/50 border border-border-subtle focus:bg-white focus:border-brand-primary font-bold transition-all shadow-sm" />
            </div>
            <div className="space-y-mx-xs">
              <Typography variant="tiny" tone="muted" className="uppercase font-bold">Tempo</Typography>
              <Input id="header-time" name="header-time" value={data.tempo} onChange={e => onChange({ tempo: e.target.value })} className="h-mx-10 bg-surface-alt/50 border border-border-subtle focus:bg-white focus:border-brand-primary font-bold transition-all shadow-sm" />
            </div>
            <div className="space-y-mx-xs">
              <Typography variant="tiny" tone="muted" className="uppercase font-bold">Alvo</Typography>
              <Input id="header-target" name="header-target" value={data.alvo} onChange={e => onChange({ alvo: e.target.value })} className="h-mx-10 bg-surface-alt/50 border border-border-subtle focus:bg-white focus:border-brand-primary font-bold transition-all shadow-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-md">
          <div className="space-y-mx-xs p-mx-md bg-brand-primary/5 rounded-mx-xl border border-brand-primary/10 shadow-mx-sm">
            <Typography variant="tiny" className="text-brand-primary font-black uppercase tracking-mx-widest text-mx-tiny">Meta Mensal</Typography>
            <Input id="header-meta" name="header-meta" value={data.meta_mensal} onChange={e => onChange({ meta_mensal: e.target.value })} placeholder="Ex: 25" className="bg-transparent border-none p-mx-0 text-2xl font-black text-brand-primary focus-visible:ring-0 placeholder:text-brand-primary/10" />
          </div>
          <div className="space-y-mx-xs p-mx-md bg-brand-secondary/5 rounded-mx-xl border border-brand-secondary/10 shadow-mx-sm">
            <Typography variant="tiny" className="text-brand-secondary font-black uppercase tracking-mx-widest text-mx-tiny">Projeção</Typography>
            <Input id="header-projection" name="header-projection" value={data.projecao} onChange={e => onChange({ projecao: e.target.value })} className="bg-transparent border-none p-mx-0 text-2xl font-black text-brand-secondary focus-visible:ring-0" />
          </div>
          <div className="space-y-mx-xs p-mx-md bg-surface-alt rounded-mx-xl border border-border-default shadow-mx-sm">
            <Typography variant="tiny" className="text-text-tertiary font-black uppercase tracking-mx-widest text-mx-tiny">Leads (Mês)</Typography>
            <Input id="header-leads" name="header-leads" value={data.leads_mes} onChange={e => onChange({ leads_mes: e.target.value })} className="bg-transparent border-none p-mx-0 text-2xl font-black text-text-primary focus-visible:ring-0" />
          </div>
          <div className="space-y-mx-xs p-mx-md bg-surface-alt rounded-mx-xl border border-border-default shadow-mx-sm">
            <Typography variant="tiny" className="text-text-tertiary font-black uppercase tracking-mx-widest text-mx-tiny">Estoque</Typography>
            <Input id="header-stock" name="header-stock" value={data.estoque_disponivel} onChange={e => onChange({ estoque_disponivel: e.target.value })} className="bg-transparent border-none p-mx-0 text-2xl font-black text-text-primary focus-visible:ring-0" />
          </div>
        </div>
      </div>
    </Card>
  )
}
