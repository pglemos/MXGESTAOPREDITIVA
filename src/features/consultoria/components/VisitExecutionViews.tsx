import React, { useState } from 'react'
import { 
  CheckCircle2, Circle, Zap, Target, ExternalLink, BarChart3, 
  Clock, TrendingUp, Award, Rocket, ShieldCheck, AlertCircle,
  ShieldAlert, Calculator, MousePointer2
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

export function VisitTwoExecution({ clientId }: { clientId: string }) {
  const { latestPlan } = useConsultingStrategicPlan(clientId)
  return (
    <div className="space-y-6">
      <Card className="p-6 border border-status-error/30 bg-status-error/5 shadow-sm rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <ShieldAlert className="w-6 h-6 text-status-error" />
          <Typography variant="h3" className="text-status-error">Trava Metodológica</Typography>
        </div>
        <Typography variant="p" className="text-status-error text-sm">
          Sem o formulário de ACOMPANHAMENTO DIÁRIO (SGAP) instalado no celular dos vendedores e a rotina validada, o trabalho não avança.
        </Typography>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border border-border-default shadow-sm rounded-2xl flex flex-col justify-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary"><Zap className="w-5 h-5" /></div>
            <Typography variant="h3">Ferramentas de Gestão</Typography>
          </div>
          <Button className="w-full justify-between h-12 shadow-sm font-bold bg-white" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=strategic`, '_blank')}>
            <div className="flex items-center gap-3"><Target className="w-4 h-4 text-text-tertiary" />Planejamento Estratégico</div>
            <ExternalLink className="w-4 h-4 text-text-tertiary" />
          </Button>
          <Button className="w-full justify-between h-12 shadow-sm font-bold border-brand-primary text-brand-primary bg-white" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=daily`, '_blank')}>
            <div className="flex items-center gap-3"><BarChart3 className="w-4 h-4" />Validar SGAP Diário</div>
            <ExternalLink className="w-4 h-4 opacity-50" />
          </Button>
        </Card>

        <Card className="p-6 bg-surface-alt/30 border border-border-default shadow-sm rounded-2xl flex flex-col items-center justify-center text-center">
          {latestPlan ? (
            <div className="space-y-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-border-default">
                <CheckCircle2 className="w-6 h-6 text-status-success" />
              </div>
              <Typography variant="h3" className="text-text-primary">P.E. Validado</Typography>
              <Typography variant="p" className="text-xs text-text-tertiary">{latestPlan.title}</Typography>
            </div>
          ) : (
            <div className="space-y-2 opacity-50">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto border border-border-default">
                <Rocket className="w-6 h-6 text-text-tertiary" />
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
    <Card className="p-6 shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary"><Clock size={20} /></div>
        <Typography variant="h3" className="text-lg">Ritual de Rotinas (Disciplina)</Typography>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-surface-alt/30 rounded-xl border border-border-default relative">
          <Badge className="absolute -top-3 left-4 font-bold text-[9px] bg-brand-secondary text-white border-none px-3 py-0.5 shadow-sm">GERENTE</Badge>
          <ul className="space-y-3 text-sm font-medium text-text-secondary mt-2">
            {[ '09:30 - Cobrar preenchimento SGAP', '10:30 - Reunião Matinal / Ranking', '14:00 - Auditoria de CRM / Funil', '17:00 - Feedback Imediato' ].map(li => (<li key={li} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-secondary shrink-0" /> {li}</li>))}
          </ul>
        </div>
        <div className="p-5 bg-surface-alt/30 rounded-xl border border-border-default relative">
          <Badge className="absolute -top-3 left-4 font-bold text-[9px] bg-brand-primary text-white border-none px-3 py-0.5 shadow-sm">VENDEDOR</Badge>
          <ul className="space-y-3 text-sm font-medium text-text-secondary mt-2">
            {[ 'Registro Leads Porta/Online', 'Agendamentos Carteira', 'Atendimento e Prospecção', 'Lançamento Vendas Ontem' ].map(li => (<li key={li} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" /> {li}</li>))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

export function VisitFourExecution({ storeId, onGenerateSummary }: { storeId: string, onGenerateSummary: (t: string) => void }) { 
  const { sellers } = useTeam(storeId)
  const { createFeedback } = useFeedbacks(storeId)
  const [s, setS] = useState(false); const [v, setV] = useState(''); const [p, setP] = useState(''); const [a, setA] = useState(''); const [m, setM] = useState(0)

  const save = async () => {
    if (!v) return toast.error('Vendedor obrigatório')
    setS(true)
    try {
      await createFeedback({ seller_id: v, positives: p, attention_points: '...', action: a, meta_compromisso: m, store_id: storeId, week_reference: new Date().toISOString() })
      const sn = sellers.find(s => s.user_id === v)?.users?.name || 'Vnd'
      onGenerateSummary(`--- FEEDBACK: ${sn} ---\nPositivos: ${p}\nAção: ${a}\nMeta: ${m}`)
      toast.success('Feedback salvo no sistema')
      setP(''); setA('')
    } finally { setS(false) }
  }

  return (
    <Card className="p-6 shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary"><TrendingUp size={20} /></div>
        <Typography variant="h3" className="text-lg">Feedback Estruturado</Typography>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Vendedor</label>
          <Select value={v} onChange={e => setV(e.target.value)} className="h-10 bg-white border-border-default shadow-sm text-sm">
            <option value="">Selecione o vendedor...</option>
            {sellers.map(s => <option key={s.user_id} value={s.user_id}>{s.users?.name}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Pontos Positivos</label>
            <Textarea value={p} onChange={e => setP(e.target.value)} className="bg-white min-h-[100px] border-border-default rounded-xl font-medium text-sm shadow-sm resize-none" placeholder="O que está funcionando bem?" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Acordo de Ação</label>
            <Textarea value={a} onChange={e => setA(e.target.value)} className="bg-white min-h-[100px] border-border-default rounded-xl font-medium text-sm shadow-sm resize-none" placeholder="O que o vendedor prometeu mudar?" />
          </div>
        </div>
        <div className="flex gap-4 items-end pt-2">
          <div className="w-1/3 md:w-1/4">
            <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Meta Acordada</label>
            <Input type="number" value={m} onChange={e => setM(parseInt(e.target.value))} className="h-10 font-bold text-brand-primary text-center border-border-default rounded-lg shadow-sm" />
          </div>
          <Button className="flex-1 h-10 shadow-sm text-sm" variant="primary" onClick={save} loading={s}>Salvar Feedback</Button>
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
    if (!v) return toast.error('Vendedor obrigatório')
    setS(true)
    try {
      await createPDI({ seller_id: v, objective: o, store_id: storeId, status: 'aberto' })
      const sn = sellers.find(s => s.user_id === v)?.users?.name || 'Vnd'
      onGenerateSummary(`--- PDI IMPLEMENTADO ---\nVendedor: ${sn}\nObjetivo: ${o}`)
      toast.success('PDI Salvo no sistema')
      setO('')
    } finally { setS(false) }
  }

  return (
    <Card className="p-6 shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-secondary/10 rounded-lg text-brand-secondary"><Award size={20} /></div>
        <Typography variant="h3" className="text-lg text-brand-secondary">Sessão PDI Digital</Typography>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Participante da Sessão</label>
          <Select value={v} onChange={e => setV(e.target.value)} className="h-10 bg-white border-border-default shadow-sm text-sm">
            <option value="">Selecione o vendedor...</option>
            {sellers.map(s => <option key={s.user_id} value={s.user_id}>{s.users?.name}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Objetivo de Vida / Carreira (Dream List)</label>
          <Textarea value={o} onChange={e => setO(e.target.value)} className="min-h-[120px] bg-white text-sm font-medium border-border-default rounded-xl shadow-sm resize-none" placeholder="Onde o vendedor quer chegar nos próximos 6 meses?" />
        </div>
        <Button className="w-full sm:w-auto h-10 shadow-sm" variant="primary" onClick={save} loading={s}>Salvar e Assinar PDI</Button>
      </div>
    </Card>
  ) 
}

export function VisitNineExecution({ financials, onGenerateSummary }: { financials: any[], onGenerateSummary: (t: string) => void }) { 
  const latest = financials[0] || {}; const roi = latest.roi || 0; 
  return (
    <Card className="p-8 bg-surface-alt/30 border border-border-default shadow-sm rounded-2xl text-center flex flex-col items-center justify-center">
      <div className="p-3 bg-brand-primary/10 rounded-xl mb-4"><TrendingUp className="w-6 h-6 text-brand-primary" /></div>
      <Typography variant="h3" className="mb-6 text-text-primary">Fechamento Trimestral (ROI)</Typography>
      <Typography variant="h1" className="text-6xl font-black text-brand-primary mb-2 leading-none">{roi}x</Typography>
      <Badge variant="outline" className="mb-8 border-border-subtle bg-white text-[10px]">ROI VERIFICADO NO SISTEMA</Badge>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mx-auto">
        <Button className="flex-1 shadow-sm h-11 text-sm font-bold" variant="primary" onClick={() => onGenerateSummary(`--- FECHAMENTO TRIMESTRAL ---\nROI COMPROVADO: ${roi}x\nResultado: Apresentação para escala.`)}>ANEXAR REPORTE</Button>
        <Button className="flex-1 shadow-sm h-11 text-sm font-bold bg-white" variant="outline"><Rocket size={14} className="mr-2" /> Pitch Renovação</Button>
      </div>
    </Card>
  ) 
}

export function VisitFiveExecution({ onGenerateSummary }: { onGenerateSummary: (t: string) => void }) { 
  const [l, setL] = useState(''); const [a, setA] = useState(''); const conv = l && a ? ((parseInt(a)/parseInt(l))*100).toFixed(1) : '0'; 
  const [checks, setCheck] = useState([ { label: 'Instagram Frequência Diária', done: false }, { label: 'Qualidade de Fotos no Pátio', done: false }, { label: 'Investimento em Branding Mensal', done: false }, { label: 'Distribuição Inteligente de Leads', done: false } ])
  const toggle = (i:number) => { const n = [...checks]; n[i].done = !n[i].done; setCheck(n) }
  return (
    <Card className="p-6 shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary"><Calculator size={20} /></div>
        <Typography variant="h3" className="text-lg">Motor de Conversão (Auditoria MKT)</Typography>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
               <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Leads (Mês)</label>
               <Input type="number" value={l} onChange={e => setL(e.target.value)} className="h-10 bg-white shadow-sm" />
            </div>
            <div className="flex-1">
               <label className="text-[10px] font-bold text-text-tertiary uppercase mb-1 block ml-1">Agendamentos</label>
               <Input type="number" value={a} onChange={e => setA(e.target.value)} className="h-10 bg-white shadow-sm" />
            </div>
          </div>
          <div className="bg-surface-alt/30 rounded-xl py-4 flex flex-col items-center justify-center border border-border-subtle">
            <Typography variant="tiny" tone="muted" className="text-[9px] mb-1">TAXA DE CONVERSÃO REAL</Typography>
            <Typography variant="h2" className="text-brand-primary">{conv}%</Typography>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-tertiary uppercase mb-2 block ml-1">Checklist Ativos MKT</label>
          {checks.map((it, i) => (
            <div key={i} onClick={() => toggle(i)} className={cn("p-2 rounded-lg border cursor-pointer transition-colors flex items-center gap-2 text-xs font-bold", it.done ? "bg-brand-primary/5 text-brand-primary border-brand-primary/20" : "bg-white border-border-default text-text-secondary hover:bg-surface-alt/30")}>
               {it.done ? <CheckCircle2 size={14} className="shrink-0" /> : <Circle size={14} className="opacity-30 shrink-0" />} {it.label}
            </div>
          ))}
        </div>
      </div>
      <Button className="w-full mt-6 h-10 text-sm shadow-sm" variant="outline" onClick={() => onGenerateSummary(`--- AUDITORIA MKT ---\nConversão: ${conv}%\nStatus: ${checks.filter(c => c.done).length}/${checks.length} Ativos validados.`)}>Anexar ao Reporte</Button>
    </Card>
  ) 
}

export function VisitSixExecution({ clientId, onGenerateSummary }: { clientId: string, onGenerateSummary: (t: string) => void }) { 
  return (
    <Card className="p-6 shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-secondary/10 rounded-lg text-brand-secondary"><ShieldCheck size={20} /></div>
        <Typography variant="h3" className="text-lg">Processos Críticos</Typography>
      </div>
      <div className="p-4 bg-status-warning/10 rounded-xl border border-status-warning/20 mb-6">
        <Typography variant="tiny" tone="warning" className="font-bold flex items-center gap-2 mb-1"><AlertCircle size={12} /> FOCO DE INTERVENÇÃO</Typography>
        <Typography variant="p" className="text-status-warning text-xs">Mapeie gargalos da Oficina (SLA), Financiamento (Margem) e escoamento urgente de veículos +90 dias.</Typography>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="flex-1 h-10 shadow-sm bg-white text-sm" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=action_plan`, '_blank')}>Plano de Ação</Button>
        <Button className="flex-1 h-10 shadow-sm text-sm" variant="primary" onClick={() => onGenerateSummary(`--- AUDITORIA DE PROCESSOS ---\nIntervenção validada em: Oficina, F&I e Estoque Antigo.\nO Plano de Ação foi atualizado.`)}>Registrar Intervenção</Button>
      </div>
    </Card>
  ) 
}

export function VisitEightExecution({ clientId }: { clientId: string }) { 
  return (
    <Card className="p-6 shadow-sm border border-border-default bg-white rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary"><BarChart3 size={20} /></div>
        <Typography variant="h3" className="text-lg">Ranking de Performance</Typography>
      </div>
      <Typography variant="p" className="mb-6 text-sm text-text-secondary">
        Confronte o relatório de uso da plataforma educacional com os dados de fechamento no salão de vendas.
      </Typography>
      <Button className="w-full h-10 shadow-sm text-sm bg-white" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=daily`, '_blank')}>
        Acessar Ranking e Auditoria
      </Button>
    </Card>
  ) 
}
