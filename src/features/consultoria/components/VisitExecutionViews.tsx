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
import { cn } from '@/lib/utils'

export function VisitTwoExecution({ clientId }: { clientId: string }) {
  const { latestPlan } = useConsultingStrategicPlan(clientId)
  return (
    <div className="space-y-6">
      <Card className="p-0 overflow-hidden border border-status-error/30 shadow-sm rounded-3xl">
        <div className="bg-status-error/10 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-3">
            <ShieldAlert className="w-8 h-8 text-status-error" />
            <Typography variant="h3" className="font-black uppercase text-status-error leading-none">Trava Metodológica</Typography>
          </div>
          <Typography variant="p" className="font-medium text-status-error">
            Sem o formulário de ACOMPANHAMENTO DIÁRIO (SGAP) instalado no celular dos vendedores e a rotina validada, o trabalho não avança.
          </Typography>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 md:p-8 space-y-6 border-t-4 border-t-brand-secondary rounded-3xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary"><Zap className="w-5 h-5" /></div>
            <Typography variant="h3">Ferramentas de Gestão</Typography>
          </div>
          <div className="space-y-3">
            <Button className="w-full justify-between h-14 font-bold shadow-sm rounded-xl" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=strategic`, '_blank')}>
              <div className="flex items-center gap-3"><Target className="w-4 h-4 text-brand-secondary" />Planejamento Estratégico</div>
              <ExternalLink className="w-4 h-4 text-text-tertiary" />
            </Button>
            <Button className="w-full justify-between h-14 font-bold shadow-sm border-brand-primary text-brand-primary rounded-xl hover:bg-brand-primary/5" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=daily`, '_blank')}>
              <div className="flex items-center gap-3"><BarChart3 className="w-4 h-4" />Validar SGAP Diário</div>
              <ExternalLink className="w-4 h-4 opacity-50" />
            </Button>
          </div>
        </Card>
        <Card className="p-6 md:p-8 bg-surface-alt/50 flex flex-col items-center justify-center text-center rounded-3xl shadow-sm border border-border-default relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Rocket size={100} /></div>
          {latestPlan ? (
            <div className="space-y-3 animate-in zoom-in duration-500 relative z-10">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-border-default">
                <CheckCircle2 className="w-8 h-8 text-status-success" />
              </div>
              <Typography variant="h3" className="font-black uppercase text-text-primary">P.E. Validado</Typography>
              <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wider">{latestPlan.title}</Typography>
            </div>
          ) : (
            <Typography variant="p" tone="muted" className="font-medium relative z-10">Aguardando registro do P.E. no sistema</Typography>
          )}
        </Card>
      </div>
    </div>
  )
}

export function VisitThreeExecution() {
  return (
    <Card className="p-6 md:p-10 shadow-sm border border-border-default bg-white rounded-3xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full -mr-32 -mt-32" />
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary"><Clock size={24} /></div>
        <div>
          <Typography variant="h3" className="font-black uppercase leading-none">Ritual de Rotinas</Typography>
          <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-widest mt-1 block">Disciplina de Alta Performance</Typography>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 md:p-8 bg-surface-alt/30 rounded-2xl border border-border-default relative">
          <Badge className="absolute -top-3 left-6 font-bold text-[10px] bg-brand-secondary text-white border-none shadow-sm px-4">GERENTE</Badge>
          <ul className="space-y-4 text-sm font-bold text-text-secondary mt-2">
            {[ '09:30 - Cobrar preenchimento SGAP', '10:30 - Reunião Matinal / Ranking', '14:00 - Auditoria de CRM / Funil', '17:00 - Feedback Imediato' ].map(li => (<li key={li} className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-brand-secondary" /> {li}</li>))}
          </ul>
        </div>
        <div className="p-6 md:p-8 bg-surface-alt/30 rounded-2xl border border-border-default relative">
          <Badge className="absolute -top-3 left-6 font-bold text-[10px] bg-brand-primary text-white border-none shadow-sm px-4">VENDEDOR</Badge>
          <ul className="space-y-4 text-sm font-bold text-text-secondary mt-2">
            {[ 'Registro Leads Porta/Online', 'Agendamentos Carteira', 'Atendimento e Prospecção', 'Lançamento Vendas Ontem' ].map(li => (<li key={li} className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> {li}</li>))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

export function VisitFourExecution({ storeId, onGenerateSummary }: { storeId: string, onGenerateSummary: (t: string) => void }) { 
  const { sellers } = useTeam(storeId)
  const { createFeedback } = useFeedbacks(storeId)
  const [s, setS] = useState(false)
  const [v, setV] = useState('')
  const [p, setP] = useState('')
  const [a, setA] = useState('')
  const [m, setM] = useState(0)

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
    <Card className="p-6 md:p-10 shadow-sm border-t-4 border-t-brand-primary bg-white rounded-3xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary"><TrendingUp size={24} /></div>
        <div>
          <Typography variant="h3" className="font-black uppercase leading-none">Feedback Estruturado</Typography>
          <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-widest mt-1 block">Gargalos e Planos Individuais</Typography>
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <Typography variant="tiny" tone="muted" className="uppercase font-bold mb-1.5 tracking-wider block ml-1">Selecione o Vendedor</Typography>
          <Select value={v} onChange={e => setV(e.target.value)} className="h-12 font-bold bg-surface-alt/30 border-border-default focus:bg-white rounded-xl shadow-sm">
            <option value="">Quem está recebendo feedback?</option>
            {sellers.map(s => <option key={s.user_id} value={s.user_id}>{s.users?.name}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Typography variant="tiny" tone="muted" className="uppercase font-bold mb-1.5 tracking-wider block ml-1">Pontos Positivos</Typography>
            <Textarea value={p} onChange={e => setP(e.target.value)} className="bg-white min-h-[120px] border-border-default rounded-xl font-medium text-sm shadow-sm resize-none" placeholder="O que está funcionando bem?" />
          </div>
          <div>
            <Typography variant="tiny" tone="muted" className="uppercase font-bold mb-1.5 tracking-wider block ml-1">Acordo de Ação</Typography>
            <Textarea value={a} onChange={e => setA(e.target.value)} className="bg-white min-h-[120px] border-border-default rounded-xl font-medium text-sm shadow-sm resize-none" placeholder="O que o vendedor prometeu mudar e qual o prazo?" />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-center pt-6 border-t border-border-subtle mt-4">
          <div className="w-full md:w-1/3">
            <Typography variant="tiny" tone="muted" className="uppercase font-bold mb-1.5 tracking-wider block ml-1 text-center md:text-left">Meta Acordada (Carros)</Typography>
            <Input type="number" value={m} onChange={e => setM(parseInt(e.target.value))} className="h-14 font-black text-2xl text-brand-primary text-center border-border-default focus:border-brand-primary rounded-xl shadow-sm" />
          </div>
          <Button className="w-full md:flex-1 h-14 font-bold shadow-md rounded-xl mt-auto" variant="primary" onClick={save} loading={s}>SALVAR FEEDBACK NO SISTEMA</Button>
        </div>
      </div>
    </Card>
  ) 
}

export function VisitSevenExecution({ storeId, onGenerateSummary }: { storeId: string, onGenerateSummary: (t: string) => void }) { 
  const { sellers } = useTeam(storeId)
  const { createPDI } = usePDIs(storeId)
  const [s, setS] = useState(false)
  const [v, setV] = useState('')
  const [o, setO] = useState('')

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
    <Card className="p-6 md:p-10 shadow-sm border border-border-default bg-white rounded-3xl relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-secondary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-brand-secondary/10 rounded-xl text-brand-secondary"><Award size={24} /></div>
        <div>
          <Typography variant="h3" className="font-black uppercase leading-none text-brand-secondary">Sessão PDI Digital</Typography>
          <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-widest mt-1 block">Plano de Desenvolvimento Individual</Typography>
        </div>
      </div>
      <div className="space-y-6 relative z-10">
        <div>
          <Typography variant="tiny" tone="muted" className="uppercase font-bold mb-1.5 tracking-wider block ml-1">Participante da Sessão</Typography>
          <Select value={v} onChange={e => setV(e.target.value)} className="h-12 font-bold bg-surface-alt/30 border-border-default focus:bg-white rounded-xl shadow-sm">
            <option value="">Selecione o vendedor...</option>
            {sellers.map(s => <option key={s.user_id} value={s.user_id}>{s.users?.name}</option>)}
          </Select>
        </div>
        <div>
          <Typography variant="tiny" tone="muted" className="uppercase font-bold mb-1.5 tracking-wider block ml-1">Objetivo de Vida / Carreira (Dream List)</Typography>
          <Textarea value={o} onChange={e => setO(e.target.value)} className="min-h-[160px] bg-white text-sm font-medium border-border-default rounded-xl p-4 shadow-sm resize-none" placeholder="Onde o vendedor quer chegar nos próximos 6 meses?" />
        </div>
        <Button className="w-full h-14 font-bold bg-brand-secondary hover:bg-brand-secondary/90 text-white shadow-md rounded-xl" onClick={save} loading={s}>SALVAR E ASSINAR PDI</Button>
      </div>
    </Card>
  ) 
}

export function VisitNineExecution({ financials, onGenerateSummary }: { financials: any[], onGenerateSummary: (t: string) => void }) { 
  const latest = financials[0] || {}; const roi = latest.roi || 0; 
  return (
    <Card className="p-10 md:p-16 bg-[#1e293b] text-white shadow-xl border border-slate-700 rounded-[40px] text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <Typography variant="h2" tone="white" className="font-black uppercase tracking-tight mb-10 relative z-10">Fechamento Trimestral</Typography>
      <div className="flex flex-col items-center mb-16 relative z-10">
        <Typography variant="h1" tone="white" className="text-7xl md:text-9xl font-black leading-none drop-shadow-md">{roi}x</Typography>
        <Typography variant="tiny" tone="white" className="opacity-60 uppercase font-bold tracking-widest mt-4">ROI LÍQUIDO DO PROJETO</Typography>
        <Badge className="mt-6 px-6 py-2 bg-brand-primary text-white font-bold border-none rounded-full shadow-sm">VERIFICADO PELO SISTEMA</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        <Button className="h-14 font-bold shadow-md rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white" onClick={() => onGenerateSummary(`--- FECHAMENTO TRIMESTRAL ---\nROI COMPROVADO: ${roi}x\nResultado: Apresentação para escala.`)}>ANEXAR AO REPORTE</Button>
        <Button className="h-14 border border-white/20 font-bold bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"><Rocket size={18} className="mr-2" /> Pitch de Renovação</Button>
      </div>
    </Card>
  ) 
}

export function VisitFiveExecution({ onGenerateSummary }: { onGenerateSummary: (t: string) => void }) { 
  const [l, setL] = useState(''); const [a, setA] = useState(''); const conv = l && a ? ((parseInt(a)/parseInt(l))*100).toFixed(1) : '0'; 
  const [checks, setCheck] = useState([ { label: 'Instagram: Frequência Diária', done: false }, { label: 'Qualidade das Fotos no Pátio', done: false }, { label: 'Investimento em Branding Mensal', done: false }, { label: 'Distribuição Inteligente de Leads', done: false } ])
  const toggle = (i:number) => { const n = [...checks]; n[i].done = !n[i].done; setCheck(n) }
  return (
    <Card className="p-6 md:p-10 shadow-sm border border-border-default bg-white rounded-3xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary"><Calculator size={24} /></div>
        <div>
          <Typography variant="h3" className="font-black uppercase leading-none">Motor de Conversão</Typography>
          <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-widest mt-1 block">Auditoria de Marketing</Typography>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
               <Typography variant="tiny" tone="muted" className="uppercase font-bold mb-1.5 tracking-wider block ml-1">Leads (Mês)</Typography>
               <Input type="number" value={l} onChange={e => setL(e.target.value)} className="h-12 text-lg font-black border-border-default focus:border-brand-primary rounded-xl shadow-sm" />
            </div>
            <div>
               <Typography variant="tiny" tone="muted" className="uppercase font-bold mb-1.5 tracking-wider block ml-1">Agendamentos</Typography>
               <Input type="number" value={a} onChange={e => setA(e.target.value)} className="h-12 text-lg font-black border-border-default focus:border-brand-primary rounded-xl shadow-sm" />
            </div>
          </div>
          <div className="bg-surface-alt/30 rounded-2xl h-32 flex flex-col items-center justify-center border border-border-subtle">
            <Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-widest mb-1 text-[10px]">Taxa de Conversão Real</Typography>
            <Typography variant="h2" className="font-black text-brand-primary leading-none">{conv}%</Typography>
          </div>
        </div>
        <div className="space-y-3">
          <Typography variant="tiny" tone="muted" className="font-bold uppercase mb-3 block tracking-widest ml-1">Checklist de Ativos MKT</Typography>
          {checks.map((it, i) => (
            <div key={i} onClick={() => toggle(i)} className={cn("p-3 rounded-xl border cursor-pointer transition-colors flex items-center gap-3 text-sm font-bold", it.done ? "bg-brand-primary/5 text-brand-primary border-brand-primary/20" : "bg-white border-border-default text-text-secondary hover:bg-surface-alt/50")}>
               {it.done ? <CheckCircle2 size={18} className="shrink-0" /> : <Circle size={18} className="opacity-30 shrink-0" />} {it.label}
            </div>
          ))}
        </div>
      </div>
      <Button className="w-full h-14 font-bold mt-8 border border-brand-primary text-brand-primary shadow-sm hover:bg-brand-primary/5 rounded-xl" variant="outline" onClick={() => onGenerateSummary(`--- AUDITORIA MKT ---\nConversão: ${conv}%\nStatus: ${checks.filter(c => c.done).length}/${checks.length} Ativos validados.`)}>ANEXAR AO REPORTE CRM</Button>
    </Card>
  ) 
}

export function VisitSixExecution({ clientId, onGenerateSummary }: { clientId: string, onGenerateSummary: (t: string) => void }) { 
  return (
    <Card className="p-6 md:p-10 shadow-sm border border-border-default bg-white rounded-3xl relative overflow-hidden">
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-brand-secondary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-brand-secondary/10 rounded-xl text-brand-secondary"><ShieldCheck size={24} /></div>
        <Typography variant="h3" className="font-black uppercase text-text-primary leading-none">Processos Críticos</Typography>
      </div>
      <div className="p-6 bg-status-warning/10 rounded-2xl border border-status-warning/20 mb-8">
        <Typography variant="tiny" tone="warning" className="font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><AlertCircle size={14} /> Foco de Intervenção</Typography>
        <Typography variant="p" className="text-status-warning font-medium text-sm leading-relaxed">
          Nesta etapa, você deve mapear os gargalos da Oficina (SLA de preparação), o comissionamento do Financiamento (F&I) e o escoamento urgente de veículos parados há mais de 90 dias no estoque.
        </Typography>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        <Button className="h-12 font-bold shadow-sm rounded-xl" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=action_plan`, '_blank')}>ABRIR PLANO DE AÇÃO</Button>
        <Button className="h-12 font-bold shadow-md rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 text-white" onClick={() => onGenerateSummary(`--- AUDITORIA DE PROCESSOS ---\nIntervenção validada em: Oficina, F&I e Estoque Antigo.\nO Plano de Ação foi atualizado.`)}>REGISTRAR INTERVENÇÃO</Button>
      </div>
    </Card>
  ) 
}

export function VisitEightExecution({ clientId }: { clientId: string }) { 
  return (
    <Card className="p-6 md:p-10 shadow-sm border border-border-default bg-white rounded-3xl group hover:border-brand-primary/30 transition-colors">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary group-hover:scale-110 transition-transform"><BarChart3 size={24} /></div>
        <Typography variant="h3" className="font-black uppercase leading-none">Ranking de Performance</Typography>
      </div>
      <Typography variant="p" className="mb-8 font-medium text-text-secondary text-sm">
        Confronte o relatório de uso da plataforma educacional MX com os dados de fechamento no salão de vendas. O método comprova: "Quem não treina, não performa."
      </Typography>
      <Button className="w-full h-14 font-bold shadow-sm border border-brand-primary/30 text-brand-primary rounded-xl hover:bg-brand-primary/5 transition-colors" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=daily`, '_blank')}>
        ACESSAR RANKING E AUDITORIA
      </Button>
    </Card>
  ) 
}
