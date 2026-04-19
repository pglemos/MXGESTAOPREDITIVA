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
      <Card className="p-0 overflow-hidden border-mx-error border-4 shadow-mx-2xl">
        <div className="bg-mx-error p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-10 h-10" />
            <Typography variant="h2" tone="white" className="font-black uppercase italic leading-none">🚨 TRAVA METODOLÓGICA</Typography>
          </div>
          <Typography variant="body" tone="white" className="font-black text-xl leading-relaxed">
            Sem o formulário de ACOMPANHAMENTO DIÁRIO (SGAP) instalado no celular dos vendedores e a rotina validada, o trabalho não avança.
          </Typography>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 space-y-6 shadow-mx-lg border-t-[12px] border-brand-secondary">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-brand-primary" />
            <Typography variant="h3" className="font-black uppercase italic">Ferramentas</Typography>
          </div>
          <div className="space-y-4">
            <Button className="w-full justify-between h-20 text-lg font-black shadow-xl" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=strategic`, '_blank')}>
              <div className="flex items-center gap-4"><Target className="w-8 h-8 text-brand-secondary" />PLANEJAMENTO ESTRATÉGICO</div>
              <ExternalLink className="w-6 h-6" />
            </Button>
            <Button className="w-full justify-between h-20 text-lg font-black shadow-xl border-brand-primary text-brand-primary" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=daily`, '_blank')}>
              <div className="flex items-center gap-4"><BarChart3 className="w-8 h-8" />VALIDAR SGAP DIÁRIO</div>
              <ExternalLink className="w-6 h-6" />
            </Button>
          </div>
        </Card>
        <Card className="p-8 bg-brand-secondary text-white flex flex-col items-center justify-center text-center relative overflow-hidden shadow-mx-lg border-t-[12px] border-brand-primary">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Rocket size={150} /></div>
          {latestPlan ? (
            <div className="space-y-4 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto border-4 border-brand-primary shadow-xl">
                <CheckCircle2 className="w-10 h-10 text-brand-primary" />
              </div>
              <Typography variant="h2" tone="white" className="font-black uppercase tracking-widest leading-none">P.E. VALIDADO</Typography>
              <Typography variant="body" tone="white" className="opacity-60 font-black uppercase italic text-xs">{latestPlan.title}</Typography>
            </div>
          ) : (
            <Typography variant="body" tone="white" className="font-black opacity-40 uppercase tracking-widest">Aguardando registro do P.E. no sistema</Typography>
          )}
        </Card>
      </div>
    </div>
  )
}

export function VisitThreeExecution() {
  return (
    <Card className="p-12 shadow-mx-2xl border-4 border-mx-border bg-white rounded-[48px] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 rounded-full -mr-40 -mt-40" />
      <div className="flex items-center gap-5 mb-12">
        <div className="p-5 bg-brand-primary/10 rounded-3xl text-brand-primary shadow-inner"><Clock size={40} /></div>
        <div>
          <Typography variant="h1" className="font-black italic uppercase leading-none tracking-tighter">Ritual de Rotinas</Typography>
          <Typography variant="body" className="font-black opacity-30 uppercase tracking-[6px] text-xs">Disciplina de Alta Performance</Typography>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="p-12 bg-mx-bg-secondary rounded-[48px] border-2 border-brand-secondary/10 shadow-lg relative">
          <div className="absolute -top-6 left-12 shadow-xl">
            <Badge className="px-10 py-3 font-black text-sm uppercase bg-brand-secondary text-white border-none">GERENTE</Badge>
          </div>
          <ul className="space-y-6 font-black text-lg text-brand-secondary mt-4">
            {[ '09:30 - Cobrar preenchimento SGAP', '10:30 - Reunião Matinal / Ranking', '14:00 - Auditoria de CRM / Funil', '17:00 - Feedback Imediato' ].map(li => (<li key={li} className="flex items-center gap-3 text-sm">🎯 {li}</li>))}
          </ul>
        </div>
        <div className="p-12 bg-mx-bg-secondary rounded-[48px] border-2 border-brand-primary/10 shadow-lg relative">
          <div className="absolute -top-6 left-12 shadow-xl">
            <Badge className="px-10 py-3 font-black text-sm uppercase bg-brand-primary text-white border-none">VENDEDOR</Badge>
          </div>
          <ul className="space-y-6 font-black text-lg text-brand-primary mt-4">
            {[ 'Registro Leads Porta/Online', 'Agendamentos Carteira', 'Atendimento e Prospecção', 'Lançamento Vendas Ontem' ].map(li => (<li key={li} className="flex items-center gap-3 text-sm">🚀 {li}</li>))}
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
    if (!v) return toast.error('Vendedor?')
    setS(true)
    try {
      await createFeedback({ seller_id: v, positives: p, attention_points: '...', action: a, meta_compromisso: m, store_id: storeId, week_reference: new Date().toISOString() })
      const sn = sellers.find(s => s.user_id === v)?.users?.name || 'Vnd'
      onGenerateSummary(`--- FEEDBACK: ${sn} ---\nPositivos: ${p}\nAção: ${a}\nMeta: ${m}`)
      toast.success('Feedback Salvo!')
      setP(''); setA('')
    } finally { setS(false) }
  }

  return (
    <Card className="p-12 shadow-mx-xl border-t-[16px] border-brand-primary bg-white rounded-[48px]">
      <div className="flex items-center gap-5 mb-12">
        <div className="p-5 bg-brand-primary/10 rounded-3xl text-brand-primary shadow-inner"><TrendingUp size={40} /></div>
        <div>
          <Typography variant="h1" className="font-black italic uppercase leading-none tracking-tighter">Feedback Estruturado</Typography>
          <Typography variant="body" className="font-black opacity-30 uppercase tracking-[6px] text-xs text-brand-secondary">Gargalos e Planos Individuais</Typography>
        </div>
      </div>
      <div className="space-y-10">
        <div>
          <Typography variant="tiny" tone="muted" className="uppercase font-black mb-2 tracking-widest text-brand-primary">Selecione o Vendedor</Typography>
          <Select value={v} onChange={e => setV(e.target.value)} className="h-16 font-black text-xl border-4 focus:border-brand-primary rounded-[24px] bg-mx-bg-secondary/30 shadow-inner">
            <option value="">Quem está recebendo feedback?</option>
            {sellers.map(s => <option key={s.user_id} value={s.user_id}>{s.users?.name}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <Typography variant="tiny" tone="muted" className="uppercase font-black mb-2">Pontos Positivos</Typography>
            <Textarea value={p} onChange={e => setP(e.target.value)} className="bg-white min-h-[180px] border-2 rounded-[32px] font-bold shadow-sm" placeholder="Cite resultados reais..." />
          </div>
          <div>
            <Typography variant="tiny" tone="muted" className="uppercase font-black mb-2">Acordo de Ação</Typography>
            <Textarea value={a} onChange={e => setA(e.target.value)} className="bg-white min-h-[180px] border-2 rounded-[32px] font-bold shadow-sm" placeholder="O que o vendedor prometeu mudar?" />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-10 items-center pt-10 border-t-4 border-mx-border/30">
          <div className="w-full md:w-1/4 text-center">
            <Typography variant="tiny" tone="muted" className="uppercase font-black mb-1">Meta Acordada</Typography>
            <Input type="number" value={m} onChange={e => setM(parseInt(e.target.value))} className="h-24 font-black text-[64px] text-brand-primary text-center border-4 border-brand-primary rounded-[32px] bg-brand-primary/5 leading-none shadow-xl" />
          </div>
          <Button className="w-full md:flex-1 h-24 text-2xl font-black shadow-2xl active:scale-95 transition-all rounded-[32px] uppercase italic tracking-tighter" onClick={save} loading={s}>SALVAR FEEDBACK NO SISTEMA</Button>
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
    if (!v) return toast.error('Vendedor?')
    setS(true)
    try {
      await createPDI({ seller_id: v, objective: o, store_id: storeId, status: 'aberto' })
      const sn = sellers.find(s => s.user_id === v)?.users?.name || 'Vnd'
      onGenerateSummary(`--- PDI IMPLEMENTADO ---\nVendedor: ${sn}\nObjetivo: ${o}`)
      toast.success('PDI OK!')
      setO('')
    } finally { setS(false) }
  }

  return (
    <Card className="p-12 shadow-mx-xl bg-white rounded-[48px] border-4 border-mx-border relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-secondary/5 rounded-full blur-3xl" />
      <div className="flex items-center gap-5 mb-12">
        <div className="p-5 bg-brand-secondary/10 rounded-3xl text-brand-secondary shadow-inner"><Award size={40} /></div>
        <div>
          <Typography variant="h1" className="font-black italic uppercase leading-none tracking-tighter text-brand-secondary">Sessão PDI Digital</Typography>
          <Typography variant="body" className="font-black opacity-30 uppercase tracking-[6px] text-xs">Desenvolvimento de Carreira e Vida</Typography>
        </div>
      </div>
      <div className="space-y-10">
        <div>
          <Typography variant="tiny" tone="muted" className="uppercase font-black mb-2 tracking-widest text-brand-secondary">Participante da Sessão</Typography>
          <Select value={v} onChange={e => setV(e.target.value)} className="h-16 font-black text-xl border-4 focus:border-brand-secondary rounded-[24px] bg-mx-bg-secondary/30 shadow-inner">
            <option value="">Selecione o vendedor...</option>
            {sellers.map(s => <option key={s.user_id} value={s.user_id}>{s.users?.name}</option>)}
          </Select>
        </div>
        <Textarea label="Objetivo de Vida / Carreira (Dream List)" value={o} onChange={e => setO(e.target.value)} className="min-h-[220px] bg-mx-bg-secondary text-xl font-bold border-4 rounded-[40px] p-8 shadow-inner" placeholder="Qual o grande 'porquê' desse vendedor trabalhar com você? Onde ele quer estar daqui a 6 meses?" />
        <Button className="w-full h-24 font-black bg-brand-secondary text-white text-3xl shadow-2xl rounded-[32px] active:scale-95 transition-all uppercase italic tracking-tighter" onClick={save} loading={s}>SALVAR E ASSINAR PDI</Button>
      </div>
    </Card>
  )
}

export function VisitNineExecution({ financials, onGenerateSummary }: { financials: any[], onGenerateSummary: (t: string) => void }) { 
  const latest = financials[0] || {}; const roi = latest.roi || 0; 
  return (
    <Card className="p-20 bg-mx-indigo-900 text-white shadow-mx-2xl border-t-[32px] border-brand-primary rounded-[80px] text-center relative overflow-hidden">
      <div className="absolute -left-40 -bottom-40 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[120px]" />
      <Typography variant="h1" tone="white" className="font-black uppercase tracking-tighter italic mb-20 text-6xl leading-none">Fechamento<br/>Trimestral</Typography>
      <div className="flex flex-col items-center mb-24 relative">
        <div className="absolute inset-0 bg-brand-primary/10 blur-[150px] rounded-full scale-150" />
        <Typography variant="h1" tone="white" className="text-[220px] font-black italic leading-none drop-shadow-[0_25px_25px_rgba(0,196,159,0.3)] tracking-tighter">{roi}x</Typography>
        <Typography variant="h2" tone="white" className="opacity-40 uppercase font-black tracking-[40px] mt-8 text-2xl">ROI LÍQUIDO</Typography>
        <Badge className="mt-16 px-16 py-6 bg-brand-primary text-white font-black text-2xl shadow-[0_0_50px_rgba(0,196,159,0.5)] animate-pulse border-none rounded-full uppercase italic tracking-widest">ROI Comprovado em Sistema</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
        <Button className="h-28 font-black bg-brand-primary text-3xl shadow-2xl rounded-[40px] hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter" onClick={() => onGenerateSummary(`--- FECHAMENTO TRIMESTRAL ---\nROI COMPROVADO: ${roi}x\nResultado: ESCALA E RENOVAÇÃO`)}>GERAR RELATO FINAL</Button>
        <Button className="h-28 border-8 border-white/10 font-black text-3xl text-white italic flex items-center justify-center gap-6 uppercase rounded-[40px] hover:bg-white/5 transition-all shadow-xl tracking-tighter"><Rocket size={48} /> Pitch de Renovação</Button>
      </div>
    </Card>
  ) 
}

export function VisitFiveExecution({ onGenerateSummary }: { onGenerateSummary: (t: string) => void }) { 
  const [l, setL] = useState(''); const [a, setA] = useState(''); const conv = l && a ? ((parseInt(a)/parseInt(l))*100).toFixed(1) : '0'; 
  const [checks, setCheck] = useState([ { label: 'Instagram: Frequência Diária e Qualidade', done: false }, { label: 'Qualidade das Fotos dos Veículos (Slide 9)', done: false }, { label: 'Investimento em Branding e Tráfego Pago', done: false }, { label: 'Sistema de Distribuição de Leads', done: false } ])
  const toggle = (i:number) => { const n = [...checks]; n[i].done = !n[i].done; setCheck(n) }
  return (
    <Card className="p-12 shadow-mx-2xl bg-white rounded-[48px] border-4 border-mx-border">
      <div className="flex items-center gap-4 mb-12">
        <div className="p-5 bg-brand-primary/10 rounded-3xl text-brand-primary shadow-inner"><Calculator size={40} /></div>
        <Typography variant="h1" className="font-black italic uppercase tracking-tighter leading-none">Motor de Conversão<br/>e Auditoria MKT</Typography>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-6">
            <Input label="Leads Recebidos" type="number" value={l} onChange={e => setL(e.target.value)} className="h-16 text-3xl font-black border-4 bg-mx-bg-secondary/30 shadow-inner" />
            <Input label="Agendamentos" type="number" value={a} onChange={e => setA(e.target.value)} className="h-16 text-3xl font-black border-4 bg-mx-bg-secondary/30 shadow-inner" />
          </div>
          <div className="bg-brand-primary/10 rounded-[80px] h-[350px] flex flex-col items-center justify-center border-4 border-brand-primary/20 shadow-mx-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-primary/5 blur-3xl rounded-full scale-150" />
            <Typography variant="h4" className="font-black text-brand-primary uppercase tracking-[12px] mb-6 text-xs opacity-60">Conversão</Typography>
            <Typography variant="h1" className="font-black text-brand-primary text-[120px] leading-none tracking-tighter drop-shadow-lg">{conv}%</Typography>
          </div>
        </div>
        <div className="space-y-4 p-8 bg-mx-bg-secondary rounded-[48px] border-4 border-mx-border shadow-inner">
          <Typography variant="tiny" tone="muted" className="font-black uppercase mb-6 block tracking-widest text-brand-secondary">Auditoria de Ativos Marketing</Typography>
          {checks.map((it, i) => (<div key={i} onClick={() => toggle(i)} className={cn("p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center gap-5 font-black text-sm", it.done ? "bg-brand-primary text-white border-brand-primary shadow-lg scale-[1.03]" : "bg-white border-mx-border opacity-40 hover:opacity-100")}>{it.done ? <CheckCircle2 size={24} /> : <Circle size={24} />} {it.label.toUpperCase()}</div>))}
        </div>
      </div>
      <Button className="w-full h-24 font-black mt-12 border-4 border-brand-primary text-brand-primary text-3xl shadow-2xl hover:bg-brand-primary hover:text-white transition-all uppercase rounded-[40px] italic tracking-tighter" onClick={() => onGenerateSummary(`--- AUDITORIA MKT ---\nConversão: ${conv}%\nStatus: ${checks.filter(c => c.done).length}/${checks.length} Ativos Aprovados`)}>GERAR RELATO ESTRATÉGICO</Button>
    </Card>
  ) 
}

export function VisitSixExecution({ clientId, onGenerateSummary }: { clientId: string, onGenerateSummary: (t: string) => void }) { 
  return (
    <Card className="p-16 shadow-mx-2xl border-t-[24px] border-brand-secondary bg-white rounded-[60px] relative overflow-hidden">
      <div className="absolute -left-20 -top-20 w-80 h-80 bg-brand-secondary/5 rounded-full blur-3xl" />
      <div className="flex items-center gap-6 mb-12">
        <div className="p-6 bg-brand-secondary/10 rounded-3xl text-brand-secondary shadow-inner"><ShieldCheck size={50} /></div>
        <Typography variant="h1" className="font-black italic uppercase tracking-tighter text-brand-secondary leading-none text-5xl">Processos<br/>Críticos</Typography>
      </div>
      <div className="p-12 bg-amber-50 rounded-[56px] border-4 border-amber-200 mb-16 shadow-inner relative">
        <div className="absolute -top-6 left-12"><Badge className="bg-amber-600 px-8 py-2 text-white font-black border-none shadow-lg">ALERTA VERMELHO</Badge></div>
        <Typography variant="body" className="text-amber-900 font-black text-2xl leading-relaxed italic uppercase">Foco absoluto na Oficina (SLA), Financiamento (Margem) e queima de veículos +90 dias. O Plano Estratégico deve ser atualizado agora.</Typography>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <Button className="h-28 font-black shadow-2xl text-2xl uppercase rounded-[40px] border-4 border-mx-muted text-mx-muted hover:border-brand-primary hover:text-brand-primary transition-all" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=action_plan`, '_blank')}>ABRIR PLANO DE AÇÃO</Button>
        <Button className="h-28 font-black shadow-2xl text-2xl uppercase rounded-[40px] bg-brand-secondary text-white hover:scale-105 active:scale-95 transition-all" onClick={() => onGenerateSummary(`--- AUDITORIA DE PROCESSOS CRÍTICOS ---\nIntervenção realizada em: Oficina, F&I e Estoque +90d.\nPlano de Ação (Slide 12) atualizado no sistema.`)}>REGISTRAR NO CRM</Button>
      </div>
    </Card>
  )
}

export function VisitEightExecution({ clientId }: { clientId: string }) { 
  return (
    <Card className="p-16 shadow-mx-2xl border-4 border-mx-border relative overflow-hidden bg-white rounded-[60px] group hover:border-brand-primary transition-all">
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 rounded-full -mr-40 -mt-40 transition-all group-hover:bg-brand-primary/10" />
      <div className="flex items-center gap-6 mb-12">
        <div className="p-6 bg-brand-primary/10 rounded-3xl text-brand-primary shadow-inner"><BarChart3 size={50} /></div>
        <Typography variant="h1" className="font-black italic uppercase tracking-tighter leading-none text-5xl">Ranking de<br/>Performance</Typography>
      </div>
      <div className="p-10 bg-mx-bg-secondary rounded-[48px] border-2 border-brand-primary/20 mb-16 shadow-inner font-black text-2xl text-brand-secondary italic uppercase leading-relaxed text-center">"Quem não treina, não performa. O método é a única proteção do lucro."</div>
      <Button className="w-full h-32 font-black shadow-2xl border-[12px] border-brand-primary/10 text-brand-primary text-3xl uppercase italic rounded-[48px] hover:bg-brand-primary/5 hover:border-brand-primary/20 transition-all flex items-center justify-center gap-8 shadow-brand-primary/20" variant="outline" onClick={() => window.open(`/consultoria/clientes/${clientId}?tab=daily`, '_blank')}>
        <MousePointer2 size={40} className="animate-bounce" /> VER AUDITORIA REAL
      </Button>
    </Card>
  )
}
