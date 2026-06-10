import { Award, CalendarDays, CheckCircle2, DollarSign, Home, ListChecks, MessageSquare, PlayCircle, Plus, Shield, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/atoms/Avatar'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { useAuth } from '@/hooks/useAuth'

export function VendedorHome() {
  const { profile } = useAuth()
  const firstName = profile?.name?.split(' ')[0] || 'João'

  return (
    <main className="h-full w-full overflow-y-auto bg-white p-mx-md md:p-mx-lg no-scrollbar">
      <div className="mx-auto grid max-w-[1680px] gap-mx-lg pb-20 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-mx-lg">
          <header className="flex items-center justify-between border-b border-border-subtle pb-mx-md">
            <div>
              <Typography variant="h1" className="text-4xl leading-tight">Bom dia, {firstName}! 👋</Typography>
              <Typography variant="p" tone="muted" className="mt-1">Vamos pra cima! Foque nas atividades de hoje e faça acontecer.</Typography>
            </div>
            <div className="hidden items-center gap-mx-md xl:flex">
              <span className="rounded-mx-md border border-border-subtle px-mx-md py-mx-sm text-sm font-black">23 de Maio, 2025</span>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-status-error-surface text-status-error">8</span>
              <Avatar src={profile?.avatar_url || undefined} fallback={profile?.name || 'JS'} alt={profile?.name || 'João Silva'} className="h-11 w-11 rounded-full" />
              <div><Typography variant="p" className="font-black">{profile?.name || 'João Silva'}</Typography><Typography variant="tiny" tone="muted">Vendedor</Typography></div>
            </div>
          </header>

          <section className="grid gap-mx-md md:grid-cols-2 xl:grid-cols-5">
            <GoalCard />
            <Metric icon={<DollarSign size={22} />} title="Comissão estimada" value="R$ 6.850" detail="valor estimado" footer="Meta da Loja: R$ 68.500 · Realizado: R$ 38.200 (56%)" tone="green" />
            <Metric icon={<CalendarDays size={22} />} title="Agendamentos hoje" value="7" detail="agendamentos" footer="Meta diária: 8 · 88%" tone="blue" />
            <Activities />
            <Score />
          </section>

          <section className="grid gap-mx-lg xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.8fr)_minmax(360px,.95fr)]">
            <Agenda />
            <CloseDay />
            <Ranking profileName={profile?.name || 'João Silva'} avatar={profile?.avatar_url || undefined} />
          </section>

          <section className="grid gap-mx-lg md:grid-cols-2 xl:grid-cols-4">
            <Evolution />
            <Achievements />
            <Trainings />
            <Feedback profileName={profile?.name || 'João Silva'} />
          </section>
        </div>

        <PhonePreview />
      </div>
    </main>
  )
}

function GoalCard() {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm"><Target size={22} className="text-brand-primary" /><Typography variant="h3" className="text-sm uppercase tracking-normal">Minha meta (mês)</Typography></div>
      <div className="mt-mx-md grid grid-cols-[1fr_1fr_auto] items-center gap-mx-sm">
        <Mini label="Meta" value="8" hint="vendas" />
        <Mini label="Realizado" value="5" hint="vendas" />
        <Circle value={63} />
      </div>
      <div className="mt-mx-md h-2 rounded-full bg-surface-alt"><div className="h-2 w-[63%] rounded-full bg-brand-primary" /></div>
      <Typography variant="p" className="mt-mx-md text-sm font-black text-text-primary">Faltam 3 vendas para bater a meta!</Typography>
    </Card>
  )
}

function Metric({ icon, title, value, detail, footer, tone }: { icon: React.ReactNode; title: string; value: string; detail: string; footer: string; tone: 'green' | 'blue' }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm">
        <span className={tone === 'green' ? 'text-status-success' : 'text-brand-primary'}>{icon}</span>
        <Typography variant="h3" className="text-sm uppercase tracking-normal">{title}</Typography>
      </div>
      <Typography variant="h1" className="mt-mx-md text-4xl">{value}</Typography>
      <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{detail}</Typography>
      <Typography variant="caption" className="mt-mx-md block font-black normal-case tracking-normal text-text-secondary">{footer}</Typography>
    </Card>
  )
}

export function EstimatedSalaryCard({ estimativa }: { estimativa: { disponivel: boolean; total: number; base: number; comissao: number; bonus: number; atingimentoPercentual: number } }) {
  return (
    <Link
      to="/minha-remuneracao"
      aria-label="Salário Estimado - ver cálculo detalhado"
      className="block rounded-mx-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20"
    >
      <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm transition-all hover:shadow-mx-md">
        <div className="flex items-center gap-mx-sm">
          <DollarSign size={22} className={estimativa.disponivel ? 'text-status-success' : 'text-status-warning'} />
          <Typography variant="h3" className="text-sm uppercase tracking-normal">Salário Estimado</Typography>
        </div>
        <Typography variant="h1" className="mt-mx-md text-4xl">
          {estimativa.disponivel ? estimativa.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Pendente'}
        </Typography>
        <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
          {estimativa.disponivel ? `${estimativa.atingimentoPercentual}% de atingimento projetado` : 'plano de remuneração não cadastrado'}
        </Typography>
      </Card>
    </Link>
  )
}

function Activities() {
  const rows = [['Negociações', '3'], ['Agendamentos', '2'], ['Retornos', '5'], ['Entregas', '1']]
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm"><ListChecks size={22} className="text-brand-primary" /><Typography variant="h3" className="text-sm uppercase tracking-normal">Atividades hoje</Typography></div>
      <div className="mt-mx-md space-y-mx-xs">
        {rows.map(([label, value]) => <div key={label} className="flex justify-between text-sm font-black"><span className="text-text-secondary">{label}</span><span>{value}</span></div>)}
      </div>
      <div className="mt-mx-md border-t border-border-subtle pt-mx-sm text-sm font-black">Total de atividades <span className="float-right">11</span></div>
    </Card>
  )
}

function Score() {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm"><Award size={22} className="text-brand-primary" /><Typography variant="h3" className="text-sm uppercase tracking-normal">Meu Score MX</Typography></div>
      <div className="mt-mx-md flex items-center gap-mx-md">
        <span className="grid h-20 w-20 place-items-center rounded-mx-xl bg-brand-primary text-white"><Shield size={40} /></span>
        <div><Typography variant="caption" tone="muted">Nível Atual</Typography><Typography variant="h3">Prata MX</Typography><Typography variant="caption" className="font-black text-brand-primary">720 /1000 pts</Typography></div>
      </div>
      <div className="mt-mx-md h-2 rounded-full bg-surface-alt"><div className="h-2 w-[72%] rounded-full bg-brand-primary" /></div>
      <Typography variant="caption" tone="muted" className="mt-mx-sm block normal-case tracking-normal">Próximo nível: Ouro MX · Faltam 280 pontos</Typography>
    </Card>
  )
}

function Agenda() {
  const rows = [
    ['09:00', 'Reunião com cliente - Onix LT 1.0', 'João Pereira · Negociação', 'Negociação'],
    ['10:30', 'Visita agendada - Tracker Premier', 'Maria Souza · Agendado', 'Agendado'],
    ['14:00', 'Retorno - S10 LTZ', 'Carlos Lima · Retorno', 'Retorno'],
    ['15:30', 'Negociação - Compass Longitude', 'Ana Costa · Negociação', 'Negociação'],
    ['17:00', 'Entrega - Onix Plus LT', 'Fernando Alves · Entrega', 'Entrega'],
  ]
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <PanelTitle title="Minha agenda de hoje" action="Ver agenda completa" />
      <div className="mt-mx-md space-y-mx-xs">
        {rows.map(([time, title, detail, badge]) => (
          <div key={time} className="grid grid-cols-[64px_1fr_auto] items-center gap-mx-sm rounded-mx-md bg-white py-mx-xs">
            <span className="rounded-mx-sm bg-brand-primary/5 px-2 py-1 text-sm font-black text-brand-primary">{time}</span>
            <div className="min-w-0"><Typography variant="p" className="truncate text-sm font-black">{title}</Typography><Typography variant="tiny" tone="muted" className="block truncate normal-case tracking-normal">{detail}</Typography></div>
            <span className="rounded-mx-sm bg-brand-primary/10 px-2 py-1 text-xs font-black text-brand-primary">{badge}</span>
          </div>
        ))}
      </div>
      <button className="mt-mx-md flex h-11 w-full items-center justify-center gap-mx-xs rounded-mx-md bg-brand-primary text-sm font-black text-white"><Plus size={16} /> Nova Atividade</button>
    </Card>
  )
}

function CloseDay() {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <Typography variant="h3" className="text-sm uppercase tracking-normal">Fechar meu dia</Typography>
      <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Registre suas atividades e finalize o dia com foco!</Typography>
      <div className="mt-mx-lg grid grid-cols-[120px_1fr] items-center gap-mx-md">
        <Circle value={70} label="do dia concluído" />
        <div className="space-y-mx-sm">
          <Check label="Atividades realizadas" value="7 de 10" />
          <Check label="Negociações atualizadas" value="2 de 3" />
          <Check label="Próximos passos definidos" value="3 de 3" />
        </div>
      </div>
      <button className="mt-mx-lg h-12 w-full rounded-mx-md bg-brand-primary text-sm font-black text-white">Fechar meu dia</button>
    </Card>
  )
}

function Ranking({ profileName, avatar }: { profileName: string; avatar?: string }) {
  const rows = [[profileName, '8 vendas'], ['Marcos Lima', '6 vendas'], ['Ana Costa', '5 vendas'], ['Carlos Souza', '4 vendas'], ['Pedro Santos', '3 vendas']]
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <PanelTitle title="Ranking da loja" action="Ver ranking completo" />
      <div className="mt-mx-md space-y-mx-sm">
        {rows.map(([name, sales], index) => (
          <div key={name} className="flex items-center justify-between">
            <div className="flex items-center gap-mx-sm"><span className="w-6 text-center font-black text-status-warning">{index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}</span><Avatar src={index === 0 ? avatar : undefined} fallback={name} alt={name} className="h-9 w-9 rounded-full" /><Typography variant="p" className="font-black">{name}</Typography></div>
            <Typography variant="p" className="font-black text-text-secondary">{sales}</Typography>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Evolution() {
  return <SmallPanel title="Minha evolução" action="Ver histórico"><div className="mt-mx-md h-36 rounded-mx-md bg-surface-alt p-mx-md"><svg viewBox="0 0 220 90" className="h-full w-full"><polyline points="0,70 36,45 72,72 108,50 144,25 180,70 216,48" fill="none" stroke="var(--color-brand-primary)" strokeWidth="4" /><g fill="var(--color-brand-primary)">{[0,36,72,108,144,180,216].map((x,i)=><circle key={x} cx={x} cy={[70,45,72,50,25,70,48][i]} r="4" />)}</g></svg></div></SmallPanel>
}

function Achievements() {
  return <SmallPanel title="Minhas conquistas" action="Ver todas">{[['Meta diária de agendamentos', '+50 pts'], ['Fechamento consistente', '+80 pts'], ['Atividades em dia', '+30 pts']].map(([a,b]) => <div key={a} className="mt-mx-sm flex justify-between text-sm"><b>{a}</b><span className="font-black text-status-success">{b}</span></div>)}<div className="mt-mx-md rounded-mx-md bg-brand-primary/5 p-mx-sm text-right text-xl font-black text-brand-primary">450 pts</div></SmallPanel>
}

function Trainings() {
  return <SmallPanel title="Meus treinamentos" action="Ver todos">{['Técnicas de Fechamento', 'Follow-up de Alta Performance'].map((title, index) => <div key={title} className="mt-mx-sm flex gap-mx-sm"><span className="grid h-14 w-20 place-items-center rounded-mx-md bg-surface-alt"><PlayCircle size={24} /></span><div className="flex-1"><Typography variant="p" className="text-sm font-black">{title}</Typography><div className="mt-2 h-2 rounded-full bg-surface-alt"><div className="h-2 rounded-full bg-status-success" style={{ width: `${index === 0 ? 75 : 50}%` }} /></div></div></div>)}</SmallPanel>
}

function Feedback({ profileName }: { profileName: string }) {
  return <SmallPanel title="Último feedback" action="Ver todos"><div className="mt-mx-md rounded-mx-md bg-brand-primary/5 p-mx-md"><Typography variant="p" className="font-black">"{profileName.split(' ')[0]}, excelente evolução na sua agenda e nos retornos! Continue assim!"</Typography><Typography variant="caption" tone="muted" className="mt-mx-md block normal-case tracking-normal">Davi Pereira (Gerente) · 22/05/2025</Typography></div></SmallPanel>
}

function PhonePreview() {
  return (
    <aside className="hidden 2xl:block">
      <div className="sticky top-mx-lg mx-auto w-[320px] rounded-[44px] border-[10px] border-mx-black bg-mx-black p-3 shadow-mx-2xl">
        <div className="rounded-[34px] bg-brand-secondary p-mx-md text-white">
          <div className="flex items-center justify-between"><Typography variant="h2" tone="white">MX</Typography><span>9:41</span></div>
          <Typography variant="h2" tone="white" className="mt-mx-lg">Bom dia, João! 👋</Typography>
          <Typography variant="caption" tone="white" className="opacity-80">Vamos pra cima! Foque nas atividades de hoje.</Typography>
          <div className="mt-mx-md rounded-mx-lg bg-white p-mx-md text-text-primary"><GoalCard /></div>
          <div className="mt-mx-md rounded-mx-lg bg-white p-mx-md text-text-primary"><Agenda /></div>
          <div className="mt-mx-md rounded-mx-lg bg-white p-mx-md text-text-primary"><CloseDay /></div>
          <div className="mt-mx-md grid grid-cols-5 text-center text-xs font-black text-white"><Home size={18} className="mx-auto" /><CalendarDays size={18} className="mx-auto" /><Plus size={28} className="mx-auto rounded-full bg-brand-primary p-1" /><Target size={18} className="mx-auto" /><ListChecks size={18} className="mx-auto" /></div>
        </div>
      </div>
    </aside>
  )
}

function PanelTitle({ title, action }: { title: string; action: string }) {
  return <div className="flex items-center justify-between"><Typography variant="h3" className="text-sm uppercase tracking-normal">{title}</Typography><button className="text-xs font-black text-brand-primary">{action}</button></div>
}

function SmallPanel({ title, action, children }: { title: string; action: string; children: React.ReactNode }) {
  return <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm"><PanelTitle title={title} action={action} />{children}</Card>
}

function Mini({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div><Typography variant="tiny" tone="muted" className="block font-black normal-case tracking-normal">{label}</Typography><Typography variant="h2" className="text-2xl">{value}</Typography><Typography variant="tiny" tone="muted">{hint}</Typography></div>
}

function Circle({ value, label = 'da meta' }: { value: number; label?: string }) {
  return <div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-brand-primary) ${value * 3.6}deg, var(--color-border-subtle) 0deg)` }}><div className="grid h-16 w-16 place-items-center rounded-full bg-white text-center"><span className="text-xl font-black">{value}%</span><span className="-mt-5 text-[10px] font-bold text-text-secondary">{label}</span></div></div>
}

function Check({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-mx-sm text-sm font-black"><span className="flex items-center gap-mx-xs text-text-secondary"><CheckCircle2 size={16} className="text-status-success" /> {label}</span><span>{value}</span></div>
}

export default VendedorHome
