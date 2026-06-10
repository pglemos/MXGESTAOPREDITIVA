import { AlertTriangle, Calendar, ChevronRight, DoorOpen, Gauge, Globe, Lightbulb, Rocket, Target, Trophy, Users, Wallet } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'

export function FunilVendedor() {
  return (
    <main className="h-full w-full overflow-y-auto bg-white p-mx-md md:p-mx-lg no-scrollbar">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-mx-lg pb-20">
        <header className="flex items-center justify-between border-b border-border-subtle pb-mx-md">
          <div className="flex items-center gap-mx-sm">
            <Target size={36} className="text-text-primary" />
            <div>
              <Typography variant="h1" className="text-3xl uppercase leading-tight tracking-normal">Funil de Vendas</Typography>
              <Typography variant="p" tone="muted" className="text-sm">Acompanhe seu desempenho e saiba exatamente o que fazer para bater sua meta.</Typography>
            </div>
          </div>
          <div className="hidden items-center gap-mx-xs text-sm font-black md:flex"><Calendar size={17} /> 22/05/2025 (Quinta-feira)</div>
        </header>

        <section className="grid gap-mx-md xl:grid-cols-[1fr_1.1fr_1.15fr]">
          <GoalSummary />
          <CommissionSummary />
          <PaceSummary />
        </section>

        <section>
          <div className="text-center">
            <Typography variant="h2" className="text-2xl uppercase tracking-normal">O que você precisa fazer para bater sua meta</Typography>
            <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Faltam 4 vendas para você alcançar sua meta este mês.</Typography>
          </div>
          <div className="mt-mx-md grid gap-mx-lg xl:grid-cols-3">
            <ChannelCard tone="blue" icon={<Globe size={36} />} title="Internet" path="Lead → Agendamento → Visita → Venda" need="85" unit="novos leads" status="Atenção" description="É o que falta para gerar 4 vendas neste canal." action="Ver dicas para Internet" />
            <ChannelCard tone="orange" icon={<Users size={36} />} title="Carteira" path="Agendamento → Visita → Venda" need="7" unit="novos agendamentos" status="Atenção" description="É o que falta para gerar 4 vendas neste canal." action="Ver dicas para Carteira" />
            <ChannelCard tone="green" icon={<DoorOpen size={36} />} title="Porta" path="Atendimento → Venda" need="13" unit="atendimentos" status="Possível" description="Com esse volume, você gera 4 vendas." action="Ver dicas para Porta" />
          </div>
        </section>

        <section className="grid gap-mx-lg xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
          <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
            <Typography variant="h2" className="text-xl uppercase tracking-normal">Destaques do mês</Typography>
            <div className="mt-mx-md grid gap-mx-md md:grid-cols-2">
              <Highlight icon={<Trophy size={34} />} label="Seu melhor canal" value="Porta" detail="11,9% conversão" badge="Dentro da média (9% a 14%)" />
              <Highlight icon={<Rocket size={34} />} label="Maior oportunidade" value="Internet" detail="Se melhorar a conversão de lead para agendamento, você pode gerar mais 2 vendas este mês." />
            </div>
          </Card>

          <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
            <div className="flex items-center justify-between">
              <Typography variant="h2" className="text-xl uppercase tracking-normal">Assistente Comercial</Typography>
              <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-black text-brand-primary">Insights para você hoje</span>
            </div>
            <div className="mt-mx-md space-y-mx-sm">
              <Insight tone="blue" text="Você precisa de aproximadamente 7 leads por dia para atingir sua meta pela Internet." />
              <Insight tone="green" text="Seu melhor resultado está vindo do canal Porta. Continue priorizando os atendimentos presenciais." />
              <Insight tone="orange" text="Sua carteira está com poucos agendamentos. Reserve 30 minutos por dia para prospecção e agende mais visitas." />
            </div>
          </Card>
        </section>

        <div className="flex items-center justify-between rounded-mx-md border border-brand-primary/10 bg-brand-primary/5 px-mx-lg py-mx-sm">
          <div className="flex items-center gap-mx-sm">
            <Lightbulb size={22} className="text-brand-primary" />
            <Typography variant="p" className="font-black text-brand-primary">Dica do dia</Typography>
            <Typography variant="p" className="text-sm font-semibold text-text-secondary">Sorria, ouça e faça perguntas. O cliente compra do vendedor em quem confia!</Typography>
          </div>
          <button className="rounded-mx-md border border-border-subtle bg-white px-mx-md py-mx-xs text-sm font-black text-brand-primary">Ver todas as dicas</button>
        </div>
      </div>
    </main>
  )
}

function GoalSummary() {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm"><Target size={26} className="text-brand-primary" /><Typography variant="h2" className="text-xl uppercase tracking-normal">Minha meta</Typography></div>
      <div className="mt-mx-lg grid grid-cols-3 text-center">
        <BigStat label="Meta do mês" value="10" hint="veículos" />
        <BigStat label="Vendidos" value="6" hint="veículos" tone="blue" />
        <BigStat label="Faltam" value="4" hint="veículos" tone="red" />
      </div>
      <Bar value={60} tone="blue" />
      <Typography variant="p" className="mt-mx-sm text-center font-black">60% da meta alcançada</Typography>
    </Card>
  )
}

function CommissionSummary() {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm"><Wallet size={26} className="text-status-success" /><Typography variant="h2" className="text-xl uppercase tracking-normal">Minha comissão</Typography></div>
      <div className="mt-mx-lg grid grid-cols-3 text-center">
        <BigStat label="Projetado" value="R$ 8.450" tone="green" />
        <BigStat label="Meta" value="R$ 12.000" />
        <BigStat label="Faltam" value="R$ 3.550" tone="red" />
      </div>
      <Bar value={70} tone="green" />
      <Typography variant="p" className="mt-mx-sm text-center font-black">70% da meta de comissão</Typography>
    </Card>
  )
}

function PaceSummary() {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm"><Rocket size={26} className="text-brand-primary" /><Typography variant="h2" className="text-xl uppercase tracking-normal">Ritmo atual</Typography></div>
      <div className="mt-mx-lg grid grid-cols-[1fr_160px] items-center gap-mx-md">
        <div className="text-center">
          <Typography variant="p" tone="muted" className="font-black">Você está vendendo</Typography>
          <Typography variant="h1" className="mt-1 text-4xl text-brand-primary">1 carro</Typography>
          <Typography variant="h3" className="text-xl">a cada 3 dias</Typography>
          <span className="mt-mx-md inline-flex rounded-mx-md bg-status-success-surface px-3 py-1 text-sm font-black text-status-success">Melhor que sua média (1 a cada 4 dias)</span>
        </div>
        <div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: 'conic-gradient(var(--color-status-success) 75%, var(--color-status-success-surface) 0)' }}>
          <div className="grid h-24 w-24 place-items-center rounded-full bg-white"><Gauge size={44} /></div>
        </div>
      </div>
    </Card>
  )
}

function ChannelCard({ tone, icon, title, path, need, unit, status, description, action }: { tone: 'blue' | 'orange' | 'green'; icon: React.ReactNode; title: string; path: string; need: string; unit: string; status: string; description: string; action: string }) {
  const toneMap = {
    blue: ['bg-brand-primary/5', 'text-brand-primary', 'bg-brand-primary/10'],
    orange: ['bg-status-warning-surface', 'text-status-warning', 'bg-status-warning/10'],
    green: ['bg-status-success-surface', 'text-status-success', 'bg-status-success/10'],
  }[tone]
  return (
    <Card className={`rounded-mx-lg border border-border-subtle p-mx-lg shadow-mx-sm ${toneMap[0]}`}>
      <div className="flex items-center gap-mx-sm">
        <span className={`grid h-16 w-16 place-items-center rounded-full ${toneMap[2]} ${toneMap[1]}`}>{icon}</span>
        <div><Typography variant="h2" className={`text-2xl uppercase ${toneMap[1]}`}>{title}</Typography><Typography variant="p" className="font-black">{path}</Typography></div>
      </div>
      <div className="mx-auto mt-mx-lg max-w-[270px] rounded-mx-md border border-border-subtle bg-white p-mx-lg text-center">
        <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Você precisa de</Typography>
        <Typography variant="h1" className={`mt-1 text-5xl ${toneMap[1]}`}>{need}</Typography>
        <Typography variant="h3">{unit}</Typography>
        <div className="mt-mx-md border-t border-border-subtle pt-mx-sm">
          <Typography variant="p" className={`inline-flex items-center gap-mx-xs font-black uppercase ${status === 'Possível' ? 'text-status-success' : 'text-status-warning'}`}>
            {status === 'Possível' ? <ChevronRight size={16} /> : <AlertTriangle size={16} />} {status}
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">{description}</Typography>
        </div>
      </div>
      <button className={`mt-mx-md flex w-full items-center justify-center gap-mx-xs rounded-mx-md border border-border-subtle bg-white py-mx-sm text-sm font-black ${toneMap[1]}`}>{action}<ChevronRight size={16} /></button>
    </Card>
  )
}

function BigStat({ label, value, hint, tone = 'dark' }: { label: string; value: string; hint?: string; tone?: 'dark' | 'blue' | 'green' | 'red' }) {
  const color = tone === 'blue' ? 'text-brand-primary' : tone === 'green' ? 'text-status-success' : tone === 'red' ? 'text-status-error' : 'text-text-primary'
  return <div className="border-r border-border-subtle last:border-r-0"><Typography variant="caption" tone="muted" className="font-black normal-case tracking-normal">{label}</Typography><Typography variant="h1" className={`mt-2 text-4xl ${color}`}>{value}</Typography>{hint && <Typography variant="p" className="font-black">{hint}</Typography>}</div>
}

function Bar({ value, tone }: { value: number; tone: 'blue' | 'green' }) {
  return <div className="mt-mx-lg h-3 rounded-full bg-surface-alt"><div className={`h-3 rounded-full ${tone === 'blue' ? 'bg-brand-primary' : 'bg-status-success'}`} style={{ width: `${value}%` }} /></div>
}

function Highlight({ icon, label, value, detail, badge }: { icon: React.ReactNode; label: string; value: string; detail: string; badge?: string }) {
  return <div className="rounded-mx-lg bg-surface-alt p-mx-lg"><span className="mb-mx-md grid h-16 w-16 place-items-center rounded-full bg-status-success-surface text-status-success">{icon}</span><Typography variant="tiny" className="font-black uppercase text-status-success">{label}</Typography><Typography variant="h2" className="mt-1 text-3xl">{value}</Typography><Typography variant="p" className="mt-mx-xs text-sm font-semibold text-text-secondary">{detail}</Typography>{badge && <span className="mt-mx-md inline-flex rounded-mx-md bg-status-success-surface px-3 py-1 text-xs font-black text-status-success">{badge}</span>}</div>
}

function Insight({ text, tone }: { text: string; tone: 'blue' | 'green' | 'orange' }) {
  const cls = tone === 'blue' ? 'text-brand-primary bg-brand-primary/10' : tone === 'green' ? 'text-status-success bg-status-success-surface' : 'text-status-warning bg-status-warning-surface'
  return <div className="flex items-center justify-between rounded-mx-md border border-border-subtle p-mx-sm"><div className="flex items-center gap-mx-sm"><span className={`grid h-9 w-9 place-items-center rounded-full ${cls}`}><Lightbulb size={18} /></span><Typography variant="p" className="font-semibold">{text}</Typography></div><ChevronRight size={18} className="text-text-tertiary" /></div>
}

export default FunilVendedor
