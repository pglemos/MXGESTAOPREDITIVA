import React, { useState } from 'react'
import { 
  CheckCircle2, Circle, Zap, Target, ExternalLink, BarChart3, 
  Clock, TrendingUp, Award, Rocket, ShieldCheck, AlertCircle,
  ShieldAlert, Calculator, MousePointer2, Presentation, BarChart
} from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Select } from '@/components/atoms/Select'
import { useConsultingStrategicPlan } from '@/hooks/useConsultingStrategicPlan'
import { useFeedbacks, usePDIs } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { cn } from '@/lib/utils'

export function VisitTwoExecution({ clientId, clientSlug }: { clientId: string, clientSlug: string }) {
  const { latestPlan } = useConsultingStrategicPlan(clientId)
  return (
    <div className="space-y-mx-lg">
      <Card className="p-mx-lg border border-status-error/30 bg-status-error/5 shadow-sm rounded-2xl">
        <div className="flex items-center gap-mx-sm mb-2">
          <ShieldAlert className="w-mx-6 h-mx-6 text-status-error" />
          <Typography variant="h3" className="text-status-error">Trava Metodológica</Typography>
        </div>
        <Typography variant="p" className="text-status-error text-sm">
          Sem o formulário de ACOMPANHAMENTO DIÁRIO (SGAP) instalado no celular dos vendedores e a rotina validada, o trabalho não avança.
        </Typography>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
        <Card className="p-mx-lg bg-white border border-border-default shadow-sm rounded-2xl flex flex-col justify-center gap-mx-md">
          <div className="flex items-center gap-mx-sm">
            <div className="p-mx-xs bg-brand-primary/10 rounded-lg text-brand-primary"><Zap className="w-mx-5 h-mx-5" /></div>
            <Typography variant="h3">Ferramentas de Gestão</Typography>
          </div>
          <Button className="w-full justify-between h-mx-12 shadow-sm font-bold bg-white" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientSlug}?tab=strategic`, '_blank')}>
            <div className="flex items-center gap-mx-sm"><Target className="w-mx-4 h-mx-4 text-text-tertiary" />Planejamento Estratégico</div>
            <ExternalLink className="w-mx-4 h-mx-4 text-text-tertiary" />
          </Button>
          <Button className="w-full justify-between h-mx-12 shadow-sm font-bold border-brand-primary text-brand-primary bg-white" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientSlug}?tab=daily`, '_blank')}>
            <div className="flex items-center gap-mx-sm"><BarChart3 className="w-mx-4 h-mx-4" />Validar SGAP Diário</div>
            <ExternalLink className="w-mx-4 h-mx-4 opacity-50" />
          </Button>
        </Card>

        <Card className="p-mx-lg bg-surface-alt/30 border border-border-default shadow-sm rounded-2xl flex flex-col items-center justify-center text-center">
          {latestPlan ? (
            <div className="space-y-mx-xs">
              <div className="w-mx-12 h-mx-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-border-default">
                <CheckCircle2 className="w-mx-6 h-mx-6 text-status-success" />
              </div>
              <Typography variant="h3" className="text-text-primary">P.E. Validado</Typography>
              <Typography variant="p" className="text-xs text-text-tertiary">{latestPlan.title}</Typography>
            </div>
          ) : (
            <div className="space-y-mx-xs opacity-50">
              <div className="w-mx-12 h-mx-12 bg-white rounded-full flex items-center justify-center mx-auto border border-border-default">
                <Rocket className="w-mx-6 h-mx-6 text-text-tertiary" />
              </div>
              <Typography variant="p" className="text-sm font-bold">Aguardando registro do P.E. no sistema</Typography>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export function VisitThreeExecution() {
  return (
    <Card className="p-mx-lg shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-mx-sm mb-6">
        <div className="p-mx-xs bg-brand-primary/10 rounded-lg text-brand-primary"><Clock size={20} /></div>
        <Typography variant="h3" className="text-lg">Ritual de Rotinas (Disciplina)</Typography>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
        <div className="p-mx-md bg-surface-alt/30 rounded-xl border border-border-default relative">
          <Badge className="absolute -top-3 left-4 font-bold text-[9px] bg-brand-secondary text-white border-none px-3 py-0.5 shadow-sm">GERENTE</Badge>
          <ul className="space-y-3 text-sm font-medium text-text-secondary mt-2">
            {[ '09:30 - Cobrar preenchimento SGAP', '10:30 - Reunião Matinal / Ranking', '14:00 - Auditoria de CRM / Funil', '17:00 - Feedback Imediato' ].map(li => (<li key={li} className="flex items-center gap-mx-xs"><div className="w-1.5 h-1.5 rounded-full bg-brand-secondary shrink-0" /> {li}</li>))}
          </ul>
        </div>
        <div className="p-mx-md bg-surface-alt/30 rounded-xl border border-border-default relative">
          <Badge className="absolute -top-3 left-4 font-bold text-[9px] bg-brand-primary text-white border-none px-3 py-0.5 shadow-sm">VENDEDOR</Badge>
          <ul className="space-y-3 text-sm font-medium text-text-secondary mt-2">
            {[ 'Registro Leads Porta/Online', 'Agendamentos Carteira', 'Atendimento e Prospecção', 'Lançamento Vendas Ontem' ].map(li => (<li key={li} className="flex items-center gap-mx-xs"><div className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" /> {li}</li>))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

export function VisitFourExecution({ storeId, onGenerateSummary }: { storeId: string, onGenerateSummary: (t: string) => void }) { 
  const { sellers } = useTeam(storeId)
  const { createFeedback } = useFeedbacks({ storeId })
  const [s, setS] = useState(false); const [v, setV] = useState(''); const [p, setP] = useState(''); const [a, setA] = useState(''); const [m, setM] = useState(0)

  const save = async () => {
    if (!v) return toast.error('Vendedor obrigatório')
    setS(true)
    try {
      await createFeedback({ 
        seller_id: v, 
        positives: p, 
        attention_points: '...', 
        action: a, 
        meta_compromisso: m, 
        week_reference: new Date().toISOString(),
        leads_week: 0,
        agd_week: 0,
        visit_week: 0,
        vnd_week: 0,
        tx_lead_agd: 0,
        tx_agd_visita: 0,
        tx_visita_vnd: 0
      })
      const sn = sellers.find(s => s.id === v)?.name || 'Vnd'
      onGenerateSummary(`--- FEEDBACK: ${sn} ---\nPositivos: ${p}\nAção: ${a}\nMeta: ${m}`)
      toast.success('Feedback salvo no sistema')
      setP(''); setA('')
    } finally { setS(false) }
  }

  return (
    <Card className="p-mx-lg shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-mx-sm mb-6">
        <div className="p-mx-xs bg-brand-primary/10 rounded-lg text-brand-primary"><TrendingUp size={20} /></div>
        <Typography variant="h3" className="text-lg">Feedback Estruturado</Typography>
      </div>
      <div className="space-y-mx-md">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Vendedor</label>
          <select value={v} onChange={e => setV(e.target.value)} className="w-full h-mx-10 px-3 rounded-lg border border-border-default bg-white text-sm">
            <option value="">Selecione o vendedor...</option>
            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Pontos Positivos</label>
            <Textarea value={p} onChange={e => setP(e.target.value)} className="bg-white min-h-[100px] border-border-default rounded-xl font-medium text-sm shadow-sm resize-none" placeholder="O que está funcionando bem?" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Acordo de Ação</label>
            <Textarea value={a} onChange={e => setA(e.target.value)} className="bg-white min-h-[100px] border-border-default rounded-xl font-medium text-sm shadow-sm resize-none" placeholder="O que o vendedor prometeu mudar?" />
          </div>
        </div>
        <div className="flex gap-mx-md items-end pt-2">
          <div className="w-1/3 md:w-1/4">
            <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Meta Acordada</label>
            <Input type="number" value={m} onChange={e => setM(parseInt(e.target.value))} className="h-mx-10 font-bold text-brand-primary text-center border-border-default rounded-lg shadow-sm" />
          </div>
          <Button className="flex-1 h-mx-10 shadow-sm text-sm" variant="primary" onClick={save} loading={s}>Salvar Feedback</Button>
        </div>
      </div>
    </Card>
  ) 
}

export function VisitSevenExecution({ storeId, onGenerateSummary }: { storeId: string, onGenerateSummary: (t: string) => void }) { 
  const { sellers } = useTeam(storeId)
  const { createPDI } = usePDIs(storeId)
  const [s, setS] = useState(false); const [v, setV] = useState(''); const [o, setO] = useState('')

  const save = async () => {
    if (!v || !o) return toast.error('Preencha os campos')
    setS(true)
    try {
      await createPDI({ 
        seller_id: v, 
        meta_6m: o, 
        meta_12m: '...', 
        meta_24m: '...',
        action_1: '...',
        comp_prospeccao: 3, comp_abordagem: 3, comp_demonstracao: 3, comp_fechamento: 3,
        comp_crm: 3, comp_digital: 3, comp_disciplina: 3, comp_organizacao: 3,
        comp_negociacao: 3, comp_produto: 3
      })
      const sn = sellers.find(s => s.id === v)?.name || 'Vnd'
      onGenerateSummary(`--- PDI: ${sn} ---\nObjetivo: ${o}`)
      toast.success('PDI Criado com sucesso')
      setO('')
    } finally { setS(false) }
  }

  return (
    <Card className="p-mx-lg shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-mx-sm mb-6">
        <div className="p-mx-xs bg-brand-primary/10 rounded-lg text-brand-primary"><Award size={20} /></div>
        <Typography variant="h3" className="text-lg">SGAP: Plano de Carreira (PDI)</Typography>
      </div>
      <div className="space-y-mx-md">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Vendedor</label>
          <select value={v} onChange={e => setV(e.target.value)} className="w-full h-mx-10 px-3 rounded-lg border border-border-default bg-white text-sm">
            <option value="">Selecione o vendedor...</option>
            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Objetivo de Carreira</label>
          <Textarea value={o} onChange={e => setO(e.target.value)} className="bg-white min-h-[100px] border-border-default rounded-xl font-medium text-sm shadow-sm resize-none" placeholder="Onde este vendedor quer estar em 6 meses?" />
        </div>
        <Button className="w-full sm:w-auto h-mx-10 shadow-sm" variant="primary" onClick={save} loading={s}>Salvar e Assinar PDI</Button>
      </div>
    </Card>
  )
}

export function VisitChecklist({ items, onToggle }: { items: Array<{ task: string, completed: boolean }>, onToggle: (i: number) => void }) {
  const toggle = (i: number) => onToggle(i)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-mx-sm">
      {items.map((it, i) => (
        <div key={i} onClick={() => toggle(i)} className={cn("p-mx-xs rounded-lg border cursor-pointer transition-colors flex items-center gap-mx-xs text-xs font-bold", it.completed ? "bg-brand-primary/5 text-brand-primary border-brand-primary/20" : "bg-white border-border-default text-text-secondary hover:bg-surface-alt/30")}>
          {it.completed ? <CheckCircle2 className="w-mx-4 h-mx-4 shrink-0" /> : <Circle className="w-mx-4 h-mx-4 shrink-0 opacity-20" />}
          <span className="truncate">{it.task}</span>
        </div>
      ))}
    </div>
  )
}

export function VisitFiveExecution({ onGenerateSummary }: { onGenerateSummary: (t: string) => void }) {
  return (
    <Card className="p-mx-lg shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-mx-sm mb-4">
        <div className="p-mx-xs bg-brand-primary/10 rounded-lg text-brand-primary"><Presentation size={20} /></div>
        <Typography variant="h3" className="text-lg">Treinamento de Técnicas de Vendas</Typography>
      </div>
      <Typography variant="p" className="mb-4">Realize o treinamento prático com a equipe focado em contorno de objeções e fechamento.</Typography>
      <Button variant="outline" onClick={() => onGenerateSummary("Treinamento de vendas realizado com foco em fechamento.")}>Registrar Realização</Button>
    </Card>
  )
}

export function VisitSixExecution({ clientId, clientSlug, onGenerateSummary }: { clientId: string, clientSlug: string, onGenerateSummary: (t: string) => void }) {
  return (
    <Card className="p-mx-lg shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-mx-sm mb-4">
        <div className="p-mx-xs bg-brand-primary/10 rounded-lg text-brand-primary"><BarChart size={20} /></div>
        <Typography variant="h3" className="text-lg">Revisão de Metas e Funil</Typography>
      </div>
      <Typography variant="p" className="mb-4">Analise o funil de vendas atual e ajuste as metas se necessário.</Typography>
      <Button variant="outline" onClick={() => onGenerateSummary("Revisão de funil e metas concluída.")}>Registrar Revisão</Button>
    </Card>
  )
}

export function VisitEightExecution({ clientId, clientSlug }: { clientId: string, clientSlug: string }) {
  return (
    <Card className="p-mx-lg shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-mx-sm mb-4">
        <div className="p-mx-xs bg-brand-primary/10 rounded-lg text-brand-primary"><ShieldCheck size={20} /></div>
        <Typography variant="h3" className="text-lg">Auditoria de Processos</Typography>
      </div>
      <Typography variant="p">Auditoria completa dos processos de CRM, Preparação e Pós-Venda.</Typography>
    </Card>
  )
}

export function VisitNineExecution({ financials, onGenerateSummary }: { financials: any[], onGenerateSummary: (t: string) => void }) {
  return (
    <Card className="p-mx-lg shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-mx-sm mb-4">
        <div className="p-mx-xs bg-brand-primary/10 rounded-lg text-brand-primary"><Calculator size={20} /></div>
        <Typography variant="h3" className="text-lg">Análise de DRE e Lucratividade</Typography>
      </div>
      <Typography variant="p" className="mb-4">Revisão final dos indicadores financeiros e lucratividade do período.</Typography>
      <Button variant="outline" onClick={() => onGenerateSummary("Análise de DRE e lucratividade concluída.")}>Registrar Análise</Button>
    </Card>
  )
}
