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
    <Card className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Users className="w-20 h-20 text-emerald-600" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8 border-b border-gray-100 pb-6">
          <div className="min-w-0">
            <Typography variant="tiny" tone="muted" className="mb-0 block font-black tracking-widest uppercase opacity-60">Identificação do Cliente</Typography>
            <Typography variant="h1" className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 leading-tight uppercase break-words">
              {clientName}
            </Typography>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full lg:w-auto">
            <div className="space-y-2">
              <Typography variant="tiny" tone="muted" className="uppercase font-bold">Consultor</Typography>
              <Input aria-label="Consultor" id="header-consultant" name="header-consultant" value={data.consultant_name} onChange={e => onChange({ consultant_name: e.target.value })} className="h-10 bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-emerald-600 font-bold transition-all shadow-sm" />
            </div>
            <div className="space-y-2">
              <Typography variant="tiny" tone="muted" className="uppercase font-bold">Data</Typography>
              <Input aria-label="Data" id="header-date" name="header-date" type="date" value={data.visit_date} onChange={e => onChange({ visit_date: e.target.value })} className="h-10 bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-emerald-600 font-bold transition-all shadow-sm" />
            </div>
            <div className="space-y-2">
              <Typography variant="tiny" tone="muted" className="uppercase font-bold">Tempo</Typography>
              <Input aria-label="Tempo" id="header-time" name="header-time" value={data.tempo} onChange={e => onChange({ tempo: e.target.value })} className="h-10 bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-emerald-600 font-bold transition-all shadow-sm" />
            </div>
            <div className="space-y-2">
              <Typography variant="tiny" tone="muted" className="uppercase font-bold">Alvo</Typography>
              <Input aria-label="Alvo" id="header-target" name="header-target" value={data.alvo} onChange={e => onChange({ alvo: e.target.value })} className="h-10 bg-gray-50/50 border border-gray-100 focus:bg-white focus:border-emerald-600 font-bold transition-all shadow-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-2 p-6 bg-emerald-600/5 rounded-2xl border border-emerald-600/10 shadow-sm">
            <Typography variant="tiny" className="text-emerald-600 font-black uppercase tracking-widest text-[10px]">Meta Mensal</Typography>
            <Input id="header-meta" name="header-meta" value={data.meta_mensal} onChange={e => onChange({ meta_mensal: e.target.value })} placeholder="Ex: 25" className="bg-transparent border-none p-0 text-2xl font-black text-emerald-600 focus-visible:ring-0 placeholder:text-emerald-600/10" />
          </div>
          <div className="space-y-2 p-6 bg-gray-900/5 rounded-2xl border border-gray-900/10 shadow-sm">
            <Typography variant="tiny" className="text-gray-900 font-black uppercase tracking-widest text-[10px]">Projeção</Typography>
            <Input aria-label="Projeção" id="header-projection" name="header-projection" value={data.projecao} onChange={e => onChange({ projecao: e.target.value })} className="bg-transparent border-none p-0 text-2xl font-black text-gray-900 focus-visible:ring-0" />
          </div>
          <div className="space-y-2 p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
            <Typography variant="tiny" className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Leads (Mês)</Typography>
            <Input aria-label="Leads (Mês)" id="header-leads" name="header-leads" value={data.leads_mes} onChange={e => onChange({ leads_mes: e.target.value })} className="bg-transparent border-none p-0 text-2xl font-black text-gray-800 focus-visible:ring-0" />
          </div>
          <div className="space-y-2 p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
            <Typography variant="tiny" className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Estoque</Typography>
            <Input aria-label="Estoque" id="header-stock" name="header-stock" value={data.estoque_disponivel} onChange={e => onChange({ estoque_disponivel: e.target.value })} className="bg-transparent border-none p-0 text-2xl font-black text-gray-800 focus-visible:ring-0" />
          </div>
        </div>
      </div>
    </Card>
  )
}
