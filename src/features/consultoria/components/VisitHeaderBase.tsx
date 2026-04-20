import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/molecules/Card'
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
    <Card>
      <CardHeader className="flex flex-row items-center gap-mx-sm bg-transparent border-b border-border-subtle p-mx-lg">
        <div className="p-mx-xs bg-brand-primary/10 rounded-mx-md">
          <Building2 className="w-5 h-5 text-brand-primary" />
        </div>
        <div className="flex flex-col">
          <CardTitle>Identificação do Cliente</CardTitle>
          <Typography variant="tiny" tone="muted">{clientName}</Typography>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-md">
          <div className="space-y-1">
            <Typography variant="tiny" tone="muted" as="label">Consultor</Typography>
            <Input value={data.consultant_name} onChange={e => onChange({ ...data, consultant_name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Typography variant="tiny" tone="muted" as="label">Data</Typography>
            <Input type="date" value={data.visit_date} onChange={e => onChange({ ...data, visit_date: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Typography variant="tiny" tone="muted" as="label">Tempo</Typography>
            <Input value={data.tempo} onChange={e => onChange({ ...data, tempo: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Typography variant="tiny" tone="muted" as="label">Alvo</Typography>
            <Input value={data.alvo} onChange={e => onChange({ ...data, alvo: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Typography variant="tiny" tone="muted" as="label">Meta Mensal</Typography>
            <Input type="number" value={data.meta_mensal} onChange={e => onChange({ ...data, meta_mensal: e.target.value })} placeholder="Ex: 25" />
          </div>
          <div className="space-y-1">
            <Typography variant="tiny" tone="muted" as="label">Projeção</Typography>
            <Input type="number" value={data.projecao} onChange={e => onChange({ ...data, projecao: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Typography variant="tiny" tone="muted" as="label">Leads (Mês)</Typography>
            <Input type="number" value={data.leads_mes} onChange={e => onChange({ ...data, leads_mes: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Typography variant="tiny" tone="muted" as="label">Estoque</Typography>
            <Input type="number" value={data.estoque_disponivel} onChange={e => onChange({ ...data, estoque_disponivel: e.target.value })} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
