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
    <Card className="p-8 border-l-[12px] border-brand-primary shadow-mx-lg bg-white relative overflow-hidden print:shadow-none print:border-mx-border">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 print:hidden" />
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-brand-primary" />
          <Typography variant="h2" className="font-black tracking-tighter uppercase italic leading-none">Cabeçalho Mandatório</Typography>
        </div>
        <Badge variant="outline" className="font-black text-lg px-6 py-2 border-2 border-brand-primary text-brand-primary">
          {clientName.toUpperCase()}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-1">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Consultor Responsável</Typography>
          <Input value={data.consultant_name} onChange={e => onChange({ ...data, consultant_name: e.target.value })} className="h-12 font-bold border-2 focus:border-brand-primary bg-mx-bg-secondary/10" />
        </div>
        <div className="space-y-1">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Data da Visita</Typography>
          <Input type="date" value={data.visit_date} onChange={e => onChange({ ...data, visit_date: e.target.value })} className="h-12 font-bold border-2 focus:border-brand-primary bg-mx-bg-secondary/10" />
        </div>
        <div className="space-y-1">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Tempo da Visita</Typography>
          <Input value={data.tempo} onChange={e => onChange({ ...data, tempo: e.target.value })} className="h-12 font-bold border-2 bg-mx-bg-secondary/10" />
        </div>
        <div className="space-y-1">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Participantes (Alvo)</Typography>
          <Input value={data.alvo} onChange={e => onChange({ ...data, alvo: e.target.value })} className="h-12 font-bold border-2 bg-mx-bg-secondary/10" />
        </div>
        <div className="space-y-1">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Meta Mensal</Typography>
          <Input value={data.meta_mensal} onChange={e => onChange({ ...data, meta_mensal: e.target.value })} placeholder="Ex: 25" className="h-12 font-bold border-2" />
        </div>
        <div className="space-y-1">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Projeção Atual</Typography>
          <Input value={data.projecao} onChange={e => onChange({ ...data, projecao: e.target.value })} className="h-12 font-bold border-2" />
        </div>
        <div className="space-y-1">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Leads no Mês</Typography>
          <Input value={data.leads_mes} onChange={e => onChange({ ...data, leads_mes: e.target.value })} className="h-12 font-bold border-2" />
        </div>
        <div className="space-y-1">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-[9px]">Estoque Disponível</Typography>
          <Input value={data.estoque_disponivel} onChange={e => onChange({ ...data, estoque_disponivel: e.target.value })} className="h-12 font-bold border-2" />
        </div>
      </div>
    </Card>
  )
}
