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
        <div className="flex items-center gap-mx-sm mb-mx-xs">
          <ShieldAlert className="w-mx-6 h-mx-6 text-status-error" />
          <Typography variant="h3" className="text-status-error">Trava Metodológica</Typography>
        </div>
        <Typography variant="p" className="text-status-error text-sm">
          Sem o formulário de ACOMPANHAMENTO DIÁRIO (SGAP) instalado no celular dos vendedores e a rotina validada, o trabalho não avança.
        </Typography>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
        <Card className="p-mx-lg bg-white border border-border-default shadow-sm rounded-mx-2xl flex flex-col justify-center gap-mx-md">
          <div className="flex items-center gap-mx-sm">
            <div className="p-mx-xs bg-brand-primary/10 rounded-mx-lg text-brand-primary"><Zap className="w-mx-5 h-mx-5" /></div>
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

        <Card className="p-mx-lg bg-surface-alt/30 border border-border-default shadow-sm rounded-mx-2xl flex flex-col items-center justify-center text-center">
          {latestPlan ? (
            <div className="space-y-mx-xs">
              <div className="w-mx-12 h-mx-12 bg-white rounded-mx-full flex items-center justify-center mx-auto shadow-sm border border-border-default">
                <CheckCircle2 className="w-mx-6 h-mx-6 text-status-success" />
              </div>
              <Typography variant="h3" className="text-text-primary">P.E. Validado</Typography>
              <Typography variant="p" className="text-mx-micro text-text-tertiary">{latestPlan.title}</Typography>
            </div>
          ) : (
            <div className="space-y-mx-xs opacity-50">
              <div className="w-mx-12 h-mx-12 bg-white rounded-mx-full flex items-center justify-center mx-auto border border-border-default">
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
    <Card className="p-mx-lg shadow-sm border border-border-default bg-white rounded-mx-2xl">
      <div className="flex items-center gap-mx-sm mb-mx-md">
        <div className="p-mx-xs bg-brand-primary/10 rounded-mx-lg text-brand-primary"><Clock size={20} /></div>
        <Typography variant="h3" className="text-lg">Ritual de Rotinas (Disciplina)</Typography>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
        <div className="p-mx-md bg-surface-alt/30 rounded-mx-xl border border-border-default relative">
          <Badge className="absolute -top-mx-tiny left-mx-md font-bold text-mx-micro bg-brand-secondary text-white border-none px-mx-sm py-0.5 shadow-sm">GERENTE</Badge>
          <ul className="space-y-mx-md text-sm font-medium text-text-secondary mt-2">
            {[ '09:30 - Cobrar preenchimento SGAP', '10:30 - Reunião Matinal / Ranking', '14:00 - Auditoria de CRM / Funil', '17:00 - Feedback Imediato' ].map(li => (<li key={li} className="flex items-center gap-mx-xs"><div className="w-mx-xs h-mx-xs rounded-mx-full bg-brand-secondary shrink-0" /> {li}</li>))}
          </ul>
        </div>
        <div className="p-mx-md bg-surface-alt/30 rounded-mx-xl border border-border-default relative">
          <Badge className="absolute -top-mx-tiny left-mx-md font-bold text-mx-micro bg-brand-primary text-white border-none px-mx-sm py-0.5 shadow-sm">VENDEDOR</Badge>
          <ul className="space-y-mx-md text-sm font-medium text-text-secondary mt-2">
            {[ 'Registro Leads Porta/Online', 'Agendamentos Carteira', 'Atendimento e Prospecção', 'Lançamento Vendas Ontem' ].map(li => (<li key={li} className="flex items-center gap-mx-xs"><div className="w-mx-xs h-mx-xs rounded-mx-full bg-brand-primary shrink-0" /> {li}</li>))}
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
  const [funnel, setFunnel] = useState({ leads: 0, agd: 0, visit: 0, sale: 0 })

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
        leads_week: funnel.leads,
        agd_week: funnel.agd,
        visit_week: funnel.visit,
        vnd_week: funnel.sale,
        tx_lead_agd: funnel.leads > 0 ? (funnel.agd / funnel.leads) * 100 : 0,
        tx_agd_visita: funnel.agd > 0 ? (funnel.visit / funnel.agd) * 100 : 0,
        tx_visita_vnd: funnel.visit > 0 ? (funnel.sale / funnel.visit) * 100 : 0
      })
      const sn = sellers.find(s => s.id === v)?.name || 'Vnd'
      onGenerateSummary(`--- AUDITORIA DE FUNIL: ${sn} ---\nLeads: ${funnel.leads} | Agd: ${funnel.agd} | Visitas: ${funnel.visit} | Vendas: ${funnel.sale}\nPositivos: ${p}\nAção: ${a}\nMeta: ${m}`)
      toast.success('Feedback e Funil salvos no sistema')
      setV(''); setP(''); setA(''); setM(0); setFunnel({ leads: 0, agd: 0, visit: 0, sale: 0 })
    } finally { setS(false) }
  }

  return (
    <Card className="p-mx-lg shadow-mx-md border border-border-default bg-white rounded-mx-2xl">
      <div className="flex items-center gap-mx-sm mb-mx-md">
        <div className="p-mx-xs bg-brand-primary/10 rounded-mx-lg text-brand-primary"><TrendingUp size={20} /></div>
        <Typography variant="h3" className="text-lg">Visita 4: Ritual de Feedback e Funil</Typography>
      </div>
      
      <div className="space-y-mx-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
          <div className="space-y-mx-md">
            <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Dados do Vendedor</Typography>
            <select value={v} onChange={e => setV(e.target.value)} className="w-full h-mx-10 px-mx-md rounded-mx-lg border border-border-default bg-white text-sm font-bold">
              <option value="">Selecione o vendedor...</option>
              {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            
            <div className="grid grid-cols-2 gap-mx-sm">
              <div className="space-y-mx-xs">
                <Typography variant="tiny" tone="muted">LEADS</Typography>
                <Input type="number" value={funnel.leads} onChange={e => setFunnel({...funnel, leads: parseInt(e.target.value) || 0})} className="h-mx-10 font-bold" />
              </div>
              <div className="space-y-mx-xs">
                <Typography variant="tiny" tone="muted">AGEND.</Typography>
                <Input type="number" value={funnel.agd} onChange={e => setFunnel({...funnel, agd: parseInt(e.target.value) || 0})} className="h-mx-10 font-bold" />
              </div>
              <div className="space-y-mx-xs">
                <Typography variant="tiny" tone="muted">VISITAS</Typography>
                <Input type="number" value={funnel.visit} onChange={e => setFunnel({...funnel, visit: parseInt(e.target.value) || 0})} className="h-mx-10 font-bold" />
              </div>
              <div className="space-y-mx-xs">
                <Typography variant="tiny" tone="muted">VENDAS</Typography>
                <Input type="number" value={funnel.sale} onChange={e => setFunnel({...funnel, sale: parseInt(e.target.value) || 0})} className="h-mx-10 font-bold" />
              </div>
            </div>
          </div>

          <div className="space-y-mx-md">
             <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Acordos de Melhoria</Typography>
             <Textarea value={p} onChange={e => setP(e.target.value)} className="min-h-mx-20 text-sm" placeholder="Pontos Fortes observados..." />
             <Textarea value={a} onChange={e => setA(e.target.value)} className="min-h-mx-20 text-sm" placeholder="Ação de correção (O que vai mudar?)" />
          </div>
        </div>

        <div className="flex gap-mx-md items-end border-t border-border-subtle pt-mx-md">
          <div className="w-1/3 md:w-1/4">
            <Typography variant="tiny" tone="muted" className="mb-1 block uppercase text-mx-tiny">META ACORDADA</Typography>
            <Input type="number" value={m} onChange={e => setM(parseInt(e.target.value) || 0)} className="h-mx-12 font-black text-brand-primary text-center text-xl" />
          </div>
          <Button className="flex-1 h-mx-12 shadow-mx-md text-sm font-black" variant="primary" onClick={save} loading={s} icon={<CheckCircle2 size={16} />}>SALVAR FEEDBACK NO CRM</Button>
        </div>
      </div>
    </Card>
  ) 
}

export function VisitFiveExecution({ onGenerateSummary }: { onGenerateSummary: (t: string) => void }) {
  const [topic, setTopic] = useState('')
  const [participants, setParticipants] = useState('')
  const [observations, setObservations] = useState('')

  const handleSave = () => {
    if (!topic || !participants) return toast.error('Preencha os campos obrigatórios')
    onGenerateSummary(`--- TREINAMENTO DE VENDAS ---\nTema: ${topic}\nParticipantes: ${participants}\nObservações: ${observations}`)
    toast.success('Treinamento registrado!')
    setTopic(''); setParticipants(''); setObservations('')
  }

  return (
    <Card className="p-mx-lg shadow-mx-md border border-border-default bg-white rounded-mx-2xl">
      <div className="flex items-center gap-mx-sm mb-mx-md">
        <div className="p-mx-xs bg-brand-primary/10 rounded-mx-lg text-brand-primary"><Presentation size={20} /></div>
        <Typography variant="h3" className="text-lg">Visita 5: Treinamento de Técnicas de Vendas</Typography>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
        <div className="space-y-mx-md">
          <div className="space-y-mx-xs">
            <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Tema do Treinamento</Typography>
            <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex: Contorno de Objeções, Fechamento..." className="h-mx-10" />
          </div>
          <div className="space-y-mx-xs">
            <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Participantes (Nomes)</Typography>
            <Textarea value={participants} onChange={e => setParticipants(e.target.value)} placeholder="Quem participou?" className="min-h-mx-20" />
          </div>
        </div>
        <div className="space-y-mx-md">
          <div className="space-y-mx-xs">
            <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Parecer do Consultor</Typography>
            <Textarea value={observations} onChange={e => setObservations(e.target.value)} placeholder="Como foi o engajamento? Algum destaque?" className="min-h-mx-40" />
          </div>
        </div>
      </div>
      <Button className="w-full mt-mx-md h-mx-12 font-black" variant="primary" onClick={handleSave} icon={<Presentation size={16} />}>REGISTRAR REALIZAÇÃO DO TREINAMENTO</Button>
    </Card>
  )
}

export function VisitSixExecution({ clientId, clientSlug, onGenerateSummary }: { clientId: string, clientSlug: string, onGenerateSummary: (t: string) => void }) {
  const [metrics, setMetrics] = useState({ current_sales: 0, projection: 0, new_goal: 0 })
  const [rationale, setRationale] = useState('')

  const handleSave = () => {
    onGenerateSummary(`--- REVISÃO DE METAS ---\nVendas Hoje: ${metrics.current_sales}\nProjeção: ${metrics.projection}\nNova Meta: ${metrics.new_goal}\nJustificativa: ${rationale}`)
    toast.success('Revisão de metas registrada!')
    setMetrics({ current_sales: 0, projection: 0, new_goal: 0 }); setRationale('')
  }

  return (
    <Card className="p-mx-lg shadow-mx-md border border-border-default bg-white rounded-mx-2xl">
      <div className="flex items-center gap-mx-sm mb-mx-md">
        <div className="p-mx-xs bg-brand-primary/10 rounded-mx-lg text-brand-primary"><BarChart size={20} /></div>
        <Typography variant="h3" className="text-lg">Visita 6: Revisão de Metas e Alinhamento</Typography>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-md mb-mx-md">
        <div className="space-y-mx-xs">
          <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Vendas Realizadas</Typography>
          <Input type="number" value={metrics.current_sales} onChange={e => setMetrics({...metrics, current_sales: parseInt(e.target.value) || 0})} className="h-mx-10 font-bold" />
        </div>
        <div className="space-y-mx-xs">
          <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Projeção Final</Typography>
          <Input type="number" value={metrics.projection} onChange={e => setMetrics({...metrics, projection: parseInt(e.target.value) || 0})} className="h-mx-10 font-bold" />
        </div>
        <div className="space-y-mx-xs">
          <Typography variant="tiny" className="font-bold text-brand-primary uppercase">Ajuste de Meta (Nova)</Typography>
          <Input type="number" value={metrics.new_goal} onChange={e => setMetrics({...metrics, new_goal: parseInt(e.target.value) || 0})} className="h-mx-10 font-black text-brand-primary border-brand-primary/30" />
        </div>
      </div>
      <div className="space-y-mx-xs mb-mx-md">
        <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Justificativa e Plano de Ataque</Typography>
        <Textarea value={rationale} onChange={e => setRationale(e.target.value)} placeholder="O que faremos para bater a nova meta?" className="min-h-mx-20" />
      </div>
      <Button className="w-full h-mx-12 font-black" variant="primary" onClick={handleSave} icon={<Target size={16} />}>SALVAR REVISÃO E AJUSTAR CRM</Button>
    </Card>
  )
}

export function VisitSevenExecution({ storeId, onGenerateSummary }: { storeId: string, onGenerateSummary: (t: string) => void }) { 
  const { sellers } = useTeam(storeId)
  const { createPDI } = usePDIs(storeId)
  const [s, setS] = useState(false); const [v, setV] = useState(''); const [o, setO] = useState('')
  const [audit, setAudit] = useState({ crm: false, prep: false, posvenda: false })

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
      onGenerateSummary(`--- AUDITORIA FINAL E PDI ---\nAudit CRM: ${audit.crm ? 'OK' : 'PENDENTE'}\nAudit Prep: ${audit.prep ? 'OK' : 'PENDENTE'}\nAudit Pós-Venda: ${audit.posvenda ? 'OK' : 'PENDENTE'}\n\nNOVO PDI: ${sn}\nObjetivo: ${o}`)
      toast.success('PDI Criado com sucesso')
      setO('')
    } finally { setS(false) }
  }

  return (
    <Card className="p-mx-lg shadow-mx-md border border-border-default bg-white rounded-mx-2xl">
      <div className="flex items-center gap-mx-sm mb-mx-md">
        <div className="p-mx-xs bg-brand-primary/10 rounded-mx-lg text-brand-primary"><Award size={20} /></div>
        <Typography variant="h3" className="text-lg">Visita 7: Auditoria de Processos e PDI</Typography>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
        <div className="space-y-mx-md">
           <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Checklist de Auditoria Final</Typography>
           <div className="space-y-mx-xs">
             {[
               { k: 'crm', l: 'CRM: Dados Higienizados e Funil Real' },
               { k: 'prep', l: 'PREP: Tempo Médio < 7 dias' },
               { k: 'posvenda', l: 'PÓS-VENDA: Ritual de Satisfação Ativo' }
             ].map(i => (
               <label key={i.k} className="flex items-center gap-mx-sm p-mx-sm bg-surface-alt/30 rounded-mx-xl cursor-pointer hover:bg-surface-alt transition-colors">
                 <input type="checkbox" checked={(audit as any)[i.k]} onChange={e => setAudit({...audit, [i.k]: e.target.checked})} className="w-mx-4 h-mx-4 rounded border-border-default text-brand-primary focus:ring-brand-primary" />
                 <Typography variant="p" className="text-mx-micro font-bold text-text-secondary">{i.l}</Typography>
               </label>
             ))}
           </div>
        </div>

        <div className="space-y-mx-md">
          <Typography variant="tiny" className="font-bold text-text-tertiary uppercase">Novo Plano de Carreira (PDI)</Typography>
          <select value={v} onChange={e => setV(e.target.value)} className="w-full h-mx-10 px-mx-md rounded-mx-lg border border-border-default bg-white text-sm font-bold">
            <option value="">Selecione o vendedor...</option>
            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <Textarea value={o} onChange={e => setO(e.target.value)} className="min-h-mx-20 text-sm" placeholder="Onde este vendedor quer estar em 6 meses?" />
        </div>
      </div>

      <Button className="w-full mt-mx-md h-mx-12 font-black" variant="primary" onClick={save} loading={s} icon={<ShieldCheck size={16} />}>SALVAR AUDITORIA E ASSINAR PDI</Button>
    </Card>
  )
}

export function VisitChecklist({ items, onToggle }: { items: Array<{ task: string, completed: boolean }>, onToggle: (i: number) => void }) {
  const toggle = (i: number) => onToggle(i)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-mx-sm">
      {items.map((it, i) => (
        <div key={i} onClick={() => toggle(i)} className={cn("p-mx-xs rounded-mx-lg border cursor-pointer transition-colors flex items-center gap-mx-xs text-mx-micro font-bold", it.completed ? "bg-brand-primary/5 text-brand-primary border-brand-primary/20" : "bg-white border-border-default text-text-secondary hover:bg-surface-alt/30")}>
          {it.completed ? <CheckCircle2 className="w-mx-4 h-mx-4 shrink-0" /> : <Circle className="w-mx-4 h-mx-4 shrink-0 opacity-20" />}
          <span className="truncate">{it.task}</span>
        </div>
      ))}
    </div>
  )
}

export function VisitEightExecution({ clientId, clientSlug }: { clientId: string, clientSlug: string }) {
  return (
    <Card className="p-mx-lg shadow-sm border border-border-default bg-white rounded-mx-2xl">
      <div className="flex items-center gap-mx-sm mb-mx-md">
        <div className="p-mx-xs bg-brand-primary/10 rounded-mx-lg text-brand-primary"><ShieldCheck size={20} /></div>
        <Typography variant="h3" className="text-lg">Auditoria de Processos</Typography>
      </div>
      <Typography variant="p">Auditoria completa dos processos de CRM, Preparação e Pós-Venda.</Typography>
    </Card>
  )
}

export function VisitNineExecution({ financials, onGenerateSummary }: { financials: any[], onGenerateSummary: (t: string) => void }) {
  return (
    <Card className="p-mx-lg shadow-sm border border-border-default bg-white rounded-mx-2xl">
      <div className="flex items-center gap-mx-sm mb-mx-md">
        <div className="p-mx-xs bg-brand-primary/10 rounded-mx-lg text-brand-primary"><Calculator size={20} /></div>
        <Typography variant="h3" className="text-lg">Análise de DRE e Lucratividade</Typography>
      </div>
      <Typography variant="p" className="mb-mx-md">Revisão final dos indicadores financeiros e lucratividade do período.</Typography>
      <Button variant="outline" onClick={() => onGenerateSummary("Análise de DRE e lucratividade concluída.")}>Registrar Análise</Button>
    </Card>
  )
}
